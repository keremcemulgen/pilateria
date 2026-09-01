// v164 — "PASIF" ROZETI AY-BAZLI (Kerem, 2026-09-01, ekran goruntuleriyle): Pasif Uyeler sayfasinda
// "Agustos 2026'dan beri pasif" gorunen uyeler, grup penceresindeki uye listesinde rozetsiz cikiyordu.
// KOK NEDEN: seciciler (grup modali, bos slot doldurma, ders modali, uye detayi basligi) yalniz
// ESKI global m.archived bayragina bakiyordu; ay-bazli pasiflik (arsiv donemi / enrolled:false)
// gorunmuyordu. v164 KURALI: rozet = memberPassiveInMonth(m, baglam ayi) = katilmis VE o ay kayitli
// degil (archived / donem / enrolled:false hepsini kapsar). Yamasiz build'de FAIL etmeli.
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
function rozetli(html, ad){ const i=html.indexOf('>'+ad+'<')>=0 ? html.indexOf('>'+ad+'<') : html.indexOf(ad); if(i<0) return null; const ends=['</label>','</button>','</div>'].map(e=>html.indexOf(e,i)).filter(x=>x>=0); const end=ends.length?Math.min.apply(null,ends):i+260; return html.slice(i,end).indexOf('archived-badge')!==-1; }
setTimeout(()=>{ try {
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','updateGroupPricePreview'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const PM = shiftM(CM,-1), NM = shiftM(CM,+1);
  w.eval(`
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'mArch',name:'ARSIV ANNE',joinDate:'2026-01-01',packages:[],monthly:{},archived:true,archivedAt:'${PM}-05T00:00:00'},
      {id:'mPer',name:'DONEM DENIZ',joinDate:'2026-01-01',packages:[],monthly:{'${PM}':{enrolled:false}},archivePeriods:[{from:'${PM}',to:null}]},
      {id:'mFalse',name:'CIKAN CEREN',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:false}}},
      {id:'mAct','name':'AKTIF AYLIN',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'mNew',name:'YENI YAREN',joinDate:'${NM}-01',packages:[],monthly:{'${NM}':{enrolled:true}}}
    ];
    state.groups=[{id:'gS',name:'AKTIF AYLIN',size:3,memberIds:['mAct'],defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['mAct']},monthlyNotes:{}}];
    state.lessons=[]; state.payments=[];
  `);
  { const sel=d.getElementById('member-month'); if (sel && ![...sel.options].some(o=>o.value===CM)) sel.insertAdjacentHTML('beforeend','<option value="'+CM+'">'+CM+'</option>'); sel.value=CM; }

  console.log('[1] memberPassiveInMonth yardimcisi');
  t('fonksiyon var', w.eval("typeof memberPassiveInMonth")==='function', w.eval("typeof memberPassiveInMonth"));
  if (w.eval("typeof memberPassiveInMonth")==='function') {
    t('arsivli -> pasif', w.eval(`memberPassiveInMonth(state.members.find(m=>m.id==='mArch'),'${CM}')`)===true);
    t('donemli -> pasif', w.eval(`memberPassiveInMonth(state.members.find(m=>m.id==='mPer'),'${CM}')`)===true);
    t('bu aydan cikarilan -> pasif', w.eval(`memberPassiveInMonth(state.members.find(m=>m.id==='mFalse'),'${CM}')`)===true);
    t('aktif -> pasif DEGIL', w.eval(`memberPassiveInMonth(state.members.find(m=>m.id==='mAct'),'${CM}')`)===false);
    t('henuz katilmamis (joinDate ileri) -> pasif DEGIL', w.eval(`memberPassiveInMonth(state.members.find(m=>m.id==='mNew'),'${CM}')`)===false);
  }

  console.log('[2] GRUP PENCERESI uye listesi: ay-bazli pasifler rozetli');
  w.openGroupModal();
  const mg = d.getElementById('mg-members').innerHTML;
  t('DONEM DENIZ rozetli (donem)', rozetli(mg,'DONEM DENIZ')===true, String(rozetli(mg,'DONEM DENIZ')));
  t('CIKAN CEREN rozetli (bu aydan cikarildi)', rozetli(mg,'CIKAN CEREN')===true, String(rozetli(mg,'CIKAN CEREN')));
  t('ARSIV ANNE rozetli (eski bayrak)', rozetli(mg,'ARSIV ANNE')===true);
  t('AKTIF AYLIN rozetsiz (baska grupta oldugu icin listede gizli olabilir)', rozetli(mg,'AKTIF AYLIN')!==true, String(rozetli(mg,'AKTIF AYLIN')));
  t('YENI YAREN rozetsiz (henuz katilmadi, pasif degil)', rozetli(mg,'YENI YAREN')===false, String(rozetli(mg,'YENI YAREN')));
  w.closeModal('modal-group');

  console.log('[3] BOS SLOT DOLDURMA listesi');
  w.fillEmptySlot('gS', 1);
  const fsl = (d.getElementById('modal-fill-slot')||{}).innerHTML||'';
  t('DONEM DENIZ rozetli', rozetli(fsl,'DONEM DENIZ')===true, String(rozetli(fsl,'DONEM DENIZ')));
  t('CIKAN CEREN rozetli', rozetli(fsl,'CIKAN CEREN')===true);
  w.closeFillSlotModal();

  console.log('[4] UYE DETAYI basligi + DERS MODALI aramasi');
  w.openMemberDetail('mPer', CM);
  t('detay basliginda Pasif', (d.getElementById('md-name')||{}).innerHTML.indexOf('archived-badge')!==-1, (d.getElementById('md-name')||{}).innerHTML);
  w.closeModal('modal-member-detail');
  w.openMemberDetail('mAct', CM);
  t('aktif uyede baslikta Pasif YOK', (d.getElementById('md-name')||{}).innerHTML.indexOf('archived-badge')===-1);
  w.closeModal('modal-member-detail');
  w.openLessonModal(null, CM+'-15', '10:00');
  w.eval("__lessonMemberSearch='DENIZ'; renderLessonMembersCheckboxes([]);");
  const ml = d.getElementById('ml-members').innerHTML;
  t('ders modali aramasinda DONEM DENIZ rozetli', rozetli(ml,'DONEM DENIZ')===true, String(rozetli(ml,'DONEM DENIZ')));
  w.closeModal('modal-lesson');

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
