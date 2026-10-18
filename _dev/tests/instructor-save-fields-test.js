// v198 — HOCA KAYDI DÜZENLEME ALAN KAYBI (18.10 canlı gözlem: ESR*** kaydında v138 `sgkTam` alanı var; "Hocayı Düzenle"
// penceresi kaydı {id,name,phone,note,shareRate(,partner)} ile BAŞTAN kuruyordu → sgkTam (ay bazlı tam sigorta işaretleri) ve
// modal'ın bilmediği her alan SİLİNİRDİ). Kural: düzenlemede mevcut kayıt korunur, yalnız formdaki alanlar güncellenir;
// "Ortak" kutusu kaldırılınca partner alanı da kalkar. Yamasız yapıda [1] BAŞARISIZ olmalı.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
const w=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
}}).window;
const tick=ms=>new Promise(r=>setTimeout(r,ms||80));
setTimeout(async function(){try{
  await tick(1200);
  w.eval("state.instructors=[{id:'I1',name:'ESRA K.',phone:'',note:'',sgkTam:{'2026-09':true,'2026-10':true},shareRate:35,partner:true,colorX:'#abc'}]; state.lessons=[]; state.instructorPayouts=[];");
  console.log('[1] Düzenle → kaydet: bilinmeyen alanlar (sgkTam, colorX) KORUNUR, form alanları güncellenir');
  w.eval("openInstructorModal('I1')"); await tick(50);
  t('form: ad, oran, ortak kutusu dolu', w.document.getElementById('mi-name').value==='ESRA K.' && w.document.getElementById('mi-share-rate').value==='35' && w.document.getElementById('mi-partner').checked===true);
  w.document.getElementById('mi-name').value='ESRA KARA'; w.document.getElementById('mi-note').value='not';
  w.eval('saveInstructor()'); await tick(50);
  const i=JSON.parse(w.eval("JSON.stringify(state.instructors[0])"));
  t('ad/not güncellendi', i.name==='ESRA KARA' && i.note==='not', JSON.stringify(i));
  t('sgkTam KORUNDU (2 ay)', i.sgkTam && i.sgkTam['2026-09']===true && i.sgkTam['2026-10']===true, JSON.stringify(i.sgkTam));
  t('colorX (bilinmeyen alan) KORUNDU', i.colorX==='#abc');
  t('shareRate 35, partner true korundu', i.shareRate===35 && i.partner===true);
  t('kayıt sayısı 1 (kopya yok)', w.eval('state.instructors.length')===1);
  console.log('[2] Ortak kutusu kaldırılınca partner alanı KALKAR; oran boşalınca null');
  w.eval("openInstructorModal('I1')"); await tick(50);
  w.document.getElementById('mi-partner').checked=false; w.document.getElementById('mi-share-rate').value='';
  w.eval('saveInstructor()'); await tick(50);
  const j=JSON.parse(w.eval("JSON.stringify(state.instructors[0])"));
  t('partner alanı yok', !('partner' in j) || j.partner===false, JSON.stringify(j));
  t('shareRate null (varsayılana döner), sgkTam hâlâ duruyor', j.shareRate===null && j.sgkTam && j.sgkTam['2026-10']===true, JSON.stringify(j));
  console.log('[3] Yeni hoca: normal ekleme');
  w.eval("openInstructorModal('')"); await tick(50);
  w.document.getElementById('mi-name').value='YENİ HOCA'; w.document.getElementById('mi-share-rate').value='40'; w.document.getElementById('mi-partner').checked=false;
  w.eval('saveInstructor()'); await tick(50);
  const n=JSON.parse(w.eval("JSON.stringify(state.instructors[1]||null)"));
  t('yeni hoca eklendi (ad, oran 40, partner yok)', n && n.name==='YENİ HOCA' && n.shareRate===40 && !n.partner && n.id, JSON.stringify(n));
  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST HATASI',e&&e.stack||e);process.exit(1);}},900);
