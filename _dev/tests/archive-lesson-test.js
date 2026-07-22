// v106 — PASIFE ALMA / TAKVIM / TIK / AY IZOLASYONU:
// (1) tum grup pasif -> planli dersler SILINIR, yapilmis dersler tarihi tikleriyle KALIR
// (2) bireysel pasif -> o ay+sonrasi planli dersleri SILINIR
// (3) yarim birakan: modal listesinde ISMI var, TIKSIZ, 'ayrıldı' rozetli
// (4) yerine gelen: katilim tarihi YAZILIR; onceki ders tiksiz, sonraki otomatik tikli
// (5) ay izolasyonu: onceki ayin dersleri DEGISMEZ; migration olu dersleri supurur, iskeleti korur
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
  const CM = w.eval('currentMonth()');           // icinde bulunulan ay (testler dinamik)
  const PM_PREV = w.eval("prevMonthISO(currentMonth())");
  const TODAY = w.eval('todayISO()');
  const addD = (n)=> w.eval(`isoDate(addDays(parseISO('${TODAY}'), ${n}))`);
  const mkMember = (id,name)=>({id,name,joinDate:'2026-01-01',archived:false,packages:[],monthly:{}});

  const seed = ()=>{
    w.eval(`
      state.members=${JSON.stringify(['A','B','C','D','E','F'].map((n,i)=>mkMember('m'+(i+1),'UYE '+n)))};
      state.groups=[{id:'g1',name:'GRUP',size:4,memberIds:['m1','m2','m3','m4'],monthlyMembers:{},packages:[],memberJoinDates:{}}];
      state.lessons=[
        // GECMIS AY (izolasyon kontrolu): planli, onceki ayin kadrosu
        {id:'Lprev',date:'${PM_PREV}-15',time:'10:00',status:'planned',groupId:'g1',size:4,memberIds:['m1','m2','m3','m4'],packageMonth:'${PM_PREV}'},
        // BU AY: yapilmis (tarihsel) + 2 planli grup dersi
        {id:'Ldone',date:'${addD(-3)}',time:'10:00',status:'done',groupId:'g1',size:4,memberIds:['m1','m2','m3','m4'],packageMonth:'${CM}'},
        {id:'Lp1',date:'${addD(-1)}',time:'10:00',status:'planned',groupId:'g1',size:4,memberIds:['m1','m2','m3','m4'],packageMonth:'${CM}'},
        {id:'Lp2',date:'${addD(2)}',time:'10:00',status:'planned',groupId:'g1',size:4,memberIds:['m1','m2','m3','m4'],packageMonth:'${CM}'},
        // BIREYSEL uye m5: bu ay 2 planli + 1 yapilmis
        {id:'Bdone',date:'${addD(-2)}',time:'12:00',status:'done',memberIds:['m5'],packageMonth:'${CM}'},
        {id:'Bp1',date:'${addD(1)}',time:'12:00',status:'planned',memberIds:['m5'],packageMonth:'${CM}'},
        {id:'Bp2',date:'${addD(3)}',time:'12:00',status:'planned',memberIds:['m5'],packageMonth:'${CM}'}
      ];
    `);
  };
  const L = id => w.eval(`(state.lessons.find(x=>x.id==='${id}')||null)`);

  console.log('[1] YARIM BIRAKAN: 1 uye pasif -> planli derslerden cikar, YAPILMIS ders degismez');
  seed();
  w.eval(`removeMemberFromMonth('m4','${CM}')`);
  t('planli Lp1 uyeleri 3 kisi (m4 cikti)', L('Lp1').memberIds.join(',')==='m1,m2,m3', L('Lp1').memberIds.join(','));
  t('planli Lp2 uyeleri 3 kisi', L('Lp2').memberIds.length===3);
  t('YAPILMIS Ldone AYNEN 4 kisi (tarihsel korunur)', L('Ldone').memberIds.length===4);
  t('GECMIS AY dersi Lprev DEGISMEDI (ay izolasyonu)', L('Lprev').memberIds.length===4);
  t('dersler silinmedi (kadroda 3 aktif var)', !!L('Lp1') && !!L('Lp2'));

  console.log('[2] MODAL LISTESI: ayrilan uye ISMIYLE listede, TIKSIZ, "ayrıldı" rozetli');
  w.eval(`renderGroupLessonMembers(state.lessons.find(x=>x.id==='Lp2'))`);
  const rowFor = (mid)=>{ const inp=d.querySelector(`#gl-members input[value="${mid}"]`); return inp?{checked:inp.checked,label:inp.closest('label').textContent}:null; };
  const r4=rowFor('m4');
  t('ayrilan m4 listede GORUNUYOR', !!r4);
  t('m4 TIKSIZ', r4 && r4.checked===false);
  t("m4 'ayrıldı' rozetli", r4 && /ayrıldı/.test(r4.label), r4&&r4.label);
  const r1=rowFor('m1');
  t('kalan m1 TIKLI', r1 && r1.checked===true);

  console.log('[3] TUM GRUP PASIF: kalan 3 uye de pasif -> planli grup dersleri SILINIR, yapilmis KALIR');
  w.eval(`removeMemberFromMonth('m1','${CM}'); removeMemberFromMonth('m2','${CM}'); removeMemberFromMonth('m3','${CM}')`);
  t('planli Lp1 SILINDI', L('Lp1')===null);
  t('planli Lp2 SILINDI', L('Lp2')===null);
  t('YAPILMIS Ldone kaldi (4 tikli, tarihsel)', !!L('Ldone') && L('Ldone').memberIds.length===4);
  t('GECMIS AY Lprev kaldi (izolasyon)', !!L('Lprev') && L('Lprev').memberIds.length===4);

  console.log('[4] BIREYSEL PASIF: planli dersleri SILINIR (cancelled degil, YOK), yapilmis kalir');
  w.eval(`removeMemberFromMonth('m5','${CM}')`);
  t('bireysel planli Bp1 SILINDI', L('Bp1')===null);
  t('bireysel planli Bp2 SILINDI', L('Bp2')===null);
  t('bireysel YAPILMIS Bdone kaldi', !!L('Bdone') && L('Bdone').memberIds.length===1);

  console.log('[5] YERINE ALMA: katilim tarihi yazilir; onceki ders TIKSIZ, sonraki TIKLI');
  seed();
  // m4 ayrilir, slotu bosaltilir (grup detay "bu aydan cikart" akisi), yerine m6 alinir
  w.eval(`removeMemberFromMonth('m4','${CM}')`);
  w.eval(`applyRosterChange(state.groups[0],'${CM}', mids => mids.map(x => x==='m4' ? '' : x))`);
  w.eval(`assignMemberToSlot('m6','g1',3)`);
  const jd = w.eval(`state.groups[0].memberJoinDates['m6']||''`);
  t('KATILIM TARIHI yazildi (bugun)', jd===TODAY, jd);
  t('DUNKU planli derste (Lp1) m6 YOK', L('Lp1') && !L('Lp1').memberIds.includes('m6'), L('Lp1')&&L('Lp1').memberIds.join(','));
  t('YARINKI planli derste (Lp2) m6 VAR (otomatik tik)', L('Lp2') && L('Lp2').memberIds.includes('m6'), L('Lp2')&&L('Lp2').memberIds.join(','));
  t('yapilmis Ldone m6 EKLENMEDI (tarihsel)', !L('Ldone').memberIds.includes('m6'));
  t('gecmis ay Lprev m6 EKLENMEDI (izolasyon)', !L('Lprev').memberIds.includes('m6'));
  // modalda: dunku derste m6 ISMI gorunur ama tiksiz (katilim oncesi)
  w.eval(`renderGroupLessonMembers(state.lessons.find(x=>x.id==='Lp1'))`);
  const r6=rowFor('m6');
  t('dunku ders modalinda m6 listede ve TIKSIZ (katilim oncesi)', r6 && r6.checked===false, r6&&JSON.stringify(r6.checked));

  console.log('[6] MIGRATION SUPURME: olu dersler gider, iskelet/tarihsel kalir');
  const mig = {
    settings:{}, instructors:[], payments:[], packageTypes:[], campaigns:[], waTemplates:[],
    members:[ Object.assign(mkMember('x1','AKTIF'),{}), Object.assign(mkMember('x2','PASIF'),{archived:true, archivedAt:'2026-06-01'}) ],
    groups:[ {id:'gd',name:'OLU GRUP',size:2,memberIds:['x2'],monthlyMembers:{},packages:[]},
             {id:'gs',name:'ISKELET',size:2,memberIds:['x1'],monthlyMembers:{},packages:[]} ],
    lessons:[
      {id:'D1',date:'2026-07-10',time:'10:00',status:'planned',groupId:'gd',size:2,memberIds:[],packageMonth:'2026-07'},   // olu grup planli -> SIL
      {id:'D2',date:'2026-07-11',time:'10:00',status:'cancelled',memberIds:[],packageMonth:'2026-07'},                      // bos iptal -> SIL
      {id:'D3',date:'2026-07-12',time:'10:00',status:'planned',memberIds:[],packageMonth:'2026-07'},                        // bos bireysel planli -> SIL
      {id:'D4',date:'2026-07-13',time:'10:00',status:'planned',groupId:'gs',size:2,memberIds:[],packageMonth:'2026-07'},   // iskelet: kadro DOLU -> KALIR (reconcile doldurur)
      {id:'D5',date:'2026-07-14',time:'10:00',status:'done',groupId:'gd',size:2,memberIds:['x2'],packageMonth:'2026-07'},  // tarihsel -> KALIR
      {id:'D6',date:'2026-07-15',time:'10:00',status:'cancelled',groupId:'gd',size:2,memberIds:['x2'],packageMonth:'2026-07'} // uyeli iptal -> KALIR
    ]
  };
  const out = w.eval(`(function(){ const s=${JSON.stringify(mig)}; applyV10MigrationToState(s); return s.lessons.map(l=>l.id).sort().join(','); })()`);
  t('D1/D2/D3 silindi; D4/D5/D6 kaldi', out==='D4,D5,D6', out);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
