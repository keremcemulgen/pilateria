// v109 — GRUP TARIH TUTARLILIGI + SABIT RENK / KOMPLE-YESIL:
// [1] Grup uyelerinin paket baslangic/bitisi AYNI (grubun penceresi); ELLE override'li uye kendi tarihini korur.
// [2] Paket startDate yoksa grubun o ayin ILK DERSINDEN turetilir (yine herkes ayni).
// [3] Grup adi/birlesik hucreler SABIT renkli (CSS important); uye odedikce SATIRI yesil;
//     TUM uyeler odeyince hucrelere grp-all-paid gelir (komple yesil).
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
  w.eval("['renderCalendar','renderDashboard','renderPayments','renderReports','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','autoCompletePackages','renderGroups'].forEach(fn=>window[fn]=function(){});");
  const seed = (pkgStart)=> w.eval(`
    state.settings.groupPackageDays=30;
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:4500}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'m1',name:'GOKCE',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4500}}},
      {id:'m2',name:'SEZEN',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4500,packageStartDate:'2026-07-25'}}},
      {id:'m3',name:'TAMELLA',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true,totalPrice:4500}}}
    ];
    state.groups=[{id:'g1',name:'GOKCE - SEZEN - TAMELLA',size:4,memberIds:['m1','m2','m3'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'10:00',defaultDays:[2],
      packages:[{month:'2026-07',startDate:${pkgStart?("'"+pkgStart+"'"):'null'},sessions:8,price:0,status:'active'}],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[]; state.payments=[];
    const mm=document.getElementById('member-month'); if(mm){mm.innerHTML='<option value="2026-07">Tem</option>';mm.value='2026-07';}
  `);

  console.log('[1] Grup penceresi HERKESTE AYNI; elle override kendi tarihini korur');
  seed('2026-07-19');
  let rows = w.buildMemberRows('2026-07').filter(r=>r.groupId==='g1' && !r.isEmpty);
  t('3 uye satiri', rows.length===3, rows.length);
  t('GOKCE 19.07 (grup paketi)', rows.find(r=>r.memberId==='m1').pkgStart==='2026-07-19', rows.find(r=>r.memberId==='m1').pkgStart);
  t('TAMELLA 19.07 (ayni pencere — tutarsizlik bitti)', rows.find(r=>r.memberId==='m3').pkgStart==='2026-07-19');
  t('SEZEN 25.07 (ELLE override korunur)', rows.find(r=>r.memberId==='m2').pkgStart==='2026-07-25');
  t('bitis = baslangic+29 gun', rows.find(r=>r.memberId==='m1').pkgEnd==='2026-08-17');

  console.log('[2] Paket startDate YOKSA grubun ilk dersinden (pm kanonu) — yine herkes ayni');
  seed(null);
  w.eval(`state.lessons.push(
    {id:'L1',date:'2026-07-10',time:'10:00',status:'completed',groupId:'g1',size:4,memberIds:['m1','m3'],packageMonth:'2026-07'},
    {id:'L2',date:'2026-07-03',time:'10:00',status:'cancelled',groupId:'g1',size:4,memberIds:['m1'],packageMonth:'2026-07'});`);
  rows = w.buildMemberRows('2026-07').filter(r=>r.groupId==='g1' && !r.isEmpty);
  t('iptal ders SAYILMAZ; ilk gecerli ders 10.07 herkese', rows.filter(r=>r.memberId!=='m2').every(r=>r.pkgStart==='2026-07-10'), JSON.stringify(rows.map(r=>r.pkgStart)));

  console.log('[3] RENK: sabit hucreler + satir-satir yesil + komple yesil');
  seed('2026-07-19');
  w.renderMembers();
  const nameCell = ()=> d.querySelector('#members-table td.grp-name-cell');
  t('grup adi hucresi var', !!nameCell());
  t('kimse odemedi: grp-all-paid YOK', !nameCell().className.includes('grp-all-paid'), nameCell().className);
  t('CSS sabit renk kurali eklendi (important)', html.includes('td.grp-name-cell { background: #F3E6C7 !important; }'));
  // tek uye oder -> kendi satiri pay-ok, grup label hala sabit
  w.eval(`state.payments.push({id:'p1',memberId:'m1',groupId:'g1',date:'2026-07-19',amount:4500,method:'cash',packageMonth:'2026-07'});`);
  w.renderMembers();
  // grup basligi da isimleri icerdiginden isimle degil SINIF+SIRA ile sec (slot sirasi: m1,m2,m3)
  const rowOf = (mid)=>{ const rs=[...d.querySelectorAll('#members-table tbody tr.grp-row')].filter(tr=>!tr.className.includes('grp-empty')); return rs[{m1:0,m2:1,m3:2}[mid]]; };
  t('odeyen GOKCE satiri pay-ok (yesil)', rowOf('m1').className.includes('pay-ok'), rowOf('m1').className);
  t('odemeyen TAMELLA satiri pay-due', rowOf('m3').className.includes('pay-due'));
  t('grup label HALA all-paid degil', !nameCell().className.includes('grp-all-paid'));
  // hepsi oder -> komple yesil
  w.eval(`state.payments.push({id:'p2',memberId:'m2',groupId:'g1',date:'2026-07-20',amount:4500,method:'cash',packageMonth:'2026-07'},
    {id:'p3',memberId:'m3',groupId:'g1',date:'2026-07-21',amount:4500,method:'cash',packageMonth:'2026-07'});`);
  w.renderMembers();
  t('hepsi odedi: grp-all-paid GELDI (grup komple yesil)', nameCell().className.includes('grp-all-paid'), nameCell().className);
  t('birlesik hucreler de all-paid', [...d.querySelectorAll('#members-table td.grp-merge')].every(td=>td.className.includes('grp-all-paid')));
  t('tum uye satirlari pay-ok', ['m1','m2','m3'].every(mid=>rowOf(mid).className.includes('pay-ok')));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
