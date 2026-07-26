// v118 — BULUTTAN SILME ARTIK "YOKLUK"TAN CIKARILMAZ (MEZAR TASI / TOMBSTONE KAPISI)
// Kerem (27 Tem): "bir daha boyle bir sey yasanmamali. Buluta veriler aninda gidiyor zaten."
//
// KOK KUSUR (v104..v117 boyunca DURAN): sbDiffPush "golgede var ama yerelde yok" gordugu HER kaydi
// buluttan SILIYOR. Bu bir CIKARIMDIR; kullanicinin silme NIYETI degil. Bayat/eksik bir yerel kopya
// (baska cihazin yazdigi, bu cihazin hic gormedigi kayitlar) bu cikarimla BULUTTAN SILINIYORDU.
// 26 Tem'de tam bu oldu: 25 ders + 2 odeme yok oldu. v104 sigortasi ATMADI cunku esigi
// (__delTotal > 15 && __delTotal > shadowTotal*0.3) 392 dersli bir stüdyoda ~216 silme istiyor.
// v117 golgeyi guvenilir bir temele bagladi ama CIKARIMI kaldirmadi.
//
// v118 KANONU: bulutta bir kayit YALNIZCA bu cihazda o kayit GERCEKTEN silindiginde yazilan
// mezar tasi varsa silinir. Mezar tasi yoksa kayit SILINMEZ; golgeden dusurulur ve buluttan
// tazelenir. En kotu hal "silme yayilmadi" (gorunur, zararsiz) olur; "veri kayboldu" DEGIL.
//
// Bu test ONCE acigi kanitlar: yamasiz surumde [1] adiminda 27 kayit SILINIR.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,status:0,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{}; }});
const w=dom.window;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const flush=(ms)=>new Promise(r=>setTimeout(r,ms||120));

setTimeout(async ()=>{ try {
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','setCloudDot','plToast','sbSubscribeAll','__pilOffsiteDaily','sbApplyRoleUI'].forEach(fn=>window[fn]=function(){});");
  w.eval("window.__traceLog=[]; window.__trace=function(m){ window.__traceLog.push(String(m)); };");
  w.eval("__sbRole='owner'; window.__pilAllowMassDelete=0;");
  w.eval("window.__pilGhostHealMs=150;");            // hayalet-tazeleme gecikmesi (test hizi)
  w.eval("window.__RESYNCED=0; sbResync = window.sbResync = function(r){ window.__RESYNCED++; window.__RESYNC_REASON=r; return Promise.resolve(); };");

  const mkClient = ()=> w.eval(
    "window.__ups={}; window.__dels={};"+
    "sbClient = window.sbClient = { from:function(tab){ return {"+
    "  select:function(){ return { order:function(){ return Promise.resolve({data:[],error:null}); } }; },"+
    "  upsert:function(arr){ (window.__ups[tab]=window.__ups[tab]||[]).push.apply(window.__ups[tab],(arr||[]).map(function(x){return x.id;})); return Promise.resolve({error:null}); },"+
    "  delete:function(){ return { in:function(col,ids){ (window.__dels[tab]=window.__dels[tab]||[]).push.apply(window.__dels[tab],ids||[]); return Promise.resolve({error:null}); } }; } }; },"+
    "  auth:{ getSession:function(){ return Promise.resolve({data:{session:{user:{id:'u1'}}}}); } },"+
    "  channel:function(){ return { on:function(){return this;}, subscribe:function(){return this;}, state:'joined' }; },"+
    "  removeChannel:function(){} };"
  );
  // GERCEK ORANLAR (26 Tem olayi): 114 uye / 392 ders / 99 odeme. Sigorta esigi bu boyutta
  // ~216 silme istiyor; 27 silme sigortayi ATLATIR. Kucuk fixture ile acik KANITLANAMAZ.
  const seedFull = ()=> w.eval(
    "window.__pilSuppressDirty=true;"+
    "state.members=Array.from({length:114},(_,i)=>({id:'M'+(i+1),name:'Uye '+(i+1),joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}));"+
    "state.groups=[]; state.instructors=[]; state.instructorPayouts=[]; state.campaigns=[];"+
    "state.lessons=Array.from({length:392},(_,i)=>({id:'L'+(i+1),date:'2026-07-26',time:'10:00',status:'planned',packageMonth:'2026-07'}));"+
    "state.payments=Array.from({length:99},(_,i)=>({id:'P'+(i+1),memberId:'M1',amount:100,date:'2026-07-26',packageMonth:'2026-07'}));"+
    "localStorage.setItem('pilateria',JSON.stringify(state)); window.__pilSuppressDirty=false;"+
    "__sbVer={}; __sbLastPushAt=0;"
  );
  const dels = (tab)=> w.eval("(function(){var a=(window.__dels['"+tab+"']||[]).slice().sort();return a.filter(function(x,i){return i===0||a[i-1]!==x;});})()");
  const delTotal = ()=> w.eval("(function(){var n=0;for(var k in window.__dels)n+=(window.__dels[k]||[]).length;return n;})()");
  const shadowHas = (tab,id)=> w.eval("!!(__sbShadow['"+tab+"']&&__sbShadow['"+tab+"']['"+id+"'])");
  const traces = ()=> w.eval("window.__traceLog.join(' | ')");

  console.log('[1] ⛔ ACIK: BAYAT CIHAZ — golgede olup yerelde olmayan 25 ders + 2 odeme');
  mkClient(); seedFull();
  w.eval("sbSnapshotShadow(sbStateToRows());");               // golge = BULUT hali (392 ders / 99 odeme)
  w.eval("window.__traceLog=[]; window.__RESYNCED=0;");
  // Cihazin BAYAT kopyasi: son 25 ders ve son 2 odeme bu cihaza HIC ULASMADI.
  // save() YOK -> kullanici HICBIR SEY SILMEDI -> mezar tasi da YOK.
  w.eval("state.lessons=state.lessons.slice(0,367); state.payments=state.payments.slice(0,97);");
  await w.eval("sbDiffPush()"); await flush(120);
  t('HICBIR ders silinmedi (yamasiz surumde 25 silinir)', dels('lessons').length===0, JSON.stringify(dels('lessons')).slice(0,120));
  t('HICBIR odeme silinmedi (yamasiz surumde 2 silinir)', dels('payments').length===0, JSON.stringify(dels('payments')));
  t('toplam SILME sayisi 0', delTotal()===0, delTotal());
  t('v104 toplu-silme sigortasi ATMADI (27 < esik) — koruma mezar tasindan geliyor',
    !/SİLME SİGORTASI/.test(traces()), traces().slice(0,140));
  t('izlemede HAYALET SILME satiri var', /HAYALET/.test(traces()), traces().slice(0,200));
  t('hayalet kayitlar golgeden dusuruldu (tekrar tekrar denenmesin)', shadowHas('lessons','L392')===false);
  t('dokunulmayan kayit golgede DURUYOR', shadowHas('lessons','L1')===true);
  await flush(300);
  t('buluttan tazeleme planlandi (yerel kayitlar geri gelecek)', w.eval('window.__RESYNCED')>0, w.eval('window.__RESYNCED'));
  t('tazeleme sebebi hayalet-koruma', /ghost/.test(String(w.eval('window.__RESYNC_REASON')||'')), w.eval('window.__RESYNC_REASON'));

  console.log('[2] GERCEK SILME CALISIR: kullanici silerse mezar tasi yazilir, bulut da silinir');
  mkClient(); seedFull();
  w.eval("sbSnapshotShadow(sbStateToRows());");
  w.eval("save();");                                          // mezar tasi temeli (prevIds) kurulur
  w.eval("window.__ups={}; window.__dels={};");
  w.eval("state.lessons=state.lessons.filter(function(l){return ['L5','L6','L7'].indexOf(l.id)<0;}); save();");
  await flush(60);
  await w.eval("sbDiffPush()"); await flush(120);
  t('YALNIZ kullanicinin sildigi 3 ders silindi', dels('lessons').join(',')==='L5,L6,L7', dels('lessons').join(','));
  t('baska hicbir tabloda silme yok', delTotal()===3, delTotal());

  console.log('[3] UYE SILME: iki tabloda da (members + member_finance) silme gecerli');
  w.eval("window.__ups={}; window.__dels={};");
  w.eval("state.members=state.members.filter(function(m){return m.id!=='M3';}); save();");
  await flush(60);
  await w.eval("sbDiffPush()"); await flush(120);
  t('members tablosundan M3 silindi', dels('members').join(',')==='M3', dels('members').join(','));
  t('member_finance tablosundan M3 silindi', dels('member_finance').join(',')==='M3', dels('member_finance').join(','));

  console.log('[4] SENKRON UYGULAMASI mezar tasi YAZMAZ (baska cihazin karari bizim niyetimiz degil)');
  mkClient(); seedFull();
  w.eval("sbSnapshotShadow(sbStateToRows()); save();");
  w.eval("window.__ups={}; window.__dels={};");
  // realtime/acilis cekimi gibi: __sbApplying + suppressDirty acikken kayitlar state'ten dusuyor
  w.eval("__sbApplying=true; window.__pilSuppressDirty=true;"+
         "state.lessons=state.lessons.filter(function(l){return ['L11','L12'].indexOf(l.id)<0;}); save();"+
         "__sbApplying=false; window.__pilSuppressDirty=false;");
  await flush(60);
  await w.eval("sbDiffPush()"); await flush(120);
  t('senkron sirasinda dusen kayitlar buluttan SILINMEDI', dels('lessons').length===0, dels('lessons').join(','));

  console.log('[5] KALICILIK: mezar tasi localStorage\'ta yasar (cevrimdisi silme sonraki acilista gider)');
  mkClient(); seedFull();
  w.eval("sbSnapshotShadow(sbStateToRows()); save();");
  // CEVRIMDISI SIL: istemci yok -> hicbir gonderim olmaz, golge L20'yi TUTAR, mezar tasi yazilir.
  // (Istemci acikken save() zaten kendi kendine gonderir; o zaman bu adim "kalicilik"i degil
  //  aninda gonderimi olcerdi.)
  w.eval("sbClient=window.sbClient=null;");
  w.eval("state.lessons=state.lessons.filter(function(l){return l.id!=='L20';}); save();");
  await flush(120);
  const rawTomb = w.eval("localStorage.getItem('pilateria_tomb')");
  t('mezar tasi localStorage\'a yazildi', !!rawTomb && /L20/.test(rawTomb), String(rawTomb||'').slice(0,120));
  t('cevrimdisi iken golge L20\'yi tutuyor (gonderim olmadi)', shadowHas('lessons','L20')===true);
  try{ w.eval("__pilTombCache=null;"); }catch(e){}             // "sayfa yeniden acildi" — bellek onbellegi bos (yamasiz surumde sembol YOK)
  mkClient();                                                  // baglanti geri geldi (__ups/__dels sifirlanir)
  await w.eval("sbDiffPush()"); await flush(120);
  t('yeniden acilista da silme gecerli (kalici mezar tasi)', dels('lessons').join(',')==='L20', dels('lessons').join(','));

  console.log('[6] v104 TOPLU SILME SIGORTASI bozulmadi (state bosalirsa hicbir sey silinmez)');
  mkClient(); seedFull();
  w.eval("sbSnapshotShadow(sbStateToRows()); save();");
  w.eval("window.__ups={}; window.__dels={}; window.__traceLog=[]; localStorage.removeItem('pilateria_mass_delete_backup');");
  w.eval("state.members=[]; state.lessons=[]; state.payments=[]; save();");   // bozulma: her sey ucup gitti
  await flush(60);
  await w.eval("sbDiffPush()"); await flush(150);
  t('sigorta atti, HICBIR silme gonderilmedi', delTotal()===0, delTotal());
  t('ani yedek (mass_delete_backup) yazildi', !!w.eval("localStorage.getItem('pilateria_mass_delete_backup')"));
  t('izlemede SILME SIGORTASI satiri var', /SİLME SİGORTASI/.test(traces()), traces().slice(0,160));

  console.log('[7] ACILIS-ONCESI YEDEK HALKASI: tek slot degil 5 slot + ayni icerik tekrar yazilmaz');
  w.eval("for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i); if(k&&/^pilateria_pre_cloud_/.test(k))localStorage.removeItem(k);}");
  const ringKeys = ()=> w.eval("(function(){var a=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i); if(k&&/^pilateria_pre_cloud_\\d+$/.test(k))a.push(k);}return a.sort();})()");
  for (let i=1;i<=7;i++) { try{ w.eval("__pilPreCloudRing(JSON.stringify({members:[{id:'M"+i+"'}],lessons:[],payments:[],groups:[],settings:{}}));"); }catch(e){} }
  t('halka en fazla 5 slot tutar', ringKeys().length===5, JSON.stringify(ringKeys()));
  t('eski tek-slot anahtari (uyumluluk) hala yaziliyor', !!w.eval("localStorage.getItem('pilateria_pre_cloud_backup')"));
  const before7 = w.eval("(function(){var o={};for(var i=1;i<=5;i++)o[i]=(localStorage.getItem('pilateria_pre_cloud_'+i)||'').length;return JSON.stringify(o);})()");
  try{ w.eval("__pilPreCloudRing(JSON.stringify({members:[{id:'M7'}],lessons:[],payments:[],groups:[],settings:{}}));"); }catch(e){} // AYNI icerik
  const after7 = w.eval("(function(){var o={};for(var i=1;i<=5;i++)o[i]=(localStorage.getItem('pilateria_pre_cloud_'+i)||'').length;return JSON.stringify(o);})()");
  t('ayni icerik ikinci kez slot TUKETMEZ', before7===after7, before7+' vs '+after7);
  try{ w.eval("__pilPreCloudRing(JSON.stringify({members:[{id:'M8'}],lessons:[],payments:[],groups:[],settings:{}}));"); }catch(e){}
  t('yeni icerik en ESKI slotu ezer (5 slot korunur)', ringKeys().length===5 && /M8/.test(w.eval("(function(){var s='';for(var i=1;i<=5;i++)s+=(localStorage.getItem('pilateria_pre_cloud_'+i)||'');return s;})()")));

  console.log('[8] KAYNAK: koruma kodu yerinde');
  t('mezar tasi deposu var', /pilateria_tomb/.test(html));
  t('save() icinde mezar tasi kaydi cagriliyor', /__pilTombRecord\(\);/.test(html));
  t('silme YALNIZ mezar tasiyla yapiliyor', /__pilTombHas\(t, id\)/.test(html));
  t('mezar tasi olmayan yoklar HAYALET sayilip golgeden dusuruluyor', /HAYALET SİLME ENGELLENDİ/.test(html));
  t('senkron uygulamasi sirasinda mezar tasi yazilmiyor', /__pilSuppressDirty \|\| __sbApplying/.test(html));
  t('acilis-oncesi yedek HALKASI var', /__pilPreCloudRing/.test(html));
  t('v117 bayat-ezme kalkani hala yerinde', /if \(!__sbBaseReady\)/.test(html));
  t('v104 sigortasi hala yerinde', /SİLME SİGORTASI \(push\)/.test(html));

  console.log('\n=== tombstone-delete: '+pass+' gecti, '+fail+' kaldi ===');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} }, 900);
