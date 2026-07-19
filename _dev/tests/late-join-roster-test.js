// v54 — GEC KATILIM + ELLE CIKARMA kadro mekanigi
// (1) biten dersler (completed/missed) dokunulmaz -> gec katilan otomatik yalniz PLANLI derse eklenir
// (2) elle cikarma (excludedMemberIds) reconcile/sync tarafindan OTOMATIK geri EKLENMEZ
// (3) g.memberJoinDates: uye o tarihten onceki planli derse eklenmez
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
  w.eval("['renderMembers','renderGroups','renderDashboard','renderCalendar','refreshGroupDetailIfOpen'].forEach(fn=>window[fn]=function(){});");
  const ay='2026-07';
  // 3 kisilik grup: L1,L2 yapildi, L3 yandi, L4,L5 planli (hepsi 3 kisi). Sonra m4 (5-derslik) katiliyor.
  w.eval(`
    const M=(id,price,q)=>({id,name:id,joinDate:'2026-01-01',archived:false,totalPrice:price,packages:[],
       monthly:{'2026-07':Object.assign({enrolled:true}, q?{sessionsOverride:q}:{})}});
    state.members=[M('m1',4500),M('m2',4500),M('m3',4500),M('m4',2815.5,5)];
    state.groups=[{id:'G',name:'G',size:4,memberIds:['m1','m2','m3'],monthlyMembers:{'2026-07':['m1','m2','m3']},
       packages:[{month:'2026-07',sessions:8,status:'active'}]}];
    const L=(id,day,st,mids)=>({id,date:'2026-07-'+day,time:'10:00',status:st,instructorId:'h',instructorRateOverride:30,
       groupId:'G',memberIds:mids.slice(),packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'G',size:4});
    state.lessons=[ L('L1','05','completed',['m1','m2','m3']), L('L2','12','completed',['m1','m2','m3']),
      L('L3','19','missed',['m1','m2','m3']), L('L4','26','planned',['m1','m2','m3']), L('L5','29','planned',['m1','m2','m3']) ];
  `);
  const L=id=>w.S().lessons.find(x=>x.id===id);

  console.log('[1] m4 gruba katilir -> sync: BITEN dersler korunur, PLANLI dersler otomatik dolar');
  w.eval(`state.groups[0].memberIds=['m1','m2','m3','m4']; state.groups[0].monthlyMembers['2026-07']=['m1','m2','m3','m4'];
          syncGroupLessonsToRoster('G','2026-07');`);
  t('L1 (yapildi) hala 3 kisi (m4 EKLENMEDI)', J(L('L1').memberIds)===J(['m1','m2','m3']), J(L('L1').memberIds));
  t('L3 (yandi) hala 3 kisi', J(L('L3').memberIds)===J(['m1','m2','m3']), J(L('L3').memberIds));
  t('L4 (planli) artik 4 kisi (m4 OTOMATIK eklendi)', L('L4').memberIds.includes('m4') && L('L4').memberIds.length===4, J(L('L4').memberIds));
  t('L5 (planli) artik 4 kisi', L('L5').memberIds.includes('m4'), J(L('L5').memberIds));

  console.log('[2] PARA: biten 3-kisilik ders vs 4-kisilik planli ders farkli taban');
  t('L1 (3 kisi) taban = 1687.5', R(w.perLessonPriceForLesson(L('L1')))===1687.5, w.perLessonPriceForLesson(L('L1')));
  t('L4 (4 kisi) taban = 2250.6', R(w.perLessonPriceForLesson(L('L4')))===2250.6, w.perLessonPriceForLesson(L('L4')));
  t('L1 hoca payi 506.25 (yapildi)', R(w.instructorEarningForLesson(L('L1')))===506.25, w.instructorEarningForLesson(L('L1')));

  console.log('[3] ELLE CIKARMA: L4 te m4 isaretsiz -> excluded -> sync/migration geri EKLEMEZ');
  w.eval(`S().lessons.find(x=>x.id==='L4').excludedMemberIds=['m4'];
          syncGroupLessonsToRoster('G','2026-07');`);
  t('L4 ten m4 cikti (3 kisi)', !L('L4').memberIds.includes('m4') && L('L4').memberIds.length===3, J(L('L4').memberIds));
  t('L5 hala 4 kisi (etkilenmedi)', L('L5').memberIds.includes('m4'), J(L('L5').memberIds));
  w.eval('applyV10MigrationToState(state);');
  t('migration sonrasi L4 hala 3 kisi (excluded KORUNDU)', !L('L4').memberIds.includes('m4') && L('L4').memberIds.length===3, J(L('L4').memberIds));
  t('L4 tekrar 3-kisilik taban = 1687.5', R(w.perLessonPriceForLesson(L('L4')))===1687.5, w.perLessonPriceForLesson(L('L4')));

  console.log('[4] GEC KATILIM tarihi: g.memberJoinDates m4=2026-07-25 -> onceki planli derse eklenmez');
  w.eval(`state.groups[0].memberJoinDates={m4:'2026-07-25'};
    // yeni erken planli ders (20 < 25) ve gec planli ders (28 >= 25)
    const L=(id,day,mids)=>({id,date:'2026-07-'+day,time:'11:00',status:'planned',instructorId:'h',instructorRateOverride:30,groupId:'G',memberIds:mids.slice(),packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'G',size:4});
    state.lessons.push(L('E20','20',['m1','m2','m3']));
    state.lessons.push(L('E28','28',['m1','m2','m3']));
    applyV10MigrationToState(state);`);
  t('E20 (20<25, katilim oncesi) m4 EKLENMEDI', !L('E20').memberIds.includes('m4'), J(L('E20').memberIds));
  t('E28 (28>=25, katilim sonrasi) m4 EKLENDI', L('E28').memberIds.includes('m4'), J(L('E28').memberIds));

  console.log('[5] GEC KATILIM + elle ekleme: joinDate oncesi derse ELLE eklenmis m4 KORUNUR');
  w.eval(`const l=S().lessons.find(x=>x.id==='E20'); l.memberIds=['m1','m2','m3','m4']; // Kerem elle ekledi
          applyV10MigrationToState(state);`);
  t('E20 e elle eklenen m4 (present) reconcile ile ATILMAZ', L('E20').memberIds.includes('m4'), J(L('E20').memberIds));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
