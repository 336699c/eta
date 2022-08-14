var selection=[0,7];

window.setTimeout(function(){document.getElementsByClassName("vpadding")[selection[0]].click();},7000);
window.setTimeout(function(){document.getElementById("routelist2").children[2].childNodes[1].childNodes[0].click()},8000);
window.setTimeout(function(){hidespecialNote();select()},9000);

function select(){
document.getElementById("dtsysstoplist1").childNodes[1].childNodes[1].childNodes[selection[1]*2].click();

window.setTimeout(function(){
window.AppInventor.setWebViewString(document.getElementById("vbus_stop_focus").innerText+"\n");

document.getElementById("nextbus_listitem").childNodes.forEach(e=>{
window.AppInventor.setWebViewString(e.childNodes[1].childNodes[0].innerText.replace(/\n/g,"  "))
})
},1000);

}
