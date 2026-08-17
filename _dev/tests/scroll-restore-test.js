// v144 — MODAL KAPANINCA SAYFA KONUMU GERI GELIR (Kerem: "cikinca daha asagida aciliyor").
// Yamasiz build'de FAIL etmeli. Kural: ILK modal acilirken scrollY kaydedilir; SON modal
// kapaninca (closeModal VE popstate yolu) window.scrollTo(0, kayit) cagrilir; ic ice modallarda
// ara kapanislar konumu GERI GETIRMEZ ve acilislar kaydi EZMEZ.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let __scrollCalls = [];
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
    let sy = 0;
    Object.defineProperty(w, 'scrollY', { get(){ return sy; }, configurable:true });
    w.__setScrollY = v => { sy = v; };
    w.scrollTo = (x,y) => { __scrollCalls.push([x,y]); sy = y; };
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  const CM = w.eval('currentMonth()');
  w.eval(`state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:4000,packages:[],monthly:{'${CM}':{enrolled:true}}}];
    state.groups=[]; state.lessons=[]; state.payments=[];`);

  console.log('[1] TEK MODAL: acilista konum kaydedilir, kapanista AYNEN geri gelir');
  w.__setScrollY(1200);
  __scrollCalls = [];
  w.openMemberDetail('m1'); // uzun detay — kullanici bunun icinde gezinir
  w.__setScrollY(4800);     // arka sayfa sessizce asagi kaydi (Android govde kaymasi)
  w.closeModal('modal-member-detail');
  t('kapanista scrollTo(0,1200) cagrildi', __scrollCalls.some(c=>c[0]===0&&c[1]===1200), JSON.stringify(__scrollCalls));
  t('konum gercekten 1200e dondu', w.scrollY === 1200, w.scrollY);

  console.log('[2] IC ICE MODAL: ara kapanis konumu GERI GETIRMEZ, acilis kaydi EZMEZ');
  w.__setScrollY(800);
  __scrollCalls = [];
  w.openMemberDetail('m1');          // 1. modal (kayit: 800)
  w.__setScrollY(3000);
  w.eval("openModal('modal-payment')"); // 2. modal — kayit EZILMEMELI
  w.closeModal('modal-payment');
  t('ara kapanista restore YOK (stack bos degil)', !__scrollCalls.some(c=>c[1]===800), JSON.stringify(__scrollCalls));
  w.closeModal('modal-member-detail');
  t('son kapanista 800e doner (ic acilis kaydi ezmedi)', __scrollCalls.some(c=>c[1]===800) && w.scrollY===800, JSON.stringify(__scrollCalls));

  console.log('[3] POPSTATE YOLU (geri tusu) da konumu geri getirir');
  w.__setScrollY(600);
  __scrollCalls = [];
  w.openMemberDetail('m1');
  w.__setScrollY(2500);
  w.eval("__modalSuppressPopstate = false;");
  w.dispatchEvent(new w.PopStateEvent('popstate', { state: {} }));
  t('geri tusuyla kapanista scrollTo(0,600)', __scrollCalls.some(c=>c[1]===600), JSON.stringify(__scrollCalls));

  console.log('[4] SAVUNMA KATMANI: govde kilidi html seviyesinde de');
  t('html:has(body.pl-modal-open) kurali kaynakta', html.indexOf('html:has(body.pl-modal-open)') !== -1);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
