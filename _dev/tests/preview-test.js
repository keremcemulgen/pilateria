// ONIZLEME IZOLASYONU: preview.html gercek veriye/buluta ASLA dokunmaz
// Calistirma: node tests/preview-test.js preview.html
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let fetchCount = 0;
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/preview.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>{ fetchCount++; return Promise.resolve({ok:false,json:()=>Promise.resolve({})}); };
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>{throw new Error('SW cagirilmamali');},getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};
    w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
    // GERCEK uygulama verisi simulasyonu (ayni origin localStorage)
    w.localStorage.setItem('pilateria', JSON.stringify({settings:{reformers:5,open:9,close:21,duration:45,workDays:[1,2,3,4,5,6]},members:[{id:'mREAL',name:'GERCEK UYE',joinDate:'2026-07-01',monthly:{},packages:[]}],groups:[],lessons:[],payments:[],instructors:[],packageTypes:[],campaigns:[]}));
    // Senkron ayarlari da dolu olsun (gercek cihazda dolu olacak) — yine de bulut KAPALI kalmali
    w.localStorage.setItem('pilateria_sync', JSON.stringify({key:'GERCEKKEY',bin:'GERCEKBIN',enabled:true,baseRev:7}));
  }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const realBefore = () => w.localStorage.getItem('pilateria');
const REAL_SNAPSHOT = realBefore();

setTimeout(async ()=>{ try {
  console.log('[1] Ilk acilis: gercek yerel veriden KOPYA alinir');
  t('preview anahtari olustu', !!w.localStorage.getItem('pilateria_preview'));
  t('gercek uye goruluyor', w.eval(`state.members.some(m=>m.name==='GERCEK UYE')`));

  console.log('[2] Degisiklikler YALNIZ preview anahtarina yazilir');
  w.eval(`state.members.push({id:'mPV',name:'ONIZLEME UYE',joinDate:'2026-07-14',monthly:{},packages:[]}); save();`);
  t('preview kaydina yazildi', (w.localStorage.getItem('pilateria_preview')||'').includes('ONIZLEME UYE'));
  t('GERCEK kayit DEGISMEDI', realBefore() === REAL_SNAPSHOT);
  t('gercek dirty bayragi KIRLENMEDI', w.localStorage.getItem('pilateria_dirty') === null);

  console.log('[3] Bulut TAMAMEN kapali (sync ayarlari dolu olsa bile)');
  fetchCount = 0;
  await w.autoPush();
  await w.autoPullIfNeeded('test');
  const p1 = await w.pushToCloud(false);
  const p2 = await w.pullFromCloud(false);
  t('hicbir fetch atilmadi', fetchCount === 0, fetchCount);
  t('push/pull false doner', p1 === false && p2 === false);

  console.log('[4] Gorsel isaretler');
  t('onizleme bandi var', !!d.getElementById('preview-band'));
  t('band gercek uygulamaya link verir', (d.getElementById('preview-band').innerHTML||'').includes('pilateria.html'));
  t('surum -onizleme etiketli', w.eval('APP_VERSION').includes('onizleme'));

  console.log('[5] Sifirlama yalniz onizlemeyi siler');
  w.eval(`localStorage.removeItem('pilateria_preview')`);
  t('gercek veri hala yerinde', realBefore() === REAL_SNAPSHOT);

  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi`);
  process.exit(fail?1:0);
} catch(err) { console.error('TEST HATASI:', err); process.exit(1); } }, 700);
