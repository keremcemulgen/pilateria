// v141 — TOPLU DERS CAKISMA DETAYI: hangi dersle cakisiyor goster + oradan duzenle + otomatik yansima.
// Yamasiz build'de FAIL etmeli (eskiden yalniz alert vardi, modal yoktu).
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
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};
    w.__PL_DLG_AUTO__=(o)=>{ w.__dlgMsg = o && o.msg; return o && o.input ? null : true; };
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function ev(x){ return w.eval(x); }
setTimeout(()=>{ try {
  const CM = ev('currentMonth()');
  w.eval(`
    state.settings.reformers = 5; state.settings.lessonDuration = 45;
    state.packageTypes=[]; state.campaigns=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
    state.instructors=[{id:'h1',name:'BUSE',shareRate:30},{id:'h2',name:'DERYA',shareRate:30}];
    state.members=[
      {id:'z',name:'ZEYNEP',joinDate:'2026-01-01',totalPrice:4000,instructorId:'h1',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'y',name:'YAREN',joinDate:'2026-01-01',totalPrice:4000,instructorId:'h2',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'k1',name:'K1',joinDate:'2026-01-01',totalPrice:4000,packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'k2',name:'K2',joinDate:'2026-01-01',totalPrice:4000,packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'k3',name:'K3',joinDate:'2026-01-01',totalPrice:4000,packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'k4',name:'K4',joinDate:'2026-01-01',totalPrice:4000,packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'k5',name:'K5',joinDate:'2026-01-01',totalPrice:4000,packages:[],monthly:{'${CM}':{enrolled:true}}}
    ];
    state.groups=[{id:'gd',name:'DOLU GRUP',size:5,memberIds:['k1','k2','k3','k4','k5'],defaultInstructorId:'h2',packages:[],monthlyMembers:{'${CM}':['k1','k2','k3','k4','k5']},monthlyNotes:{}}];
    state.lessons=[
      {id:'E1',date:'${CM}-15',time:'10:00',durationMin:45,instructorId:'h2',size:5,memberIds:['k1','k2','k3','k4','k5'],groupId:'gd',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'gd',status:'planned'},
      {id:'E2',date:'${CM}-15',time:'11:00',durationMin:45,instructorId:'h1',size:1,memberIds:['y'],groupId:'',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'y',status:'planned'}
    ];`);

  console.log('[1] CAKISMA MODALI: makine + hoca sorunlari cakisan DERSLERIYLE listelenir');
  w.openBatchDatesMember('z', CM);
  w.eval(`__batchDatesRows = [
    {lessonId:null, date:'${CM}-15', time:'10:00', status:'planned'},
    {lessonId:null, date:'${CM}-15', time:'11:00', status:'planned'}
  ];`);
  const ders0 = ev('state.lessons.length');
  w.saveBatchDates();
  t('hicbir sey KAYDEDILMEDI (v18 kanonu aynen)', ev('state.lessons.length') === ders0);
  const mdl = d.getElementById('modal-batch-conflicts');
  t('cakisma modali ACILDI (eskiden yalniz alert)', !!mdl);
  const mh = mdl ? mdl.innerHTML : '';
  t('makine sorunu cakisan GRUP DERSIYLE gosterilir', /DOLU GRUP/.test(mh) && /5 kişi/.test(mh) && /10:00/.test(mh), mh.slice(0,200));
  t('hoca sorunu cakisan dersle gosterilir (YAREN 11:00)', /YAREN/.test(mh) && /11:00/.test(mh));
  t('cakisan derslere Duzenle dugmesi var', /__editConflictLesson\('E1'\)/.test(mh) && /__editConflictLesson\('E2'\)/.test(mh));
  t('Tekrar Kaydet dugmesi var', /saveBatchDates\(\)/.test(mh));

  console.log('[2] DUZENLE: cakisan ders standart editorde acilir');
  w.eval("window.openModal=function(id){window.__opened=id;};");
  w.__editConflictLesson('E2');
  t('cakisma modali kapandi', !d.getElementById('modal-batch-conflicts'));
  t('ders editoru acildi (modal-lesson) ve E2 yuklendi', w.__opened==='modal-lesson' && d.getElementById('ml-id').value==='E2', d.getElementById('ml-id').value);

  console.log('[3] DUZENLEME SONRASI: kayit gecer, degisiklik HER YERE otomatik yansir');
  w.eval("state.lessons.find(l=>l.id==='E2').time='13:00';"); // editorde saati degistirdi (saveLesson esdegeri)
  w.eval("state.lessons.find(l=>l.id==='E1').memberIds=['k1','k2','k3']; state.lessons.find(l=>l.id==='E1').size=3;"); // grup kucultuldu
  w.openBatchDatesMember('z', CM);
  w.eval(`__batchDatesRows = [
    {lessonId:null, date:'${CM}-15', time:'10:00', status:'planned'},
    {lessonId:null, date:'${CM}-15', time:'11:00', status:'planned'}
  ];`);
  w.saveBatchDates();
  t('artik kayit GECTI (2 yeni ders)', ev('state.lessons.length') === ders0 + 2, ev('state.lessons.length'));
  t('cakisma modali YOK', !d.getElementById('modal-batch-conflicts'));
  w.openBatchDatesMember('y', CM);
  const yRows = ev("JSON.stringify(__batchDatesRows.filter(r=>r.lessonId).map(r=>r.time))");
  t('YARENin toplu listesi YENI saati (13:00) otomatik gosterir', /13:00/.test(yRows), yRows);
  w.eval("closeModal('modal-batch-dates')");

  console.log('[4] LISTE-ICI cakisma "#N satiri" diye isaretlenir (kendi listende duzelt)');
  w.eval("state.lessons = state.lessons.filter(l=>['E1','E2'].includes(l.id));");
  w.openBatchDatesMember('z', CM);
  w.eval(`__batchDatesRows = [
    {lessonId:null, date:'${CM}-16', time:'09:00', status:'planned'},
    {lessonId:null, date:'${CM}-16', time:'09:00', status:'planned'}
  ];`);
  w.saveBatchDates();
  const mh4 = (d.getElementById('modal-batch-conflicts')||{}).innerHTML || '';
  t('ayni saate iki satir: "bu listedeki #" uyarisi', /bu listedeki #/.test(mh4), mh4.slice(0,180));
  t('liste-ici cakismada Duzenle dugmesi YOK (id yok)', !/__editConflictLesson/.test(mh4));
  const kapat = d.querySelector('#modal-batch-conflicts .btn.secondary');
  if (kapat) kapat.click();
  t('Kapat calisiyor', !d.getElementById('modal-batch-conflicts'));

  console.log('[5] DENETIM DUZELTMESI: uye detayi Aktive Et artik kadroya da yazar (v58)');
  w.eval("state.members.push({id:'arc',name:'ARSIVLI',joinDate:'2026-01-01',totalPrice:4000,packages:[],monthly:{},archived:true,archivedAt:'2026-06-10T09:00:00'});");
  const ms=d.getElementById('member-month'); if(ms && !Array.from(ms.options).some(o=>o.value===CM)) ms.innerHTML+='<option value="'+CM+'">'+CM+'</option>';
  if (ms) ms.value=CM;
  w.openMemberDetail('arc');
  const mdc = d.getElementById('modal-member-detail').innerHTML;
  t('detay dugmesi reactivateMemberForMonth cagirir (bare degil)', /reactivateMemberForMonth\('arc'/.test(mdc), (mdc.match(/reactivateMember[^"]*/)||['yok'])[0].slice(0,80));
  w.reactivateMemberForMonth('arc', CM);
  t('aktive edilince CM kadrosunda GORUNUR', ev("isMemberEnrolledInMonth('arc','"+CM+"')") === true && ev("buildMemberRows('"+CM+"').some(r=>r.memberId==='arc')"));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
