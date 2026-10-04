// v187 — (Kerem 2026-10-04 "Ben secmek isterim") GRUPTA KENDI DERS HAKKI OLAN UYE DERSLERE OTOMATIK YAZILMAZ.
// Kok: grup "tek birim" (v43) — kadrodaki herkes grubun tum planli derslerine otomatik yaziliyordu; uyenin kendi hakki
// (6) yalniz ucrette kullaniliyordu → ÖZG*** BAH*** 6 hakla 7 derste goruniyordu. v187: __hasOwnHak187 — kendi hakki olan
// uye yeni derslere ve kadro senkronuna OTOMATIK girmez; Kerem ders penceresinden secer, secimi korunur; zaten yazili
// oldugu dersler dokunulmaz. Yamasiz (v186) build'de FAIL eder.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return (o&&o.input)?String(o.input.value):true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 80));
const J = (e) => JSON.parse(w.eval('JSON.stringify(' + e + ')') || 'null');
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderArchive'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const sh = (k) => { const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-1+k,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); };
  const T = sh(1);
  w.eval(`
    state.settings.reformers=12; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const mk=(id,name,mo)=>({id:id,name:name,phone:'',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,instructorId:'h1',packages:[],monthly:mo});
    state.members=[mk('A','AYSE',{'${T}':{enrolled:true}}),mk('B','BERNA',{'${T}':{enrolled:true}}),mk('C','CEREN',{'${T}':{enrolled:true,sessionsOverride:6,totalPrice:3375,__prorata:true}}),mk('D','DEFNE',{'${T}':{enrolled:true}})];
    state.groups=[{id:'G',name:'AYSE - BERNA - CEREN - DEFNE',size:4,memberIds:['A','B','C','D'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'10:00',packages:[],monthlyMembers:{'${T}':['A','B','C','D']},monthlyNotes:{}}];
    state.lessons=[]; state.payments=[];
    document.getElementById('member-month').innerHTML='<option value="${T}">${T}</option>'; document.getElementById('member-month').value='${T}';
  `);
  const pl = () => J(`state.lessons.filter(l=>l.groupId==='G'&&l.status==='planned').sort((a,b)=>a.date.localeCompare(b.date))`);

  console.log('[1] otomatik ders uretimi: CEREN (kendi hakki 6) yazilmaz, digerleri yazilir');
  w.eval(`autoGenerateGroupLessons('G','${T}-01')`);
  { const L = pl(); t('8 ders uretildi', L.length===8, L.length); t('hicbirinde CEREN yok, hepsinde A,B,D var', L.every(l=>!l.memberIds.includes('C') && ['A','B','D'].every(x=>l.memberIds.includes(x))), JSON.stringify(L.map(l=>l.memberIds.join('')))); }

  console.log('[2] Kerem secer: grup ders penceresinde CEREN isaretsiz + "kendi hakki 6 · 0 derste"; isaretleyip kaydet');
  const L0 = pl();
  w.eval(`openGroupLessonModal('${L0[1].id}')`); await tick();
  { const row = [...d.querySelectorAll('#gl-members label')].find(x => /CEREN/.test(x.textContent));
    t('CEREN listede, isaretsiz, rozet', !!row && !row.querySelector('input').checked && /kendi hakkı 6 · 0 derste/.test(row.textContent), row && row.textContent.replace(/\s+/g,' '));
    if (row) row.querySelector('input').checked = true; }
  w.eval('saveGroupLesson()'); await tick(150);
  t('secilen derste CEREN var', J(`state.lessons.find(l=>l.id==='${L0[1].id}').memberIds`).includes('C'));

  console.log('[3] kadro senkronu secimi KORUR, baska derse eklemez');
  w.eval(`syncGroupLessonsToRoster('G','${T}')`);
  { const L = pl(); t('CEREN yalniz secilen derste', L.filter(l=>l.memberIds.includes('C')).map(l=>l.id).join()===L0[1].id, JSON.stringify(L.map(l=>l.id+':'+l.memberIds.join('')))); }
  w.eval(`openGroupLessonModal('${L0[2].id}')`); await tick();
  { const row = [...d.querySelectorAll('#gl-members label')].find(x => /CEREN/.test(x.textContent)); t('rozet sayaci: kendi hakki 6 · 1 derste', !!row && /kendi hakkı 6 · 1 derste/.test(row.textContent), row && row.textContent.replace(/\s+/g,' ')); }
  w.eval("closeModal('modal-group-lesson')");
  t('CEREN Kalan Ders = 6 − 1 = 5', w.eval(`memberRemainingForMonth('C','${T}')`)===5, w.eval(`memberRemainingForMonth('C','${T}')`));

  console.log('[4] zaten yazili oldugu dersler dokunulmaz: DEFNE\'ye sonradan kendi hak verilince 8 dersinden dusmez');
  w.eval(`setMemberMonthly('D','${T}',{sessionsOverride:5}); syncGroupLessonsToRoster('G','${T}');`);
  t('DEFNE 8 derste kaldi', pl().every(l=>l.memberIds.includes('D')));

  console.log('[5] ders penceresinden yeni grup dersi: on-secimde CEREN isaretsiz');
  w.eval(`openLessonModal(null,'${T}-28','15:00','G','${T}')`); await tick();
  { const c = d.querySelector('#modal-lesson input[type=checkbox][value="C"]'); const a = d.querySelector('#modal-lesson input[type=checkbox][value="A"]');
    t('A isaretli, CEREN listede ama isaretsiz', !!a && a.checked && !!c && !c.checked, JSON.stringify([...d.querySelectorAll('#modal-lesson input[type=checkbox]')].map(x=>x.value+':'+x.checked))); }
  w.eval("closeModal('modal-lesson')");

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
