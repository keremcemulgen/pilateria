// v.25 CARRY-FORWARD PASIF: pasife alinca geri alinana kadar sonraki aylarda da pasif (birikim); istenen ayda aktive
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
function archHas(ay,name){ w.eval("var am=document.getElementById('archive-month'); am.value='"+ay+"'; renderArchive();"); return new RegExp(name).test(d.getElementById('archive-tbody').innerHTML); }
setTimeout(function(){try{
  w.eval("['renderDashboard','renderGroups','renderCalendar','renderMembers','renderInstructors','renderSalaries','renderPayments','renderReports','renderSettings','closeFillSlotModal','closeMonthAddPicker'].forEach(fn=>window[fn]=function(){}); window.syncGroupLessonsToRoster=function(){return {over:[],updated:0};}; window.removeMemberFromOtherContexts=function(){return [];}; window.confirm=()=>true;");

  console.log('[1] Carry-forward: Haziran pasife al -> Haz/Tem/Agu pasif, Mayis korunur');
  w.eval("state.members=[{id:'M1',name:'BANU',joinDate:'2026-04-01',totalPrice:7000,monthly:{}}]; state.groups=[]; state.lessons=[]; state.payments=[]; state.packageTypes=[{id:'p',name:'x',price:7000,sessions:8}]; var s=document.getElementById('member-month'); s.innerHTML='<option value=\"2026-06\" selected>H</option>'; s.value='2026-06'; removeMemberFromMonth('M1','2026-06');");
  t("acik donem {from:2026-06,to:null}", w.eval("JSON.stringify(state.members[0].archivePeriods)")==='[{"from":"2026-06","to":null}]', w.eval("JSON.stringify(state.members[0].archivePeriods)"));
  t("Haziran pasif", w.eval("!isMemberEnrolledInMonth('M1','2026-06')"));
  t("Temmuz pasif (carry-forward)", w.eval("!isMemberEnrolledInMonth('M1','2026-07')"));
  t("Agustos pasif (carry-forward)", w.eval("!isMemberEnrolledInMonth('M1','2026-08')"));
  t("Mayis AKTIF (gecmis korunur)", w.eval("isMemberEnrolledInMonth('M1','2026-05')"));

  console.log('[2] Birikim: Haz/Tem/Agu arsivinde gorunur, Mayis degil');
  t("Haziran arsivinde", archHas('2026-06','BANU'));
  t("Temmuz arsivinde (BIRIKIM)", archHas('2026-07','BANU'));
  t("Agustos arsivinde (BIRIKIM)", archHas('2026-08','BANU'));
  t("Mayis arsivinde YOK", !archHas('2026-05','BANU'));
  t("badge 'Haziran ... beri pasif'", /Haziran[\s\S]*?beri pasif/.test((w.eval("var am=document.getElementById('archive-month'); am.value='2026-07'; renderArchive(); document.getElementById('archive-tbody').innerHTML"))));

  console.log('[3] Temmuzda AKTIVE -> Haziran pasif KALIR, Temmuz aktif (Kerem: Haziran pasifi Temmuzda aktif)');
  w.eval("reactivateMemberForMonth('M1','2026-07');");
  t("donem Haziran'da kapandi {to:2026-07}", w.eval("JSON.stringify(state.members[0].archivePeriods)")==='[{"from":"2026-06","to":"2026-07","reason":""}]', w.eval("JSON.stringify(state.members[0].archivePeriods)"));
  t("Haziran hala pasif", w.eval("!isMemberEnrolledInMonth('M1','2026-06')"));
  t("Temmuz AKTIF", w.eval("isMemberEnrolledInMonth('M1','2026-07')"));
  t("Haziran arsivinde hala var", archHas('2026-06','BANU'));
  t("Temmuz arsivinde YOK (aktif)", !archHas('2026-07','BANU'));

  console.log('[4] __closeArchivePeriodAt: month\'ta kapatir, baslangicta drop, gecmisi korur');
  w.eval("var m={archivePeriods:[{from:'2026-06',to:null}]}; __closeArchivePeriodAt(m,'2026-07'); window.__m4=m;");
  t("acik donem Temmuz'da kapandi (to=2026-07)", w.eval("JSON.stringify(window.__m4.archivePeriods)")==='[{"from":"2026-06","to":"2026-07","reason":""}]', w.eval("JSON.stringify(window.__m4.archivePeriods)"));
  w.eval("var m={archivePeriods:[{from:'2026-06',to:null}]}; __closeArchivePeriodAt(m,'2026-06'); window.__m4b=m;");
  t("donem baslangicinda aktive -> donem tamamen kalkar", w.eval("window.__m4b.archivePeriods.length")===0);
  w.eval("var m={archivePeriods:[{from:'2026-03',to:'2026-04'}]}; __closeArchivePeriodAt(m,'2026-07'); window.__m4c=m;");
  t("gecmiste kapali donem (2026-03..04) korunur", w.eval("JSON.stringify(window.__m4c.archivePeriods)")==='[{"from":"2026-03","to":"2026-04"}]');

  console.log('[5] Entegrasyon: reaktivasyon/slot/aya-ekleme yollari donemi kapatir (kod)');
  t("reactivateMemberForMonth __closeArchivePeriodAt cagirir", /function reactivateMemberForMonth[\s\S]*?__closeArchivePeriodAt\(m, month\)/.test(html));
  t("assignMemberToSlot __closeArchivePeriodAt cagirir", /setMemberMonthly\(memberId, __ctxAy, \{ enrolled: true \}\)[\s\S]*?__closeArchivePeriodAt\(__rm, __ctxAy\)/.test(html));
  t("addMemberToMonth __closeArchivePeriodAt cagirir", /function addMemberToMonth[\s\S]*?__closeArchivePeriodAt\(__rm, monthISO\)/.test(html));

  console.log("\n=== passive-carryforward: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},800);
