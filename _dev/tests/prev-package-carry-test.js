// v181 — ONCEKI PAKETTEN DEVAM EDEN DERS HAKKI: YENI PAKET ACILIRKEN BILGI (ENGELLEMEZ)
// Kerem 2026-09-28: "onceki aydan devam eden ders hakki olan uyelerin veya gruplarin veya ikisi birden yeni paket
// acilirken uyari versin ama yine de paket acilmasini engellemesin, sadece bilgi olarak".
// Tek kaynak: __carryOfPackage181 (hak − yapilan; ⭐ erken kapanan paket = hak isletmeye → devam eden hak yok),
// packageCarryInfo181 (grup: kendi paketi + kadrodaki uyelerin KENDI onceki birimleri; uye: son birimi),
// carryText181. Yuzeyler: odeme penceresi kutusu (#mp-carry-181), Odendi tiki / toplu odeme onay metni,
// createGroupPackage/createMemberPackage sonrasi uzun toast, grup ve uye detayi notu. Paket uzadi (0 ₺) = sessiz.
// Yamasiz (v180) build'de FAIL eder.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let CONFIRM = () => true;
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.__msgs=[]; w.__confirms=[];
    w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return (o&&o.input)?String(o.input.value):true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ w.__confirms.push(String(m||'')); return CONFIRM(String(m||'')); };
    w.prompt=()=>null; w.scrollTo=()=>{}; w.print=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
const J = (expr) => JSON.parse(w.eval('JSON.stringify(' + expr + ')') || 'null');
const has = (s, re) => (re instanceof RegExp ? re : new RegExp(re)).test(String(s || '').replace(/\s+/g, ' '));
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const sh = (k) => { const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-1+k,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); };
  const PREV = sh(-1), PREV2 = sh(-2);
  const LBL = (ay) => w.eval(`pkgMonthLabel('${ay}')`);
  const dd = (ay, day) => ay + '-' + String(day).padStart(2, '0');
  function fixture(){
    w.eval(`
      state.settings.reformers=12; state.settings.instructorShareRate=30;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.campaigns=[]; state.expenses=[]; state.instructorPayouts=[]; state.monthInit={};
      const mk = (id,name) => ({id:id,name:name,phone:'',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${PREV2}':{enrolled:true},'${PREV}':{enrolled:true},'${CM}':{enrolled:true}}});
      state.members=[mk('A','AYSE'),mk('B','BERNA'),mk('I','IREM'),mk('J','JALE'),mk('K','KUBRA'),mk('L','LEYLA'),mk('N','NUR'),mk('C','CEREN'),mk('P','PELIN'),mk('Q','RANA'),mk('K2','KEREMCAN'),mk('R','RIZA')];
      const gp = (ay, price) => ({month:ay,startDate:ay+'-01',sessions:8,price:price,status:'active'});
      state.groups=[
        // GA: onceki ay paketi 8 hak — 5 yapildi, 2 planli (bu ayin 2'si ve 4'u, paket ayi onceki ay), 1 planlanmamis → 3 devam eden hak
        {id:'GA',name:'AYSE - BERNA',size:4,memberIds:['A','B','L'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'12:15',packages:[gp('${PREV}',9000)],monthlyMembers:{'${PREV}':['A','B'],'${CM}':['A','B','L']},monthlyNotes:{}},
        // GB: yeni grup, paketi yok; K bu ay kadroda (onceki ay bireyseldi: 2 hak devam ediyor)
        {id:'GB',name:'KUBRA',size:2,memberIds:['K'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1],defaultTime:'09:00',packages:[],monthlyMembers:{'${PREV}':[],'${CM}':['K']},monthlyNotes:{}},
        // GC: onceki ay paketi ⭐ son ders ile ERKEN KAPANDI (4/8) → kalan hak isletmeye, devam eden hak YOK
        {id:'GC',name:'CEREN',size:2,memberIds:['C'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[3],defaultTime:'10:00',packages:[gp('${PREV}',4500)],monthlyMembers:{'${PREV}':['C'],'${CM}':['C']},monthlyNotes:{}},
        // GD: P ay ortasinda PAYLA ayrildi (pay = hesap kapandi) → P'nin onceki birimi bireysel; Q icin grubun 4 hakki devam
        {id:'GD',name:'PELIN - RANA',size:2,memberIds:['Q'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[5],defaultTime:'11:00',packages:[gp('${PREV}',9000)],monthlyMembers:{'${PREV}':['Q'],'${CM}':['Q']},monthlyPartials:{'${PREV}':[{memberId:'P',sessions:4,price:2250,note:'ayrıldı',at:'${PREV}-15'}]},monthlyNotes:{}},
        // GE: K2 onceki ay bu gruptaydi (6/8), bu ay bireysel; R grupta devam
        {id:'GE',name:'KEREMCAN - RIZA',size:2,memberIds:['R'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1],defaultTime:'15:00',packages:[gp('${PREV}',9000)],monthlyMembers:{'${PREV}':['K2','R'],'${CM}':['R']},monthlyNotes:{}}
      ];
      const mp = (ay, sessions, price) => ({month:ay,startDate:ay+'-01',sessions:sessions,price:price,status:'active'});
      state.members.find(m=>m.id==='I').packages=[mp('${PREV}',8,8000)];
      state.members.find(m=>m.id==='J').packages=[mp('${PREV}',8,8000)];
      state.members.find(m=>m.id==='K').packages=[mp('${PREV}',8,8000)];
      state.members.find(m=>m.id==='L').packages=[mp('${PREV2}',8,8000)];
      state.members.find(m=>m.id==='P').packages=[mp('${PREV}',4,4000)];
      state.lessons=[];
      const L = (id, o) => state.lessons.push(Object.assign({id:id,time:'10:00',status:'completed',instructorId:'h1',size:1}, o));
      // GA onceki ay: 5 yapildi + 2 planli (bu ay 2 ve 4, paket ayi onceki ay)
      [3,5,10,12,17].forEach((day,i)=> L('ga'+i, {groupId:'GA',memberIds:['A','B'],date:'${PREV}-'+String(day).padStart(2,'0'),time:'12:15',packageMonth:'${PREV}',packageOwnerType:'group',packageOwnerId:'GA',size:4}));
      [2,4].forEach((day,i)=> L('gap'+i, {groupId:'GA',memberIds:['A','B'],date:'${CM}-'+String(day).padStart(2,'0'),time:'12:15',status:'planned',packageMonth:'${PREV}',packageOwnerType:'group',packageOwnerId:'GA',size:4}));
      // I: 6 yapildi (2 hak devam) · J: 8/8 · K: 6 yapildi (2 devam) · L: onceki-onceki ay 5 yapildi (3 devam)
      [1,3,8,10,15,17].forEach((day,i)=> L('i'+i, {memberIds:['I'],date:'${PREV}-'+String(day).padStart(2,'0'),packageMonth:'${PREV}',packageOwnerType:'member',packageOwnerId:'I'}));
      [1,3,8,10,15,17,22,24].forEach((day,i)=> L('j'+i, {memberIds:['J'],date:'${PREV}-'+String(day).padStart(2,'0'),packageMonth:'${PREV}',packageOwnerType:'member',packageOwnerId:'J'}));
      [1,3,8,10,15,17].forEach((day,i)=> L('k'+i, {memberIds:['K'],date:'${PREV}-'+String(day).padStart(2,'0'),packageMonth:'${PREV}',packageOwnerType:'member',packageOwnerId:'K'}));
      [2,4,9,11,16].forEach((day,i)=> L('l'+i, {memberIds:['L'],date:'${PREV2}-'+String(day).padStart(2,'0'),packageMonth:'${PREV2}',packageOwnerType:'member',packageOwnerId:'L'}));
      // GC: 4 yapildi, sonuncusu ⭐ son ders (erken kapanis)
      [2,9,16,23].forEach((day,i)=> L('gc'+i, {groupId:'GC',memberIds:['C'],date:'${PREV}-'+String(day).padStart(2,'0'),packageMonth:'${PREV}',packageOwnerType:'group',packageOwnerId:'GC',size:2,isLastOfPackage:i===3}));
      // GD: 4 yapildi (P+Q), P sonra bireysel 3 yapildi (4 haklik paket → 1 devam)
      [3,10,17,24].forEach((day,i)=> L('gd'+i, {groupId:'GD',memberIds:['P','Q'],date:'${PREV}-'+String(day).padStart(2,'0'),time:'11:00',packageMonth:'${PREV}',packageOwnerType:'group',packageOwnerId:'GD',size:2}));
      [18,20,25].forEach((day,i)=> L('p'+i, {memberIds:['P'],date:'${PREV}-'+String(day).padStart(2,'0'),packageMonth:'${PREV}',packageOwnerType:'member',packageOwnerId:'P'}));
      // GE: 6 yapildi (K2+R)
      [1,3,8,10,15,17].forEach((day,i)=> L('ge'+i, {groupId:'GE',memberIds:['K2','R'],date:'${PREV}-'+String(day).padStart(2,'0'),time:'15:00',packageMonth:'${PREV}',packageOwnerType:'group',packageOwnerId:'GE',size:2}));
      state.payments=[{id:'pi1',memberId:'I',groupId:'',date:'${PREV}-01',packageMonth:'${PREV}',sessions:8,amount:8000,listPrice:8000,discount:0,method:'Nakit',pkgName:'8 Ders'}];
      document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
      __undoStack=[];
      while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }
      window.__toasts=[];
    `);
    w.__msgs.length=0; w.__confirms.length=0; CONFIRM = () => true;
  }
  const toastsWith = (re) => (J('window.__toasts') || []).filter(x => has(x[0], re));

  console.log('[0] plToast sure parametresi (uzun bilgi mesaji okunabilsin)');
  fixture();
  t('plToast tanimli', typeof w.plToast === 'function');
  w.eval("plToast('deneme 181', 3000)"); await tick(2200);
  t('2.2 sn sonra toast hala acik (varsayilan 1.8 sn degil)', !!d.querySelector('.pl-toast.on'));
  await tick(1300);
  t('3.5 sn sonra kapandi', !d.querySelector('.pl-toast.on'));
  w.eval("window.plToast = function(m, ms){ window.__toasts.push([String(m), ms]); };");

  console.log('[1] TEK KAYNAK: __carryOfPackage181 / packageCarryInfo181');
  fixture();
  { const c = J(`__carryOfPackage181('group','GA','${PREV}')`);
    t('GA ' + PREV + ': hak 8, yapilan 5, planli 2, planlanmamis 1 → devam eden 3', !!c && c.quota===8 && c.done===5 && c.planned===2 && c.unscheduled===1 && c.carry===3, JSON.stringify(c));
    t('planli tarihler listede (bu ayin 2 ve 4)', !!c && Array.isArray(c.plannedDates) && c.plannedDates.length===2 && c.plannedDates[0]===dd(CM,2), c && JSON.stringify(c.plannedDates)); }
  t('GC ' + PREV + ': ⭐ erken kapanis → devam eden hak YOK (null)', J(`__carryOfPackage181('group','GC','${PREV}')`)===null, JSON.stringify(J(`__carryOfPackage181('group','GC','${PREV}')`)));
  t('J ' + PREV + ': 8/8 → null', J(`__carryOfPackage181('member','J','${PREV}')`)===null);
  t('N (kaydi yok) → null', J(`__carryOfPackage181('member','N','${PREV}')`)===null);
  { const it = J(`packageCarryInfo181('group','GA','${CM}')`);
    t('GA ' + CM + ' paketi acilirken: 2 bilgi — grubun kendi 3 hakki + LEYLA (bireysel ' + PREV2 + ', 3 hak); AYSE/BERNA tekrar sayilmaz', Array.isArray(it) && it.length===2 && it[0].who==='group' && it[0].carry===3 && it[1].who==='member' && it[1].memberId==='L' && it[1].kind==='individual' && it[1].prevMonth===PREV2 && it[1].carry===3, JSON.stringify(it)); }
  { const it = J(`packageCarryInfo181('member','I','${CM}')`); t('I bireysel: 1 bilgi, 2 hak (' + PREV + ')', it.length===1 && it[0].who==='member' && it[0].kind==='individual' && it[0].carry===2 && it[0].prevMonth===PREV, JSON.stringify(it)); }
  t('J bireysel: bilgi yok', J(`packageCarryInfo181('member','J','${CM}')`).length===0);
  t('N (gecmisi yok): bilgi yok', J(`packageCarryInfo181('member','N','${CM}')`).length===0);
  t('GC: erken kapanis → bilgi yok', J(`packageCarryInfo181('group','GC','${CM}')`).length===0);
  { const it = J(`packageCarryInfo181('group','GB','${CM}')`); t('GB (yeni grup): grubun kendi paketi yok; KUBRA bireysel ' + PREV + ' 2 hak', it.length===1 && it[0].who==='member' && it[0].memberId==='K' && it[0].kind==='individual' && it[0].carry===2, JSON.stringify(it)); }
  { const it = J(`packageCarryInfo181('member','P','${CM}')`); t('PELIN: GD payi ile kapandi → yalniz bireysel ' + PREV + ' (4 hak, 3 yapildi → 1)', it.length===1 && it[0].kind==='individual' && it[0].carry===1 && it[0].quota===4, JSON.stringify(it)); }
  { const it = J(`packageCarryInfo181('group','GD','${CM}')`); t('GD: grubun 4 hakki (8−4); PELIN kadroda degil', it.length===1 && it[0].who==='group' && it[0].carry===4, JSON.stringify(it)); }
  { const it = J(`packageCarryInfo181('member','K2','${CM}')`); t('KEREMCAN bireysel acilirken: onceki grubu GE ' + PREV + ' 2 hak', it.length===1 && it[0].kind==='group' && it[0].gid==='GE' && it[0].carry===2, JSON.stringify(it)); }
  { const it = J(`packageCarryInfo181('group','GE','${CM}')`); t('GE: grubun 2 hakki; RIZA tekrar sayilmaz', it.length===1 && it[0].who==='group' && it[0].carry===2, JSON.stringify(it)); }

  console.log('[2] METIN: carryText181');
  { const txt = w.eval(`carryText181(packageCarryInfo181('group','GA','${CM}'))`);
    t('grup satiri: «AYSE - BERNA» grubunun ' + LBL(PREV) + ' paketinde 3 ders hakkı devam ediyor', has(txt, '«AYSE - BERNA» grubunun ' + LBL(PREV) + ' paketinde 3 ders hakkı devam ediyor'), txt);
    t('ayrinti: 5/8 yapıldı · 2 planlı (tarihler) · 1 planlanmamış', has(txt, '5/8 yapıldı') && has(txt, '2 planlı') && has(txt, w.eval(`fmtShort('${dd(CM,2)}')`)) && has(txt, '1 planlanmamış'), txt);
    t('uye satiri: LEYLA — bireysel ' + LBL(PREV2) + ' paketinde 3 ders hakkı devam ediyor', has(txt, 'LEYLA — bireysel ' + LBL(PREV2) + ' paketinde 3 ders hakkı devam ediyor'), txt); }
  { const txt = w.eval(`carryText181(packageCarryInfo181('member','K2','${CM}'))`); t('onceki grup satiri: KEREMCAN — önceki grubu «KEREMCAN - RIZA» ' + LBL(PREV) + ' paketinde 2 ders hakkı devam ediyor', has(txt, 'KEREMCAN — önceki grubu «KEREMCAN - RIZA» ' + LBL(PREV) + ' paketinde 2 ders hakkı devam ediyor'), txt); }
  t('bos liste → bos metin', w.eval("carryText181([])")==='');

  console.log('[3] ODEME PENCERESI: bilgi kutusu (#mp-carry-181) — yeni kayitta gorunur, duzenlemede gizli');
  fixture();
  w.eval(`openPaymentModal('A', null, 'GA', '${CM}')`); await tick();
  { const box = d.getElementById('mp-carry-181'); t('kutu var', !!box);
    t('GA/AYSE: kutu acik, 3 ders hakki + LEYLA satiri, "engel değildir" notu', !!box && box.style.display!=='none' && has(box.textContent, '3 ders hakkı devam ediyor') && has(box.textContent, 'LEYLA') && has(box.textContent, 'engel'), box && box.textContent.replace(/\s+/g,' ')); }
  w.eval("closeModal('modal-payment')");
  w.eval(`openPaymentModal('I', null, '', '${CM}')`); await tick();
  { const box = d.getElementById('mp-carry-181'); t('IREM bireysel: kutu acik, 2 ders hakki', !!box && box.style.display!=='none' && has(box.textContent, 'bireysel ' + LBL(PREV) + ' paketinde 2 ders hakkı devam ediyor'), box && box.textContent.replace(/\s+/g,' ')); }
  w.eval("closeModal('modal-payment')");
  w.eval(`openPaymentModal('J', null, '', '${CM}')`); await tick();
  { const box = d.getElementById('mp-carry-181'); t('JALE (8/8): kutu gizli', !!box && box.style.display==='none', box && box.style.display); }
  w.eval("closeModal('modal-payment')");
  w.eval(`openPaymentModal('I', 'pi1', '', '${PREV}')`); await tick();
  { const box = d.getElementById('mp-carry-181'); t('duzenleme (mevcut odeme): kutu gizli', !!box && box.style.display==='none', box && box.style.display); }
  w.eval("closeModal('modal-payment')");
  w.eval(`openPaymentModal('J', null, '', '${CM}')`); await tick();
  w.eval("document.getElementById('mp-member').value='I'; onPayMemberChange();"); await tick();
  { const box = d.getElementById('mp-carry-181'); t('pencerede uye degisince (JALE → IREM) kutu yenilenir', !!box && box.style.display!=='none' && has(box.textContent, '2 ders hakkı'), box && box.textContent.replace(/\s+/g,' ')); }
  w.eval("closeModal('modal-payment')");

  console.log('[4] KAYDET: paket YINE DE acilir + uzun toast (bilgi), hak devam etmiyorsa toast yok');
  fixture();
  w.eval(`openPaymentModal('I', null, '', '${CM}')`); await tick();
  w.eval("savePayment();"); await tick(80);
  t('IREM: ' + CM + ' paketi ACILDI (engellenmedi)', J(`state.members.find(m=>m.id==='I').packages.some(p=>p.month==='${CM}')`)===true);
  t('IREM: odeme kaydedildi', J(`state.payments.filter(p=>p.memberId==='I' && p.packageMonth==='${CM}').length`)===1);
  t('toast HEMEN degil (akisin kisa toast\'ini ezmesin) — 80 ms sonra henuz yok', toastsWith('hakkı devam').length===0, JSON.stringify(J('window.__toasts')));
  await tick(2000);
  { const tt = toastsWith('2 ders hakkı devam ediyor'); t('toast (1.9 sn sonra): "bireysel ' + LBL(PREV) + ' paketinde 2 ders hakkı devam ediyor", sure ≥ 5 sn', tt.length===1 && has(tt[0][0], 'bireysel ' + LBL(PREV)) && +tt[0][1] >= 5000, JSON.stringify(J('window.__toasts'))); }
  w.eval("window.__toasts=[];");
  w.eval(`openPaymentModal('J', null, '', '${CM}')`); await tick();
  w.eval("savePayment();"); await tick(2000);
  t('JALE: paket acildi, hak-devam toasti YOK', J(`state.members.find(m=>m.id==='J').packages.some(p=>p.month==='${CM}')`)===true && toastsWith('hakkı devam').length===0, JSON.stringify(J('window.__toasts')));
  w.eval("window.__toasts=[];");
  w.eval(`openPaymentModal('A', null, 'GA', '${CM}')`); await tick();
  w.eval("savePayment();"); await tick(2000);
  t('GA: ' + CM + ' grup paketi ACILDI', J(`state.groups.find(g=>g.id==='GA').packages.some(p=>p.month==='${CM}')`)===true);
  { const tt = toastsWith('3 ders hakkı devam ediyor'); t('toast: grubun 3 hakki + LEYLA satiri (tek toast)', tt.length===1 && has(tt[0][0], 'LEYLA') && has(tt[0][0], '«AYSE - BERNA» grubunun'), JSON.stringify(J('window.__toasts'))); }
  w.eval("window.__toasts=[];");
  w.eval(`openPaymentModal('B', null, 'GA', '${CM}')`); await tick();
  { const box = d.getElementById('mp-carry-181'); t('paket zaten acikken (BERNA taksit): kutu yine bilgi verir', !!box && box.style.display!=='none' && has(box.textContent, '3 ders hakkı'), box && box.style.display); }
  w.eval("savePayment();"); await tick(2000);
  t('ikinci odeme yeni paket acmaz → toast yok (bilgi kutuda verildi)', toastsWith('hakkı devam').length===0, JSON.stringify(J('window.__toasts')));

  console.log('[5] ODENDI TIKI: onay metnine bilgi eklenir, odeme + paket yine de olusur');
  fixture();
  await w.eval(`togglePaidTick('K','GB',{stopPropagation(){}},'${CM}')`); await tick(80);
  { const c = (w.__confirms || []).find(x => /ödeme kaydı oluşturulacak/.test(x)); t('onay metni: KUBRA — bireysel ' + LBL(PREV) + ' paketinde 2 ders hakkı devam ediyor', !!c && has(c, 'KUBRA — bireysel ' + LBL(PREV) + ' paketinde 2 ders hakkı devam ediyor'), c); }
  t('odeme + GB paketi olustu (engellenmedi)', J(`state.payments.filter(p=>p.memberId==='K' && p.groupId==='GB' && p.packageMonth==='${CM}').length`)===1 && J(`state.groups.find(g=>g.id==='GB').packages.some(p=>p.month==='${CM}')`)===true);
  await tick(2000);
  t('tik yolunda da toast (KUBRA 2 hak)', toastsWith('KUBRA — bireysel').length===1, JSON.stringify(J('window.__toasts')));
  fixture();
  await w.eval(`togglePaidTick('C','GC',{stopPropagation(){}},'${CM}')`); await tick(80);
  { const c = (w.__confirms || []).find(x => /ödeme kaydı oluşturulacak/.test(x)); t('CEREN/GC (erken kapanis): onay metninde hak-devam bilgisi YOK', !!c && !has(c, 'hakkı devam'), c); }

  console.log('[6] TOPLU ODEME (Gruptaki Tum Uyeler): onay metnine bilgi, kayitlar olusur');
  fixture();
  w.eval(`openPaymentModal('A', null, 'GA', '${CM}')`); await tick();
  w.eval("saveGroupPaymentAll();"); await tick(80);
  { const c = (w.__confirms || []).find(x => /ödeme kaydı açılacak/.test(x)); t('onay metni: grubun 3 hakki + LEYLA satiri', !!c && has(c, '3 ders hakkı devam ediyor') && has(c, 'LEYLA — bireysel'), c); }
  t('3 uyeye odeme + GA paketi olustu', J(`state.payments.filter(p=>p.groupId==='GA' && p.packageMonth==='${CM}').length`)===3 && J(`state.groups.find(g=>g.id==='GA').packages.some(p=>p.month==='${CM}')`)===true);
  await tick(2000);

  console.log('[7] PAKET UZADI (0 ₺) = devam eden hakkin kendisi → sessiz; ders girisiyle acilan paket → toast');
  fixture();
  w.eval(`__groupPackageExtendCore(state.groups.find(g=>g.id==='GA'), '${CM}', 'sarktı')`); await tick(2000);
  t('GA uzadi paketi olustu, toast YOK', J(`state.groups.find(g=>g.id==='GA').packages.some(p=>p.month==='${CM}' && p.status==='extended')`)===true && toastsWith('hakkı devam').length===0, JSON.stringify(J('window.__toasts')));
  w.eval(`__memberPackageExtendCore(state.members.find(m=>m.id==='I'), '${CM}', 'sarktı')`); await tick(2000);
  t('IREM uzadi paketi olustu, toast YOK', J(`state.members.find(m=>m.id==='I').packages.some(p=>p.month==='${CM}' && p.status==='extended')`)===true && toastsWith('hakkı devam').length===0);
  fixture();
  w.eval(`createMemberPackage(state.members.find(m=>m.id==='I'), '${CM}', '${CM}-01', {})`); await tick(2000);
  t('createMemberPackage (ders girisi yolu): paket + toast', J(`state.members.find(m=>m.id==='I').packages.some(p=>p.month==='${CM}')`)===true && toastsWith('2 ders hakkı devam ediyor').length===1, JSON.stringify(J('window.__toasts')));
  w.eval("window.__toasts=[];");
  w.eval(`createMemberPackage(state.members.find(m=>m.id==='I'), '${CM}', '${CM}-01', {})`); await tick(2000);
  t('ayni ay ikinci cagri (mevcut paket doner) → toast yok', toastsWith('hakkı devam').length===0);
  w.eval(`createMemberPackage(state.members.find(m=>m.id==='K'), '${CM}', '${CM}-01', {silent181:true})`); await tick(2000);
  t('silent181 secenegi → toast yok', toastsWith('hakkı devam').length===0);

  console.log('[8] GRUP / UYE DETAYI: devam eden hak notu');
  fixture();
  w.eval(`openGroupDetail('GA','${CM}')`); await tick();
  { const txt = d.getElementById('gd-content').textContent; t('GA ' + CM + ' detayi: 3 ders hakki notu + LEYLA', has(txt, '3 ders hakkı devam ediyor') && has(txt, 'LEYLA'), txt.replace(/\s+/g,' ').slice(0,300)); }
  w.eval("closeModal('modal-group-detail')");
  w.eval(`openGroupDetail('GC','${CM}')`); await tick();
  t('GC detayi: not yok', !has(d.getElementById('gd-content').textContent, 'hakkı devam'));
  w.eval("closeModal('modal-group-detail')");
  w.eval(`openGroupDetail('GA','${PREV}')`); await tick();
  t('GA ' + PREV + ' detayi (paketin kendi ayi): not yok', !has(d.getElementById('gd-content').textContent, 'hakkı devam'));
  w.eval("closeModal('modal-group-detail')");
  w.eval(`openMemberDetail('I','${CM}')`); await tick();
  t('IREM ' + CM + ' detayi: 2 ders hakki notu', has(d.getElementById('md-content').textContent, '2 ders hakkı devam ediyor'), d.getElementById('md-content').textContent.replace(/\s+/g,' ').slice(0,200));
  w.eval("closeModal('modal-member-detail')");
  w.eval(`openMemberDetail('J','${CM}')`); await tick();
  t('JALE detayi: not yok', !has(d.getElementById('md-content').textContent, 'hakkı devam'));
  w.eval("closeModal('modal-member-detail')");
  w.eval(`openMemberDetail('A','${CM}')`); await tick();
  t('AYSE (GA uyesi) detayi: grubunun 3 hakki ("«AYSE - BERNA» grubunun", "önceki grubu" DEGIL)', has(d.getElementById('md-content').textContent, '«AYSE - BERNA» grubunun') && !has(d.getElementById('md-content').textContent, 'önceki grubu'), d.getElementById('md-content').textContent.replace(/\s+/g,' ').slice(0,200));
  w.eval("closeModal('modal-member-detail')");

  console.log('[9] STAFF: bilgi yalniz veri (para yok) — staff rolunde de calisir, hata vermez');
  fixture();
  w.eval("window.__sbRole='staff';");
  t('staff: packageCarryInfo181 calisir', J(`packageCarryInfo181('group','GA','${CM}')`).length===2);
  w.eval("window.__sbRole='owner';");

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
