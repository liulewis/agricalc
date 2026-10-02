function $(id){return document.getElementById(id);}
function formatNumber(num,decimals=2){if(typeof num==='string'){var s=num.trim();if(s!==''&&isNaN(s))return s;num=s;}if(num===''||num===null||isNaN(num))return '0';return Number(num).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:decimals});}
function showResult(boxId){var box=$(boxId);if(box){box.style.display='';box.classList.add('show');box.scrollIntoView({behavior:'smooth',block:'nearest'});}}
function hideResult(boxId){var box=$(boxId);if(box)box.classList.remove('show');}
function getVal(id,def=0){var el=$(id);if(!el)return def;var val=parseFloat(el.value);return isNaN(val)? def:val;}
function setResult(itemId,value,unit=''){var el=$(itemId);if(el)el.textContent=formatNumber(value)+(unit ? ' ' + unit:'');}
function enableEnterCalculate(inputIds,btnId){inputIds.forEach(function(id){var el=$(id);if(el){el.addEventListener('keypress',function(e){if(e.key==='Enter')$(btnId).click();});}});}
function toggleDarkMode(){var d=document.body.classList.toggle("dark-mode");localStorage.setItem("darkMode",d?"1":"0");return d;}
if(localStorage.getItem("darkMode")==="1"){document.body.classList.add("dark-mode");}
function toggleFavorite(slug){var f=JSON.parse(localStorage.getItem("favorites")||"[]");var i=f.indexOf(slug);if(i>-1){f.splice(i,1);}else{f.push(slug);}localStorage.setItem("favorites",JSON.stringify(f));return i===-1;}
function isFavorite(slug){var f=JSON.parse(localStorage.getItem("favorites")||"[]");return f.indexOf(slug)>-1;}
function saveHistory(slug,inputs,results){var h=JSON.parse(localStorage.getItem("calcHistory")||"[]");h.unshift({slug:slug,inputs:inputs,results:results,date:new Date().toISOString()});if(h.length>20){h=h.slice(0,20);}localStorage.setItem("calcHistory",JSON.stringify(h));}
function shareResult(slug,title,text){if(navigator.share){navigator.share({title:title,text:text,url:window.location.href});}else{navigator.clipboard.writeText(text+" "+window.location.href);alert("Result copied to clipboard!");}}
var currentUnits = localStorage.getItem("units") || "metric";
function showToast(msg){
var existing=document.getElementById("uxToast");
if(existing)existing.remove();
var toast=document.createElement("div");
toast.className="ux-toast";
toast.id="uxToast";
toast.textContent=msg;
document.body.appendChild(toast);
setTimeout(function(){toast.style.opacity="0";toast.style.transition="opacity 0.3s";setTimeout(function(){toast.remove();},300);},2200);
}
function toggleDarkModeUI(){
var isDark=toggleDarkMode();
var btn=document.querySelector(".ux-icon-btn.dark-mode");
if(btn){
btn.classList.toggle("active",isDark);
btn.innerHTML=isDark?'☀️<span class="tooltip">Light mode</span>':'🌙<span class="tooltip">Dark mode</span>';
}
}
function toggleFavoriteUI(){
var slug=getCurrentSlug();
if(!slug)return;
var isFav=toggleFavorite(slug);
var btn=document.querySelector(".ux-icon-btn.favorite");
if(btn){
btn.classList.toggle("favorited",isFav);
btn.innerHTML=isFav?'⭐<span class="tooltip">Remove favorite</span>':'☆<span class="tooltip">Add to favorites</span>';
}
showToast(isFav?"⭐ Added to favorites":"Removed from favorites");
}
function getCurrentSlug(){
var path=window.location.pathname;
var slug=path.split("/").pop().replace(".html","");
return slug&&slug!=="index"?slug:null;
}
function openShareModal(){
closeAllPanels();
var modal=document.createElement("div");
modal.className="ux-modal-overlay";
modal.id="shareModal";
modal.onclick=function(e){if(e.target===modal)closeModal("shareModal");};
var hasResults=document.querySelectorAll("#resultBox .result-item").length>0;
modal.innerHTML='<div class="ux-modal">'+
'<h3>📤 Share & Export</h3>'+
'<button class="ux-modal-btn" onclick="copyShareLink()"><span class="btn-icon">🔗</span><span class="btn-text">Copy link with inputs</span><span class="btn-arrow">→</span></button>'+
(hasResults?'<button class="ux-modal-btn" onclick="exportResults()"><span class="btn-icon">📥</span><span class="btn-text">Export results (.txt)</span><span class="btn-arrow">→</span></button>':'')+
'<button class="ux-modal-btn" onclick="window.print()"><span class="btn-icon">🖨️</span><span class="btn-text">Print / Save as PDF</span><span class="btn-arrow">→</span></button>'+
(navigator.share?'<button class="ux-modal-btn" onclick="nativeShare()"><span class="btn-icon">📱</span><span class="btn-text">Share via device</span><span class="btn-arrow">→</span></button>':'')+
'<button class="ux-modal-cancel" onclick="closeModal(\'shareModal\')">Cancel</button>'+
'</div>';
document.body.appendChild(modal);
}
function closeModal(id){var m=document.getElementById(id);if(m)m.remove();}
function copyShareLink(){
var url=generateShareLink();
if(navigator.clipboard){
navigator.clipboard.writeText(url).then(function(){showToast("🔗 Link copied!");closeModal("shareModal");}).catch(function(){fallbackCopy(url);});
}else{fallbackCopy(url);}
}
function fallbackCopy(text){
var ta=document.createElement("textarea");
ta.value=text;ta.style.position="fixed";ta.style.opacity="0";
document.body.appendChild(ta);ta.select();
try{document.execCommand("copy");showToast("🔗 Link copied!");closeModal("shareModal");}
catch(e){prompt("Copy this link:",text);}
document.body.removeChild(ta);
}
function generateShareLink(){
var params=[];
document.querySelectorAll("input[type=number],select").forEach(function(inp){
if(inp.id&&inp.value!==""){params.push(encodeURIComponent(inp.id)+"="+encodeURIComponent(inp.value));}
});
var url=window.location.origin+window.location.pathname;
if(params.length>0)url+="?"+params.join("&");
return url;
}
function nativeShare(){
var title=document.title;
var url=generateShareLink();
if(navigator.share){navigator.share({title:title,text:"Check out this farm calculator!",url:url}).catch(function(){});}
closeModal("shareModal");
}
function exportResults(){
var slug=getCurrentSlug()||"calculation";
var title=document.title;
var text="=== "+title+" ===\nGenerated: "+new Date().toLocaleString()+"\n\n--- Inputs ---\n";
document.querySelectorAll("input[type=number],select").forEach(function(inp){
var label="";var lblEl=inp.closest(".form-group");
if(lblEl){var l=lblEl.querySelector("label");if(l)label=l.textContent;}
if(!label)label=inp.id;
text+=label+": "+inp.value+"\n";
});
text+="\n--- Results ---\n";
document.querySelectorAll("#resultBox .result-item").forEach(function(item){
var label=item.querySelector(".label");var value=item.querySelector(".value");
if(label&&value)text+=label.textContent+": "+value.textContent+"\n";
});
text+="\n--- Share Link ---\n"+generateShareLink()+"\n\nPowered by https://agricalc.online";
var blob=new Blob([text],{type:"text/plain"});
var a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download=slug+"-calculation.txt";
document.body.appendChild(a);a.click();document.body.removeChild(a);
showToast("📥 Results exported!");
closeModal("shareModal");
}
function toggleHistoryPanel(){
var panel=document.getElementById("historyPanel");
var favPanel=document.getElementById("favoritesPanel");
if(favPanel)favPanel.classList.remove("show");
if(panel){
panel.classList.toggle("show");
if(panel.classList.contains("show"))renderHistory();
}
}
function renderHistory(){
var list=document.getElementById("historyList");
if(!list)return;
var h=JSON.parse(localStorage.getItem("calcHistory")||"[]");
if(h.length===0){list.innerHTML='<div class="ux-panel-empty">No calculations yet. Results are saved automatically.</div>';return;}
var html="";
h.slice(0,15).forEach(function(item){
var date=new Date(item.date);
var dateStr=date.toLocaleDateString()+" "+date.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
var resultStr="";
if(item.results){for(var k in item.results){resultStr+=item.results[k]+" ";}}
html+='<div class="ux-panel-item" onclick="location.href=\'/tools/'+item.slug+'.html\'">'+
'<div><div class="item-title">'+item.slug.replace(/-/g," ")+'</div><div class="item-meta">'+resultStr.substring(0,40)+'</div></div>'+
'<div class="item-meta">'+dateStr+'</div></div>';
});
list.innerHTML=html;
}
function clearHistory(){
localStorage.removeItem("calcHistory");
renderHistory();
showToast("History cleared");
}
function toggleFavoritesPanel(){
var panel=document.getElementById("favoritesPanel");
var histPanel=document.getElementById("historyPanel");
if(histPanel)histPanel.classList.remove("show");
if(panel){
panel.classList.toggle("show");
if(panel.classList.contains("show"))renderFavorites();
}
}
function renderFavorites(){
var list=document.getElementById("favoritesList");
if(!list)return;
var f=JSON.parse(localStorage.getItem("favorites")||"[]");
if(f.length===0){list.innerHTML='<div class="ux-panel-empty">No favorites yet. Click ☆ to save tools.</div>';return;}
var html="";
f.forEach(function(slug){
var name=slug.replace(/-/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();});
html+='<div class="ux-panel-item" onclick="location.href=\'/tools/'+slug+'.html\'">'+
'<div class="item-title">🔧 '+name+'</div>'+
'<div class="item-meta">Open →</div></div>';
});
list.innerHTML=html;
}
function clearFavorites(){
localStorage.removeItem("favorites");
renderFavorites();
var btn=document.querySelector(".ux-icon-btn.favorite");
if(btn){btn.classList.remove("favorited");btn.innerHTML='☆<span class="tooltip">Add to favorites</span>';}
showToast("Favorites cleared");
}
function closeAllPanels(){
document.querySelectorAll(".ux-panel").forEach(function(p){p.classList.remove("show");});
}
var originalShowResult=showResult;
showResult=function(id){
originalShowResult(id);
var slug=getCurrentSlug();
if(!slug)return;
var inputs={};
document.querySelectorAll("input[type=number],select").forEach(function(inp){if(inp.id)inputs[inp.id]=inp.value;});
var results={};
document.querySelectorAll("#resultBox .result-item .value").forEach(function(el,i){results["r"+(i+1)]=el.textContent;});
saveHistory(slug,inputs,results);
};
function fillFromURLParams(){
var params=new URLSearchParams(window.location.search);
var filled=false;
params.forEach(function(value,key){
var el=document.getElementById(key);
if(el&&(el.type==="number"||el.tagName==="SELECT")){el.value=value;filled=true;}
});
if(filled&&typeof calculate==="function"){
setTimeout(function(){try{calculate();}catch(e){}},300);
}
}
function getLangFromPath(path){
if(path.indexOf('/es/')===0||path==='/es'||path==='/es/')return 'es';
if(path.indexOf('/fr/')===0||path==='/fr'||path==='/fr/')return 'fr';
return 'en';
}
function currentLang(){
var l=(document.documentElement.getAttribute('lang')||'').toLowerCase().slice(0,2);
if(l==='es'||l==='fr')return l;
if(l==='en')return 'en';
return getLangFromPath(window.location.pathname);
}
function buildLangUrl(targetLang){
var path=window.location.pathname;
var curLang=getLangFromPath(path);
var rest=path;
if(curLang==='es'){rest=path.replace(/^\/es(\/|$)/,'/');}
else if(curLang==='fr'){rest=path.replace(/^\/fr(\/|$)/,'/');}
if(rest==='')rest='/';
if(targetLang==='en'){return rest;}
if(rest==='/'){return '/'+targetLang+'/';}
return '/'+targetLang+rest;
}
function updateLanguageLinks(){
var path=window.location.pathname;
var curLang=getLangFromPath(path);
document.querySelectorAll('.lang-btn').forEach(function(a){
var label=(a.textContent||'').trim().toUpperCase();
var target=null;
if(label==='EN')target='en';
else if(label==='ES')target='es';
else if(label==='FR')target='fr';
if(target){
a.href=buildLangUrl(target);
if(target===curLang){a.classList.add('active');}else{a.classList.remove('active');}
}
});
document.querySelectorAll('.footer-link').forEach(function(a){
var txt=(a.textContent||'').trim().toLowerCase();
var target=null;
if(txt==='english')target='en';
else if(txt==='español'||txt==='spanish')target='es';
else if(txt==='français'||txt==='french')target='fr';
if(target){a.href=buildLangUrl(target);}
});
}
var COOKIE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" style="flex-shrink:0;margin-top:2px;">'
+'<path d="M12 3.4a8.6 8.6 0 1 0 8.5 10.3 3.5 3.5 0 0 1-4.7-4.5A3.5 3.5 0 0 1 12 3.4Z" stroke="currentColor" stroke-width="1.6"/>'
+'<circle cx="9.2" cy="10" r="1.15" fill="currentColor"/><circle cx="13.4" cy="14.2" r="1.15" fill="currentColor"/>'
+'<circle cx="9.4" cy="15" r="0.95" fill="currentColor"/></svg>';
var COOKIE_I18N = {
"en": {msg:'We use cookies to improve your experience and analyze traffic. By continuing, you agree to our',
       privacy:'Privacy Policy', privacyHref:'/privacy.html',
       decline:'Decline', accept:'Accept All', ok:'Cookies accepted', no:'Cookies declined'},
"es": {msg:'Usamos cookies para mejorar tu experiencia y analizar el tráfico. Si continúas, aceptas nuestra',
       privacy:'Política de privacidad', privacyHref:'/es/privacy.html',
       decline:'Rechazar', accept:'Aceptar todo', ok:'Cookies aceptadas', no:'Cookies rechazadas'},
"fr": {msg:"Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic. En continuant, vous acceptez notre",
       privacy:'Politique de confidentialité', privacyHref:'/fr/privacy.html',
       decline:'Refuser', accept:'Tout accepter', ok:'Cookies acceptés', no:'Cookies refusés'}
};
function initCookieConsent(){
if(localStorage.getItem('cookieConsent'))return;
var cc=COOKIE_I18N[currentLang()]||COOKIE_I18N.en;
var banner=document.createElement('div');
banner.id='cookieConsentBanner';
banner.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#1a2e1a;color:#fff;padding:14px 20px;z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;box-shadow:0 -2px 12px rgba(0,0,0,.2);font-size:14px;';
banner.innerHTML='<span style="flex:1;min-width:200px;display:flex;gap:8px;align-items:flex-start;">'+COOKIE_ICON
+'<span>'+cc.msg+' <a href="'+cc.privacyHref+'" style="color:#90ee90;">'+cc.privacy+'</a>.</span></span>'+
'<div style="display:flex;gap:8px;flex-shrink:0;">'+
'<button id="cookieDecline" style="background:transparent;color:#ccc;border:1px solid #555;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;">'+cc.decline+'</button>'+
'<button id="cookieAccept" style="background:#2d7a3d;color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">'+cc.accept+'</button>'+
'</div>';
document.body.appendChild(banner);
document.getElementById('cookieAccept').onclick=function(){
localStorage.setItem('cookieConsent','accepted');
banner.remove();
showToast(cc.ok);
};
document.getElementById('cookieDecline').onclick=function(){
localStorage.setItem('cookieConsent','declined');
banner.remove();
showToast(cc.no);
};
}
var UNIT_CONVERSIONS = {
"ha": {toImperial: function(v){return v*2.47105;}, label:"acres", decimals:2},
"hectare": {toImperial: function(v){return v*2.47105;}, label:"acres", decimals:2},
"m²": {toImperial: function(v){return v*10.7639;}, label:"sq ft", decimals:1},
"m2": {toImperial: function(v){return v*10.7639;}, label:"sq ft", decimals:1},
"km²": {toImperial: function(v){return v*0.386102;}, label:"sq mi", decimals:3},
"kg": {toImperial: function(v){return v*2.20462;}, label:"lb", decimals:2},
"kg/ha": {toImperial: function(v){return v*0.892179;}, label:"lb/acre", decimals:2},
"kg/head": {toImperial: function(v){return v*2.20462;}, label:"lb/head", decimals:2},
"kg/animal": {toImperial: function(v){return v*2.20462;}, label:"lb/animal", decimals:2},
"kg/day": {toImperial: function(v){return v*2.20462;}, label:"lb/day", decimals:2},
"g": {toImperial: function(v){return v*0.035274;}, label:"oz", decimals:2},
"ton": {toImperial: function(v){return v*1.10231;}, label:"short tons", decimals:2},
"tons": {toImperial: function(v){return v*1.10231;}, label:"short tons", decimals:2},
"ton/ha": {toImperial: function(v){return v*0.44609;}, label:"ton/acre", decimals:3},
"m": {toImperial: function(v){return v*3.28084;}, label:"ft", decimals:2},
"cm": {toImperial: function(v){return v*0.393701;}, label:"in", decimals:2},
"mm": {toImperial: function(v){return v*0.0393701;}, label:"in", decimals:3},
"km": {toImperial: function(v){return v*0.621371;}, label:"mi", decimals:3},
"°C": {toImperial: function(v){return v*9/5+32;}, toMetric: function(v){return (v-32)*5/9;}, label:"°F", decimals:1},
"C": {toImperial: function(v){return v*9/5+32;}, toMetric: function(v){return (v-32)*5/9;}, label:"F", decimals:1},
"L": {toImperial: function(v){return v*0.264172;}, label:"US gal", decimals:2},
"l": {toImperial: function(v){return v*0.264172;}, label:"US gal", decimals:2},
"L/h": {toImperial: function(v){return v*0.264172;}, label:"gal/h", decimals:2},
"L/ha": {toImperial: function(v){return v*1.06907;}, label:"gal/acre", decimals:2},
"m³": {toImperial: function(v){return v*35.3147;}, label:"cu ft", decimals:1},
"m3": {toImperial: function(v){return v*35.3147;}, label:"cu ft", decimals:1},
"m³/h": {toImperial: function(v){return v*35.3147;}, label:"cu ft/h", decimals:1},
"m³/ha": {toImperial: function(v){return v*14.292;}, label:"cu ft/acre", decimals:1},
"plants/ha": {toImperial: function(v){return v*0.404686;}, label:"plants/acre", decimals:0},
"trees/ha": {toImperial: function(v){return v*0.404686;}, label:"trees/acre", decimals:0},
"fish/ha": {toImperial: function(v){return v*0.404686;}, label:"fish/acre", decimals:0},
"animals/ha": {toImperial: function(v){return v*0.404686;}, label:"animals/acre", decimals:0},
"bar": {toImperial: function(v){return v*14.5038;}, label:"psi", decimals:2},
"kWh": {toImperial: function(v){return v;}, label:"kWh", decimals:2},
"kWh/year": {toImperial: function(v){return v;}, label:"kWh/year", decimals:0},
"€": {toImperial: function(v){return v;}, label:"€", decimals:2},
"$": {toImperial: function(v){return v;}, label:"$", decimals:2},
"%": {toImperial: function(v){return v;}, label:"%", decimals:1},
"days": {toImperial: function(v){return v;}, label:"days", decimals:0},
"years": {toImperial: function(v){return v;}, label:"years", decimals:1},
"hours": {toImperial: function(v){return v;}, label:"hours", decimals:1},
"minutes": {toImperial: function(v){return v;}, label:"minutes", decimals:0},
};
function extractValueAndUnit(text){
if(!text)return null;
var match = text.match(/^([\d,]+\.?\d*)\s*(.*)$/);
if(match){
var value = parseFloat(match[1].replace(/,/g,""));
var unit = match[2].trim();
if(!isNaN(value)&&unit){
return {value:value, unit:unit, original:text};
}
}
return null;
}
function findConversion(unit){
if(UNIT_CONVERSIONS[unit])return UNIT_CONVERSIONS[unit];
var cleanUnit = unit.replace(/\(.*?\)/g,"").trim();
if(UNIT_CONVERSIONS[cleanUnit])return UNIT_CONVERSIONS[cleanUnit];
for(var key in UNIT_CONVERSIONS){
if(unit.indexOf(key)>-1||cleanUnit.indexOf(key)>-1){
return UNIT_CONVERSIONS[key];
}
}
return null;
}
function convertValue(value, conv, toImperial){
if(toImperial&&conv.toImperial){
return conv.toImperial(value);
}else if(!toImperial&&conv.toMetric){
return conv.toMetric(value);
}else if(!toImperial&&conv.toImperial){
return value;
}
return value;
}
function formatValue(value, decimals){
if(decimals===0)return Math.round(value).toLocaleString();
return parseFloat(value.toFixed(decimals)).toLocaleString();
}
function convertResults(toImperial){
var resultItems = document.querySelectorAll("#resultBox .result-item");
resultItems.forEach(function(item){
var valueEl = item.querySelector(".value");
if(!valueEl)return;
var text = valueEl.textContent.trim();
var extracted = extractValueAndUnit(text);
if(extracted){
var conv = findConversion(extracted.unit);
if(conv){
var converted = convertValue(extracted.value, conv, toImperial);
var newUnit = toImperial ? conv.label : extracted.unit;
valueEl.textContent = formatValue(converted, conv.decimals) + " " + newUnit;
valueEl.setAttribute("data-original", extracted.original);
}
}
});
}
function convertInputs(toImperial){
var inputs = document.querySelectorAll(".form-group input[type=number]");
inputs.forEach(function(input){
var labelEl = input.closest(".form-group");
if(!labelEl)return;
var label = labelEl.querySelector("label");
if(!label)return;
var labelText = label.textContent;
var unitMatch = labelText.match(/\(([^)]+)\)/) || labelText.match(/\s([a-zA-Z°²³\/]+)$/);
if(!unitMatch)return;
var unit = unitMatch[1] || unitMatch[2];
var conv = findConversion(unit);
if(!conv)return;
var currentValue = parseFloat(input.value);
if(!isNaN(currentValue)&&currentValue!==0){
var converted = convertValue(currentValue, conv, toImperial);
input.value = parseFloat(converted.toFixed(conv.decimals));
}
var newUnit = toImperial ? conv.label : unit;
if(labelText.indexOf("("+unit+")")>-1){
label.textContent = labelText.replace("("+unit+")","("+newUnit+")");
}else{
label.textContent = labelText.replace(unit, newUnit);
}
});
}
function toggleUnits(target){
var toImperial = (target==="imperial");
currentUnits = target;
localStorage.setItem("units", target);
document.querySelectorAll(".unit-toggle button").forEach(function(btn){
btn.classList.toggle("active", btn.getAttribute("data-unit")===target);
});
document.querySelectorAll(".unit-switch button").forEach(function(btn){
btn.classList.toggle("active", btn.getAttribute("data-unit")===target);
});
if(typeof calculate==="function"){
try{
convertInputs(toImperial);
calculate();
setTimeout(function(){convertResults(toImperial);},100);
}catch(e){console.log("Unit conversion error:",e);}
}
}
function initUnitToggle(){
var saved = localStorage.getItem("units")||"metric";
document.querySelectorAll(".unit-toggle button,.unit-switch button").forEach(function(btn){
btn.classList.toggle("active", btn.getAttribute("data-unit")===saved);
});
}
function toggleMobileMenu(){
var menu=document.getElementById("mobileMenu");
var btn=document.querySelector(".mobile-menu-btn");
if(!menu)return;
var isOpen=menu.classList.contains('open');
if(isOpen){
menu.classList.remove('open');
menu.style.display='none';
if(btn){btn.innerHTML='☰';btn.setAttribute('aria-expanded','false');}
document.body.style.overflow='';
}else{
menu.classList.add('open');
menu.style.display='block';
if(btn){btn.innerHTML='✕';btn.setAttribute('aria-expanded','true');}
document.body.style.overflow='hidden';
}
}
(function() {
var header = document.querySelector('.site-header.fixed-header');
if (!header) return;
function handleScroll() {
if (window.scrollY > 10) {header.classList.add('scrolled');} else {header.classList.remove('scrolled');}
}
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();
})();
(function() {
document.addEventListener('click', function(e) {
var menu=document.getElementById('mobileMenu');
var btn=document.querySelector('.mobile-menu-btn');
if(!menu||!menu.classList.contains('open'))return;
if(e.target.classList&&e.target.classList.contains('mobile-link')){
menu.classList.remove('open');menu.style.display='none';
if(btn){btn.innerHTML='☰';btn.setAttribute('aria-expanded','false');}
document.body.style.overflow='';
return;
}
if(!menu.contains(e.target)&&!(btn&&btn.contains(e.target))){
menu.classList.remove('open');menu.style.display='none';
if(btn){btn.innerHTML='☰';btn.setAttribute('aria-expanded','false');}
document.body.style.overflow='';
}
});
document.addEventListener('keydown', function(e) {
if(e.key==='Escape'){
var menu=document.getElementById('mobileMenu');
var btn=document.querySelector('.mobile-menu-btn');
if(menu&&menu.classList.contains('open')){
menu.classList.remove('open');menu.style.display='none';
if(btn){btn.innerHTML='☰';btn.setAttribute('aria-expanded','false');btn.focus();}
document.body.style.overflow='';
}
}
});
var resizeTimer;
window.addEventListener('resize', function() {
clearTimeout(resizeTimer);
resizeTimer=setTimeout(function(){
if(window.innerWidth>900){
var menu=document.getElementById('mobileMenu');
var btn=document.querySelector('.mobile-menu-btn');
if(menu&&menu.classList.contains('open')){
menu.classList.remove('open');menu.style.display='none';
if(btn){btn.innerHTML='☰';btn.setAttribute('aria-expanded','false');}
document.body.style.overflow='';
}
}
},100);
});
})();
function closeShareModal(){closeModal("shareModal");}
function shareViaEmail(){
var subject=encodeURIComponent("Check out this agricultural calculator");
var body=encodeURIComponent("I found this useful tool: "+window.location.href);
window.location.href="mailto:?subject="+subject+"&body="+body;
showToast("📧 Opening email client...");
}
function shareViaWhatsApp(){
var text=encodeURIComponent("Check out this agricultural calculator: "+window.location.href);
window.open("https://wa.me/?text="+text,"_blank");
showToast("💬 Opening WhatsApp...");
}
function copyLink(){
var textArea=document.createElement("textarea");
textArea.value=window.location.href;
document.body.appendChild(textArea);
textArea.select();
try{document.execCommand("copy");showToast("🔗 Link copied to clipboard!");}
catch(e){showToast("❌ Copy failed");}
document.body.removeChild(textArea);
}
function exportAsText(){
var slug=getCurrentSlug()||"calculation";
var text="Agricultural Calculation Results\n========================\n\n";
text+="Tool: "+document.title+"\nDate: "+new Date().toLocaleString()+"\n\n--- Inputs ---\n";
document.querySelectorAll(".form-group input[type=number],.form-group select").forEach(function(inp){
var label="";var lblEl=inp.closest(".form-group");
if(lblEl){var l=lblEl.querySelector("label");if(l)label=l.textContent;}
if(!label)label=inp.id;
text+=label+": "+inp.value+"\n";
});
text+="\n--- Results ---\n";
document.querySelectorAll("#resultBox .result-item").forEach(function(item){
var label=item.querySelector(".label");var value=item.querySelector(".value");
if(label&&value)text+=label.textContent+": "+value.textContent+"\n";
});
text+="\n--- Share Link ---\n"+window.location.href+"\n\nPowered by https://agricalc.online";
var blob=new Blob([text],{type:"text/plain"});
var a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download=slug+"-calculation.txt";
document.body.appendChild(a);a.click();document.body.removeChild(a);
showToast("📥 Results exported!");
closeModal("shareModal");
}
function resetForm(){
var form=document.querySelector("form");
if(form){form.reset();}
else{
document.querySelectorAll(".form-group input[type=number]").forEach(function(inp){inp.value=inp.defaultValue||"";});
}
var resultBox=document.getElementById("resultBox");
if(resultBox){resultBox.classList.remove("show");resultBox.style.display="";}
showToast("🔄 Form reset!");
}
function initAutoUnits(){
if(localStorage.getItem('units')) return;
var lang = navigator.language || navigator.userLanguage || 'en-US';
var imperialLocales = ['en-US','en-GB','en-CA','en-AU','en-NZ'];
var isImperial = imperialLocales.some(function(l){
return lang.toLowerCase().indexOf(l.toLowerCase()) === 0;
});
localStorage.setItem('units', isImperial ? 'imperial' : 'metric');
console.log('[AutoUnits] Detected locale:', lang, '→', isImperial ? 'imperial' : 'metric');
}
function getSlug(){
var m = window.location.pathname.match(/\/([^/]+)\.html$/);
return m ? m[1] : 'unknown';
}
function saveScenario(name){
try {
var slug = getSlug();
var key = 'scenarios_' + slug;
var scenarios = JSON.parse(localStorage.getItem(key) || '[]');
var inputs = {};
document.querySelectorAll('input[type="number"], input[type="text"], select').forEach(function(inp){
inputs[inp.id || inp.name] = inp.value;
});
var results = {};
document.querySelectorAll('#resultBox .result-item, .result-item').forEach(function(item){
var label = item.querySelector('.label');
var value = item.querySelector('.value');
if(label && value) results[label.textContent.trim()] = value.textContent.trim();
});
scenarios.push({
name: name || ('Scenario ' + (scenarios.length + 1)),
date: new Date().toISOString(),
inputs: inputs,
results: results
});
if(scenarios.length > 10) scenarios = scenarios.slice(-10);
localStorage.setItem(key, JSON.stringify(scenarios));
showToast('📋 Scenario "' + (name || 'Saved') + '" saved!');
renderScenariosPanel();
} catch(e) {
console.error('saveScenario error:', e);
showToast('❌ Could not save scenario.');
}
}
function loadScenario(index){
try {
var slug = getSlug();
var key = 'scenarios_' + slug;
var scenarios = JSON.parse(localStorage.getItem(key) || '[]');
if(index < 0 || index >= scenarios.length) return;
var s = scenarios[index];
Object.keys(s.inputs).forEach(function(id){
var inp = document.getElementById(id);
if(inp) inp.value = s.inputs[id];
});
if(typeof calculate === 'function') calculate();
showToast('📂 Loaded: ' + s.name);
} catch(e) {
console.error('loadScenario error:', e);
}
}
function deleteScenario(index){
try {
var slug = getSlug();
var key = 'scenarios_' + slug;
var scenarios = JSON.parse(localStorage.getItem(key) || '[]');
scenarios.splice(index, 1);
localStorage.setItem(key, JSON.stringify(scenarios));
renderScenariosPanel();
showToast('🗑️ Scenario deleted.');
} catch(e) {
console.error('deleteScenario error:', e);
}
}
function renderScenariosPanel(){
var panel = document.getElementById('scenariosPanel');
if(!panel) return;
var slug = getSlug();
var key = 'scenarios_' + slug;
var scenarios = JSON.parse(localStorage.getItem(key) || '[]');
if(scenarios.length === 0) {
panel.innerHTML = '<p style="color:#666;font-size:13px;padding:10px;">No saved scenarios yet.</p>';
return;
}
var html = '<h4 style="color:#2d5a2d;margin-bottom:8px;font-size:14px;">📋 Saved Scenarios (' + scenarios.length + ')</h4>';
scenarios.forEach(function(s, i){
html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #e0e8e0;">';
html += '<span style="font-size:13px;font-weight:600;">' + s.name + '</span>';
html += '<div style="display:flex;gap:6px;">';
html += '<button onclick="loadScenario(' + i + ')" style="padding:4px 10px;font-size:12px;background:#2d5a2d;color:#fff;border:none;border-radius:4px;cursor:pointer;">Load</button>';
html += '<button onclick="deleteScenario(' + i + ')" style="padding:4px 10px;font-size:12px;background:#c0392b;color:#fff;border:none;border-radius:4px;cursor:pointer;">Delete</button>';
html += '</div></div>';
});
panel.innerHTML = html;
}
function initBatchCalc(){
var page = document.querySelector('[data-batch="true"]');
if(!page) return;
var btn = document.createElement('button');
btn.className = 'ux-icon-btn';
btn.innerHTML = '📊 Batch Mode';
btn.style.marginLeft = '8px';
btn.onclick = function(){
var batchArea = document.getElementById('batchArea');
if(batchArea){
batchArea.style.display = batchArea.style.display === 'none' ? 'block' : 'none';
return;
}
batchArea = document.createElement('div');
batchArea.id = 'batchArea';
batchArea.style.cssText = 'margin:16px 0;padding:16px;background:#f8faf8;border-radius:12px;border:1px solid #e0e8e0;';
batchArea.innerHTML =
'<h4 style="color:#2d5a2d;margin-bottom:8px;">📊 Batch Calculation</h4>' +
'<p style="font-size:13px;color:#666;margin-bottom:8px;">Enter one row per line (comma-separated values matching the form fields).</p>' +
'<textarea id="batchInput" style="width:100%;height:120px;padding:10px;border:2px solid #c8dcc8;border-radius:8px;font-family:monospace;font-size:13px;" placeholder="e.g. 100,25,85&#10;120,30,90"></textarea>' +
'<div style="margin-top:8px;display:flex;gap:8px;">' +
'<button onclick="runBatchCalc()" style="padding:8px 16px;background:#2d5a2d;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Run Batch</button>' +
'<button onclick="copyBatchCSV()" style="padding:8px 16px;background:#fff;color:#2d5a2d;border:2px solid #2d5a2d;border-radius:8px;cursor:pointer;font-weight:600;">Copy CSV</button>' +
'</div>' +
'<div id="batchResults" style="margin-top:12px;overflow-x:auto;"></div>';
var form = document.querySelector('form');
if(form) form.parentNode.insertBefore(batchArea, form.nextSibling);
};
var toolbar = document.querySelector('.ux-toolbar');
if(toolbar) toolbar.appendChild(btn);
}
function runBatchCalc(){
var textarea = document.getElementById('batchInput');
if(!textarea) return;
var lines = textarea.value.trim().split('\n').filter(function(l){return l.trim();});
var inputs = Array.prototype.slice.call(document.querySelectorAll('input[type="number"], select'));
var table = '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
table += '<tr style="background:#2d5a2d;color:#fff;"><th style="padding:6px;border:1px solid #ccc;">#</th>';
inputs.forEach(function(inp){
var lbl = inp.previousElementSibling;
table += '<th style="padding:6px;border:1px solid #ccc;">' + (inp.id || 'Field') + '</th>';
});
table += '<th style="padding:6px;border:1px solid #ccc;">Result</th></tr>';
lines.forEach(function(line, idx){
var vals = line.split(',').map(function(v){return v.trim();});
table += '<tr style="background:' + (idx%2===0?'#f8faf8':'#fff') + ';"><td style="padding:6px;border:1px solid #ccc;">' + (idx+1) + '</td>';
vals.forEach(function(v){ table += '<td style="padding:6px;border:1px solid #ccc;">' + v + '</td>'; });
table += '<td style="padding:6px;border:1px solid #ccc;color:#2d5a2d;font-weight:600;">Run calculate()</td></tr>';
});
table += '</table>';
document.getElementById('batchResults').innerHTML = table;
}
function copyBatchCSV(){
var table = document.getElementById('batchResults');
if(!table) return;
var rows = table.querySelectorAll('tr');
var csv = '';
rows.forEach(function(tr){
var cells = tr.querySelectorAll('th, td');
csv += Array.prototype.map.call(cells, function(c){return c.textContent;}).join(',') + '\n';
});
navigator.clipboard.writeText(csv).then(function(){
showToast('📋 CSV copied to clipboard!');
});
}
function initInstantCalc(){
var inputs = document.querySelectorAll('input[type="number"], input[type="text"], select');
var timer = null;
inputs.forEach(function(inp){
inp.addEventListener('input', function(){
if(timer) clearTimeout(timer);
timer = setTimeout(function(){
if(typeof calculate === 'function') calculate();
var rb = document.getElementById('resultBox');
if(rb){rb.style.display='';rb.classList.add('show');}
}, 300);
});
inp.addEventListener('change', function(){
if(typeof calculate === 'function') calculate();
var rb = document.getElementById('resultBox');
if(rb){rb.style.display='';rb.classList.add('show');}
});
});
}
function initInputValidation(){
var inputs = document.querySelectorAll('input[type="number"]');
inputs.forEach(function(inp){
inp.addEventListener('input', function(){
var val = parseFloat(inp.value);
var min = parseFloat(inp.min);
var max = parseFloat(inp.max);
var isValid = true;
var msg = '';
if(inp.value === '') { isValid = true; }
else if(isNaN(val)) { isValid = false; msg = 'Please enter a valid number.'; }
else if(min !== undefined && !isNaN(min) && val < min) { isValid = false; msg = 'Value should be at least ' + min; }
else if(max !== undefined && !isNaN(max) && val > max) { isValid = false; msg = 'Value should not exceed ' + max; }
if(!isValid){
inp.style.borderColor = '#e74c3c';
inp.style.boxShadow = '0 0 0 3px rgba(231,76,60,.1)';
inp.title = msg;
} else {
inp.style.borderColor = '';
inp.style.boxShadow = '';
inp.title = '';
}
});
});
}
function injectSaveScenarioButton(){
var shareModal = document.getElementById('shareModal');
if(!shareModal) return;
var btn = document.createElement('button');
btn.className = 'ux-modal-btn';
btn.innerHTML = '💾 Save Scenario';
btn.style.cssText = 'margin-top:8px;width:100%;padding:10px;background:#2d5a2d;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;';
btn.onclick = function(){
var name = prompt('Enter scenario name:', 'Scenario ' + new Date().toLocaleDateString());
if(name) saveScenario(name);
};
shareModal.appendChild(btn);
}
function initAll(){
initAutoUnits();
if(localStorage.getItem("darkMode")==="1"){
document.body.classList.add("dark-mode");
var dmBtn=document.querySelector(".ux-icon-btn.dark-mode");
if(dmBtn){dmBtn.classList.add("active");dmBtn.innerHTML='☀️<span class="tooltip">Light mode</span>';}
}
var slug=getCurrentSlug();
if(slug&&isFavorite(slug)){
var favBtn=document.querySelector(".ux-icon-btn.favorite");
if(favBtn){favBtn.classList.add("favorited");favBtn.innerHTML='⭐<span class="tooltip">Remove favorite</span>';}
}
initUnitToggle();
updateLanguageLinks();
initCookieConsent();
fillFromURLParams();
initBatchCalc();
initInstantCalc();
initInputValidation();
injectSaveScenarioButton();
renderScenariosPanel();
}
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",initAll);}else{initAll();}