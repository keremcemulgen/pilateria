// v196 — FİNANS BULUT TABLOSU (`finance`, tek tablo, kind ile türlenir) + İSTEĞE BAĞLI TABLO KAPISI
// Kerem SQL'i çalıştırmadan uygulama yayına girebilir: tablo sunucuda yoksa açılış/tazeleme/gönderim DURMAZ (diğer 14 tablo
// aynen), finans yazımı kapalı kalır, varsayılan hesaplar korunur; tablo kurulunca bekleyen satırlar gönderilir. Realtime satırı
// kind'e göre doğru koleksiyona düşer.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
  if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.__alerts=[]; w.alert=(m)=>{ w.__alerts.push(String(m)); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{}; w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:false;
}});
const w=dom.window;
let pass=0,fail=0;
function t(n,c,x){if(c){pass++;console.log('  OK ',n);}else{fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');}}
const J=(e)=>w.eval('JSON.stringify('+e+')');
setTimeout(async function(){try{
  w.eval("['renderMembers','renderDashboard','renderGroups','renderCalendar','__refreshUIInPlace','setCloudDot','plToast','sbSubscribeAll','__sbFreshenFromJsonbin','__pilOffsiteDaily','__refreshUIWhenIdle'].forEach(fn=>window[fn]=function(){}); window.plConfirm=function(){return Promise.resolve(false);}; __sbRole='owner';");

  console.log('[1] state→rows→state: finans koleksiyonları tek tabloda, kind ile');
  w.eval("state.finMoves.push({id:'MV1',kind:'move',op:'transfer',date:'2026-10-13',amount:2000,fromAccountId:'acc-cash',toAccountId:'acc-bank',note:''}); state.finCounterparties.push({id:'CP1',kind:'counterparty',name:'KIRALAYAN',type:'landlord'});");
  const rows = JSON.parse(J('sbStateToRows()'));
  t('rows.finance: acc-cash/acc-bank (account) + MV1 (move) + CP1 (counterparty)', rows.finance && rows.finance['acc-cash'] && rows.finance['acc-cash'].kind==='account' && rows.finance['MV1'] && rows.finance['MV1'].kind==='move' && rows.finance['CP1'] && rows.finance['CP1'].kind==='counterparty', Object.keys(rows.finance||{}).join(','));
  t('SB_TABLES finance içerir, isteğe bağlı', w.eval("SB_TABLES.indexOf('finance')>=0 && SB_OPTIONAL_TABLES.indexOf('finance')>=0"));
  const st2 = JSON.parse(J('sbRowsToState(sbStateToRows())'));
  t('dönüşte finMoves/finCounterparties/finAccounts yerine oturdu', st2.finMoves.length===1 && st2.finMoves[0].id==='MV1' && st2.finCounterparties.length===1 && st2.finAccounts.length===2, JSON.stringify({m:st2.finMoves.length,c:st2.finCounterparties.length,a:st2.finAccounts.length}));
  t('__sbMergeColls finans koleksiyonlarını içerir', w.eval("__sbMergeColls().indexOf('finMoves')>=0 && __sbMergeColls().indexOf('finDues')>=0"));

  console.log('[2] Sunucuda finance tablosu YOK: açılış durmaz, diğer tablolar yüklenir, kapı kapanır');
  w.eval(`window.__SRV={ members:[{id:'M1',data:{id:'M1',name:'AYSE',joinDate:'2026-01-01',monthly:{'2026-10':{enrolled:true}}}}], member_finance:[{id:'M1',data:{totalPrice:4500,packages:[]}}], lessons:[{id:'L1',data:{id:'L1',date:'2026-10-01',time:'10:00',status:'planned',memberIds:['M1'],groupId:'',size:1,packageMonth:'2026-10'}}] };
    window.__FIN_MISSING=true; window.__UPS={};
    function __mkQ(tab, opts){
      const rows=(window.__SRV[tab]||[]).slice();
      const q={ order:function(){ return q; }, range:function(){ return q; }, then:function(ok,ko){
        if (tab==='finance' && window.__FIN_MISSING) return Promise.resolve({data:null, error:{code:'PGRST205', message:"Could not find the table 'public.finance' in the schema cache", hint:null}}).then(ok,ko);
        const res={data:rows, error:null}; if(opts&&opts.count==='exact') res.count=rows.length; return Promise.resolve(res).then(ok,ko); } };
      return q;
    }
    sbClient = { from:function(tab){ return { select:function(cols,opts){ return __mkQ(tab,opts); }, upsert:function(ups){ if (tab==='finance' && window.__FIN_MISSING) return Promise.resolve({error:{code:'PGRST205', message:"Could not find the table 'public.finance' in the schema cache"}}); window.__UPS[tab]=(window.__UPS[tab]||[]).concat(ups.map(u=>u.id)); return Promise.resolve({error:null}); }, delete:function(){ return { in:function(){ return Promise.resolve({error:null}); } }; } }; } };
    state.members=[]; state.lessons=[]; state.groups=[]; state.payments=[]; state.finMoves=[]; state.finCounterparties=[]; __sbShadow={}; __sbVer={}; __sbMissingTables={}; localStorage.removeItem('pilateria_dirty');`);
  await w.eval("sbLoadAll()"); await new Promise(r=>setTimeout(r,300));
  t('üye ve ders yüklendi (açılış DURMADI)', w.eval("state.members.length")===1 && w.eval("state.lessons.length")===1, w.eval("state.members.length")+'/'+w.eval("state.lessons.length"));
  t('finance eksik işaretlendi, kapı kapalı', w.eval("__sbMissingTables.finance===true") && w.eval("finCloudReady196()")===false);
  t('varsayılan hesaplar duruyor (tablo yokken ezilmedi)', w.eval("state.finAccounts.length")===2 && w.eval("!!finAccount196('acc-cash')"));
  t('gölgede finance BOŞ (kurulunca hepsi gönderilsin)', w.eval("Object.keys(__sbShadow.finance||{}).length")===0);
  w.eval("__renderSyncStatusLine('ok','12:00')");
  t('panel satırı: "Finans bulut tablosu kurulmamış"', /Finans bulut tablosu kurulmamış/.test(w.document.getElementById('dash-sync-status').innerHTML));

  console.log('[3] Tablo yokken gönderim: finance atlanır, diğerleri gider, kirli bayrak temizlenir (dot offline kalmaz)');
  w.eval("__sbBaseReady=true; state.finMoves.push({id:'MV2',kind:'move',op:'draw',date:'2026-10-14',amount:500,fromAccountId:'acc-cash',partner:'Kerem'}); state.members[0].note='degisti'; localStorage.setItem('pilateria_dirty','1'); window.__UPS={};");
  await w.eval("sbFlushPush()"); await new Promise(r=>setTimeout(r,200));
  t('members gönderildi, finance tablosuna upsert DENENMEDİ', (w.eval("(window.__UPS.members||[]).length")>=1) && !w.eval("window.__UPS.finance"), JSON.stringify(JSON.parse(J('window.__UPS'))));
  t('kirli bayrak temizlendi (okAll)', w.eval("isDirty()")===false);

  console.log('[4] Tablo yokken tazeleme: yerel finans verisi KORUNUR (ezilmez)');
  w.eval("__sbLastPushAt=0; __sbLastResync=0; __sbResyncBusy=false; localStorage.removeItem('pilateria_dirty');");
  await w.eval("sbResync('test')"); await new Promise(r=>setTimeout(r,400));
  t('tazeleme sonrası hesaplar + MV2 duruyor', w.eval("state.finAccounts.length")===2 && w.eval("state.finMoves.some(m=>m.id==='MV2')"), J('state.finMoves.map(m=>m.id)'));
  t('üyeler tazelendi (not alanı sunucudan)', w.eval("state.members[0].note")===undefined || w.eval("state.members[0].note")==='');

  console.log('[5] Tablo KURULDU: tazeleme bulur, kapı açılır, bekleyen satırlar gönderilir');
  w.eval("window.__FIN_MISSING=false; window.__SRV.finance=[]; __sbLastPushAt=0; __sbLastResync=0; __sbResyncBusy=false; localStorage.removeItem('pilateria_dirty'); window.__UPS={};");
  await w.eval("sbResync('test2')"); await new Promise(r=>setTimeout(r,400));
  t('finance artık eksik DEĞİL, kapı açık', w.eval("__sbMissingTables.finance===false") && w.eval("finCloudReady196()")===true);
  t('tazeleme sonrası varsayılan hesaplar yeniden var (normalize)', w.eval("state.finAccounts.length")===2);
  w.eval("state.finMoves.push({id:'MV3',kind:'move',op:'capital',date:'2026-10-15',amount:1000,toAccountId:'acc-bank',partner:'Ortak'}); localStorage.setItem('pilateria_dirty','1');");
  await w.eval("sbFlushPush()"); await new Promise(r=>setTimeout(r,200));
  const fu = JSON.parse(J("window.__UPS.finance||[]"));
  t('finance gönderimi: hesaplar + MV3 (gölge boştu → hepsi)', fu.includes('acc-cash') && fu.includes('acc-bank') && fu.includes('MV3'), JSON.stringify(fu));

  console.log('[6] Realtime: finance satırı kind\'e göre koleksiyona düşer; silme kaldırır');
  w.eval("__sbShadow.finance=__sbShadow.finance||{}; __sbShadow.finance['RT1']=JSON.stringify({id:'RT1',kind:'move',op:'transfer',date:'2026-10-16',amount:300,fromAccountId:'acc-bank',toAccountId:'acc-cash'}); __sbShadow.finance['RT2']=JSON.stringify({id:'RT2',kind:'counterparty',name:'MUHASEBECI',type:'accountant'}); __sbShadow.finance['RT3']=JSON.stringify({id:'RT3',kind:'due',title:'Kira',amount:30000,dueDate:'2026-11-05',status:'open'});");
  w.eval("sbApplyOne('finance','RT1'); sbApplyOne('finance','RT2'); sbApplyOne('finance','RT3');");
  t('move → finMoves, counterparty → finCounterparties, due → finDues', w.eval("state.finMoves.some(m=>m.id==='RT1')") && w.eval("state.finCounterparties.some(c=>c.id==='RT2')") && w.eval("state.finDues.some(d=>d.id==='RT3')"));
  w.eval("delete __sbShadow.finance['RT1']; sbApplyOne('finance','RT1');");
  t('silinen satır koleksiyondan kalktı', !w.eval("state.finMoves.some(m=>m.id==='RT1')"));
  w.eval("__sbShadow.finance['acc-cash']=JSON.stringify({id:'acc-cash',kind:'account',type:'cash',name:'Kasa',openingDate:'2026-10-01',openingBalance:1234,active:true}); sbApplyOne('finance','acc-cash');");
  t('hesap satırı güncellendi (açılış 1.234)', w.eval("finAccount196('acc-cash').openingBalance")===1234 && w.eval("state.finAccounts.filter(a=>a.id==='acc-cash').length")===1);

  console.log('[7] Buluta Taşı (sbMigrateLocal): finance eksikse atlanır, taşıma iptal OLMAZ');
  w.eval("window.__FIN_MISSING=true; __sbMissingTables={}; window.__UPS={}; __alerts=[];");
  await w.eval("sbMigrateLocal()"); await new Promise(r=>setTimeout(r,200));
  t('taşıma hatası uyarısı YOK, members gönderildi, finance eksik işaretli', w.__alerts.length===0 && (w.eval("(window.__UPS.members||[]).length")>=1) && w.eval("__sbMissingTables.finance===true"), JSON.stringify(w.__alerts));

  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
}catch(e){console.error('TEST COKTU',e);process.exit(2);}},50);
