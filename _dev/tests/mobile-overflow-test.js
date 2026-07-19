// v63 — TELEFON EKRAN TASMALARI: undefined kisilik + mobil CSS kurallari
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
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  console.log('[1] "undefined kisilik" bitti (grup/eski odemede size tanimsiz)');
  w.eval(`
    state.members=[{id:'m1',name:'NURDAN AKYILDIZ',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}},
                   {id:'m2',name:'NISA',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}];
    state.groups=[{id:'G',name:'G',size:4,memberIds:['m1'],monthlyMembers:{},packages:[]}];
    state.payments=[
      {id:'P1',memberId:'m1',groupId:'G',date:'2026-07-19',packageMonth:'2026-07',amount:4500,method:'cash',pkgName:'4 KİŞİLİK (İNDİRİMLİ)',sessions:8},        // size YOK
      {id:'P2',memberId:'m2',groupId:'',date:'2026-07-19',packageMonth:'2026-07',amount:6500,method:'IBAN',pkgName:'Özel Paket',sessions:8,size:1}               // size VAR
    ];
  `);
  d.getElementById('pay-month').value=''; d.getElementById('pay-member-filter').value='';
  w.renderPayments();
  const tb=d.getElementById('payments-tbody').innerHTML;
  t('cikti "undefined kisilik" ICERMEZ', !/undefined/.test(tb), tb.match(/[^>]*undefined[^<]*/)||'temiz');
  t('size tanimsizsa "8 ders" yazar (kisilik yok)', /8 ders</.test(tb) || /8 ders<\/small/.test(tb) || tb.includes('8 ders'), '');
  t('size varsa "8 ders · 1 kişilik"', /8 ders · 1 kişilik/.test(tb), '');
  t('uzun grup adi yine gorunur (icerik kaybi yok)', /NURDAN AKYILDIZ/.test(tb));

  console.log('[2] Mobil CSS kurallari mevcut (kaynak dosyada)');
  t('geniş tablo mobilde overflow-x:auto (sticky :has ezildi)', html.includes('.table-wrap:has(table.sticky-head), .table-wrap:has(thead.sticky-thead) { overflow-x:auto !important'));
  t('main padding-bottom 176px (FAB clearance)', html.includes('padding-bottom: calc(176px + env(safe-area-inset-bottom, 0px))'));
  t('card-title + cocuklari zorla wrap', html.includes('table.resp-cards td.card-title, table.resp-cards td.card-title * { white-space:normal !important'));
  t('card small wrap', html.includes('table.resp-cards td small { display:inline-block; max-width:100%'));
  t('toolbar mobilde sarilir', html.includes('.toolbar { flex-wrap:wrap; gap:8px; }') && html.includes('.toolbar > button { flex:1 1 100%; }'));
  t('resp-cards KART modunda min-width sifir (kart ekrandan genis olmaz)', html.includes('table.resp-cards, table.resp-cards tr, table.resp-cards td { min-width:0 !important'));

  console.log('[3] Butunluk: yatay tasma kilidi + alt bar hala var');
  t('html,body overflow-x:hidden (768 alti)', html.includes('html, body { max-width:100vw; overflow-x:hidden; }'));
  t('.table-wrap overflow-x auto (temel)', /\.table-wrap \{ overflow-x: auto;/.test(html));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
