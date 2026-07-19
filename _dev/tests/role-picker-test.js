// v.21 GIRIS ROL SECICI: Yonetici/Personel on ekrani + secim yonlendirme (+ v.23 oturum kalici degil)
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
  console.log('[1] Rol secici ekrani DOM da');
  t("sb-role-box mevcut", !!d.getElementById('sb-role-box'));
  t("Yonetici butonu sbPickRole yonetici", /sbPickRole\('yonetici'\)/.test(d.getElementById('sb-role-box').innerHTML));
  t("Personel butonu sbPickRole personel", /sbPickRole\('personel'\)/.test(d.getElementById('sb-role-box').innerHTML));
  t("login kutusunda Geri role doner", /sbShowAuth\('role'\)/.test(d.getElementById('sb-login-box').innerHTML));
  t("login baslik id (sb-login-heading)", !!d.getElementById('sb-login-heading'));

  console.log('[2] sbShowAuth role -> rol kutusu gorunur, digerleri gizli');
  w.eval("sbShowAuth('role');");
  t("role kutusu block", d.getElementById('sb-role-box').style.display==='block', d.getElementById('sb-role-box').style.display);
  t("login kutusu none", d.getElementById('sb-login-box').style.display==='none');
  t("setpass kutusu none", d.getElementById('sb-setpass-box').style.display==='none');
  t("overlay flex", d.getElementById('sb-auth-overlay').style.display==='flex');

  console.log('[3] sbPickRole -> login + role-ozel baslik + intent');
  w.eval("sbPickRole('personel');");
  t("personel -> login gorunur", d.getElementById('sb-login-box').style.display==='block');
  t("personel -> role gizli", d.getElementById('sb-role-box').style.display==='none');
  t("baslik personel", /Personel giri/i.test(d.getElementById('sb-login-heading').textContent), d.getElementById('sb-login-heading').textContent);
  t("intent personel", w.eval("__sbLoginIntent")==='personel', w.eval("__sbLoginIntent"));
  w.eval("sbPickRole('yonetici');");
  t("baslik yonetici", /netici giri/i.test(d.getElementById('sb-login-heading').textContent), d.getElementById('sb-login-heading').textContent);
  t("intent yonetici", w.eval("__sbLoginIntent")==='yonetici');

  console.log('[4] Geri login -> role');
  w.eval("sbShowAuth('role');");
  t("geri -> role block", d.getElementById('sb-role-box').style.display==='block');
  t("geri -> login none", d.getElementById('sb-login-box').style.display==='none');

  console.log('[5] Kod duzeyi: girissiz/cikis rol secici + oturum kalici degil');
  t("sbAuthGate girissiz -> role", /if \(!__sbSession\) \{ sbShowAuth\('role'\); return; \}/.test(html));
  t("SIGNED_OUT -> role", /SIGNED_OUT'\) \{ __sbRole = null; sbShowAuth\('role'\); \}/.test(html));
  t("oturum kalici DEGIL (persistSession false)", /persistSession: false/.test(html));

  console.log("\n=== role-picker: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
} catch(e){ console.error('HATA', e); process.exit(1); } }, 800);
