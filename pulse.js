const API="https://kxuszpixwfecawdeqkrx.supabase.co/functions/v1/tival-pulse";
const catalog=[
  {name:"loadfx",label:"loadfx",blurb:"Terminal effects, progress bars, and interactive menus"},
  {name:"tivelweb",label:"tivelweb",blurb:"Responsive static websites from Python"},
  {name:"tivalvideo-offline",label:"tivalvideo-offline",blurb:"Offline narrated video with Piper and FFmpeg"},
  {name:"tiveltext",label:"tiveltext",blurb:"ASCII art, Unicode typography, and terminal color"},
  {name:"tivals-easyos",label:"easyos",blurb:"Friendly wrappers for common OS tasks"},
  {name:"tivelop-agent",label:"tivelop-agent",blurb:"Local coding agent on an OpenAI-compatible Llama server"},
  {name:"tivaltube",label:"tivaltube",blurb:"Authorized YouTube downloads via a Python CLI"}
];
const byId=id=>document.getElementById(id);
let data=null,selected=new URLSearchParams(location.search).get("pkg");
if(!catalog.some(p=>p.name===selected))selected=catalog[0].name;
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const number=value=>Number.isFinite(Number(value))?Number(value).toLocaleString("en-US"):"—";
const compact=value=>Number(value)>=1000?(Number(value)/1000).toFixed(1).replace(/\.0$/,"")+"k":number(value);
const date=value=>value&&String(value).slice(0,10)!=="1970-01-01"?new Date(value).toLocaleDateString("en-ZA",{year:"numeric",month:"short",day:"numeric"}):"Unknown date";
const bytes=value=>Number(value)>=1024?Math.round(Number(value)/1024)+" KB":number(value)+" B";
function linePath(points,width=300,height=40){
  const values=(points||[]).map(x=>Math.max(0,Number(x.downloads||0)));
  if(!values.length)return "";
  const max=Math.max(...values,1),dx=width/Math.max(1,values.length-1);
  return values.map((n,i)=>(i?"L":"M")+(i*dx).toFixed(1)+","+(height-3-(n/max)*(height-7)).toFixed(1)).join(" ");
}
function spark(points){return '<svg viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path d="'+linePath(points)+'" fill="none" stroke="#93a795" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>';}
function renderCards(){
  const list=data?.packages?.length?data.packages:catalog;
  const grid=byId("librariesGrid");grid.replaceChildren();
  for(const pkg of list){
    const card=document.createElement("button");card.type="button";card.className="library-card"+(pkg.name===selected?" selected":"");card.setAttribute("aria-pressed",String(pkg.name===selected));
    card.innerHTML='<span class="library-head"><span class="library-name">'+escapeHtml(pkg.label||pkg.name)+'</span><span class="version">'+(pkg.version&&pkg.version!=="—"?"v"+escapeHtml(pkg.version):"—")+'</span></span><p>'+escapeHtml(pkg.blurb||"")+'</p><span class="library-spark">'+spark(pkg.series)+'</span><span class="library-foot"><span>'+compact(pkg.lastMonth)+'</span><span>30-day</span></span>';
    card.addEventListener("click",()=>{selected=pkg.name;const next=new URL(location.href);next.searchParams.set("pkg",selected);history.replaceState(null,"",next);renderCards();renderDetail();});
    grid.append(card);
  }
}
function bars(title,rows,empty){
  if(!Array.isArray(rows)||!rows.length)return '<div class="breakdown"><h3 class="mini-heading">'+title+'</h3><p class="intro">'+empty+'</p></div>';
  const maximum=Math.max(...rows.map(r=>Number(r.downloads)||0),1);
  return '<div class="breakdown"><h3 class="mini-heading">'+title+'</h3>'+rows.slice(0,6).map(row=>'<div class="barrow"><div class="barrow-head"><span>'+escapeHtml(row.label)+'</span><span>'+number(row.downloads)+'</span></div><div class="bartrack"><i style="width:'+Math.min(100,(Number(row.downloads)||0)*100/maximum).toFixed(1)+'%"></i></div></div>').join("")+'</div>';
}
function chart(points){
  if(!points?.length)return '<p class="intro">The daily series is temporarily unavailable.</p>';
  const values=points.map(x=>Number(x.downloads)||0),max=Math.max(...values,1);
  return '<svg viewBox="0 0 800 180" preserveAspectRatio="none" role="img" aria-label="Daily downloads across '+points.length+' days, highest day '+max+' downloads"><path d="M0 177H800" stroke="#3c4038"/><path d="'+linePath(points,800,175)+'" fill="none" stroke="#a2b6a5" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg><div class="library-foot"><span>'+escapeHtml(points[0].date)+'</span><span>'+escapeHtml(points.at(-1).date)+'</span></div>';
}
function renderDetail(){
  const pkg=data?.packages?.find(item=>item.name===selected)||catalog.find(item=>item.name===selected);
  if(!pkg)return;
  const out=byId("packageDetail"),install="pip install "+pkg.name;
  const link=pkg.pypiUrl||"https://pypi.org/project/"+encodeURIComponent(pkg.name)+"/";
  const github=pkg.github?.url||"https://github.com/tivalsdeveloper/"+encodeURIComponent(pkg.name);
  const stats=[["Yesterday",pkg.lastDay],["Last 7 days",pkg.lastWeek],["Last 30 days",pkg.lastMonth],["All time",pkg.allTime]];
  out.innerHTML='<div class="detail-top"><div><span class="mini-heading">Selected library</span><h2>'+escapeHtml(pkg.label||pkg.name)+'</h2><p class="detail-summary">'+escapeHtml(pkg.summary||pkg.blurb)+'</p><div class="badges">'+(pkg.version&&pkg.version!=="—"?'<span class="badge">v'+escapeHtml(pkg.version)+'</span>':"")+(pkg.requiresPython?'<span class="badge">Python '+escapeHtml(pkg.requiresPython)+'</span>':"")+(pkg.license?'<span class="badge">'+escapeHtml(pkg.license)+'</span>':"")+(pkg.releaseCount?'<span class="badge">'+number(pkg.releaseCount)+' releases</span>':"")+'</div></div><div class="detail-actions"><a href="'+escapeHtml(link)+'" target="_blank" rel="noopener">PyPI ↗</a><a href="'+escapeHtml(github)+'" target="_blank" rel="noopener">GitHub ↗</a></div></div><div class="detail-stats">'+stats.map(([label,value])=>'<div class="detail-stat"><span>'+label+'</span><strong>'+number(value)+'</strong></div>').join("")+'</div><div class="install"><button class="copy" type="button" id="copyInstall">'+escapeHtml(install)+' <span aria-hidden="true">▢</span></button><span id="copyStatus">Copy install command</span></div><h3 class="mini-heading">Daily downloads</h3><div class="chart-wrap">'+chart(pkg.series)+'</div><div class="breakdowns">'+bars("Python",pkg.python,"No interpreter data yet.")+bars("Systems",pkg.systems,"No OS data yet.")+bars("Versions",pkg.versions,"No version split yet.")+'</div><h3 class="mini-heading">Releases</h3><ul class="releases">'+(pkg.releases?.length?pkg.releases.map(rel=>'<li><div>'+escapeHtml(rel.version)+(rel.yanked?' <small>Yanked</small>':"")+'<small>'+date(rel.uploadedAt)+'</small></div><span>'+bytes(rel.size)+'</span></li>').join(""):'<li>No release details available.</li>')+'</ul>';
  byId("copyInstall").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(install);byId("copyStatus").textContent="Copied";setTimeout(()=>{const status=byId("copyStatus");if(status)status.textContent="Copy install command"},1500)}catch{byId("copyStatus").textContent="Copy unavailable in this browser"}});
}
function render(){
  const totals=data?.totals;
  byId("totalMonth").textContent=number(totals?.lastMonth);
  byId("totalWeek").textContent=number(totals?.lastWeek);
  byId("totalDay").textContent=number(totals?.lastDay);
  byId("totalAllTime").textContent=totals?"All time: "+compact(totals.allTime):"All-time data loading";
  byId("packageCount").innerHTML=number(data?.packages?.length||catalog.length)+' <span class="activity" aria-hidden="true">⌁</span>';
  byId("portfolioSpark").innerHTML=spark(data?.portfolio);
  renderCards();renderDetail();
}
async function refresh(){
  const button=byId("refresh");button.disabled=true;
  try{
    const response=await fetch(API,{cache:"no-store",signal:AbortSignal.timeout(35000)});
    if(!response.ok)throw new Error("Statistics service unavailable");
    const value=await response.json();
    if(!Array.isArray(value.packages))throw new Error("Invalid statistics");
    data=value;
    const time=new Date(value.fetchedAt);
    byId("updated").textContent="Updated "+(Number.isNaN(time.getTime())?"recently":time.toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"}))+(value.downloadsAsOf?" · downloads through "+date(value.downloadsAsOf):"");
    byId("notice").hidden=value.source!=="partial";
    if(value.source==="partial")byId("notice").textContent="Download series are delayed — showing package metadata until the public warehouse catches up.";
    render();
  }catch{
    byId("notice").hidden=false;
    byId("notice").textContent="Live statistics are temporarily unavailable. Package links remain accessible; use Refresh to try again.";
    byId("updated").textContent="Waiting for live data";
  }finally{button.disabled=false;}
}
byId("refresh").addEventListener("click",refresh);
render();refresh();setInterval(()=>{if(!document.hidden)refresh()},60000);
