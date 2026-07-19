// v55 — Grup dersi "Dersi Duzenle" penceresinde KATILAN UYE SECIMI (v54 excludedMemberIds'e baglanir)
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
const R=x=>Math.round((+x)*100)/100;
const J=a=>JSON.stringify(a);
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  w.eval(`
    window.save=function(){}; ['closeModal','refreshGroupDetailIfOpen','renderCalendar','renderDashboard','renderMembers','renderGroups','openModal'].forEach(fn=>window[fn]=function(){});
    window.capacityLeftFor=function(){return 99;}; window.instructorBusy=function(){return null;}; window.lessonDuration=function(){return 45;};
    state.instructors=[{id:'h',name:'DERYA'}]; state.settings=state.settings||{};
    const M=id=>({id,name:id.toUpperCase(),joinDate:'2026-01-01',archived:false,totalPrice:4500,packages:[],monthly:{'2026-07':{enrolled:true}}});
    state.members=[M('m1'),M('m2'),M('m3'),M('m4')];
    state.groups=[{id:'G',name:'G',size:4,memberIds:['m1','m2','m3','m4'],monthlyMembers:{'2026-07':['m1','m2','m3','m4']},packages:[{month:'2026-07',sessions:8,status:'active'}]}];
    state.lessons=[{id:'L',date:'2026-07-26',time:'19:00',status:'planned',instructorId:'h',instructorRateOverride:30,groupId:'G',memberIds:['m1','m2','m3','m4'],packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'G',size:4}];
  `);
  const Lz=()=>w.S().lessons.find(x=>x.id==='L');

  console.log('[1] Modal acilinca kadro checkbox olarak render edilir (memberIds=checked)');
  w.openGroupLessonModal('L');
  let boxes=[...d.querySelectorAll('#gl-members input.gl-mc')];
  t('4 uye checkbox render edildi', boxes.length===4, boxes.length);
  t('hepsi isaretli (memberIds 4 kisi)', boxes.every(b=>b.checked));
  t('sayac = 4', d.getElementById('gl-member-count').textContent==='4', d.getElementById('gl-member-count').textContent);

  console.log('[2] Bir uyeyi isaretsiz birak + Kaydet -> memberIds duser, excludedMemberIds yazilir');
  boxes.find(b=>b.value==='m4').checked=false;
  w.saveGroupLesson();
  t('memberIds 3 kisi (m4 cikti)', J(Lz().memberIds)===J(['m1','m2','m3']), J(Lz().memberIds));
  t('excludedMemberIds m4 icerir', (Lz().excludedMemberIds||[]).includes('m4'), J(Lz().excludedMemberIds));
  t('PARA: 3 kisilik taban = 1687.5', R(w.perLessonPriceForLesson(Lz()))===1687.5, w.perLessonPriceForLesson(Lz()));

  console.log('[3] excluded uye sync/migration ile GERI GELMEZ');
  w.eval("syncGroupLessonsToRoster('G','2026-07'); applyV10MigrationToState(state);");
  t('sync+migration sonrasi m4 hala YOK', !Lz().memberIds.includes('m4'), J(Lz().memberIds));

  console.log('[4] Yeniden ac -> m4 isaretsiz gorunur; tekrar isaretle+Kaydet -> geri eklenir, excluded temizlenir');
  w.openGroupLessonModal('L');
  boxes=[...d.querySelectorAll('#gl-members input.gl-mc')];
  const b4=boxes.find(b=>b.value==='m4');
  t('m4 isaretsiz geldi', b4 && !b4.checked, b4&&b4.checked);
  t('sayac = 3', d.getElementById('gl-member-count').textContent==='3', d.getElementById('gl-member-count').textContent);
  b4.checked=true;
  w.saveGroupLesson();
  t('memberIds tekrar 4', Lz().memberIds.length===4, J(Lz().memberIds));
  t('excluded temizlendi (m4 yok)', !(Lz().excludedMemberIds||[]).includes('m4'), J(Lz().excludedMemberIds));
  t('PARA: 4 kisilik taban = 2250 (4x562.5)', R(w.perLessonPriceForLesson(Lz()))===2250, w.perLessonPriceForLesson(Lz()));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
