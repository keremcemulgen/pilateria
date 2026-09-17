// v172 — ODEME KAYDININ DERS SAYISI = UYENIN O AYKI HAKKI (Kerem, 2026-09-16: "Duzenle'de 3 ders
// tanimladigim uyenin Odeme al sayfasinda eski 8 hak gozukuyor"). KOK NEDEN: odeme akislari ders
// sayisini SAHIP BIRIMDEN (grup uyesiyse GRUBUN hakki) aliyordu; uyenin kendi "Ders Hakki (bu ay)"
// (sessionsOverride) yalniz bireysel akista okunuyordu — "TEK GERCEK, COK YUZEY" ailesi.
// v172 TEK KAYNAK: memberEffectiveQuota(uye, ay, grup) = pay dersi (ayrilan) > elle hak > grubun hakki > uyenin kotasi.
// Yuzeyler: odeme penceresi (acilis + uye degisimi + grup kilidi), tik, toplu grup odemesi, uye penceresi
// "Otomatik: N". Grup PAKETI olusturulurken uyeye ozel hak grubun hakkina KARISMAZ. Yamasiz build'de FAIL etmeli.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return (o&&o.input) ? String(o.input.value) : true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return true; }; w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
const val = id => (d.getElementById(id)||{}).value;
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderGroups','renderDashboard','renderArchive','refreshMemberDetailIfOpen','closeFillSlotModal','renderMembers'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  function fixture(opts){
    opts = opts || {};
    w.eval(`
      state.settings.reformers=12;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500},{id:'p4',name:'4 Ders',sessions:4,price:2500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[
        {id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${CM}':{enrolled:true,sessionsOverride:3,totalPrice:1687.5}}},
        {id:'B',name:'BURCU',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'C',name:'CEREN',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'D',name:'DENIZ',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true,sessionsOverride:4}}},
        {id:'E',name:'ELIF',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}}
      ];
      state.groups=[
        {id:'G1',name:'AYSE - BURCU',size:2,memberIds:['A','B'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'10:00',packages:${opts.noPkg ? '[]' : `[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}]`},monthlyMembers:{},monthlyNotes:{}},
        {id:'G2',name:'CEREN',size:2,memberIds:['C'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'11:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlySessions:{'${CM}':6},monthlyMembers:{},monthlyNotes:{}}
      ];
      state.lessons=[];
      ['${CM}-01','${CM}-03'].forEach((dt,i)=>state.lessons.push({id:'Y'+i,groupId:'G1',memberIds:['A','B'],date:dt,time:'10:00',status:'completed',packageMonth:'${CM}',instructorId:'h1',size:2}));
      state.payments=[];
      document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
      currentGroupDetailMonth='${CM}';
      if (window.__partialOfferQueue) __partialOfferQueue.length=0; __undoStack=[];
    `);
    w.__msgs.length=0;
  }

  console.log('[1] motor: tek kaynak memberEffectiveQuota');
  t('memberEffectiveQuota var', w.eval("typeof memberEffectiveQuota")==='function');
  if (w.eval("typeof memberEffectiveQuota")!=='function') {
    // yamasiz build: asil belirti yine de olculsun (FAIL)
    fixture(); w.openPaymentModal('A', null, 'G1', CM);
    t('YAMASIZ: A (hak 3) icin odeme penceresi ders sayisi 3', val('mp-sessions')==='3', val('mp-sessions'));
    console.log('\nSONUC: '+pass+' gecti, '+(fail+20)+' kaldi'); process.exit(1);
  }
  fixture();
  t('A (grupta, elle hak 3) → 3', w.eval(`memberEffectiveQuota('A','${CM}','G1')`)===3);
  t('B (grupta, hak yok) → grubun hakki 8', w.eval(`memberEffectiveQuota('B','${CM}','G1')`)===8);
  t('C (grupta, grubun aylik hakki 6) → 6', w.eval(`memberEffectiveQuota('C','${CM}','G2')`)===6);
  t('D (bireysel, elle hak 4) → 4; E (bireysel) → 8', w.eval(`memberEffectiveQuota('D','${CM}','')`)===4 && w.eval(`memberEffectiveQuota('E','${CM}','')`)===8);
  t('grup verilmezse aktif grubu kendi bulur: B → 8, C → 6, A → 3', w.eval(`memberEffectiveQuota('B','${CM}')`)===8 && w.eval(`memberEffectiveQuota('C','${CM}')`)===6 && w.eval(`memberEffectiveQuota('A','${CM}')`)===3);

  console.log('[2] odeme penceresi acilisi: ders sayisi = uyenin hakki (Kerem\'in ekrani)');
  fixture(); w.openPaymentModal('A', null, 'G1', CM);
  t('A: mp-sessions 3 (8 DEGIL), tutar 1.687,5 kilitli', val('mp-sessions')==='3' && +val('mp-amount')===1687.5, val('mp-sessions')+'/'+val('mp-amount'));
  w.closeModal('modal-payment'); w.openPaymentModal('B', null, 'G1', CM);
  t('B: mp-sessions 8 (grubun hakki)', val('mp-sessions')==='8', val('mp-sessions'));
  w.closeModal('modal-payment'); w.openPaymentModal('C', null, 'G2', CM);
  t('C: mp-sessions 6 (grubun aylik hakki)', val('mp-sessions')==='6', val('mp-sessions'));
  w.closeModal('modal-payment'); w.openPaymentModal('D');
  t('D bireysel: 4 (davranis degismedi)', val('mp-sessions')==='4', val('mp-sessions'));
  w.closeModal('modal-payment'); w.openPaymentModal('E');
  t('E bireysel: 8', val('mp-sessions')==='8', val('mp-sessions'));
  w.closeModal('modal-payment');
  // uyenin satirindan degil, grup detayindan (uye secilmeden grup) acilis: ilk uye
  w.openPaymentModal(null, null, 'G1', CM);
  { const mid = val('mp-member'); t('grup akisi ilk uye ('+mid+'): ders sayisi o uyenin hakki', val('mp-sessions')===String(w.eval(`memberEffectiveQuota('${mid}','${CM}','G1')`)), val('mp-sessions')); }
  w.closeModal('modal-payment');

  console.log('[3] pencerede uye degisince ders sayisi da degisir');
  fixture(); w.openPaymentModal('B', null, 'G1', CM);
  d.getElementById('mp-member').value='A'; w.onPayMemberChange();
  t('grup akisi: B → A secilince 8 → 3', val('mp-sessions')==='3', val('mp-sessions'));
  d.getElementById('mp-member').value='B'; w.onPayMemberChange();
  t('geri B: 3 → 8', val('mp-sessions')==='8', val('mp-sessions'));
  w.closeModal('modal-payment'); w.openPaymentModal('E');
  d.getElementById('mp-member').value='D'; w.onPayMemberChange();
  t('bireysel akis: E → D secilince 8 → 4', val('mp-sessions')==='4', val('mp-sessions'));
  w.closeModal('modal-payment');

  console.log('[4] tik ile odeme: kaydin ders sayisi uyenin hakki');
  fixture();
  await w.togglePaidTick('A','G1',null,CM); await w.togglePaidTick('B','G1',null,CM); await w.togglePaidTick('D','',null,CM);
  const tk = JSON.parse(w.eval("JSON.stringify(state.payments.map(p=>[p.memberId,p.sessions,p.amount]))"));
  t('A 3 ders · 1.687,5 / B 8 ders · 4.500 / D 4 ders · 8.500', JSON.stringify(tk)==='[["A",3,1687.5],["B",8,4500],["D",4,8500]]', JSON.stringify(tk));

  console.log('[5] toplu grup odemesi: her uyeye KENDI hakki; grup PAKETI grubun hakkiyla (3 ile DEGIL)');
  fixture({noPkg:true}); w.openPaymentModal('A', null, 'G1', CM);
  t('on kosul: A icin acildi, alan 3, G1 paketi yok', val('mp-sessions')==='3' && w.eval("state.groups.find(g=>g.id==='G1').packages.length")===0);
  w.saveGroupPaymentAll();
  const all = JSON.parse(w.eval("JSON.stringify(state.payments.map(p=>[p.memberId,p.sessions]).sort())"));
  t('kayitlar: A 3, B 8', JSON.stringify(all)==='[["A",3],["B",8]]', JSON.stringify(all));
  t('G1 paketi 8 ders ile olustu (uyeye ozel 3 KARISMADI)', w.eval(`(state.groups.find(g=>g.id==='G1').packages.find(p=>p.month==='${CM}')||{}).sessions`)===8, w.eval(`JSON.stringify(state.groups.find(g=>g.id==='G1').packages)`));
  fixture({noPkg:true}); w.openPaymentModal('B', null, 'G1', CM); d.getElementById('mp-sessions').value='6'; w.saveGroupPaymentAll();
  const all2 = JSON.parse(w.eval("JSON.stringify(state.payments.map(p=>[p.memberId,p.sessions]).sort())"));
  t('B icin acilip elle 6: B 6 (alan), A 3 (elle hak), paket 6 (eski davranis)', JSON.stringify(all2)==='[["A",3],["B",6]]' && w.eval(`(state.groups.find(g=>g.id==='G1').packages.find(p=>p.month==='${CM}')||{}).sessions`)===6, JSON.stringify(all2));

  console.log('[6] tek odeme kaydi (grup akisi) paketi yokken: kayit 3, grup paketi 8');
  fixture({noPkg:true}); w.openPaymentModal('A', null, 'G1', CM); w.savePayment();
  t('A kaydi 3 ders', w.eval("JSON.stringify(state.payments.map(p=>[p.memberId,p.sessions]))")==='[["A",3]]', w.eval("JSON.stringify(state.payments.map(p=>[p.memberId,p.sessions]))"));
  t('G1 paketi 8 ders', w.eval(`(state.groups.find(g=>g.id==='G1').packages.find(p=>p.month==='${CM}')||{}).sessions`)===8);
  // elle farkli sayi girilirse (hak override'i olmayan uye) eski davranis: paket o sayiyla
  fixture({noPkg:true}); w.openPaymentModal('B', null, 'G1', CM); d.getElementById('mp-sessions').value='6'; w.savePayment();
  t('hak override\'i olmayan uyede elle 6 → kayit 6, grup paketi 6 (eski davranis korundu)', w.eval("state.payments[0].sessions")===6 && w.eval(`(state.groups.find(g=>g.id==='G1').packages.find(p=>p.month==='${CM}')||{}).sessions`)===6);

  console.log('[7] v171 payi korunur: ayrilan uyenin odemesi payin dersi');
  fixture(); w.eval("assignMemberToSlot('A','G2',1)"); await tick();
  t('on kosul: A G1 payi 2 ders', w.eval(`(partialShareFor('G1','A','${CM}')||{}).sessions`)===2);
  w.openPaymentModal('A', null, 'G1', CM);
  t('A→G1 odeme: 2 (pay), elle hak 3 DEGIL', val('mp-sessions')==='2', val('mp-sessions'));
  w.closeModal('modal-payment');
  t('memberEffectiveQuota(A,G2) = 3 (yeni grupta elle hak)', w.eval(`memberEffectiveQuota('A','${CM}','G2')`)===3);

  console.log('[8] uye penceresi "Otomatik: N" = uyenin gercek otomatik hakki');
  fixture(); w.openMemberModal('C');
  t('C (G2, aylik hak 6): Otomatik: 6', (d.getElementById('mm-sessions')||{}).placeholder==='Otomatik: 6', (d.getElementById('mm-sessions')||{}).placeholder);
  w.closeModal('modal-member'); w.openMemberModal('A');
  t('A: deger 3', val('mm-sessions')==='3');
  w.closeModal('modal-member'); w.openMemberModal('D');
  t('D bireysel: deger 4 (davranis degismedi)', val('mm-sessions')==='4', val('mm-sessions'));
  w.closeModal('modal-member'); w.openMemberModal('E');
  t('E bireysel (hak yok): bos, placeholder Otomatik: 8', val('mm-sessions')==='' && (d.getElementById('mm-sessions')||{}).placeholder==='Otomatik: 8', (d.getElementById('mm-sessions')||{}).placeholder);
  w.closeModal('modal-member');

  console.log('[9] duzenleme yolu degismedi: mevcut kaydin ders sayisi aynen gelir');
  fixture(); w.eval(`state.payments.push({id:'PX',memberId:'B',groupId:'G1',date:'${CM}-02',packageMonth:'${CM}',sessions:5,amount:4500,listPrice:4500,method:'Nakit',pkgName:'8 Ders'})`);
  w.openPaymentModal('B','PX','G1');
  t('kayit duzenleme: 5', val('mp-sessions')==='5', val('mp-sessions'));
  w.closeModal('modal-payment');

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
