// v.27 KRITIK: yenileyince degisiklik kaybolmamali — sbLoadAll acilista kirli yerel degisikligi EZMEZ, gonderir
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
}});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
setTimeout(async function(){try{
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','save','setCloudDot','plToast','sbSubscribeAll','__sbFreshenFromJsonbin'].forEach(fn=>window[fn]=function(){}); window.plConfirm=function(){return Promise.resolve(false);};");
  w.eval("__sbRole='owner';");
  // MOCK sunucu (STALE: fiyat 5000) + upsert kaydeder
  w.eval("window.__SRV={ members:[{id:'M1',data:{id:'M1',name:'STALE',joinDate:'2026-05-01'}}], member_finance:[{id:'M1',data:{totalPrice:5000,packages:[]}}] }; window.__upserted=[]; "
    +"sbClient = { from:function(tab){ return { "
    +"select:function(){ return { order:function(){ return Promise.resolve({data:(window.__SRV[tab]||[])}); } }; }, "
    +"upsert:function(rows){ window.__upserted=window.__upserted.concat(rows); return Promise.resolve({error:null}); }, "
    +"delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; } }; } };");
  // YEREL (localStorage'dan gelmis gibi): kullanici fiyati 9999 yapmis, henuz GONDERILMEMIS (dirty)
  w.eval("state.members=[{id:'M1',name:'YENI',totalPrice:9999,joinDate:'2026-05-01',monthly:{}}]; state.groups=[]; state.payments=[]; __sbShadow={}; __sbVer={}; localStorage.setItem('pilateria_dirty','1');");

  console.log('[1] sbLoadAll: kirli yerel (9999) sunucudaki eski (5000) ile EZILMEZ, GONDERILIR');
  await w.eval("sbLoadAll()"); await new Promise(r=>setTimeout(r,250));
  t("yerel fiyat KORUNDU (9999, stale 5000 gelmedi)", w.eval("state.members[0].totalPrice")===9999, w.eval("state.members[0].totalPrice"));
  t("uye adi KORUNDU (YENI)", w.eval("state.members[0].name")==='YENI', w.eval("state.members[0].name"));
  t("degisiklik sunucuya GONDERILDI (upsert cagrildi)", w.eval("window.__upserted.length")>0, w.eval("window.__upserted.length"));

  console.log('[2] TEMIZ acilista: sunucu hali alinir (normal)');
  w.eval("localStorage.removeItem('pilateria_dirty'); state.members=[{id:'M1',name:'LOCAL',totalPrice:1}]; __sbShadow={}; __sbVer={}; window.__upserted=[];");
  await w.eval("sbLoadAll()"); await new Promise(r=>setTimeout(r,250));
  t("temiz -> sunucu hali (STALE, 5000)", w.eval("state.members[0].name")==='STALE' && w.eval("state.members[0].totalPrice")===5000, w.eval("state.members[0].name")+'/'+w.eval("state.members[0].totalPrice"));

  console.log('[3] Kod: pagehide/visibility-hidden flush + debounce 500 + sbLoadAll dirty koru');
  t("visibility-hidden pending gonderir", /visibilityState === 'hidden' && typeof isDirty === 'function' && isDirty\(\)\) \{ clearTimeout\(__sbPushTimer\); sbFlushPush\(\)/.test(html));
  t("pagehide pending gonderir", /addEventListener\('pagehide', \(\) => \{ if \(typeof isDirty === 'function' && isDirty\(\)\) \{ clearTimeout\(__sbPushTimer\); sbFlushPush\(\)/.test(html));
  t("ANLIK push (mikrotask, sabit gecikme yok)", /Promise\.resolve\(\)\.then\(\(\) => \{ __sbPushQueued = false; sbFlushPush\(\)/.test(html));
  t("sbLoadAll dirty koru (__wasDirty && __localState)", /if \(__wasDirty && __localState\) \{[\s\S]*?state = __localState;[\s\S]*?await sbDiffPush\(\)/.test(html));

  console.log("\n=== refresh-persist: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},900);
