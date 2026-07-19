// v29 — GOOGLE TARZI TAKVIM: yerlesim matematigi + tiklama sozlesmeleri + rozetler
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
    w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
    w.innerWidth=1400;
  }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }

setTimeout(()=>{ try {
  // Salı 2026-07-14 sabit hafta; açılış 09, kapanış 21
  w.eval(`
    state.settings.open=9; state.settings.close=21; state.settings.workDays=[1,2,3,4,5,6]; state.settings.reformers=5;
    state.instructors.push({id:'hG',name:'GCAL HOCA'});
    state.members.push({id:'mG1',name:'GCAL BIR',joinDate:'2026-07-01',monthly:{},packages:[]},{id:'mG2',name:'GCAL IKI',joinDate:'2026-07-01',monthly:{},packages:[]});
    state.groups.push({id:'gG',name:'GCAL GRUP',size:2,memberIds:['mG1','mG2'],packages:[]});
    state.lessons.push(
      {id:'LG1',date:'2026-07-14',time:'10:00',durationMin:45,instructorId:'hG',size:2,memberIds:['mG1','mG2'],groupId:'gG',packageMonth:'2026-07',status:'planned',note:''},
      {id:'LG2',date:'2026-07-14',time:'10:15',durationMin:45,instructorId:'',size:1,memberIds:['mG1'],groupId:'',packageMonth:'2026-07',status:'planned',note:''},
      {id:'LG3',date:'2026-07-15',time:'12:00',durationMin:45,instructorId:'hG',size:1,memberIds:['mG2'],groupId:'',packageMonth:'2026-06',status:'cancelled',note:''}
    );
    calAnchor = parseISO('2026-07-14');
    calView = 'week';
    switchPage('calendar');
  `);
  console.log('[1] HAFTA gorunumu iskeleti');
  t('gcal konteyneri', !!d.querySelector('.gcal'));
  t('7 gun basligi', d.querySelectorAll('.gcal-dayhead').length===7);
  const __todayNum = String(new Date().getDate());
  const __todayEl = d.querySelector('.gcal-dayhead.today .gdh-num');
  t('bugun isaretli (hafta iciyse)', !__todayEl || __todayEl.textContent===__todayNum, __todayEl&&__todayEl.textContent);
  t('Pazar kapali', !!d.querySelector('.gcal-dayhead.closed'));
  t('7 kolon', d.querySelectorAll('.gcal-col').length===7);
  t('gun basligi ders sayaci (rozet korundu)', [...d.querySelectorAll('.gdh-cnt')].some(x=>x.textContent==='2 ders'));

  console.log('[2] Ders bloklari — zaman oranli yerlesim');
  const evs = [...d.querySelectorAll('.gcal-ev')];
  t('3 ders cizildi', evs.length===3, evs.length);
  const e1 = evs.find(x=>x.getAttribute('onclick').includes('LG1'));
  t('10:00 dersi top=64px (09 acilis, 64px/saat)', e1 && e1.style.top==='64px', e1&&e1.style.top);
  t('45dk yukseklik ~46px', e1 && parseFloat(e1.style.height)>=44 && parseFloat(e1.style.height)<=48, e1&&e1.style.height);
  console.log('[3] Cakisan dersler yan yana bolunur (Google davranisi)');
  const e2 = evs.find(x=>x.getAttribute('onclick').includes('LG2'));
  t('iki ders de %50 genislikte', e1.style.width.includes('50%') && e2.style.width.includes('50%'), e1.style.width);
  t('farkli kolonlar (left farkli)', e1.style.left !== e2.style.left);
  t('grup dersi teal dolgu (gst-planned)', e1.className.includes('gst-planned'));
  t('iptal ders cizgili sinif', evs.find(x=>x.getAttribute('onclick').includes('LG3')).className.includes('gst-cancelled'));
  t('sarkan paket rozeti (Haziran paketi Temmuzda 📦)', evs.find(x=>x.getAttribute('onclick').includes('LG3')).innerHTML.includes('📦'));

  console.log('[4] Tiklama sozlesmeleri KORUNDU');
  const cells = [...d.querySelectorAll('.gcal-col')[1].querySelectorAll('.gcal-hcell')]; // Sali 14 kolonu (idx1: Pzt=0? hafta Pzt baslar → 14 Sali = idx1)
  const c10 = cells.find(c=>c.getAttribute('title').startsWith('10:00'));
  const c11 = cells.find(c=>c.getAttribute('title').startsWith('11:00'));
  t('dolu saat → openLessonPicker', c10 && c10.getAttribute('onclick').includes("openLessonPicker('2026-07-14','10:00')"));
  t('bos saat → openLessonModal', c11 && c11.getAttribute('onclick').includes("openLessonModal(null,'2026-07-14','11:00')"));
  t('kapasite rozeti dogru (10:00 → 2 kisi eszamanli pik: 5-3=2? LG1(2kisi)+LG2(1kisi) kesisim=3 → 2/5)', c10 && c10.querySelector('.cal-avail').textContent==='2/5', c10&&c10.querySelector('.cal-avail').textContent);

  console.log('[5] GUN gorunumu');
  w.eval(`setCalView('day')`);
  t('tek kolon', d.querySelectorAll('.gcal-col').length===1);
  t('uzun gun adi baslikta', (d.getElementById('week-label').textContent||'').includes('Salı'));

  console.log('[6] AY gorunumu — Google grid');
  w.eval(`setCalView('month')`);
  t('gm grid', !!d.querySelector('.gm-grid'));
  t('hucre sayisi 7nin kati', d.querySelectorAll('.gm-cell').length % 7 === 0);
  t('bugun dairesi', !!d.querySelector('.gm-cell.today .gm-num span'));
  const chip = [...d.querySelectorAll('.gm-chip')].find(c=>(c.getAttribute('onclick')||'').includes('LG1'));
  t('ders cipi saatli', chip && chip.textContent.includes('10:00'));
  t('cip tiklaninca ders acilir (stopPropagation)', chip && chip.getAttribute('onclick').includes('event.stopPropagation'));
  t('komsu ay gunleri soluk (out)', d.querySelectorAll('.gm-cell.out').length>0);

  console.log('[7] gcalLayout birim testi');
  const lay = w.eval(`gcalLayout([
    {id:'a',time:'09:00',durationMin:45},
    {id:'b',time:'09:30',durationMin:45},
    {id:'c',time:'10:30',durationMin:45}
  ]).map(e=>({id:e.l.id,col:e.col,cols:e.cols}))`);
  const A=lay.find(x=>x.id==='a'),B=lay.find(x=>x.id==='b'),C=lay.find(x=>x.id==='c');
  t('a+b cakisir → 2 kolon', A.cols===2 && B.cols===2 && A.col!==B.col);
  t('c ayri kume → tek kolon', C.cols===1 && C.col===0);

  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi`);
  process.exit(fail?1:0);
} catch(err) { console.error('TEST HATASI:', err); process.exit(1); } }, 700);
