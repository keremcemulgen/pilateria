// v24 — AY BAZLI PASIFLIK: Kerem senaryosu birebir
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
  // Bugun: 2026-07 (sistem). Senaryo: uye Haziran'da pasife alindi, Temmuz'da aktive edilecek.
  w.eval(`
    state.members.push(
      {id:'pB',name:'PASIF BIREY',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:4000,archived:true,archivedAt:'2026-06-20T09:00:00',archivedReason:'manual-delete'},
      {id:'pG',name:'PASIF GRUPCU',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:4000,archived:true,archivedAt:'2026-06-20T09:00:00'},
      {id:'ok1',name:'NORMAL UYE',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:4000}
    );
    state.groups.push({id:'gP',name:'GRUP',size:2,memberIds:['pG','ok1'],defaultInstructorId:'',defaultPackageId:'',defaultTime:'',defaultDays:[],packages:[],rescheduleUsed:0,cancelUsed:0});
    window.S=()=>state;
  `);

  console.log('[1] HAZIRANDA PASIF -> Haziran listesinde GOZUKMEZ (sikayetin kendisi)');
  t('bireysel: Haziranda YOK', !w.buildMemberRows('2026-06').some(r=>r.memberId==='pB'));
  t('grup uyesi: Haziranda bos slot', !w.buildMemberRows('2026-06').some(r=>r.memberId==='pG'));
  t('Mayista (pasiflikten once) VAR', w.buildMemberRows('2026-05').some(r=>r.memberId==='pB'));
  t('Temmuzda da YOK (hala pasif)', !w.buildMemberRows('2026-07').some(r=>r.memberId==='pB'));

  console.log('[2] TEMMUZDA AKTIVE ET -> Temmuzdan itibaren doner, HAZIRAN PASIFLIGI SABIT');
  w.eval(`unarchiveMember('pB'); unarchiveMember('pG'); save();`);
  const pB = w.S().members.find(x=>x.id==='pB');
  t('artik aktif', pB.archived === false);
  t('donem kaydi olustu (2026-06 -> 2026-07)', (pB.archivePeriods||[]).some(p=>p.from==='2026-06'&&p.to==='2026-07'), JSON.stringify(pB.archivePeriods));
  t('HAZIRANDA HALA GOZUKMUYOR (tarih sabit!)', !w.buildMemberRows('2026-06').some(r=>r.memberId==='pB'));
  t('grup uyesi de Haziranda hala bos slot', !w.buildMemberRows('2026-06').some(r=>r.memberId==='pG'));
  t('TEMMUZDA GORUNUYOR (derse alinabilir)', w.buildMemberRows('2026-07').some(r=>r.memberId==='pB'));
  t('grup uyesi Temmuzda slotuna geri geldi', w.buildMemberRows('2026-07').some(r=>r.memberId==='pG'));
  t('Mayis etkilenmedi', w.buildMemberRows('2026-05').some(r=>r.memberId==='pB'));

  console.log('[3] PASIF LISTESI (v43 ay-bazli): secili ayda pasif uye gorunur, aktif ayda gorunmez');
  d.getElementById('archive-month').value = '2026-06';
  w.renderArchive();
  t('Haziran secilince pasif uye pasif sekmesinde gorunuyor', d.getElementById('archive-tbody').innerHTML.includes('PASIF BIREY'));
  d.getElementById('archive-month').value = '2026-07';
  w.renderArchive();
  t('Temmuz secilince (o ay aktif) pasif sekmesinde YOK', !d.getElementById('archive-tbody').innerHTML.includes('PASIF BIREY'));

  console.log('[4] Kanonlar: Haziran beklenen gelirde pasif uye SAYILMAZ, Temmuzda sayilir');
  t('Haziran enrolled=false', !w.isMemberEnrolledInMonth('pB','2026-06'));
  t('Temmuz enrolled=true', w.isMemberEnrolledInMonth('pB','2026-07'));

  console.log('[5] Ikinci tur: Temmuzda TEKRAR pasife al -> Temmuzdan itibaren gizli, Haziran donemi ayri durur');
  w.eval(`const m=state.members.find(x=>x.id==='pB'); m.archived=true; m.archivedAt='2026-07-13T10:00:00';`);
  t('Temmuzda yine YOK', !w.buildMemberRows('2026-07').some(r=>r.memberId==='pB'));
  t('gecmis donem kaydi DURUYOR', (w.S().members.find(x=>x.id==='pB').archivePeriods||[]).length === 1);
  t('Mayis hala etkilenmedi', w.buildMemberRows('2026-05').some(r=>r.memberId==='pB'));

  console.log('\\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
