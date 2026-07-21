// v.30 PERSONEL: Ayarlar'da yalniz Oturum, odeme/paket tahsilati YOK, bulut/senkron yoneticiye ozel
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
  w.eval("['renderDashboard','renderMembers','renderGroups','switchPage','plToast'].forEach(fn=>window[fn]=function(){}); state.settings=state.settings||{};");
  console.log('SUPABASE_MODE:',w.eval("SUPABASE_MODE"));

  console.log('[1] Personel: Ayarlar YALNIZ Oturum karti + body pl-staff-view + vadesi gecen gizli');
  w.eval("__sbRole='staff'; var sc=document.getElementById('sb-session-card'); sc.style.display=''; sbApplyRoleUI();");
  t("body.pl-staff-view eklendi", d.body.classList.contains('pl-staff-view'));
  t("sb-session-card GORUNUR kalir", d.getElementById('sb-session-card').style.display!=='none', d.getElementById('sb-session-card').style.display);
  var hiddenOthers=w.eval("Array.from(document.querySelectorAll('#page-settings > .card')).filter(c=>c.id!=='sb-session-card').every(c=>c.style.display==='none')");
  t("diger TUM Ayarlar kartlari gizli (bulut/senkron/paket-tanimi/PIN/veri)", hiddenOthers);
  t("vadesi gecen (overdue-card) gizli", d.getElementById('overdue-card').style.display==='none');
  // bulut senkron karti gizli mi (baslik ile)
  // v.36: Eski JSONBin "Bulut Senkron" AYAR karti (Master Key / Bin ID giris alanlari) TAMAMEN KALDIRILDI — gizli degil, yok.
  // v105 not: Yedek panelinin BILGI metninde "JSONBin" kelimesi gecebilir (yapilandirma degil); guard gercek amacina daraltildi.
  var cloudGone=w.eval("!Array.from(document.querySelectorAll('#page-settings > .card')).some(c=>/Master Key|Bin ID/.test(c.textContent))");
  t("Eski JSONBin Bulut Senkron AYAR karti KALDIRILDI (Master Key/Bin ID yok)", cloudGone);

  console.log('[2] Personel: openPaymentModal ENGELLI (odeme alamaz)');
  w.eval("document.getElementById('mp-id').value='SENTINEL';");
  w.eval("openPaymentModal('M1');");
  t("openPaymentModal erken donmus (mp-id degismedi)", d.getElementById('mp-id').value==='SENTINEL', d.getElementById('mp-id').value);

  console.log('[3] YONETICI: kisitlama YOK (openPaymentModal calisir)');
  w.eval("__sbRole='owner'; state.members=[{id:'M1',name:'X',monthly:{}}]; state.groups=[]; state.payments=[]; state.packageTypes=[{id:'p',name:'P',price:8000,sessions:8}]; document.getElementById('mp-id').value='SENTINEL2';");
  w.eval("try{ openPaymentModal('M1'); }catch(e){}");
  t("owner: openPaymentModal acilir (mp-id 'SENTINEL2' degil, yeni/bos)", d.getElementById('mp-id').value!=='SENTINEL2');

  console.log('[4] Kod: guard + pl-owner-only + CSS');
  t("openPaymentModal personel guard", /if \(SUPABASE_MODE && __sbRole === 'staff'\) \{ if \(window\.plToast\) plToast\('Ödeme \/ paket/.test(html));
  t("togglePaidTick personel guard", /togglePaidTick[\s\S]*?if \(SUPABASE_MODE && __sbRole === 'staff'\) \{ if \(window\.plToast\) plToast\('Ödeme işlemleri/.test(html));
  t("uye detay + Paket/Ödeme pl-owner-only", /class="btn pl-owner-only" onclick="openPaymentModal\('\$\{id\}'\);"/.test(html));
  t("liste hizli-odeme pl-owner-only (togglePaidTick)", /class="btn small pl-owner-only" onclick="togglePaidTick\(/.test(html));
  t("CSS body.pl-staff-view .pl-owner-only gizler", /body\.pl-staff-view \.pl-owner-only \{ display:none !important; \}/.test(html));
  t("Ayarlar: sadece sb-session-card haric gizle", /#page-settings > \.card'\)\.forEach\(c => \{ if \(c\.id !== 'sb-session-card'\) c\.style\.display = 'none'; \}\)/.test(html));

  console.log("\n=== staff-restrictions: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}catch(e){console.error('HATA',e);process.exit(1);}},700);
