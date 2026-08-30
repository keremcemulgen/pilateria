// v160+v161 — TOPLU DERS GIR MINI TAKVIMI (Kerem):
// v160: "sagda kutu olarak aylik takvim ciksin, toplu ders girerken aylari gorebilelim."
// v161 DUZELTME (Kerem, ekran goruntusuyle): "tikladikca ders ekliyor — boyle bir ozellige gerek
// yok KESINLIKLE; mevcut dersleri mavi gostermiyor; renklendirme takvim sayfasiyla ayni olsun;
// bu takvimin tek amaci derslere BAKMAK; makine sayisi ve hoca ozelinde ders girilebilir
// tarihler de gosterilsin."
// KURALLAR:
//  - SALT BAKIS: gun hucrelerinde onclick YOK, bdCalPick diye bir fonksiyon YOK.
//  - Renk dili ana takvim (LESSON_STATUS) ile ayni: YESIL=yapildi, MAVI=planli, KIRMIZI=yandi,
//    gri-cizgili=iptal. Gunun rengi: yapildi > yandi > planli > iptal onceligiyle.
//  - Bu listedeki satirlarin gunleri ic cerceveyle isaretli (bd-sel) + title'da satir numaralari;
//    birimin satirlarda olmayan ayni-ay dersleri de durum rengiyle gorunur.
//  - DERS GIRILEBILIRLIK: bos gunlerde, ayin dolulugu (makine sayisi) + birimin hocasinin
//    doluluguna gore en az bir uygun saat VARSA bd-free, YOKSA bd-full (tarali) isaretlenir.
//  - ‹ › ay gezinme ve elle tarih yazinca canli isaret yenileme korunur; grup+bireysel ayni kutu.
// Yamasiz (v160) build'de FAIL etmeli (tiklama var, durum renkleri ve uygunluk yok).
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
    state.settings.reformers=10; state.settings.open=10; state.settings.close=11; state.settings.slotStepMin=30;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA A',shareRate:30},{id:'h2',name:'HOCA B',shareRate:30}];
    state.members=[
      {id:'m1',name:'ASU BIR',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}},
      {id:'m2',name:'BEGUM IKI',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}},
      {id:'mS',name:'SOLO UYE',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${NM}':{enrolled:true}},defaultDays:[1],defaultTime:'10:00'}
    ];
    state.groups=[{id:'gS',name:'ASU BIR - BEGUM IKI',size:2,memberIds:['m1','m2'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultTime:'10:00',defaultDays:[2,4],monthlyMembers:{'${CM}':['m1','m2'],'${NM}':['m1','m2']},monthlyNotes:{},packages:[]}];
    state.lessons=[
      {id:'ex1',date:'${NM}-10',time:'10:00',durationMin:45,instructorId:'h2',size:2,memberIds:['m1','m2'],groupId:'gS',packageMonth:'${NM}',status:'completed'},
      {id:'ex2',date:'${NM}-11',time:'10:30',durationMin:45,instructorId:'h2',size:2,memberIds:['m1','m2'],groupId:'gS',packageMonth:'${CM}',status:'missed'}
    ];
    // DOLULUK: NM-05'te TUM saatler makine kapasitesini asacak kadar dolu (9 kisilik yabanci ders)
    const slots = hourSlots();
    slots.forEach(function(tm, i){
      state.lessons.push({id:'kap'+i,date:'${NM}-05',time:tm,durationMin:30,instructorId:'h2',size:9,
        memberIds:['x1','x2','x3','x4','x5','x6','x7','x8','x9'],groupId:'gX',packageMonth:'${NM}',status:'planned'});
      // HOCA: NM-12'de birimin hocasi (h1) tum saatlerde baska derste
      state.lessons.push({id:'hoc'+i,date:'${NM}-12',time:tm,durationMin:30,instructorId:'h1',size:1,
        memberIds:['x1'],groupId:'',packageMonth:'${NM}',status:'planned'});
    });
    state.payments=[];
  `);
  const gunSayNM = w.eval(`new Date(${+NM.slice(0,4)}, ${+NM.slice(5,7)}, 0).getDate()`);
  const lblNM = w.eval(`parseISO('${NM}-01').toLocaleDateString('tr-TR',{month:'long',year:'numeric'})`);
  const lblN2 = w.eval(`parseISO('${N2}-01').toLocaleDateString('tr-TR',{month:'long',year:'numeric'})`);

  console.log('[1] kutu + baslik + gun sayisi + varsayilan gun basligi');
  t('renderBdMiniCal var', w.eval("typeof renderBdMiniCal")==='function');
  w.openBatchDatesGroup('gS', NM);
  const cal = d.getElementById('bd-minical');
  t('#bd-minical dolu', !!cal && cal.innerHTML.indexOf('bd-cal-day')!==-1, cal?cal.innerHTML.slice(0,60):'YOK');
  if (!cal || cal.innerHTML.indexOf('bd-cal-day')===-1) { console.log('\nSONUC: '+pass+' gecti, '+(fail+13)+' kaldi'); process.exit(1); }
  t('baslik hedef ay ('+lblNM+')', d.getElementById('bd-cal-title').textContent===lblNM);
  t('gun sayisi '+gunSayNM, d.querySelectorAll('#bd-minical .bd-cal-day').length===gunSayNM, d.querySelectorAll('#bd-minical .bd-cal-day').length);
  t('varsayilan gun basligi isaretli', cal.innerHTML.indexOf('Varsayılan ders günü')!==-1);

  console.log('[2] SALT BAKIS: tiklama ozelligi tamamen kaldirildi (v161)');
  t('bdCalPick fonksiyonu YOK', w.eval("typeof bdCalPick")==='undefined', w.eval("typeof bdCalPick"));
  t('gun hucrelerinde onclick YOK', cal.innerHTML.indexOf('bdCalPick')===-1 && !d.querySelector('#bd-minical .bd-cal-day[onclick]'));

  console.log('[3] RENK DILI = ANA TAKVIM: yapildi yesil, planli mavi, yandi kirmizi');
  t('NM-10 (yapildi, listede) bd-completed + bd-sel', !!d.querySelector('#bd-minical .bd-cal-day.bd-completed.bd-sel[data-iso="'+NM+'-10"]'), (d.querySelector('#bd-minical [data-iso="'+NM+'-10"]')||{}).className);
  t('NM-11 (yandi, BASKA paket ayindan — satirda degil) bd-missed', !!d.querySelector('#bd-minical .bd-cal-day.bd-missed[data-iso="'+NM+'-11"]'), (d.querySelector('#bd-minical [data-iso="'+NM+'-11"]')||{}).className);
  await w.batchDatesAutoFill();
  const planli = d.querySelectorAll('#bd-minical .bd-cal-day.bd-planned.bd-sel').length;
  t('doldurulan planli satirlar MAVI (bd-planned)', planli>=6, planli);

  console.log('[4] DERS GIRILEBILIRLIK: makine + hoca doluluguna gore');
  t('NM-05 (tum saatler makine dolu) bd-full tarali', !!d.querySelector('#bd-minical .bd-cal-day.bd-full[data-iso="'+NM+'-05"]'), (d.querySelector('#bd-minical [data-iso="'+NM+'-05"]')||{}).className);
  t('NM-12 (birimin hocasi h1 tum saatlerde dolu) bd-full', !!d.querySelector('#bd-minical .bd-cal-day.bd-full[data-iso="'+NM+'-12"]'), (d.querySelector('#bd-minical [data-iso="'+NM+'-12"]')||{}).className);
  const bosGun = d.querySelectorAll('#bd-minical .bd-cal-day.bd-free').length;
  t('bos gunler bd-free (girilebilir)', bosGun>0, bosGun);

  console.log('[5] ay gezinme + canli yenileme + bireysel modal');
  w.bdCalShift(1);
  t('sonraki ay ('+lblN2+')', d.getElementById('bd-cal-title').textContent===lblN2);
  w.bdCalShift(-1);
  w.batchDatesUpdate(w.eval('__batchDatesRows.length')-1,'date', NM+'-20');
  t('elle yazilan tarih isareti canli geldi (NM-20 bd-sel)', !!d.querySelector('#bd-minical .bd-sel[data-iso="'+NM+'-20"]'));
  w.closeModal('modal-batch-dates');
  w.openBatchDatesMember('mS', NM);
  t('bireysel modalda da kutu dolu + ayni ay', d.getElementById('bd-minical').innerHTML.indexOf('bd-cal-day')!==-1 && d.getElementById('bd-cal-title').textContent===lblNM);
  t('bireyselde hoca kisiti uygulanmaz (mS hocasiz) — NM-12 full DEGIL', !d.querySelector('#bd-minical .bd-cal-day.bd-full[data-iso="'+NM+'-12"]'), (d.querySelector('#bd-minical [data-iso="'+NM+'-12"]')||{}).className);
  w.closeModal('modal-batch-dates');

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
