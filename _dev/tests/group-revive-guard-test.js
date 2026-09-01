// v166 — AYNI KADROYLA YENI GRUP KORUMASI (Kerem, secenek 1; 2026-09-01 ekran goruntusu: "4 uye baska
// yerden bu gruba tasindi" — Agustos'ta uyeleri pasife alinmis Temmuz grubunun ayni 4 kisiyle Eylul'de
// yeniden kurulmasi). v166 KURALI: yeni grup kaydedilirken ayni KISI kumesiyle kadrosu olan grup varsa
// (a) o ay zaten aktifse: "zaten aktif; + N. Paket kullan; yine de ayri grup?" (Iptal → detay acilir,
// kayit acilmaz) (b) degilse: "o grubu aya tasiyayim mi?" (Evet → reviveGroupForMonth: ayni kayit
// devam eder, tasima uyarisi cikmaz; Hayir → eski davranis). Geri alinabilir. Yamasiz build'de FAIL etmeli.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
let DECIDE = () => true;
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ const m=String((o&&o.msg)||''); w.__msgs.push(m); return o&&o.input?'not':DECIDE(m); };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ m=String(m||''); w.__msgs.push(m); return DECIDE(m); }; w.prompt=()=>'not'; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
function setMonth(ay){ const sel=d.getElementById('member-month'); if (sel && ![...sel.options].some(o=>o.value===ay)) sel.insertAdjacentHTML('beforeend','<option value="'+ay+'">'+ay+'</option>'); sel.value=ay; }
function seen(sub){ return w.__msgs.some(m=>m.indexOf(sub)!==-1); }
setTimeout(()=>{ try {
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','updateGroupPricePreview','renderArchive'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const PM = shiftM(CM,-1), NM = shiftM(CM,+1);
  function fixture(){
    w.eval(`
      state.settings.reformers=10;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[
        {id:'u1',name:'ISIL REVIVE',joinDate:'2026-01-01',packages:[],monthly:{'${PM}':{enrolled:true},'${CM}':{enrolled:true}}},
        {id:'u2',name:'OZGE REVIVE',joinDate:'2026-01-01',packages:[],monthly:{'${PM}':{enrolled:true},'${CM}':{enrolled:true}}},
        {id:'u3',name:'UCUNCU UYE',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'u4',name:'DORDUNCU UYE',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'u1c',name:'ISIL REVIVE (2. Paket)',joinDate:'2026-01-01',packages:[],secondOfMember:'u1',monthly:{}}
      ];
      state.groups=[
        {id:'gOld',name:'ISIL REVIVE - OZGE REVIVE',size:2,memberIds:['u1','u2'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[],defaultTime:'',packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:8000,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
        {id:'gX',name:'UCUNCU UYE - DORDUNCU UYE',size:2,memberIds:['u3','u4'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:8000,status:'active'}],monthlyMembers:{},monthlyNotes:{}}
      ];
      state.lessons=[]; for (let i=1;i<=8;i++) state.lessons.push({id:'L'+i,groupId:'gOld',memberIds:['u1','u2'],date:'${PM}-'+String(i+2).padStart(2,'0'),time:'10:00',status:'completed',packageMonth:'${PM}',instructorId:'h1'});
      state.payments=[];
      try { localStorage.removeItem('pilateria_undo'); __undoStack = []; } catch(e){}
    `);
    w.__msgs.length = 0;
  }
  function openNewGroup(ay, withSchedule){
    setMonth(ay);
    w.openGroupModal();
    const box = d.getElementById('mg-members');
    box.insertAdjacentHTML('beforeend', '<input type="checkbox" class="gm-mc" value="u1" checked><input type="checkbox" class="gm-mc" value="u2" checked>');
    d.getElementById('mg-size').value = '2';
    d.getElementById('mg-instructor').value = 'h1';
    d.getElementById('mg-package').value = 'p8';
    d.getElementById('mg-name').value = '';
    if (withSchedule) { d.getElementById('mg-time').value = '10:00'; const cb = d.querySelector('#mg-days input[data-gday="1"]'); if (cb) cb.checked = true; }
  }

  console.log('[1] yardimcilar');
  t('__findSameRosterGroup var', w.eval("typeof __findSameRosterGroup")==='function', w.eval("typeof __findSameRosterGroup"));
  t('reviveGroupForMonth var', w.eval("typeof reviveGroupForMonth")==='function');
  if (w.eval("typeof reviveGroupForMonth")!=='function') { console.log('\nSONUC: '+pass+' gecti, '+(fail+20)+' kaldi'); process.exit(1); }
  fixture();
  t('ayni kadro → gOld', w.eval(`(__findSameRosterGroup(['u1','u2'],'${CM}')||{g:{}}).g.id`)==='gOld');
  t('alt kume → eslesme YOK', w.eval(`__findSameRosterGroup(['u1'],'${CM}')`)===null);
  t('2.paket klonu koke katlanir → gOld', w.eval(`(__findSameRosterGroup(['u1c','u2'],'${NM}')||{g:{}}).g.id`)==='gOld');
  t('gOld bu ay aktif → activeInAy', w.eval(`__findSameRosterGroup(['u1','u2'],'${CM}').activeInAy`)===true);
  t('gOld gelecek ay (uyeler kayitsiz) → activeInAy DEGIL', w.eval(`__findSameRosterGroup(['u1','u2'],'${NM}').activeInAy`)===false);

  console.log('[2] Kerem vakasi: uyeler aydan cikarilmis, ayni kadroyla yeni grup → ESKI KAYIT AYA TASINIR');
  fixture();
  w.removeMemberFromMonth('u1', CM); w.removeMemberFromMonth('u2', CM);
  t('on kosul: gOld '+CM+' aktif kadrosu bos', w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='gOld'),'${CM}').length`)===0);
  w.__msgs.length = 0; DECIDE = () => true;
  openNewGroup(CM, false);
  w.saveGroup();
  t('soru soruldu (o grubu aya tasiyayim mi)', seen('ayına taşıyayım mı'), w.__msgs.join(' || ').slice(0,300));
  t('YENI KAYIT ACILMADI (2 grup)', w.eval("state.groups.length")===2, w.eval("state.groups.length"));
  t('gOld kadrosu '+CM+' icin [u1,u2]', w.eval(`JSON.stringify(resolveGroupMembersForMonth(state.groups.find(g=>g.id==='gOld'),'${CM}'))`)==='["u1","u2"]');
  t('gOld aktif kadrosu 2', w.eval(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='gOld'),'${CM}').length`)===2);
  t('u1 '+CM+' kayitli', w.eval(`isMemberEnrolledInMonth('u1','${CM}')`)===true);
  t('u1 arsiv donemi kapandi', w.eval("JSON.stringify(state.members.find(m=>m.id==='u1').archivePeriods||[])")==='[]', w.eval("JSON.stringify(state.members.find(m=>m.id==='u1').archivePeriods||[])"));
  t('gOld '+CM+' paketi acildi', w.eval(`!!(state.groups.find(g=>g.id==='gOld').packages||[]).find(p=>p.month==='${CM}')`));
  t('gecmis paket/dersler duruyor', w.eval(`(state.groups.find(g=>g.id==='gOld').packages||[]).length`)===2 && w.eval("state.lessons.filter(l=>l.groupId==='gOld'&&l.status==='completed').length")===8);
  t('tasima uyarisi YOK', !seen('başka yerden bu gruba taşındı'));
  t('sonuc mesaji: aya tasindi', seen('ayına taşındı'), w.__msgs.join(' || ').slice(0,300));
  t('geri al dugmesi etiketli (Grubu aya taşı)', w.eval("(__undoStack[__undoStack.length-1]||{}).label||''").indexOf('Grubu aya taşı')===0, w.eval("(__undoStack[__undoStack.length-1]||{}).label||''"));
  w.undoLast();
  t('GERI AL: u1 yeniden pasif, paket yok', w.eval(`isMemberEnrolledInMonth('u1','${CM}')`)===false && w.eval(`!(state.groups.find(g=>g.id==='gOld').packages||[]).find(p=>p.month==='${CM}')`));

  console.log('[3] pasife alinmis grup (archiveGroupMonthly) → gelecek aya tasinir + otomatik dersler');
  fixture();
  w.archiveGroupMonthly('gOld');
  t('on kosul: gOld '+NM+' pasif', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='gOld'),'${NM}')`)===true);
  w.__msgs.length = 0; DECIDE = () => true;
  openNewGroup(NM, true);
  w.saveGroup();
  t('yeni kayit acilmadi', w.eval("state.groups.length")===2, w.eval("state.groups.length"));
  const gO = w.eval("JSON.stringify(state.groups.find(g=>g.id==='gOld'))");
  t('archived kalkti, donem '+CM+'→'+NM, w.eval("state.groups.find(g=>g.id==='gOld').archived")===false && w.eval(`JSON.stringify((state.groups.find(g=>g.id==='gOld').archivePeriods||[]).map(p=>p.from+'>'+p.to))`)===JSON.stringify([CM+'>'+NM]), gO.slice(0,200));
  t(CM+' hala pasif, '+NM+' aktif', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='gOld'),'${CM}')`)===true && w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='gOld'),'${NM}')`)===false);
  t('kadro '+NM+' [u1,u2] + uyeler kayitli', w.eval(`JSON.stringify(activeGroupRosterForMonth(state.groups.find(g=>g.id==='gOld'),'${NM}'))`)==='["u1","u2"]' && w.eval(`isMemberEnrolledInMonth('u2','${NM}')`)===true);
  t('form alanlari gruba yazildi (gun/saat)', w.eval("state.groups.find(g=>g.id==='gOld').defaultTime")==='10:00' && w.eval("JSON.stringify(state.groups.find(g=>g.id==='gOld').defaultDays)")==='[1]');
  t('otomatik 8 ders '+NM+' paketine', w.eval(`state.lessons.filter(l=>l.groupId==='gOld'&&l.packageMonth==='${NM}'&&l.status==='planned').length`)===8, w.eval(`state.lessons.filter(l=>l.groupId==='gOld'&&l.packageMonth==='${NM}').length`));
  t('mesajda otomatik ders bilgisi', seen('ders otomatik'), w.__msgs.join(' || ').slice(0,300));

  console.log('[4] Hayir → eski davranis (ayri kayit + tasima notu)');
  fixture();
  w.removeMemberFromMonth('u1', CM); w.removeMemberFromMonth('u2', CM);
  w.__msgs.length = 0; DECIDE = (m) => m.indexOf('ayına taşıyayım mı')!==-1 ? false : true;
  openNewGroup(CM, false);
  w.saveGroup();
  t('yeni kayit acildi (3 grup)', w.eval("state.groups.length")===3, w.eval("state.groups.length"));
  t('tasima notu var (eski davranis)', seen('başka yerden bu gruba taşındı'));

  console.log('[5] ayni ay ZATEN AKTIF grup → uyari; iptal → detay acilir, kayit acilmaz');
  fixture();
  w.__msgs.length = 0; DECIDE = (m) => m.indexOf('ZATEN AKTİF')!==-1 ? false : true;
  openNewGroup(CM, false);
  w.saveGroup();
  t('uyari metni', seen('ZATEN AKTİF') && seen('+ N. Paket'), w.__msgs.join(' || ').slice(0,300));
  t('kayit acilmadi (2 grup)', w.eval("state.groups.length")===2, w.eval("state.groups.length"));
  t('gOld detayi acildi', w.eval("currentGroupDetailId")==='gOld' && w.eval("currentGroupDetailMonth")===CM, w.eval("currentGroupDetailId")+'/'+w.eval("currentGroupDetailMonth"));
  w.closeModal('modal-group-detail');
  w.__msgs.length = 0; DECIDE = () => true;
  openNewGroup(CM, false);
  w.saveGroup();
  t('yine de ac → ayri kayit (3 grup)', w.eval("state.groups.length")===3, w.eval("state.groups.length"));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
