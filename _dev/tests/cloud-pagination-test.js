// v191 KRITIK: buluttan tam cekim SAYFALI olmali. Supabase (PostgREST) tek istekte en fazla 1000 satir dondurur;
// sbLoadAll/sbResync .range() olmadan cektigi icin 1000'i asan DERS tablosunun 'y'/'z' ile baslayan ~%6'si uygulamada
// GORUNMUYORDU (canli 14.10: ders sayisi iki farkli gunde de tam 1000, kimlikler 'xsowuz3u'da kesiliyor).
// Bu test sunucu sinirini (1000 ve 400) taklit eder; eski sahte istemciler (range'siz) de calismaya devam etmeli.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:false;
}});
const w=dom.window;
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
setTimeout(async function(){try{
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','setCloudDot','plToast','sbSubscribeAll','__sbFreshenFromJsonbin','__pilOffsiteDaily'].forEach(fn=>window[fn]=function(){}); window.plConfirm=function(){return Promise.resolve(false);};");
  w.eval("__sbRole='owner';");
  // SAHTE SUNUCU: PostgREST gibi — istek basina en fazla CAP satir; range(a,b) destekli; count:'exact' destekli
  w.eval(`window.__CAP=1000; window.__REQ=0;
    (function(){
      const pad=n=>String(n).padStart(4,'0');
      const les=[]; for(let i=0;i<1070;i++){ const id='L'+pad(i); les.push({id:id,data:{id:id,date:'2026-10-01',time:'10:00',status:'planned',memberIds:['M1'],groupId:'',size:1,packageMonth:'2026-10'}}); }
      window.__SRV={ members:[{id:'M1',data:{id:'M1',name:'AYSE',joinDate:'2026-01-01',monthly:{'2026-10':{enrolled:true}}}}], member_finance:[{id:'M1',data:{totalPrice:4500,packages:[]}}], lessons:les };
    })();
    function __mkQ(tab, opts){
      const rows=(window.__SRV[tab]||[]).slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
      let lo=0, hi=null;
      const run=()=>{ window.__REQ++; const end = hi===null ? rows.length : Math.min(rows.length, hi+1); const slice=rows.slice(lo, Math.min(end, lo+window.__CAP)); const res={data:slice, error:null}; if(opts&&opts.count==='exact') res.count=rows.length; return Promise.resolve(res); };
      const q={ order:function(){ return q; }, range:function(a,b){ lo=a; hi=b; return q; }, then:function(ok,ko){ return run().then(ok,ko); } };
      return q;
    }
    sbClient = { from:function(tab){ return { select:function(cols,opts){ return __mkQ(tab,opts); }, upsert:function(){ return Promise.resolve({error:null}); }, delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; } }; } };`);
  w.eval("state.members=[]; state.lessons=[]; state.groups=[]; state.payments=[]; __sbShadow={}; __sbBaseReady=true; __sbVer={}; localStorage.removeItem('pilateria_dirty');");

  console.log('[1] sbLoadAll: sunucu 1070 ders, istek basina 1000 sinir → HEPSI yuklenir');
  await w.eval("sbLoadAll()"); await new Promise(r=>setTimeout(r,300));
  t('acilista 1070 ders (1000 DEGIL)', w.eval("state.lessons.length")===1070, w.eval("state.lessons.length"));
  t('son kimlik L1069 da yuklu', w.eval("!!state.lessons.find(l=>l.id==='L1069')"));

  console.log('[2] sbResync: ayni tam cekim');
  w.eval("state.lessons=state.lessons.slice(0,5); __sbLastPushAt=0; __sbLastResync=0; __sbResyncBusy=false; localStorage.removeItem('pilateria_dirty');");
  await w.eval("sbResync('test')"); await new Promise(r=>setTimeout(r,400));
  t('resync sonrasi 1070 ders', w.eval("state.lessons.length")===1070, w.eval("state.lessons.length"));

  console.log('[3] sunucu siniri 400 olsa bile (count ile) eksiksiz');
  w.eval("window.__CAP=400; state.lessons=[]; __sbShadow={}; localStorage.removeItem('pilateria_dirty');");
  await w.eval("sbLoadAll()"); await new Promise(r=>setTimeout(r,300));
  t('CAP=400 → 1070 ders', w.eval("state.lessons.length")===1070, w.eval("state.lessons.length"));

  console.log('[4] eski tip sahte istemci (range yok, order() Promise doner) calismaya devam eder');
  w.eval("sbClient = { from:function(tab){ return { select:function(){ return { order:function(){ return Promise.resolve({data:(window.__SRV[tab]||[]).slice(0,7)}); } }; }, upsert:function(){ return Promise.resolve({error:null}); }, delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; } }; } }; state.lessons=[]; __sbShadow={}; localStorage.removeItem('pilateria_dirty');");
  await w.eval("sbLoadAll()"); await new Promise(r=>setTimeout(r,300));
  t('range olmayan istemci: 7 ders (tek istek)', w.eval("state.lessons.length")===7, w.eval("state.lessons.length"));

  console.log('[5] hata: ikinci sayfa hata verirse eksik veri YAZILMAZ (yerel korunur)');
  w.eval(`window.__CAP=1000; let __n=0; const __old=sbClient;
    sbClient = { from:function(tab){ return { select:function(cols,opts){ const q=__mkQ(tab,opts); const r0=q.range; q.range=function(a,b){ if(tab==='lessons' && a>0){ return { order:function(){return this;}, then:function(ok){ return Promise.resolve({data:null,error:{message:'boom'}}).then(ok); } }; } return r0.call(q,a,b); }; return q; }, upsert:function(){ return Promise.resolve({error:null}); }, delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; } }; } };
    state.lessons=[{id:'YEREL',date:'2026-10-02',time:'09:00',status:'planned',memberIds:['M1'],groupId:'',size:1,packageMonth:'2026-10'}]; state.members=[{id:'M1',name:'AYSE',joinDate:'2026-01-01',monthly:{'2026-10':{enrolled:true}},packages:[]}]; __sbShadow={}; localStorage.removeItem('pilateria_dirty');`);
  await w.eval("sbLoadAll()"); await new Promise(r=>setTimeout(r,300));
  t('2. sayfa hatasi → state EZILMEDI (yerel 1 ders korundu)', w.eval("state.lessons.length")===1 && w.eval("state.lessons[0].id")==='YEREL', w.eval("state.lessons.length"));

  console.log("\n=== cloud-pagination: "+pass+" OK, "+fail+" FAIL ===");
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST COKTU',e);process.exit(2);}},900);
