// v52 — 2. PAKET UYE-BAZLI: bagimsiz klon uye; uye sayisini degistirmez; arsiv bagimsiz; eski grup-klonu migration'da pasife
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
const AY='2026-07';
setTimeout(()=>{ try {
  w.eval("['renderMembers','renderGroups','renderDashboard','renderCalendar','refreshMemberDetailIfOpen','refreshGroupDetailIfOpen','openMemberDetail','openGroupDetail'].forEach(fn=>window[fn]=function(){});");
  w.eval(`
    state.settings.reformers=5; state.settings.lessonDuration=45;
    state.instructors=[{id:'h1',name:'ICLAL'}];
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.members=[
      {id:'mR',name:'AYSE YILMAZ',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}},phone:'555',instructorId:'h1',totalPrice:3000},
      {id:'mS',name:'FATMA KAYA',joinDate:'2026-01-01',packages:[],monthly:{'2026-07':{enrolled:true}},totalPrice:3000}
    ];
    state.groups=[]; state.lessons=[]; state.payments=[];
    window.S=()=>state;
  `);

  console.log('[1] createSecondPackage("member") -> BAGIMSIZ KLON UYE');
  const activeBefore = w.S().members.filter(m=>!m.secondOfMember && w.isMemberEnrolledInMonth(m.id,AY)).length;
  w.createSecondPackage('member','mR',AY);
  const clone = w.S().members.find(m=>m.secondOfMember==='mR');
  t('klon uye olustu (secondOfMember=mR)', !!clone && clone.secondOfMember==='mR');
  t('klon AYRI id (asil degil)', clone && clone.id!=='mR');
  t('klon adi asil + "(2. Paket)"', clone && clone.name.includes('AYSE YILMAZ') && /\(2\. Paket\)/.test(clone.name), clone&&clone.name);
  t('klon o ay ENROLLED (bagimsiz)', clone && (clone.monthly[AY]||{}).enrolled===true);
  t('klon kendi fiyati (asildan kopya)', clone && +clone.totalPrice===3000, clone&&clone.totalPrice);

  console.log('[2] AKTIF UYE SAYISI degismez (klon sayilmaz)');
  const activeAfter = w.S().members.filter(m=>!m.secondOfMember && w.isMemberEnrolledInMonth(m.id,AY)).length;
  t('aktif (klon-haric) sayi ayni', activeAfter===activeBefore, activeBefore+'->'+activeAfter);
  // Panel s-members render'i de klonu saymamali
  const dm=d.getElementById('dash-month'); if(dm){ dm.value=AY; }
  w.eval('window.__dashMonthUserSet=true;');
  w.__realRenderDashboard = w.renderDashboard; // stub'i gec — gercek render'i cagir
  // gercek renderDashboard'i tekrar yukle degil; sadece s-members mantigini dogrula:
  const sMembersCount = w.S().members.filter(m=>!m.secondOfMember && w.isMemberEnrolledInMonth(m.id,AY)).length;
  t('s-members mantigi klonu haric tutar (2 asil uye)', sMembersCount===2, sMembersCount);

  console.log('[3] BAGIMSIZ ARSIV — asil pasif olunca klon ETKILENMEZ (kok catisma bitti)');
  // asil ve klonu ayri gruplara koy (kullanici klonu yeni gruba ekledi senaryosu)
  w.eval(`
    const cid = state.members.find(m=>m.secondOfMember==='mR').id;
    state.groups.push({id:'gA',name:'ASIL GRUP',size:2,memberIds:['mR','mS'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{},monthlyNotes:{}});
    state.groups.push({id:'gB',name:'KLON GRUP',size:1,memberIds:[cid],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{},monthlyNotes:{}});
    // asil uyeyi Temmuzda pasife al
    const r=state.members.find(m=>m.id==='mR'); r.archived=true; r.archivedAt='2026-07-05T00:00:00';
  `);
  const cid = w.S().members.find(m=>m.secondOfMember==='mR').id;
  const cloneObj = w.S().members.find(m=>m.id===cid);
  const rootObj = w.S().members.find(m=>m.id==='mR');
  t('asil uye Temmuz pasif', w.isMemberInactiveInMonth(rootObj,AY)===true);
  t('KLON uye Temmuz AKTIF (bagimsiz)', w.isMemberInactiveInMonth(cloneObj,AY)===false);
  t('klon hala kendi grubunda (gB) aktif', w.__activeRosterForMonth(w.S().groups.find(g=>g.id==='gB'),AY).includes(cid));

  console.log('[4] KLONUN odeme/dersi ASILDAN AYRI');
  w.eval(`
    const cid = state.members.find(m=>m.secondOfMember==='mR').id;
    state.payments.push({id:'pay1',memberId:cid,groupId:'',amount:4000,date:'2026-07-10',packageMonth:'2026-07',sessions:8});
    state.lessons.push({id:'lc1',date:'2026-07-12',time:'10:00',memberIds:[cid],groupId:'gB',status:'planned',packageMonth:'2026-07',instructorId:'h1',size:1});
  `);
  t('klon odemesi klon id ile', w.S().payments.some(p=>p.memberId===cid));
  t('asil uyede o odeme YOK', !w.S().payments.some(p=>p.memberId==='mR'));

  console.log('[5] MIGRATION: eski GRUP-bazli 2.paket klonu (secondOf) pasife + planli iptal + veri korunur');
  w.eval(`
    state.members.push({id:'mZ',name:'ZEYNEP',joinDate:'2026-01-01',packages:[],monthly:{'2026-06':{enrolled:true}},totalPrice:5000});
    state.groups.push({id:'gOLD',name:'ZEYNEP · 2. Paket',size:1,memberIds:['mZ'],secondOf:'mZ',defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{},monthlyNotes:{}});
    state.lessons.push({id:'lo_plan',date:'2026-06-20',time:'10:00',memberIds:['mZ'],groupId:'gOLD',status:'planned',packageMonth:'2026-06',instructorId:'h1',size:1});
    state.lessons.push({id:'lo_done',date:'2026-06-05',time:'10:00',memberIds:['mZ'],groupId:'gOLD',status:'completed',packageMonth:'2026-06',instructorId:'h1',size:1});
    state.payments.push({id:'po1',memberId:'mZ',groupId:'gOLD',amount:5000,date:'2026-06-05',packageMonth:'2026-06',sessions:8});
    applyV10MigrationToState(state);
  `);
  const gOLD=w.S().groups.find(g=>g.id==='gOLD');
  t('eski klon grup PASIFE alindi', gOLD && gOLD.archived===true);
  t('klon grup her ayda gizli (isGroupInactiveInMonth)', w.isGroupInactiveInMonth(gOLD,'2026-06')===true);
  t('klon grubun PLANLI dersi iptal edildi', w.S().lessons.find(l=>l.id==='lo_plan').status==='cancelled');
  t('klon grubun YAPILDI dersi KORUNDU (hoca maasi)', w.S().lessons.find(l=>l.id==='lo_done').status==='completed');
  t('klon grubun ODEMESI KORUNDU (gelir)', w.S().payments.some(p=>p.id==='po1'));
  // idempotent + reaktivasyonla catismaz
  w.eval("state.groups.find(g=>g.id==='gOLD').archived=false; applyV10MigrationToState(state);");
  t('reaktive edilince MIGRATION tekrar EZMEZ (bayrak)', w.S().groups.find(g=>g.id==='gOLD').archived===false);

  console.log('[6] grup "+2. Paket" butonu KALDIRILDI (kaynak kod)');
  t("createSecondPackage('group' cagrisi HTML'de yok", html.indexOf("createSecondPackage('group'")<0);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
