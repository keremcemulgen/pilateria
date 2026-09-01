// v168 — HAYALET GRUP LISTEDE GORUNMESIN (canli veri 2026-09-01: tasimayla bosaltilmis "SEVDİ CAN AKTAŞ"
// grubu yetim Eylul paketi yuzunden Gruplar sayfasinda 0 uyeyle listeleniyordu). groupNavListForMonth
// paket/baslangic kurali: o ay kadrosu VEYA o ay dersi VEYA (kurulmakta olan bos grup: hic uye gormemis +
// ay gecmemis) yoksa LISTELENMEZ. Mesru haller korunur: sarkan paket (kadro pasif ama var), yeni bos
// grup (bu ay/ileri ay), odemesi olan grup, dersi olan grup. Yamasiz build'de FAIL etmeli.
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
  w.eval("['renderCalendar','renderMembers','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const PM = shiftM(CM,-1), NM = shiftM(CM,+1);
  w.eval(`
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'u1',name:'SEVDI CAN',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'u2',name:'OZGE OZ',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'u3',name:'SARKAN SIBEL',joinDate:'2026-01-01',packages:[],monthly:{'${PM}':{enrolled:true},'${CM}':{enrolled:false}},archivePeriods:[{from:'${CM}',to:null}]}
    ];
    state.groups=[
      // HAYALET: kadro tasimayla bosaltilmis (gecmiste uye gormus), yalniz bu ay paketi var, ders/odeme yok
      {id:'gPhantom',name:'SEVDI CAN',size:4,memberIds:[],monthlyMembers:{'2026-06':['u1','u2']},monthlyNames:{},defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:4500,status:'active'}],packageStartDate:'${CM}-01'},
      // HAYALET (gecmis ay): hic uye kaydi yok, gecen ay paketi var, ders/odeme yok
      {id:'gPhantomPM',name:'MESUT-FATMA',size:2,memberIds:[],monthlyMembers:{'2026-06':[]},monthlyNotes:{},defaultPackageId:'p8',packages:[{month:'${PM}',startDate:'${PM}-07',sessions:8,price:4500,status:'active'}],packageStartDate:'${PM}-07'},
      // MESRU: kurulmakta olan bos grup (bu ay, hic uye gormemis)
      {id:'gEmptyNew',name:'Yeni Grup',size:2,memberIds:[],monthlyMembers:{'${PM}':[]},monthlyNotes:{},defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:4500,status:'active'}],packageStartDate:'${CM}-01'},
      // MESRU: gelecek ay icin acilmis bos grup
      {id:'gEmptyNext',name:'Ileri Bos',size:2,memberIds:[],monthlyMembers:{'${CM}':[]},monthlyNotes:{},defaultPackageId:'p8',packages:[{month:'${NM}',startDate:'${NM}-01',sessions:8,price:4500,status:'active'}],packageStartDate:'${NM}-01'},
      // MESRU: sarkan paket — kadro var ama uye bu ay pasif (paket uzadi vakasi)
      {id:'gSarkan',name:'SARKAN SIBEL',size:2,memberIds:['u3'],monthlyMembers:{},monthlyNotes:{},defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:0,status:'extended'}]},
      // MESRU: aktif grup
      {id:'gActive',name:'SEVDI CAN - OZGE OZ',size:2,memberIds:['u1','u2'],monthlyMembers:{},monthlyNotes:{},defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}]},
      // MESRU: kadrosu bos ama bu ay DERSI var (tarihsel kayit)
      {id:'gLesson',name:'DERSLI',size:2,memberIds:[],monthlyMembers:{'2026-06':['u1']},monthlyNotes:{},defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:4500,status:'active'}]},
      // MESRU: kadrosu bos ama bu ay ODEMESI var
      {id:'gPay',name:'ODEMELI',size:2,memberIds:[],monthlyMembers:{'2026-06':['u2']},monthlyNotes:{},defaultPackageId:'p8',packages:[]}
    ];
    state.lessons=[{id:'L1',groupId:'gLesson',memberIds:['u1'],date:'${CM}-05',time:'10:00',status:'completed',packageMonth:'${CM}',instructorId:'h1'}];
    state.payments=[{id:'P1',memberId:'u2',groupId:'gPay',amount:4500,date:'${CM}-02',packageMonth:'${CM}',sessions:8,method:'Nakit'}];
  `);
  const ids = ay => w.eval(`groupNavListForMonth('${ay}').map(g=>g.id)`);
  const cm = ids(CM), pm = ids(PM), nm = ids(NM);
  console.log('[1] bu ay ('+CM+'): hayalet YOK, mesrular VAR');
  t('HAYALET (tasimayla bosalmis) listede DEGIL', !cm.includes('gPhantom'), JSON.stringify(cm));
  t('aktif grup var', cm.includes('gActive'));
  t('sarkan paket (kadro var, uye pasif) var', cm.includes('gSarkan'), JSON.stringify(cm));
  t('kurulmakta olan bos grup var', cm.includes('gEmptyNew'), JSON.stringify(cm));
  t('bu ay dersi olan (kadro bos) var', cm.includes('gLesson'));
  t('bu ay odemesi olan (kadro bos) var', cm.includes('gPay'));
  console.log('[2] gecen ay ('+PM+') / gelecek ay ('+NM+')');
  t('gecmis ay hayaleti (paket var, kadro/ders/odeme yok) listede DEGIL', !pm.includes('gPhantomPM'), JSON.stringify(pm));
  t('gelecek ay icin acilmis bos grup listede', nm.includes('gEmptyNext'), JSON.stringify(nm));
  t('hayalet gelecek ayda da yok', !nm.includes('gPhantom'));
  console.log('[3] Gruplar sayfasi render');
  { const sel=d.getElementById('group-month'); if (sel && ![...sel.options].some(o=>o.value===CM)) sel.insertAdjacentHTML('beforeend','<option value="'+CM+'">'+CM+'</option>'); sel.value=CM; }
  w.renderGroups();
  const html2 = d.getElementById('groups-list').innerHTML;
  t('sayfada aktif grup var, hayalet yok', html2.indexOf('SEVDI CAN - OZGE OZ')!==-1 && html2.indexOf('MESUT-FATMA')===-1 && !/>\\s*SEVDI CAN\\s*</.test(html2));
  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
