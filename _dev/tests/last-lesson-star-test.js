// v170 — ⭐ SON DERS YILDIZI: TEK HAK KAYNAGI + TUM TAKVIM YUZEYLERI
// Kerem (2026-09-01): "son 1 dersi kalan bireysel uye veya gruplarin yaninda yildiz gozukuyordu,
// simdi cikmiyor, bu dogru mu?" — dogruydu. Olculen (yamasiz): masaustu hafta 1 · masaustu ay 0 ·
// mobil gun 0 · mobil ay 0; 4 haklik uyede HICBIR yerde yok.
// KOK NEDEN 1: packageExpectedSessions kendi hak zincirini kuruyordu (paket kaydi > paket TIPI > 8),
// AYLIK HAK'i (sessionsOverride / monthlySessions) gormuyordu → 4 haklik uyede yildiz hic dogmuyor.
// KOK NEDEN 2: v132 mobil takvim yeniden yaziminda ⭐ tasinmadi; masaustu AY ciplerinde hic yoktu.
// v170: hak = sessionQuotaFor (tek kaynak) + yildiz tum yuzeylerde. Yildizin ANLAMI degismedi.
// Yamasiz build'de FAIL etmeli.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function stars(){ return (d.getElementById('calendar').innerHTML.match(/⭐/g)||[]).length; }
function view(mobil, v, gun){ w.eval("window.__forceCalMobile="+(mobil?'true':'false')+"; calView='"+v+"'; calAnchor=parseISO('"+gun+"'); __calSelDay='"+gun+"'; renderCalendar();"); }
setTimeout(()=>{ try {
  w.eval("['renderMembers','renderGroups','renderDashboard','renderArchive','renderMiniCal'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  // gunler: 8 haklik uye 01..08 (son ders 08), 4 haklik uye 10..13 (son ders 13), grup 4 hak 15..18 (son 18)
  w.eval(`
    state.settings.reformers=12; state.settings.open=9; state.settings.close=21;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'n8',name:'NORMAL SEKIZ',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'d4',name:'DORT HAK',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true,sessionsOverride:4}}},
      {id:'g1',name:'GRUP BIR',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'g2',name:'GRUP IKI',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}}
    ];
    state.groups=[{id:'gH',name:'GRUP BIR - GRUP IKI',size:2,memberIds:['g1','g2'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{},monthlyNotes:{},monthlySessions:{'${CM}':4}}];
    state.lessons=[];
    for(let i=1;i<=8;i++) state.lessons.push({id:'A'+i,memberIds:['n8'],date:'${CM}-'+String(i).padStart(2,'0'),time:'10:00',status:'planned',packageMonth:'${CM}',instructorId:'h1'});
    for(let i=1;i<=4;i++) state.lessons.push({id:'B'+i,memberIds:['d4'],date:'${CM}-'+String(i+9).padStart(2,'0'),time:'12:00',status:'planned',packageMonth:'${CM}',instructorId:'h1'});
    for(let i=1;i<=4;i++) state.lessons.push({id:'C'+i,groupId:'gH',memberIds:['g1','g2'],date:'${CM}-'+String(i+14).padStart(2,'0'),time:'14:00',status:'planned',packageMonth:'${CM}',instructorId:'h1'});
    state.payments=[];
  `);

  console.log('[1] HAK TEK KAYNAK: packageExpectedSessions = sessionQuotaFor');
  t('4 haklik uye: beklenti 4 (8 DEGIL)', w.eval(`packageExpectedSessions('member','d4','${CM}')`)===4, w.eval(`packageExpectedSessions('member','d4','${CM}')`));
  t('aylik hakli grup: beklenti 4', w.eval(`packageExpectedSessions('group','gH','${CM}')`)===4, w.eval(`packageExpectedSessions('group','gH','${CM}')`));
  t('normal uye: beklenti 8 (degismedi)', w.eval(`packageExpectedSessions('member','n8','${CM}')`)===8);

  console.log('[2] YILDIZ DOGRU DERSTE (kronolojik son)');
  t('4 haklik uye: yildiz son derste', JSON.stringify(w.eval("state.lessons.filter(l=>(l.memberIds||[]).includes('d4')&&isLastLessonOfPackage(l)).map(l=>l.date)"))===JSON.stringify([CM+'-13']), JSON.stringify(w.eval("state.lessons.filter(l=>(l.memberIds||[]).includes('d4')&&isLastLessonOfPackage(l)).map(l=>l.date)")));
  t('4 hakli grup: yildiz son derste', JSON.stringify(w.eval("state.lessons.filter(l=>l.groupId==='gH'&&isLastLessonOfPackage(l)).map(l=>l.date)"))===JSON.stringify([CM+'-18']));
  t('normal uye: yildiz 8. derste (davranis ayni)', JSON.stringify(w.eval("state.lessons.filter(l=>(l.memberIds||[]).includes('n8')&&isLastLessonOfPackage(l)).map(l=>l.date)"))===JSON.stringify([CM+'-08']));
  t('paket tamamlanmadan yildiz YOK (v18.1 kurali korunuyor)', (function(){ w.eval("state.__bak=state.lessons.filter(l=>l.id!=='B4'); var __s=state.lessons; state.lessons=state.__bak;"); const r=w.eval("state.lessons.filter(l=>(l.memberIds||[]).includes('d4')&&isLastLessonOfPackage(l)).length"); w.eval("state.lessons.push({id:'B4',memberIds:['d4'],date:'"+CM+"-13',time:'12:00',status:'planned',packageMonth:'"+CM+"',instructorId:'h1'});"); return r===0; })());

  console.log('[3] TUM TAKVIM YUZEYLERI: masaustu hafta/ay + mobil gun/ay');
  view(false,'week',CM+'-08'); t('masaustu HAFTA: yildiz var', stars()>=1, stars());
  view(false,'day',CM+'-13');  t('masaustu GUN (KAPALI gun): ders + yildiz gorunur', stars()>=1 && d.getElementById('calendar').innerHTML.indexOf('gcal-ev')!==-1, stars());
  view(false,'month',CM+'-01');t('masaustu AY: yildizlar (3 birim)', stars()===3, stars());
  view(true,'day',CM+'-13');   t('MOBIL GUN: yildiz var (v132 kaybi giderildi)', stars()>=1, stars());
  view(true,'month',CM+'-18'); t('MOBIL AY: secili gunun kartinda yildiz', stars()>=1, stars());
  view(true,'day',CM+'-11');   t('son ders OLMAYAN gunde yildiz YOK', stars()===0, stars());

  console.log('[3b] KAPALI GUN: ders masaustunde gorunur, bos saat kutusu YOK');
  view(false,'day',CM+'-13'); // Pazar (workDays disi) — masaustu gun gorunumu
  t('kapali gun basligi hala kapali isaretli', d.getElementById('calendar').innerHTML.indexOf('gcal-dayhead')!==-1 && d.getElementById('calendar').innerHTML.indexOf(' closed')!==-1);
  t('kapali gunde bos saat kutusu (ders ekleme) yok', d.getElementById('calendar').innerHTML.indexOf('gcal-hcell')===-1);
  view(false,'day',CM+'-11'); // Cuma: acik gun — davranis degismedi
  t('acik gunde saat kutulari duruyor', d.getElementById('calendar').innerHTML.indexOf('gcal-hcell')!==-1);

  console.log('[4] elle ⭐ isareti + iptal kurali degismedi');
  w.eval("state.lessons.find(l=>l.id==='B1').isLastOfPackage=true;");
  t('elle isaretli ders son ders, otomatik olan iptal', JSON.stringify(w.eval("state.lessons.filter(l=>(l.memberIds||[]).includes('d4')&&isLastLessonOfPackage(l)).map(l=>l.date)"))===JSON.stringify([CM+'-10']));
  w.eval("delete state.lessons.find(l=>l.id==='B1').isLastOfPackage;");
  w.eval("state.lessons.find(l=>l.id==='B4').status='cancelled';");
  t('iptal ders yildiz almaz, paket eksilir (yildiz yok)', w.eval("state.lessons.filter(l=>(l.memberIds||[]).includes('d4')&&isLastLessonOfPackage(l)).length")===0);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
