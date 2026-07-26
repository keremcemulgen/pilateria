// v117 — BAYAT CIHAZ BULUTTAKI YENI VERIYI EZIYOR
// Kerem (26 Tem): "PC den bir suru odeme ve ders girdim telefonumda guncellendi, ortagim girdi ve
// veriler DEGISTI ... iPhone'da bu sorun yasaniyor ... ben de telefondan girdim, iPhone'daki gibi oldu."
//
// KOK SEBEP: sbDiffPush "GOLGE'den (shadow) farkli" ile "BEN degistirdim"i AYNI SEY saniyor.
// __sbShadow BELLEKTE ve acilista BOS; sbLoadAll basariyla bitene kadar dolmuyor. O pencerede
// yapilan HERHANGI bir save() -> sbDiffPush -> TUM yerel state "farkli" gorunur -> her kayit
// _v=Date.now() ile buluta basilir -> baska cihazlarin yazdigi HER SEY bu cihazin BAYAT kopyasina DONER.
// Ikinci yol: sbLoadAll'daki kirli-acilis dali sunucu golgesinin altina BUTUN bayat yerel state'i
// koyar -> cihazin HIC GORMEDIGI (baska cihazda olusmus) kayitlar golgede olup yerelde olmadigi icin
// SILINIR (dels). 15 kaydin altinda kaldigi icin toplu-silme sigortasi da devreye GIRMEZ.
//
// Bu test ONCE acigi kanitlar: yamasiz surumde bayat cihaz bulutu geri sariyor + yeni kayitlari siliyor.
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

setTimeout(async ()=>{ try {
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','setCloudDot','plToast','sbSubscribeAll','__pilOffsiteDaily','sbApplyRoleUI'].forEach(fn=>window[fn]=function(){});");
  w.eval("window.plConfirm=function(){ return Promise.resolve(false); };");   // 'birlestir?' sorusu: HAYIR (deterministik)
  w.eval("window.__traceLog=[]; window.__trace=function(m){ window.__traceLog.push(String(m)); };");
  w.eval("__sbRole='owner';");

  // ---- SUNUCU MOCK'U: upsert/delete GERCEKTEN bulut kopyasini degistirir (geri sarmayi olcebilelim)
  const mkClient = ()=> w.eval(
    "window.__ups={}; window.__dels={};"+
    "sbClient = window.sbClient = { from:function(tab){ return {"+
    "  select:function(){ return { order:function(){ return Promise.resolve({ data:(window.__cloud[tab]||[]).map(function(r){return {id:r.id,data:JSON.parse(JSON.stringify(r.data))};}), error:null }); } }; },"+
    "  upsert:function(arr){ (window.__ups[tab]=window.__ups[tab]||[]).push.apply(window.__ups[tab],(arr||[]).map(function(x){return x.id;}));"+
    "    (arr||[]).forEach(function(r){ var L=window.__cloud[tab]=window.__cloud[tab]||[]; var i=L.findIndex(function(x){return x.id===r.id;});"+
    "      if(i>=0) L[i]={id:r.id,data:JSON.parse(JSON.stringify(r.data))}; else L.push({id:r.id,data:JSON.parse(JSON.stringify(r.data))}); });"+
    "    return Promise.resolve({error:null}); },"+
    "  delete:function(){ return { in:function(col,ids){ (window.__dels[tab]=window.__dels[tab]||[]).push.apply(window.__dels[tab],ids||[]);"+
    "      window.__cloud[tab]=(window.__cloud[tab]||[]).filter(function(x){ return (ids||[]).indexOf(x.id)<0; });"+
    "      return Promise.resolve({error:null}); } }; } }; },"+
    "  auth:{ getSession:function(){ return Promise.resolve({data:{session:{user:{id:'u1'}}}}); } },"+
    "  channel:function(){ return { on:function(){return this;}, subscribe:function(){return this;}, state:'joined' }; },"+
    "  removeChannel:function(){} };"
  );
  // BULUT: 3 uye + 3 odeme. P1 PC'de 999'a duzeltilmis, P3 PC'de YENI olusturulmus (telefon gormedi).
  const setCloud = ()=> w.eval(
    "window.__cloud={}; SB_TABLES.forEach(t=>window.__cloud[t]=[]);"+
    "['M1','M2','M3'].forEach(function(id){ window.__cloud.members.push({id:id,data:{id:id,name:'Uye '+id,monthly:{},_v:5000}});"+
    "  window.__cloud.member_finance.push({id:id,data:{id:id,_v:5000}}); });"+
    "window.__cloud.payments.push({id:'P1',data:{id:'P1',memberId:'M1',amount:999,date:'2026-07-26',_v:5000}});"+
    "window.__cloud.payments.push({id:'P2',data:{id:'P2',memberId:'M1',amount:200,date:'2026-07-20',_v:1000}});"+
    "window.__cloud.payments.push({id:'P3',data:{id:'P3',memberId:'M2',amount:300,date:'2026-07-26',_v:5000}});"+
    "window.__cloud.settings.push({id:'singleton',data:{_v:1000}});"
  );
  // TELEFONUN BAYAT HALI: P3 YOK (gormedi), P1 hala 100 (PC'deki 999 duzeltmesini gormedi), P9 = kendi girisi.
  const seedStale = ()=> w.eval(
    "window.__pilSuppressDirty=true;"+
    "state.members=[{id:'M1',name:'Uye M1',monthly:{}},{id:'M2',name:'Uye M2',monthly:{}},{id:'M3',name:'Uye M3',monthly:{}}];"+
    "state.groups=[]; state.lessons=[]; state.instructors=[]; state.instructorPayouts=[]; state.campaigns=[];"+
    "state.payments=[{id:'P1',memberId:'M1',amount:100,date:'2026-07-19'},{id:'P2',memberId:'M1',amount:200,date:'2026-07-20'},"+
    "                {id:'P9',memberId:'M3',amount:400,date:'2026-07-26'}];"+
    "state._lastLocalEditAt=4000;"+                      // bulut _v=5000 => bulut DAHA YENI
    "localStorage.setItem('pilateria',JSON.stringify(state)); window.__pilSuppressDirty=false;"+
    "__sbShadow={}; __sbVer={}; __sbResyncBusy=false; __sbLastResync=0; __sbLastPushAt=0;"+
    // ACILIS ANI: cihaz uygulamayi TAM BU HALDE acti. Bundan SONRAKI her degisiklik
    // "bu oturumda BEN yaptim" sayilir. (Gercekte `let state = load()` hemen ardinda alinir.)
    // try/catch: YAMASIZ surumde bu semboller YOKTUR — test cokmesin, gercek iddialar KALSIN ki
    // acik kanitlansin (yamasiz surumde 14 iddia duser).
    "try{__sbBaseReady=false;}catch(e){} try{__sbBootFp=__sbFingerprint(state);}catch(e){}"
  );
  const cloudPay = (id,f)=> w.eval("(function(){var r=(window.__cloud.payments||[]).find(function(x){return x.id==='"+id+"';}); return r?(r.data."+f+"):'YOK';})()");
  const cloudIds = (tab)=> w.eval("(window.__cloud['"+tab+"']||[]).map(function(x){return x.id;}).sort().join(',')");
  // TEKILLESTIRILMIS: save() zaten bir mikrotask push planladigi icin ayni id iki kez sayilabilir;
  // olculen sey "hangi kayitlar gitti", "kac kez gitti" degil.
  const uniq = (bag,tab)=> w.eval("(function(){var a=(window."+bag+"['"+tab+"']||[]).slice().sort();"+
    "return a.filter(function(x,i){return i===0||a[i-1]!==x;}).join(',');})()");
  const pushed   = (tab)=> uniq('__ups', tab);
  const deleted  = (tab)=> uniq('__dels', tab);

  console.log('[1] ⛔ ACIK: GOLGE BOSKEN (acilis cekimi bitmeden) bir kayit -> TUM bayat state buluta basiliyor');
  mkClient(); setCloud(); seedStale();
  w.eval("localStorage.setItem('pilateria_dirty','1');");
  await w.eval("sbDiffPush()"); await flush(120);
  t('bayat cihaz P1\'i EZMEDI (bulut 999 kaldi)', cloudPay('P1','amount')===999, 'bulut P1 amount='+cloudPay('P1','amount'));
  t('cihazin GORMEDIGI P3 bulutta DURUYOR', cloudIds('payments').indexOf('P3')>=0, cloudIds('payments'));
  t('golge bosken HIC upsert gitmedi', pushed('payments')==='', pushed('payments'));
  t('golge bosken uye tablosu da basilmadi', pushed('members')==='', pushed('members'));
  t('kirli bayrak KORUNDU (veri kaybolmaz, cekim sonrasi gonderilir)', w.eval("localStorage.getItem('pilateria_dirty')")==='1');
  t('izlemede temel-hazir-degil satiri var', /temel|TEMEL/.test(w.eval("window.__traceLog.join('|')")), w.eval("window.__traceLog.slice(-2).join(' | ')"));

  console.log('[2] NORMAL CALISMA BOZULMADI: cekim bittikten sonra YALNIZ degisen kayit gider');
  mkClient(); setCloud(); seedStale();
  await w.eval("sbLoadAll()"); await flush(250);
  t('acilis cekimi state\'i tazeledi (P3 geldi)', w.eval("state.payments.some(p=>p.id==='P3')"), w.eval("state.payments.map(p=>p.id).join(',')"));
  w.eval("window.__ups={}; window.__dels={};");
  w.eval("state.payments.find(p=>p.id==='P2').amount=222; save();");
  await w.eval("sbDiffPush()"); await flush(120);
  t('YALNIZ P2 gonderildi', pushed('payments')==='P2', pushed('payments'));
  t('bulutta P2 guncellendi', cloudPay('P2','amount')===222, cloudPay('P2','amount'));
  t('P1 (dokunulmayan) bulutta 999 kaldi', cloudPay('P1','amount')===999, cloudPay('P1','amount'));
  t('hicbir SILME gonderilmedi', deleted('payments')==='', deleted('payments'));

  console.log('[3] ⛔ ACIK: KIRLI ACILIS -> cihazin gormedigi kayitlar SILINIYOR + yeni veri geri sariliyor');
  mkClient(); setCloud(); seedStale();
  w.eval("localStorage.setItem('pilateria_dirty','1');");
  await w.eval("sbLoadAll()"); await flush(300);
  t('P3 SILINMEDI (baska cihazda olusmus kayit korunur)', cloudIds('payments').indexOf('P3')>=0, 'bulut='+cloudIds('payments'));
  t('hicbir odeme silinmedi', deleted('payments')==='', deleted('payments'));
  t('hicbir uye silinmedi', deleted('members')==='', deleted('members'));
  t('gonderilmemis YEREL kayit (P9) buluta ULASTI', cloudIds('payments').indexOf('P9')>=0, 'bulut='+cloudIds('payments'));
  t('bulut P1 GERI SARILMADI (999, bayat 100 degil)', cloudPay('P1','amount')===999, cloudPay('P1','amount'));
  t('state\'te P3 duruyor', w.eval("state.payments.some(p=>p.id==='P3')"), w.eval("state.payments.map(p=>p.id).sort().join(',')"));
  t('state\'te P9 duruyor', w.eval("state.payments.some(p=>p.id==='P9')"), w.eval("state.payments.map(p=>p.id).sort().join(',')"));

  console.log('[4] GERCEK KANON: BU OTURUMDA dokundugum kayit YEREL, dokunmadigim SUNUCU kazanir');
  // Eski (yanlis) kural state genelinde _lastLocalEditAt bakiyordu. KARSI ORNEK: cihaz 10:00'da
  // ceker, PC 10:30'da P1'i duzeltir, cihaz 11:00'de ALAKASIZ bir kaydi (P2) degistirir. Kaba kural
  // "yerel daha yeni" deyip P1'i de cihazin 10:00 kopyasina GERI SARARDI. Dogru kanon KAYIT BAZINDA.
  mkClient(); setCloud(); seedStale();
  w.eval("state.payments.find(p=>p.id==='P2').amount=555;");    // BU OTURUMDA duzenlenen TEK kayit
  w.eval("state._lastLocalEditAt=5000+600000; localStorage.setItem('pilateria',JSON.stringify(state)); localStorage.setItem('pilateria_dirty','1');");
  await w.eval("sbLoadAll()"); await flush(300);
  t('BU OTURUMDA duzenlenen P2 YEREL kazanir (555)', cloudPay('P2','amount')===555, cloudPay('P2','amount'));
  t('DOKUNULMAYAN P1 SUNUCU kalir (999) — yerel saat cok yeni olsa BILE', cloudPay('P1','amount')===999, cloudPay('P1','amount'));
  t('gonderilmemis yerel OLUSTURMA (P9) buluta ulasti', cloudIds('payments').indexOf('P9')>=0, cloudIds('payments'));
  t('baska cihazin kaydi (P3) SILINMEDI', cloudIds('payments').indexOf('P3')>=0, cloudIds('payments'));
  t('YALNIZ P2+P9 gonderildi (dokunulmayanlar degil)', pushed('payments')==='P2,P9', pushed('payments'));
  t('hicbir SILME gonderilmedi', deleted('payments')==='', deleted('payments'));
  t('state P1 = sunucu hali (999)', w.eval("(state.payments.find(p=>p.id==='P1')||{}).amount")===999, w.eval("(state.payments.find(p=>p.id==='P1')||{}).amount"));

  console.log('[5] KAYNAK: koruma kodu yerinde');
  t('__sbBaseReady bayragi var', /__sbBaseReady/.test(html));
  t('sbDiffPush temel hazir degilken donuyor', /if \(!__sbBaseReady\)/.test(html));
  t('golge alininca temel HAZIR isaretleniyor', /__sbBaseReady = true;/.test(html));
  t('acilis parmak izi `let state = load\\(\\)` ardinda aliniyor', /let state = load\(\);[\s\S]{0,400}?__sbBootFp = __sbFingerprint\(state\)/.test(html));
  t('kirli acilista BUTUN state geri konmuyor (birlestirme var)', /state = __sbMergeUnsentLocal\(state, __localState\)/.test(html));
  t('v115 tazeleme-oncesi yedek hala yerinde', /TAZELEME ÖNCESİ yerel yedek/.test(html));
  t('v104 toplu silme sigortasi hala yerinde', /SİLME SİGORTASI \(push\)/.test(html));
  t('v116 ad onarimi hala yerinde', /__repairStaleGroupNames/.test(html));

  console.log('\n=== stale-overwrite: '+pass+' gecti, '+fail+' kaldi ===');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} }, 900);
