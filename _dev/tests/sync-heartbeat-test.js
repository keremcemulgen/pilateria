// v114 — SAGIR CIHAZ KOK FIX (Kerem: "ortagim telefondan veri giriyor, bende otomatik gozukmuyor")
// Alma yolunun UC kalici sagirlik acigi:
//  (A) KILIT: sbResync kirli bayrak varken KOSULSUZ return ediyordu. Push basarisiz olunca bayrak
//      takili kaliyor -> her resync yalniz push -> cihaz buluttan BIR DAHA HIC veri cekemiyor.
//      Push BASARILI olsa bile tazeleme atlaniyordu (korunacak yerel degisiklik kalmadigi halde).
//  (B) NABIZ YOK: realtime sessizce olurse (JWT suresi, mobil soket askiya alma) ve sekme ACIK
//      kalirsa hicbir tetikleyici yok (visibilitychange/online atesLENMEZ) -> kalici sagir.
//  (C) OLU KANAL: sbSubscribeAll, __sbChannel dolu diye erken donuyordu; olu kanal sonsuza dek olu.
// Ayrica: UI mesgulken realtime render'i DUSUYORDU (tekrar yok) ve sbMigrateLocal upsert hatasinda
// subscribe etmeden donuyordu.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{}; }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const flush=(ms)=>new Promise(r=>setTimeout(r,ms||150));

setTimeout(async ()=>{ try {
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','save','setCloudDot','plToast','__trace'].forEach(fn=>window[fn]=function(){});");

  // Bulutta STALE degil GUNCEL bir kayit: tazeleme OLURSA state'e girer (kanit).
  const mkClient = (pushOk)=> w.eval(
    "window.__selN=0; window.__pushN=0;"+
    "sbClient = window.sbClient = { from:function(tab){ return {"+
    "  select:function(){ return { order:function(){ window.__selN++; return Promise.resolve({ data: tab==='members' ? [{id:'M1',data:{id:'M1',name:'ORTAK-GIRDI',monthly:{}}}] : [], error:null }); } }; },"+
    "  upsert:function(){ window.__pushN++; return Promise.resolve({ error: "+(pushOk?"null":"{message:'RLS red'}")+" }); },"+
    "  delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; } }; },"+
    "  channel:function(){ return { on:function(){return this;}, subscribe:function(){return this;}, state:'joined' }; },"+
    "  removeChannel:function(){ window.__removedCh=(window.__removedCh||0)+1; } };"
  );
  const seedLocal = ()=> w.eval(
    "state.members=[{id:'L1',name:'YEREL-DEGISIK',totalPrice:9999,monthly:{'2026-07':{enrolled:false}}}];"+
  // v117: bu birim testler push MEKANIGINI olcuyor; gercek cihazda push, acilis cekimi
  // (sbLoadAll/sbSnapshotShadow) TEMELI kurduktan SONRA yapilir. __sbBaseReady=true bu
  // gercek onkosulu temsil eder — bayat-ezme kalkani yalniz TEMEL YOKKEN devreye girer.
    "state.groups=[]; state.payments=[]; state.lessons=[]; __sbShadow={}; __sbBaseReady=true; __sbVer={};"+
    "__sbResyncBusy=false; __sbLastResync=0; __sbLastPushAt=0;"
  );

  console.log('[1] KOK FIX A — KILIT KIRILDI: kirli + push BASARILI -> tazeleme YAPILIR (ortagin verisi gelir)');
  seedLocal(); mkClient(true);
  w.eval("localStorage.setItem('pilateria_dirty','1'); window.__sbAfterPushMs=40;");
  await w.eval("sbResync('visible')");
  // Uretimde after-push 7000ms sonra kosar; 6000ms'lik replika penceresi COKTAN gecmis olur.
  // Testte gecikme 40ms'ye indirildigi icin ayni kosulu __sbLastPushAt'i geriye alarak modelliyoruz.
  w.eval("__sbLastPushAt = Date.now() - 60000;");
  await flush(60);
  t('once push edildi (yerel degisiklik korundu)', w.eval('window.__pushN')>=1, w.eval('window.__pushN'));
  t('push sonrasi bayrak TEMIZ', w.eval("localStorage.getItem('pilateria_dirty')")===null, w.eval("localStorage.getItem('pilateria_dirty')"));
  await flush(160);
  t('KILIT KIRILDI: buluttan tazeleme YAPILDI (select>0)', w.eval('window.__selN')>0, w.eval('window.__selN'));
  t('ortagin bulut kaydi cihaza GELDI', (w.eval("state.members.map(m=>m.name).join(',')")||'').indexOf('ORTAK-GIRDI')>=0, w.eval("state.members.map(m=>m.name).join(',')"));

  console.log('[1b] v114c GUVENLIK: after-push sirasinda YENI push olduysa EZME YOK — ama yakalama da KAYBOLMAZ');
  seedLocal(); mkClient(true);
  w.eval("localStorage.setItem('pilateria_dirty','1'); window.__sbAfterPushMs=40;");
  await w.eval("sbResync('visible')");
  // Araya TAZE bir push girdi (kullanici yeni bir degisiklik kaydetti): replika henuz gormemis olabilir.
  w.eval("__sbLastPushAt = Date.now(); window.__selN=0;");
  await flush(200);
  t('taze push varken buluttan CEKILMEDI (revert riski yok)', w.eval('window.__selN')===0, w.eval('window.__selN'));
  t('yerel degisiklik hala YERINDE (9999)', w.eval("state.members[0] && state.members[0].totalPrice")===9999, w.eval("state.members[0] && state.members[0].totalPrice"));
  // Push penceresi kapandi: ertelenen yakalama calismali (kaybolmadi).
  w.eval("__sbLastPushAt = Date.now() - 60000;");
  await flush(200);
  t('pencere kapaninca ertelenen yakalama CALISTI (select>0)', w.eval('window.__selN')>0, w.eval('window.__selN'));
  t('ortagin kaydi sonunda GELDI', (w.eval("state.members.map(m=>m.name).join(',')")||'').indexOf('ORTAK-GIRDI')>=0, w.eval("state.members.map(m=>m.name).join(',')"));

  console.log('[2] GUVENLIK REGRESYONU: kirli + push BASARISIZ -> tazeleme YOK, yerel EZILMEZ');
  seedLocal(); mkClient(false);
  w.eval("localStorage.setItem('pilateria_dirty','1'); window.__sbAfterPushMs=40; window.__sbPushStuck=0;");
  await w.eval("sbResync('visible')"); await flush(220);
  t('push denendi', w.eval('window.__pushN')>=1, w.eval('window.__pushN'));
  t('basarisiz push -> buluttan CEKILMEDI (select 0)', w.eval('window.__selN')===0, w.eval('window.__selN'));
  t('yerel degisiklik KORUNDU (9999)', w.eval("state.members[0] && state.members[0].totalPrice")===9999, w.eval("state.members[0] && state.members[0].totalPrice"));
  t('takilma SAYILDI (sessiz kalmiyor)', w.eval('window.__sbPushStuck||0')>=1, w.eval('window.__sbPushStuck||0'));

  console.log('[3] KOK FIX B — EMNIYET NABZI: iki kademeli (kanal saglik BEDAVA / tam tazeleme SEYREK)');
  mkClient(true);
  w.eval("localStorage.removeItem('pilateria_dirty'); __sbChannel=null; __sbListenersAdded=false;"+
         "window.__sbHeartbeatMs=40; window.__sbFullSyncMs=100000; __sbLastResync=Date.now();"+
         "window.__resyncN=0; window.__healN=0;"+
         "window.sbResync=function(r){ window.__resyncN++; window.__lastReason=r; return Promise.resolve(); };"+
         "window.__realHeal = sbHealChannel; window.sbHealChannel=function(){ window.__healN++; };");
  w.eval("sbSubscribeAll();");
  t('nabiz zamanlayicisi KURULDU', !!w.eval('window.__sbHeartT'), w.eval('typeof window.__sbHeartT'));
  await flush(170);
  t('her nabizda kanal saglik denetimi (agdan BEDAVA)', w.eval('window.__healN')>0, w.eval('window.__healN'));
  t('MALIYET KORUMASI: tam tazeleme her nabizda CEKMEZ', w.eval('window.__resyncN')===0, w.eval('window.__resyncN'));
  w.eval("window.__sbFullSyncMs=20; __sbLastResync=0;");
  await flush(170);
  t('sure dolunca EMNIYET tam tazeleme calisir (sekme acikken bile)', w.eval('window.__resyncN')>0, w.eval('window.__resyncN'));
  w.eval("clearInterval(window.__sbHeartT); window.sbHealChannel = window.__realHeal;");

  console.log('[4] KOK FIX C — OLU KANAL ONARIMI: kapali/hatali kanal yeniden kurulur');
  t('sbHealChannel tanimli', w.eval("typeof sbHealChannel")==='function', w.eval("typeof sbHealChannel"));
  w.eval("window.__subN=0; window.sbSubscribeAll=function(){ window.__subN++; };");
  w.eval("__sbChannel = { state:'closed' }; sbHealChannel();");
  t('olu kanal (closed) -> yeniden subscribe', w.eval('window.__subN')>0, w.eval('window.__subN'));
  w.eval("window.__subN=0; __sbChannel = { state:'joined' }; sbHealChannel();");
  t('saglikli kanal (joined) -> DOKUNULMAZ (gereksiz yeniden kurma yok)', w.eval('window.__subN')===0, w.eval('window.__subN'));

  console.log('[5] KAYNAK: realtime render DUSMEZ (UI mesguldeyse ertelenir) + migrate hatasinda subscribe');
  t('realtime render 60ms topaklama DURUYOR', /plToast\(.☁️ Güncellendi.\);[\s\S]{0,40}?\}, 60\);/.test(html));
  t('v114: UI mesgulse render ERTELENIR (dusurulmez)', /__sbRtTimer = setTimeout\(__rtRender, 1500\)/.test(html));
  t('v114: sbMigrateLocal upsert HATASINDA da subscribe eder', /Taşıma hatası[\s\S]{0,120}?sbSubscribeAll\(\);[\s\S]{0,20}?return;/.test(html));
  t('v114: nabiz gorunur+cevrimici kosuluyla calisir', /visibilityState !== 'visible'\) return;[\s\S]{0,80}?onLine === false\) return;/.test(html));
  t('v114b MALIYET: tam tazeleme nabizdan SEYREK (kota korumasi)', /__sbLastResync\) >= \(window\.__sbFullSyncMs \|\| 300000\)\) sbResync/.test(html));

  console.log('\n=== sync-heartbeat: '+pass+' gecti, '+fail+' kaldi ===');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} }, 900);
