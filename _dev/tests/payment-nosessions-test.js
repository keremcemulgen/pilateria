// v2026.07.18.05 — odeme ders-sayisi/paket ZORUNLU degil; ders hakki odemeden bagimsiz; odeme=odendi gostergesi; PC tam genislik+zoom
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
    w.alert=(m)=>{w.__lastAlert=m;};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  w.eval("['renderPayments','renderDashboard','renderMembers','renderCalendar','renderReports','renderGroups','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen'].forEach(fn=>window[fn]=function(){});");
  w.eval(`state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8500}];
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}},totalPrice:8500,defaultPackageId:'p1'}];
    state.groups=[]; state.lessons=[]; state.payments=[];
    const mmSel=document.getElementById('member-month'); if(mmSel){mmSel.innerHTML='<option value="2026-07">7</option>';mmSel.value='2026-07';}`);

  console.log('[1] odeme modali: ders sayisi OTOMATIK dolar (bos degil), zorunlu degil');
  w.openPaymentModal('m1', null, '', '2026-07');
  const sessVal = d.getElementById('mp-sessions').value;
  t('mp-sessions otomatik doldu (8)', +sessVal===8, sessVal);
  t('mp-sessions min=0 (opsiyonel)', d.getElementById('mp-sessions').getAttribute('min')==='0');

  console.log('[2] DERS SAYISI BOS + tutar girili -> odeme KAYDOLUR (blok yok)');
  d.getElementById('mp-sessions').value=''; // KASITLI bos birak
  d.getElementById('mp-amount').value='8500';
  d.getElementById('mp-date').value='2026-07-15';
  const before = w.S().payments.length;
  w.savePayment();
  t('odeme kaydedildi (ders sayisi bos olsa da)', w.S().payments.length===before+1, 'payments='+w.S().payments.length);
  const pay = w.S().payments[w.S().payments.length-1];
  t('tutar dogru (8500)', +pay.amount===8500, pay&&pay.amount);
  t('sessions otomatik 8 atandi (paket tipi)', +pay.sessions===8, pay&&pay.sessions);

  console.log('[3] ODEME = odendi gostergesi (memberPaidInMonth true)');
  t('AYSE bu ay ODEDI gorunuyor', w.memberPaidInMonth('m1','2026-07')===true);

  console.log('[4] DERS HAKKI odemeden bagimsiz kaldi (hala 8, odeme onu artirmadi)');
  t('kalan ders 8 (odeme hakki degistirmedi)', w.sessionsRemainingFor('member','m1','2026-07')===8, w.sessionsRemainingFor('member','m1','2026-07'));

  console.log('[5] PAKET SECILMEDEN de odeme alinir');
  w.eval(`state.members.push({id:'m2',name:'ZEHRA',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}},totalPrice:5000}); state.members.find(x=>x.id==='m2').defaultPackageId='';`);
  w.openPaymentModal('m2', null, '', '2026-07');
  d.getElementById('mp-pkg').value=''; // paket YOK
  d.getElementById('mp-sessions').value='';
  d.getElementById('mp-amount').value='5000';
  d.getElementById('mp-date').value='2026-07-16';
  const before2 = w.S().payments.length;
  w.savePayment();
  t('paket secilmeden odeme kaydedildi', w.S().payments.length===before2+1, 'payments='+w.S().payments.length);
  t('ZEHRA odedi gorunuyor', w.memberPaidInMonth('m2','2026-07')===true);
  t('ZEHRA kalan ders yine 8 (odemeden bagimsiz)', w.sessionsRemainingFor('member','m2','2026-07')===8, w.sessionsRemainingFor('member','m2','2026-07'));

  console.log('[6] GRUP toplu odeme de ders sayisi zorunlu degil');
  w.eval(`state.groups=[{id:'g1',name:autoGroupName(['m1','m2']),size:2,memberIds:['m1','m2'],defaultInstructorId:'',defaultPackageId:'p1',defaultTime:'',defaultDays:[],packages:[],monthlyMembers:{},monthlyNotes:{}}];
    state.payments=[];`);
  d.getElementById('mp-group').value='g1';
  d.getElementById('mp-pkg-month').value='2026-07';
  d.getElementById('mp-sessions').value=''; // bos
  d.getElementById('mp-amount').value='4250';
  d.getElementById('mp-date').value='2026-07-17';
  w.saveGroupPaymentAll();
  t('grup toplu odeme ders sayisi bos olsa da kaydedildi', w.S().payments.length===2, 'payments='+w.S().payments.length);

  console.log('[7] PC tam genislik + zoom CSS mevcut');
  t('main tam genislik (max-width:none)', html.includes('main{max-width:none'));
  t('masaustu zoom media query', html.includes('@media (min-width:1200px){ body{ zoom:1.12; } }'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('HATA', e&&e.stack||e); process.exit(1); } }, 1500);
