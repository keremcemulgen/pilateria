// v111 — ODEMEDE PAKET ADI = UYENIN O AY ALDIGI PAKET:
// [1] Kanon: ay override > uye varsayilani > kayitli damga (yedek). ESKI yanlis damgalar da duzelir.
// [2] Grup detay 'Grup Odemeleri' listesi dogru adi gosterir (Kerem ekran goruntusu senaryosu).
// [3] Tik ile olusan odeme UYENIN paketiyle damgalanir (grubun varsayilani DEGIL).
// [4] Toplu grup odemesi uye-bazli paket damgalar.
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
  w.eval("['renderCalendar','renderDashboard','renderPayments','renderReports','refreshMemberDetailIfOpen','autoCompletePackages','renderMembers','renderGroups'].forEach(fn=>window[fn]=function(){});");
  w.eval(`
    state.packageTypes=[
      {id:'ptI',name:'4 KİŞİLİK (İNDİRİMLİ)',sessions:8,price:3500,size:4},
      {id:'ptK',name:'4 KİŞİLİK (KİŞİ BAŞI)',sessions:8,price:4500,size:4}
    ];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'c',name:'CEREN',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4500,packageId:'ptK'}}},
      {id:'m2',name:'MERVE',joinDate:'2026-01-01',defaultPackageId:'ptK',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4500}}},
      {id:'m3',name:'PAKETSIZ',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4500}}}
    ];
    state.groups=[{id:'g1',name:'GRUP',size:4,memberIds:['c','m2','m3'],defaultInstructorId:'h1',defaultPackageId:'ptI',defaultTime:'10:00',defaultDays:[2],
      packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:0,status:'active'}],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[]; state.payments=[];
    const mm=document.getElementById('member-month'); if(mm){mm.innerHTML='<option value="2026-07">Tem</option>';mm.value='2026-07';}
  `);

  console.log('[1] KANON: eski YANLIS damgali kayit bile dogru gorunur');
  w.eval(`state.payments.push({id:'old1',memberId:'c',groupId:'g1',date:'2026-07-19',amount:4500,method:'Nakit',packageMonth:'2026-07',pkgName:'4 KİŞİLİK (İNDİRİMLİ)',sessions:8});`);
  t('CEREN (ay override ptK): İNDİRİMLİ damgasina ragmen KİŞİ BAŞI', w.eval("paymentPkgLabel(state.payments[0])")==='4 KİŞİLİK (KİŞİ BAŞI)', w.eval("paymentPkgLabel(state.payments[0])"));
  w.eval(`state.payments.push({id:'old2',memberId:'m3',date:'2026-07-20',amount:4500,method:'Nakit',packageMonth:'2026-07',pkgName:'ESKI DAMGA',sessions:8});`);
  t('PAKETSIZ uye: yedek olarak kayitli damga', w.eval("paymentPkgLabel(state.payments[1])")==='ESKI DAMGA');

  console.log('[2] GRUP DETAY listesi dogru adi basar');
  w.openGroupDetail('g1');
  const gdHtml = d.getElementById('modal-group-detail').innerHTML;
  t('listede KİŞİ BAŞI (CEREN satiri)', gdHtml.includes('4 KİŞİLİK (KİŞİ BAŞI)'), 'yok');
  t('İNDİRİMLİ damgasi listede YOK (CEREN icin)', (gdHtml.match(/4 KİŞİLİK \\(İNDİRİMLİ\\)/g)||[]).length <= 1);
  w.eval("closeModal('modal-group-detail')");

  console.log('[3] TIK: uyenin paketiyle damgalar (grup varsayilani ptI DEGIL)');
  w.eval("togglePaidTick('m2','g1',null,'2026-07')");
  setTimeout(()=>{
    const p2 = w.eval("state.payments.find(p=>p.memberId==='m2')");
    t('MERVE tik odemesi KİŞİ BAŞI damgali (uye varsayilani)', p2 && p2.pkgName==='4 KİŞİLİK (KİŞİ BAŞI)', p2&&p2.pkgName);

    console.log('[4] TOPLU GRUP ODEMESI: uye-bazli damga');
    w.eval(`state.payments=[];
      document.getElementById('mp-group').value='g1';
      document.getElementById('mp-date').value='2026-07-23';
      (document.getElementById('mp-pkg-month')||{}).innerHTML='<option value="2026-07" selected>Tem</option>';
      (document.getElementById('mp-pkg-month')||{}).value='2026-07';
      document.getElementById('mp-pkg').value=''; document.getElementById('mp-sessions').value='';
      document.getElementById('mp-list').value=''; document.getElementById('mp-amount').value='4500';
      document.getElementById('mp-note').value=''; document.getElementById('mp-campaign').value='';
    `);
    w.saveGroupPaymentAll();
    const pc = w.eval("(state.payments.find(p=>p.memberId==='c')||{}).pkgName");
    const pm2 = w.eval("(state.payments.find(p=>p.memberId==='m2')||{}).pkgName");
    t('CEREN: KİŞİ BAŞI (ay override)', pc==='4 KİŞİLİK (KİŞİ BAŞI)', pc);
    t('MERVE: KİŞİ BAŞI (uye varsayilani)', pm2==='4 KİŞİLİK (KİŞİ BAŞI)', pm2);

    console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
    process.exit(fail?1:0);
  }, 120);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
