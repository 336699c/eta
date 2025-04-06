function busimg(co,rt){
	return ((co=="WSB(OD1)"&& /^(H)/.test(rt) ) ? "Wo Shing Sightseeing Bus" : 
		((co=="WKB"&& /^(WT)/.test(rt) ) ? "WKB Sightseeing" : co)
		)
}

function parseNow(now,time){
    return (now>1350&&now<1440&&time<75?(now-1440):now)
}
function findNextBusTime(i,dd) {   
    const time_diff = dd.time;
    const sch = (dd.phtime && !(new Date().getDay() === 0 || new Date().getDay() === 6) ? dd.sch_wk2 : dd.sch2);
    const now = new Date().getHours() * 60 + new Date().getMinutes() + new Date().getSeconds()/60;

    //now = 9;
    //const next_departure = sch.filter(([time, co2]) => time > now).sort()[0];
    //Change the find next departure into find three next departure
    if(!sch)return 0;
    var next_three_departure = sch.filter(([time, co2]) => 
        (time + (time_diff[i]+0)/60) > parseNow(now,time)
        && 
        (time + (time_diff[i]+0)/60) < (parseNow(now,time)+60)
    ).sort((a,b)=>a[0]-b[0]).slice(0,3);
    if (!next_three_departure[0]) return 0;
    
    return next_three_departure.map(g=>[g[0] + (time_diff[i]+0)/60 - parseNow(now,g[0]), //time
            (g[0] > now), //departed
            g[1]
        ]).sort((a,b)=>a[0]-b[0]);

}

/*
setInterval(function (){
    try{
        apply_eta2()
    }catch(error){console.log(error)}
},1000);
*/
//var INPUT = document.location.href.split("?")[1].split("+");
//var RT_data = _rtlist[INPUT[0]][INPUT[1]]["var"][INPUT[2]];

function apply_eta2(){
    RT_data = _rtlist[INPUT[0]][INPUT[1]]["var"][INPUT[2]];
    //console.log(findNextBusTime(1));
    var lastbus = 9e9;
	RT_data.stops.forEach((w,i)=>{
        var time = findNextBusTime(i,RT_data);
        //console.log(time);
        if(time && time[0][0]<lastbus && i>0){
            document.getElementById("bus_"+w).innerHTML = `<div style="position: relative;color:#333;font-size:22px"><div style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -65%);"></div><img src="/eta7/icon/{#0}.png" style="width:30px"></div>`.replacement([time[0][2]?time[0][2]:INPUT[0]]);
        }else{
            document.getElementById("bus_"+w).innerHTML = ""
        }
        if(time){
            lastbus = time[0][0];

		    document.getElementById("eta_"+w).innerHTML = format_eta2(time)
        }else{document.getElementById("eta_"+w).innerHTML = ""}
	})
}

function formatDateToISO(date) {
    const pad = (num) => (num < 10 ? '0' : '') + num;
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const timezoneOffset = -date.getTimezoneOffset();
    const sign = timezoneOffset >= 0 ? '+' : '-';
    const offsetHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
    const offsetMinutes = pad(Math.abs(timezoneOffset) % 60);

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`;
}

function format_eta2(f){
	if(!f)return "";
	var n="";
	f.forEach((w,i)=>{
		n+=`<label class="eta_time_` + (i+1) + `">`+
            (i==0?"<b>":"")+
            eta_All.timeparse(formatDateToISO(new Date(Date.now()+w[0]*60*1000)),TimeDisplay)+
            (i==0?"<b> ":" ")+
            (w[2]?"<small>"+
                w[2]+" </small>":"")+ `<small>` + (w[1]?"未開出":"") +`</small></label><br>`;
	})
	return n
}

function findAllStopRt(stopid){
    var rt=[];
    var TDID = _stoplist[stopid].td[0];
    Object.keys(_rtlist).forEach(co=>{
        Object.keys(_rtlist[co]).forEach(r=>{
            Object.keys(_rtlist[co][r].var).forEach(w=>{
                _rtlist[co][r].var[w].stops.forEach((t,i)=>{
                    if(t==stopid || t==TDID || _stoplist[t].td[0] == stopid || _stoplist[t].td[0] == TDID)rt.push({co:co, rt:r, bound:w, id:i, stop:t})
                })
            })
        })
    });
    return rt;
}

function getAllETAs(stopid){
    var ETA = [];
    findAllStopRt(stopid).forEach(w=>{
        var t = findNextBusTime(w.id, _rtlist[w.co][w.rt]["var"][w.bound]);
        if(t){
            t.forEach((g,i)=>{
                ETA.push({
                    route:w.rt,
                    co:g[2]?g[2]:w.co,
                    dest:_rtlist[w.co][w.rt]["var"][w.bound].dest_tc,
                    dir:w.bound,
                    eta:formatDateToISO(new Date(Date.now()+g[0]*60*1000)),
                    eta_seq:i+1,
                    rmk:g[1]?"未開出":"",
                    seq:w.id+1,
                    stop:w.stop,
                })
            });
        }
    });

    ETA = ETA.filter((v,i,a)=>a.findIndex(t=>(t.route===v.route&&t.co===v.co&&t.dest===v.dest&&t.dir===v.dir&&t.eta===v.eta&&t.eta_seq===v.eta_seq&&t.rmk===v.rmk&&t.seq===v.seq&&t.stop===v.stop))===i);
 
    //for co field equals to "WSF" and "WSB", refer back to _rtlist to check whether their company name is (OD1) or (OD2) or (OD3)
    ETA.forEach(w=>{
        if(["WSF","WSB"].includes(w.co)){
            Object.keys(_rtlist).forEach(co => {
                if (_rtlist[co][w.route]) {
                    if ((w.co == "WSB" && co.startsWith("WSB")) || (w.co == "WSF" &&co.startsWith("WSF"))) {
                        w.co = co
                    }
                }
            });
        }
    })

    return ETA;
}