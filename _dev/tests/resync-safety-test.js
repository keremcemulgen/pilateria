// v.26 KRITIK: sbResync yerel degisiklikleri EZMEMELI (fiyat degistir + pasife al -> ikisi de geri donmesin)
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
const flush=(ms)=>new Promise(r=>setTimeout(r,ms||150));
setTimeout(async function(){try{
  console.log("SUPABASE_MODE:",w.eval("typeof SUPABASE_MODE!=='undefined' && SUPABASE_MODE"));
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','save','setCloudDot','plToast'].forEach(fn=>window[fn]=function(){});");
  // LEXICAL sbClient (bare atama) — stale sunucu + upsert/delete mock
  w.eval("window.__selectCalled=0; window.__pushCalled=0; sbClient = { from:function(tab){ return { "
    +"select:function(){ return { order:function(){ window.__selectCalled++; return Promise.resolve({data:[{id:'M1',data:{id:'M1',name:'STALE',totalPrice:5000}}]}); } }; }, "
    +"upsert:function(){ window.__pushCalled++; return Promise.resolve({error:null}); }, "
    +"delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; } }; } };");
  // YEREL yeni degerler
  w.eval("state.members=[{id:'M1',name:'YENI',totalPrice:9999,monthly:{'2026-07':{enrolled:false}}}]; state.groups=[]; state.payments=[]; __sbShadow={}; __sbVer={};");

  console.log('[1] KIRLI iken sbResync: SADECE gonder (push), state EZILMEZ, sunucudan CEKMEZ');
  w.eval("localStorage.setItem('pilateria_dirty','1'); __sbLastResync=0; __sbLastPushAt=0; __sbResyncBusy=false; window.__selectCalled=0; window.__pushCalled=0;");
  await w.eval("sbResync('visible')"); await flush(200);
  t("push cagrildi (yerel gonderildi)", w.eval("window.__pushCalled")>=1, w.eval("window.__pushCalled"));
  t("sunucudan CEKILMEDI (select 0)", w.eval("window.__selectCalled")===0, w.eval("window.__selectCalled"));
  t("yerel fiyat KORUNDU (9999, stale 5000 gelmedi)", w.eval("state.members[0].totalPrice")===9999, w.eval("state.members[0].totalPrice"));
  t("yerel pasif KORUNDU (enrolled:false)", w.eval("state.members[0].monthly['2026-07'].enrolled")===false);

  console.log('[2] TEMIZ + yakin push: sbResync CEKMEZ (replica gecikmesi korumasi)');
  w.eval("localStorage.removeItem('pilateria_dirty'); __sbLastResync=0; __sbResyncBusy=false; __sbLastPushAt=Date.now(); window.__selectCalled=0;");
  await w.eval("sbResync('visible')"); await flush(200);
  t("yakin push -> select 0", w.eval("window.__selectCalled")===0, w.eval("window.__selectCalled"));
  t("yerel fiyat hala 9999", w.eval("state.members[0].totalPrice")===9999, w.eval("state.members[0].totalPrice"));

  console.log('[3] TEMIZ + eski push: sbResync sunucudan tazeler (multi-cihaz catch-up korunur)');
  w.eval("localStorage.removeItem('pilateria_dirty'); __sbLastResync=0; __sbResyncBusy=false; __sbLastPushAt=0; window.__selectCalled=0;");
  await w.eval("sbResync('visible')"); await flush(300);
  t("temiz+eski push -> select cagrildi", w.eval("window.__selectCalled")>0, w.eval("window.__selectCalled"));

  console.log('[4] Kod: focus tetikleyici kaldirildi + realtime rebuild pending gonderir');
  t("sbResync focus dinleyicisi YOK", !/addEventListener\('focus', \(\) => sbResync/.test(html));
  t("sbResync dirty -> push+return", /isDirty\(\)\) \{[\s\S]{0,90}?await sbFlushPush\(\); \} catch\(e\)\{\} return; \}/.test(html));
  t("recently-pushed guard", /__sbLastPushAt && \(Date\.now\(\) - __sbLastPushAt\) < 6000\) \{[\s\S]{0,90}?return; \}/.test(html));
  t("realtime PER-RECORD apply (tum-state rebuild yok)", /try \{ sbApplyOne\(t, __applyId\); save\(\); \}/.test(html));

  console.log("\n=== resync-safety: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},900);
