//Credit to HK Bus Crawling@2021, https://github.com/hkbus/hk-bus-crawling

function BusCrawling(){
var data = null;

async function reload(){
if(data)return;
let result = await fetch("https://raw.githubusercontent.com/hkbus/hk-bus-crawling/refs/heads/gh-pages/routeFareList.min.json");
data = await result.json();
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
        k.add(co, g.route, g.bound[co]?g.bound[co]:g.bound, g.dest.zh, g.dest.en, key, g.serviceType)
    });
    k.gen();
    return [k,ROUTES_num];
}

this.data = async function(div){
    await reload();
    return data;
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
return "<br>"+tmpstr+ "<small>"+(tmpstr?",":`[${routing}]`)+` 經: ${stopname}</small>`;
}

this.add = function(co, route, bound, dest_tc, dest_en, href, ss){
    let data = route?{"co":co,"route":route,"dest_tc":dest_tc,"dest_en":dest_en,"href":href,"bound":bound,"serviceType":ss}:co;
    data.re = _T.routeREGEXP(data.route);
    data.id = id++;
    
    
    if(ss==1){
        tmpdict[co+"_"+route+"_"+bound] = href;
    }else{
        data.dest_tc += " "+chkdiff(tmpdict[co+"_"+route+"_"+bound], href, ss)
    }

    if(colist.includes(co))list.push(data);
}

this.gen = function(){
    list = list.sort((a,b)=>{
        const key = ["re","co","bound","serviceType"];
        
        for (var j of key){
            if(j=="bound" && a[j]!=b[j])return (a[j]<b[j]?-1:1);
            if(j=="co" && a[j]!=b[j])return (colist.indexOf(b[j]) < colist.indexOf(a[j]))? -1 : 1;

            if(a[j]!=b[j])return (a[j]<b[j]?1:-1);
        }
    });

    var done = [];
    list.forEach(data=>{
        var id=div.insertRow(0);
        id.setAttribute("id", "route_"+data.id);
                id.innerHTML = 
            `<div class="route-item" onclick="window.location.href='route3.html?${data.href}'">

                <div>
                    <img src="icon/${_T.busIMG(data.co, data.route)}.png" style="width:35px">
                </div>
                <div class="route-number">${data.route}</div>
                <div class="route-info">
                    <div class="destination">${data.dest_tc}</div>
                    <div class="destination-en">${data.dest_en}</div>
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