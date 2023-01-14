function Get_Cookie(value,noresult){
var ck = document.cookie.split("; ");
ck = ck.filter(e=>e.split("=")[0]==value);
if(ck.length>0){ck = JSON.parse(ck[0].split("=")[1]);}else{ck = noresult;}
return ck;
}
function Save_Cookie(key,value,path){
document.cookie = key+`=`+JSON.stringify(value)+`; path=`+path+` ; expires=`+new Date(2047,2,28).toUTCString();
}
