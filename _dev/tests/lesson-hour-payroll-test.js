// v135 — KEREM KURALI: bordroda HER DERS 1 SAAT sayilir (45dk ders + mola = 1 saat).
// Ders suresi (durationMin) bordro saatini ETKILEMEZ. Yamasiz build'de FAIL etmeli.
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
    state.settings.lessonDuration = 45; // Kerem: dersler 45 dk
    state.packageTypes=[]; state.campaigns=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:1600,packages:[],monthly:{'${cm}':{enrolled:true}}}];
    state.groups=[];
    state.lessons=[
      {id:'L1',date:'${cm}-05',time:'10:00',instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'completed'},
      {id:'L2',date:'${cm}-06',time:'11:00',durationMin:45,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'missed'},
      {id:'L3',date:'${cm}-07',time:'12:00',durationMin:45,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'planned'},
      {id:'L4',date:'${cm}-08',time:'13:00',durationMin:100,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'completed'}
    ];`);

  console.log('[1] HER DERS 1 SAAT (sure ne olursa olsun: 45dk, 100dk, suresi bos — hepsi 1)');
  const pr = w.eval("JSON.stringify(instructorPayrollForMonth('h1','"+cm+"'))");
  t('saat=3 (3 yapildi/yandi ders; 45dk hesabi DEGIL)', /"saat":3,/.test(pr), pr);
  t('IBAN=90 (3 ders x 1sa x 30)', /"iban":90,/.test(pr), pr);
  t('SGK=30 (3 ders x 1sa x 10)', /"sgk":30,/.test(pr), pr);
  t('hakedis=180 (v41 motoru degismedi: 1600/8 x %30 x 3)', /"hakedis":180/.test(pr), pr);
  t('nakit=90 (180-90)', /"nakit":90,/.test(pr), pr);

  console.log('[2] KIRPMA hala calisiyor');
  w.eval("state.settings.sgkHourlyWage = 200;");
  const pr2 = w.eval("JSON.stringify(instructorPayrollForMonth('h1','"+cm+"'))");
  t('iban hakedise kirpildi (180)', /"iban":180,/.test(pr2), pr2);
  t('nakit 0', /"nakit":0,/.test(pr2));
  w.eval("state.settings.sgkHourlyWage = 30;");

  console.log('[3] BOL-ODE yeni saatle yazar');
  w.eval("state.instructorPayouts=[];");
  w.payInstructorSplit('h1', cm);
  const po = w.eval("JSON.stringify((state.instructorPayouts||[]).map(p=>({m:p.method,a:p.amount})))");
  t('IBAN 90 + Nakit 90', /"m":"IBAN","a":90/.test(po) && /"m":"Nakit","a":90/.test(po), po);

  console.log('[4] EKRAN + AYARLAR METNI');
  w.eval("state.instructorPayouts=[];");
  w.renderSalaries();
  const sal = d.getElementById('salaries-content').innerHTML;
  t('ay seridi 3 saat der (3.17 degil)', />3 saat</.test(sal) && !/3\.17/.test(sal));
  t('Ayarlar etiketi kurali soyler: her ders 1 saat sayilir', html.includes('her ders 1 saat sayılır'));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
