// v104 — SILME SIGORTALARI + GUNLUK YEDEK HALKASI: hicbir yoldan toplu veri kaybi yayilamaz.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,status:0,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{}; }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(async ()=>{ try {
  w.eval('window.S=()=>state;');
  w.eval(`
    window.save=function(){}; window.__refreshUIInPlace=function(){}; window.setCloudDot=function(){};
    window.plToast=function(){}; window.__trace=function(){}; window.__uiBusyForPull=function(){return true;};
    __sbRole='owner'; window.__sbRole='owner';
    window.isDirty=function(){return false;};
  `);
  const mockSb = ()=> w.eval(
    "window.__DELCALLS=0; window.__DELIDS=0; window.__UPSERTS=0;"+
    "sbClient = window.sbClient={ from:function(tbl){ return {"+
    "  select:function(){ return { order:async function(){ return { data:[], error:null }; }, limit:async function(){ return { data: window.__VERIFY_MEMBERS||[], error:null }; } }; },"+
    "  upsert:async function(part){ window.__UPSERTS+=(part&&part.length)||0; return { error:null }; },"+
    "  delete:function(){ return { in: async function(col, ids){ window.__DELCALLS++; window.__DELIDS+=((ids&&ids.length)||0); return { error:null }; } } }"+
    "}; }, channel:function(){ return { on:function(a,b,cb){ window.__rtCb=cb; return this; }, subscribe:function(){ return this; } }; } };"
  );
  const seed=(n)=>w.eval(`
    state.members=Array.from({length:${n}},(_,i)=>({id:'m'+(i+1),name:'U'+(i+1),joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}));
    state.groups=[]; state.lessons=[]; state.payments=[];
  `);

  console.log('[1] PUSH SIGORTASI: state BOSALDI -> silme GONDERILMEZ + ani yedek + bulut korunur');
  mockSb(); seed(20);
  w.eval("sbSnapshotShadow(sbStateToRows());"); // shadow = 20 uye (bulut hali)
  w.eval("localStorage.setItem('pilateria', JSON.stringify({members:state.members,payments:[],lessons:[],groups:[],settings:{}}));");
  w.eval("localStorage.removeItem('pilateria_mass_delete_backup'); window.__pilAllowMassDelete=0;");
  seed(0); // state SIFIRLANDI (bozulma senaryosu)
  await w.sbDiffPush();
  t('hicbir DELETE cagrisi gitmedi', w.__DELCALLS===0, w.__DELCALLS);
  t('ani yedek (mass_delete_backup) yazildi', !!w.localStorage.getItem('pilateria_mass_delete_backup'));

  console.log('[2] PUSH normal: TEK kayit silme SERBEST (sigorta yanlis alarm vermez)');
  mockSb(); seed(20);
  w.eval("sbSnapshotShadow(sbStateToRows());");
  w.eval("state.members = state.members.filter(m=>m.id!=='m1');"); // 1 uye silindi (mesru)
  await w.sbDiffPush();
  t('silme gonderildi (members+member_finance = 2 cagri)', w.__DELCALLS===2, w.__DELCALLS);
  t('silinen id sayisi 2 (ayni uyenin 2 tablosu)', w.__DELIDS===2, w.__DELIDS);

  console.log('[3] REALTIME SIGORTASI (v112): 25 esik — 20 mesru silme SERBEST; 26+ sigorta + OTOTAMIR');
  mockSb(); seed(40);
  w.eval("__sbChannel=null; window.__rtDelTripped=false; window.__rtDelWin=[]; localStorage.removeItem('pilateria_mass_delete_backup');");
  w.eval("window.__rtFuseVerifyMs=50; window.__VERIFY_MEMBERS=[{id:'alive'}]; window.__RESYNCED=0; sbResync = window.sbResync = function(){ window.__RESYNCED++; };");
  w.eval("localStorage.setItem('pilateria', JSON.stringify({members:state.members,payments:[],lessons:[],groups:[],settings:{}}));");
  w.eval("sbSubscribeAll();");
  t('realtime handler yakalandi', typeof w.__rtCb==='function');
  for(let i=1;i<=20;i++){ w.__rtCb({table:'members', eventType:'DELETE', old:{id:'m'+i}, new:null}); }
  t('20 silme SERBEST uygulandi (esik 25, mesru toplu islem)', w.S().members.length===20, w.S().members.length);
  t('sigorta ATMADI (20<25)', w.eval('window.__rtDelTripped')===false);
  for(let i=21;i<=30;i++){ w.__rtCb({table:'members', eventType:'DELETE', old:{id:'m'+i}, new:null}); }
  t('26.dan itibaren BLOKE: 25 uygulandi, 15 uye korundu', w.S().members.length===15, w.S().members.length);
  t('sigorta atti (tripped)', w.eval('window.__rtDelTripped')===true);
  t('ani yedek yazildi', !!w.localStorage.getItem('pilateria_mass_delete_backup'));
  w.__rtCb({table:'members', eventType:'DELETE', old:{id:'m35'}, new:null});
  t('sigorta aktifken silmeler uygulanmiyor', w.S().members.length===15, w.S().members.length);

  console.log('[4] GUNLUK YEDEK HALKASI: gunde 1 kez, en fazla 5 gun, bos hali yazmaz');
  w.eval("for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k&&k.indexOf('pilateria_daily_')===0){localStorage.removeItem(k);i--;}}");
  w.eval("localStorage.setItem('pilateria', JSON.stringify({members:[{id:'m1'}],payments:[],lessons:[],groups:[],settings:{}}));");
  w.eval("localStorage.setItem('pilateria_daily_2026-07-10','x'); localStorage.setItem('pilateria_daily_2026-07-11','x'); localStorage.setItem('pilateria_daily_2026-07-12','x'); localStorage.setItem('pilateria_daily_2026-07-13','x'); localStorage.setItem('pilateria_daily_2026-07-14','x');");
  w.eval("__pilDailySnapshot();");
  const ring = w.eval("(function(){const a=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k&&k.indexOf('pilateria_daily_')===0)a.push(k);}return a.sort();})()");
  t('bugunun yedegi alindi', ring.some(k=>k>'pilateria_daily_2026-07-14'), JSON.stringify(ring));
  t('halka 5 gunu asmadi (en eski silindi)', ring.length<=5 && !ring.includes('pilateria_daily_2026-07-10'), JSON.stringify(ring));
  const before = ring.join(',');
  w.eval("__pilDailySnapshot();"); // ayni gun ikinci cagri -> degisiklik yok
  const after = w.eval("(function(){const a=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k&&k.indexOf('pilateria_daily_')===0)a.push(k);}return a.sort();})()").join(',');
  t('ayni gun tekrar cagri yeni yedek olusturmaz', before===after);
  w.eval("localStorage.setItem('pilateria', JSON.stringify({members:[],payments:[],lessons:[],groups:[],settings:{}}));");
  w.eval("for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k&&k.indexOf('pilateria_daily_')===0){localStorage.removeItem(k);i--;}}");
  w.eval("__pilDailySnapshot();");
  t('BOS hal gunluk yedege YAZILMAZ', w.eval("(function(){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k&&k.indexOf('pilateria_daily_')===0)return false;}return true;})()"));

  console.log('[5] IKINCI BULUT guard: syncCfg yok / rol owner degil -> sessizce atlar (crash yok)');
  await w.eval("(async()=>{ const bak=(typeof syncCfg!=='undefined')?syncCfg:undefined; try{ syncCfg=null; await __pilOffsiteDaily(); }finally{ if(bak!==undefined) syncCfg=bak; } })()");
  t('syncCfg yokken hata firlatmadi', true);

  setTimeout(()=>{ try {
    console.log('[6] OTOTAMIR: bulut saglikli -> sigorta ACILDI + resync cagrildi');
    t('sigorta OTOTAMIRLE acildi (uyeler duruyor)', w.eval('window.__rtDelTripped')===false);
    t('sunucudan tazeleme cagrildi', w.eval('window.__RESYNCED')>0, w.eval('window.__RESYNCED'));

    console.log('[7] GERCEK WIPE: bulut uye tablosu BOS -> sigorta KALICI');
    w.eval("window.__VERIFY_MEMBERS=[]; window.__rtDelWin=[]; window.__rtDelTripped=false;");
    seed(40);
    for(let i=1;i<=26;i++){ w.__rtCb({table:'members', eventType:'DELETE', old:{id:'m'+i}, new:null}); }
    t('wipe: sigorta atti', w.eval('window.__rtDelTripped')===true);
    setTimeout(()=>{ try {
      t('wipe: sigorta KALICI (bulut bos, ototamir ACMADI)', w.eval('window.__rtDelTripped')===true);
      console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
      process.exit(fail?1:0);
    } catch(e){ console.error('TEST COKTU:',e); process.exit(2);} }, 200);
  } catch(e){ console.error('TEST COKTU:',e); process.exit(2);} }, 200);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
