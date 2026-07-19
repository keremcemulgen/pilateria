// v51 — SAAT AYRAC NORMALIZASYONU: "18.15"/"18,15" -> "18:15"; timeToMinutes 0 donmez; ders takvimde gorunur
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

  console.log('[1] normTime — tek kaynak');
  t("'18.15' -> '18:15'", w.normTime('18.15')==='18:15', w.normTime('18.15'));
  t("'18,15' -> '18:15' (virgul)", w.normTime('18,15')==='18:15', w.normTime('18,15'));
  t("'18:15' -> '18:15' (aynen)", w.normTime('18:15')==='18:15');
  t("'1815' -> '18:15'", w.normTime('1815')==='18:15', w.normTime('1815'));
  t("'930' -> '09:30'", w.normTime('930')==='09:30', w.normTime('930'));
  t("'18' -> '18:00'", w.normTime('18')==='18:00', w.normTime('18'));
  t("'9:5' -> '09:05' (padle)", w.normTime('9:5')==='09:05', w.normTime('9:5'));
  t("'' -> ''", w.normTime('')==='');

  console.log('[2] bdParseTime — nokta destegi + geriye uyumluluk');
  t("bdParseTime('18.15')='18:15'", w.bdParseTime('18.15')==='18:15', w.bdParseTime('18.15'));
  t("bdParseTime('1000')='10:00'", w.bdParseTime('1000')==='10:00');
  t("bdParseTime('930')='09:30'", w.bdParseTime('930')==='09:30');
  t("bdParseTime('10')='10:00'", w.bdParseTime('10')==='10:00');

  console.log('[3] timeToMinutes — 0 donmez (KOK: takvimde gorunmeme)');
  t("timeToMinutes('18.15')=1095", w.timeToMinutes('18.15')===1095, w.timeToMinutes('18.15'));
  t("timeToMinutes('18:15')=1095", w.timeToMinutes('18:15')===1095);
  t("timeToMinutes('1815')=1095", w.timeToMinutes('1815')===1095, w.timeToMinutes('1815'));
  t("timeToMinutes('abc')=0 (gecersiz)", w.timeToMinutes('abc')===0, w.timeToMinutes('abc'));

  console.log('[4] MIGRATION — mevcut "18.15" ders saati kendini onarir');
  w.eval(`state.groups=[]; state.members=[{id:'mZ',name:'Z',joinDate:'2026-01-01',packages:[],monthly:{}}];
    state.lessons=[
      {id:'LT1',date:'2026-07-20',time:'18.15',memberIds:['mZ'],status:'planned',packageMonth:'2026-07'},
      {id:'LT2',date:'2026-07-21',time:'09,00',memberIds:['mZ'],status:'planned',packageMonth:'2026-07'},
      {id:'LT3',date:'2026-07-22',time:'10:30',memberIds:['mZ'],status:'planned',packageMonth:'2026-07'}
    ];
    applyV10MigrationToState(state);`);
  t("'18.15' ders saati -> '18:15'", w.S().lessons.find(l=>l.id==='LT1').time==='18:15', w.S().lessons.find(l=>l.id==='LT1').time);
  t("'09,00' ders saati -> '09:00'", w.S().lessons.find(l=>l.id==='LT2').time==='09:00', w.S().lessons.find(l=>l.id==='LT2').time);
  t("'10:30' zaten dogru, bozulmadi", w.S().lessons.find(l=>l.id==='LT3').time==='10:30');
  t("onarilan ders takvim konumu >0 (gorunur)", w.timeToMinutes(w.S().lessons.find(l=>l.id==='LT1').time)>0);

  console.log('[5] saveLesson — nokta yazimi kabul + normalize');
  w.eval(`state.instructors=[{id:'hZ',name:'HZ'}]; state.settings=state.settings||{}; state.settings.lessonDuration=45;`);
  const before = w.S().lessons.length;
  w.openLessonModal(null,'2026-07-25','18');
  d.getElementById('ml-time').value='18.15';
  d.getElementById('ml-instructor').value='hZ';
  d.getElementById('ml-size').value='1';
  w.saveLesson(); // uye secilmedi -> confirm=true -> bos ders kaydedilir
  const added = w.S().lessons.filter(l=>l.date==='2026-07-25');
  t('yeni ders kaydedildi', added.length===1, added.length);
  t("kaydedilen saat '18:15' (normalize)", added[0] && added[0].time==='18:15', added[0]&&added[0].time);
  t('kaydetme blogu yok (uyari bos)', (d.getElementById('ml-warning').textContent||'')==='', d.getElementById('ml-warning').textContent);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
