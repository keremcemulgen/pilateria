// v142 — DETAY SAYACLARI: iptal ders SAYILMAZ (sayi = yapilan + yanan); planli/iptal rozetle.
// Kerem'in ekran goruntusu senaryosu: 7 yapilan + 1 iptal -> baslik (8) DEGIL (7) olmali.
// Yamasiz build'de FAIL etmeli. Liste satirlari AYNEN kalir (tarihsel kayit gorunur).
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
  const PM = ev("prevMonthISO(currentMonth())");
  w.eval(`
    state.packageTypes=[]; state.campaigns=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
    state.instructors=[{id:'h1',name:'DERYA',shareRate:30}];
    state.members=[
      {id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:7000,packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'m2',name:'BANU',joinDate:'2026-01-01',totalPrice:4000,packages:[],monthly:{'${CM}':{enrolled:true}}}
    ];
    state.groups=[{id:'g1',name:'AYSE - BANU',size:2,memberIds:['m1','m2'],defaultInstructorId:'h1',packages:[],monthlyMembers:{'${CM}':['m1','m2']},monthlyNotes:{}}];
    state.lessons=[];
    // Kerem senaryosu (bireysel): 5 yapildi + 1 yandi + 1 planli + 1 IPTAL = 8 satir, sayilan 6
    const st=['completed','completed','completed','completed','completed','missed','planned','cancelled'];
    for (let i=0;i<8;i++) state.lessons.push({id:'B'+i,date:'${CM}-'+String(i+2).padStart(2,'0'),time:'13:00',durationMin:45,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'m1',status:st[i]});
    // gecmis ay (Tum Gecmis icin): 2 yapildi + 1 iptal
    state.lessons.push({id:'P1',date:'${PM}-03',time:'10:00',durationMin:45,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${PM}',packageOwnerType:'member',packageOwnerId:'m1',status:'completed'});
    state.lessons.push({id:'P2',date:'${PM}-05',time:'10:00',durationMin:45,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${PM}',packageOwnerType:'member',packageOwnerId:'m1',status:'completed'});
    state.lessons.push({id:'P3',date:'${PM}-07',time:'10:00',durationMin:45,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${PM}',packageOwnerType:'member',packageOwnerId:'m1',status:'cancelled'});
    // grup dersleri: 3 yapildi + 1 planli + 1 iptal = 5 satir, sayilan 3
    const gst=['completed','completed','completed','planned','cancelled'];
    for (let i=0;i<5;i++) state.lessons.push({id:'G'+i,date:'${CM}-'+String(i+10).padStart(2,'0'),time:'19:00',durationMin:45,instructorId:'h1',size:2,memberIds:['m1','m2'],groupId:'g1',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'g1',status:gst[i]});
  `);

  console.log('[1] UYE DETAYI: sayi = yapilan+yanan (iptal SAYILMAZ)');
  const ms=d.getElementById('member-month'); if(ms && !Array.from(ms.options).some(o=>o.value===CM)) ms.innerHTML+='<option value="'+CM+'">'+CM+'</option>';
  if (ms) ms.value=CM;
  w.openMemberDetail('m1');
  const md = d.getElementById('md-content').innerHTML;
  // uye detayi uyenin GRUP derslerini de listeler: bireysel(5y+1f) + grup(3y) = 9 sayilir; 2 planli + 2 iptal sayilmaz
  t('baslik Dersleri (9) — 13 DEGIL (2 iptal + 2 planli sayilmadi)', md.includes('Dersleri (9)'), (md.match(/Dersleri \(\d+\)/)||['yok'])[0]);
  t('rozetler: 8 yapildi + 1 yandi + 2 planli', /✅ 8 yapıldı/.test(md) && /🔥 1 yandı/.test(md) && /📅 2 planlı/.test(md));
  t('iptal ayri: "2 iptal (sayılmaz)"', /🚫 2 iptal \(sayılmaz\)/.test(md));
  const satir = (md.match(/openLessonModal\('B\d'\)/g)||[]).length;
  t('LISTE aynen 8 satir (tarihsel kayit gorunur)', satir === 8, satir);

  console.log('[2] TUM GECMIS: gecmis ay sayaci da iptal saymaz');
  t('Tum Gecmis 11 ders der (14 kayittan 3 iptal/planli-disi: yalniz yapilan+yanan)', /Tüm Geçmiş \(0 ödeme · 11 ders\)/.test(md), (md.match(/Tüm Geçmiş[^<]*/)||['yok'])[0]);
  w.closeModal('modal-member-detail');

  console.log('[3] GRUP DETAYI: ayni kural');
  const gs=d.getElementById('group-month'); if(gs && !Array.from(gs.options||[]).some(o=>o.value===CM)) { try{ gs.innerHTML+='<option value="'+CM+'">'+CM+'</option>'; }catch(e){} }
  if (gs) gs.value=CM;
  w.openGroupDetail('g1');
  const gd = d.getElementById('gd-content') ? d.getElementById('gd-content').innerHTML : d.getElementById('modal-group-detail').innerHTML;
  t('Grup Dersleri (3) — 5 DEGIL', gd.includes('Grup Dersleri (3)'), (gd.match(/Grup Dersleri \(\d+\)/)||['yok'])[0]);
  t('grupta da iptal rozeti "sayılmaz"', /🚫 1 iptal \(sayılmaz\)/.test(gd) && /📅 1 planlı/.test(gd));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
