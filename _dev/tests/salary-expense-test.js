// v136 — HOCA MAASI GIDERE (kisi bazli, istege bagli, SGK gibi). Yamasiz build'de FAIL etmeli.
// KRITIK MUHASEBE: net kar zaten Hoca Odemeleri'ni dusuyor — maas-gider kaydi net karda
// MUKERRER DUSULMEZ (MAAS-OTO isaretli kayitlar formulden haric); gider listesi/CSV tam kalir.
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
setTimeout(()=>{ try {
  const cm = w.eval('currentMonth()');
  w.eval(`
    state.settings.sgkHourlyWage = 0; // bordro KAPALI — maas-gider yine calismali (hakedis bazli)
    state.settings.sgkHourlyCost = 0;
    state.packageTypes=[]; state.campaigns=[]; state.expenses=[]; state.instructorPayouts=[];
    state.instructors=[{id:'h1',name:'HOCA BIR',shareRate:30},{id:'h2',name:'HOCA IKI',shareRate:30}];
    state.members=[
      {id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:1600,packages:[],monthly:{'${cm}':{enrolled:true}}},
      {id:'m2',name:'BANU',joinDate:'2026-01-01',totalPrice:1600,packages:[],monthly:{'${cm}':{enrolled:true}}}
    ];
    state.groups=[];
    state.lessons=[
      {id:'L1',date:'${cm}-05',time:'10:00',instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'completed'},
      {id:'L2',date:'${cm}-06',time:'11:00',instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'missed'},
      {id:'L3',date:'${cm}-07',time:'12:00',instructorId:'h2',size:1,memberIds:['m2'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m2',status:'completed'}
    ];
    state.payments=[{id:'P1',memberId:'m1',amount:1000,date:'${cm}-03',packageMonth:'${cm}',method:'Nakit'}];`);

  console.log('[1] MAASI GIDERE YAZ — kisi bazli, hakedis tutarinda, mukerrer korumali');
  t('addInstructorSalaryExpense var', w.eval("typeof addInstructorSalaryExpense === 'function'"));
  w.addInstructorSalaryExpense('h1', cm);
  const e1 = w.eval("JSON.stringify((state.expenses||[]).map(e=>({c:e.category,a:e.amount,n:e.note})))");
  t('Hoca Maasi 120 yazildi (1600/8 x %30 x 2 ders)', /"c":"Hoca Maaşı","a":120/.test(e1), e1);
  t('not: hoca adi + MAAS-OTO isareti', /HOCA BIR/.test(e1) && e1.indexOf('MAAS-OTO-'+cm+'-h1') !== -1, e1);
  w.addInstructorSalaryExpense('h1', cm);
  t('ikinci cagri MUKERRER yazmadi', w.eval('(state.expenses||[]).length') === 1);
  t('uyari metni "zaten" der', /zaten/.test(String(w.__dlgMsg||'')), String(w.__dlgMsg||''));
  w.addInstructorSalaryExpense('h2', cm);
  t('h2 KENDI kaydini yazdi (kisi bazli, 60)', w.eval('(state.expenses||[]).length') === 2 && /"a":60/.test(w.eval("JSON.stringify(state.expenses.map(e=>({a:e.amount})))")));

  console.log('[2] NET KAR: maas-gider MUKERRER DUSULMEZ (maaslar Hoca Odemeleri satirinda)');
  w.eval("state.instructorPayouts=[{id:'x1',instructorId:'h1',year:+('"+cm+"'.split('-')[0]),month:+('"+cm+"'.split('-')[1]),amount:120,paidDate:'"+cm+"-10',method:'Nakit',note:''}];");
  w.eval("state.expenses.push({id:'e9',date:'"+cm+"-04',category:'Kira',amount:50,note:'stüdyo kira'});");
  const N = w.eval("JSON.stringify(netProfitForMonth('"+cm+"'))");
  t('pay=120 (odeme kaydindan)', /"pay":120/.test(N), N);
  t('net kar giderinde SADECE 50 (maas 180 haric)', /"exp":50/.test(N), N);
  t('net = 1000-120-50 = 830 (cift sayim YOK)', /"net":830/.test(N), N);
  t('expMaas=180 raporlanir', /"expMaas":180/.test(N), N);
  t('gider listesi toplami TAM 230 (defter eksiksiz)', w.eval("expensesTotalForMonth('"+cm+"')") === 230);

  console.log('[3] KATEGORI + EKRAN');
  t('EXPENSE_CATS Hoca Maasi icerir', w.eval("EXPENSE_CATS.indexOf('Hoca Maaşı') !== -1"));
  const mi = d.getElementById('sal-month'); if (mi) mi.value = cm;
  w.renderSalaries();
  const sal = d.getElementById('salaries-content').innerHTML;
  t('maasi yazilmis hocada "Giderde" isareti', /Giderde/.test(sal), sal.indexOf('Giderde'));
  w.eval("state.expenses = state.expenses.filter(e=>e.category!=='Hoca Maaşı');");
  w.renderSalaries();
  const sal2 = d.getElementById('salaries-content').innerHTML;
  t('yazilmamisken satirda Gidere Yaz dugmesi', /addInstructorSalaryExpense\('h1'/.test(sal2) && /🧾/.test(sal2));
  t('panel aciklamasi kaynakta: maas kaydi Hoca Odemelerinde sayilir', html.indexOf("maaş kaydı — Hoca Ödemeleri'nde sayılır") !== -1);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
