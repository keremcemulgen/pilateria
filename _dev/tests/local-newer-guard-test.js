// v103 — VERI KURTARMA KALKANI: bulut DOLU + cihaz DAHA YENI iken acilis cihazi EZMEZ:
// once tek-slot yedek (pilateria_pre_cloud_backup), yeniyse BIRLESTIRME teklifi (upsert, silme yok).
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
  w.eval(`
    window.save=function(){}; window.__refreshUIInPlace=function(){}; window.sbSubscribeAll=function(){};
    window.setCloudDot=function(){}; window.plToast=function(){}; window.__trace=function(){};
    window.__sbHarvestVer=function(){}; window.sbSnapshotShadow=function(){};
    window.__sbFreshenFromJsonbin=async function(){};
    __sbRole='owner'; window.__sbRole='owner'; // DIKKAT: __sbRole 'let' -> window degil, CIPLAK atama gerekir
    window.isDirty=function(){return false;};
  `);
  // Cihaz (yerel): 2 uye, 2 odeme (biri 21 Temmuz — buluttan YENI), 1 ders
  const seedLocalNewer = ()=> w.eval(`
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}},
                   {id:'m2',name:'BURAK',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}];
    state.groups=[]; state.lessons=[{id:'l1',date:'2026-07-21',time:'10:00',status:'planned',memberIds:['m1']}];
    state.payments=[{id:'p1',memberId:'m1',date:'2026-07-01',amount:4500,method:'cash'},
                    {id:'p2',memberId:'m2',date:'2026-07-21',amount:5000,method:'cash'}];
    localStorage.setItem('pilateria', JSON.stringify({members:state.members,payments:state.payments,lessons:state.lessons,groups:[],settings:{}}));
    localStorage.removeItem('pilateria_pre_cloud_backup');
  `);
  // Bulut: 1 uye, 1 odeme (15 Temmuz) -> cihazdan ESKI ama DOLU (total>0)
  const CLOUD = {
    members:[{id:'m1',data:{id:'m1',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{}}}],
    member_finance:[{id:'m1',data:{packages:[],monthly:{}}}],
    payments:[{id:'p1',data:{id:'p1',memberId:'m1',date:'2026-07-15',amount:4500,method:'cash'}}]
  };
  const mockSb = (rowsByTable)=> w.eval(
    "window.__UPSERTS=0; window.__ROWS="+JSON.stringify(rowsByTable)+";"+
    "sbClient = window.sbClient={ from:function(tbl){ return {"+  // sbClient 'let' -> CIPLAK atama sart
    "  select:function(){ return { order:async function(){ return { data:(window.__ROWS[tbl]||[]), error:null }; } }; },"+
    "  upsert:async function(part){ window.__UPSERTS+=(part&&part.length)||0; return { error:null }; }"+
    "}; } };"
  );

  console.log('[1] CIHAZ YENI + RED: soru soruldu, bulut yuklendi AMA cihaz hali pre_cloud_backup yedegine alindi');
  seedLocalNewer(); mockSb(CLOUD);
  w.eval("window.__asked=false; window.plConfirm=async function(msg){ window.__asked=/DAHA YENİ/.test(msg||''); return false; };");
  await w.sbLoadAll();
  t('birlestirme SORULDU (cihaz yeni algilandi)', w.__asked===true);
  t('red -> bulut hali yuklendi (1 odeme)', w.S().payments.length===1, w.S().payments.length);
  const bk = w.localStorage.getItem('pilateria_pre_cloud_backup');
  t('pre_cloud_backup YAZILDI', !!bk);
  if (bk) { const b=JSON.parse(bk); const st=JSON.parse(b.state);
    t('yedek icinde 2 odeme + 21 Temmuz kaydi DURUYOR', st.payments.length===2 && st.payments.some(p=>p.date==='2026-07-21'), JSON.stringify(st.payments.map(p=>p.date))); }

  console.log('[2] CIHAZ YENI + EVET: BIRLESTIRILDI (upsert calisti, cihaz verisi KORUNDU, silme yok)');
  seedLocalNewer(); mockSb(CLOUD);
  w.eval("window.plConfirm=async function(){return true;};");
  await w.sbLoadAll();
  t('cihaz verisi korundu (2 odeme)', w.S().payments.length===2, w.S().payments.length);
  t('buluta upsert YAPILDI (birlestirme)', w.eval('window.__UPSERTS')>0, w.eval('window.__UPSERTS'));

  console.log('[3] CIHAZ YENI DEGIL (esit/eski): soru SORULMAZ, normal yukleme (regresyon)');
  w.eval(`
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}];
    state.groups=[]; state.lessons=[];
    state.payments=[{id:'p1',memberId:'m1',date:'2026-07-15',amount:4500,method:'cash'}];
    localStorage.setItem('pilateria', JSON.stringify({members:state.members,payments:state.payments,lessons:[],groups:[],settings:{}}));
  `);
  mockSb(CLOUD);
  w.eval("window.__asked=false; window.plConfirm=async function(){ window.__asked=true; return false; };");
  await w.sbLoadAll();
  t('esit veri: birlestirme SORULMADI', w.__asked===false);
  t('normal yukleme calisti (1 odeme)', w.S().payments.length===1, w.S().payments.length);

  console.log('[4] REGRESYON: bulut BOS + cihazda veri VAR -> v65 guard hala calisiyor (veri korunur)');
  seedLocalNewer(); mockSb({});
  w.eval("window.plConfirm=async function(){return false;};");
  await w.sbLoadAll();
  t('v65: bos bulut cihazi EZMEDI (2 uye durdu)', w.S().members.length===2, w.S().members.length);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
