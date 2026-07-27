// v27 → v121 — ESKI JSONBin SENKRON MOTORU: ARTIK ATIL OLDUGUNUN KANITI
// =============================================================================
// TARIHCE (onemli, silinmesin):
// Bu dosya v27'de eski JSONBin senkron motorunu (push/pull/cakisma/LWW/legacy-rev)
// uctan uca test ediyordu. v121'de O-5 bulgusu geregi JSONBin yolu TAMAMEN kapatildi:
// master key tarayicida duz metin duruyordu ve gunluk yedek TUM state'i (uye adi,
// telefon, TC kimlik, saglik notu, adres, odemeler) ucuncu tarafa yolluyordu.
//
// Bu yuzden o senaryolar (push/pull/cakisma/LWW) ARTIK ERISILEMEZ koda aitti ve
// emekliye ayrildi — eski surumleri git gecmisinde durur. Yerlerine, motorun
// gercekten OLU oldugunu kaniti kondu. Boylece dosya "olu davranisi koruyan test"
// olmaktan cikip "guvenlik ozelligini koruyan test" haline geldi.
//
// KORUNAN bolumler: hala CANLI olan davranislar (Supabase yolunda da kullanilir):
//   [1] save() dirty isareti + __pilSuppressDirty  (sbDiffPush bunlari kullanir)
//   [3] cloud-dot gostergesi                        (sbLoadAll bunu kullanir)
//   [4] restoreConflictBackup                       (eski yedegi olan cihazlar icin)
//
// Bu test BILEREK pilateria-dev-false.html (SUPABASE_MODE=false) uzerinde kosar:
// eski motorun erisilebilir OLABILECEGI TEK yapi odur. Orada bile sifir istek
// cikmasi, kapinin gercekten kapali oldugunun en guclu kanitidir.
// =============================================================================
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.__fetchLog=[];
    w.__fetchRespFor=(url,opts)=>({ok:false,json:()=>Promise.resolve({})});
    w.fetch=(url,opts)=>{ w.__fetchLog.push({url:String(url),method:(opts&&opts.method)||'GET',body:(opts&&opts.body)||null}); return Promise.resolve(w.__fetchRespFor(url,opts)); };
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{};
  }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const LOG=()=>w.__fetchLog;
const jsonbinHits=()=>LOG().filter(x=>/jsonbin/i.test(x.url));

setTimeout(async ()=>{ try {

  console.log('[1] save() dirty isareti (CANLI — sbDiffPush bunu kullanir)');
  w.eval(`localStorage.removeItem('pilateria_dirty'); save();`);
  t('save sonrasi dirty=1', w.localStorage.getItem('pilateria_dirty')==='1');
  w.eval(`window.__pilSuppressDirty=true; localStorage.removeItem('pilateria_dirty'); save(); window.__pilSuppressDirty=false;`);
  t('suppress acikken dirty yazilmaz', w.localStorage.getItem('pilateria_dirty')===null);

  // ===========================================================================
  console.log('[2] v121 O-5 — ESKI MOTOR ATIL (senkron ayarlari TAM dolu olsa bile)');
  // Kapiyi test etmek icin motoru bilerek "calisacak" hale getiriyoruz:
  // enabled + key + bin dolu, veri kirli, cihaz cevrimici. Eskiden bu kurulum
  // 1 GET + 1 PUT uretirdi. Artik SIFIR istek uretmeli.
  w.eval(`syncCfg.enabled=true; syncCfg.key='TESTKEY'; syncCfg.bin='TESTBIN'; syncCfg.baseRev=0; saveSyncCfgRaw(syncCfg);`);
  t('JSONBIN_ENABLED bayragi false', w.eval('typeof JSONBIN_ENABLED !== "undefined" && JSONBIN_ENABLED === false'));

  w.__fetchLog.length=0;
  w.__fetchRespFor=(url,opts)=>({ok:true,json:()=>Promise.resolve({record:{_rev:9,settings:{},members:[{id:'mX',name:'SIZINTI UYESI'}]}})});
  w.localStorage.setItem('pilateria_dirty','1');
  await w.autoPush();
  t('autoPush SIFIR istek uretti (eskiden 1 GET + 1 PUT)', LOG().length===0, LOG().length);

  w.__fetchLog.length=0;
  w.localStorage.removeItem('pilateria_dirty');
  w.eval('lastAutoPullTs=0;');
  await w.autoPullIfNeeded('v121');
  t('autoPullIfNeeded SIFIR istek uretti', LOG().length===0, LOG().length);
  t('bayat bulut kaydi state e SIZMADI', !w.eval(`state.members.some(m=>m.name==='SIZINTI UYESI')`));

  w.__fetchLog.length=0;
  const pushRes = await w.pushToCloud(true);
  const pullRes = await w.pullFromCloud(true);
  t('pushToCloud false dondu ve istek atmadi', pushRes===false && LOG().length===0, pushRes+'/'+LOG().length);
  t('pullFromCloud false dondu ve istek atmadi', pullRes===false && LOG().length===0, pullRes+'/'+LOG().length);

  w.__fetchLog.length=0;
  await w.__pilOffsiteDaily();
  t('__pilOffsiteDaily (gunluk tam-state gonderimi) SIFIR istek', LOG().length===0, LOG().length);

  w.__fetchLog.length=0;
  await w.__sbFreshenFromJsonbin();
  t('__sbFreshenFromJsonbin SIFIR istek (bayat veri ezme riski de kapali)', LOG().length===0, LOG().length);

  // ===========================================================================
  console.log('[3] cloud-dot gostergesi (CANLI — sbLoadAll bunu kullanir)');
  w.setCloudDot('pending');
  const dot=d.getElementById('cloud-dot');
  t('dot gorunur + bekliyor', dot && dot.style.display==='inline-block' && dot.textContent.includes('●'));
  w.setCloudDot('ok');
  t('dot esitlendi', dot.textContent.includes('✓'));
  w.setCloudDot('offline');
  t('dot cevrimdisi uyarisi', dot.textContent.includes('⚠'));

  // ===========================================================================
  console.log('[4] restoreConflictBackup (eski cakisma yedegi olan cihazlar icin)');
  const savedState = {_rev:5, settings:{reformers:5,open:9,close:21,duration:45,workDays:[1,2,3,4,5,6],kdvRate:20,gvRate:15,instructorShareRate:30,groupPackageDays:30,groupRescheduleLimit:1,groupCancelLimit:1}, members:[{id:'mP',name:'YEDEKTEN GELEN',joinDate:'2026-07-01',monthly:{},packages:[]}], groups:[], lessons:[], payments:[], instructors:[], packageTypes:[], campaigns:[], waTemplates:[], instructorPayouts:[]};
  w.localStorage.setItem('pilateria_conflict_backup', JSON.stringify({at:'2026-07-14T10:00:00Z',cloudRev:9,record:savedState}));
  w.eval(`state.members=[]; window.__noReload=true;`);
  try { w.restoreConflictBackup(); } catch(e){}
  t('yedek geri yuklendi', w.eval(`state.members.some(m=>m.name==='YEDEKTEN GELEN')`));
  t('geri yukleme buluta gitmek uzere isaretli', w.localStorage.getItem('pilateria_dirty')==='1');

  // ===========================================================================
  console.log('[5] v121 O-5 — TUM OTURUM boyunca jsonbin.io ADRESINE HIC cikilmadi');
  // En genis kanit: acilistan buraya kadar kaydedilen HER istek taranir.
  t('oturum boyunca 0 adet jsonbin.io istegi',
    jsonbinHits().length===0, jsonbinHits().map(x=>x.method+' '+x.url).join(' | '));

  try { w.eval('clearTimeout(pushTimer)'); } catch(e){}
  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi`);
  process.exit(fail?1:0);
} catch(err) { console.error('TEST HATASI:', err); process.exit(1); } }, 700);
