// v110 — TAKSIT KANONU: cok odeme serbest, tanimli fiyat ASILMAZ; hoca maasi odenenden BAGIMSIZ;
// yesil = TAM odeme; toplu grup odemesi kalanla sinirlanir; tik kalani tahsil eder.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{}; }});
const w=dom.window,d=w.document;
const alerts=[]; w.alert=(m)=>alerts.push(String(m||''));
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  w.eval("['renderCalendar','renderDashboard','renderPayments','renderReports','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','autoCompletePackages','renderGroups'].forEach(fn=>window[fn]=function(){});");
  w.eval(`state.settings.instructorShareRate=30;
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:5000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'z',name:'ZEYNEP',joinDate:'2026-01-01',totalPrice:5000,instructorId:'h1',packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:5000,status:'active'}],monthly:{'2026-07':{enrolled:true}}},
      {id:'q',name:'FIYATSIZ',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}}},
      {id:'a',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4000}}},
      {id:'b',name:'BANU',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4000}}}
    ];
    state.groups=[{id:'g1',name:'AYSE - BANU',size:2,memberIds:['a','b'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'10:00',defaultDays:[2],packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:0,status:'active'}],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[
      {id:'L1',date:'2026-07-06',time:'10:00',status:'completed',memberIds:['z'],groupId:'',size:1,instructorId:'h1',packageMonth:'2026-07'},
      {id:'L2',date:'2026-07-08',time:'11:00',status:'completed',memberIds:['z'],groupId:'',size:1,instructorId:'h1',packageMonth:'2026-07'}
    ];
    state.payments=[];
    const mm=document.getElementById('member-month'); if(mm){mm.innerHTML='<option value="2026-07">Tem</option>';mm.value='2026-07';}
  `);
  const setPayModal = (memberId, groupId, amount, editId)=> w.eval(`
    document.getElementById('mp-id').value='${editId||''}';
    document.getElementById('mp-member').innerHTML='<option value="${memberId}" selected>x</option>';
    document.getElementById('mp-member').value='${memberId}';
    document.getElementById('mp-group').value='${groupId||''}';
    document.getElementById('mp-date').value='2026-07-10';
    (document.getElementById('mp-pkg-month')||{}).innerHTML='<option value="2026-07" selected>Tem</option>';
    (document.getElementById('mp-pkg-month')||{}).value='2026-07';
    document.getElementById('mp-pkg').value='';
    document.getElementById('mp-sessions').value='';
    document.getElementById('mp-list').value='';
    document.getElementById('mp-amount').value='${amount}';
    document.getElementById('mp-note').value='';
    document.getElementById('mp-campaign').value='';
  `);
  const paysOf=(mid)=>w.eval(`state.payments.filter(p=>p.memberId==='${mid}')`);
  const sumOf=(mid)=>paysOf(mid).reduce((a,p)=>a+(+p.amount||0),0);

  console.log('[1] TAKSIT: 2000+2000 OK; +1500 TAVANI ASAR -> BLOKE; edit ile 3000 -> toplam 5000 OK');
  setPayModal('z','',2000); w.savePayment();
  t('1. taksit kaydedildi', paysOf('z').length===1, paysOf('z').length);
  setPayModal('z','',2000); w.savePayment();
  t('2. taksit kaydedildi (mukerrer engeli KALKTI)', paysOf('z').length===2, paysOf('z').length);
  alerts.length=0;
  setPayModal('z','',1500); w.savePayment();
  t('tavan asimi BLOKE (hala 2 kayit)', paysOf('z').length===2, paysOf('z').length);
  t('uyari kalani soyluyor (1.000)', alerts.some(a=>a.includes('En fazla') && a.includes('1.000')), alerts.join('|').slice(0,150));
  const p1id = paysOf('z')[0].id;
  setPayModal('z','',3000,p1id); w.savePayment();
  t('EDIT: 2000->3000 OK (toplam 5000 = tavan)', sumOf('z')===5000, sumOf('z'));
  alerts.length=0;
  setPayModal('z','',1,undefined); w.savePayment();
  t('tavan doluyken +1₺ bile BLOKE', sumOf('z')===5000, sumOf('z'));

  console.log('[2] FIYATSIZ uye: 1. odeme OK, 2. odeme eski mukerrer korumasi');
  setPayModal('q','',1000); w.savePayment();
  t('fiyatsiz 1. odeme OK', paysOf('q').length===1);
  alerts.length=0;
  setPayModal('q','',500); w.savePayment();
  t('fiyatsiz 2. odeme BLOKE (fiyat tanimla yonlendirmesi)', paysOf('q').length===1 && alerts.some(a=>a.includes('TANIMLI fiyatı yok')), alerts.join('|').slice(0,120));

  console.log('[3] HOCA MAASI odemeden BAGIMSIZ (2 ders x 5000/8 x %30 = 375)');
  const earn = w.eval("instructorEarningsForMonth('h1','2026-07').total");
  t('kismi odemeyle maas degismedi: 375', Math.abs(earn-375)<0.01, earn);

  console.log('[4] TOPLU GRUP ODEMESI: a kismi (1500) -> kalan 2500; b tam 4000; toplam 6500');
  w.eval(`state.payments.push({id:'gp1',memberId:'a',groupId:'g1',date:'2026-07-05',amount:1500,method:'cash',packageMonth:'2026-07'});`);
  w.eval(`
    document.getElementById('mp-group').value='g1';
    document.getElementById('mp-date').value='2026-07-12';
    (document.getElementById('mp-pkg-month')||{}).innerHTML='<option value="2026-07" selected>Tem</option>';
    (document.getElementById('mp-pkg-month')||{}).value='2026-07';
    document.getElementById('mp-pkg').value=''; document.getElementById('mp-sessions').value='';
    document.getElementById('mp-list').value=''; document.getElementById('mp-amount').value='4000';
    document.getElementById('mp-note').value=''; document.getElementById('mp-campaign').value='';
  `);
  w.saveGroupPaymentAll();
  const aPays = w.eval("state.payments.filter(p=>p.memberId==='a'&&p.groupId==='g1')");
  const bPays = w.eval("state.payments.filter(p=>p.memberId==='b'&&p.groupId==='g1')");
  t('a: kalanla sinirlandi (1500+2500=4000)', aPays.reduce((x,p)=>x+p.amount,0)===4000, JSON.stringify(aPays.map(p=>p.amount)));
  t('b: tam 4000', bPays.reduce((x,p)=>x+p.amount,0)===4000);

  console.log('[5] RENK: TAM odeyen yesil; grup komple yesil (v109 + v110 tam-odeme kurali)');
  w.renderMembers();
  const grpRows=[...d.querySelectorAll('#members-table tbody tr.grp-row')].filter(tr=>!tr.className.includes('grp-empty'));
  t('a satiri pay-ok (tam)', grpRows[0].className.includes('pay-ok'), grpRows[0].className);
  t('grup label komple yesil (grp-all-paid)', d.querySelector('#members-table td.grp-name-cell').className.includes('grp-all-paid'));

  console.log('[6] KISMI odeyen bireysel SARI kalir (yesil = TAM odeme)');
  w.eval(`state.payments = state.payments.filter(p=>p.memberId!=='q');
    state.payments.push({id:'qq1',memberId:'q',date:'2026-07-11',amount:700,method:'cash',packageMonth:'2026-07'});
    state.members.find(x=>x.id==='q').totalPrice = 2000;`);
  w.renderMembers();
  const indivRows=[...d.querySelectorAll('#members-table tbody tr')].filter(tr=>tr.innerHTML.includes('FIYATSIZ'));
  t('kismi (700/2000) bireysel PAY-DUE', indivRows[0] && indivRows[0].className.includes('pay-due'), indivRows[0]&&indivRows[0].className);
  w.eval(`state.payments.push({id:'qq2',memberId:'q',date:'2026-07-12',amount:1300,method:'cash',packageMonth:'2026-07'});`);
  w.renderMembers();
  const indivRows2=[...d.querySelectorAll('#members-table tbody tr')].filter(tr=>tr.innerHTML.includes('FIYATSIZ'));
  t('tamamlaninca (2000/2000) PAY-OK', indivRows2[0] && indivRows2[0].className.includes('pay-ok'), indivRows2[0]&&indivRows2[0].className);

  console.log('[7] TIK kalani tahsil eder (a uyesi degil; z zaten tam — q ile: sil, kismi kur, tikle)');
  w.eval(`state.payments = state.payments.filter(p=>p.memberId!=='q');
    state.payments.push({id:'qq3',memberId:'q',date:'2026-07-11',amount:600,method:'cash',packageMonth:'2026-07'});`);
  w.eval("togglePaidTick('q','',null,'2026-07')");
  setTimeout(()=>{
    const qSum = w.eval("state.payments.filter(p=>p.memberId==='q').reduce((a,p)=>a+(+p.amount||0),0)");
    t('tik KALANI (1400) tahsil etti -> toplam 2000', qSum===2000, qSum);
    console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
    process.exit(fail?1:0);
  }, 120);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
