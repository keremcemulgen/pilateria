// v128 — CSV + yazdirilabilir rapor + makbuz + trend. Yamasiz build'de FAIL etmeli.
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
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
    w.print=()=>{w.__printed=(w.__printed||0)+1;};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  const cm = w.eval('currentMonth()');
  w.eval(`
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[{id:'m1',name:'AYSE',phone:'0555',joinDate:'2026-01-01',birthday:'1990-05-05',totalPrice:1500,tcno:'12345678901',adres:'Test Mah. No:1',packages:[],monthly:{'${cm}':{enrolled:true}}}];
    state.groups=[]; state.lessons=[]; state.campaigns=[];
    state.payments=[
      {id:'py1',memberId:'m1',groupId:'',date:'${cm}-05',amount:1000,listPrice:1500,sessions:8,method:'Nakit',packageMonth:'${cm}',pkgName:'8 Ders'},
      {id:'py2',memberId:'m1',groupId:'',date:'${cm}-08',amount:-200,listPrice:0,sessions:0,method:'Nakit',packageMonth:'${cm}',pkgName:'8 Ders',refund:true,note:'2 ders iadesi'}
    ];
    state.instructorPayouts=[{id:'ip1',instructorId:'h1',year:+('${cm}'.split('-')[0]),month:+('${cm}'.split('-')[1]),amount:100,paidDate:'${cm}-06',note:''}];
    state.expenses=[{id:'e1',date:'${cm}-03',category:'Kira',amount:300,note:'kira'}];`);

  console.log('[1] CSV metin uretici');
  t('__csvText var', w.eval("typeof __csvText==='function'"));
  const csv = w.eval("typeof __csvText==='function' ? __csvText([['a;b','c\"d'],['x',5]]) : ''");
  t('sep=; ile baslar', csv.indexOf('sep=;') === 0, JSON.stringify(csv.slice(0,12)));
  t('noktali virgullu deger tirnaklanir', csv.indexOf('"a;b"') !== -1);
  t('cift tirnak kacislanir', csv.indexOf('"c""d"') !== -1);
  t('CRLF kullanir', csv.indexOf('\r\n') !== -1);

  console.log('[2] CSV satir kuruculari');
  const pr = w.eval("typeof buildPaymentsCsvRows==='function' ? JSON.stringify(buildPaymentsCsvRows('"+cm+"')) : '[]'");
  t('tahsilat: baslik + 2 satir', JSON.parse(pr).length === 3, pr.slice(0,80));
  t('iade satiri IADE etiketi + -200', /İADE/.test(pr) && /-200/.test(pr));
  const mr = w.eval("typeof buildMembersCsvRows==='function' ? JSON.stringify(buildMembersCsvRows('"+cm+"')) : '[]'");
  t('uye: AYSE + kalan 700 (1500-800)', /AYSE/.test(mr) && /"700"/.test(mr), mr.slice(0,200));
  t('uye CSV TC ICERMEZ (gizlilik)', !/12345678901/.test(mr));
  const er = w.eval("typeof buildExpensesCsvRows==='function' ? JSON.stringify(buildExpensesCsvRows('"+cm+"')) : '[]'");
  t('gider: Kira 300', /Kira/.test(er) && /"300"/.test(er));

  console.log('[3] MAKBUZ');
  t('printReceipt var', w.eval("typeof printReceipt==='function'"));
  if (w.eval("typeof printReceipt==='function'")) {
    w.printReceipt('py1');
    const rc = (d.getElementById('print-receipt')||{}).innerHTML || '';
    t('makbuzda TAHSILAT MAKBUZU + uye adi', /TAHSİLAT MAKBUZU/.test(rc) && /AYSE/.test(rc));
    t('makbuzda TC ve adres kullanildi', /12345678901/.test(rc) && /Test Mah/.test(rc));
    t('makbuzda tutar 1.000', /1\.000/.test(rc));
    t('window.print cagrildi', (w.__printed||0) >= 1);
    t('govde print-receipt moduna gecti', d.body.classList.contains('pl-print-receipt'));
    w.eval("window.dispatchEvent(new Event('afterprint'))");
    t('afterprint sonrasi mod kalkti', !d.body.classList.contains('pl-print-receipt'));
    w.printReceipt('py2');
    t('iade makbuzu IADE MAKBUZU der', /İADE MAKBUZU/.test((d.getElementById('print-receipt')||{}).innerHTML||''));
    w.eval("window.dispatchEvent(new Event('afterprint'))");
  }

  console.log('[4] TREND');
  t('renderTrendChart var', w.eval("typeof renderTrendChart==='function'"));
  w.eval("document.getElementById('rep-month') && (document.getElementById('rep-month').value='"+cm+"');");
  w.renderReports();
  const tc = (d.getElementById('trend-chart')||{}).innerHTML || '';
  t('trend SVG cizildi', /<svg/.test(tc), 'uzunluk=' + tc.length);
  t('24 cubuk (12 ay x 2 seri)', (tc.match(/<rect/g)||[]).length === 24, (tc.match(/<rect/g)||[]).length);
  t('lejant: Tahsilat + Net Kar', /Tahsilat/.test(tc) && /Net Kâr/.test(tc));
  t('hover tooltip (title) var', (tc.match(/<title>/g)||[]).length === 12);
  t('renkler tema degiskeninden', /var\(--tc-rev\)/.test(tc) && /var\(--tc-net\)/.test(tc));

  console.log('[5] STATIK');
  t('print CSS mevcut', html.includes('@media print') && html.includes('pl-print-receipt'));
  t('rapor dugmeleri mevcut', html.includes('exportPaymentsCsv()') && html.includes('Yazdır / PDF'));
  t('odeme satirinda makbuz dugmesi', html.includes("printReceipt('${p.id}')"));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
