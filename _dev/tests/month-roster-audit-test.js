// v163 — TAM TARAMA: AY-COZUMLU KADRO / PASIF-GRUP SAHIPLIGI / BUGUNE CAPALAMA AILESI
// (Kerem, 2026-09-01: "0 hata; bayt bayt tara; hatalari gider oyle guncelle").
// v57 kanonu: "bu ay kadroda kim var?" TEK KAYNAK = resolveGroupMembersForMonth /
// activeGroupRosterForMonth; ay'da PASIF (arsiv/donem) grup uye TUTAMAZ; yazma yollari sayfanin
// ayina capalanir. Tarama, ham g.memberIds kullanan ve/veya pasif grubu sahip sayan tum yollari
// buldu; her biri burada olculur. Yamasiz (v162) build'de FAIL etmeli.
//  F1  addGroupLesson: "+ Ders Ekle" kadrosu = o ayin aktif kadrosu (ham memberIds degil)
//  F2  saveBatchDates: yeni paketin baslangici = paketin ilk ders gunu (bugun degil)
//  F5  autoGenerateGroupLessons: uretilen derslerin kadrosu = o ayin kadrosu
//  F6  scheduleGroupMonth: ayni
//  F7  uye detayi "Toplu Ders Gir": yalniz o ay AKTIF bir grupta olan uyede gizlenir
//  F8  instructorMemberBreakdown(ay): grup boyutu ve bireysel sayimi ay-cozumlu, pasif grup sayilmaz
//  F9  paymentMemberGroup(uye, ay): o ay aktif grup (pasif grup degil)
//  F10 saveGroupPaymentAll: odeme yalniz o ayin kadrosuna yazilir
//  F13 fillEmptySlot: pasif grubun eski uyesi "uygun uye" listesinde gorunur
//  F14 getNextWeekMissing: pasif grubun kadrosu uyeyi "grupta" saymaz
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return o&&o.input?null:true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
setTimeout(()=>{ try {
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','openGroupDetail','renderArchive'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const PM = shiftM(CM,-1), NM = shiftM(CM,+1);
  w.eval(`
    state.settings.reformers=10; state.settings.open=8; state.settings.close=22; state.settings.groupPackageDays=30;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA A',shareRate:30},{id:'h2',name:'HOCA B',shareRate:30}];
    const M=function(id,ad,mo,ek){ return Object.assign({id:id,name:ad,joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',instructorId:'h1',packages:[],monthly:mo||{}},ek||{}); };
    state.members=[
      M('a1','ADA BIR',{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}),
      M('a2','BUSE IKI',{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}),
      M('a3','CEM UC',{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}),   // gA'nin ESKI uyesi: bu ay gB'de
      M('a4','DENIZ DORT',{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}) // yalniz PASIF gDead'in temel kadrosunda: aslinda BIREYSEL
    ];
    state.groups=[
      // gA: temel kadro 3 kisi ama BU AY ve gelecek ay 2 kisi (a3 ayrildi)
      {id:'gA',name:'ADA BIR - BUSE IKI',size:3,memberIds:['a1','a2','a3'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultTime:'10:00',defaultDays:[1,3],packages:[],monthlyMembers:{'${CM}':['a1','a2'],'${NM}':['a1','a2']},monthlyNotes:{}},
      {id:'gB',name:'CEM UC',size:1,memberIds:['a3'],defaultInstructorId:'h2',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['a3']},monthlyNotes:{}},
      // gDead: gecen aydan itibaren PASIF (donem) — temel kadrosunda a4 var
      {id:'gDead',name:'OLU GRUP',size:2,memberIds:['a4'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[{month:'2026-06',startDate:'2026-06-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{},monthlyNotes:{},archivePeriods:[{from:'${PM}',to:null}]}
    ];
    state.lessons=[]; state.payments=[]; state.campaigns=[];
  `);

  console.log('[F1] addGroupLesson kadrosu = o ayin aktif kadrosu');
  w.addGroupLesson('gA', CM);
  const l1 = w.eval("JSON.stringify((state.lessons.filter(l=>l.groupId==='gA').slice(-1)[0]||{}).memberIds||[])");
  t('yeni derste a3 YOK (bu ay gA kadrosunda degil)', l1==='["a1","a2"]', l1);

  console.log('[F2] toplu tarih: yeni paket baslangici = ilk ders gunu');
  w.eval(`__batchDatesTarget={type:'group',id:'gA',packageMonth:'${NM}'}; __batchDatesRows=[{lessonId:null,date:'${NM}-12',time:'10:00',status:'planned'},{lessonId:null,date:'${NM}-10',time:'10:00',status:'planned'}];`);
  w.saveBatchDates();
  const pk = w.eval(`JSON.stringify((state.groups.find(g=>g.id==='gA').packages||[]).find(p=>p.month==='${NM}')||{})`);
  t(NM+' paketi olustu, baslangic '+NM+'-10 (ilk ders)', JSON.parse(pk).startDate===NM+'-10', pk);

  console.log('[F5] autoGenerateGroupLessons kadrosu ay-cozumlu');
  w.eval("state.lessons=state.lessons.filter(l=>l.groupId!=='gA');");
  w.autoGenerateGroupLessons('gA', NM+'-01');
  const bad5 = w.eval("state.lessons.filter(l=>l.groupId==='gA' && (l.memberIds||[]).includes('a3')).length");
  const cnt5 = w.eval("state.lessons.filter(l=>l.groupId==='gA').length");
  t('uretilen derslerde a3 YOK ('+cnt5+' ders)', cnt5>0 && bad5===0, 'a3 iceren: '+bad5);

  console.log('[F6] scheduleGroupMonth kadrosu ay-cozumlu');
  w.eval(`state.lessons=state.lessons.filter(l=>l.groupId!=='gA'); currentGroupDetailMonth='${NM}';`);
  w.scheduleGroupMonth('gA');
  t('4 haftalik uretimde a3 YOK', w.eval("state.lessons.filter(l=>l.groupId==='gA').length")>0 && w.eval("state.lessons.filter(l=>l.groupId==='gA' && (l.memberIds||[]).includes('a3')).length")===0);
  w.eval("state.lessons=[]; currentGroupDetailMonth='';");

  console.log('[F7] uye detayi: PASIF grubun eski uyesi BIREYSELDIR -> "Toplu Ders Gir" gorunur');
  w.openMemberDetail('a4', CM);
  const md = d.getElementById('md-body') ? d.getElementById('md-body').innerHTML : d.body.innerHTML;
  t('a4 icin Toplu Ders Gir butonu VAR', md.indexOf("openBatchDatesMember('a4'")!==-1);
  w.closeModal('modal-member-detail');
  w.openMemberDetail('a1', CM);
  const md1 = d.getElementById('md-body') ? d.getElementById('md-body').innerHTML : d.body.innerHTML;
  t('a1 (aktif grupta) icin buton YOK', md1.indexOf("openBatchDatesMember('a1'")===-1);
  w.closeModal('modal-member-detail');

  console.log('[F8] hoca dagilimi ay-cozumlu');
  const br = w.eval(`(function(){const b=instructorMemberBreakdown('h1','${CM}'); return {bireysel:b[1].length, uc:b[3].length, ucA3:b[3].some(x=>x.memberId==='a3'), hepsi:JSON.stringify(Object.keys(b).map(k=>b[k].length))};})()`);
  t('h1: gA (tanimli boyut 3) kovasinda yalniz bu ayin 2 uyesi — a3 SAYILMAZ', br.uc===2 && !br.ucA3, br.hepsi); // v14 kanonu: kova = tanimli g.size; icerik = o ayin kadrosu
  t('h1: a4 bireysel sayildi (pasif gDead sayilmaz)', br.bireysel>=1, br.hepsi);

  console.log('[F9] paymentMemberGroup ay-bilincli');
  t('a4 icin grup YOK (gDead pasif)', w.eval(`paymentMemberGroup('a4','${CM}')`)===null, w.eval(`JSON.stringify(paymentMemberGroup('a4','${CM}'))`));
  t('a1 icin gA', (w.eval(`paymentMemberGroup('a1','${CM}')`)||{}).id==='gA');

  console.log('[F10] gruba toplu odeme: yalniz o ayin kadrosuna');
  w.openGroupPaymentModal('gA');
  d.getElementById('mp-group').value='gA'; d.getElementById('mp-pkg-month').value=CM; d.getElementById('mp-date').value=CM+'-05';
  d.getElementById('mp-amount').value='4500'; d.getElementById('mp-list').value='4500'; d.getElementById('mp-sessions').value='8'; d.getElementById('mp-method').value='Nakit';
  w.saveGroupPaymentAll();
  const pays = w.eval(`JSON.stringify(state.payments.filter(p=>p.groupId==='gA').map(p=>p.memberId).sort())`);
  t('odeme a1+a2 icin yazildi, a3 icin YAZILMADI', pays==='["a1","a2"]', pays);
  w.closeModal('modal-payment');

  console.log('[F13] bos slot doldurma: pasif grubun eski uyesi uygun listede');
  w.fillEmptySlot('gA', 2);
  const fs1 = (d.getElementById('modal-fill-slot')||{}).innerHTML||'';
  t('a4 (DENIZ DORT) secilebilir', fs1.indexOf('DENIZ DORT')!==-1);
  w.closeFillSlotModal();

  console.log('[F14] gelecek hafta: pasif grup kadrosu uyeyi gruplu saymaz');
  const mos = w.eval('(function(){const s=addDays(startOfWeek(0),7),e=addDays(startOfWeek(0),14),r=[];for(let d0=new Date(s);d0<e;d0=addDays(d0,1)){const mo=isoDate(d0).slice(0,7);if(!r.includes(mo))r.push(mo);}return r;})()');
  if (mos.includes(CM)) {
    const nwm = w.eval('(function(){const r=getNextWeekMissing();return r.members.map(x=>x.name);})()');
    t('a4 bireysel listede (dersi yok)', nwm.includes('DENIZ DORT'), JSON.stringify(nwm));
  } else console.log('  ATLA (hafta bu aya dokunmuyor)');

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
