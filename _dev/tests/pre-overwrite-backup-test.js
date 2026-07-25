// v115 — TAZELEME ONCESI YEREL YEDEK
// Olay (Kerem, 25 Tem): ortagin girdigi odemeler kayboldu. Kod incelemesinde ayri bir acik cikti:
// sbResync basarili cekimden sonra state'i BUTUNUYLE sunucu haliyle eziyor ama oncesinde yerel
// yedek ALMIYOR. __pilDailySnapshot gunde bir kez yazdigi icin bugunun girisleri orada da yok.
// => ters bir tazelemede GERI DONUS NOKTASI YOK.
// Bu test: (1) yedegin alindigini, (2) yalniz AZALMA halinde alindigini (maliyet), (3) daha zengin
// onceki yedegin EZILMEDIGINI, (4) mevcut kurtarma anahtarlarina DOKUNULMADIGINI dogrular.
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
const w=dom.window;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const flush=(ms)=>new Promise(r=>setTimeout(r,ms||150));
const K='pilateria_pre_overwrite_backup';

setTimeout(async ()=>{ try {
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','setCloudDot','plToast'].forEach(fn=>window[fn]=function(){});");
  // save() GERCEK kalmali: 'pilateria' anahtarini yazan o. Yalniz izlemek icin sarmalayalim.
  w.eval("window.__traceLog=[]; window.__trace=function(m){ window.__traceLog.push(String(m)); };");

  // Sunucu mock'u: cloud[] icerigini SB_TABLES icin dondurur.
  const mkClient = ()=> w.eval(
    "sbClient = window.sbClient = { from:function(tab){ return {"+
    "  select:function(){ return { order:function(){ return Promise.resolve({ data: (window.__cloud[tab]||[]), error:null }); } }; },"+
    "  upsert:function(){ return Promise.resolve({error:null}); },"+
    "  delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; } }; },"+
    "  channel:function(){ return { on:function(){return this;}, subscribe:function(){return this;}, state:'joined' }; },"+
    "  removeChannel:function(){} };"
  );
  // n uyeli + p odemeli yerel state kur ve 'pilateria' anahtarina yaz.
  const seedLocal = (n,p)=> w.eval(
    "state.members=[]; state.groups=[]; state.lessons=[]; state.payments=[]; state.instructors=[];"+
    "for(let i=0;i<"+n+";i++) state.members.push({id:'M'+i,name:'U'+i,monthly:{}});"+
    "for(let i=0;i<"+p+";i++) state.payments.push({id:'P'+i,memberId:'M0',amount:100*(i+1),date:'2026-07-25'});"+
    "save(); __sbShadow={}; __sbVer={}; __sbResyncBusy=false; __sbLastResync=0; __sbLastPushAt=0;"+
    "localStorage.removeItem('pilateria_dirty');"
  );
  const setCloud = (n,p)=> w.eval(
    "window.__cloud={}; SB_TABLES.forEach(t=>window.__cloud[t]=[]);"+
    "for(let i=0;i<"+n+";i++){ window.__cloud.members.push({id:'M'+i,data:{id:'M'+i,name:'U'+i,monthly:{}}}); window.__cloud.member_finance.push({id:'M'+i,data:{id:'M'+i}}); }"+
    "for(let i=0;i<"+p+";i++) window.__cloud.payments.push({id:'P'+i,data:{id:'P'+i,memberId:'M0',amount:100*(i+1),date:'2026-07-25'}});"
  );
  const cnt = (raw,f)=> w.eval("(function(){ try{ const r=localStorage.getItem('"+raw+"'); if(!r) return -1; return (JSON.parse(r)."+f+"||[]).length; }catch(e){ return -2; } })()");

  console.log('[0] ACIK KANITI: yamasiz surumde tazeleme SONRASI donus noktasi yok muydu?');
  t('v115 oncesi kod uzerine yazmadan once yedek ALMIYORDU (yama artik var)', /TAZELEME ÖNCESİ yerel yedek/.test(html));
  t('gunluk halka gunde BIR KEZ yaziyor (bugunun girisleri orada yok)', /const key = 'pilateria_daily_' \+ day;\s*\n\s*if \(localStorage\.getItem\(key\)\) return;/.test(html));

  console.log('[1] AZALMA: bulut yerelden EKSIK -> uzerine yazmadan once yedek ALINIR');
  mkClient(); seedLocal(114, 95); setCloud(114, 90);   // tam da bugunku olay: 95 -> 90 odeme
  w.eval("localStorage.removeItem('"+K+"');");
  await w.eval("sbResync('nabız')"); await flush(200);
  t('yedek anahtari OLUSTU', w.eval("localStorage.getItem('"+K+"')!==null"));
  t('yedekte odemeler TAM (95)', cnt(K,'payments')===95, cnt(K,'payments'));
  t('yedekte uyeler TAM (114)', cnt(K,'members')===114, cnt(K,'members'));
  t('canli state gercekten tazelendi (90 odeme)', w.eval("state.payments.length")===90, w.eval("state.payments.length"));
  t('izlemede 🧷 satiri var', w.eval("window.__traceLog.join('|')").indexOf('TAZELEME ÖNCESİ yerel yedek')>=0, w.eval("window.__traceLog.slice(-3).join(' | ')"));
  t('izleme AZALAN alani odemeyi gosteriyor', /ödeme 95→90/.test(w.eval("window.__traceLog.join('|')")), w.eval("window.__traceLog.slice(-2).join(' | ')"));

  console.log('[2] MALIYET: azalma YOKken (artis/esitlik) yedek YAZILMAZ — 5dk\'da bir 250KB yazma olmaz');
  w.eval("localStorage.removeItem('"+K+"');");
  seedLocal(114, 90); setCloud(116, 92);  // bulut daha zengin: normal cok-cihaz yakalamasi
  await w.eval("sbResync('nabız')"); await flush(200);
  t('artis halinde yedek YOK', w.eval("localStorage.getItem('"+K+"')")===null);
  w.eval("localStorage.removeItem('"+K+"');");
  seedLocal(114, 90); setCloud(114, 90);  // birebir ayni
  await w.eval("sbResync('nabız')"); await flush(200);
  t('esitlik halinde yedek YOK', w.eval("localStorage.getItem('"+K+"')")===null);

  console.log('[3] FAKIRLESTIRME KORUMASI: ikinci (daha fakir) azalma zengin yedegi EZMEZ');
  w.eval("localStorage.removeItem('"+K+"');");
  seedLocal(114, 95); setCloud(114, 90);
  await w.eval("sbResync('nabız')"); await flush(200);
  t('ilk yedek 95 odeme', cnt(K,'payments')===95, cnt(K,'payments'));
  seedLocal(114, 90); setCloud(114, 88);   // simdi yerel zaten fakirlesmis; ikinci azalma
  w.eval("__sbLastResync=0; __sbResyncBusy=false;");
  await w.eval("sbResync('nabız')"); await flush(200);
  t('zengin yedek KORUNDU (hala 95, 90 ile ezilmedi)', cnt(K,'payments')===95, cnt(K,'payments'));
  t('izleme korumayi bildirdi', w.eval("window.__traceLog.join('|')").indexOf('daha zengin')>=0, w.eval("window.__traceLog.slice(-2).join(' | ')"));

  console.log('[4] MEVCUT KURTARMA NOKTALARINA DOKUNULMAZ (15 Tem kurtarmasi bu anahtardan yapilmisti)');
  w.eval("localStorage.setItem('pilateria_pre_resync_backup', JSON.stringify({members:[{id:'X'}],payments:[{id:'Y'}]}));"+
         "localStorage.setItem('pilateria_pre_cloud_backup', JSON.stringify({members:[{id:'X'}],payments:[{id:'Y'}]}));"+
         "localStorage.setItem('pilateria_pre_pull_backup', JSON.stringify({members:[{id:'X'}],payments:[{id:'Y'}]}));"+
         "localStorage.removeItem('"+K+"');");
  seedLocal(114, 95); setCloud(114, 80);
  w.eval("__sbLastResync=0; __sbResyncBusy=false;");
  await w.eval("sbResync('nabız')"); await flush(200);
  t('pre_resync_backup DURUYOR', w.eval("localStorage.getItem('pilateria_pre_resync_backup')!==null"));
  t('pre_cloud_backup DURUYOR', w.eval("localStorage.getItem('pilateria_pre_cloud_backup')!==null"));
  t('pre_pull_backup DURUYOR', w.eval("localStorage.getItem('pilateria_pre_pull_backup')!==null"));
  t('yeni yedek AYRI anahtarda', w.eval("localStorage.getItem('"+K+"')!==null") && cnt(K,'payments')===95, cnt(K,'payments'));

  console.log('[5] KOD: v114 davranislari bozulmadi + recover.html yeni anahtari taniyor');
  t('cekim eksikse hala ATLANIR (yerel korunur)', /eksik çekim → ATLA \(yerel korundu\)/.test(html));
  t('tazeleme tek sefer hesaplanan __incoming ile yapiliyor', /state = __incoming; applyV10MigrationToState\(state\)/.test(html));
  // MALIYET: sbResync govdesi icinde gelen state YALNIZ BIR KEZ hesaplanmali (yedek karsilastirmasi
  // icin ikinci bir tam donusum ~250KB'lik gereksiz is olurdu).
  const __i0 = html.indexOf("TAM TAZELE (sunucudan tüm veri)");
  const __i1 = html.indexOf("finally { __sbResyncBusy = false; }", __i0);
  const __body = (__i0 > 0 && __i1 > __i0) ? html.slice(__i0, __i1) : '';
  t('sbResync govdesi bulundu', __body.length > 0);
  t('sbResync icinde sbRowsToState YALNIZ BIR KEZ (maliyet)', (__body.match(/sbRowsToState\(/g)||[]).length===1, (__body.match(/sbRowsToState\(/g)||[]).length);
  const rec = fs.readFileSync(require('path').join(require('path').dirname(process.argv[2]),'recover.html'),'utf-8');
  t('recover.html yeni yedek anahtarini listeliyor', rec.indexOf(K)>=0);

  console.log('\n=== pre-overwrite-backup: '+pass+' gecti, '+fail+' kaldi ===');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} }, 900);
