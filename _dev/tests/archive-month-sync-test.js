// v.24 PASIF UYE: Pasif Uyeler sekmesi acilinca ay = calisilan ay (member-month) -> pasife alinan uye gorunur
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
}});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
setTimeout(function(){try{
  w.eval("['renderDashboard','renderGroups','renderCalendar','renderInstructors','renderSalaries','renderPayments','renderReports','renderSettings'].forEach(fn=>window[fn]=function(){});");

  console.log('[1] switchPage(archive) arsiv ayini calisilan aya (member-month) esitler');
  w.eval("var sel=document.getElementById('member-month'); sel.innerHTML='<option value=\"2026-06\">H</option><option value=\"2026-07\" selected>T</option>'; sel.value='2026-07'; var am=document.getElementById('archive-month'); if(am) am.value='2026-05';");
  w.eval("switchPage('archive');");
  t("arsiv-ay member-month'a (2026-07) esitlendi", d.getElementById('archive-month').value==='2026-07', d.getElementById('archive-month').value);

  console.log('[2] Calisilan ayda pasife alinan uye, Pasif sekmesi acilinca gorunur');
  w.eval("state.members=[{id:'M1',name:'AYSE',joinDate:'2026-05-01',totalPrice:7000,monthly:{}},{id:'M2',name:'BANU',joinDate:'2026-05-01',totalPrice:7000,monthly:{}}]; state.groups=[]; state.lessons=[]; state.payments=[]; state.packageTypes=[{id:'p',name:'x',price:7000,sessions:8}];");
  w.eval("document.getElementById('member-month').value='2026-07'; window.confirm=()=>true; currentMemberDetailId='M1'; deleteMember('M1');");
  t("M1 Temmuz'da pasif (enrolled:false)", w.eval("state.members.find(m=>m.id==='M1').monthly['2026-07'].enrolled")===false);
  w.eval("switchPage('archive');"); // Kerem Pasif Uyeler sekmesine gecer
  t("arsiv Temmuz'a esitlendi", d.getElementById('archive-month').value==='2026-07');
  t("AYSE Pasif listesinde GORUNUR", /AYSE/.test(d.getElementById('archive-tbody').innerHTML));
  t("BANU (aktif) Pasif listesinde YOK", !/BANU/.test(d.getElementById('archive-tbody').innerHTML));

  console.log('[3] Reaktivasyon: arsivden geri al -> aktif olur, pasif listeden cikar');
  w.eval("reactivateMemberForMonth('M1','2026-07');");
  t("M1 Temmuz tekrar aktif", w.eval("isMemberEnrolledInMonth('M1','2026-07')")===true);
  w.eval("switchPage('archive');");
  t("AYSE artik pasif listesinde YOK", !/AYSE/.test(d.getElementById('archive-tbody').innerHTML));

  console.log("\n=== archive-month-sync: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},800);
