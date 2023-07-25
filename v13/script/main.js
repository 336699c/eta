function httpGet(theUrl, callback, parm)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText,parm);
    }
    xmlHttp.open("GET", theUrl, true); 
    xmlHttp.send(null);
}

String.prototype.replacement = function(r){return this.replace(/\{\#\d\}/g, m => r.shift() || m);}

var eta_All={};
eta_All.timeparse = function(e,mode){
	if (e===null)return e;
	if (mode)return e.substring(11,16);
	var d2 = new Date();
	if (d2.getTime() > new Date(e).getTime()) return "即將抵達 "+(Math.floor((new Date(e).getTime() - d2.getTime() )/1000)+" 秒");
	if(((new Date(e).getTime() - d2.getTime())/1000)<90)return (Math.floor((new Date(e).getTime() - d2.getTime() )/1000)+" 秒").padEnd(5," ");
	if(((new Date(e).getTime() - d2.getTime())/1000)<480)return ((Math.floor((new Date(e).getTime() - d2.getTime() )/60000))+" 分 "+ (Math.floor((new Date(e).getTime() - d2.getTime() )%60000/1000)).toString().padStart(2,"0")+" 秒").padEnd(5," ");
	return (Math.floor((new Date(e).getTime() - d2.getTime() )/60000)+" 分").padEnd(5," ");
}

function Get_Cookie(value,noresult){
var ck = document.cookie.split("; ");
ck = ck.filter(e=>e.split("=")[0]==value);
if(ck.length>0){ck = JSON.parse(ck[0].split("=")[1]);}else{ck = noresult;}
return ck;
}
function Save_Cookie(key,value,path){
document.cookie = key+`=`+JSON.stringify(value)+`; path=`+path+` ; expires=`+new Date(2047,2,28).toUTCString();
}
