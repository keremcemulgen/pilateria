// v58 — 4 KOK FIX kilidi:
// [A] 2.paket klonu ay-kapsami (sonraki aya miras yok)  [B] Odemeler PAKET AYINA gore
// [C] Ayarlar yonetici dogrulamasi                       [D] Hoca orani asla %0 olmaz (default 30)
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
const J=a=>JSON.stringify(a);
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(async ()=>{ try {
  w.eval('window.S=()=>state;');
  w.eval("['renderMembers','renderGroups','renderDashboard','renderCalendar','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','closeMonthAddPicker','closeModal','openModal'].forEach(fn=>window[fn]=function(){}); window.save=function(){};");

  console.log('[A] KLON AY-KAPSAMI: Haziran klonu Temmuz kadrosuna MIRAS kalmaz');
  w.eval(`
    const M=(id)=>({id,name:id.toUpperCase(),joinDate:'2026-01-01',archived:false,totalPrice:4500,packages:[],monthly:{}});
    state.members=[M('isil'),M('ozge'),M('ozum'),M('sevdi')];
    state.members.push({id:'isil2',name:'IŞIL (2. Paket)',secondOfMember:'isil',joinDate:'2026-01-01',archived:false,
      totalPrice:4500,packages:[],monthly:{'2026-06':{enrolled:true}}}); // createSecondPackage Haziran'da olusturdu
    // Kerem klonu Haziran'da gruba ekledi -> applyRosterChange carry-forward: kok liste + Temmuz kaydina da yazdi
    state.groups=[{id:'G',name:'G',size:5,memberIds:['isil','ozge','ozum','sevdi','isil2'],
      monthlyMembers:{'2026-06':['isil','ozge','ozum','sevdi','isil2'],'2026-07':['isil','ozge','ozum','sevdi','isil2']},
      packages:[]}];
    state.lessons=[]; state.payments=[];
  `);
  const G=()=>w.S().groups[0];
  t('KANON: klon Haziran aktif (enrolled:true var)', w.__memberActiveInMonth(w.S().members.find(x=>x.id==='isil2'),'2026-06')===true);
  t('KANON: klon Temmuz AKTIF DEGIL (miras yok)', w.__memberActiveInMonth(w.S().members.find(x=>x.id==='isil2'),'2026-07')===false);
  t('Haziran kadrosu 5 kisi (klon dahil)', w.activeGroupRosterForMonth(G(),'2026-06').length===5, J(w.activeGroupRosterForMonth(G(),'2026-06')));
  t('Temmuz kadrosu 4 kisi (klon DUSTU)', J(w.activeGroupRosterForMonth(G(),'2026-07'))===J(['isil','ozge','ozum','sevdi']), J(w.activeGroupRosterForMonth(G(),'2026-07')));
  t('isMemberEnrolledInMonth de ayni (delegasyon)', w.isMemberEnrolledInMonth('isil2','2026-06')===true && w.isMemberEnrolledInMonth('isil2','2026-07')===false);
  t('PARA: Temmuz grup toplami 4x4500=18000 (22500 DEGIL)', w.groupExpectedTotal(G(),'2026-07')===18000, w.groupExpectedTotal(G(),'2026-07'));
  t('PARA: Haziran grup toplami 5x4500=22500 (klon meshru)', w.groupExpectedTotal(G(),'2026-06')===22500, w.groupExpectedTotal(G(),'2026-06'));
  const rows7 = w.buildMemberRows('2026-07');
  t('UYE LISTESI Temmuz: klon satiri YOK', !rows7.some(r=>r.memberId==='isil2'), rows7.map(r=>r.memberId).filter(Boolean).join(','));
  const rows6 = w.buildMemberRows('2026-06');
  t('UYE LISTESI Haziran: klon satiri VAR', rows6.some(r=>r.memberId==='isil2'), rows6.map(r=>r.memberId).filter(Boolean).join(','));
  w.addMemberToMonth('isil2','2026-07'); // Kerem BILEREK Temmuz'a eklerse
  t('elle Temmuz\'a ekleyince gorunur (enrolled:true yazildi)', w.isMemberEnrolledInMonth('isil2','2026-07')===true);
  w.eval("state.members.find(x=>x.id==='isil2').monthly['2026-07']={enrolled:false};");
  t('normal uye REGRESYON: monthly kaydi olmayan normal uye Temmuz aktif (default)', w.isMemberEnrolledInMonth('ozge','2026-07')===true);

  console.log('[B] ODEMELER PAKET AYINA GORE (Haziran paketi Temmuz\'da odendi -> HAZIRAN listesinde)');
  w.eval(`
    state.payments=[
      {id:'P1',memberId:'isil',date:'2026-07-15',packageMonth:'2026-06',amount:4500,method:'cash',pkgName:'BIREYSEL'},
      {id:'P2',memberId:'ozge',date:'2026-07-10',packageMonth:'2026-07',amount:4500,method:'cash',pkgName:'BIREYSEL'}
    ];`);
  t('paymentMonthOf: packageMonth kazanir', w.paymentMonthOf({packageMonth:'2026-06',date:'2026-07-15'})==='2026-06');
  t('paymentMonthOf: packageMonth yoksa tarih ayi', w.paymentMonthOf({date:'2026-07-15'})==='2026-07');
  d.getElementById('pay-month').value='2026-06'; w.renderPayments();
  let tb=d.getElementById('payments-tbody').innerHTML;
  t('HAZIRAN filtresi: gec odeme (P1) GORUNUR', /15\.07\.2026|IŞIL|ISIL/i.test(tb), tb.slice(0,80));
  t('HAZIRAN filtresi: Temmuz paketi (P2) GORUNMEZ', !/ozge/i.test(tb));
  t('gec odemede 📦 paket-ayi rozeti var', /📦/.test(tb));
  d.getElementById('pay-month').value='2026-07'; w.renderPayments();
  tb=d.getElementById('payments-tbody').innerHTML;
  t('TEMMUZ filtresi: P2 gorunur, P1 gorunmez', /ozge/i.test(tb) && !/isil/i.test(tb.replace(/IŞIL \(2\. Paket\)/g,'')), '');
  t('GELIR istatistigi zaten paket-ayinda (Haziran=4500)', w.S().payments.filter(p=>w.paymentMonthOf(p)==='2026-06').reduce((a,b)=>a+b.amount,0)===4500);

  console.log('[C] AYARLAR GUARD: yonetici e-posta+sifre dogrulamasi');
  t('requireAdminVerify + confirmAdminVerify + sarmallar tanimli',
    typeof w.requireAdminVerify==='function' && typeof w.confirmAdminVerify==='function' &&
    typeof w.__exportDataNow==='function' && typeof w.__importDataFile==='function' && typeof w.__resetAllDataNow==='function');
  // sbClient mock (SUPABASE_MODE=true dosyada; sbInit sbClient set ise onu dondurur)
  w.eval(`sbClient={auth:{signInWithPassword:async({email,password})=>({error:(email==='admin@p.com'&&password==='dogru')?null:{message:'Invalid login credentials'}}),getSession:async()=>({data:{session:{ok:1}}})}};`);
  let called=0; w.__exportDataNow=()=>{called++;};
  w.eval("window.openModal=function(id){window.__lastOpened=id;};");
  w.exportData();
  t('exportData once DOGRULAMA modali acar (indirme olmaz)', w.__lastOpened==='modal-admin-verify' && called===0, w.__lastOpened);
  t('eylem etiketi yazildi', d.getElementById('adv-action').textContent.includes('Yedek'), d.getElementById('adv-action').textContent);
  d.getElementById('adv-email').value='admin@p.com'; d.getElementById('adv-pass').value='YANLIS';
  await w.confirmAdminVerify();
  t('YANLIS sifre: islem CALISMADI + hata mesaji', called===0 && /hatalı/.test(d.getElementById('adv-msg').textContent), d.getElementById('adv-msg').textContent);
  d.getElementById('adv-pass').value='dogru';
  await w.confirmAdminVerify();
  t('DOGRU sifre: islem calisti', called===1, called);

  console.log('[D] HOCA ORANI: %0 YOK — default %30; elle override calisir');
  w.eval(`
    state.settings.instructorShareRate=30; state.instructors=[{id:'h',name:'H'}];
    state.members=[{id:'b1',name:'B1',joinDate:'2026-01-01',archived:false,totalPrice:18000,packages:[],monthly:{'2026-06':{enrolled:true}}}];
    state.groups=[{id:'GB',name:'GB',size:4,memberIds:['b1'],monthlyMembers:{'2026-06':['b1']},
      packages:[{month:'2026-06',sessions:8,price:18000,status:'active',instructorShareRate:0}]}]; // 0 sizmis (eski bug)
    state.lessons=[{id:'LZ',date:'2026-06-09',time:'18:15',status:'completed',instructorId:'h',groupId:'GB',
      memberIds:['b1'],packageMonth:'2026-06',packageOwnerType:'group',packageOwnerId:'GB',size:4}];
  `);
  const LZ=()=>w.S().lessons.find(x=>x.id==='LZ');
  t('paket kaydinda 0 olsa bile oran %30 (0 tanimsiz)', w.resolveInstructorRate(LZ())===30, w.resolveInstructorRate(LZ()));
  t('hakedis 0 DEGIL', w.instructorEarningForLesson(LZ())>0, w.instructorEarningForLesson(LZ()));
  w.eval("S().lessons.find(x=>x.id==='LZ').instructorRateOverride=0;");
  t('ders override=0 da tanimsiz -> %30', w.resolveInstructorRate(LZ())===30, w.resolveInstructorRate(LZ()));
  w.eval("S().lessons.find(x=>x.id==='LZ').instructorRateOverride=40;");
  t('ELLE override %40 CALISIR', w.resolveInstructorRate(LZ())===40, w.resolveInstructorRate(LZ()));
  w.eval("S().lessons.find(x=>x.id==='LZ').instructorRateOverride=null; S().groups[0].packages[0].instructorShareRate=50;");
  t('paket orani 50 gecerli (0 degilse zincir calisir)', w.resolveInstructorRate(LZ())===50, w.resolveInstructorRate(LZ()));
  w.eval("S().groups[0].packages[0].instructorShareRate=0; S().lessons[0].instructorRateOverride=0; S().instructors[0].shareRate=0; applyV10MigrationToState(state);");
  t('MIGRATION 0 oranlari null yapar (paket+ders+hoca)', w.S().groups[0].packages[0].instructorShareRate===null && w.S().lessons[0].instructorRateOverride===null && w.S().instructors[0].shareRate===null,
    J([w.S().groups[0].packages[0].instructorShareRate, w.S().lessons[0].instructorRateOverride, w.S().instructors[0].shareRate]));
  // yazim tarafi: bos/0 opts -> null
  w.eval("state.members.push({id:'nm',name:'NM',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}});");
  w.eval("createGroupPackage(state.groups[0],'2026-09','2026-09-01',{instructorShareRate:null});");
  t('createGroupPackage null oran -> kayitta null (0 YAZILMAZ)', w.S().groups[0].packages.find(p=>p.month==='2026-09').instructorShareRate===null,
    w.S().groups[0].packages.find(p=>p.month==='2026-09').instructorShareRate);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
