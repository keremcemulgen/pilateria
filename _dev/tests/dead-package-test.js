// v155 — OLU GECMIS PAKET GURULTUSU (Kerem: "takvimde agustos icinde dersleri yapilmis paketler
// 8 hak / eylule sarkan 8 yaziyor — sebebi nedir").
// TESHIS (canli veriden olculdu, 2026-08-30): 15 paket kaydina NE ders NE odeme bagli — gruplar
// yeniden kurulurken eski grup kaydinda kalan KALINTILAR (bazilari bos-kadrolu hayalet grup:
// orn. 9uqzhzko "MESUT BULUT-FATMA ASLI..."). Ders modali "sarkan" rozetini paket kayitlarindan
// urettigi icin bunlar "8 sarkan" diye gorunuyordu.
// v155 KURALI (gorunum — VERI SILINMEZ):
//  1) GECMIS ayin paketine hic iptal-disi ders VE hic odeme bagli degilse (OLU KAYIT) sarkan/rozet
//     listelerinde GOSTERILMEZ. Odeme bagliysa ya da kismen kullanildiysa GERCEK sarkan haktir, kalir.
//     Bugunun/gelecegin kullanilmamis paketi normaldir, kurala girmez.
//  2) Ders modalindaki grup listesinde AKTIF KADROSU BOS (hayalet) gruplar listelenmez (v145 kurali).
// Yamasiz build'de FAIL etmeli.
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
  const CM = w.eval('currentMonth()');
  const PM = shiftM(CM,-1);
  const kisaPM = w.eval(`__shortMonth('${PM}')`);
  w.eval(`
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const M=function(id,ad,aylar){ const mo={}; (aylar||[]).forEach(function(a){ mo[a]={enrolled:true}; });
      return {id:id,name:ad,joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:mo}; };
    state.members=[M('u1','ASLI A',['${PM}','${CM}']),M('u2','BETUL B',['${PM}','${CM}']),
      M('u3','CEREN C',['${CM}']),M('u4','DILA D',['${CM}']),
      M('u5','EMEL PARALI',['${PM}','${CM}'])];
    state.groups=[
      // GERCEK SARKAN: PM paketi kismen kullanilmis (7 yazili) -> "PM 1 sarkan" GORUNMELI
      {id:'gR',name:'GERCEK GRUP',size:2,memberIds:['u1','u2'],packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${PM}':['u1','u2'],'${CM}':['u1','u2']},monthlyNotes:{}},
      // HAYALET: kadro BOS + PM paketi var, ders/odeme YOK -> listede HIC gorunmemeli
      {id:'gH',name:'MESUT HAYALET-FATMA HAYALET',size:2,memberIds:[],packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:4500,status:'active'}],monthlyMembers:{},monthlyNotes:{}},
      // OLU GECMIS PAKET: kadro dolu ama PM paketine ders/odeme bagli degil -> "sarkan" rozeti CIKMAMALI
      {id:'gD',name:'DOLU KADRO OLU PAKET',size:2,memberIds:['u3','u4'],packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${CM}':['u3','u4']},monthlyNotes:{}}
    ];
    state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
    for (let i=0;i<7;i++) state.lessons.push({id:'r'+i, date:'${PM}-'+String(i+2).padStart(2,'0'), time:'10:00', durationMin:45,
      instructorId:'h1', size:2, memberIds:['u1','u2'], groupId:'gR', packageMonth:'${PM}', status:'completed'});
    // gD'nin BU AY dersleri var (paketi otomatik olusmadi — kota varsayilan), PM'e hicbir sey bagli degil
    for (let i=0;i<2;i++) state.lessons.push({id:'d'+i, date:'${CM}-'+String(i+2).padStart(2,'0'), time:'11:00', durationMin:45,
      instructorId:'h1', size:2, memberIds:['u3','u4'], groupId:'gD', packageMonth:'${CM}', status:'completed'});
    // EMEL: PM paketi ODENMIS ama ders yazilmamis -> GERCEK hak, sarkan GORUNMELI
    state.members.find(m=>m.id==='u5').packages.push({month:'${PM}',startDate:'${PM}-01',sessions:8,price:4500,status:'active'});
    state.payments.push({id:'pay5',memberId:'u5',groupId:'',amount:4500,date:'${PM}-10',packageMonth:'${PM}',sessions:8,method:'IBAN'});
  `);

  console.log('[1] ownerUnfinishedMonths: olu gecmis paket LISTEDEN DUSER, gercekler kalir');
  t('gR (7/8 kullanilmis) PM listede', w.eval(`ownerUnfinishedMonths('group','gR')`).includes(PM), JSON.stringify(w.eval(`ownerUnfinishedMonths('group','gR')`)));
  t('gH (hayalet, ders+odeme yok) PM listede DEGIL', !w.eval(`ownerUnfinishedMonths('group','gH')`).includes(PM), JSON.stringify(w.eval(`ownerUnfinishedMonths('group','gH')`)));
  t('gD (dolu kadro, olu PM paketi) PM listede DEGIL', !w.eval(`ownerUnfinishedMonths('group','gD')`).includes(PM), JSON.stringify(w.eval(`ownerUnfinishedMonths('group','gD')`)));
  t('EMEL (odenmis, ders yazilmamis) PM listede KALIR — para bagli', w.eval(`ownerUnfinishedMonths('member','u5')`).includes(PM), JSON.stringify(w.eval(`ownerUnfinishedMonths('member','u5')`)));

  console.log('[2] DERS MODALI acilir dropdown: hayalet grup yok, olu "sarkan" rozeti yok');
  w.openLessonModal(null, CM + '-15', '12:00');
  const gs = d.getElementById('ml-group-select').innerHTML;
  t('hayalet grup (bos kadro) SECENEK DEGIL', gs.indexOf('MESUT HAYALET') === -1, (gs.match(/MESUT[^<]*/)||[''])[0].slice(0,80));
  t('gercek grubun sarkan rozeti DURUYOR (PM 1 sarkan)', gs.indexOf(kisaPM + ' 1 sarkan') !== -1, (gs.match(/GERCEK GRUP[^<]*/)||[''])[0]);
  t('olu paketli grupta "sarkan" YAZMAZ', !/DOLU KADRO OLU PAKET[^<]*sarkan/.test(gs), (gs.match(/DOLU KADRO OLU PAKET[^<]*/)||[''])[0]);
  t('parali uyenin sarkani DURUYOR (EMEL PM 8 sarkan)', new RegExp('EMEL PARALI[^<]*' + kisaPM + ' 8 sarkan').test(gs), (gs.match(/EMEL PARALI[^<]*/)||[''])[0]);
  w.closeModal('modal-lesson');

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
