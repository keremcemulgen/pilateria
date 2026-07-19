// v27 — OTOMATIK SENKRON: dirty/push/pull/cakisma/yedek/dot testleri
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.__fetchLog=[];
    w.__fetchRespFor=(url,opts)=>({ok:false,json:()=>Promise.resolve({})});
    w.fetch=(url,opts)=>{ w.__fetchLog.push({url:String(url),method:(opts&&opts.method)||'GET',body:(opts&&opts.body)||null}); return Promise.resolve(w.__fetchRespFor(url,opts)); };
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{};
  }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const LOG=()=>w.__fetchLog;
const puts=()=>LOG().filter(x=>x.method==='PUT');
const gets=()=>LOG().filter(x=>x.method==='GET');

setTimeout(async ()=>{ try {
  console.log('[1] save() dirty isareti');
  w.eval(`localStorage.removeItem('pilateria_dirty'); save();`);
  t('save sonrasi dirty=1', w.localStorage.getItem('pilateria_dirty')==='1');
  w.eval(`window.__pilSuppressDirty=true; localStorage.removeItem('pilateria_dirty'); save(); window.__pilSuppressDirty=false;`);
  t('suppress acikken dirty yazilmaz', w.localStorage.getItem('pilateria_dirty')===null);

  // senkron ayarlarini kur
  w.eval(`syncCfg.enabled=true; syncCfg.key='TESTKEY'; syncCfg.bin='TESTBIN'; syncCfg.baseRev=0; saveSyncCfgRaw(syncCfg);`);

  console.log('[2] autoPush — temiz yol (bulut bos)');
  w.__fetchLog.length=0;
  w.__fetchRespFor=(url,opts)=>{
    if((opts&&opts.method)==='PUT') return {ok:true,json:()=>Promise.resolve({})};
    return {ok:true,json:()=>Promise.resolve({record:{}})};
  };
  w.localStorage.setItem('pilateria_dirty','1');
  await w.autoPush();
  t('1 GET (cakisma kontrolu) + 1 PUT', gets().length===1 && puts().length===1, gets().length+'/'+puts().length);
  const body1 = JSON.parse(puts()[0].body);
  t('PUT _rev=1', body1._rev===1, body1._rev);
  t('dirty temizlendi', w.localStorage.getItem('pilateria_dirty')===null);
  t('baseRev=1', w.eval('Number(syncCfg.baseRev)')===1);

  console.log('[3] CAKISMA: bulutta daha yeni rev → yedek + LWW');
  w.__fetchLog.length=0;
  w.__fetchRespFor=(url,opts)=>{
    if((opts&&opts.method)==='PUT') return {ok:true,json:()=>Promise.resolve({})};
    return {ok:true,json:()=>Promise.resolve({record:{_rev:3,settings:{reformers:5},members:[{id:'mC',name:'CLOUD UYE'}]}})};
  };
  w.localStorage.setItem('pilateria_dirty','1');
  await w.autoPush();
  const bkp = JSON.parse(w.localStorage.getItem('pilateria_conflict_backup')||'null');
  t('cakisma yedegi yazildi (cloudRev=3)', !!bkp && bkp.cloudRev===3);
  t('yedekte bulut uyesi var', !!bkp && (bkp.record.members||[]).some(m=>m.name==='CLOUD UYE'));
  const body2 = JSON.parse(puts()[0].body);
  t('PUT _rev=4 (3+1, LWW)', body2._rev===4, body2._rev);
  t('yerel state ezilmedi (CLOUD UYE yok)', !w.eval(`state.members.some(m=>m.name==='CLOUD UYE')`));

  console.log('[4] autoPull — dirty iken cekmez');
  w.__fetchLog.length=0;
  w.localStorage.setItem('pilateria_dirty','1');
  await w.autoPullIfNeeded('test');
  t('fetch cagrilmadi', LOG().length===0, LOG().length);
  w.eval('clearTimeout(pushTimer)');

  console.log('[5] autoPull — bulut daha yeni ise otomatik ceker');
  w.localStorage.removeItem('pilateria_dirty');
  w.eval(`syncCfg.baseRev=1; saveSyncCfgRaw(syncCfg); lastAutoPullTs=0;`);
  w.__fetchLog.length=0;
  const cloudState = {_rev:5, settings:{reformers:5,open:9,close:21,duration:45,workDays:[1,2,3,4,5,6],kdvRate:20,gvRate:15,instructorShareRate:30,groupPackageDays:30,groupRescheduleLimit:1,groupCancelLimit:1}, members:[{id:'mP',name:'PULLED UYE',joinDate:'2026-07-01',monthly:{},packages:[]}], groups:[], lessons:[], payments:[], instructors:[], packageTypes:[], campaigns:[], waTemplates:[], instructorPayouts:[]};
  w.__fetchRespFor=(url,opts)=>({ok:true,json:()=>Promise.resolve({record:cloudState})});
  await w.autoPullIfNeeded('test2');
  t('bulut uyesi state e geldi', w.eval(`state.members.some(m=>m.name==='PULLED UYE')`));
  t('baseRev=5', w.eval('Number(syncCfg.baseRev)')===5);
  t('pull sonrasi dirty YOK', w.localStorage.getItem('pilateria_dirty')===null);

  console.log('[6] autoPull — bulut guncelse cekmez');
  w.eval('lastAutoPullTs=0;');
  w.__fetchLog.length=0;
  await w.autoPullIfNeeded('test3');
  t('yalniz 1 kontrol GET, pull yok', LOG().length===1, LOG().length);

  console.log('[7] cloud-dot gostergesi');
  w.setCloudDot('pending');
  const dot=d.getElementById('cloud-dot');
  t('dot gorunur + bekliyor', dot && dot.style.display==='inline-block' && dot.textContent.includes('●'));
  w.setCloudDot('ok');
  t('dot esitlendi', dot.textContent.includes('✓'));

  console.log('[8] offline: PUT atilmaz, sonra denenmek uzere bekler');
  Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
  w.__fetchLog.length=0;
  w.localStorage.setItem('pilateria_dirty','1');
  await w.autoPush();
  t('offline iken fetch yok', LOG().length===0, LOG().length);
  t('dot uyari gosterir', dot.textContent.includes('⚠'));
  Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});
  w.eval('clearTimeout(pushTimer)');

  console.log('[9] restoreConflictBackup');
  w.localStorage.setItem('pilateria_conflict_backup', JSON.stringify({at:'2026-07-14T10:00:00Z',cloudRev:9,record:cloudState}));
  w.eval(`state.members=[]; window.__noReload=true;`);
  try { w.restoreConflictBackup(); } catch(e){}
  t('yedek geri yuklendi', w.eval(`state.members.some(m=>m.name==='PULLED UYE')`));
  t('geri yukleme buluta gitmek uzere isaretli', w.localStorage.getItem('pilateria_dirty')==='1');
  w.eval('clearTimeout(pushTimer)');

  console.log('[10] syncNow guvenli akis (dirty → once push)');
  w.__fetchLog.length=0;
  w.__fetchRespFor=(url,opts)=>{
    if((opts&&opts.method)==='PUT') return {ok:true,json:()=>Promise.resolve({})};
    return {ok:true,json:()=>Promise.resolve({record:cloudState})};
  };
  w.localStorage.setItem('pilateria_dirty','1');
  await w.syncNow();
  t('PUT atildi (yerel ezilmedi)', puts().length>=1, puts().length);

  console.log('[11] v31 SENKRON-UX: yenileme kullaniciyi rahatsiz etmez');
  // switchPage spy — pull artik switchPage cagirmamali (yerinde yenileme)
  w.eval(`window.__spCount=0; const __origSP=window.switchPage; window.switchPage=function(p){window.__spCount++; return __origSP(p);};`);
  w.localStorage.removeItem('pilateria_dirty');
  w.eval(`syncCfg.baseRev=5; saveSyncCfgRaw(syncCfg); lastAutoPullTs=0;`);
  const cloud2 = JSON.parse(JSON.stringify(cloudState)); cloud2._rev=9; cloud2.members.push({id:'mP2',name:'IKINCI PULL',joinDate:'2026-07-01',monthly:{},packages:[]});
  w.__fetchRespFor=(url,opts)=>({ok:true,json:()=>Promise.resolve({record:cloud2})});
  await w.autoPullIfNeeded('ux1');
  t('pull yerinde yeniledi (switchPage cagrilmadi)', w.eval('window.__spCount')===0, w.eval('window.__spCount'));
  t('veri geldi (IKINCI PULL)', w.eval(`state.members.some(m=>m.name==='IKINCI PULL')`));
  // modal acikken pull ATLANIR
  w.eval(`document.body.classList.add('pl-modal-open'); lastAutoPullTs=0; syncCfg.baseRev=5; saveSyncCfgRaw(syncCfg);`);
  w.__fetchLog.length=0;
  await w.autoPullIfNeeded('ux2');
  t('modal acikken fetch yok', LOG().length===0, LOG().length);
  w.eval(`document.body.classList.remove('pl-modal-open');`);
  // input odaginda pull ATLANIR
  w.eval(`const __i=document.createElement('input'); __i.id='__focus_test'; document.body.appendChild(__i); __i.focus(); lastAutoPullTs=0;`);
  w.__fetchLog.length=0;
  await w.autoPullIfNeeded('ux3');
  t('yazarken fetch yok', LOG().length===0, LOG().length);
  w.eval(`document.getElementById('__focus_test').blur(); document.getElementById('__focus_test').remove();`);
  // legacy (rev=0) pull oturumda 1 kez
  w.eval(`window.__legacyPulledOnce=undefined; syncCfg.baseRev=0; saveSyncCfgRaw(syncCfg); lastAutoPullTs=0;`);
  const legacyCloud = JSON.parse(JSON.stringify(cloudState)); delete legacyCloud._rev;
  w.__fetchRespFor=(url,opts)=>{
    if((opts&&opts.method)==='PUT') return {ok:true,json:()=>Promise.resolve({})};
    return {ok:true,json:()=>Promise.resolve({record:legacyCloud})};
  };
  await w.autoPullIfNeeded('legacy1');
  t('ilk legacy pull yapildi + damgalandi', w.eval('window.__legacyPulledOnce')===true);
  w.eval(`clearTimeout(pushTimer); localStorage.removeItem('pilateria_dirty'); syncCfg.baseRev=0; saveSyncCfgRaw(syncCfg); lastAutoPullTs=0;`);
  w.__fetchLog.length=0;
  await w.autoPullIfNeeded('legacy2');
  t('ikinci legacy pull YOK (tekrar dongusu kesildi)', !LOG().some(x=>x.method==='PUT') && w.eval(`state.members.length`)>0 && LOG().length<=1, LOG().length);

  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi`);
  process.exit(fail?1:0);
} catch(err) { console.error('TEST HATASI:', err); process.exit(1); } }, 700);
