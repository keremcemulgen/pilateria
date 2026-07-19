// v.22 PERSONEL İZİNLERİ: hazır bölüm anahtarları (owner tek tıkla aç/kapat, personel görünürlüğü)
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
  console.log('[1] İzin kartı DOM + bölüm listesi');
  t("staff-perms-card mevcut", !!d.getElementById('staff-perms-card'));
  t("staff-perms-card varsayılan gizli", d.getElementById('staff-perms-card').style.display==='none');
  t("STAFF_SECTIONS 7 bölüm", w.eval("STAFF_SECTIONS.length")===7, w.eval("STAFF_SECTIONS.length"));
  t("bölümler = dashboard..reports", w.eval("STAFF_SECTIONS.map(s=>s.key).join(',')")==='dashboard,calendar,members,archive,instructors,payments,reports', w.eval("STAFF_SECTIONS.map(s=>s.key).join(',')"));

  console.log('[2] Varsayılan izinler: operasyon açık, para kapalı');
  w.eval("state.settings=state.settings||{}; delete state.settings.staffPerms;");
  t("dashboard varsayılan açık", w.eval("getStaffPerms().dashboard")===true);
  t("members varsayılan açık", w.eval("getStaffPerms().members")===true);
  t("archive varsayılan açık", w.eval("getStaffPerms().archive")===true);
  t("payments varsayılan KAPALI", w.eval("getStaffPerms().payments")===false);
  t("reports varsayılan KAPALI", w.eval("getStaffPerms().reports")===false);
  t("instructors(maaş) varsayılan KAPALI", w.eval("getStaffPerms().instructors")===false);

  console.log('[3] toggleStaffPerm: tek tık aç/kapat + state.settings.staffPerms\'e yazar');
  w.eval("__pilSuppressDirty=true;"); // save() sync tetiklemesin
  w.eval("toggleStaffPerm('payments');");
  t("payments açıldı (true)", w.eval("state.settings.staffPerms.payments")===true, w.eval("state.settings.staffPerms.payments"));
  t("getStaffPerms.payments = true", w.eval("getStaffPerms().payments")===true);
  w.eval("toggleStaffPerm('payments');");
  t("payments tekrar kapandı (false)", w.eval("state.settings.staffPerms.payments")===false);
  w.eval("toggleStaffPerm('members');");
  t("members kapatılabilir (false)", w.eval("getStaffPerms().members")===false);

  console.log('[4] renderStaffPerms: her bölüm için aç/kapat butonu üretir');
  w.eval("delete state.settings.staffPerms; renderStaffPerms();");
  var lb=d.getElementById('staff-perms-list').innerHTML;
  t("7 toggle butonu üretildi", (lb.match(/toggleStaffPerm\(/g)||[]).length===7, (lb.match(/toggleStaffPerm\(/g)||[]).length);
  t("payments satırı 'Kapalı' (varsayılan)", /💳 Ödemeler[\s\S]*?Kapalı/.test(lb));
  t("dashboard satırı '✓ Açık' (varsayılan)", /📊 Panel[\s\S]*?✓ Açık/.test(lb));
  t("para bölümleri (para) etiketli", /\(para\)/.test(lb));

  console.log('[5] Kod düzeyi: sbApplyRoleUI veri-güdümlü + owner kartı gösterimi');
  t("sbApplyRoleUI getStaffPerms kullanır", /function sbApplyRoleUI[\s\S]*?getStaffPerms\(\)/.test(html));
  t("gizli sayfadaysa görünür sayfaya geçer (switchPage)", /perms\[ap\] === false[\s\S]*?switchPage\(first\.key\)/.test(html));
  t("sbAfterLogin owner'a staff-perms-card gösterir", /staff-perms-card'\)[\s\S]*?__sbRole === 'owner'/.test(html));
  t("izinler settings'e (personel okuyabilir) yazılır", /state\.settings\.staffPerms/.test(html));

  console.log("\n=== staff-perms: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
} catch(e){ console.error('HATA', e); process.exit(1); } }, 800);
