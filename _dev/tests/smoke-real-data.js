// Gercek bulut verisiyle: tum render'lar hatasiz + sayfa tutarliliklari
// Kullanim: once /tmp/piltest/state.json'a JSONBin verisini koy (HANDOFF deploy bolumune bak)
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const cloudState = fs.readFileSync(process.env.PIL_STATE || '/tmp/piltest/state.json', 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ Object.defineProperty(w,'innerWidth',{value:390,configurable:true});
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{};
    w.localStorage.setItem('pilateria', cloudState); }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  const st = w.S();
  console.log('veri:', st.members.length, 'uye |', st.groups.length, 'grup |', st.payments.length, 'odeme |', st.lessons.length, 'ders');
  ['renderDashboard','renderMembers','renderGroups','renderCalendar','renderPayments','renderReports','renderInstructors','renderSalaries','renderArchive','renderSettings'].forEach(fn=>{
    try { w[fn](); t(fn+' hatasiz', true); } catch(e){ t(fn+' hatasiz', false, e.message); }
  });
  // Panel geliri == bagimsiz packageMonth hesabi (v39: panel ayini acikca sec — smart-default ezmesin)
  const cm = w.currentMonth();
  w.eval("window.__dashMonthUserSet=true; var _d=document.getElementById('dash-month'); if(_d) _d.value=currentMonth();"); w.renderDashboard();
  const exp = st.payments.filter(p=>(p.packageMonth||(p.date?String(p.date).slice(0,7):''))===cm).reduce((a,b)=>a+(+b.amount||0),0);
  t('Panel geliri = paket ayi toplami', d.getElementById('s-revenue').textContent.replace(/[^0-9]/g,'') === String(Math.round(exp)), d.getElementById('s-revenue').textContent);
  // Aktif uye sayaci
  t('Panel aktif uye = filtreli sayim', +d.getElementById('s-members').textContent === st.members.filter(m=>!m.archived).length);
  // Hocalar vs Maaslar tutarliligi (her hoca, bu ay)
  let ok = true, detail='';
  for (const inst of st.instructors) {
    const b = w.instructorEarningsByGroupSize(inst.id, cm);
    const bt = b[1]+b[2]+b[3]+b[4]+b[5];
    const sal = w.instructorEarningsForMonth(inst.id, cm).total;
    if (Math.abs(bt - sal) > 0.01) { ok = false; detail = inst.name+': '+bt+' vs '+sal; break; }
  }
  t('TUM hocalarda Hocalar==Maaslar', ok, detail);
  // Mobil kartlar
  t('mobil uye kartlari uretildi', d.querySelectorAll('#members-cards .mc-card').length > 0);
  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
