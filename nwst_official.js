window.setTimeout(function(){document.getElementsByClassName("vpadding")[0].click();},200);
window.setTimeout(function(){document.getElementById("routelist2").children[2].childNodes[1].childNodes[0].click()},500);
window.setTimeout(function(){hidespecialNote();select(0)},900);

function select(x){
document.getElementById("dtsysstoplist1").childNodes[1].childNodes[1].childNodes[x*2].click();

window.setTimeout(function(){
console.log(document.getElementById("vbus_stop_focus").innerText);

document.getElementById("nextbus_listitem").childNodes.forEach(e=>{
console.log(e.childNodes[1].childNodes[0].innerText)
})
},500);

}





