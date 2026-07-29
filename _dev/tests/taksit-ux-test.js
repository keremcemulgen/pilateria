// v123 — TAKSIT UX: kalan on-doldurma + bakiye seridi + mobil/grup "Odendi" duzeltmesi
// Yamasiz build'de FAIL etmek ZORUNDA (delik kaniti), yamali build'de PASS.
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
  w.eval('window.S=()=>state;');
  const cm = w.eval('currentMonth()');
  w.eval(`
    state.settings.groupPackageDays=30;
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.campaigns=[];
    state.members=[
      {id:'a',name:'AYSE',joinDate:'2026-01-01',totalPrice:1500,packages:[],monthly:{'${cm}':{enrolled:true}}},
      {id:'b',name:'BANU',joinDate:'2026-01-01',totalPrice:1500,packages:[],monthly:{'${cm}':{enrolled:true}}},
      {id:'d',name:'DILA',joinDate:'2026-01-01',totalPrice:1500,packages:[],monthly:{'${cm}':{enrolled:true}}}
    ];
    state.groups=[{id:'g1',name:'BANU - DILA',size:2,memberIds:['b','d'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'10:00',defaultDays:[1],packages:[],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[];
    state.payments=[
      {id:'py1',memberId:'a',groupId:'',date:'${cm}-05',amount:500,listPrice:1500,sessions:8,method:'Nakit',packageMonth:'${cm}',pkgName:'8 Ders',discount:0},
      {id:'py2',memberId:'b',groupId:'g1',date:'${cm}-05',amount:500,listPrice:1500,sessions:8,method:'Nakit',packageMonth:'${cm}',pkgName:'8 Ders',discount:0},
      {id:'py3',memberId:'d',groupId:'g1',date:'${cm}-05',amount:1500,listPrice:1500,sessions:8,method:'Nakit',packageMonth:'${cm}',pkgName:'8 Ders',discount:0}
    ];`);

  console.log('[1] bireysel: modal KALANI on-doldurur + bakiye seridi');
  w.openPaymentModal('a');
  t('mp-amount = 1000 (1500 degil)', +d.getElementById('mp-amount').value === 1000, d.getElementById('mp-amount').value);
  const bal = d.getElementById('mp-balance');
  t('mp-balance var ve gorunur', !!bal && bal.style.display === 'block');
  t('seritte Odenen 500 + Kalan 1.000', !!bal && /Ödenen/.test(bal.innerHTML) && /1\.000/.test(bal.innerHTML), bal ? bal.textContent.slice(0,120) : 'yok');
  t('seritte "taksit" kelimesi geciyor', !!bal && /taksit/i.test(bal.innerHTML));
  w.closeModal('modal-payment');

  console.log('[2] grup uyesi: kilit KALANA kilitlenir');
  w.openPaymentModal('b', null, 'g1');
  t('grup uyesinde mp-amount = 1000', +d.getElementById('mp-amount').value === 1000, d.getElementById('mp-amount').value);
  t('tutar kilitli (readOnly)', d.getElementById('mp-amount').readOnly === true);
  const bal2 = d.getElementById('mp-balance');
  t('grup seridi Kalan 1.000 gosterir', !!bal2 && /1\.000/.test(bal2.innerHTML), bal2 ? bal2.textContent.slice(0,120) : 'yok');
  w.closeModal('modal-payment');

  console.log('[3] tam odemis grup uyesi: 0 on-dolum YOK, serit "tamamen odendi"');
  w.openPaymentModal('d', null, 'g1');
  t('tam odemiste tutar 1500 kalir (0 degil)', +d.getElementById('mp-amount').value === 1500, d.getElementById('mp-amount').value);
  const bal3 = d.getElementById('mp-balance');
  t('serit tamamen odendi der', !!bal3 && /tamamen ödendi/.test(bal3.innerHTML), bal3 ? bal3.textContent.slice(0,120) : 'yok');
  w.closeModal('modal-payment');

  console.log('[4] mobil kart: kismi odeyen grup uyesi ODENDI DEGIL, Kalan gorunur');
  w.eval(`renderMembersCardsMobile(buildMemberRows('${cm}'), '${cm}');`);
  const cards = d.getElementById('members-cards').innerHTML;
  t('BANU kartinda 🟡 Kismi 500/1.500', /Kısmi\s*500\/1\.500/.test(cards), (cards.match(/mc-status[^<]*<?[^<]*/g)||[]).join(' | ').slice(0,150));
  t('BANU kartinda ✅ Odendi YOK (kismi)', !/BANU[\s\S]{0,300}✅ Ödendi/.test(cards));
  t('grup uyesi kartinda Kalan satiri var', /Kalan <b[^>]*>1\.000/.test(cards));
  t('DILA (tam odemis) ✅ Odendi', /DILA[\s\S]{0,300}✅ Ödendi/.test(cards));

  console.log('[5] grup detayi: kismi uye sari + Kalan');
  w.openGroupDetail('g1', cm);
  const gd = d.getElementById('gd-content').innerHTML;
  t('grup detayinda Kismi 500', /Kısmi\s*500\/1\.500/.test(gd));
  t('grup detayinda Kalan 1.000', /Kalan 1\.000/.test(gd));
  t('DILA satiri ✅ Odendi', /DILA[\s\S]{0,600}✅ Ödendi/.test(gd) || /✅ Ödendi[\s\S]{0,600}DILA/.test(gd));

  console.log('[6] uye detayi: TL kalan bakiye gorunur');
  w.openMemberDetail('a');
  t('uye detayinda "Kalan 1.000 ₺ — taksit devam"', /Kalan 1\.000 ₺ — taksit devam/.test(d.body.innerHTML));

  console.log('[7] metinler');
  t('checkbox "Farklı tutar gir (taksit" oldu', html.includes('Farklı tutar gir (taksit'));
  t('eski "Özel fiyat girmek istiyorum" kalkti', !html.includes('Özel fiyat girmek istiyorum'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
