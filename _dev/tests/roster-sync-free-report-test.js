// v28: kadro->ders senkronu + grup toplami = uye toplami + bos makine raporu
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const alerts = [];
const dom = new JSDOM(html, {
  runScripts: 'dangerously', url: 'https://localhost/pilateria.html', pretendToBeVisual: true,
  beforeParse(window) {
    window.matchMedia = window.matchMedia || (q => ({ matches:false, media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} }));
    window.fetch = () => Promise.resolve({ ok:false, json:() => Promise.resolve({}) });
    if (!window.structuredClone) window.structuredClone = o => JSON.parse(JSON.stringify(o));
    Object.defineProperty(window.navigator, 'serviceWorker', { value: { register:()=>Promise.resolve({}), getRegistrations:()=>Promise.resolve([]) }, configurable:true });
    window.alert = m => alerts.push(String(m)); window.confirm = () => true; window.prompt = () => null;
    window.scrollTo = () => {};
  }
});
const w = dom.window, d = w.document;
let pass = 0, fail = 0;
function t(name, cond) { if (cond) { pass++; console.log('  OK ', name); } else { fail++; console.log('  FAIL', name); } }

setTimeout(() => { try {
  w.eval('window.alert = function(m){}'); w.alert = m => alerts.push(String(m)); w.eval('window.__PL_DLG_AUTO__ = (o)=>o&&o.input?null:true;');
  w.eval(`
    state.settings.reformers = 5; state.settings.lessonDuration = 45;
    state.settings.open = 9; state.settings.close = 21; state.settings.workDays = [1,2,3,4,5,6];
    state.instructors.push({id:'h1',name:'BUSE'});
    state.members.push(
      {id:'r1',name:'RANA KAYA',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000},
      {id:'r2',name:'DERYA AK',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000},
      {id:'r3',name:'SELIN OZ',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:5000},
      {id:'r4',name:'MERT CAN',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:3000}
    );
    state.groups.push({id:'gr',name:autoGroupName(['r1','r2']),size:3,memberIds:['r1','r2'],defaultInstructorId:'h1',defaultPackageId:'',defaultTime:'10:00',defaultDays:[2],
      packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:99999,status:'active'}],rescheduleUsed:0,cancelUsed:0,customTotalPrice:77777,monthlyNotes:{}});
    // dersler: gecmis Haziran (completed) + Haziran paketi planli + Temmuz planli x2
    // v106: planli Temmuz dersleri AY SONU tarihli — yeni uyenin KATILIM TARIHI (bugun) hangi gun olursa olsun sonrasinda kalirlar
    state.lessons.push(
      {id:'L-old',date:'2026-06-10',time:'10:00',durationMin:45,instructorId:'h1',size:3,memberIds:['r1','r2'],groupId:'gr',packageMonth:'2026-06',status:'completed',note:''},
      {id:'L-junP',date:'2026-07-02',time:'11:00',durationMin:45,instructorId:'h1',size:3,memberIds:['r1','r2'],groupId:'gr',packageMonth:'2026-06',status:'planned',note:''},
      {id:'L-jul1',date:'2026-07-30',time:'10:00',durationMin:45,instructorId:'h1',size:3,memberIds:['r1','r2'],groupId:'gr',packageMonth:'2026-07',status:'planned',note:''},
      {id:'L-jul2',date:'2026-07-31',time:'10:00',durationMin:45,instructorId:'h1',size:3,memberIds:['r1','r2'],groupId:'gr',packageMonth:'2026-07',status:'planned',note:''}
    );
    window.S = () => state;
  `);
  const g = () => w.S().groups.find(x=>x.id==='gr');
  const L = id => w.S().lessons.find(x=>x.id===id);

  console.log('[1] GRUP TOPLAMI = UYE TOPLAMI (paket 99999 / custom 77777 degil)');
  t('Temmuz toplami 8000 (4000+4000)', w.groupExpectedTotal(g(),'2026-07') === 8000);
  t('uye fiyati degisince toplam OTOMATIK', (w.eval(`setMemberMonthly('r1','2026-07',{totalPrice:4500});`), w.groupExpectedTotal(g(),'2026-07') === 8500));
  w.eval(`delete state.members.find(x=>x.id==='r1').monthly['2026-07'];`);
  t('uyeler sayfasi grup satiri ayni toplami gosterir', (w.buildMemberRows('2026-07').find(r=>r.groupId==='gr'&&r.type==='group')||{}).totalPrice === 8000);

  console.log('[2] UYE EKLE -> planli dersler + isim OTOMATIK guncel');
  t('grup adi otomatik (RANA KAYA - DERYA AK)', g().name === 'RANA KAYA - DERYA AK');
  w.assignMemberToSlot('r3','gr',2);
  t('kadroya girdi', g().memberIds.includes('r3'));
  t('Temmuz planli ders 1 guncel (r3 var)', L('L-jul1').memberIds.includes('r3') && L('L-jul1').memberIds.length===3);
  t('Temmuz planli ders 2 guncel', L('L-jul2').memberIds.includes('r3'));
  t('GECMIS completed ders DOKUNULMADI', !L('L-old').memberIds.includes('r3') && L('L-old').memberIds.length===2);
  t('HAZIRAN PAKETI planli dersi DOKUNULMADI (ay izolasyonu)', !L('L-junP').memberIds.includes('r3'));
  t('isim otomatik guncellendi (v41: ay gorunumu)', w.groupDisplayName(g(), '2026-07') === 'RANA KAYA - DERYA AK - SELIN OZ', w.groupDisplayName(g(), '2026-07'));
  t('toplam yeni uyeyle guncel (8000+5000)', w.groupExpectedTotal(g(),'2026-07') === 13000);

  console.log('[3] UYE BASKA GRUBA TASININCA eski grubun dersleri/adi guncel');
  w.eval(`state.groups.push({id:'gr2',name:autoGroupName(['r4']),size:2,memberIds:['r4'],defaultInstructorId:'h1',defaultPackageId:'',defaultTime:'',defaultDays:[],packages:[],rescheduleUsed:0,cancelUsed:0,monthlyNotes:{}});`);
  w.assignMemberToSlot('r1','gr2',1);
  t('eski grubun planli dersinden cikti', !L('L-jul1').memberIds.includes('r1'));
  t('eski grup adi guncel (v41: ay gorunumu DERYA AK - SELIN OZ)', w.groupDisplayName(g(), '2026-07') === 'DERYA AK - SELIN OZ', w.groupDisplayName(g(), '2026-07'));
  t('gecmis ders yine dokunulmadi (r1 durur)', L('L-old').memberIds.includes('r1'));

  console.log('[4] PASIFE ALINCA (deleteMember) = v42 SADECE O AY: o ayin planli derslerinden duser, kadroda KALIR');
  w.deleteMember('r2'); // v42: enrolled:false (baglam ayi=currentMonth Temmuz) + o ayin planli derslerinden cikar
  t('r2 kadroda KALIR (ay-bazli, roster korunur)', g().memberIds.includes('r2'));
  t('bu ay enrolled:false (pasif)', w.isMemberEnrolledInMonth('r2', w.currentMonth())===false);
  t('o ayin planli derslerinden cikti', !L('L-jul1').memberIds.includes('r2') && !L('L-jul2').memberIds.includes('r2'));
  t('gecmis derste DURUYOR', L('L-old').memberIds.includes('r2'));

  console.log('[5] KAPASITE UYARISI: senkron 5 makineyi asarsa');
  w.eval(`
    state.groups.push({id:'gbig',name:'BIG',size:4,memberIds:['r2','r4'],defaultInstructorId:'h1',defaultPackageId:'',defaultTime:'',defaultDays:[],packages:[],rescheduleUsed:0,cancelUsed:0,monthlyNotes:{}});
    state.lessons.push(
      {id:'L-oth',date:'2026-07-31',time:'10:00',durationMin:45,instructorId:'h1',size:4,memberIds:['x1','x2','x3','x4'],groupId:'',packageMonth:'2026-07',status:'planned',note:''},
      {id:'L-big',date:'2026-07-31',time:'10:15',durationMin:45,instructorId:'h1',size:4,memberIds:['r2','r4'],groupId:'gbig',packageMonth:'2026-07',status:'planned',note:''}
    );
  `);
  alerts.length = 0;
  w.eval(`unarchiveMember('r2');`);
  w.assignMemberToSlot('r3','gbig',2); // gbig 3 kisi olur: 10:15te 4+3=7 > 5
  t('kapasite uyarisi verildi', alerts.some(a=>a.includes('Kapasite')));
  t('ders guncellendi: r3 girdi, AY-PASIF r2 derse YAZILMADI (v41)', L('L-big').memberIds.length === 2 && L('L-big').memberIds.includes('r3') && L('L-big').memberIds.includes('r4') && !L('L-big').memberIds.includes('r2'), JSON.stringify(L('L-big').memberIds));

  console.log('[6] BOS MAKINE RAPORU');
  w.eval(`
    state.lessons.push(
      {id:'L-eve',date:'2026-07-14',time:'19:00',durationMin:45,instructorId:'h1',size:4,memberIds:['e1','e2','e3','e4'],groupId:'',packageMonth:'2026-07',status:'planned',note:''},
      {id:'L-mis',date:'2026-07-14',time:'12:00',durationMin:45,instructorId:'h1',size:4,memberIds:['e1','e2','e3','e4'],groupId:'',packageMonth:'2026-07',status:'missed',note:''}
    );
    calAnchor = parseISO('2026-07-14');
  `);
  w.openFreeReport('week');
  t('modal acildi', d.getElementById('modal-free-report').classList.contains('open'));
  const txt = w.eval('__freeReportText');
  t('rapor metni basligi (5 makine)', txt.includes('5 makine'));
  t('Sali 19:00 -> 1 bos (4 kisi derste)', /Sal 14\.07:.*19→1/.test(txt));
  t('yanan ders makine ISGAL ETMEZ (12:00 -> 5)', /Sal 14\.07:.*12→5/.test(txt));
  t('Pazar raporda YOK (kapali gun)', !txt.includes('Paz 19.07'));
  t('gorsel govde uretildi', d.getElementById('fr-body').innerHTML.includes('19:00'));
  w.openFreeReport('month');
  t('aylik mod basligi Temmuz', d.getElementById('fr-title').textContent.includes('Temmuz 2026'));
  t('aylik metin 31 Temmuzu icerir', w.eval('__freeReportText').includes('31.07'));
  w.shiftFreeReport(1);
  t('ileri gezinme: Agustos', d.getElementById('fr-title').textContent.includes('Ağustos'));
  w.closeModal('modal-free-report');

  console.log('[7] saveGroup kadro senkron cagrisi kodda mevcut (smoke)');
  t('saveGroup -> syncGroupLessonsToRoster bagli', html.includes('syncGroupLessonsToRoster(id, __gAy)'));

  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi`);
  process.exit(fail ? 1 : 0);
} catch (e) { console.error('TEST COKTU:', e); process.exit(2); } }, 600);
