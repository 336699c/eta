//Version: 20250424

/*
header
    {array} ETA     - Array of ETA data objects
    {int} ETAID     - Auto-incrementing ID for each ETA data object

    {fun}getETA     - Get an ETA data object by its ID
    {fun}pushETA    - The new ETA data object
    {fun}fetch   - Fetch the ETA data from API asynchronously
    {fun}filterETA  - Remove the ETA data that is older than 1 minute

    {fun}MTR_ETA    - Fetch the ETA data from API asynchronously

    {fun}timeparse  - Parse the ETA time string into a human-readable format
    {fun}timeparse2 - Format time duration in seconds to a human-readable string

    {fun}Set_Cookie  - Set the cookie by the given name and value
    {fun}Get_Cookie  - Get the cookie by the given name
    {fun}Save_Cookie - Save the cookie by the given name, value and path
    {fun}parseCookie - Parse the cookie by the given name

    {fun}busIMG      - Get the bus image by the given company and route
*/

/**
 * @namespace _T
 * @description Utility functions for parsing and processing ETA data
 */
var _T = {
    /**
     * @property {array} ETA - Array of ETA data objects
     */
    ETA: [],
    /**
     * @property {number} ETAID - Auto-incrementing ID for each ETA data object
     */
    ETAID: 0,

    /**
     * @function getETA
     * @description Get an ETA data object by its ID
     * @param {number} id - The ID of the ETA data object
     * @return {object} The ETA data object
     */
    getETA: function(id){
        return this.ETA.find(w=>w.ID==id);
    },
    /**
     * @function pushETA
     * @description Push a new ETA data object to the array
     * @param {object} data - The new ETA data object
     */
    pushETA: function(data){
        var original = this.ETA.find(w=>w.parm==data.parm);
        if(original){
            this.ETA.splice(this.ETA.indexOf(original),1);

            data.dict.forEach((key, index) => {
                let originalETA = original[key];
                let newETA = data[key];
                let originalIndex = 0;
                let newIndex = 0;

                while (originalIndex < originalETA.length && newIndex < newETA.length) {
                    const originalItem = originalETA[originalIndex];
                    const newItem = newETA[newIndex];
                    const originalTime = new Date(originalItem.time.replace("Z","+08:00"));
                    const originalTime2 = (originalETA[originalIndex+1] ? new Date(originalETA[originalIndex+1].time.replace("Z","+08:00")) : NaN);
                    const newTime = new Date(newItem.time.replace("Z","+08:00"));
                    const timeDifference = Math.abs(newTime - originalTime) / (1000 * 60); // time difference in minutes

                    if (timeDifference > 5 || (originalTime2 && Math.abs(originalTime2 - newTime) < Math.abs(originalTime - newTime))) {
                        originalIndex++;
                        continue;
                    }

                    newItem.delta = originalItem.delta + (newTime - originalTime) / 1000;
                    originalIndex++;
                    newIndex++;
                }
            });
            
        }
        this.ETA.push(data);
    },

    /**
     * @function fetchETA
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
            e = new Date(e.replace("Z","+08:00"))
        }

        let diffSeconds = Math.floor((e - new Date()) / 1000);
        
        if (parm.mode === 1) {
            return e.toTimeString().slice(0, 5);
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
     * @function filter_ETA
     * @description Remove the ETA data that is older than 1 minute
     */
    filter_ETA:function(){
        // Keep only the data that is newer than 1 minute
        this.ETA = this.ETA.filter(w=>w.timestamp>=(Date.now()-60000));
    },

    /**
     * @function MTR_ETA
     * @description Fetch the ETA data from API asynchronously 
     * @param {string} line - The line code of the MTR line
     * @param {string} sta - The station code of the MTR station
     * @param {function} callback - The callback function to process the response
     */
    MTR_ETA: function(line, sta, callback){
        this.fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${sta}`, function(data){
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
     * @function Get_Cookie
     * @description Get the cookie by the given name
     * @param {string} value - The name of the cookie
     * @param {object} noresult - The value returned if the cookie is not found
     * @returns {object} The value of the cookie
     */
    Get_Cookie : function(value,noresult){
        // Split the cookie string into an array
        var ck = document.cookie.split("; ");
        
        // Filter the array to get the cookie with the given name
        ck = ck.filter(e=>e.split("=")[0]==value);
        
        // If the cookie is found, parse it
        if(ck.length>0){
            ck = JSON.parse(ck[0].substring(ck[0].indexOf("=")+1));
        }else{
            // If the cookie is not found, return the default value
            ck = noresult;
        }
        
        // Return the cookie value
        return ck;
    },

    /**
     * @function Set_Cookie
     * @description Set the cookie by the given name and value
     * @param {string} name - The name of the cookie
     * @param {object} value - The value of the cookie 
     */
    Set_Cookie : function(value,key){
        value.map(w=>w.stops = window.btoa(JSON.stringify(w.stops)));
        document.cookie = `{#0}={#1}; path=/eta/v13/ ; expires ='Wed, 27 Mar 2047 16:00:00 GMT'`.replacement([
            key,
            JSON.stringify(value)
        ])
    },

    /**
     * @function Save_Cookie
     * @description Save the cookie by the given name, value and path
     * @param {string} key - The name of the cookie
     * @param {object} value - The value of the cookie
     * @param {string} path - The path of the cookie
     */
    Save_Cookie: function(key,value,path){
        document.cookie = key+`=`+JSON.stringify(value)+`; path=`+path+` ; expires=`+new Date(2047,2,28).toUTCString();
        },
        
    /**
     * @function parseCookie
     * @description Parse the cookie by the given name
     * @param {string} value - The name of the cookie
     * @returns {object} The value of the cookie
     */
    parseCookie: function(value){
            // Get the cookie by the given name
            var cookie = this.Get_Cookie(value,null);
            
            // If the cookie is not found, return an empty array
            if (!cookie)return [];
            
            // Parse the cookie
            cookie.map(w=>w.stops = JSON.parse(window.atob(w.stops)));
            
            // Return the value of the cookie
            return cookie
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
}
