// v134 — HOCA BORDROSU: IBAN/nakit bolusumu + saatlik SGK. Yamasiz build'de FAIL etmeli.
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
setTimeout(()=>{ try {
  const cm = w.eval('currentMonth()');
  w.eval(`
    state.settings.sgkHourlyWage = 30;
    state.settings.sgkHourlyCost = 10;
    state.settings.lessonDuration = 60;
    state.packageTypes=[]; state.campaigns=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:1600,packages:[],monthly:{'${cm}':{enrolled:true}}}];
    state.groups=[];
    state.lessons=[
      {id:'L1',date:'${cm}-05',time:'10:00',durationMin:60,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'completed'},
      {id:'L2',date:'${cm}-06',time:'11:00',durationMin:60,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'missed'},
      {id:'L3',date:'${cm}-07',time:'12:00',durationMin:60,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'planned'}
    ];`);

  console.log('[1] BORDRO MOTORU (saat = hakedis motoruyla AYNI dersler: yapildi+yandi)');
  t('instructorPayrollForMonth var', w.eval("typeof instructorPayrollForMonth === 'function'"));
  const pr = w.eval("JSON.stringify(instructorPayrollForMonth('h1','"+cm+"'))");
  t('saat=2 (planli sayilmaz)', /"saat":2/.test(pr), pr);
  t('hakedis=120 (1600/8 x %30 x 2 — v41 kanonu)', /"hakedis":120/.test(pr), pr);
  t('IBAN=60 (2sa x 30)', /"iban":60/.test(pr));
  t('SGK=20 (2sa x 10)', /"sgk":20/.test(pr));
  t('nakit=60 (120-60)', /"nakit":60/.test(pr));

  console.log('[2] KIRPMA: bordro hakedisi ASAMAZ');
  w.eval("state.settings.sgkHourlyWage = 200;");
  const pr2 = w.eval("JSON.stringify(instructorPayrollForMonth('h1','"+cm+"'))");
  t('iban hakedise kirpildi (120)', /"iban":120/.test(pr2), pr2);
  t('nakit 0', /"nakit":0/.test(pr2));
  w.eval("state.settings.sgkHourlyWage = 30;");

  console.log('[3] BOL-ODE: tek dokunusla IBAN + Nakit CIFT kayit');
  w.payInstructorSplit('h1', cm);
  const po = w.eval("JSON.stringify((state.instructorPayouts||[]).map(p=>({m:p.method,a:p.amount,n:p.note})))");
  t('iki kayit yazildi', w.eval('(state.instructorPayouts||[]).length') === 2, po);
  t('IBAN 60 bordro notlu', /"m":"IBAN","a":60/.test(po) && /bordro/.test(po));
  t('Nakit 60 elden notlu', /"m":"Nakit","a":60/.test(po) && /elden/.test(po));
  w.renderSalaries();
  t('tablo ✓ Odendi der', /✓ Ödendi/.test(d.getElementById('salaries-content').innerHTML));

  console.log('[4] KISMI ODEME SONRASI BOL-ODE (once odenen IBAN kismini kapatir)');
  w.eval("state.instructorPayouts=[{id:'x1',instructorId:'h1',year:+('"+cm+"'.split('-')[0]),month:+('"+cm+"'.split('-')[1]),amount:20,paidDate:'"+cm+"-10',method:'Nakit',note:'avans'}];");
  w.payInstructorSplit('h1', cm);
  const po2 = w.eval("JSON.stringify((state.instructorPayouts||[]).filter(p=>p.id!=='x1').map(p=>({m:p.method,a:p.amount})))");
  t('IBAN kalani 40 yazildi', /"m":"IBAN","a":40/.test(po2), po2);
  t('nakit 60 yazildi, toplam 120', /"m":"Nakit","a":60/.test(po2) && w.eval("(state.instructorPayouts||[]).reduce((a,p)=>a+p.amount,0)") === 120);

  console.log('[5] SGK GIDERE YAZ (mukerrer korumali, Vergi/SGK)');
  w.addSgkExpenseForMonth(cm);
  t('gider yazildi: Vergi/SGK 20', w.eval("JSON.stringify(state.expenses.map(e=>({c:e.category,a:e.amount})))") === '[{"c":"Vergi/SGK","a":20}]', w.eval("JSON.stringify(state.expenses)").slice(0,120));
  w.addSgkExpenseForMonth(cm);
  t('ikinci cagri MUKERRER yazmadi', w.eval('state.expenses.length') === 1);

  console.log('[6] EKRANLAR');
  const sal = d.getElementById('salaries-content').innerHTML;
  t('ay seridi: IBANa Yatacak + Gidere Yaz', /İBAN'a Yatacak/.test(sal) && /Gidere Yaz/.test(sal));
  t('hoca satirinda bolusum ozeti (🏦/💵)', /🏦/.test(sal) && /💵/.test(sal));
  w.eval("state.instructorPayouts=[];"); w.renderSalaries();
  t('Bol-Ode dugmesi gorunur', /Böl-Öde/.test(d.getElementById('salaries-content').innerHTML));
  w.payInstructor('h1', cm, 120);
  const mdl = d.getElementById('modal-inst-pay');
  t('odeme modalinda bordro seridi + Bol-Ode', !!mdl && /Bordro \(İBAN\)/.test(mdl.innerHTML) && /İBAN \+ Nakit olarak kaydet/.test(mdl.innerHTML));
  if (mdl) mdl.remove();

  console.log('[7] AYARLAR ALANLARI + KAPALI DURUM');
  w.renderSettings();
  t('set-sgk-wage alani var ve dolu (30)', d.getElementById('set-sgk-wage') && d.getElementById('set-sgk-wage').value === '30', d.getElementById('set-sgk-wage') ? d.getElementById('set-sgk-wage').value : 'yok');
  d.getElementById('set-sgk-wage').value = '45'; d.getElementById('set-sgk-cost').value = '15';
  w.saveSettings();
  t('saveSettings kalici yazdi (45/15)', w.eval('state.settings.sgkHourlyWage') === 45 && w.eval('state.settings.sgkHourlyCost') === 15);
  w.eval("state.settings.sgkHourlyWage = 0; state.settings.sgkHourlyCost = 0;"); w.renderSalaries();
  const kapali = d.getElementById('salaries-content').innerHTML;
  t('kapaliyken ipucu gorunur, Bol-Ode YOK', /asgari saatlik ücret/.test(kapali) && !/Böl-Öde/.test(kapali));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
