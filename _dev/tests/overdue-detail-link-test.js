// v143 — GECIKEN ODEMELER: satirdaki isim detaya goturur (yetim grup erisimi — Tamella vakasi).
// Yamasiz build'de FAIL etmeli. Ayrica: bos-kadrolu grubun detayi guvenle acilir (dersler gorunur,
// Duzenle yolu var) ve panelin yetim-grup borcu uretme davranisi OLDUGU GIBI kalir (regresyon kilidi).
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
function ev(x){ return w.eval(x); }
setTimeout(()=>{ try {
  const CM = ev('currentMonth()');
  const dun = ev("(function(){const p=todayISO().split('-').map(Number);const d0=new Date(p[0],p[1]-1,p[2]-1);return isoDate(d0);})()");
  const evv = ev("(function(){const p=todayISO().split('-').map(Number);const d0=new Date(p[0],p[1]-1,p[2]-2);return isoDate(d0);})()");
  const ayD = dun.slice(0,7); // dunku dersin ayi (ay basinda onceki aya sarkabilir — satir ayi bundan turetilir)
  w.eval(`
    state.packageTypes=[]; state.campaigns=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
    state.instructors=[{id:'h1',name:'ICLAL',shareRate:30}];
    state.members=[
      {id:'mA',name:'GOKCE ESKI',joinDate:'2026-01-01',totalPrice:4500,packages:[],monthly:{'${ayD}':{enrolled:false},'${CM}':{enrolled:false}}},
      {id:'mB',name:'NURHAYAT X',joinDate:'2026-01-01',totalPrice:4500,packages:[],monthly:{}},
      {id:'mC',name:'TAMELLA X',joinDate:'2026-01-01',totalPrice:4500,packages:[],monthly:{}},
      {id:'mI',name:'BIREYSEL BORCLU',joinDate:'2026-01-01',totalPrice:3000,packages:[],monthly:{'${ayD}':{enrolled:true},'${CM}':{enrolled:true}}}
    ];
    // YETIM grup: uye listesindekiler kayitsiz -> aktif kadro BOS; ay paket fiyati 4500; 2 YAPILMIS ders
    state.groups=[{id:'gx',name:'GOKCE ESKI - GRUP',size:2,memberIds:['mA'],defaultInstructorId:'h1',
      packages:[{month:'${ayD}',startDate:'${ayD}-01',sessions:8,price:4500,status:'active'}],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[
      {id:'GL1',date:'${evv}',time:'20:00',durationMin:45,instructorId:'h1',size:2,memberIds:['mB','mC'],groupId:'gx',packageMonth:'${ayD}',packageOwnerType:'group',packageOwnerId:'gx',status:'completed'},
      {id:'GL2',date:'${dun}',time:'19:15',durationMin:45,instructorId:'h1',size:2,memberIds:['mB','mC'],groupId:'gx',packageMonth:'${ayD}',packageOwnerType:'group',packageOwnerId:'gx',status:'completed'},
      {id:'IL1',date:'${dun}',time:'10:00',durationMin:45,instructorId:'h1',size:1,memberIds:['mI'],groupId:'',packageMonth:'${ayD}',packageOwnerType:'member',packageOwnerId:'mI',status:'completed'}
    ];`);

  console.log('[1] PANEL SATIRLARI (regresyon kilidi: yetim grup borcu bugunku davranisla LISTEDE)');
  const ov = JSON.parse(ev('JSON.stringify(getOverduePayments())'));
  const gxRow = ov.find(o=>o.groupId==='gx');
  const miRow = ov.find(o=>!o.groupId && o.memberId==='mI');
  t('yetim grup satiri var (beklenen 4500 — paket yedegi)', !!gxRow && gxRow.expected===4500, JSON.stringify(gxRow));
  t('bireysel borclu satiri var (3000)', !!miRow && miRow.expected===3000, JSON.stringify(miRow));

  console.log('[2] v143: satirdaki ISIM detaya goturur');
  w.eval('try{renderDashboard()}catch(e){}');
  const ol = (d.getElementById('overdue-list')||{}).innerHTML || '';
  t('grup satiri openGroupDetail baglantili (borclu ay baglamiyla)', ol.indexOf("openGroupDetail('gx','"+ayD+"')") !== -1, ol.slice(0,200));
  t('bireysel satir openMemberDetail baglantili', ol.indexOf("openMemberDetail('mI')") !== -1);
  t('ipucu metni: ada dokun', /ada dokun: detay/.test(ol));

  console.log('[3] YETIM GRUP DETAYI guvenle acilir (Tamella vakasinin cozum yolu)');
  w.openGroupDetail('gx', ayD);
  const gd = d.getElementById('modal-group-detail').innerHTML;
  t('detay acildi ve 2 yapilmis ders listede', /Grup Dersleri \(2\)/.test(gd), (gd.match(/Grup Dersleri \(\d+\)/)||['yok'])[0]);
  t('detaydan Duzenle yolu var (Pasife Al oradan)', /openGroupModal\('gx'\)/.test(gd) || /Düzenle/.test(gd));
  w.closeModal('modal-group-detail');

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
