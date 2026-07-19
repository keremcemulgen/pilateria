// v.29 ANLIK SENKRON: her degisiklik mikrotask sonunda HEMEN gonderilir; es-zamanli mutasyonlar tek push; in-flight kuyruk
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
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
const tick=(ms)=>new Promise(r=>setTimeout(r,ms||40));
setTimeout(async function(){try{
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','save','setCloudDot','plToast'].forEach(fn=>window[fn]=function(){});");
  w.eval("window.__upsertCount=0; sbClient={ from:function(t){ return { select:function(){return{order:function(){return Promise.resolve({data:[]});}};}, upsert:function(){window.__upsertCount++;return Promise.resolve({error:null});}, delete:function(){return{in:function(){return Promise.resolve({error:null});}};} }; } };");
  w.eval("window.__flushN=0; sbFlushPush=(function(orig){ return function(){ window.__flushN++; return orig.apply(this,arguments); }; })(sbFlushPush);");
  w.eval("state.members=[{id:'M1',name:'X',totalPrice:1,monthly:{}}]; state.groups=[]; state.payments=[]; __sbShadow={}; __sbVer={}; __sbApplying=false; __sbPushQueued=false; __sbPushInFlight=false; __sbPushAgain=false; localStorage.setItem('pilateria_dirty','1');");

  console.log('[1] ANLIK: 3 es-zamanli schedulePush -> TEK push (coalesce), ~aninda');
  w.eval("sbSchedulePush(); sbSchedulePush(); sbSchedulePush();");
  await tick(50);
  t("3 es-zamanli schedulePush -> 1 flush (topaklama)", w.eval("window.__flushN")===1, w.eval("window.__flushN"));
  t("push gerceklesti (upsert cagrildi)", w.eval("window.__upsertCount")>=1, w.eval("window.__upsertCount"));

  console.log('[2] In-flight kuyruk: suren push sirasinda yeni degisiklik -> bitince tekrar push');
  // upsert'i yavaslat + shadow BOSALT (gercek diff olsun) + degisiklik yap
  w.eval("window.__upsertCount=0; window.__flushN=0; sbClient.from=function(t){ return { select:function(){return{order:function(){return Promise.resolve({data:[]});}};}, upsert:function(){ window.__upsertCount++; return new Promise(function(res){ setTimeout(function(){res({error:null});}, 40); }); }, delete:function(){return{in:function(){return Promise.resolve({error:null});}};} }; };");
  w.eval("__sbShadow={}; __sbVer={}; __sbPushQueued=false; __sbPushInFlight=false; __sbPushAgain=false; state.members[0].totalPrice=100; localStorage.setItem('pilateria_dirty','1');");
  w.eval("sbSchedulePush();"); // ilk push basliyor (yavas upsert 40ms)
  await tick(12); // push in-flight
  w.eval("state.members[0].totalPrice=200; __sbShadow={}; localStorage.setItem('pilateria_dirty','1'); sbSchedulePush();"); // suren push sirasinda yeni degisiklik
  t("suren push sirasinda schedulePush -> __sbPushAgain set", w.eval("__sbPushAgain")===true, 'inFlight='+w.eval('__sbPushInFlight')+' again='+w.eval('__sbPushAgain'));
  await tick(150); // her iki push da bitsin
  t("in-flight sonrasi 2. push yapildi (upsert >=2)", w.eval("window.__upsertCount")>=2, w.eval("window.__upsertCount"));

  console.log('[3] Kod: mikrotask push + in-flight guard + tek kapi (sbFlushPush)');
  t("mikrotask coalesce (Promise.resolve().then + sbFlushPush)", /Promise\.resolve\(\)\.then\(\(\) => \{ __sbPushQueued = false; sbFlushPush\(\)/.test(html));
  t("in-flight guard (__sbPushInFlight)", /if \(__sbPushInFlight\) \{ __sbPushAgain = true; return; \}/.test(html));
  t("sbFlushPush in-flight sonrasi tekrar", /if \(__sbPushAgain\) \{ __sbPushAgain = false; Promise\.resolve\(\)\.then\(sbFlushPush\)/.test(html));
  t("SABIT gecikme YOK (setTimeout(sbDiffPush, 120/500) kaldirildi)", !/setTimeout\(sbDiffPush, (120|500)\)/.test(html));
  t("realtime render coalesce 60ms", /plToast\(.☁️ Güncellendi.\); \}, 60\)/.test(html));

  console.log("\n=== instant-sync: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},700);
