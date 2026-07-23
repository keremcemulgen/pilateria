// v2026.07.18.06 — takvimden ders: PAKET AYI secici, sarkan/onceki ay bitmemis paket secilebilir, ders o aya sayilir, o ayin batch/detayinda gorunur
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
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','renderPayments','renderReports','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','autoCompletePackages'].forEach(fn=>window[fn]=function(){});");
  // Grup: TEMMUZ paketi 8 ders, sadece 6 girilmis -> 2 KALAN (sarkan). Uyeler Temmuz kadrosunda.
  w.eval(`state.settings.groupPackageDays=30;
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8500}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'a',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}}},
      {id:'b',name:'BANU',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}}}
    ];
    state.groups=[{id:'g1',name:autoGroupName(['a','b']),size:2,memberIds:['a','b'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'10:00',defaultDays:[1],
      packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:8500,status:'active'}], monthlyMembers:{}, monthlyNotes:{}}];
    state.lessons=[];
    // Temmuzda 6 ders girilmis
    for(let i=0;i<6;i++) state.lessons.push({id:'jl'+i,date:'2026-07-0'+(i+1),time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['a','b'],groupId:'g1',packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'g1',status:'completed'});
    state.payments=[];
    const mmSel=document.getElementById('member-month'); if(mmSel){mmSel.innerHTML='<option value="2026-08">8</option>';mmSel.value='2026-08';}`);

  console.log('[1] Temmuz paketi BITMEMIS (2 ders kalan)');
  t('grup Temmuz kalan = 2', w.sessionsRemainingFor('group','g1','2026-07')===2, w.sessionsRemainingFor('group','g1','2026-07'));
  t('ownerUnfinishedMonths Temmuz doner', w.ownerUnfinishedMonths('group','g1').includes('2026-07'));

  console.log('[2] v107 KANON: AGUSTOS hucresinden grup sec -> paket ayi AGUSTOS (dersin ayi); sarkan ELLE + IPUCU');
  w.openLessonModal(null, '2026-08-03', '10:00'); // agustos bos hucre
  w.applyGroupToLesson('g1');
  const pmVal = d.getElementById('ml-pkg-month').value;
  t('paket ayi secici AGUSTOS secili (dersin ayi — otomatik sarkan YOK)', pmVal==='2026-08', pmVal);
  const optsText = d.getElementById('ml-pkg-month').innerHTML;
  t('Temmuz secenegi "ders kalan" isaretli (elle secim icin)', /Temmuz.*ders kalan/i.test(optsText) || /2026-07[^<]*ders kalan/i.test(optsText), 'isaret yok');
  const hintEl = d.getElementById('ml-pkg-hint');
  t('SARKAN IPUCU gorunur (Tem paketinde kalan var)', !!hintEl && hintEl.style.display!=='none' && /kalm/.test(hintEl.textContent), hintEl&&hintEl.textContent);

  console.log('[2b] Kullanici SARKAN icin Temmuzu ELLE secer');
  d.getElementById('ml-pkg-month').value='2026-07';
  w.onLessonPkgMonthChange();

  console.log('[3] Uyeler Temmuz kadrosuyla listeleniyor (agustos bos olsa da)');
  const rosterHtml = d.getElementById('ml-members').innerHTML;
  t('AYSE listede (Temmuz kadrosu)', rosterHtml.includes('AYSE'));
  t('BANU listede', rosterHtml.includes('BANU'));

  console.log('[4] Dersi kaydet -> TEMMUZ paketine sayilir (elle secim kazandi)');
  d.getElementById('ml-date').value='2026-08-03';
  d.getElementById('ml-time').value='10:00';
  d.getElementById('ml-instructor').value='h1';
  d.getElementById('ml-size').value='2';
  // uyeleri isaretle
  [...d.querySelectorAll('#ml-members input.gm-mc, #ml-members input[type=checkbox]')].forEach(cb=>{ if(['a','b'].includes(cb.value)) cb.checked=true; });
  w.saveLesson();
  const newL = w.S().lessons.find(l=>l.date==='2026-08-03');
  t('yeni ders olustu', !!newL);
  t('packageMonth = 2026-07 (Temmuz paketine sayildi)', newL && newL.packageMonth==='2026-07', newL && newL.packageMonth);
  t('Temmuz kalan artik 1 (2->1, sarkan ders dustu)', w.sessionsRemainingFor('group','g1','2026-07')===1, w.sessionsRemainingFor('group','g1','2026-07'));

  console.log('[5] Ders TEMMUZ toplu-tarih (batch) listesinde gorunur');
  w.openBatchDates('g1','2026-07');
  const inBatch = (w.eval('__batchDatesRows')||[]).some(r=>r.date==='2026-08-03');
  t('Agustos tarihli ders Temmuz batch listesinde', inBatch, JSON.stringify(w.eval('__batchDatesRows').map(r=>r.date)));

  console.log('[6] EDIT: paket ayini Agustosa cevir -> ders Agustosa tasinir');
  w.eval("closeModal('modal-batch-dates');");
  w.openLessonModal(newL.id);
  d.getElementById('ml-pkg-month').value='2026-08';
  w.saveLesson();
  const edited = w.S().lessons.find(l=>l.id===newL.id);
  t('duzenlemede paket ayi Agustosa cevrildi', edited.packageMonth==='2026-08', edited.packageMonth);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('HATA', e&&e.stack||e); process.exit(1); } }, 1500);
