// v160 — TOPLU DERS GIR MINI TAKVIMI (Kerem, 2026-08-31): "toplu ders gir sayfalarinda takvim
// gorunumundeki gibi sagda kutu olarak aylik takvim ciksin, toplu ders girerken aylari gorebilelim."
// KURALLAR:
//  - modal-batch-dates icinde sagda #bd-minical kutusu: hedef paket ayinin aylik takvimi
//    (Pazartesi baslangicli), ‹ › ile ay degistirilir (sarkan tarihler icin).
//  - Isaretler: YESIL = bu listede secili tarih (satir no title'da), MAVI = birimin o gun MEVCUT
//    (iptal-disi) dersi, cerceve = bugun; birim varsayilan gunlerinin sutun basligi koyu.
//  - Gune dokununca ILK BOS satira yazilir (saat bossa varsayilan saat); bos satir yoksa yeni
//    satir acilir. Elle tarih yazinca da takvim isareti canli yenilenir.
//  - Hem grup hem bireysel toplu modalda ayni kutu. Yamasiz build'de FAIL etmeli (#bd-minical yok).
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
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
setTimeout(async ()=>{ try {
  const CM = w.eval('currentMonth()');
  const NM = shiftM(CM,+1), N2 = shiftM(CM,+2);
  w.eval(`
    state.settings.reformers=10;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'m1',name:'ASU BIR',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}},
      {id:'m2',name:'BEGUM IKI',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}},
      {id:'mS',name:'SOLO UYE',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${NM}':{enrolled:true}},defaultDays:[1],defaultTime:'09:00'}
    ];
    state.groups=[{id:'gS',name:'ASU BIR - BEGUM IKI',size:2,memberIds:['m1','m2'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultTime:'10:00',defaultDays:[2,4],monthlyMembers:{'${CM}':['m1','m2'],'${NM}':['m1','m2']},monthlyNotes:{},packages:[]}];
    state.lessons=[{id:'ex1',date:'${NM}-10',time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['m1','m2'],groupId:'gS',packageMonth:'${NM}',status:'completed'}];
    state.payments=[];
  `);
  const gunSayNM = w.eval(`new Date(${+NM.slice(0,4)}, ${+NM.slice(5,7)}, 0).getDate()`);
  const lblNM = w.eval(`parseISO('${NM}-01').toLocaleDateString('tr-TR',{month:'long',year:'numeric'})`);
  const lblN2 = w.eval(`parseISO('${N2}-01').toLocaleDateString('tr-TR',{month:'long',year:'numeric'})`);

  console.log('[1] GRUP modali: mini takvim kutusu var, hedef ay gorunur');
  t('renderBdMiniCal fonksiyonu var', w.eval("typeof renderBdMiniCal")==='function', w.eval("typeof renderBdMiniCal"));
  w.openBatchDatesGroup('gS', NM);
  const cal = d.getElementById('bd-minical');
  t('#bd-minical kutusu var ve dolu', !!cal && cal.innerHTML.indexOf('bd-cal-day')!==-1, cal?cal.innerHTML.slice(0,60):'YOK');
  if (!cal || cal.innerHTML.indexOf('bd-cal-day')===-1) { console.log('\nSONUC: '+pass+' gecti, '+(fail+10)+' kaldi (kutu yok — kalan iddialar sayildi)'); process.exit(1); }
  t('baslik hedef ayi soyler ('+lblNM+')', d.getElementById('bd-cal-title').textContent===lblNM, d.getElementById('bd-cal-title').textContent);
  t('gun sayisi dogru ('+gunSayNM+')', d.querySelectorAll('#bd-minical .bd-cal-day').length===gunSayNM, d.querySelectorAll('#bd-minical .bd-cal-day').length);
  t('mevcut ders isareti (NM-10 mavi)', !!d.querySelector('#bd-minical .bd-has[data-iso="'+NM+'-10"]'));
  t('varsayilan gun basligi isaretli', cal.innerHTML.indexOf('Varsayılan ders günü')!==-1);

  console.log('[2] otomatik doldur -> secili gunler YESIL isaretli');
  await w.batchDatesAutoFill();
  const sel = [].slice.call(d.querySelectorAll('#bd-minical .bd-sel')).map(e=>e.getAttribute('data-iso'));
  // mevcut ders (NM-10) ilk satiri doldurur -> 8 satirda BENZERSIZ tarih sayisi kadar isaret olur
  const benzersiz = w.eval("Array.from(new Set(__batchDatesRows.map(function(r){return r.date;}).filter(Boolean))).length");
  t('secili gun isareti = benzersiz satir tarihi ('+benzersiz+')', sel.length===benzersiz && benzersiz>=7, sel.length+': '+sel.join(','));
  t('mevcut dersin gunu hem secili hem mevcut isaretli', !!d.querySelector('#bd-minical .bd-sel.bd-has[data-iso="'+NM+'-10"]') || !!d.querySelector('#bd-minical .bd-has.bd-sel[data-iso="'+NM+'-10"]'));
  t('hepsi hedef ayda', sel.every(x=>String(x).startsWith(NM)), sel.join(','));

  console.log('[3] ay gezinme ‹ ›');
  w.bdCalShift(1);
  t('sonraki ay basligi ('+lblN2+')', d.getElementById('bd-cal-title').textContent===lblN2, d.getElementById('bd-cal-title').textContent);
  w.bdCalShift(-1);
  t('geri donunce hedef ay', d.getElementById('bd-cal-title').textContent===lblNM);

  console.log('[4] gune dokun -> ilk bos satira yazilir (saat varsayilandan)');
  w.eval("__batchDatesRows.forEach(function(r){r.date='';r.time='';});");
  w.bdCalPick(NM+'-05');
  t('ilk satir dolduruldu', w.eval('__batchDatesRows[0].date')===NM+'-05' && w.eval('__batchDatesRows[0].time')==='10:00', w.eval("JSON.stringify(__batchDatesRows[0])"));
  w.bdCalPick(NM+'-06');
  t('ikinci dokunus ikinci satira', w.eval('__batchDatesRows[1].date')===NM+'-06');
  t('takvimde 2 secili isaret', d.querySelectorAll('#bd-minical .bd-sel').length===2, d.querySelectorAll('#bd-minical .bd-sel').length);

  console.log('[5] elle tarih yazinca isaret CANLI yenilenir');
  w.batchDatesUpdate(2,'date', NM+'-20');
  t('NM-20 isareti render cagrisi olmadan geldi', !!d.querySelector('#bd-minical .bd-sel[data-iso="'+NM+'-20"]'));
  w.closeModal('modal-batch-dates');

  console.log('[6] BIREYSEL modalda da ayni kutu');
  w.openBatchDatesMember('mS', NM);
  t('bireysel modalda mini takvim dolu', d.getElementById('bd-minical').innerHTML.indexOf('bd-cal-day')!==-1);
  t('bireysel baslik hedef ay', d.getElementById('bd-cal-title').textContent===lblNM);
  w.closeModal('modal-batch-dates');

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
