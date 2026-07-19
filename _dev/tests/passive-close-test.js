// v.22 "Pasife Al" → üye detay modalı KAPANIR (onaylanınca); iptal edilirse AÇIK kalır.
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
    w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }

setTimeout(function(){ try {
  // kurulum
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar'].forEach(function(fn){window[fn]=function(){};});");
  w.eval("window.__groupOpsCtxMonth=function(){return '2026-06';};");
  w.eval("state.members=[{id:'M1',name:'AYSE',joinDate:'2026-05-01',totalPrice:4000,monthly:{'2026-06':{enrolled:true}}}];");
  w.eval("state.groups=[]; state.lessons=[]; state.payments=[];");

  console.log('[1] Onaylanınca (confirm=true): pasif olur + modal KAPANIR');
  w.eval("var el=document.getElementById('modal-member-detail'); el.classList.add('open'); currentMemberDetailId='M1'; document.body.classList.add('pl-modal-open');");
  t("başlangıçta modal açık", d.getElementById('modal-member-detail').classList.contains('open'));
  w.eval("__pilSuppressDirty=true; window.confirm=function(){return true;}; deleteMember('M1');");
  t("üye 2026-06'da pasif (enrolled:false)", w.eval("state.members[0].monthly['2026-06'].enrolled")===false, w.eval("state.members[0].monthly['2026-06'].enrolled"));
  t("modal KAPANDI (open sınıfı yok)", !d.getElementById('modal-member-detail').classList.contains('open'));
  t("currentMemberDetailId sıfırlandı (null)", w.eval("currentMemberDetailId===null"));

  console.log('[2] İptal edilince (confirm=false): modal AÇIK kalır, pasif OLMAZ');
  w.eval("state.members[0].monthly={'2026-06':{enrolled:true}}; var el=document.getElementById('modal-member-detail'); el.classList.add('open'); currentMemberDetailId='M1';");
  w.eval("window.confirm=function(){return false;}; deleteMember('M1');");
  t("iptal → üye hâlâ aktif (enrolled:true)", w.eval("state.members[0].monthly['2026-06'].enrolled")===true, w.eval("state.members[0].monthly['2026-06'].enrolled"));
  t("iptal → modal AÇIK kaldı", d.getElementById('modal-member-detail').classList.contains('open'));
  t("iptal → currentMemberDetailId korunur (M1)", w.eval("currentMemberDetailId==='M1'"));

  console.log('[3] removeMemberFromMonth artık başarı döndürür');
  t("tamamlanınca true", w.eval("window.confirm=function(){return true;}; state.members[0].monthly={'2026-06':{enrolled:true}}; removeMemberFromMonth('M1','2026-06')")===true);
  t("iptalde false", w.eval("window.confirm=function(){return false;}; removeMemberFromMonth('M1','2026-06')")===false);
  t("ay yoksa false", w.eval("removeMemberFromMonth('M1','')")===false);

  console.log("\n=== passive-close: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
} catch(e){ console.error('HATA', e); process.exit(1); } }, 800);
