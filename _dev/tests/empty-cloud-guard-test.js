// v65 — ACIL VERI KAYBI KORUMASI: bulut BOS dondugunde cihazdaki veri EZILMEZ ('once gorunup sonra sifirlaniyor')
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
setTimeout(async ()=>{ try {
  w.eval('window.S=()=>state;');
  // Dis dunyayi mockla (guard yolunda cagirilanlar crash etmesin)
  w.eval(`
    window.save=function(){}; window.__refreshUIInPlace=function(){}; window.sbSubscribeAll=function(){};
    window.setCloudDot=function(){}; window.plToast=function(){}; window.__trace=function(){};
    window.__sbHarvestVer=function(){}; window.sbSnapshotShadow=function(){};
    window.__sbFreshenFromJsonbin=async function(){}; // JSONBin yok
    window.__sbRole='owner';
    window.isDirty=function(){return false;};
  `);
  const seedData = ()=> w.eval(`
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}},
                   {id:'m2',name:'BURAK',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}];
    state.groups=[{id:'g1',name:'G',size:2,memberIds:['m1','m2'],monthlyMembers:{},packages:[]}];
    state.payments=[{id:'p1',memberId:'m1',date:'2026-07-01',amount:4500,method:'cash'}];
    state.lessons=[];
  `);
  const mockSb = (rowsByTable)=> w.eval(
    "window.__ROWS="+JSON.stringify(rowsByTable)+";"+
    "window.sbClient={ from:function(tbl){ return {"+
    "  select:function(){ return { order:async function(){ return { data:(window.__ROWS[tbl]||[]), error:null }; } }; },"+
    "  upsert:async function(){ return { error:null }; }"+
    "}; } };"
  );

  console.log('[1] KOK BUG SENARYOSU: bulut BOS + cihazda veri VAR + "tasi?" reddedildi -> VERI KORUNUR (EZILMEZ)');
  seedData();
  mockSb({}); // tum tablolar bos -> total=0
  w.eval("window.plConfirm=async function(){return false;};"); // kullanici 'tasi'yi reddetti (veya kapatti)
  await w.sbLoadAll();
  t('state.members KORUNDU (2 kisi) — SIFIRLANMADI', w.S().members.length===2, w.S().members.length);
  t('state.groups KORUNDU', w.S().groups.length===1, w.S().groups.length);
  t('state.payments KORUNDU', w.S().payments.length===1, w.S().payments.length);

  console.log('[2] "tasi?" ONAYLANIRSA yerelden buluta tasinir (kurtarma yolu)');
  seedData();
  mockSb({}); // upsert no-op -> gercek sbMigrateLocal zararsiz calisir
  w.eval("window.plConfirm=async function(){return true;};");
  await w.sbLoadAll();
  t('onaylandi: veri yerelde korundu + buluta tasima yolu calisti (ezme yok)', w.S().members.length===2, w.S().members.length);

  console.log('[3] GUVENLI: bulut BOS + cihaz da BOS -> guard tetiklenmez, crash yok');
  w.eval("state.members=[];state.groups=[];state.payments=[];state.lessons=[]; window.plConfirm=async function(){return false;};");
  mockSb({});
  await w.sbLoadAll();
  t('bos+bos: state bos kalir, hata yok', w.S().members.length===0);

  console.log('[4] REGRESYON: guard YALNIZ total===0 tetiklenir — bulut DOLUYKEN erken-return YOK');
  // guard tetiklenince ozel toast atar; onu casusla
  seedData();
  w.eval("window.__guardFired=false; window.plToast=function(m){ if(/Bulut boş görünüyor/.test(m||'')) window.__guardFired=true; };");
  mockSb({ members:[{id:'mX',data:{id:'mX',name:'CLOUD UYE',joinDate:'2026-01-01',packages:[],monthly:{}}}], member_finance:[{id:'mX',data:{}}] }); // total>0
  w.eval("window.plConfirm=async function(){return false;};");
  await w.sbLoadAll();
  t('bulut DOLU: boş-bulut guard TETIKLENMEDI (total>0 yolu degismez; regresyon)', w.__guardFired===false);
  // (Karsit kanit — guard BOS bulutta veriyi korur — zaten [1][2] ile kanitli.)

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
