// v198 — TAZELEME YARIŞI (18.10 canlı gözlem): sbResync kirli/yakın-push kilitlerine ÇEKİMDEN ÖNCE bakıyordu; 15 tablonun çekimi
// 1–2 sn sürerken yapılan yerel kayıt, çekim bitince `state = __incoming` ile YERELDEN düşüyordu (MUHASEBECİ carisi; buluta gitmişti,
// realtime yansımasıyla geri geldi). Kural: çekim bittikten sonra kirli / süren gönderim / yeni biten gönderim varsa ÜZERİNE YAZMA,
// 'after-push' ile ertele. Yamasız yapıda [1] ve [2] BAŞARISIZ olmalı.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
function boot(){ return new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
}}).window; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Sahte istemci: tam çekim = 15 tablo sırayla; ilk tablo (members) çekilirken TÜM bulut anlık görüntüsü alınır ve ${selectMs} ms sürer
// (çekim penceresi), diğer tablolar o bayat görüntüden anında döner; upsert ${upsertMs} ms sürer (gönderim penceresi); bulut window.__cloud'da
function fakeClient(w, selectMs, upsertMs){
  w.eval(`window.__cloud={}; window.__snap=null; window.__selN=0; window.__upN=0;
    sbClient={ from:function(tab){ return {
      select:function(){ return { order:function(){ window.__selN++; const first=(tab==='members'); if (first||!window.__snap) window.__snap=JSON.parse(JSON.stringify(window.__cloud)); const tb=window.__snap[tab]||{}; const rows=Object.keys(tb).map(function(id){ return {id:id,data:tb[id]}; }); return new Promise(function(res){ setTimeout(function(){ res({data:rows,error:null}); }, first ? ${selectMs} : 0); }); } }; },
      upsert:function(rows){ window.__upN++; return new Promise(function(res){ setTimeout(function(){ window.__cloud[tab]=window.__cloud[tab]||{}; rows.forEach(function(r){ window.__cloud[tab][r.id]=r.data; }); res({error:null}); }, ${upsertMs}); }); },
      delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; } }; } };`);
}
async function scenario(label, selectMs, upsertMs){
  console.log('['+label+'] çekim '+selectMs+' ms, gönderim '+upsertMs+' ms');
  const w=boot(); await sleep(1200);
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','__refreshUIWhenIdle','setCloudDot','plToast'].forEach(fn=>window[fn]=function(){}); window.__uiBusyForPull=function(){return false;}; __uiBusyForPull=function(){return false;};");
  fakeClient(w, selectMs, upsertMs);
  // bulutta M1 (bayat 5000); yerelde M1 (9999, gönderilmiş → gölge aynı), temiz, eski push
  w.eval("window.__cloud.members={M1:{id:'M1',name:'MELTEM',monthly:{}}}; window.__cloud.member_finance={M1:{totalPrice:5000,packages:[],monthly:{}}}; window.__cloud.settings={singleton:{}};"
    +"state.members=[{id:'M1',name:'MELTEM',totalPrice:5000,packages:[],monthly:{}}]; state.groups=[]; state.payments=[]; state.lessons=[]; state.finCounterparties=[];"
    +"__sbShadow={}; __sbBaseReady=true; __sbVer={}; sbSnapshotShadow(sbStateToRows()); localStorage.removeItem('pilateria_dirty'); __sbLastResync=0; __sbLastPushAt=0; __sbResyncBusy=false; window.__pilSyncReady=true;");
  const p=w.eval("sbResync('visible')"); // çekim başladı (await ETME)
  await sleep(Math.min(120, selectMs/3));
  // çekim sürerken YEREL kayıt (gerçek save → anında gönderim)
  w.eval("state.finCounterparties.push({id:'CPX',kind:'counterparty',name:'MUHASEBECİ',type:'accountant',active:true}); state.members[0].totalPrice=9999; save();");
  t('yerel kayıt sonrası kirli ya da gönderim sürüyor', w.eval("isDirty() || __sbPushInFlight"));
  await p; await sleep(upsertMs+selectMs+300);
  const cp=w.eval("state.finCounterparties.some(c=>c.id==='CPX')"), price=w.eval("state.members[0].totalPrice");
  t('çekim bitince yerel cari KAYBOLMADI', cp===true, cp);
  t('çekim sırasında değişen fiyat KORUNDU (9999, bayat 5000 ezmedi)', price===9999, price);
  t('iz: üzerine yazma yok, tazeleme ertelendi', w.eval("__syncTrace.some(s=>/çekim sırasında yerel değişiklik|üzerine yazma YOK/.test(s))"), JSON.stringify(w.eval("__syncTrace.slice(-5)")));
  t('after-push tazelemesi planlandı', w.eval("!!sbResync._afterPush"));
  t('gönderim buluta ulaştı (cari bulutta)', w.eval("!!(window.__cloud.finance && window.__cloud.finance.CPX)"));
  // sonra: temiz + eski push → after-push tazelemesi bulutla hizalar, cari yerinde kalır
  w.eval("clearTimeout(sbResync._afterPush); __sbLastPushAt=0; __sbLastResync=0; __sbResyncBusy=false;");
  await w.eval("sbResync('after-push')"); await sleep(selectMs+300);
  t('after-push sonrası cari hâlâ yerelde (buluttan geldi)', w.eval("state.finCounterparties.some(c=>c.id==='CPX')"));
  t('after-push sonrası fiyat 9999 (bulut güncel)', w.eval("state.members[0].totalPrice")===9999, w.eval("state.members[0].totalPrice"));
}
setTimeout(async function(){try{
  await scenario('1 · gönderim çekimden YAVAŞ (süren gönderim)', 400, 700);
  await scenario('2 · gönderim çekimden HIZLI (yeni biten gönderim)', 500, 50);
  console.log('[3] Kod: kilitler çekimden SONRA yeniden bakılır');
  t('çekim sonrası kirli/süren/yakın-push denetimi', /__resyncOk[\s\S]{0,900}?isDirty\(\)[^\n]{0,120}__sbPushInFlight[^\n]{0,160}__sbLastPushAt/.test(html));
  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST HATASI',e&&e.stack||e);process.exit(1);}},900);
