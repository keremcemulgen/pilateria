// v2026.07.18.07 — toplu ders girme: metin tarih/saat parse, yil OTOMATIK bu yil, Enter navigasyonu, saveBatchDates uyumu
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

  console.log('[1] bdParseDate: gun.ay -> ISO (yil OTOMATIK bu yil='+yil+')');
  t('"15.08" -> '+yil+'-08-15', w.bdParseDate('15.08')===yil+'-08-15', w.bdParseDate('15.08'));
  t('"1508" -> '+yil+'-08-15', w.bdParseDate('1508')===yil+'-08-15', w.bdParseDate('1508'));
  t('"5.9" -> '+yil+'-09-05', w.bdParseDate('5.9')===yil+'-09-05', w.bdParseDate('5.9'));
  t('"15/08" -> '+yil+'-08-15', w.bdParseDate('15/08')===yil+'-08-15', w.bdParseDate('15/08'));
  t('"15.08.2025" -> 2025-08-15 (acik yil)', w.bdParseDate('15.08.2025')==='2025-08-15', w.bdParseDate('15.08.2025'));
  t('"15.08.25" -> 2025-08-15 (2 haneli yil)', w.bdParseDate('15.08.25')==='2025-08-15', w.bdParseDate('15.08.25'));
  t('ISO korunur', w.bdParseDate('2026-03-04')==='2026-03-04');
  t('gecersiz "" -> ""', w.bdParseDate('')==='' && w.bdParseDate('abc')==='' && w.bdParseDate('40.13')==='');

  console.log('[2] bdFmtDate: ISO -> gg.aa.yyyy');
  t('2026-08-15 -> 15.08.2026', w.bdFmtDate('2026-08-15')==='15.08.2026');

  console.log('[3] bdParseTime');
  t('"1000" -> 10:00', w.bdParseTime('1000')==='10:00');
  t('"930" -> 09:30', w.bdParseTime('930')==='09:30');
  t('"10" -> 10:00', w.bdParseTime('10')==='10:00');
  t('"9:05" -> 09:05', w.bdParseTime('9:05')==='09:05');
  t('"17:30" korunur', w.bdParseTime('17:30')==='17:30');

  console.log('[4] render: metin inputlar + bd-nav sinifi + Enter handler');
  w.eval(`state.settings.groupPackageDays=30; state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[{id:'a',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{}},{id:'b',name:'BANU',joinDate:'2026-01-01',packages:[],monthly:{}}];
    state.groups=[{id:'g1',name:'AYSE - BANU',size:2,memberIds:['a','b'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'10:00',defaultDays:[1],packages:[{month:'`+yil+`-07',startDate:'`+yil+`-07-01',sessions:8,price:8000,status:'active'}],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[]; state.payments=[];`);
  w.openBatchDates('g1', yil+'-07');
  const navs = d.querySelectorAll('#bd-rows .bd-nav');
  t('bd-nav inputlar var (>=16: 8 satir x 2)', navs.length>=16, navs.length);
  t('tarih inputu type=text (metin)', d.querySelector('#bd-rows .bd-date').type==='text');
  t('onkeydown bdKey bagli', (d.querySelector('#bd-rows .bd-date').getAttribute('onkeydown')||'').includes('bdKey'));

  console.log('[5] metin girip Enter -> parse + sonraki alana odak');
  const d0 = d.querySelector('#bd-rows .bd-date');
  d0.value='15.08'; d0.focus();
  d0.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  t('satir0 tarih parse edildi ('+yil+'-08-15)', w.eval('__batchDatesRows[0].date')===yil+'-08-15', w.eval('__batchDatesRows[0].date'));
  t('Enter sonrasi odak SAAT alaninda', d.activeElement && d.activeElement.classList.contains('bd-time'), d.activeElement && d.activeElement.className);

  console.log('[6] saveBatchDates metin-girisli veriyle ders olusturur');
  w.eval(`__batchDatesRows=[{lessonId:null,date:'`+yil+`-07-07',time:'10:00'},{lessonId:null,date:'`+yil+`-07-14',time:'10:00'}];`);
  w.saveBatchDates();
  const made = w.S().lessons.filter(l=>l.groupId==='g1');
  t('2 ders olusturuldu', made.length===2, made.length);
  t('tarihler dogru', made.some(l=>l.date===yil+'-07-07') && made.some(l=>l.date===yil+'-07-14'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('HATA', e&&e.stack||e); process.exit(1); } }, 1500);
