//Version: 20250923


/**
 * @namespace _T
 * @description Utility functions for parsing and processing ETA data
 */
function RawETA(rawdata={},parm={}){
    //private
    var co = "" || parm.co;
    var route = "" || parm.route;
    var stop = "" || parm.stop;
    var bound = "" || parm.bound;
    var seq = "" || parm.seq;

    var data = null;
    var StopMapper = {
        CTB_stop: function(){
            data = rawdata.map(g=>({
                co:g.co,
                dest_en:g.dest_en,
                dest_sc:g.dest_sc,
                dest_tc:g.dest_tc,
                dir:g.dir,
                eta:new Date(g.eta.replace("Z","+08:00")),
                raweta:g.eta,
                offset:0,

                eta_timestamp:new Date(g.eta.replace("Z","+08:00")).getTime(),
                eta_seq:g.eta_seq,
                rmk_en:g.rmk_en,
                rmk_sc:g.rmk_sc,
                rmk_tc:g.rmk_tc,
                route:g.route,
                seq:g.seq,
                stop:g.stop,
                tdstop:null,
            })).sort((g1,g2)=>g1.eta_timestamp-g2.eta_timestamp).filter(g=>g.raweta)
        },

        KMB_route: function(){
            data = rawdata.map(g=>({
                co:g.co,
                dest_en:g.dest_en,
                dest_sc:g.dest_sc,
                dest_tc:g.dest_tc,
                dir:g.dir,
                eta:g.eta ? new Date(g.eta.replace("Z","+08:00")) : null,
                raweta:g.eta,
                offset:0,

                eta_timestamp:g.eta ? new Date(g.eta.replace("Z","+08:00")).getTime() : null,
                eta_seq:g.eta_seq,
                rmk_en:g.rmk_en,
                rmk_sc:g.rmk_sc,
                rmk_tc:g.rmk_tc,
                route:g.route,
                seq:g.seq,
                stop:parm.stop,
                tdstop:null,
            }))
        }

    }

    //public
    this.route_bus = 0; //How many bus in this stop?
    this.handleMerge = function(){
        //data = data.filter(g=>g.raweta);
        let stop = data.filter(g=>g.stop);
        if(stop.length==0)return this;
        this.seq = stop[0].seq;
        this.stop = stop[0].stop;
        data = data.sort((g1,g2)=>g1.eta_timestamp-g2.eta_timestamp);
        return this;
    }

    this.formatETA = function(mode){
        if(!StopMapper[mode])return null;
        StopMapper[mode]();
        return this;
    };
    this.toString = function(){return JSON.stringify(data)};
    this.parm = function(){return parm};
    this.data = function(){return data};
    this.setdata = function(d){data=d;return this};
    this.tag = function(){return co+"_"+route+"_"+stop+"_"+bound+"_"+seq};
    this.route = route; this.co = co; this.stop = stop; this.bound = bound; this.seq = seq;
   
    this.formatETAString = function(parm={mode:1, cos:false}){
        if(!data)return "";
        var n="";
        data.forEach((w,i)=>{
            if(isNaN(w.eta))return 1; //nulleta
            n+=`<label class="eta_time_${i+1}">` 
                + (i==0?"<b>":"")
                + _T.timeparse(w.eta,parm)
                + (i==0?"<b> ":" ")
                + (parm.cos?"<small>"+w.co+" </small>":"")
                + w.rmk_tc
                +" </label>";
            
            if(w.offset!=0) n+=(`<label class="offset off_${w.offset/Math.abs(w.offset)}">${((_s)=>{var _P = _s>0 ? "+" : "" ; if(_s>60)_P += Math.floor(_s/60)+"m";_s %=60; return _P+_s})(w.offset/1000)}s</label>`)
            n+= "<br>";
        });
        return n
    }

    this.calcBusPos = function(/*int*/ timestamp){
        if(!data || data.length == 0 || !data[0].eta_timestamp)return timestamp;
        this.route_bus = data.filter(g=>g.eta_timestamp && g.eta_timestamp<timestamp).length;
        return data[0].eta_timestamp;
    }

    this.calcOffset = function(/*RawETA*/ old){
        if(!old)return;
        let oldData = old.data();
        if(data.length < oldData.length){
            //reversely set data offset, ie eg data length = 1; data[1] = oldData[2]; data[0] = oldData[1]; dont use oldData[0]
            for(var i=data.length-1,j=oldData.length-1;i>=0;i--,j--){
                data[i].offset = oldData[j].offset + data[i].eta_timestamp - oldData[j].eta_timestamp;
            }
            return;
        }

        function calcDiff(a,b,offset=0){
            var sum=0,i=0;
            while(a[i] && b[i+offset]){
                sum += Math.abs(a[i]-b[i+offset]);
                i++;
            }
            return sum/i;
        }

        let norm = Array.from({ length: data.length }, (_, h) => [
            calcDiff(data.map(g => g.eta_timestamp), oldData.map(g => g.eta_timestamp),h),
            h
        ]);
        norm.sort((a,b)=>a[0]-b[0]);
        try{norm[0][1]
        }catch(error){console.log(data,old,norm);return;}
        let bus_offset = norm[0][1];

        for(var i=0;i<data.length;i++){
            let index = bus_offset + i;
            if(!oldData[index])break;
            data[i].offset = oldData[index].offset + data[i].eta_timestamp - oldData[index].eta_timestamp;
        }
    }
}

function ETAList(){
    //private
    List = [];
    mergeco_timestamp = -1;
    SplitBound = function(obj){
        var result = [];
        var parsedBound = [];
        obj.map(g=>g.dir).forEach(i=>{
            if (obj.length==0 || parsedBound.includes(i))return;
            result.push(obj.filter(w=>w.dir==i));
            parsedBound.push(i);
            obj = obj.filter(w=>w.dir!=i);
        })
        return result;
    }

    PushETA = function(/*RawETA*/ eta){
        let OrigIndex = List.length>0 ? List.findIndex(g=>g.tag() == eta.tag()) : -1;
        if(OrigIndex>-1){
            eta.calcOffset(List[OrigIndex]);
            List[OrigIndex] = eta;
        }else{
            List.push(eta);
        }
    }
    //public
    this.PushETA = PushETA;
    this.data = function(){return List.map(g=>g.data())}
    this.data2 = function(){return List}

    //Input
    this.CTB_stop = function(route, stop, seq, callback, bound){
        _T.fetch(`https://rt.data.gov.hk/v2/transport/citybus/eta/ctb/${stop}/${route}`,((w)=>{
        SplitBound(w.data).forEach(g=>{
            if(bound && (bound!="OI" && g[0].dir != bound))return;
            PushETA(new RawETA(g,{co:"CTB",route:route,stop:stop,bound:g[0].dir,seq:seq}).formatETA("CTB_stop"))
            });
        if(callback)callback(w.data);
        mergeco_timestamp = -1;
    }));  
    }

    this.KMB_route = function(route, service, rtstop, bound){
        _T.fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-eta/${route}/${service}`,((w)=>{
        let tmp = [], tmpseq = 0, tmpdir = "";
        for (var i in w.data){
            if(tmpseq != w.data[i].seq || tmpdir != w.data[i].dir){
                if(tmp.length>0)
                    PushETA(new RawETA(tmp,{co:"KMB",route:route,bound:tmpdir,seq:tmpseq,stop:((bound==tmpdir||bound=="null")? rtstop[tmpseq-1] : null)}).formatETA("KMB_route"))
                tmp = [];
                tmpseq = w.data[i].seq;
                tmpdir = w.data[i].dir;
            }
            tmp.push(w.data[i]);
        }
        PushETA(new RawETA(tmp,{co:"KMB",route:route,bound:tmpdir,seq:tmpseq,stop:((bound==tmpdir||bound=="null")? rtstop[tmpseq-1] : null)}).formatETA("KMB_route"))
        mergeco_timestamp = -1;
    }));  
    }

    this.lrtfeeder = function(route, language="zh",bound){
        fetch("https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule", {
        "headers": {
            "accept": "*/*",
            "content-type": "application/json",
            "sec-fetch-site": "cross-site"
        },
        "body": JSON.stringify({"language":"zh","routeName":"K58"}),
        "method": "POST",
        "mode": "cors",
        "credentials": "omit"
        });
    }


    //Output
    mergcotmp = {};
    this.byroute = function(co, route, bound){
        let result = List.filter(g=>(co.includes(g.co.toLowerCase())) && g.route==route && g.stop).sort((a,b)=>a.seq-b.seq);
        if(co.length>1){
            if(mergeco_timestamp==-1){

            let tmp = {};
            result.forEach(g=>{
                //console.log(g.data())
                if(g.data().length>0)
                if(!tmp[g.seq])tmp[g.seq]=g.data();
                else {
                    tmp[g.seq] = tmp[g.seq].concat(g.data());
                }
            });
            console.log(tmp);

            result = Object.values(tmp).map(g=>new RawETA().setdata(
                g.filter(g=>g.raweta && (g.dir==bound[g.co.toLowerCase()] || bound[g.co.toLowerCase()]=="OI" || bound[g.co.toLowerCase()] == "IO"))
            ).handleMerge());
            mergcotmp = result; mergeco_timestamp = 1;
            console.log("Merge");
            }else{
                result = mergcotmp;
            }
        }
        var timestamp = -1;
        result.forEach(g=> timestamp=g.calcBusPos(timestamp));
        return result;
    }
}

var _T = {
    /**
     * @function fetch
     * @description Fetch the ETA data from API asynchronously 
     * @param {string} theUrl - The URL of the API endpoint
     * @param {function} callback - The callback function to process the response
     * @param {*} parm - Additional parameter to be passed to the callback function
     */
    fetch: async function (theUrl, callback, parm) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(JSON.parse(xmlHttp.responseText),parm,xmlHttp);
        }
        xmlHttp.open("GET", theUrl, true); 
        xmlHttp.send(null);
    },

    /**
     * @function timeparse
     * @description Parse the ETA time string into a human-readable format
     * @param {string|Date} e - The time string to be parsed
     * @param {object} parm - Object containing parameters for the parsing
     * mode 0 for default, mode 1 for 24-hour time
     * jj for "即將抵達"
     * small for small font
     * @default {mode:0,jj:false,small:false}
     * @return {string} The parsed time string
     */
    timeparse : function(e,parm={}){
        var _S={"m":"分","s":"秒"};
        if(parm.small)_S={"m":"<small>分</small>","s":"<small>秒</small>"};

        if (!(e instanceof Date)) {
            try{
            e = new Date(e.replace("Z","+08:00"))
            }catch(error){return "";}
        }

        let diffSeconds = Math.floor((e - new Date()) / 1000);
        
        if (parm.mode === 1) {
            let result = (e instanceof Date ? e.toTimeString().substring(0,8) : e.toTimeString().slice(0, 5));
            return `${result.substring(0,5)}<small style="padding-left:2px;"><small>${result.substring(6)}</small></small>`;
        }
        if (diffSeconds <= 0) 
            return `${parm.jj?"即將抵達":""} -${Math.abs(diffSeconds)}${_S.s}`;
        if (diffSeconds <= 90) 
            return `${diffSeconds}${_S.s}`;
        if (diffSeconds < 480) {
            let minutes = Math.floor(diffSeconds / 60);
            let seconds = diffSeconds % 60;
            return `${minutes}${_S.m}${seconds}${_S.s}`;
        }
        return `${Math.floor(diffSeconds / 60)}${_S.m}`;
    
    },

    /**
     * @function timeparse2
     * @description Format time duration in seconds to a human-readable string
     * @param {number} sec - The time duration in seconds
     * @return {string} Formatted time string in the format of "Xm Ys" or "Zs" or "即將抵達"
     */
    timeparse2 : function(sec){
        return (sec < 0 ? "-" : "+") + (Math.abs(sec) <= 60 ? Math.abs(sec) + "s" : Math.floor(Math.abs(sec) / 60) + "m" + Math.abs(sec) % 60 + "s");
    },

    /**
     * @function MTR_ETA
     * @description Fetch the ETA data from API asynchronously 
     * @param {string} line - The line code of the MTR line
     * @param {string} sta - The station code of the MTR station
     * @param {function} callback - The callback function to process the response
     */
    MTR_ETA: function(line, sta, callback){
        this.fetchETA(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${sta}`, function(data){
            var s = {
                "parm":line+"+"+sta,
                "ID":++(_T.ETAID),
                "line": line,
                "sta": sta,
                "timestamp":Date.now(),
                "dict":["UP","DOWN"]
            };
            ["UP","DOWN"].forEach(d=>{
                try{
                    s[d] = Object.values(data.data)[0][d];
                    s[d].forEach(g=>g.delta = 0);
                }catch(e){console.log(d,e)}
            });
            _T.pushETA(s);
            if(callback)callback(s,_T.ETAID)
        });
    },

    /**
     * @function busIMG
     * @description Determines the image name based on company and route
     * @param {object} data - The data object containing company and route information
     * @param {string} data.co - The company code (e.g., "CTB", "KMB")
     * @param {string} data.r - The route code
     * @param {string} _ - overrider, where data --> co and _ --> route number
     * @return {string} The image name
     */
    busIMG: function(data,_){
        if(_)data = {"co":data, "r":_}; //override
        try{data.co = data.co.toUpperCase();}catch(error){}
        // Check if the company is "CTB" and the route starts with "A" or "NA"
        if (data.co === "CTB" && /^(A|NA)/.test(data.r)) {
            return "ctb_airport";
        }
        // Check if the company is "KMB" and the route starts with "A" or "NA"
        else if (data.co === "KMB" && /^(A|NA)/.test(data.r)) {
            return "lwb";
        }
        // Default case: return the company code
        return data.co;
    },

    routeREGEXP: function(v) {
    var Q1 = /[A-Z][0-9]+/;
    if (Q1.exec(v))return v;
        
    var YYY = parseInt(v).toString().padStart(4, '0');
    var mmm = /[A-Z]/g;
    var nnn = mmm.exec(v);
    return YYY + (nnn ? nnn[0] : '');
    }
}

