// v105 — AYARLAR YEDEK PANELI: durum gosterimi, bulut listesi, birlestirerek geri donus (PIN korunur), elle yedek.
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
  w.eval(`
    window.plToast=function(){}; window.__trace=function(){}; window.sbResync=function(){};
    window.save=function(){}; window.__refreshUIInPlace=function(){};
  `);

  console.log('[0] HTML: panel kart ve butonlar mevcut');
  t('backup-panel-card var', !!d.getElementById('backup-panel-card'));
  t('Acil Kurtarma linki recover.html', !!d.querySelector('#backup-panel-card a[href="recover.html"]'));

  console.log('[1] GIRIS YOK: cihaz durumu gosterilir, bulut icin "giris yap" denir');
  w.eval("localStorage.setItem('pilateria_daily_2026-07-21','{}'); localStorage.setItem('pilateria_offsite_day','2026-07-21');");
  w.eval("sbClient=null; __sbSession=null;");
  await w.refreshBackupPanel();
  const st1 = d.getElementById('backup-status').innerHTML;
  t('cihaz gunluk yedegi listelendi', st1.indexOf('2026-07-21')>=0, st1.slice(0,80));
  t('bulut icin giris iste', st1.indexOf('giriş yap')>=0);

  console.log('[2] GIRISLI (owner): bulut gece yedekleri listelenir + geri don butonu');
  const SNAP = { members:[{id:'m1',data:{id:'m1',name:'AYSE'}}], member_finance:[{id:'m1',data:{packages:[]}}],
    settings:[{id:'singleton',data:{_pinHash:'ESKIPIN', reformers:5}}], payments:[], lessons:[], groups:[] };
  w.eval("window.__SNAP="+JSON.stringify(SNAP)+";"+
    "window.__UPS={}; window.__RPC=0;"+
    "sbClient = window.sbClient = { rpc: async function(fn){ window.__RPC++; return {data:'2026-07-21', error:null}; },"+
    " from: function(tbl){ return {"+
    "  select: function(cols){ return {"+
    "    order: function(){ return { limit: async function(){ return { data:[{id:'2026-07-21',created_at:'2026-07-21T21:00:00+00:00'},{id:'2026-07-20',created_at:'2026-07-20T21:00:00+00:00'}], error:null }; } }; },"+
    "    eq: function(){ return { single: async function(){ return { data:{ snapshot: window.__SNAP }, error:null }; } }; }"+
    "  }; },"+
    "  upsert: async function(part){ window.__UPS[tbl]=(window.__UPS[tbl]||[]).concat(part); return { error:null }; }"+
    "}; } };"+
    "__sbSession={user:{id:'u1'}}; __sbRole='owner'; window.__sbRole='owner';");
  await w.refreshBackupPanel();
  const listHtml = d.getElementById('backup-cloud-list').innerHTML;
  t('2 gunluk bulut yedegi listelendi', (listHtml.match(/Bu güne dön/g)||[]).length===2, listHtml.slice(0,120));
  t('durumda son yedek gunu var', d.getElementById('backup-status').innerHTML.indexOf('2026-07-21')>=0);

  console.log('[3] GERI DON: yonetici dogrulamasindan gecer, upsert (SILME YOK), PIN KORUNUR');
  w.eval("window.__ADV=null; requireAdminVerify = window.requireAdminVerify = function(label,cb){ window.__ADV=label; };");
  w.restoreDailyBackup('2026-07-21');
  t('yonetici dogrulamasi istendi', /geri dön/.test(w.eval('window.__ADV')||''), w.eval('window.__ADV'));
  w.eval("state._pinHash='GUNCELPIN'; window.plConfirm = async function(){ return true; };");
  await w.__restoreDailyBackupNow('2026-07-21');
  t('members upsert edildi', (w.eval('window.__UPS').members||[]).length===1);
  const setRow = (w.eval('window.__UPS').settings||[])[0];
  t('settings upsert edildi', !!setRow);
  t('PIN mevcut haliyle KORUNDU (ESKIPIN degil)', setRow && setRow.data && setRow.data._pinHash==='GUNCELPIN', setRow&&setRow.data&&setRow.data._pinHash);

  console.log('[4] SIMDI YEDEK AL: rpc cagrilir; owner degilse cagrilmaz');
  await w.takeCloudBackupNow();
  t('rpc pilateria_take_backup cagrildi', w.eval('window.__RPC')===1, w.eval('window.__RPC'));
  w.eval("__sbRole='staff';");
  await w.takeCloudBackupNow();
  t('staff rolunde rpc CAGRILMADI', w.eval('window.__RPC')===1, w.eval('window.__RPC'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
