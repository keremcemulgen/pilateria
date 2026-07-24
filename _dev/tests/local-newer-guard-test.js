// v103+v112+v113 — VERI KURTARMA KALKANI, TARIH KANONU:
// v103: bulut DOLU + cihaz GERCEKTEN daha yeni iken acilis cihazi EZMEZ (pre_cloud_backup + birlestirme teklifi).
// v112: karar ID-bazli, yalniz UYE+ODEME (ders farki tek basina alarm uretmez).
// v113 (Kerem: "veriler dunkunden AZ olabilir, uye/odeme silebiliyorum"): karar ZAMANLA verilir —
//   cihazin son YEREL duzenlemesi (state._lastLocalEditAt), bulutun son yaziminden (_v max) 60sn+ YENIYSE
//   ve fark kaniti varsa sorulur. Bulut cihazdan SONRA yazilmissa (uye/odeme SILINMESI dahil) SESSIZCE bulut esastir.
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
    window.__realSave = save; // v113: gercek save() damga testi icin mocklamadan ONCE yakala
    window.save=function(){}; window.__refreshUIInPlace=function(){}; window.sbSubscribeAll=function(){};
    window.setCloudDot=function(){}; window.plToast=function(){}; window.__trace=function(){};
    window.__sbHarvestVer=function(){}; window.sbSnapshotShadow=function(){};
    window.__sbFreshenFromJsonbin=async function(){};
    window.markDirtyAndSchedulePush=function(){}; window.sbSchedulePush=function(){};
    __sbRole='owner'; window.__sbRole='owner'; // DIKKAT: __sbRole 'let' -> window degil, CIPLAK atama gerekir
    window.isDirty=function(){return false;};
  `);

  console.log('[0] v113 DAMGA: gercek save() kullanici yazimini damgalar; senkron-uygulama yazimini damgalamaz');
  w.eval("delete state._lastLocalEditAt; window.__pilSuppressDirty=false; __realSave();");
  t('kullanici yazimi: _lastLocalEditAt damgalandi', w.S()._lastLocalEditAt > 0, w.S()._lastLocalEditAt);
  t('damga localStorage kalicisina da yazildi', (JSON.parse(w.localStorage.getItem('pilateria'))._lastLocalEditAt||0) > 0);
  w.eval("delete state._lastLocalEditAt; window.__pilSuppressDirty=true; __realSave(); window.__pilSuppressDirty=false;");
  t('suppress (senkron-uygulama) yazimi: damga ATILMADI', !w.S()._lastLocalEditAt, w.S()._lastLocalEditAt);
  // Cihaz (yerel): 2 uye, 2 odeme (biri 21 Temmuz — buluttan YENI), 1 ders.
  // v113: gercek "cihaz yeni" senaryosu = kullanici bu cihazda AZ ONCE duzenleme yapti -> damga TAZE.
  const seedLocalNewer = ()=> w.eval(`
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}},
                   {id:'m2',name:'BURAK',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}];
    state.groups=[]; state.lessons=[{id:'l1',date:'2026-07-21',time:'10:00',status:'planned',memberIds:['m1']}];
    state.payments=[{id:'p1',memberId:'m1',date:'2026-07-01',amount:4500,method:'cash'},
                    {id:'p2',memberId:'m2',date:'2026-07-21',amount:5000,method:'cash'}];
    state._lastLocalEditAt = Date.now(); // v113: az once yerel duzenleme yapildi
    localStorage.setItem('pilateria', JSON.stringify({members:state.members,payments:state.payments,lessons:state.lessons,groups:[],settings:{},_lastLocalEditAt:state._lastLocalEditAt}));
    localStorage.removeItem('pilateria_pre_cloud_backup');
  `);
  // Bulut: 1 uye, 1 odeme (15 Temmuz), _v YOK (eski yazim) -> cihazdaki taze duzenlemeden ESKI ama DOLU
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

  console.log('[1] CIHAZ GERCEKTEN YENI (taze damga + bulutta _v yok) + RED: soruldu, bulut yuklendi, cihaz hali yedeklendi');
  seedLocalNewer(); mockSb(CLOUD);
  w.eval("window.__asked=false; window.plConfirm=async function(msg){ window.__asked=/DAHA YENİ/.test(msg||''); return false; };");
  await w.sbLoadAll();
  t('birlestirme SORULDU (cihaz yeni algilandi)', w.__asked===true);
  t('red -> bulut hali yuklendi (1 odeme)', w.S().payments.length===1, w.S().payments.length);
  const bk = w.localStorage.getItem('pilateria_pre_cloud_backup');
  t('pre_cloud_backup YAZILDI', !!bk);
  if (bk) { const b=JSON.parse(bk); const st=JSON.parse(b.state);
    t('yedek icinde 2 odeme + 21 Temmuz kaydi DURUYOR', st.payments.length===2 && st.payments.some(p=>p.date==='2026-07-21'), JSON.stringify(st.payments.map(p=>p.date))); }
  t('bulut yuklenince damga SIFIRLANDI (cihaz=bulut hizali)', !w.S()._lastLocalEditAt, w.S()._lastLocalEditAt);

  console.log('[2] CIHAZ GERCEKTEN YENI + EVET: BIRLESTIRILDI (upsert calisti, cihaz verisi KORUNDU, silme yok)');
  seedLocalNewer(); mockSb(CLOUD);
  w.eval("window.plConfirm=async function(){return true;};");
  await w.sbLoadAll();
  t('cihaz verisi korundu (2 odeme)', w.S().payments.length===2, w.S().payments.length);
  t('buluta upsert YAPILDI (birlestirme)', w.eval('window.__UPSERTS')>0, w.eval('window.__UPSERTS'));

  console.log('[3] ESIT VERI (damga taze olsa bile fark kaniti yok): soru SORULMAZ (regresyon)');
  w.eval(`
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}];
    state.groups=[]; state.lessons=[];
    state.payments=[{id:'p1',memberId:'m1',date:'2026-07-15',amount:4500,method:'cash'}];
    state._lastLocalEditAt = Date.now(); // damga taze ama icerik esit -> kanit yok
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

  console.log('[5] v112 SAHTE ALARM BITTI: yalniz DERS fazlasi (uye+odeme ayni) -> damga taze olsa bile SORULMAZ');
  w.eval(`
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}];
    state.groups=[]; state.payments=[{id:'p1',memberId:'m1',date:'2026-07-15',amount:4500,method:'cash'}];
    state.lessons=[{id:'lx1',date:'2026-07-20',time:'10:00',status:'planned',memberIds:['m1']},
                   {id:'lx2',date:'2026-07-21',time:'11:00',status:'planned',memberIds:['m1']},
                   {id:'lx3',date:'2026-07-22',time:'12:00',status:'planned',memberIds:['m1']}];
    state._lastLocalEditAt = Date.now();
    localStorage.setItem('pilateria', JSON.stringify({members:state.members,payments:state.payments,lessons:state.lessons,groups:[],settings:{}}));
  `);
  mockSb({ members:[{id:'m1',data:{id:'m1',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{}}}],
    member_finance:[{id:'m1',data:{packages:[]}}],
    payments:[{id:'p1',data:{id:'p1',memberId:'m1',date:'2026-07-15',amount:4500,method:'cash'}}] }); // DERS YOK (bulutta silinmis)
  w.eval("window.__asked=false; window.plConfirm=async function(){ window.__asked=true; return false; };");
  await w.sbLoadAll();
  t('DERS farki tek basina SORMAZ (sahte alarm bitti)', w.__asked===false);
  t('bulut yuklendi: yereldeki 3 hayalet ders GITTI', w.S().lessons.length===0, w.S().lessons.length);
  t('uye+odeme aynen durdu', w.S().members.length===1 && w.S().payments.length===1);

  console.log('[6] v113 KEREM SENARYOSU: baska cihazda UYE+ODEME SILINDI (bulut daha yeni yazildi) -> SORULMAZ, bulut esas');
  // Yerel: 2 uye + 2 odeme, ama son yerel duzenleme 10 DK ONCE. Bulut: m2+p2 SILINMIS, kalan satirlar
  // AZ ONCE yazilmis (_v taze). Eski mantik "yerelde fazla var -> cihaz yeni" derdi; TARIH KANONU sormaz.
  w.eval(`
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}},
                   {id:'m2',name:'BURAK',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}];
    state.groups=[]; state.lessons=[];
    state.payments=[{id:'p1',memberId:'m1',date:'2026-07-01',amount:4500,method:'cash'},
                    {id:'p2',memberId:'m2',date:'2026-07-21',amount:5000,method:'cash'}];
    state._lastLocalEditAt = Date.now() - 600000; // son yerel duzenleme 10 dk once
    localStorage.setItem('pilateria', JSON.stringify({members:state.members,payments:state.payments,lessons:[],groups:[],settings:{}}));
  `);
  const NOWV = Date.now() - 1000; // bulut az once yazildi (yerel damgadan 10 dk SONRA)
  mockSb({
    members:[{id:'m1',data:{id:'m1',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{},_v:NOWV}}],
    member_finance:[{id:'m1',data:{packages:[],monthly:{},_v:NOWV}}],
    payments:[{id:'p1',data:{id:'p1',memberId:'m1',date:'2026-07-01',amount:4500,method:'cash',_v:NOWV}}]
  });
  w.eval("window.__asked=false; window.plConfirm=async function(){ window.__asked=true; return false; };");
  await w.sbLoadAll();
  t('SILME sonrasi acilis: soru SORULMADI (bulut cihazdan sonra yazilmis)', w.__asked===false);
  t('silinen uye yerelden de GITTI (1 uye kaldi)', w.S().members.length===1, w.S().members.length);
  t('silinen odeme yerelden de GITTI (1 odeme kaldi)', w.S().payments.length===1, w.S().payments.length);

  console.log('[7] v113: damga HIC YOK (cihazda hic yerel duzenleme yapilmadi) + yerelde fazlalik -> SORULMAZ');
  // Ornek: realtime sigortasi kalintisi — cihaz hic duzenlenmedi ama yerelde bulutta olmayan kayit kaldi.
  w.eval(`
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}},
                   {id:'mGHOST',name:'HAYALET',joinDate:'2026-01-01',archived:false,packages:[],monthly:{}}];
    state.groups=[]; state.lessons=[];
    state.payments=[{id:'p1',memberId:'m1',date:'2026-07-15',amount:4500,method:'cash'}];
    delete state._lastLocalEditAt; // bu cihazda hic kullanici duzenlemesi olmadi
    localStorage.setItem('pilateria', JSON.stringify({members:state.members,payments:state.payments,lessons:[],groups:[],settings:{}}));
  `);
  mockSb(CLOUD);
  w.eval("window.__asked=false; window.plConfirm=async function(){ window.__asked=true; return false; };");
  await w.sbLoadAll();
  t('damgasiz cihaz: soru SORULMADI (yerel duzenleme kaniti yok)', w.__asked===false);
  t('hayalet kayit temizlendi, bulut esas (1 uye)', w.S().members.length===1, w.S().members.length);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
