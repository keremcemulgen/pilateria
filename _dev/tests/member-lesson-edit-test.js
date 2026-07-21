// v64 — Bireysel uye detayinda ders satirina "Duzenle" (openLessonModal) + detay tazeleme
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
  w.eval("['renderMembers','renderGroups','renderDashboard','renderCalendar'].forEach(fn=>window[fn]=function(){}); window.save=function(){};");
  w.eval(`
    state.settings=state.settings||{}; state.settings.lessonDuration=45; state.instructors=[{id:'h',name:'DERYA'}];
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',archived:false,totalPrice:4500,packages:[],monthly:{'2026-07':{enrolled:true}}}];
    state.groups=[];
    state.lessons=[{id:'L1',date:'2026-07-05',time:'10:00',status:'planned',instructorId:'h',groupId:'',memberIds:['m1'],packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'m1',size:1},
                   {id:'L2',date:'2026-07-08',time:'11:00',status:'completed',instructorId:'h',groupId:'',memberIds:['m1'],packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'m1'}]; // L2 size YOK
    state.payments=[];
    var ms=document.getElementById('member-month'); if(ms) ms.value='2026-07';
  `);

  console.log('[1] Uye detayinda her ders satirinda "Duzenle" butonu');
  w.openMemberDetail('m1');
  const md=d.getElementById('md-content').innerHTML;
  const editBtns=[...d.querySelectorAll('#md-content button')].filter(b=>/Düzenle/.test(b.textContent) && /openLessonModal/.test(b.getAttribute('onclick')||''));
  t('2 ders icin openLessonModal Duzenle butonu var', editBtns.length===2, editBtns.length);
  t('L1 icin openLessonModal(\'L1\')', md.includes("openLessonModal('L1')"));
  t('L2 icin openLessonModal(\'L2\')', md.includes("openLessonModal('L2')"));
  t('size tanimsiz L2: "undefined kisilik" YOK', !/undefined kişilik/.test(md), (md.match(/[^>]*undefined[^<]*/)||['temiz'])[0]);
  t('L2 "1 kişilik" (memberIds fallback)', /1 kişilik/.test(md));
  t('baslik ipucu "Düzenle ile" var', /Düzenle ile tarih\/saat\/durum\/hoca/.test(md));

  console.log('[2] Duzenle tam ders editorunu (modal-lesson) acar — bireysel dersi yukler');
  w.eval("window.openModal=function(id){window.__opened=id;};");
  w.openLessonModal('L1');
  t('modal-lesson acildi', w.__opened==='modal-lesson', w.__opened);
  t('baslik "Dersi Düzenle"', d.getElementById('ml-title').textContent==='Dersi Düzenle', d.getElementById('ml-title').textContent);
  t('tarih yuklendi', d.getElementById('ml-date').value==='2026-07-05', d.getElementById('ml-date').value);
  t('Sil butonu gorunur (edit)', d.getElementById('ml-delete-btn').style.display!=='none');

  console.log('[3] saveLesson/markLessonStatus/deleteLesson artik uye detayini tazeler');
  let refreshed=0; w.refreshMemberDetailIfOpen=function(){refreshed++;};
  // saveLesson
  d.getElementById('ml-time').value='10:30'; d.getElementById('ml-instructor').value='h'; d.getElementById('ml-size').value='1';
  // tek uye isaretli olacak sekilde ml-members'i doldur (openLessonModal yaptigindan zaten var); yine de garanti:
  try{ w.saveLesson(); }catch(e){}
  t('saveLesson -> refreshMemberDetailIfOpen cagirdi', refreshed>=1, refreshed);
  // markLessonStatus
  d.getElementById('ml-id').value='L1'; refreshed=0; try{ w.markLessonStatus('completed'); }catch(e){}
  t('markLessonStatus -> refreshMemberDetailIfOpen', refreshed>=1, refreshed);
  // deleteLesson
  d.getElementById('ml-id').value='L2'; refreshed=0; try{ w.deleteLesson(); }catch(e){}
  t('deleteLesson -> refreshMemberDetailIfOpen', refreshed>=1, refreshed);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
