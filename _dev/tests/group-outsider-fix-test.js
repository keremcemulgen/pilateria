// v2026.07.18.09 — KOK FIX: grup dersi grup-DISI (eski/baska grup) uyeleri gostermez/tasimaz -> kapasite blogu biter
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
  // 4 kisilik grup {a,b,c,dd}; x,y BASKA grupta (enrolled ama bu grupta DEGIL)
  w.eval(`state.settings.reformers=5; state.settings.groupPackageDays=30; state.settings.lessonDuration=45;
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'ICLAL',shareRate:30}];
    state.members=[
      {id:'a',name:'BUSRA',joinDate:'2026-01-01',packages:[],monthly:{'2026-06':{enrolled:true}}},
      {id:'b',name:'FATMA',joinDate:'2026-01-01',packages:[],monthly:{'2026-06':{enrolled:true}}},
      {id:'c',name:'SULE',joinDate:'2026-01-01',packages:[],monthly:{'2026-06':{enrolled:true}}},
      {id:'dd',name:'GOKCE',joinDate:'2026-01-01',packages:[],monthly:{'2026-06':{enrolled:true}}},
      {id:'x',name:'BUSE HOS',joinDate:'2026-01-01',packages:[],monthly:{'2026-06':{enrolled:true}}},
      {id:'y',name:'ZEYNEP',joinDate:'2026-01-01',packages:[],monthly:{'2026-06':{enrolled:true}}}
    ];
    state.groups=[
      {id:'g1',name:'BUSRA - FATMA - SULE - GOKCE',size:4,memberIds:['a','b','c','dd'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'16:00',defaultDays:[5],packages:[{month:'2026-06',startDate:'2026-06-01',sessions:8,price:8000,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
      {id:'g2',name:'BUSE - ZEYNEP',size:2,memberIds:['x','y'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'17:00',defaultDays:[5],packages:[],monthlyMembers:{},monthlyNotes:{}}
    ];
    // BOZUK planli ders: g1'e ait ama memberIds'inde x,y (grup-disi) VAR, FATMA yok -> 5 kisi (a,c,dd,x,y)
    state.lessons=[{id:'L1',date:'2026-06-26',time:'16:00',durationMin:45,instructorId:'h1',size:4,memberIds:['a','c','dd','x','y'],groupId:'g1',packageMonth:'2026-06',packageOwnerType:'group',packageOwnerId:'g1',status:'planned',note:''}];
    state.payments=[];
    const mmSel=document.getElementById('member-month'); if(mmSel){mmSel.innerHTML='<option value="2026-06">6</option>';mmSel.value='2026-06';}`);

  console.log('[1] MIGRATION: planli grup dersi TAM kadroya eslenir — grup-DISI (x,y) ATILIR, EKSIK uye (FATMA/b) EKLENIR');
  w.eval('applyV10MigrationToState(state);');
  const L1 = w.S().lessons.find(l=>l.id==='L1');
  t('x (BUSE) dersten atildi', !L1.memberIds.includes('x'), JSON.stringify(L1.memberIds));
  t('y (ZEYNEP) dersten atildi', !L1.memberIds.includes('y'));
  t('grup uyeleri (a,c,dd) korundu', ['a','c','dd'].every(id=>L1.memberIds.includes(id)), JSON.stringify(L1.memberIds));
  t('v51: EKSIK grup uyesi FATMA(b) derse EKLENDI', L1.memberIds.includes('b'), JSON.stringify(L1.memberIds));
  t('ders artik TAM kadro 4 kisi (grup roster ile birebir)', L1.memberIds.length===4, L1.memberIds.length);

  console.log('[2] DERS MODALI: edit acinca grup-DISI uyeler LISTEDE YOK, sadece grup kadrosu (4)');
  // bozuk dersi geri koyup modal davranisini test et (migration oncesi hali gibi)
  w.eval("state.lessons=[{id:'L2',date:'2026-06-26',time:'16:00',durationMin:45,instructorId:'h1',size:4,memberIds:['a','c','dd','x','y'],groupId:'g1',packageMonth:'2026-06',packageOwnerType:'group',packageOwnerId:'g1',status:'planned',note:''}];");
  w.openLessonModal('L2');
  const rosterHtml = d.getElementById('ml-members').innerHTML;
  t('BUSE HOS listede YOK (grup disi)', !rosterHtml.includes('BUSE HOS'), 'BUSE gorunuyor');
  t('ZEYNEP listede YOK (grup disi)', !rosterHtml.includes('ZEYNEP'), 'ZEYNEP gorunuyor');
  t('grup uyeleri listede (BUSRA,FATMA,SULE,GOKCE)', ['BUSRA','FATMA','SULE','GOKCE'].every(n=>rosterHtml.includes(n)));
  const boxes = [...d.querySelectorAll('#ml-members input[type=checkbox]')];
  t('listede TAM 4 kutu (grup boyutu)', boxes.length===4, boxes.length);
  const checkedCount = boxes.filter(b=>b.checked).length;
  t('secili <= 4 (kapasite asilmaz)', checkedCount<=4, checkedCount);

  console.log('[3] KAYDET: 4 grup uyesiyle ders BLOKSUZ kaydolur (kapasite 5 makine)');
  boxes.forEach(b=>{ b.checked = ['a','b','c','dd'].includes(b.value); });
  d.getElementById('ml-instructor').value='h1';
  d.getElementById('ml-size').value='4';
  w.saveLesson();
  const L2 = w.S().lessons.find(l=>l.id==='L2');
  t('ders kaydedildi, grup-disi yok', L2 && !L2.memberIds.includes('x') && !L2.memberIds.includes('y'), L2 && JSON.stringify(L2.memberIds));
  t('4 grup uyesi kayitli', L2 && ['a','b','c','dd'].every(id=>L2.memberIds.includes(id)) && L2.memberIds.length===4, L2 && JSON.stringify(L2.memberIds));
  t('kaydetme blogu YOK (uyari bos)', (d.getElementById('ml-warning').textContent||'')==='', d.getElementById('ml-warning').textContent);

  console.log('[4] SARKAN paket bozulmadi (grup uyesi baska ayin kadrosunda korunur)');
  // g1 Temmuz kadrosu farkli olsa da Haziran dersinde Haziran kadrosu esas
  t('Haziran roster filtresi g1 kadrosu', JSON.stringify(w.resolveGroupMembersForMonth(w.S().groups[0],'2026-06').filter(Boolean).sort())===JSON.stringify(['a','b','c','dd'].sort()));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('HATA', e&&e.stack||e); process.exit(1); } }, 1500);
