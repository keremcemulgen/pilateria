// v2026.07.18.08 — grup/uye paket-ayi etiketi + toplu ders girmede DURUM secici (yapildi/yandi/iptal) + mobil padding
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
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','autoCompletePackages'].forEach(fn=>window[fn]=function(){});");
  const yil = w.eval('bdCurrentYear()');
  w.eval(`state.settings.groupPackageDays=30; state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'a',name:'AYSE',joinDate:'2026-01-01',packages:[{month:'`+yil+`-07',startDate:'`+yil+`-07-01',sessions:8,price:5000,status:'active'}],monthly:{}},
      {id:'b',name:'BANU',joinDate:'2026-01-01',packages:[],monthly:{}}
    ];
    state.groups=[{id:'g1',name:'AYSE - BANU',size:2,memberIds:['a','b'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'10:00',defaultDays:[1],
      packages:[{month:'`+yil+`-07',startDate:'`+yil+`-07-01',sessions:8,price:8000,status:'active'}],monthlyMembers:{},monthlyNotes:{}}];
    // Temmuzda 6 grup dersi -> 2 kalan
    state.lessons=[]; for(let i=0;i<6;i++) state.lessons.push({id:'g'+i,date:'`+yil+`-07-0'+(i+1),time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['a','b'],groupId:'g1',packageMonth:'`+yil+`-07',packageOwnerType:'group',packageOwnerId:'g1',status:'completed'});
    state.payments=[];`);

  console.log('[1] ownerPkgMonthLabel: grup/uye HANGI AY (kalan)');
  t('grup etiketi "Tem: 2 kalan" icerir', /Tem: 2 kalan/.test(w.ownerPkgMonthLabel('group','g1')), w.ownerPkgMonthLabel('group','g1'));
  t('AYSE bireysel paketi Temmuz (8 kalan)', /Tem: 8 kalan/.test(w.ownerPkgMonthLabel('member','a')), w.ownerPkgMonthLabel('member','a'));
  t('BANU paketsiz -> bos etiket', w.ownerPkgMonthLabel('member','b')==='', w.ownerPkgMonthLabel('member','b'));

  console.log('[2] ders modali grup dropdown paket ayini gosterir');
  w.openLessonModal(null, yil+'-08-05', '10:00');
  const gopts = d.getElementById('ml-group-select').innerHTML;
  t('grup dropdown "Tem: 2 kalan" yaziyor', /Tem: 2 kalan/.test(gopts), 'dropdownda ay yok');

  console.log('[3] toplu ders girme DURUM secici var + yukleme/kayit');
  w.openBatchDates('g1', yil+'-07');
  const statSel = d.querySelectorAll('#bd-rows .bd-status');
  t('durum secici satirlarda var', statSel.length>=8, statSel.length);
  t('mevcut ders durumu yuklendi (completed)', w.eval("__batchDatesRows.filter(r=>r.status==='completed').length")>=6);

  console.log('[4] toplu YAPILDI/YANDI/IPTAL kaydedilir');
  w.eval(`__batchDatesRows=[
    {lessonId:null,date:'`+yil+`-07-20',time:'10:00',status:'completed'},
    {lessonId:null,date:'`+yil+`-07-21',time:'11:00',status:'missed'},
    {lessonId:null,date:'`+yil+`-07-22',time:'12:00',status:'cancelled'}
  ];`);
  // mevcut 6 dersi koruyalim diye onlari da lessonId ile ekleyelim degil - saveBatch modaldaki lessonId'siz olanlar yeni; mevcutlar silinmesin diye:
  w.eval("state.lessons.filter(l=>l.groupId==='g1').forEach(l=>{__batchDatesRows.push({lessonId:l.id,date:l.date,time:l.time,status:l.status});});");
  w.saveBatchDates();
  const L = w.S().lessons;
  t('yapildi ders olustu', L.some(l=>l.date===yil+'-07-20' && l.status==='completed'), 'yok');
  t('yandi ders olustu', L.some(l=>l.date===yil+'-07-21' && l.status==='missed'), 'yok');
  t('iptal ders olustu', L.some(l=>l.date===yil+'-07-22' && l.status==='cancelled'), 'yok');

  console.log('[5] EDIT: mevcut planli dersi toplu YAPILDI yap');
  w.eval(`state.lessons=[{id:'e1',date:'`+yil+`-07-25',time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['a','b'],groupId:'g1',packageMonth:'`+yil+`-07',packageOwnerType:'group',packageOwnerId:'g1',status:'planned'}];`);
  w.openBatchDates('g1', yil+'-07');
  w.eval("__batchDatesRows.forEach(r=>{ if(r.lessonId==='e1') r.status='completed'; });");
  w.saveBatchDates();
  t('planli ders YAPILDI oldu', w.S().lessons.find(l=>l.id==='e1').status==='completed', w.S().lessons.find(l=>l.id==='e1').status);

  console.log('[6] mobil padding CSS var');
  t('mobilde main padding daraltildi', html.includes('main { padding:12px 10px !important; }'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('HATA', e&&e.stack||e); process.exit(1); } }, 1500);
