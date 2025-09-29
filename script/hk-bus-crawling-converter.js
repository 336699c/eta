//Credit to HK Bus Crawling@2021, https://github.com/hkbus/hk-bus-crawling

function BusCrawling(){
var data = null;

async function reload(){
if(data)return;
let result = await fetch("https://raw.githubusercontent.com/hkbus/hk-bus-crawling/refs/heads/gh-pages/routeFareList.min.json");
data = await result.json();
}

function toSentenceCase(str){
    //check if the string is already sentence case
    if(str == str.toLowerCase().replace(/\b\w/g, function(l) { return l.toUpperCase(); }))
        return str;
    //turn the string to sentence case
    let words = str.split(" ");
    if(words.length == 1) return str;
    return str.toLowerCase().replace(/\b\w/g, function(l) { return l.toUpperCase(); });
}
this.generateRouteList = async function(div){
    var ROUTES_num = [];
    await reload();
    let k = new routeList(div,data);
    console.log(data);
    Object.keys(data.routeList).forEach(key=>{
        g = data.routeList[key];
        if(!ROUTES_num.includes(g.route))ROUTES_num.push(g.route);
        let co = g.co[0];
        if(g.co.length==2 && g.co.includes("kmb") && g.co.includes("ctb"))co = "kmb+ctb";
        k.add(co, g.route, g.bound[co]?g.bound[co]:g.bound, g.dest.zh, toSentenceCase(g.dest.en), key, g.serviceType, g.freq)
    });
    k.gen();
    return [k,ROUTES_num];
}

this.data = async function(div){
    await reload();
    return data;
}

this.getStopData = function(id){
    let n = data.stopList[id];
    return {
        lat: n.location.lat,
        long: n.location.lng,
        name_en: n.name.en,
        name_tc: n.name.zh,
        stop: id
    }
}

this.getSameStop = function(id){
    if(!data.stopMap[id])return [id];
    return data.stopMap[id].filter(g=>g[0]=="ctb"||g[0]=="kmb").map(g=>g[1]).concat([id]);
}

this.getOppositeRoute = function(co,route,bound /* bound of #1 co */){
    if(typeof co == "string")co = co.toLowerCase().split("+");
    return Object.entries(BusCrawlingData.routeList).filter(([key, value])=>
        (value.co.length == co.length && JSON.stringify(value.co) == JSON.stringify(co)) && value.route==route && value.bound[co[0]]!=bound && value.serviceType == "1")
}
}

function routeList(div, BusCrawlingData){
var list = [];
var id = 0;
var tmpdict = {};
const colist = ["kmb+ctb","ctb","kmb","nlb","lrtfeeder"];

function findFreq(freq_raw, time=new Date(), parm){
    if(!freq_raw)return false;

    key = Object.keys(freq_raw).filter(g=>parseInt(g)&Math.pow(2,time.getDay()));
    if(key.length==0){
        //console.log(freq_raw,key,Math.pow(2,time.getDay()),parm);
        return false;
    };

    for(var i=0;i<key.length;i++){
        freq = freq_raw[key[i]];
        if(!freq)return false;

        let nowTime = time.getHours()*100 + time.getMinutes();
        let latestTime = Object.keys(freq).filter(key=>parseInt(key)<=nowTime).sort((a,b)=>b-a)[0];
        //console.log(freq,latestTime,nowTime,freq_raw[latestTime]);
        
        if(latestTime && freq[latestTime]){
            return parseInt(freq[latestTime][0]) > nowTime;
        }
    }
    return false;
}

function chkdiff(orig, newr, routing){
    let data = BusCrawlingData;
    let orig_rtlist,new_rtlist;
    let tmpstr = "";
    try{
    orig_rtlist = Object.values(data.routeList[orig].stops)[0];
    new_rtlist = Object.values(data.routeList[newr].stops)[0];
    }catch(error){return ""}

    //orig not same

    if(orig_rtlist[0]!=new_rtlist[0])tmpstr = `<small>[${routing}] ${data.stopList[new_rtlist[0]].name.zh}開出</small>`;

    let stop=0,stopname="";
    try{
    stop = new_rtlist.filter(g=>!orig_rtlist.includes(g))[tmpstr?1:0];
    stopname = data.stopList[stop].name.zh;
    }catch(error){}
    if(!tmpstr && !stopname)return "";

    return [
        tmpstr+ "<small>"+(tmpstr?",":`[${routing}]`)+` 經: ${stopname}</small>`,
        new_rtlist.filter(g=>!orig_rtlist.includes(g))
    ];
}

this.add = function(co, route, bound, dest_tc, dest_en, href, ss, freq){
    let data = route?{"co":co,"route":route,"dest_tc":dest_tc,"dest_en":dest_en,"href":href,"bound":bound,"serviceType":ss}:co;
    data.re = data.route.replace(/(\d+)/, ((x = "$1")=>{return x.padStart(5, "0")}));
    //data.re = _T.routeREGEXP(data.route);
    data.id = id++;
    
    
    if(ss==1){
        tmpdict[co+"_"+route+"_"+bound] = href;
    }else{
        let s = chkdiff(tmpdict[co+"_"+route+"_"+bound], href, ss);
        data.rmk = s[0];
        data.diffstop = s[1];
    }

    data.rmk = (findFreq(freq,new Date(),co+"_"+route+"_"+bound)?"":"<small>不適用</small> ")+(data.rmk?data.rmk:"");
    if(colist.includes(co))list.push(data);
}

this.gen = function(){
    console.log(list);
    list = list.sort((a,b)=>{
        const key = ["re","co","bound","serviceType",];
        
        for (var j of key){
            if(j=="bound"){
                let ab = Object.values(a[j])[0];
                let bb = Object.values(b[j])[0];
                if(ab!=bb)return (ab>bb?1:-1);
            }
            if(j=="co" && a[j]!=b[j])return (colist.indexOf(b[j]) < colist.indexOf(a[j]))? -1 : 1;
            if(j=="serviceType" && a[j]!=b[j]){
                return (a[j]<b[j]?1:-1);
            }

            if(a[j]!=b[j])return (a[j]<b[j]?1:-1);
        }
    });

    var done = [];
    list.forEach(data=>{
        var id=div.insertRow(0);

        const language = localStorage.getItem('language') || 'tc';
        const bilingual = localStorage.getItem('bilingual') === 'true';

        id.setAttribute("id", "route_"+data.id);
                id.innerHTML = 
            `<div class="route-item" onclick="window.location.href='route3.html?${data.href}'">

                <div>
                    <img src="icon/${_T.busIMG(data.co, data.route)}.png" style="width:35px">
                </div>
                <div class="route-number">${data.route}</div>
                <div class="route-info">
                    <div class="destination">${data["dest_"+language]}</div>

                    <div class="destination-en">${(bilingual)?data.dest_en+"<br>":""}${data.rmk?data.rmk:""}</div>
                </div>

            </div>
            </div>`;
    })

}

this.filter = function(rt){
    list.forEach(data=>{
    document.getElementById("route_"+data.id).style.display = data.route.startsWith(rt) ? "block" : "none";
    })
}

}