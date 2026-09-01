// v167 — YENI AY HAZIRLIGI (Kerem, secenek 2; 2026-09-01): ay gecisi TEK EKRANDA. Hedef ay T icin kaynak
// ay S=T-1'in birimleri (S'te aktif klon-olmayan gruplar + gruba dahil olmayan klon-olmayan bireysel
// uyeler) listelenir; her birim icin T durumu ve ▶ Devam / 📌 Uzadi / ⏸ Pasif islemleri; "Bekleyenlerin
// hepsi devam etsin" toplu islemi; her adim v165 Geri Al ile geri alinir. removeMemberFromMonth ve
// mark*PackageExtended cekirdek/kabuk ayrimi davranisi DEGISTIRMEZ. Yamasiz build'de FAIL etmeli.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ const m=String((o&&o.msg)||''); w.__msgs.push(m); return o&&o.input?'sarkti notu':true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return true; }; w.prompt=()=>'not'; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
function st(kind,id){ const r=d.querySelector('#month-prep-body .prep-row[data-kind="'+kind+'"][data-id="'+id+'"]'); return r ? r.getAttribute('data-status') : null; }
function rowTxt(kind,id){ const r=d.querySelector('#month-prep-body .prep-row[data-kind="'+kind+'"][data-id="'+id+'"]'); return r ? r.textContent.replace(/\s+/g,' ') : ''; }
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','renderArchive'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const PM = shiftM(CM,-1), NM = shiftM(CM,+1);
  function fixture(){
    w.eval(`
      state.settings.reformers=10;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[
        {id:'a1',name:'AYSE GRUP',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true,totalPrice:0,__extZero:true}}},
        {id:'a2',name:'ASLI GRUP',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'b1',name:'BERIL TEK',joinDate:'2026-01-01',totalPrice:8500,packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:7000,status:'active'}],monthly:{'${CM}':{enrolled:true,totalPrice:7000}}},
        {id:'c1',name:'CEREN TEK',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'e1',name:'AYSE GRUP (2. Paket)',joinDate:'2026-01-01',secondOfMember:'a1',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'p1',name:'PINAR ESKI',joinDate:'2026-01-01',packages:[],monthly:{'${PM}':{enrolled:true}}}
      ];
      state.groups=[
        {id:'gA',name:'AYSE GRUP - ASLI GRUP',size:2,memberIds:['a1','a2'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:16000,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
        {id:'gClone',name:'AYSE GRUP (2. Paket)',size:2,memberIds:['e1'],secondOfGroup:'gA',pkgNo:2,defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-15',sessions:8,price:8000,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
        {id:'gPast',name:'PINAR ESKI',size:2,memberIds:['p1'],defaultPackageId:'p8',packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:8000,status:'active'}],monthlyMembers:{},monthlyNotes:{}}
      ];
      state.lessons=[];
      for (let i=1;i<=6;i++) state.lessons.push({id:'GL'+i,groupId:'gA',memberIds:['a1','a2'],date:'${CM}-'+String(i+1).padStart(2,'0'),time:'10:00',status:'completed',packageMonth:'${CM}',instructorId:'h1'});
      state.lessons.push({id:'GL7',groupId:'gA',memberIds:['a1','a2'],date:'${CM}-09',time:'10:00',status:'missed',packageMonth:'${CM}',instructorId:'h1'});
      state.lessons.push({id:'GL8',groupId:'gA',memberIds:['a1','a2'],date:'${CM}-28',time:'10:00',status:'planned',packageMonth:'${CM}',instructorId:'h1'});
      for (let i=1;i<=8;i++) state.lessons.push({id:'BL'+i,memberIds:['b1'],date:'${CM}-'+String(i+1).padStart(2,'0'),time:'12:00',status:'completed',packageMonth:'${CM}',instructorId:'h1'});
      state.payments=[];
      try { localStorage.removeItem('pilateria_undo'); __undoStack = []; } catch(e){}
    `);
    w.__msgs.length = 0;
  }
  const A = async (k,i,a) => { await w.prepAction(k,i,a); };

  console.log('[1] motor + pencere');
  t('openMonthPrep var', w.eval("typeof openMonthPrep")==='function', w.eval("typeof openMonthPrep"));
  t('prepAction / __prepUnits / cekirdekler var', ['prepAction','prepAllContinue','__prepUnits','__prepStatus','__removeMemberFromMonthCore','__groupPackageExtendCore','__memberPackageExtendCore'].every(f=>w.eval("typeof "+f)==='function'));
  if (w.eval("typeof openMonthPrep")!=='function') { console.log('\nSONUC: '+pass+' gecti, '+(fail+30)+' kaldi'); process.exit(1); }
  t('Uyeler aracinda dugme', !!d.querySelector('#month-prep-btn'));
  t('modal-month-prep var', !!d.getElementById('modal-month-prep'));
  fixture();
  w.openMonthPrep(NM);
  t('pencere acik', d.getElementById('modal-month-prep').classList.contains('open'));
  t('hedef ay secicisi '+NM, (d.getElementById('month-prep-month')||{}).value===NM);
  t('gA (grup) listede', st('group','gA')==='pending', st('group','gA'));
  t('b1, c1 (bireysel) listede', st('member','b1')==='pending' && st('member','c1')==='pending');
  t('klon uye e1 / klon grup gClone / gecmis grup gPast LISTEDE DEGIL', st('member','e1')===null && st('group','gClone')===null && st('group','gPast')===null && st('member','p1')===null);
  t('a1,a2 grup satirinda (bireysel olarak degil)', st('member','a1')===null && rowTxt('group','gA').indexOf('AYSE GRUP')!==-1 && rowTxt('group','gA').indexOf('ASLI GRUP')!==-1);
  t('ozet: 3 birim (1 grup · 2 bireysel)', (d.getElementById('month-prep-summary')||{}).textContent.indexOf('3 birim (1 grup · 2 bireysel)')!==-1, (d.getElementById('month-prep-summary')||{}).textContent);
  t('gA ders ozeti: 6/8 yapildi, 1 yandi, 1 planli', rowTxt('group','gA').indexOf('6/8 ders yapıldı, 1 yandı, 1 planlı')!==-1, rowTxt('group','gA'));

  console.log('[2] Devam (grup) — ayni kayit, kadro, uyeler '+NM+' listesinde');
  await A('group','gA','continue');
  t('a1,a2 '+NM+' kayitli', w.eval(`isMemberEnrolledInMonth('a1','${NM}') && isMemberEnrolledInMonth('a2','${NM}')`)===true);
  t('gA '+NM+' aktif kadrosu [a1,a2]', w.eval(`JSON.stringify(activeGroupRosterForMonth(state.groups.find(g=>g.id==='gA'),'${NM}'))`)==='["a1","a2"]');
  t('yeni grup ACILMADI', w.eval("state.groups.length")===3);
  t('durum: Devam ediyor', st('group','gA')==='active', st('group','gA'));
  t('a1 uzama 0 fiyati KOPYALANMADI', w.eval(`((state.members.find(m=>m.id==='a1').monthly||{})['${NM}']||{}).totalPrice`)===undefined);
  t('geri al etiketi', w.eval("(__undoStack[__undoStack.length-1]||{}).label||''").indexOf('Yeni ay — Devam')===0, w.eval("(__undoStack[__undoStack.length-1]||{}).label||''"));

  console.log('[3] Uzadi (bireysel) → Devam ile geri; Pasif (bireysel) → Devam ile geri');
  await A('member','b1','extend');
  t('b1 '+NM+' kayitli + paket extended 0 TL', w.eval(`isMemberEnrolledInMonth('b1','${NM}')`)===true && w.eval(`JSON.stringify(((state.members.find(m=>m.id==='b1').packages||[]).find(p=>p.month==='${NM}')||{}).status)`)==='"extended"' && w.eval(`((state.members.find(m=>m.id==='b1').monthly||{})['${NM}']||{}).totalPrice`)===0);
  t('durum: Paket uzadi', st('member','b1')==='extended', st('member','b1'));
  t('not penceresi soruldu', w.__msgs.some(m=>m.indexOf('Paket uzaması nedeni')!==-1));
  await A('member','b1','continue');
  t('Devam → paket aktif, fiyat uyenin fiyati (8500), 0 override silindi', w.eval(`JSON.stringify(((state.members.find(m=>m.id==='b1').packages||[]).find(p=>p.month==='${NM}')||{}).status)`)==='"active"' && w.eval(`((state.members.find(m=>m.id==='b1').packages||[]).find(p=>p.month==='${NM}')||{}).price`)===8500 && w.eval(`((state.members.find(m=>m.id==='b1').monthly||{})['${NM}']||{}).totalPrice`)===undefined, w.eval(`JSON.stringify((state.members.find(m=>m.id==='b1').monthly||{})['${NM}'])`));
  t('durum: Devam ediyor', st('member','b1')==='active');
  await A('member','c1','passive');
  t('c1 '+NM+' pasif (acik donem)', w.eval(`isMemberEnrolledInMonth('c1','${NM}')`)===false && w.eval(`JSON.stringify((state.members.find(m=>m.id==='c1').archivePeriods||[]).map(p=>p.from+'>'+p.to))`)===JSON.stringify([NM+'>null']));
  t('durum: Pasif', st('member','c1')==='passive', st('member','c1'));
  t('onay penceresi ACILMADI (cekirdek)', !w.__msgs.some(m=>m.indexOf('pasife alınacak')!==-1));
  await A('member','c1','continue');
  t('Devam → kayitli, donem kapandi', w.eval(`isMemberEnrolledInMonth('c1','${NM}')`)===true && w.eval("JSON.stringify(state.members.find(m=>m.id==='c1').archivePeriods||[])")==='[]');

  console.log('[4] Pasif (grup) → donem + uyeler cikar + planli dersler iptal; Devam ile geri');
  w.eval(`state.lessons.push({id:'GLN',groupId:'gA',memberIds:['a1','a2'],date:'${NM}-03',time:'10:00',status:'planned',packageMonth:'${NM}',instructorId:'h1'});`);
  await A('group','gA','passive');
  t('gA '+NM+' pasif (donem)', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='gA'),'${NM}')`)===true && w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='gA'),'${CM}')`)===false);
  t('a1,a2 '+NM+' cikarildi', w.eval(`!isMemberEnrolledInMonth('a1','${NM}') && !isMemberEnrolledInMonth('a2','${NM}')`)===true);
  t(NM+' planli grup dersi iptal/kalkti', w.eval("!state.lessons.some(l=>l.id==='GLN'&&l.status==='planned')")===true);
  t(CM+' dersleri DOKUNULMADI', w.eval(`state.lessons.filter(l=>l.groupId==='gA'&&l.packageMonth==='${CM}'&&l.status==='completed').length`)===6);
  t('durum: Pasif', st('group','gA')==='passive', st('group','gA'));
  await A('group','gA','continue');
  t('Devam → donem kalkti, uyeler kayitli', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='gA'),'${NM}')`)===false && w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='gA'),'${NM}').length`)===2);
  t('durum: Devam ediyor', st('group','gA')==='active');

  console.log('[5] Uzadi (grup) → uye override 0 (__extZero); Devam → fiyat varsayilana');
  await A('group','gA','extend');
  t('gA '+NM+' paketi extended 0 TL, uyeler __extZero', w.eval(`JSON.stringify(((state.groups.find(g=>g.id==='gA').packages||[]).find(p=>p.month==='${NM}')||{}).status)`)==='"extended"' && w.eval(`((state.members.find(m=>m.id==='a2').monthly||{})['${NM}']||{}).__extZero`)===true);
  t('durum: Paket uzadi', st('group','gA')==='extended');
  await A('group','gA','continue');
  t('Devam → paket aktif 16000? hayir: varsayilan paket fiyati (8000) — customTotalPrice yok', w.eval(`((state.groups.find(g=>g.id==='gA').packages||[]).find(p=>p.month==='${NM}')||{}).price`)===8000 && w.eval(`((state.members.find(m=>m.id==='a2').monthly||{})['${NM}']||{}).__extZero`)===undefined);

  console.log('[6] toplu: Bekleyenlerin hepsi devam + TEK geri al');
  fixture();
  w.openMonthPrep(NM);
  w.prepAllContinue();
  t('hepsi Devam', st('group','gA')==='active' && st('member','b1')==='active' && st('member','c1')==='active', [st('group','gA'),st('member','b1'),st('member','c1')].join(','));
  t('b1 fiyat override kopyalandi (7000)', w.eval(`((state.members.find(m=>m.id==='b1').monthly||{})['${NM}']||{}).totalPrice`)===7000);
  t('uyeler sayfasi '+NM+': gA satirlari + b1 + c1', (function(){ const rows=w.eval(`buildMemberRows('${NM}').map(r=>(r.groupId||'-')+':'+r.memberId)`); return rows.includes('gA:a1')&&rows.includes('gA:a2')&&rows.some(x=>/^-:b1$/.test(x))&&rows.some(x=>/^-:c1$/.test(x)); })(), JSON.stringify(w.eval(`buildMemberRows('${NM}').map(r=>(r.groupId||'-')+':'+r.memberId)`)));
  t('bekleyen 0 → toplu dugme pasif', (d.querySelector('#month-prep-body button[onclick="prepAllContinue()"]')||{}).disabled===true);
  w.undoLast();
  t('GERI AL → hepsi yeniden bekliyor', st('group','gA')==='pending' && st('member','b1')==='pending' && st('member','c1')==='pending', [st('group','gA'),st('member','b1'),st('member','c1')].join(','));
  t('a1 '+NM+' kayitsiz', w.eval(`isMemberEnrolledInMonth('a1','${NM}')`)===false);

  console.log('[7] kabuklar degismedi: removeMemberFromMonth (onayli) + markMemberPackageExtended');
  fixture();
  w.__msgs.length=0;
  w.removeMemberFromMonth('c1', NM);
  t('onay soruldu + cikarildi', w.__msgs.some(m=>m.indexOf('pasife alınacak')!==-1) && w.eval(`isMemberEnrolledInMonth('c1','${NM}')`)===false);
  await w.markMemberPackageExtended('b1', CM, true);
  t('markMemberPackageExtended: extended + override 0', w.eval(`JSON.stringify(((state.members.find(m=>m.id==='b1').packages||[]).find(p=>p.month==='${CM}')||{}).status)`)==='"extended"' && w.eval(`((state.members.find(m=>m.id==='b1').monthly||{})['${CM}']||{}).totalPrice`)===0);
  await w.markGroupPackageExtended('gA', CM, true);
  t('markGroupPackageExtended: extended + uye __extZero', w.eval(`JSON.stringify(((state.groups.find(g=>g.id==='gA').packages||[]).find(p=>p.month==='${CM}')||{}).status)`)==='"extended"' && w.eval(`((state.members.find(m=>m.id==='a2').monthly||{})['${CM}']||{}).__extZero`)===true);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
