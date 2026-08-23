// v151 — DETAY ILERI/GERI GEZINMESI = SAYFA LISTESI (Kerem: "pasifteki 2. Paket kaydi
// gezinmede cikiyor; uye ve grup detayinda ileri/geri sirasi listeyle ayni olmali").
// KURAL: uye detayi gezinmesi UYE LISTESI (buildMemberRows) sirasiyla BIREBIR — bireyseller
// alfabetik, sonra gruplar (kucukten buyuge) ve uyeleri; ay-pasif/arsivli kayitlar gezinmeye
// SIZMAZ. Pasif bir kayit goruntuleniyorsa gezinme Pasif Uyeler sirasinda olur. Grup detayi
// gezinmesi GRUPLAR sayfasinin listesiyle (ayni ay filtresi + ada gore sira) birebir.
// Yamasiz (v150) build'de FAIL etmeli: orada uye nav = tum arsivsiz kayitlar duz alfabetik
// (ay-pasif klon dahil), grup nav = tum arsivsiz gruplar (o ay listede olmayanlar dahil).
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
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
setTimeout(()=>{ try {
  const CM = w.eval('currentMonth()');
  const PM = shiftM(CM,-1);
  w.eval(`
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const M=function(id,ad,aylar,ark){ const mo={}; (aylar||[]).forEach(function(a){ mo[a]={enrolled:true}; });
      return {id:id,name:ad,joinDate:'2026-01-01',totalPrice:8000,defaultPackageId:'p8',packages:[],archived:!!ark,monthly:mo}; };
    state.members=[
      M('mM','MERVE TEK',['${CM}']),
      M('mZ','NUR TEK',['${CM}']),
      M('mD','DENIZ GRUP',['${CM}']),
      M('mE','EBRU GRUP',['${CM}']),
      M('mF','FUNDA GRUP',['${CM}']),
      M('mG','GONCA GRUP',['${CM}']),
      M('mH','HANDE ESKI',['${PM}']),                       // yalniz gecmis ayda kayitli — bu ay PASIF
      Object.assign(M('cP','MERVE TEK (2. Paket)',['${PM}']),{secondOfMember:'mM'}), // AY-PASIF KLON (Kerem vakasi)
      M('mA','ARZU ARSIVLI',[],true)                        // arsivli
    ];
    state.groups=[
      {id:'gB',name:'BETA',size:2,memberIds:['mD','mE'],packages:[],monthlyMembers:{'${CM}':['mD','mE']},monthlyNotes:{}},
      {id:'gA',name:'ALFA',size:4,memberIds:['mF','mG'],packages:[],monthlyMembers:{'${CM}':['mF','mG']},monthlyNotes:{}},
      {id:'gPM',name:'CENK GRUBU',size:2,memberIds:['mH'],packages:[],monthlyMembers:{'${PM}':['mH']},monthlyNotes:{}} // bu ay listede YOK
    ];
    state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
  `);
  const md = () => d.getElementById('modal-member-detail').innerHTML;
  const gd = () => d.getElementById('modal-group-detail').innerHTML;

  console.log('[1] UYE GEZINMESI = UYE LISTESI SIRASI (bireyseller once, sonra gruplar)');
  // Liste sirasi: MERVE, NUR (bireysel alfabetik) -> BETA(2): DENIZ, EBRU -> ALFA(4): FUNDA, GONCA
  w.openMemberDetail('mM');
  t('ilk uyede (MERVE) onceki YOK', md().indexOf('Önceki yok') !== -1, (md().match(/detail-nav[\s\S]{0,400}/)||[''])[0].slice(0,200));
  t('MERVE -> sonraki NUR (listede siradaki)', md().indexOf("openMemberDetail('mZ','"+CM+"')") !== -1);
  t('AY-PASIF KLON gezinmede YOK (Kerem vakasi)', md().indexOf("openMemberDetail('cP'") === -1);
  t('sayac 1/6 (liste uzunlugu; 101 degil)', md().indexOf('>1/6<') !== -1);
  w.openMemberDetail('mZ');
  t('son bireysel (NUR) -> sonraki ILK GRUP UYESI (DENIZ)', md().indexOf("openMemberDetail('mD','"+CM+"')") !== -1, (md().match(/openMemberDetail\('[^']+'/g)||[]).join(','));
  w.openMemberDetail('mG');
  t('listenin sonunda (GONCA) sonraki YOK', md().indexOf('Sonraki yok') !== -1);
  t('sayac 6/6', md().indexOf('>6/6<') !== -1);

  console.log('[2] PASIF KAYIT GORUNTULENIRSE GEZINME PASIF LISTESINDE');
  // Pasif (bu ay): ARZU ARSIVLI, HANDE ESKI, MERVE TEK (2. Paket) — ada gore
  w.openMemberDetail('cP');
  t('pasif kayitta sayac 3/3 (pasif listesi)', md().indexOf('>3/3<') !== -1, (md().match(/>\d+\/\d+</)||[''])[0]);
  t('pasif gezinme once HANDE (pasif sirasi)', md().indexOf("openMemberDetail('mH','"+CM+"')") !== -1);
  t('pasif gezinmede AKTIF uye yok (MERVE nav dugmesi yok)', md().indexOf("openMemberDetail('mM','"+CM+"')") === -1);
  w.closeModal('modal-member-detail');

  console.log('[3] GRUP GEZINMESI = GRUPLAR SAYFASI LISTESI (ay filtresi + ada gore)');
  // CM listesi: ALFA, BETA (CENK GRUBU bu ay listede yok)
  w.openGroupDetail('gB', CM);
  t('BETA son grup — sonraki YOK (CENK bu ay listede degil)', gd().indexOf("openGroupDetail('gPM'") === -1, (gd().match(/openGroupDetail\('[^']+'/g)||[]).join(','));
  t('grup sayaci 2/2', gd().indexOf('class="pos">2/2<') !== -1, (gd().match(/class="pos">\d+\/\d+</)||[''])[0]);
  t('BETA -> onceki ALFA', gd().indexOf("openGroupDetail('gA'") !== -1);
  w.closeModal('modal-group-detail');

  console.log('[4] SAYFA LISTELERININ KENDISI DEGISMEDI (tek-kaynak regresyon pini)');
  const gm = d.getElementById('group-month'); if (gm) gm.value = CM;
  w.renderGroups();
  const gl = (d.getElementById('groups-list')||{}).innerHTML || '';
  t('Gruplar listesi: ALFA + BETA var', gl.indexOf('ALFA') !== -1 && gl.indexOf('BETA') !== -1);
  t('Gruplar listesi: CENK GRUBU bu ay YOK', gl.indexOf('CENK GRUBU') === -1);
  const am = d.getElementById('archive-month'); if (am) am.value = CM;
  w.renderArchive();
  const at = (d.getElementById('archive-tbody')||{}).innerHTML || '';
  t('Pasif listesi: klon + HANDE + ARZU orada', at.indexOf('MERVE TEK (2. Paket)') !== -1 && at.indexOf('HANDE ESKI') !== -1 && at.indexOf('ARZU ARSIVLI') !== -1);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
