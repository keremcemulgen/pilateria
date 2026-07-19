// v57 — KADRO TEK KAYNAK (activeGroupRosterForMonth): bayat uye sizmasi KOK FIX
// Kerem ekrani: planli grup dersinde grupta OLMAYAN uyeler (LALE/ELIF) isaretli gorunuyordu.
// Kok: saveBatchDates dersleri g.memberIds'ten (AY FILTRESIZ ham liste) yaziyordu; "aktif kadro"
// tanimi 5+ yerde farkliydi. Artik tek kanonik fonksiyon; modal planli derste yalniz kadroyu gosterir.
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
const J=a=>JSON.stringify(a);
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  w.eval("['closeModal','openModal','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','renderCalendar','renderDashboard','renderMembers','renderGroups'].forEach(fn=>window[fn]=function(){}); window.save=function(){}; window.capacityLeftFor=function(){return 99;}; window.instructorBusy=function(){return null;};");
  const ay='2026-07';
  function baseState(){
    w.eval(`
      const M=(id)=>({id,name:id.toUpperCase(),joinDate:'2026-01-01',archived:false,totalPrice:4500,packages:[],
        monthly:{'2026-06':{enrolled:true},'2026-07':{enrolled:true}}});
      state.settings=state.settings||{}; state.settings.reformerCount=8; state.instructors=[{id:'h',name:'H'}];
      state.members=[M('didem'),M('nurgul'),M('vennur'),M('zarem'),M('lale'),M('elif')];
      // g.memberIds BAYAT (6 kisi — lale/elif hala kok listede); AY kadrosu ise 4 guncel kisi:
      state.groups=[{id:'G',name:'G',size:4,memberIds:['nurgul','vennur','lale','elif','didem','zarem'],
        monthlyMembers:{'2026-07':['didem','nurgul','vennur','zarem']},
        packages:[{month:'2026-07',sessions:8,status:'active'}], defaultInstructorId:'h', defaultTime:'20:00'}];
      state.lessons=[]; state.payments=[];
    `);
  }

  console.log('[1] KANONIK: activeGroupRosterForMonth = o ayin AKTIF kadrosu');
  baseState();
  t('kanon = [didem,nurgul,vennur,zarem] (bayat kok liste DEGIL)',
    J(w.activeGroupRosterForMonth(w.S().groups[0], ay))===J(['didem','nurgul','vennur','zarem']),
    J(w.activeGroupRosterForMonth(w.S().groups[0], ay)));

  console.log('[2] BATCH KOK FIX: Toplu Tarih Gir yeni dersi KANONIK kadroyla yazar');
  w.eval(`__batchDatesTarget={type:'group',id:'G',packageMonth:'${ay}'};
          __batchDatesRows=[{lessonId:'',date:'2026-07-21',time:'20:00',status:'planned',last:false}];
          saveBatchDates();`);
  const bl = w.S().lessons.find(l=>l.date==='2026-07-21');
  t('batch dersi olustu', !!bl);
  t('memberIds = KANONIK 4 kisi (lale/elif YAZILMADI)', bl && J(bl.memberIds.slice().sort())===J(['didem','nurgul','vennur','zarem']), bl&&J(bl.memberIds));

  console.log('[3] KEREM EKRANI: bayat memberIds\'li PLANLI ders -> modal yalniz KADRO gosterir + ONARIR');
  baseState();
  w.eval(`state.lessons=[{id:'L',date:'2026-07-22',time:'20:00',status:'planned',instructorId:'h',groupId:'G',
    memberIds:['nurgul','vennur','lale','elif'],packageMonth:'${ay}',packageOwnerType:'group',packageOwnerId:'G',size:4}];`);
  w.openGroupLessonModal('L');
  let names=[...d.querySelectorAll('#gl-members label')].map(l=>({n:l.textContent.trim().replace(/\s+/g,' '),c:l.querySelector('input').checked}));
  t('listede TAM 4 kisi (kadro)', names.length===4, J(names.map(x=>x.n)));
  t('LALE/ELIF GORUNMUYOR (Kerem talebi)', !names.some(x=>/LALE|ELIF/.test(x.n)), J(names.map(x=>x.n)));
  t('DIDEM ve ZAREM ISARETLI geldi (kanonik — bayat memberIds degil)', names.every(x=>x.c), J(names));
  d.getElementById('gl-date').value='2026-07-22'; d.getElementById('gl-time').value='20:00';
  w.saveGroupLesson(); // hicbir seye dokunmadan Kaydet
  const Lz=()=>w.S().lessons.find(x=>x.id==='L');
  t('KAYDET veriyi ONARDI: memberIds = 4 guncel kisi', J(Lz().memberIds.slice().sort())===J(['didem','nurgul','vennur','zarem']), J(Lz().memberIds));
  t('yanlis excluded OLUSMADI (didem/zarem excluded degil)', !(Lz().excludedMemberIds||[]).length, J(Lz().excludedMemberIds));

  console.log('[4] ELLE CIKARMA hala calisir (kanonik isaretlerle)');
  w.openGroupLessonModal('L');
  const zBox=[...d.querySelectorAll('#gl-members input.gl-mc')].find(b=>b.value==='zarem');
  zBox.checked=false; w.saveGroupLesson();
  t('zarem cikti, excluded=[zarem]', !Lz().memberIds.includes('zarem') && J(Lz().excludedMemberIds)===J(['zarem']), J(Lz().excludedMemberIds));
  w.eval("syncGroupLessonsToRoster('G','2026-07'); applyV10MigrationToState(state);");
  t('sync+migration zarem\'i GERI EKLEMEZ', !Lz().memberIds.includes('zarem'), J(Lz().memberIds));
  w.openGroupLessonModal('L');
  const zBox2=[...d.querySelectorAll('#gl-members input.gl-mc')].find(b=>b.value==='zarem');
  t('yeniden acinca zarem listede ve ISARETSIZ (geri eklenebilir)', zBox2 && !zBox2.checked);

  console.log('[5] TARIHSEL (yapildi) ders: gercek katilimcilar KORUNUR (maas verisi bozulmaz)');
  baseState();
  w.eval(`state.lessons=[{id:'LH',date:'2026-07-05',time:'20:00',status:'completed',instructorId:'h',groupId:'G',
    memberIds:['nurgul','vennur','lale','elif'],packageMonth:'${ay}',packageOwnerType:'group',packageOwnerId:'G',size:4}];`);
  w.openGroupLessonModal('LH');
  names=[...d.querySelectorAll('#gl-members label')].map(l=>({n:l.textContent.trim().replace(/\s+/g,' '),c:l.querySelector('input').checked}));
  t('tarihsel: lale/elif rozetle GORUNUR (o gun girmisler)', names.some(x=>/LALE/.test(x.n)) && names.some(x=>/ELIF/.test(x.n)), J(names.map(x=>x.n)));
  t('tarihsel: memberIds isaretli (nurgul/vennur/lale/elif)', names.filter(x=>x.c).length===4);
  w.eval('applyV10MigrationToState(state);');
  t('migration TARIHSEL derse dokunmaz', J(w.S().lessons[0].memberIds)===J(['nurgul','vennur','lale','elif']), J(w.S().lessons[0].memberIds));

  console.log('[6] TUTARLILIK: migration == sync == batch == modal AYNI kadroyu uretir');
  baseState();
  w.eval(`state.lessons=[{id:'LP',date:'2026-07-23',time:'20:00',status:'planned',instructorId:'h',groupId:'G',
    memberIds:['lale'],packageMonth:'${ay}',packageOwnerType:'group',packageOwnerId:'G',size:4}];`);
  const canon = J(w.activeGroupRosterForMonth(w.S().groups[0], ay));
  w.eval('applyV10MigrationToState(state);');
  const afterMig = J(w.S().lessons[0].memberIds);
  w.eval("S().lessons[0].memberIds=['elif']; syncGroupLessonsToRoster('G','2026-07');");
  const afterSync = J(w.S().lessons[0].memberIds);
  t('migration sonucu == kanon', afterMig===canon, afterMig+' vs '+canon);
  t('sync sonucu == kanon', afterSync===canon, afterSync+' vs '+canon);

  console.log('[7] SENKRON GUVENLIGI: kadrodaki bilinmeyen id migration\'da KORUNUR, modalda GIZLENIR');
  baseState();
  w.eval(`state.groups[0].monthlyMembers['2026-07']=['didem','nurgul','ghost1'];
    state.lessons=[{id:'LG2',date:'2026-07-24',time:'20:00',status:'planned',instructorId:'h',groupId:'G',
    memberIds:['didem'],packageMonth:'${ay}',packageOwnerType:'group',packageOwnerId:'G',size:4}];`);
  w.eval('applyV10MigrationToState(state);');
  t('migration ghost1\'i KORUR (uye kaydi henuz sync olmamis olabilir)', w.S().lessons[0].memberIds.includes('ghost1'), J(w.S().lessons[0].memberIds));
  w.openGroupLessonModal('LG2');
  const gnames=[...d.querySelectorAll('#gl-members label')].map(l=>l.textContent.trim());
  t('modal ghost\'u gostermez (UI kanonu)', !gnames.some(x=>/ghost1/.test(x)), J(gnames));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
