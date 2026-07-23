// v108 — ⭐ SON DERS ERKEN KAPANIS + toplu liste otomatik icerik + siralama:
// [1] Bireysel: 8 haktan 5.derste ⭐ -> sonraki planlilar DUSER, kalan 0 + '3 hak isletmeye',
//     hoca YALNIZ yapilan 5 dersten kazanir (ay fiyati/8 kanonu) -> 3 dersin parasi isletmeye.
// [2] Grup: ayni kural (sonraki planli grup dersleri duser, kalan 0, kept dogru).
// [3] Takvimden girilen ders toplu listede kendi paket ayinda OTOMATIK gorunur (pm bazli) + EN ESKI USTTE.
// [4] Uye detay ders listesi EN ESKI USTTE. [5] Kapanan ay sarkan/kalan listelerine dusmez.
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
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','renderPayments','renderReports','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','autoCompletePackages'].forEach(fn=>window[fn]=function(){});");
  w.eval(`state.settings.instructorShareRate=30; state.settings.lessonDuration=45;
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:5000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[{id:'z',name:'ZEYNEP',joinDate:'2026-01-01',totalPrice:5000,defaultPackageId:'p1',instructorId:'h1',packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:5000,status:'active'}],monthly:{'2026-07':{enrolled:true}}},
      {id:'a',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}}},
      {id:'b',name:'BANU',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}}}];
    state.groups=[{id:'g1',name:'AYSE - BANU',size:2,memberIds:['a','b'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'10:00',defaultDays:[2],customTotalPrice:8000,
      packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:8000,status:'active'}],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[]; state.payments=[];`);

  console.log('[1] BIREYSEL: 8 hak, 5.derste ⭐ SON DERS -> 6-8 duser, kalan 0, 3 hak isletmeye, hoca 5 ders parasi');
  // 8 satirlik toplu giris: 1-5 yapildi (#5 ⭐), 6-8 planli
  w.openBatchDatesMember('z','2026-07');
  w.eval(`__batchDatesRows = [];
    for(let i=1;i<=8;i++) __batchDatesRows.push({lessonId:null, date:'2026-07-'+String(i).padStart(2,'0'), time:'1'+(i%5)+':00', status: i<=5?'completed':'planned', last: i===5});`);
  w.saveBatchDates();
  const zl = w.eval("state.lessons.filter(l=>!l.groupId && l.memberIds.includes('z') && (l.packageMonth||'')==='2026-07')");
  t('yalniz 5 ders kaldi (6-8 paketten dustu)', zl.length===5, zl.length);
  t('5. ders ⭐ isaretli', zl.some(l=>l.isLastOfPackage===true && l.date==='2026-07-05'));
  t('kalan hak 0 (erken kapandi)', w.eval("sessionsRemainingFor('member','z','2026-07')")===0);
  const fs1 = w.eval("sessionsFinishState('member','z','2026-07')");
  t('closedEarly + 3 hak isletmeye', fs1.closedEarly===true && fs1.keptRights===3, JSON.stringify(fs1));
  t('paket bitmis sayilir (planli kalmadi)', fs1.trulyFinished===true);
  const earn = w.eval("instructorEarningsForMonth('h1','2026-07').total");
  t('hoca = 5 x (5000/8) x %30 = 937.50 (3 dersin parasi ISLETMEYE)', Math.abs(earn-937.5)<0.01, earn);

  console.log('[2] GRUP: 5.derste ⭐ -> sonraki planli grup dersleri duser, kalan 0, kept 3');
  w.openBatchDates('g1','2026-07');
  w.eval(`__batchDatesRows = [];
    for(let i=1;i<=8;i++) __batchDatesRows.push({lessonId:null, date:'2026-07-'+String(i).padStart(2,'0'), time:'0'+(i%5)+':30', status: i<=5?'completed':'planned', last: i===5});`);
  w.saveBatchDates();
  const gl = w.eval("state.lessons.filter(l=>l.groupId==='g1' && (l.packageMonth||'')==='2026-07')");
  t('grupta yalniz 5 ders kaldi', gl.length===5, gl.length);
  t('grup kalan 0', w.eval("sessionsRemainingFor('group','g1','2026-07')")===0);
  const fs2 = w.eval("sessionsFinishState('group','g1','2026-07')");
  t('grup closedEarly + kept 3', fs2.closedEarly===true && fs2.keptRights===3, JSON.stringify(fs2));

  console.log('[3] TAKVIMDEN girilen ders toplu listede OTOMATIK + EN ESKI USTTE');
  w.eval(`state.lessons.push({id:'cal1',date:'2026-07-02',time:'16:00',durationMin:45,instructorId:'h1',size:1,memberIds:['z'],groupId:'',packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'z',status:'planned',note:''});`);
  w.openBatchDatesMember('z','2026-07');
  const rows = w.eval('__batchDatesRows').filter(r=>r.lessonId);
  t('takvim dersi (cal1) toplu listede', rows.some(r=>r.date==='2026-07-02' && r.time==='16:00'));
  const datesOnly = rows.map(r=>r.date+' '+r.time);
  t('liste EN ESKI USTTE (sirali)', JSON.stringify(datesOnly)===JSON.stringify(datesOnly.slice().sort()), JSON.stringify(datesOnly));
  w.eval("closeModal('modal-batch-dates')");

  console.log('[4] UYE DETAY ders listesi EN ESKI USTTE');
  w.openMemberDetail('z');
  const cells = [...d.querySelectorAll('#modal-member-detail table tbody tr td:first-child')].map(x=>x.textContent.trim());
  const dateCells = cells.filter(x=>/^\d{2}\.\d{2}\.\d{4}$/.test(x));
  t('ilk ders satiri 01.07 (en eski)', dateCells.length>0 && dateCells[0]==='01.07.2026', JSON.stringify(dateCells.slice(0,3)));
  w.eval("closeModal('modal-member-detail')");

  console.log('[5] KAPANAN AY kalan/sarkan listelerine DUSMEZ');
  t('ownerUnfinishedMonths z: 2026-07 YOK (erken kapandi)', !w.eval("ownerUnfinishedMonths('member','z')").includes('2026-07'));
  t('ownerUnfinishedMonths g1: 2026-07 YOK', !w.eval("ownerUnfinishedMonths('group','g1')").includes('2026-07'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
