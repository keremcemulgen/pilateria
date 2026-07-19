// v26 — GRUP SAYFASI kalintilari: tik/kalan/paket kutusu AY BAZLI; sarkan paket baslangic ayina ait
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
setTimeout(async ()=>{ try {
  w.eval(`
    state.instructors.push({id:'h1',name:'BUSE'});
    state.members.push(
      {id:'u1',name:'AYSE',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000},
      {id:'u2',name:'FATMA',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000}
    );
    state.groups.push({id:'gz',name:'AYSE/FATMA',size:2,memberIds:['u1','u2'],defaultInstructorId:'h1',defaultPackageId:'',defaultTime:'10:00',defaultDays:[2],
      packages:[
        {month:'2026-06',startDate:'2026-06-25',sessions:8,price:8000,status:'active',rescheduleUsed:1,cancelUsed:0},
        {month:'2026-07',startDate:'2026-07-20',sessions:8,price:8000,status:'active',rescheduleUsed:0,cancelUsed:1}
      ],
      rescheduleUsed:9,cancelUsed:9,packageStartDate:'2026-06-25',customTotalPrice:8000,monthlyNotes:{}});
    // HAZIRAN odemesi (u1) + Haziran paketinin TEMMUZA SARKAN dersi
    state.payments.push({id:'pj',memberId:'u1',groupId:'gz',date:'2026-06-26',packageMonth:'2026-06',pkgName:'G',sessions:8,amount:4000,listPrice:4000,method:'Nakit',partial:false,note:''});
    state.lessons.push(
      {id:'lj1',date:'2026-06-26',time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['u1','u2'],groupId:'gz',packageMonth:'2026-06',status:'completed',note:''},
      {id:'lj2',date:'2026-07-02',time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['u1','u2'],groupId:'gz',packageMonth:'2026-06',status:'planned',note:''}
    );
    window.S=()=>state;
  `);

  console.log('[1] TEMMUZ grup sayfasi: HAZIRAN odemesi TASINMAZ');
  w.openGroupDetail('gz','2026-07');
  let gd = d.getElementById('gd-content').innerHTML;
  t('u1 Temmuzda "Odeme al" (Haziran odemesi sayilmadi)', gd.includes('⬜ Ödeme al'));
  t('Temmuz kutusunda TEMMUZ paketi baslangici (20.07)', gd.includes('20.07.2026'));
  t('HAZIRAN paket baslangici (25.06) Temmuz sayfasinda YOK', !gd.includes('25.06.2026'));
  t('haklar TEMMUZ paketinden (iptal 1)', gd.includes('🚫 İptal: <b>1/'));
  t('Temmuz sayfasinda Haziran-paketi sarkan dersi listede YOK (o Haziranin dersi)', !gd.includes("openGroupLessonModal('lj2')"));

  console.log('[2] HAZIRAN grup sayfasi: kendi bilgileri + sarkan dersi DAHIL');
  w.openGroupDetail('gz','2026-06');
  gd = d.getElementById('gd-content').innerHTML;
  t('u1 Haziranda ✅ Odendi', gd.includes('✅ Ödendi'));
  t('Haziran kutusunda 25.06 baslangic', gd.includes('25.06.2026'));
  t('haklar HAZIRAN paketinden (saat degisikligi 1)', gd.includes('🔄 Saat değişikliği: <b>1/'));
  t('sarkan 02.07 dersi HAZIRAN sayfasinda listede', gd.includes("openGroupLessonModal('lj2')"));
  t('u1 kalan ders ay bazli: 8 alindi - 2 ders = 6', gd.includes('>6</span>') || gd.includes('badge ok">6'));
  w.closeModal('modal-group-detail');

  console.log('[3] TIK ay bazli calisir');
  // Temmuzda u1'e tik at -> TEMMUZ kaydi olusur (Haziran kaydina dokunmaz)
  w.togglePaidTick('u1','gz',null,'2026-07');
  const u1pays = w.S().payments.filter(p=>p.memberId==='u1'&&p.groupId==='gz');
  t('Temmuz tik odemesi packageMonth=2026-07', u1pays.some(p=>p.packageMonth==='2026-07'&&p.autoTick));
  t('Haziran odemesi duruyor', u1pays.some(p=>p.packageMonth==='2026-06'));
  // Temmuz tikini kaldir -> yalniz Temmuz kaydi silinir
  w.togglePaidTick('u1','gz',null,'2026-07');
  const after = w.S().payments.filter(p=>p.memberId==='u1'&&p.groupId==='gz');
  t('tik kaldirinca yalniz TEMMUZ kaydi silindi', after.length===1 && after[0].packageMonth==='2026-06');

  console.log('[4] editGroupPkgStart yalniz o ayi degistirir');
  w.eval(`window.__PL_DLG_AUTO__ = (o) => o && o.input ? '2026-07-22' : true;`);
  await w.editGroupPkgStart('gz','2026-07');
  w.eval(`window.__PL_DLG_AUTO__ = (o)=>o&&o.input?null:true;`);
  const gz = w.S().groups.find(x=>x.id==='gz');
  t('Temmuz paketi 22.07 oldu', gz.packages.find(p=>p.month==='2026-07').startDate==='2026-07-22');
  t('Haziran paketi 25.06 KALDI', gz.packages.find(p=>p.month==='2026-06').startDate==='2026-06-25');

  console.log('[5] "TUM AYLAR" MODU KALKTI — ay zorunlu');
  w.openGroupDetail('gz'); // AY PARAMETRESIZ
  t('parametresiz acilis ICINDE BULUNULAN AYA duser', w.eval('currentGroupDetailMonth') === w.currentMonth(), w.eval('currentGroupDetailMonth'));
  const gdSel = d.getElementById('gd-content').innerHTML;
  t('grup detay ay secicisinde "Tum aylar" YOK', !gdSel.includes('Tüm aylar'));
  t('Temmuz gorunumu: Haziran odemeleri ana listede degil', !gdSel.includes('26.06.2026') || w.currentMonth()==='2026-06');
  w.closeModal('modal-group-detail');
  w.renderMembers();
  const mmSel = d.getElementById('member-month');
  t('uyeler ay secicisinde "Tum donemler" YOK + deger dolu', ![...mmSel.options].some(o=>o.value==='') && mmSel.value !== '', mmSel.value);

  console.log('\\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
