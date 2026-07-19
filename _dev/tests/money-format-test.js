// v62 — PARA GOSTERIMI KURUS HASSASIYETI: money() tek kaynak; 2 haneye kadar TR format
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
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  console.log('[1] money() birim: kurus hassasiyeti');
  t("1062.5 -> '1.062,50' (eski: 1.063)", w.money(1062.5)==='1.062,50', w.money(1062.5));
  t("318.75 -> '318,75' (eski: 319)", w.money(318.75)==='318,75', w.money(318.75));
  t("4500 -> '4.500' (kurus yoksa sade)", w.money(4500)==='4.500', w.money(4500));
  t("2815.5 -> '2.815,50'", w.money(2815.5)==='2.815,50', w.money(2815.5));
  t("563.1 -> '563,10'", w.money(563.1)==='563,10', w.money(563.1));
  t("float artigi: 0.1+0.2 -> '0,30'", w.money(0.1+0.2)==='0,30', w.money(0.1+0.2));
  t("2250.6*0.3=675.18 -> '675,18'", w.money(2250.6*0.3)==='675,18', w.money(2250.6*0.3));
  t("0 -> '0'", w.money(0)==='0', w.money(0));
  t("negatif: -562.5 -> '-562,50'", w.money(-562.5)==='-562,50', w.money(-562.5));
  t("1062.499 -> '1.062,50' (2 haneye yuvarlar)", w.money(1062.499)==='1.062,50', w.money(1062.499));

  console.log('[2] HOCALAR ders-bazli dokum kurusuyla gosterir (Kerem ekrani: 8500/8=1062,50)');
  w.eval(`
    state.settings.instructorShareRate=30; state.instructors=[{id:'h',name:'DERYA',shareRate:30}];
    state.members=[{id:'m1',name:'DUYGU',joinDate:'2026-01-01',archived:false,totalPrice:8500,packages:[],monthly:{'2026-07':{enrolled:true}}}];
    state.groups=[];
    state.lessons=[{id:'L1',date:'2026-07-01',time:'17:00',status:'completed',instructorId:'h',groupId:'',
      memberIds:['m1'],packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'m1',size:1}];
    state.payments=[];
  `);
  const per = w.perLessonPriceForLesson(w.S().lessons[0]);
  t('hesap zaten hassas: 8500/8=1062.5', per===1062.5, per);
  t('gosterim: money(per) = 1.062,50', w.money(per)==='1.062,50', w.money(per));
  t('hakedis: money(1062.5*0.3) = 318,75', w.money(w.instructorEarningForLesson(w.S().lessons[0]))==='318,75', w.money(w.instructorEarningForLesson(w.S().lessons[0])));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
