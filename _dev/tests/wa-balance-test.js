// v119 — PARASAL BAKIYE KANONU: "kalan DERS" (adet) ASLA "kalan ODEME" (TL) yerine gecemez.
//
// KOK KUSUR (v118'e kadar): memberRemaining() DERS ADEDI dondurur (dashboard'da "{n} ders" olarak
// gosterilir), groupRemaining() ise TL dondurur. "Bugunun Mesajlari" paneli ikisini de ayni kutuya
// koyup `money(x) + ' ₺'` ile basiyordu. Sonuc:
//   • 8 derslik TAZE paketi OLAN ve PARASINI ODEMIS uyeye  -> "8 ₺ odeme bakiyeniz bulunmakta"
//   • Butun dersini bitirmis ama HIC ODEMEMIS uyeye        -> yesil "Tam" rozeti
// Yani hem MEBLAG hem de KISI SECIMI yanlisti (Kerem 27 Tem).
//
// Bu test yamasiz surumde DUSMELIDIR (acigi ONCE kanitlar).
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
    w.open=()=>null;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
// Yamasiz surumde HENUZ OLMAYAN semboller test'i COKERTMESIN (v117 dersi).
function ev(code, dflt){ try { return w.eval(code); } catch(e){ return dflt; } }

setTimeout(function(){ try {
  w.eval("['renderMembers','renderGroups','renderCalendar','renderArchive','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','save'].forEach(fn=>window[fn]=function(){});");

  // Tarihe bagimli OLMAYAN fikstur (sabit tarih catismasi dersi): her sey uygulamanin kendi takviminden.
  const TODAY = w.eval("todayISO()");
  const AY    = TODAY.slice(0,7);
  const PREV  = w.eval(`prevMonthISO('${AY}')`);
  const PREV2 = w.eval(`prevMonthISO('${PREV}')`);
  const PKG   = `state.packageTypes=[{id:'pt8',name:'8 Ders',price:4000,sessions:8}];`;

  // Panelin gercek ciktisindan bir uyenin satirini cek (kullaniciya GORUNEN sey budur).
  function rowOf(name){
    const el = d.getElementById('today-messages-list');
    const rows = Array.from(el.querySelectorAll('tbody tr'));
    const r = rows.find(tr => (tr.textContent||'').indexOf(name) >= 0);
    return r ? r.textContent.replace(/\s+/g,' ') : '';
  }

  // ── [1] BIREYSEL: PARASINI ODEMIS ama dersi KALMIS uye borclu GORUNMEZ ─────────────────────
  console.log('[1] Parasini odemis uye "Tam" gorunur (kalan DERS borc DEGILDIR)');
  w.eval(PKG + `
    state.members=[{id:'f1',name:'FILIZ SATMAN',joinDate:'2026-01-01',totalPrice:4000,defaultPackageId:'pt8',monthly:{}}];
    state.groups=[]; state.instructors=[];
    state.lessons=[{id:'L1',date:'${TODAY}',time:'11:00',memberIds:['f1'],status:'planned',packageMonth:'${AY}'}];
    state.payments=[{id:'P1',memberId:'f1',amount:4000,date:'${TODAY}',packageMonth:'${AY}'}];
  `);
  const remF = w.eval("memberRemaining('f1')");
  t('on kosul: FILIZ\'in KALAN DERSI var (adet>0) — yamasiz surum bunu ₺ sanardi', remF > 0, remF);
  w.eval("renderTodayMessages();");
  const rF = rowOf('FILIZ');
  t('FILIZ satiri "Tam" rozeti tasir', /Tam/.test(rF), rF.slice(0,160));
  t('FILIZ\'e ODEME ISTENMEZ', !/bakiyeniz/.test(rF), rF.slice(0,160));
  t('FILIZ satirinda "' + remF + ' ₺" gibi ders-adedi-para YOK', rF.indexOf(remF + ' ₺') < 0, rF.slice(0,160));

  // ── [2] TERS KISI SECIMI: dersi bitmis ama HIC ODEMEMIS uye borclu GORUNUR ─────────────────
  console.log('[2] Hic odememis uye borclu gorunur (yamasiz surumde yesil "Tam" idi)');
  w.eval(PKG + `
    state.members=[{id:'z1',name:'ZEYNEP SAGDIK',joinDate:'2026-01-01',totalPrice:4000,defaultPackageId:'pt8',monthly:{}}];
    state.groups=[]; state.payments=[];
    state.lessons=[];
    for(let i=1;i<=8;i++) state.lessons.push({id:'Z'+i,date:'${AY}-0'+ (i<10?i:1),time:'13:00',memberIds:['z1'],status:'completed',packageMonth:'${AY}'});
    state.lessons.push({id:'ZT',date:'${TODAY}',time:'13:00',memberIds:['z1'],status:'planned',packageMonth:'${AY}'});
  `);
  const remZ = w.eval("memberRemaining('z1')");
  t('on kosul: ZEYNEP\'in kalan dersi 0 — yamasiz surum bunu "Tam" sanardi', remZ === 0, remZ);
  w.eval("renderTodayMessages();");
  const rZ = rowOf('ZEYNEP');
  t('ZEYNEP satiri "Tam" DEGIL', !/Tam/.test(rZ), rZ.slice(0,160));
  t('ZEYNEP satirinda GERCEK borc 4.000 ₺ yazar', /4\.000 ₺/.test(rZ), rZ.slice(0,160));
  t('ZEYNEP\'e odeme mesaji hazirlanir', /bakiyeniz/.test(rZ), rZ.slice(0,200));

  // ── [3] TAKSIT: kismi odeme KALAN TUTARI verir ─────────────────────────────────────────────
  console.log('[3] Kismi odeme (taksit): panel KALAN TUTARI yazar');
  w.eval(PKG + `
    state.members=[{id:'b1',name:'BANU BASER',joinDate:'2026-01-01',totalPrice:4000,defaultPackageId:'pt8',monthly:{}}];
    state.groups=[];
    state.lessons=[{id:'B1',date:'${TODAY}',time:'12:15',memberIds:['b1'],status:'planned',packageMonth:'${AY}'}];
    state.payments=[{id:'PB',memberId:'b1',amount:1500,date:'${TODAY}',packageMonth:'${AY}'}];
  `);
  w.eval("renderTodayMessages();");
  const rB = rowOf('BANU');
  t('BANU kalan 2.500 ₺ (4000-1500)', /2\.500 ₺/.test(rB), rB.slice(0,160));
  t('BANU satirinda ders adedi (8 ₺ / 7 ₺) YOK', !/\b[0-9] ₺/.test(rB), rB.slice(0,160));

  // ── [4] FIYAT TANIMSIZ: uydurma borc CIKMAZ ────────────────────────────────────────────────
  console.log('[4] Fiyati tanimsiz uye icin borc UYDURULMAZ');
  w.eval(`
    state.packageTypes=[];
    state.members=[{id:'n1',name:'NIGAR ERKOC',joinDate:'2026-01-01',monthly:{}}];
    state.groups=[]; state.payments=[];
    state.lessons=[{id:'N1',date:'${TODAY}',time:'17:45',memberIds:['n1'],status:'planned',packageMonth:'${AY}'}];
  `);
  w.eval("renderTodayMessages();");
  const rN = rowOf('NIGAR');
  t('fiyat yoksa "Tam" gosterilir, borc uydurulmaz', /Tam/.test(rN) && !/bakiyeniz/.test(rN), rN.slice(0,160));

  // ── [5] GRUP: zaten TL idi — BOZULMADIGINI dogrula (regresyon kalkani) ─────────────────────
  console.log('[5] GRUP bakiyesi TL kalir (regresyon kalkani)');
  w.eval(PKG + `
    state.members=[
      {id:'g1',name:'AYSE',joinDate:'2026-01-01',totalPrice:4000,defaultPackageId:'pt8',monthly:{'${AY}':{enrolled:true}}},
      {id:'g2',name:'FATMA',joinDate:'2026-01-01',totalPrice:4000,defaultPackageId:'pt8',monthly:{'${AY}':{enrolled:true}}}];
    state.groups=[{id:'gr1',name:'AYSE - FATMA',size:2,memberIds:['g1','g2'],monthlyNotes:{}}];
    state.payments=[{id:'PG',memberId:'g1',groupId:'gr1',amount:3000,date:'${TODAY}',packageMonth:'${AY}'}];
    state.lessons=[{id:'GL',date:'${TODAY}',time:'19:15',groupId:'gr1',memberIds:['g1','g2'],status:'planned',packageMonth:'${AY}'}];
  `);
  w.eval("renderTodayMessages();");
  const rG = rowOf('AYSE - FATMA');
  t('grup kalan 5.000 ₺ (8000-3000)', /5\.000 ₺/.test(rG), rG.slice(0,160));
  const rGfull = w.eval("groupExpectedTotal(state.groups[0],'"+AY+"')");
  t('grup beklenen toplami 8000', +rGfull === 8000, rGfull);

  // ── [6] SABLON: {kalan} TEK ₺ ile dolar (cift ₺ hatasi) ────────────────────────────────────
  console.log('[6] {kalan} TEK ₺ ile dolar — "1.000 ₺ ₺" olmaz');
  const f1 = w.eval("fillWaTemplate('Bakiye: {kalan} ₺ kaldi.', {kalan:1000})");
  const f2 = w.eval("fillWaTemplate('Bakiye: {kalan} kaldi.', {kalan:1000})");
  t('sablonda ₺ VARSA cift yazilmaz', f1 === 'Bakiye: 1.000 ₺ kaldi.', f1);
  t('sablonda ₺ YOKSA yine tek ₺ eklenir', f2 === 'Bakiye: 1.000 ₺ kaldi.', f2);
  const f3 = w.eval("fillWaTemplate('Fiyat: {fiyat} ₺.', {fiyat:4000})");
  t('{fiyat} icin de cift ₺ olmaz', f3 === 'Fiyat: 4.000 ₺.', f3);

  // ── [7] TOPLU WHATSAPP LISTESI: TL yazar, ders adedi DEGIL ─────────────────────────────────
  console.log('[7] Toplu WhatsApp listesi TL yazar');
  w.eval(PKG + `
    state.members=[{id:'e1',name:'ECE DOLUCA',phone:'05551112233',joinDate:'2026-01-01',totalPrice:4000,defaultPackageId:'pt8',monthly:{}}];
    state.groups=[]; state.payments=[]; state.lessons=[{id:'E1',date:'${TODAY}',time:'19:15',memberIds:['e1'],status:'planned',packageMonth:'${AY}'}];
  `);
  ev("openWaBulkModal(['e1'],'wa-reminder')");
  const bulk = (d.getElementById('modal-whatsapp-bulk')||{textContent:''}).textContent.replace(/\s+/g,' ');
  t('toplu listede 4.000 ₺ yazar', /4\.000 ₺/.test(bulk), bulk.slice(0,200));
  t('toplu listede ders adedi para gibi yazmaz (7 ₺/8 ₺)', !/\b[0-9] ₺/.test(bulk), bulk.slice(0,200));
  ev("document.getElementById('modal-whatsapp-bulk').remove()");

  // ── [8] TEKIL WHATSAPP MODALI: mesajda TL gecer ────────────────────────────────────────────
  console.log('[8] Tekil WhatsApp modali mesaji TL icerir');
  ev("openWhatsAppModal('e1','overdue')");
  const wm = (d.getElementById('wa-message')||{value:''}).value;
  t('modal mesajinda 4.000 ₺ gecer', /4\.000 ₺/.test(wm), wm.slice(0,200));
  ev("closeWaModal()");

  // ── [9] GECIKEN ODEMELER: ILK AYA KILITLENME HATASI ────────────────────────────────────────
  // v118: getOverduePayments yalniz UYENIN ILK DERSININ AYINI bakiyor. Ilk ay odenmisse uye
  // SONSUZA KADAR "borcu yok" gorunur — sonraki aylar hic denetlenmez.
  console.log('[9] Geciken odemeler ILK AYA kilitli kalmaz (gecmis aylar da denetlenir)');
  w.eval(PKG + `
    state.members=[{id:'o1',name:'OYKU YILMAZ',joinDate:'2026-01-01',totalPrice:4000,defaultPackageId:'pt8',monthly:{}}];
    state.groups=[];
    state.lessons=[
      {id:'O1',date:'${PREV2}-05',time:'10:00',memberIds:['o1'],status:'completed',packageMonth:'${PREV2}'},
      {id:'O2',date:'${PREV}-05',time:'10:00',memberIds:['o1'],status:'completed',packageMonth:'${PREV}'}];
    state.payments=[{id:'PO',memberId:'o1',amount:4000,date:'${PREV2}-05',packageMonth:'${PREV2}'}];
  `);
  const ov = w.eval("JSON.stringify(getOverduePayments())");
  const ovArr = JSON.parse(ov);
  const oRec = ovArr.find(x=>x.memberId==='o1');
  t('ilk ay odenmis olsa da SONRAKI ayin borcu gorunur', !!oRec, ov.slice(0,200));
  t('eksik tutar 4.000 (yalniz odenmemis ay)', oRec && Math.round(oRec.missing)===4000, oRec && oRec.missing);

  // ── [10] VADESI GELMEMIS ODEME "geciken" SAYILMAZ ──────────────────────────────────────────
  console.log('[10] Ilk dersi BUGUN olan uye "geciken" sayilmaz');
  w.eval(PKG + `
    state.members=[{id:'y1',name:'YENI UYE',joinDate:'${AY}-01',totalPrice:4000,defaultPackageId:'pt8',monthly:{}}];
    state.groups=[]; state.payments=[];
    state.lessons=[{id:'Y1',date:'${TODAY}',time:'09:00',memberIds:['y1'],status:'planned',packageMonth:'${AY}'}];
  `);
  const ov2 = JSON.parse(w.eval("JSON.stringify(getOverduePayments())"));
  t('bugun ilk dersi olan uye geciken listesinde YOK', !ov2.some(x=>x.memberId==='y1'), JSON.stringify(ov2).slice(0,200));

  // ── [11] "kalan DERS" gostergesi BOZULMADI (adet olarak kalmali) ───────────────────────────
  console.log('[11] Dashboard "Bitmek Uzere" gostergesi hala DERS ADEDI');
  w.eval(PKG + `
    state.members=[{id:'k1',name:'KALAN TEST',joinDate:'2026-01-01',totalPrice:4000,defaultPackageId:'pt8',monthly:{}}];
    state.groups=[]; state.payments=[]; state.lessons=[];
    for(let i=1;i<=7;i++) state.lessons.push({id:'K'+i,date:'${AY}-0'+i,time:'10:00',memberIds:['k1'],status:'completed',packageMonth:'${AY}'});
  `);
  t('memberRemaining hala DERS ADEDI dondurur (8-7=1)', w.eval("memberRemaining('k1')")===1, w.eval("memberRemaining('k1')"));
  t('memberBalanceForMonth AYRI bir fonksiyondur ve TL dondurur (4000)',
    ev("memberBalanceForMonth('k1','"+AY+"')", null) === 4000, ev("memberBalanceForMonth('k1','"+AY+"')", 'YOK'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} }, 900);
