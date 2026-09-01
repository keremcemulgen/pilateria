// v122 KOK: BULUT TAZELEMESI KAYBOLUYOR.
// sbResync ('after-push' her 7 sn, 'nabiz' 5 dk, 'visible', 'online') bulut state'ini
// uygular; ama tazeleme "modal acik / input odakta" ise SESSIZCE DUSURULUYORDU:
//     if (!(__uiBusyForPull && __uiBusyForPull())) __refreshUIInPlace();
// Tekrar denenmedigi ve modal kapaninca flush edilmedigi icin liste DOM'u ESKI kalir:
// uye detayinda 8.500 gorunur, arkadaki Uyeler listesinde 8.000 yazmaya devam eder.
// Cihaz artik bulutla ayni oldugundan yeni realtime olayi da gelmez -> kalicilasir.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
}});
const w=dom.window;
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function ev(s){ try { return w.eval(s); } catch(e){ return '__THROW__: '+e.message; } }
function cardTxt(name){
  const el=w.document.getElementById('members-cards');
  if(!el) return '(members-cards yok)';
  const s=el.textContent.replace(/\s+/g,' ');
  const i=s.indexOf(name);
  return i<0 ? '(kartta YOK)' : s.slice(i, i+110);
}

function finish(){
  console.log("\n=== sync-refresh-lost: "+pass+" OK, "+fail+" FAIL ===");
  process.exit(fail?1:0);
}

function __setMM(ay){ const sel=w.document.getElementById('member-month'); if (sel && sel.tagName==='SELECT' && ![...sel.options].some(o=>o.value===ay)) sel.insertAdjacentHTML('beforeend','<option value="'+ay+'">'+ay+'</option>'); sel.value=ay; } // tarih-saglam (ay donumu)
setTimeout(function(){try{

  // ---------------------------------------------------------------- [1] YAPISAL
  console.log('[1] sbResync tazelemeyi SESSIZCE DUSURMEMELI');
  const drop = /if\s*\(\s*!\s*\(\s*__uiBusyForPull\s*&&\s*__uiBusyForPull\(\)\s*\)\s*\)\s*__refreshUIInPlace\(\);/;
  t("sbResync'te 'mesgulse tazelemeyi at' kalibi YOK", !drop.test(html), drop.test(html)?'kalip hala var':'');
  const sbBody = (html.split('async function sbResync(')[1]||'').split('\n// state → tablo')[0];
  t("sbResync __refreshUIWhenIdle() cagiriyor", /__refreshUIWhenIdle\(\)/.test(sbBody));
  t("__refreshUIWhenIdle tanimli", typeof w.__refreshUIWhenIdle === 'function', typeof w.__refreshUIWhenIdle);
  t("__flushPendingUIRefresh tanimli", typeof w.__flushPendingUIRefresh === 'function', typeof w.__flushPendingUIRefresh);

  // ------------------------------------------------- EKRAN GORUNTUSU SENARYOSU
  // Bireysel uye, 2026-06, GUNCEL BIREYSEL 8x8500. ESKI hal: ay fiyati 8000, odeme 8000.
  ev(`
    state.packageTypes=[{id:'gb',name:'GUNCEL BIREYSEL',price:8500,sessions:8}];
    state.instructors=[{id:'H1',name:'ESRA'}];
    state.groups=[]; state.lessons=[];
    state.members=[{id:'M1',name:'HILAL METE',joinDate:'2026-06-01',instructorId:'H1',
      defaultPackageId:'gb', totalPrice:'',
      monthly:{'2026-06':{totalPrice:8000, packageId:'gb'}},
      packages:[{month:'2026-06',startDate:'2026-06-01',sessions:8,price:8000,status:'active'}]}];
    state.payments=[{id:'P1',memberId:'M1',groupId:'',date:'2026-06-05',amount:8000,listPrice:8000,
      sessions:8,method:'IBAN',packageMonth:'2026-06',packageId:'gb'}];
  `);
  ev("switchPage('members')");
  __setMM('2026-06');
  ev("renderMembers()");
  const before = cardTxt('HILAL METE');
  t("baslangic karti 8.000 gosteriyor", /Ücret 8\.000/.test(before) && /Ödenen 8\.000/.test(before), before);

  // ---------------------------------------------- [2] MODAL ACIKKEN BULUT GELDI
  console.log('\n[2] Modal ACIKKEN bulut verisi geldi -> kullanici RAHATSIZ EDILMEZ (erteleme korunur)');
  ev("openModal('modal-member-detail')");
  t("body.pl-modal-open set", w.document.body.classList.contains('pl-modal-open'));
  // sbResync'in yaptigi: state = __incoming (fiyat+odeme 8500), sonra tazeleme
  ev(`
    state.members[0].monthly['2026-06'].totalPrice=8500;
    state.members[0].packages[0].price=8500;
    state.payments[0].amount=8500; state.payments[0].listPrice=8500;
  `);
  const r1 = ev("__refreshUIWhenIdle()");
  t("__refreshUIWhenIdle() cagrilabiliyor", String(r1).indexOf('__THROW__')<0, r1);
  const during = cardTxt('HILAL METE');
  t("modal acikken liste TAZELENMEDI (yazma bozulmaz)", /Ücret 8\.000/.test(during), during);

  // ------------------------------------------- [3] MODAL KAPANINCA FLUSH EDILIR
  console.log('\n[3] Modal KAPANINCA ertelenen tazeleme UYGULANIR (kok hata buydu)');
  ev("closeModal('modal-member-detail')");
  t("body.pl-modal-open kalkti", !w.document.body.classList.contains('pl-modal-open'));
  const after = cardTxt('HILAL METE');
  t("kart artik 8.500 (ucret)", /Ücret 8\.500/.test(after), after);
  t("kart artik 8.500 (odenen)", /Ödenen 8\.500/.test(after), after);
  t("kart 'Ödendi' durumuna gecti", /Ödendi/.test(after), after);
  const stats = (w.document.getElementById('members-stats')||{}).textContent||'';
  t("ust ozet de tazelendi (Beklenen 8.500)", /8\.500/.test(stats.replace(/\s+/g,' ')), stats.replace(/\s+/g,' ').slice(0,140));

  // ------------------------------ [5] .page.active TEK KAYNAK (groups .tab'i YOK)
  console.log('\n[5] __refreshUIInPlace aktif sayfayi .page.active`ten cozer (groups sayfasinin .tab`i YOK)');
  t("groups icin .tab YOK (hatanin sarti)", w.document.querySelector('.tab[data-page="groups"]')===null);
  ev("switchPage('groups')");
  t("switchPage sonrasi .tab.active null", w.document.querySelector('.tab.active')===null);
  ev("window.__spyG=0; window.__spyD=0; window.__origG=window.renderGroups; window.__origD=window.renderDashboard; window.renderGroups=function(){window.__spyG++; return window.__origG.apply(this,arguments);}; window.renderDashboard=function(){window.__spyD++; return window.__origD.apply(this,arguments);};");
  ev("__refreshUIInPlace()");
  const spyG = ev("window.__spyG"), spyD = ev("window.__spyD");
  ev("window.renderGroups=window.__origG; window.renderDashboard=window.__origD;");
  t("groups sayfasi yerinde tazelendi", spyG>=1, 'renderGroups='+spyG);
  t("dashboard'a DUSMEDI", spyD===0, 'renderDashboard='+spyD);

  // ------------------------- [6] BOS AY: mobil kartlar da temizlenir (bayat kalmaz)
  console.log('\n[6] Kayitsiz ay -> #members-cards da temizlenir (bayat kart kalmaz)');
  ev("switchPage('members')");
  __setMM('2026-06');
  ev("renderMembers()");
  t("once kart dolu", cardTxt('HILAL METE').indexOf('HILAL')===0, cardTxt('HILAL METE'));
  ev("state.members=[]; state.groups=[]; state.payments=[];");
  __setMM('2026-05'); // < ROSTER_START_MONTH -> eski dal
  ev("renderMembers()");
  const cards = (w.document.getElementById('members-cards')||{}).innerHTML||'';
  t("bos ayda bayat kart KALMADI", cards.indexOf('HILAL')<0, cards.replace(/\s+/g,' ').slice(0,120));

  // --------------------- [4] ODAKTAKI INPUT: kendi kendine iyilesen tekrar denemesi
  console.log('\n[4] Modal degil ODAK sebebiyle mesgulse -> zamanlayici kendi kendine iyilestirir');
  ev("state.members=[{id:'M9',name:'ZEYNEP',joinDate:'2026-06-01',defaultPackageId:'gb',totalPrice:'',monthly:{'2026-06':{totalPrice:5000,packageId:'gb'}},packages:[{month:'2026-06',startDate:'2026-06-01',sessions:8,price:5000,status:'active'}]}]; state.payments=[];");
  __setMM('2026-06');
  ev("renderMembers()");
  const q = w.document.getElementById('member-search');
  q.focus();
  t("odak input'ta -> __uiBusyForPull true", ev("__uiBusyForPull()")===true, ev("__uiBusyForPull()"));
  ev("state.members[0].monthly['2026-06'].totalPrice=7777;");
  ev("__refreshUIWhenIdle()");
  t("odaktayken tazelenmedi", /Ücret 5\.000/.test(cardTxt('ZEYNEP')), cardTxt('ZEYNEP'));
  q.blur();
  setTimeout(function(){try{
    const z = cardTxt('ZEYNEP');
    t("odak kalkinca zamanlayici tazeledi (7.777)", /Ücret 7\.777/.test(z), z);
    finish();
  }catch(e){console.error('HATA',e);process.exit(1);}}, 1600);

}catch(e){console.error('HATA',e);process.exit(1);}},700);
