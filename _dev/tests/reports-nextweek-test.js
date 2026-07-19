// v50 — DERS PROGRAMI RAPORU (uye/grup, WhatsApp kopyalanabilir) + GELECEK HAFTA GIRILMEMIS paneli
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
setTimeout(()=>{ try {
  // Tarihler uygulamanin KENDI fonksiyonlariyla — gercek "bugun"e gore gelecek hafta penceresi
  w.eval(`
    window.__cm  = currentMonth();
    window.__ws  = startOfWeek(0);
    window.__nx1 = isoDate(addDays(window.__ws, 7));   // gelecek Pzt (pencere ICI)
    window.__nx2 = isoDate(addDays(window.__ws, 9));   // gelecek Car (pencere ICI)
    window.__tw  = isoDate(addDays(window.__ws, 1));   // BU hafta Sal (pencere DISI)
  `);
  const cm = w.__cm, nx1 = w.__nx1, nx2 = w.__nx2, tw = w.__tw;

  w.eval(`
    const cm = window.__cm, nx1 = window.__nx1, tw = window.__tw;
    state.settings.instructorShareRate = 30;
    state.instructors.push({id:'h1',name:'BUSE'});
    state.packageTypes.push({id:'p8',name:'8 Ders',sessions:8,price:8000});
    function MK(id,name,extra){ return Object.assign({id,name,joinDate:'2020-01-01',packages:[],monthly:{[cm]:{enrolled:true}},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:2000}, extra||{}); }
    state.members.push(
      MK('mSolo1','SOLO BIR'),          // bireysel, dersi YOK  -> missing
      MK('mSolo2','SOLO IKI'),          // bireysel, gelecek hafta dersi VAR -> missing DEGIL
      MK('mg1a','G1 UYE A'), MK('mg1b','G1 UYE B'),  // G1 kadrosu
      MK('mg2a','G2 UYE A'), MK('mg2b','G2 UYE B'),  // G2 kadrosu
      MK('mg3a','G3 UYE A'), MK('mg3b','G3 UYE B')   // G3 (arsiv) kadrosu
    );
    function GRP(id,name,mids,extra){ return Object.assign({id,name,size:mids.length,memberIds:mids,defaultInstructorId:'h1',defaultPackageId:'p8',defaultTime:'10:00',defaultDays:[2],packages:[],rescheduleUsed:0,cancelUsed:0,customTotalPrice:8000,note:'',monthlyNotes:{}}, extra||{}); }
    state.groups.push(
      GRP('G1','SABAH GRUBU',['mg1a','mg1b']),                 // dersi YOK (gelecek hafta) -> missing
      GRP('G2','OGLE GRUBU',['mg2a','mg2b']),                  // gelecek hafta dersi VAR -> missing DEGIL
      GRP('G3','ESKI GRUP',['mg3a','mg3b'],{archived:true,archivedAt:cm+'-01T00:00:00'})  // pasif -> missing DEGIL
    );
    let __ln=0; const L=(o)=>{ o.id='L'+(++__ln); o.instructorId=o.instructorId||'h1'; state.lessons.push(o); };
    // G1: BU hafta dersi var + gelecek hafta IPTAL dersi var => yine de "girilmemis" sayilmali
    L({groupId:'G1',memberIds:['mg1a','mg1b'],date:tw ,time:'10:00',status:'planned',  packageMonth:cm});
    L({groupId:'G1',memberIds:['mg1a','mg1b'],date:nx1,time:'10:00',status:'cancelled',packageMonth:cm}); // iptal sayilmaz
    // G2: gelecek hafta GECERLI ders => missing DEGIL
    L({groupId:'G2',memberIds:['mg2a','mg2b'],date:nx1,time:'11:00',status:'planned',  packageMonth:cm});
    // mSolo2: gelecek hafta bireysel ders => missing DEGIL
    L({memberIds:['mSolo2'],date:nx1,time:'12:00',status:'planned',packageMonth:cm});
    applyV10MigrationToState(state);
    window.S=()=>state;
  `);

  console.log('[1] getNextWeekMissing — gelecek hafta ders GIRILMEMIS grup/uye tespiti');
  const nwm = w.getNextWeekMissing();
  const gids = nwm.groups.map(g=>g.id), mids = nwm.members.map(m=>m.id);
  t('G1 (dersi yok) missing.groups ICINDE', gids.includes('G1'), gids.join(','));
  t('G2 (gelecek hafta dersi var) missing.groups DEGIL', !gids.includes('G2'));
  t('G3 (pasif grup) missing.groups DEGIL', !gids.includes('G3'));
  t('iptal ders sayilmaz — G1 hala eksik listede', gids.includes('G1'));
  t('mSolo1 (dersi yok) missing.members ICINDE', mids.includes('mSolo1'), mids.join(','));
  t('mSolo2 (gelecek hafta dersi var) missing.members DEGIL', !mids.includes('mSolo2'));
  t('grup uyesi (mg1a) bireysel missing DEGIL (grup icinde sayilir)', !mids.includes('mg1a'));
  t('pencere baslangici = gelecek hafta Pzt', w.isoDate(nwm.start)===nx1, w.isoDate(nwm.start)+' vs '+nx1);

  console.log('[2] renderNextWeekMissing — panel DOM + kopyalanabilir metin');
  w.renderNextWeekMissing();
  const nwmText = w.__nwmText || '';
  t('kopya metni G1 adini icerir', nwmText.includes('SABAH GRUBU'));
  t('kopya metni mSolo1 adini icerir', nwmText.includes('SOLO BIR'));
  t('kopya metni G2 (dersi var) adini ICERMEZ', !nwmText.includes('OGLE GRUBU'));
  t('kopya metni mSolo2 (dersi var) adini ICERMEZ', !nwmText.includes('SOLO IKI'));
  const nwmCount = (d.getElementById('nwm-count')||{}).textContent || '';
  t('sayac metni canli hesapla uyumlu', nwmCount.includes(nwm.groups.length+' grup') && nwmCount.includes(nwm.members.length+' üye'), nwmCount);
  const listHtml = (d.getElementById('nextweek-missing-list')||{}).innerHTML || '';
  t('panelde "Ders Gir" hizli aksiyonu var', listHtml.includes('Ders Gir') || listHtml.includes('openGroupDetail'));

  console.log('[3] buildMemberLessonReport — uye ders programi metni');
  w.eval(`
    const cm = window.__cm;
    state.members.push({id:'mRep',name:'RAPOR UYE',joinDate:'2020-01-01',packages:[],monthly:{[cm]:{enrolled:true}},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000});
    let __r=0; const R=(o)=>{ o.id='R'+(++__r); state.lessons.push(o); };
    R({memberIds:['mRep'],date:cm+'-05',time:'10:00',status:'completed',packageMonth:cm,instructorId:'h1'});
    R({memberIds:['mRep'],date:cm+'-12',time:'11:00',status:'planned',  packageMonth:cm,instructorId:'h1'});
    R({memberIds:['mRep'],date:cm+'-15',time:'19:45',status:'cancelled',packageMonth:cm,instructorId:'h1'}); // rapora GIRMEZ
  `);
  const rep = w.buildMemberLessonReport('mRep', cm);
  t('rapor uye adini icerir', rep.includes('RAPOR UYE'));
  t('yapilan ders satiri var (05)', rep.includes(w.bdFmtDate(cm+'-05')));
  t('planli ders satiri var (12)', rep.includes(w.bdFmtDate(cm+'-12')));
  t('IPTAL ders rapora GIRMEZ (19:45 yok)', !rep.includes('19:45'));
  t('ozet: toplam 2 ders (iptal haric)', rep.includes('Toplam 2 ders'), rep.split('\n').pop());
  t('ozet: 1 yapildi', rep.includes('1 yapıldı'));
  t('ozet: 1 planli', rep.includes('1 planlı'));

  console.log('[4] buildGroupLessonReport — grup ders programi metni (temiz grup)');
  w.eval(`
    const cm = window.__cm;
    // Temiz rapor grubu — kurulum dersi yok, tam olarak 2 gecerli + 1 iptal ders
    function MK2(id,name){ return {id,name,joinDate:'2020-01-01',packages:[],monthly:{[cm]:{enrolled:true}},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:2000}; }
    state.members.push(MK2('mgRa','GR UYE A'), MK2('mgRb','GR UYE B'));
    state.groups.push({id:'gRep',name:'RAPOR GRUBU',size:2,memberIds:['mgRa','mgRb'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultTime:'10:00',defaultDays:[2],packages:[],rescheduleUsed:0,cancelUsed:0,customTotalPrice:8000,note:'',monthlyNotes:{}});
    let __rg=0; const RG=(o)=>{ o.id='RG'+(++__rg); state.lessons.push(o); };
    RG({groupId:'gRep',memberIds:['mgRa','mgRb'],date:cm+'-07',time:'10:00',status:'completed',packageMonth:cm,instructorId:'h1'});
    RG({groupId:'gRep',memberIds:['mgRa','mgRb'],date:cm+'-14',time:'10:00',status:'planned',  packageMonth:cm,instructorId:'h1'});
    RG({groupId:'gRep',memberIds:['mgRa','mgRb'],date:cm+'-21',time:'10:00',status:'cancelled',packageMonth:cm,instructorId:'h1'}); // rapora GIRMEZ
  `);
  const grep2 = w.buildGroupLessonReport('gRep', cm);
  t('grup raporu grup adini icerir', grep2.includes(w.groupDisplayName(w.S().groups.find(g=>g.id==='gRep'), cm)));
  t('grup raporu: toplam 2 ders (iptal haric)', grep2.includes('Toplam 2 ders'), grep2.split('\n').pop());
  t('grup raporu: 1 yapildi · 1 planli', grep2.includes('1 yapıldı') && grep2.includes('1 planlı'));

  console.log('[5] openScheduleReport — modal doldurma (uye + grup)');
  w.openScheduleReport('member','mRep',cm);
  t('sr-text = buildMemberLessonReport ciktisiyla AYNI', d.getElementById('sr-text').textContent === w.buildMemberLessonReport('mRep',cm));
  t('sr-title uye adini icerir', d.getElementById('sr-title').textContent.includes('RAPOR UYE'));
  w.openScheduleReport('group','G1',cm);
  t('sr-text = buildGroupLessonReport ciktisiyla AYNI', d.getElementById('sr-text').textContent === w.buildGroupLessonReport('G1',cm));

  console.log('[6] Bos durum — hicbiri eksik degilse kutlama mesaji');
  // Halen eksik olan TUM aktif grup+bireysellere gelecek hafta dersi ekle => liste bosalmali
  const miss = w.getNextWeekMissing();
  w.eval(`
    const nx2=window.__nx2, cm=window.__cm;
    const gg=${JSON.stringify(miss.groups.map(g=>g.id))};
    const mm=${JSON.stringify(miss.members.map(m=>m.id))};
    gg.forEach((gid,i)=>{ const g=state.groups.find(x=>x.id===gid); state.lessons.push({id:'FG'+i,groupId:gid,memberIds:(g.memberIds||[]),date:nx2,time:'10:00',status:'planned',packageMonth:cm,instructorId:'h1'}); });
    mm.forEach((mid,i)=>state.lessons.push({id:'FM'+i,memberIds:[mid],date:nx2,time:'09:00',status:'planned',packageMonth:cm,instructorId:'h1'}));
  `);
  const nwm2 = w.getNextWeekMissing();
  t('artik eksik grup yok', nwm2.groups.length===0, nwm2.groups.map(g=>g.id).join(','));
  t('artik eksik bireysel yok', nwm2.members.length===0, nwm2.members.map(m=>m.id).join(','));
  w.renderNextWeekMissing();
  t('bos durumda kutlama metni', (w.__nwmText||'').includes('planlı') && (d.getElementById('nextweek-missing-list').innerHTML||'').includes('🎉'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
