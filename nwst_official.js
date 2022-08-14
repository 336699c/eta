
window.setTimeout(function(){document.getElementsByClassName("vpadding")[selection[0]].click();},3000);
window.setTimeout(function(){document.getElementById("routelist2").children[2].childNodes[1].childNodes[0].click()},4000);
window.setTimeout(function(){hidespecialNote();select()},5000);

function select(){
document.getElementById("dtsysstoplist1").childNodes[1].childNodes[1].childNodes[selection[1]*2].click();

window.setTimeout(function(){
console.log(document.getElementById("vbus_stop_focus").innerText);

document.getElementById("nextbus_listitem").childNodes.forEach(e=>{
console.log(e.childNodes[1].childNodes[0].innerText)
})
},1000);

}
