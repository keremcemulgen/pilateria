// v23 — AY LISTESI MODELI: Agustos'tan itibaren bos baslar; onceki aydan cekme; ay bagimsizligi
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
  w.eval(`
    state.instructors.push({id:'h1',name:'BUSE'});
    state.members.push(
      {id:'m1',name:'AYSE',joinDate:'2026-06-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000},
      {id:'m2',name:'FATMA',joinDate:'2026-06-01',packages:[],monthly:{'2026-07':{totalPrice:6000}},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:5000},
      {id:'m3',name:'ZEYNEP',joinDate:'2026-06-01',packages:[],monthly:{'2026-07':{enrolled:false}},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000}
    );
    window.S=()=>state;
  `);

  console.log('[1] LEGACY aylar (<=2026-07) eski davranis — canli veri KORUNUR');
  t('Temmuzda m1 var (default)', w.isMemberEnrolledInMonth('m1','2026-07'));
  t('Temmuzdan cikarilan m3 YOK', !w.isMemberEnrolledInMonth('m3','2026-07'));
  t('Hazirana katilmadan ONCEKI ay (Mayis) GORUNMEZ (joinDate korumasi)', !w.isMemberEnrolledInMonth('m1','2026-05'));

  console.log('[2] AGUSTOS BOS BASLAR — kimse otomatik gelmez');
  t('m1 Agustosta YOK', !w.isMemberEnrolledInMonth('m1','2026-08'));
  t('m2 Agustosta YOK', !w.isMemberEnrolledInMonth('m2','2026-08'));
  const augRows = w.buildMemberRows('2026-08');
  t('Agustos listesi tamamen bos', augRows.length === 0, augRows.length);

  console.log('[3] Bos-ay kurulum ekrani (tablo + kart)');
  w.renderMembers(); // options
  d.getElementById('member-month').value = '2026-08';
  w.renderMembers();
  t('tabloda kurulum secenekleri', d.getElementById('members-tbody').innerHTML.includes('initMonthFromPrevious') && d.getElementById('members-tbody').innerHTML.includes('Boş başla'));
  t('kartlarda da kurulum secenekleri', d.getElementById('members-cards').innerHTML.includes('initMonthFromPrevious'));
  t('Aya Uye Ekle butonu gorunur', d.getElementById('month-add-btn').style.display !== 'none');

  console.log('[4] ONCEKI AYDAN CEK: Temmuz -> Agustos');
  w.initMonthFromPrevious('2026-08');
  t('m1 Agustosa alindi', w.isMemberEnrolledInMonth('m1','2026-08'));
  t('m2 Agustosa alindi', w.isMemberEnrolledInMonth('m2','2026-08'));
  t('Temmuzdan cikarilmis m3 GELMEDI', !w.isMemberEnrolledInMonth('m3','2026-08'));
  t('ay baslatildi isareti', w.isMonthInitialized('2026-08'));

  console.log('[5] FIYAT KOPYASI ve BAGIMSIZLIK');
  t('m2 Temmuz zammi (6000) Agustosa kopyalandi', w.memberMonthlyTotalPrice('m2','2026-08') === 6000);
  t('m1 override tasimadi (fallback 4000)', w.memberMonthlyTotalPrice('m1','2026-08') === 4000 && !(w.S().members.find(x=>x.id==='m1').monthly['2026-08']||{}).totalPrice);
  // Agustos zammi Temmuzu etkilemesin
  w.eval(`setMemberMonthly('m2','2026-08',{totalPrice:7000});`);
  t('Agustos zammi 7000; Temmuz 6000 KALDI', w.memberMonthlyTotalPrice('m2','2026-08')===7000 && w.memberMonthlyTotalPrice('m2','2026-07')===6000);

  console.log('[6] AYDAN CIKAR yalniz o ayi etkiler');
  w.eval(`setMemberMonthly('m1','2026-08',{enrolled:false});`);
  t('m1 Agustostan dustu', !w.isMemberEnrolledInMonth('m1','2026-08'));
  t('m1 Temmuzda DURUYOR', w.isMemberEnrolledInMonth('m1','2026-07'));

  console.log('[7] AYA UYE EKLE (picker)');
  w.openMonthAddPicker('2026-08');
  const pick = d.getElementById('modal-month-add');
  t('picker acildi ve m1 listede', pick && pick.innerHTML.includes('AYSE'));
  w.addMemberToMonth('m1','2026-08');
  t('m1 geri eklendi (yalniz Agustos)', w.isMemberEnrolledInMonth('m1','2026-08'));
  t('picker kapandi', !d.getElementById('modal-month-add'));

  console.log('[8] YENI UYE olusturuldugu aya girer, baska aya SIZMAZ');
  d.getElementById('member-month').value = '2026-08';
  w.openMemberModal();
  d.getElementById('mm-name').value = 'YENI EYLULCU';
  d.getElementById('mm-join').value = '2026-08-05';
  w.saveMember();
  const yeni = w.S().members.find(x=>x.name==='YENI EYLULCU');
  t('yeni uye Agustosta VAR', w.isMemberEnrolledInMonth(yeni.id,'2026-08'));
  t('yeni uye Temmuzda YOK (joinDate korumasi)', !w.isMemberEnrolledInMonth(yeni.id,'2026-07'));
  t('yeni uye Eylulde YOK (her ay bagimsiz)', !w.isMemberEnrolledInMonth(yeni.id,'2026-09'));

  console.log('[9] ODEME alinan uye o ayin listesine girer');
  w.openPaymentModal('m3'); // m3 hicbir yeni ayda yok
  d.getElementById('mp-date').value = '2026-08-03';
  d.getElementById('mp-pkg-month').value = '2026-08';
  d.getElementById('mp-sessions').value = 8;
  d.getElementById('mp-amount').value = 4000;
  w.savePayment();
  t('odeme sonrasi m3 Agustos listesinde', w.isMemberEnrolledInMonth('m3','2026-08'));

  console.log('[10] HOCA MAASI ders gunune gore (teyit)');
  w.eval(`
    const gg={id:'gH',name:'H',size:1,memberIds:['m1'],defaultInstructorId:'h1',defaultPackageId:'',defaultTime:'',defaultDays:[],packages:[{month:'2026-07',startDate:'2026-07-28',sessions:8,price:8000,status:'active',rescheduleUsed:0,cancelUsed:0}],rescheduleUsed:0,cancelUsed:0};
    state.groups.push(gg);
    state.lessons.push({id:'sarki',date:'2026-08-02',time:'10:00',durationMin:45,instructorId:'h1',size:1,memberIds:['m1'],groupId:'gH',packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'gH',status:'completed',note:''});
  `);
  const augEarn = w.instructorEarningsForMonth('h1','2026-08').total;
  const julEarn = w.instructorEarningsForMonth('h1','2026-07').total;
  t('Temmuz paketinin 2 Agustos dersi AGUSTOS maasinda (v41: 4000/8=500 x %30 = 150)', Math.abs(augEarn-150)<0.01, augEarn);
  t('Temmuz maasina YAZILMADI', julEarn === 0, julEarn);

  console.log('\\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
