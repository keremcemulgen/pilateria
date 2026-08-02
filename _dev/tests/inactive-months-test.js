// v45 — AY-BAZLI PASIFLIK: pasife alinan uye o aydan itibaren gizli, aktive edilen aydan itibaren geri.
// 2026-08-02 guncelleme: tarih-dayaniklilik (aylar calisma aninda: P2=iki once, P1=bir once, CM=bu ay) +
// aktive etme KANONIK UI yolu olan reactivateMemberForMonth ile test edilir (arsiv sayfasinin dugmesi bu;
// ROSTER_START_MONTH doneminde enrolled:true'yu da yazar — v58 kanonu).
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
  w.eval('window.S=()=>state;');
  w.eval("['renderDashboard','renderCalendar','renderGroups','renderMembers','refreshMemberDetailIfOpen','refreshGroupDetailIfOpen'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const P1 = w.eval("prevMonthISO(currentMonth())");
  const P2 = w.eval("prevMonthISO(prevMonthISO(currentMonth()))");
  // Senaryo: uye P2'de katildi, P1'de pasife alindi, CM'de (bu ay) aktive edilecek.
  w.eval(`
    state.members=[
      {id:'pB',name:'PASIF BIREY',joinDate:'${P2}-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:4000,archived:true,archivedAt:'${P1}-20T09:00:00',archivedReason:'manual-delete'},
      {id:'pG',name:'PASIF GRUPCU',joinDate:'${P2}-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:4000,archived:true,archivedAt:'${P1}-20T09:00:00'},
      {id:'ok1',name:'NORMAL UYE',joinDate:'${P2}-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:4000}
    ];
    state.groups=[{id:'gp',name:'GRUP',size:2,memberIds:['pG','ok1'],packages:[],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[]; state.payments=[];
  `);

  console.log('[1] PASIFKEN: pasife alindigi aydan itibaren gorunmez, oncesinde gorunur');
  t('bireysel: pasif ayinda (P1) YOK', !w.buildMemberRows(P1).some(r=>r.memberId==='pB'));
  t('grup uyesi: P1 de bos slot', !w.buildMemberRows(P1).some(r=>r.memberId==='pG'));
  t('P2 de (pasiflikten once) VAR', w.buildMemberRows(P2).some(r=>r.memberId==='pB'));
  t('bu ay (CM) da YOK (hala pasif)', !w.buildMemberRows(CM).some(r=>r.memberId==='pB'));

  console.log('[2] BU AY AKTIVE ET (arsiv sayfasi yolu) -> CM den itibaren doner, P1 pasifligi SABIT');
  w.reactivateMemberForMonth('pB', CM);
  w.reactivateMemberForMonth('pG', CM);
  const pB = w.S().members.find(x=>x.id==='pB');
  t('artik aktif', pB.archived === false);
  t('donem kaydi olustu (P1 -> CM)', (pB.archivePeriods||[]).some(p=>p.from===P1&&p.to===CM), JSON.stringify(pB.archivePeriods));
  t('P1 de HALA GOZUKMUYOR (tarih sabit!)', !w.buildMemberRows(P1).some(r=>r.memberId==='pB'));
  t('grup uyesi de P1 de hala bos slot', !w.buildMemberRows(P1).some(r=>r.memberId==='pG'));
  t('BU AY GORUNUYOR (derse alinabilir)', w.buildMemberRows(CM).some(r=>r.memberId==='pB'));
  t('grup uyesi bu ay slotuna geri geldi', w.buildMemberRows(CM).some(r=>r.memberId==='pG'));
  t('P2 etkilenmedi', w.buildMemberRows(P2).some(r=>r.memberId==='pB'));

  console.log('[3] PASIF LISTESI (v43 ay-bazli): secili ayda pasif uye gorunur, aktif ayda gorunmez');
  d.getElementById('archive-month').value = P1;
  w.renderArchive();
  t('P1 secilince pasif uye pasif sekmesinde gorunuyor', d.getElementById('archive-tbody').innerHTML.includes('PASIF BIREY'));
  d.getElementById('archive-month').value = CM;
  w.renderArchive();
  t('CM secilince (o ay aktif) pasif sekmesinde YOK', !d.getElementById('archive-tbody').innerHTML.includes('PASIF BIREY'));

  console.log('[4] Kanonlar: P1 beklenen gelirde pasif uye SAYILMAZ, CM de sayilir');
  t('P1 enrolled=false', !w.isMemberEnrolledInMonth('pB',P1));
  t('CM enrolled=true', w.isMemberEnrolledInMonth('pB',CM));

  console.log('[5] Ikinci tur: CM de TEKRAR pasife al -> CM den itibaren gizli, P1 donemi ayri durur');
  w.eval(`const m=state.members.find(x=>x.id==='pB'); m.archived=true; m.archivedAt='${CM}-13T10:00:00';`);
  t('CM de yine YOK', !w.buildMemberRows(CM).some(r=>r.memberId==='pB'));
  t('gecmis donem kaydi DURUYOR', (w.S().members.find(x=>x.id==='pB').archivePeriods||[]).length === 1);
  t('P2 hala etkilenmedi', w.buildMemberRows(P2).some(r=>r.memberId==='pB'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
