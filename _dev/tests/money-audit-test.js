// Pilateria — PARA/HOCA DENETIM TESTI (calcTax, resolveInstructorRate, hakedis, panel geliri, hoca otomatik)
// Calistirma: NODE_PATH=/tmp/piltest/node_modules TZ=Europe/Istanbul node tests/money-audit-test.js pilateria-dev.html
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
function approx(a,b){ return Math.abs(a-b) < 0.01; }
setTimeout(()=>{ try {
  w.eval(`
    state.settings.kdvRate=20; state.settings.gvRate=15; state.settings.instructorShareRate=30;
    state.instructors.push({id:'hA',name:'BUSE',shareRate:null},{id:'hB',name:'MERVE',shareRate:40});
    state.members.push(
      {id:'mA',name:'AYSE',joinDate:'2026-06-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'hA',health:'',note:'',totalPrice:4000,instructorShareRate:null},
      {id:'mB',name:'SELIN',joinDate:'2026-06-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'hB',health:'',note:'',totalPrice:5000,instructorShareRate:50}
    );
    state.groups.push({id:'gA',name:'GRUPA',size:2,memberIds:['mA','mB'],defaultInstructorId:'hA',defaultPackageId:'',defaultTime:'10:00',defaultDays:[2],packages:[{month:'2026-06',startDate:'2026-06-01',sessions:8,price:16000,status:'active',rescheduleUsed:0,cancelUsed:0}],rescheduleUsed:0,cancelUsed:0,customTotalPrice:16000});
    window.S = () => state;
  `);

  console.log('[1] VERGI/KDV matematigi (calcTax)');
  let r = w.calcTax(1000,'IBAN');
  t('IBAN 1000: net 833.33', approx(r.net,833.3333), r.net);
  t('IBAN 1000: KDV 166.67', approx(r.kdv,166.6667), r.kdv);
  t('IBAN 1000: GV 125.00 (netin %15i)', approx(r.gv,125), r.gv);
  t('IBAN 1000: cebe 708.33', approx(r.pocket,708.3333), r.pocket);
  t('net+kdv = brut', approx(r.net+r.kdv,1000));
  r = w.calcTax(1000,'Nakit');
  t('Nakit: vergi 0, cebe 1000', r.kdv===0 && r.gv===0 && r.pocket===1000);

  console.log('[2] buildPaymentRecord vergi alanlari kayitta');
  const rec = w.buildPaymentRecord('','mA','gA','2026-06-10',null,8,2000,2000,'IBAN','','','',false);
  t('kayitta net/kdv/gv/pocket yuvarlanmis', approx(rec.net,1666.67)&&approx(rec.kdv,333.33)&&approx(rec.gv,250)&&approx(rec.pocket,1416.67), JSON.stringify([rec.net,rec.kdv,rec.gv,rec.pocket]));

  console.log('[3] HOCA ORANI cozum zinciri (5 seviye)');
  const L = { id:'x', date:'2026-06-10', time:'10:00', durationMin:45, instructorId:'hA', size:2, memberIds:['mA','mB'], groupId:'gA', packageMonth:'2026-06', packageOwnerType:'group', packageOwnerId:'gA', status:'completed', note:'' };
  t('ozel oran yok -> settings %30', w.resolveInstructorRate({...L, instructorId:'hA'}) === 30);
  t('hoca orani -> %40 (hB)', w.resolveInstructorRate({...L, instructorId:'hB'}) === 40);
  w.eval(`state.groups.find(g=>g.id==='gA').instructorShareRate = 35;`);
  t('grup orani hoca oranini ezer -> %35', w.resolveInstructorRate({...L, instructorId:'hB'}) === 35);
  w.eval(`state.groups.find(g=>g.id==='gA').packages[0].instructorShareRate = 45;`);
  t('paket orani grubu ezer -> %45', w.resolveInstructorRate({...L, instructorId:'hB'}) === 45);
  t('ders override hepsini ezer -> %60', w.resolveInstructorRate({...L, instructorRateOverride:60}) === 60);
  w.eval(`delete state.groups.find(g=>g.id==='gA').packages[0].instructorShareRate; state.groups.find(g=>g.id==='gA').instructorShareRate = undefined;`);
  t('bireysel uye orani -> %50 (mB)', w.resolveInstructorRate({ date:'2026-06-10', instructorId:'hA', memberIds:['mB'], groupId:'', status:'completed' }) === 50);

  console.log('[4] HOCA HAKEDISI: paket fiyati / ders sayisi * oran');
  w.eval(`state.lessons.push(
    {id:'e1',date:'2026-06-03',time:'10:00',durationMin:45,instructorId:'hA',size:2,memberIds:['mA','mB'],groupId:'gA',packageMonth:'2026-06',packageOwnerType:'group',packageOwnerId:'gA',status:'completed',note:''},
    {id:'e2',date:'2026-06-05',time:'10:00',durationMin:45,instructorId:'hA',size:2,memberIds:['mA','mB'],groupId:'gA',packageMonth:'2026-06',packageOwnerType:'group',packageOwnerId:'gA',status:'missed',note:''},
    {id:'e3',date:'2026-06-07',time:'10:00',durationMin:45,instructorId:'hA',size:2,memberIds:['mA','mB'],groupId:'gA',packageMonth:'2026-06',packageOwnerType:'group',packageOwnerId:'gA',status:'planned',note:''}
  );`);
  const e1 = w.S().lessons.find(l=>l.id==='e1');
  // v41 KANON: ders geliri = grubun O AYKI TOPLAM fiyati (uye fiyat toplami) / 8; hoca = x %30
  const __gaBase = w.groupExpectedTotal(w.S().groups.find(g=>g.id==='gA'), '2026-06');
  const __gaPer = __gaBase/8*0.30;
  t('ders geliri = grup ay-toplami('+__gaBase+')/8 x %30 = '+__gaPer, approx(w.instructorEarningForLesson(e1), __gaPer), w.instructorEarningForLesson(e1));
  t('YANAN ders de hoca kazanir ('+__gaPer+')', approx(w.instructorEarningForLesson(w.S().lessons.find(l=>l.id==='e2')), __gaPer));
  t('PLANLI ders kazandirmaz (0)', w.instructorEarningForLesson(w.S().lessons.find(l=>l.id==='e3')) === 0);

  console.log('[5] HOCALAR sayfasi == MAASLAR sayfasi (ayni cekirdek)');
  const buckets = w.instructorEarningsByGroupSize('hA','2026-06');
  const bucketTotal = buckets[1]+buckets[2]+buckets[3]+buckets[4]+buckets[5];
  const salary = w.instructorEarningsForMonth('hA','2026-06').total;
  t('iki sayfa ayni toplam ('+(__gaPer*2)+')', approx(bucketTotal, salary) && approx(salary, __gaPer*2), bucketTotal+' vs '+salary);

  console.log('[6] PANEL geliri = PAKET AYI kanonu');
  const cm = w.currentMonth();
  w.eval(`state.payments.push(
    {id:'pp1',memberId:'mA',groupId:'gA',date:'2026-05-31',packageMonth:'${'${cm}'}',pkgName:'G',sessions:8,amount:8000,listPrice:8000,method:'Nakit',partial:false,note:''},
    {id:'pp3',memberId:'mA',groupId:'',date:'${'${cm}'}-15',packageMonth:'2099-01',pkgName:'G',sessions:8,amount:999,listPrice:999,method:'Nakit',partial:false,note:''}
  );`);
  const expectedRev = w.S().payments.filter(p => (p.packageMonth || (p.date?String(p.date).slice(0,7):'')) === cm).reduce((a,b)=>a+(+b.amount||0),0);
  w.renderDashboard();
  const shown = d.getElementById('s-revenue').textContent.replace(/[^0-9]/g,'');
  t('Panel = packageMonth toplami; baska ayin odemesi karismaz', shown === String(Math.round(expectedRev)), shown + ' vs ' + expectedRev);

  console.log('[7] BIREYSEL derste uye isaretlenince HOCASI otomatik');
  w.openLessonModal(null, '2026-06-20', '11:00');
  // v29: grupsuz derste liste aramayla dolar — arama akisini da test et
  w.eval(`__lessonMemberSearch='B'; renderLessonMembersCheckboxes();`);
  let cbB = [...d.querySelectorAll('#ml-members input[type=checkbox]')].find(c=>c.value==='mB');
  if(!cbB){ w.eval(`__lessonMemberSearch=state.members.find(m=>m.id==='mB').name.slice(0,3); renderLessonMembersCheckboxes();`); cbB = [...d.querySelectorAll('#ml-members input[type=checkbox]')].find(c=>c.value==='mB'); }
  cbB.checked = true; w.onLessonMemberToggle(cbB);
  t('hoca otomatik hB secildi', d.getElementById('ml-instructor').value === 'hB');
  w.eval(`__lessonMemberSearch=state.members.find(m=>m.id==='mA').name.slice(0,3); renderLessonMembersCheckboxes(['mB']);`);
  const cbA = [...d.querySelectorAll('#ml-members input[type=checkbox]')].find(c=>c.value==='mA');
  cbA.checked = true; w.onLessonMemberToggle(cbA);
  t('hoca doluyken EZMEZ (hB kalir)', d.getElementById('ml-instructor').value === 'hB');
  w.closeModal('modal-lesson');

  console.log('[8] Toplu girislerde hoca otomatik (grup + bireysel)');
  w.openBatchDatesGroup('gA','2026-06');
  w.eval(`__batchDatesRows = [{lessonId:null,date:'2026-06-22',time:'09:00'}];`);
  w.saveBatchDates();
  const nb = w.S().lessons.find(l=>l.groupId==='gA'&&l.date==='2026-06-22');
  t('grup batch dersi grubun hocasi (hA)', nb && nb.instructorId==='hA');
  w.openBatchDatesMember('mB','2026-06');
  w.eval(`__batchDatesRows = [{lessonId:null,date:'2026-06-23',time:'09:00'}];`);
  w.saveBatchDates();
  const nm = w.S().lessons.find(l=>!l.groupId&&l.date==='2026-06-23');
  t('bireysel batch dersi uyenin hocasi (hB)', nm && nm.instructorId==='hB');

  console.log('[9] addGroupLesson + scheduleGroupMonth + autoGenerate hocalari');
  w.eval(`state.groups.push({id:'gB',name:'GB',size:1,memberIds:['mA'],defaultInstructorId:'hB',defaultPackageId:'',defaultTime:'14:00',defaultDays:[1,4],packages:[],rescheduleUsed:0,cancelUsed:0});`);
  w.eval(`autoGenerateGroupLessons('gB','2026-06-01');`);
  const ag = w.S().lessons.filter(l=>l.groupId==='gB');
  t('otomatik uretilen derslerin hocasi grubun varsayilani', ag.length>0 && ag.every(l=>l.instructorId==='hB'), ag.length);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },700);
