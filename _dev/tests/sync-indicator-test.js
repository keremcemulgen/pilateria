// v124 — SENKRON GOSTERGESI DIRILIYOR + hata gorunurlugu + switchPage zirhi
// Yamasiz build'de FAIL etmeli: setCloudDot SUPABASE_MODE'da her zaman gizler (syncConfigured=false).
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=(m)=>{w.__a=m;};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  console.log('[1] bulut noktasi SUPABASE modunda GORUNUR olmali');
  w.eval('sbClient = { __fake: true };'); // istemci hazirmis gibi
  w.setCloudDot('ok');
  const dot = d.getElementById('cloud-dot');
  t('cloud-dot display=inline-block (gizli DEGIL)', !!dot && dot.style.display === 'inline-block', dot ? dot.style.display : 'yok');
  t('cloud-dot ✓ isareti', !!dot && /☁️✓/.test(dot.textContent), dot ? dot.textContent : '');

  console.log('[2] son gonderim zamani Supabase kaynagindan gelir');
  w.eval('__sbLastPushAt = Date.now();');
  w.setCloudDot('ok');
  const line = d.getElementById('dash-sync-status');
  t('panel satiri "son gönderim" yazar', !!line && /son gönderim/.test(line.textContent), line ? line.textContent : 'yok');

  console.log('[3] cevrimdisi durum KIRMIZI ve panelde aciktir');
  w.setCloudDot('offline');
  t('offline: nokta basligi Gonderilemedi', !!dot && /Gönderilemedi/.test(dot.title), dot ? dot.title : '');
  t('offline: nokta rengi kirmizi', !!dot && /198,\s*40,\s*40|#c62828/i.test(dot.style.color), dot ? dot.style.color : '');
  t('offline: panel GONDERILEMIYOR uyarisi', !!line && /GÖNDERİLEMİYOR/.test(line.textContent), line ? line.textContent.slice(0,80) : '');

  console.log('[4] noktaya dokunmak Supabase esitlemesi tetikler');
  w.eval("window.sbResync = function(r){ window.__resyncCalled = r; return Promise.resolve(); };");
  w.cloudDotClick();
  t('cloudDotClick -> sbResync(manual)', w.eval('window.__resyncCalled') === 'manual', String(w.eval('window.__resyncCalled')));

  console.log('[5] yakalanmamis hatalar kayda gecer');
  w.eval("window.dispatchEvent(new ErrorEvent('error', {message:'KASITLI-TEST-HATASI'}))");
  const errs = w.eval('window.__pilErrors ? window.__pilErrors.length : -1');
  t('__pilErrors dolu', errs >= 1, String(errs));
  t('mesaj yakalandi', errs >= 1 && /KASITLI-TEST-HATASI/.test(w.eval('JSON.stringify(window.__pilErrors)')));
  const before = errs;
  w.eval("window.dispatchEvent(new Event('unhandledrejection'))");
  t('promise reddi de kayda gecer', w.eval('window.__pilErrors ? window.__pilErrors.length : -1') > before);

  console.log('[6] switchPage: bir sayfanin cokmesi gecisi COKERTMEZ');
  w.eval("renderPayments = function(){ throw new Error('BOOM-RENDER'); };");
  let threw = false;
  try { w.switchPage('payments'); } catch(e) { threw = true; }
  t('switchPage firlatmadi', !threw);
  t('sayfa yine de aktiflesti', d.getElementById('page-payments').classList.contains('active'));
  t('render hatasi kayda gecti', /BOOM-RENDER/.test(w.eval('JSON.stringify(window.__pilErrors||[])')));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
