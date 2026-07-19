// v.31 KOK: SW Supabase'i cache'lemez + eksik cekimde state EZILMEZ (geri-sarma kok fix)
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const sw=fs.readFileSync('sw.js','utf-8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
}});
const w=dom.window;
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||60));
setTimeout(async function(){try{
  console.log('[1] SW: yalniz kendi kaynagi cache; Supabase/harici HARIC');
  t("SW cross-origin HARIC (url.origin !== self.location.origin -> return)", /url\.origin !== self\.location\.origin\) return;/.test(sw));
  t("SW eski blanket jsonbin-only cache YOK", !/e\.request\.url\.includes\('jsonbin\.io'\)\) return;\s*\/\/ Network-first/.test(sw));
  t("SW yorumda 'Supabase' ASLA cache aciklamasi", /Supabase/.test(sw) && /ASLA/.test(sw));

  console.log('[2] sbResync: bir tablo CEKILEMEZSE state EZILMEZ (geri-sarma yok)');
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','save','setCloudDot'].forEach(fn=>window[fn]=function(){});");
  w.eval("state.members=[{id:'L1',name:'KEEP',totalPrice:9999,monthly:{}}]; state.groups=[]; state.payments=[]; __sbShadow={}; __sbVer={}; __sbResyncBusy=false; __sbLastResync=0; __sbLastPushAt=0; localStorage.removeItem('pilateria_dirty');");
  w.eval("sbClient={from:function(tab){return {select:function(){return{order:function(){ return (tab==='members') ? Promise.resolve({data:null,error:{message:'net'}}) : Promise.resolve({data:[]}); }};}};}};");
  await w.eval("sbResync('visible')"); await tick(120);
  t("fetch hatasinda state KORUNDU (KEEP/9999)", w.eval("state.members[0] && state.members[0].name==='KEEP' && state.members[0].totalPrice===9999"), w.eval("JSON.stringify(state.members)"));

  console.log('[3] sbResync: TUM tablolar OK ise tazeler (calisma bozulmadi)');
  w.eval("state.members=[{id:'OLD',name:'OLD'}]; __sbShadow={}; __sbVer={}; __sbResyncBusy=false; __sbLastResync=0; __sbLastPushAt=0;");
  w.eval("sbClient={from:function(tab){return {select:function(){return{order:function(){ return (tab==='members') ? Promise.resolve({data:[{id:'SRV',data:{id:'SRV',name:'SUNUCU'}}],error:null}) : Promise.resolve({data:[],error:null}); }};}};}};");
  await w.eval("sbResync('visible')"); await tick(150);
  t("hepsi OK -> sunucu hali alindi (SUNUCU)", w.eval("state.members.some(m=>m.name==='SUNUCU')"), w.eval("JSON.stringify(state.members.map(m=>m.name))"));

  console.log('[4] Kod: sbLoadAll + sbResync abort guard');
  t("sbLoadAll __loadOk abort", /if \(!__loadOk\) \{[\s\S]*?return; \}/.test(html));
  t("sbResync __resyncOk abort", /if \(!__resyncOk\) \{[\s\S]{0,90}?return; \}/.test(html));

  console.log("\n=== sync-nocache: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},700);
