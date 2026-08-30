// v157 — PANEL KURALLARI (Kerem, 2026-08-30, ekran goruntuleriyle):
// A) "1 Dersi Kalan / Biten": BITEN satiri, birime DAHA YENI paket yazildiysa duser:
//    - bireysel: kisinin (klon kayitlari dahil) YENI AYA yazilmis kaydi/paketi varsa YA DA ayni ay
//      icin 2. paket kaydi acilmissa eski Bitti satiri DUSER; kimsesi devam etmeyen KALIR.
//    - grup: grubun kendisi yeni aya yazilmissa YA DA ikiz "(N. Paket)" grubu (ayni kisiler,
//      numarasi buyuk ya da ayi yeni) olusturulmussa DUSER.
//    - v158 (Kerem: "sadece guncel gruplar listelensin"): grup BITEN satiri yalniz GUNCEL grup
//      icin gosterilir (icinde bulunulan ayda aktif kadrosu olan). Gecmis ayda kalmis grup —
//      devami olsun olmasin — Biten listesine girmez (FUNDA-GAMZE vakasi). Bu ayda bitirmis grup
//      gorunur; "1 ders kaldi" sarkan alacaktir, yas sinirsiz kalir; bireysel kurallar degismez.
//    - kural YALNIZ Bitti satirlari icin; "1 ders kaldi" satiri gercek alacaktir, KALIR.
//    - Kerem karari: satirlar KAYIT bazinda kalir (klon katlama YOK) — dusme kosulu kisiye bakar.
// B) "Gelecek Hafta Ders Girilmemis": hafta HANGI AYLARA dokunuyorsa o aylarin aktifleri esas
//    (yalniz icinde bulunulan aya capalamak, Eylul'e kayitli uyeyi KACIRIYORDU — OYKU vakasi);
//    ders-varligi ve grup uyeligi KISI bazinda katlanir (klonuyla dersi/grubu olan kisinin diger
//    kaydi listelenmez — TAMELLA vakasi); satirlar yine kayit bazinda.
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
  const PM = shiftM(CM,-1), NM = shiftM(CM,+1);
  w.eval(`
    state.settings.reformers=10; state.settings.open=8; state.settings.close=22;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const M=function(id,ad,aylar,ekstra){ const mo={}; (aylar||[]).forEach(function(a){ mo[a]={enrolled:true}; });
      return Object.assign({id:id,name:ad,joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:mo},ekstra||{}); };
    state.members=[
      M('uA','ASU ESKI',['${PM}','${CM}']),                    // PM bitti + CM'e yazilmis -> DUSER
      M('uB','BUKET KALIR',['${PM}']),                          // PM bitti, devami yok -> KALIR
      M('uC','CEREN CIFT',['${PM}']),                           // PM bitti + ayni ay 2. paket klonu -> DUSER
      M('uC2','CEREN CIFT (2. Paket)',['${PM}'],{secondOfMember:'uC'}),
      M('uH','HANDE BIRKALDI',['${PM}','${CM}']),               // PM 7/8 (1 kaldi) + CM'e yazilmis -> KALIR (kural yalniz Bitti)
      M('d1','DILA D',['${PM}']), M('e1','EMEL E',['${PM}']),
      M('d2','DILA D (2. Paket)',['${PM}'],{secondOfMember:'d1'}), M('e2','EMEL E (2. Paket)',['${PM}'],{secondOfMember:'e1'}),
      M('f1','FUNDA F',['${PM}']), M('f2','GAMZE G',['${PM}']),
      M('c1','HALE H',['${PM}','${NM}']), M('c2','IPEK I',['${PM}','${NM}'])
    ];
    state.groups=[
      // gA: PM'de bitti + AYNI AY ikiz "(2. Paket)" grubu var -> DUSER
      {id:'gA',name:'DILA D - EMEL E',size:2,memberIds:['d1','e1'],defaultPackageId:'p8',packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${PM}':['d1','e1']},monthlyNotes:{}},
      {id:'gA2',name:'DILA D (2. Paket) - EMEL E (2. Paket)',size:2,memberIds:['d2','e2'],defaultPackageId:'p8',packages:[],monthlyMembers:{'${PM}':['d2','e2']},monthlyNotes:{}},
      // gB: PM'de bitti, devami yok -> KALIR
      {id:'gB',name:'FUNDA F - GAMZE G',size:2,memberIds:['f1','f2'],defaultPackageId:'p8',packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${PM}':['f1','f2']},monthlyNotes:{}},
      // gC: PM'de bitti + KENDISI yeni aya yazilmis -> DUSER
      {id:'gC',name:'HALE H - IPEK I',size:2,memberIds:['c1','c2'],defaultPackageId:'p8',packages:[{month:'${PM}',startDate:'${PM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${PM}':['c1','c2'],'${NM}':['c1','c2']},monthlyNotes:{}}
    ];
    state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
    window.__doldur=function(pref,gid,mids,adet){ for(let i=0;i<adet;i++) state.lessons.push({id:pref+i,date:'${PM}-'+String((i%25)+2).padStart(2,'0'),time:(9+(i%12))+':00',durationMin:45,instructorId:'h1',size:(mids||[]).length||1,memberIds:(mids||[]).slice(),groupId:gid||'',packageMonth:'${PM}',status:'completed'}); };
    __doldur('a','',['uA'],8); __doldur('b','',['uB'],8); __doldur('c','',['uC'],8); __doldur('h','',['uH'],7);
    __doldur('ga','gA',['d1','e1'],8); __doldur('gb','gB',['f1','f2'],8); __doldur('gc','gC',['c1','c2'],8);
    // v158: BU AY bitirmis GUNCEL grup — listede gorunmeli
    state.members.push(M('g5','JALE J',['${CM}']),M('g6','KUMRU K',['${CM}']));
    state.groups.push({id:'gD',name:'JALE J - KUMRU K',size:2,memberIds:['g5','g6'],defaultPackageId:'p8',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${CM}':['g5','g6']},monthlyNotes:{}});
    for(let i=0;i<8;i++) state.lessons.push({id:'gd'+i,date:'${CM}-'+String((i%25)+2).padStart(2,'0'),time:(9+(i%12))+':30',durationMin:45,instructorId:'h1',size:2,memberIds:['g5','g6'],groupId:'gD',packageMonth:'${CM}',status:'completed'});
  `);

  console.log('[1] BITEN: yeni aya yazilan/2. paketi acilan DUSER, devami olmayan KALIR');
  w.renderDashboard();
  const lf = d.getElementById('low-members').innerHTML;
  t('ASU ESKI (CM kaydi var) listede DEGIL', lf.indexOf('ASU ESKI')===-1, (lf.match(/ASU ESKI[^<]*/)||[''])[0]);
  t('BUKET KALIR (devami yok) listede', lf.indexOf('BUKET KALIR')!==-1);
  t('CEREN CIFT (ayni ay 2. paket acilmis) listede DEGIL', !/CEREN CIFT\s*</.test(lf.replace(/CEREN CIFT \(2\. Paket\)/g,'')), (lf.match(/CEREN CIFT[^<]*/)||[''])[0]);
  t('HANDE BIRKALDI (7/8 — 1 kaldi) CM kaydina RAGMEN listede', lf.indexOf('HANDE BIRKALDI')!==-1);
  t('DILA-EMEL grubu (ayni ay ikiz 2. paket grubu var) listede DEGIL', lf.indexOf('DILA D - EMEL E')===-1, (lf.match(/DILA D[^<]{0,40}/)||[''])[0]);
  t('FUNDA-GAMZE grubu LISTEDE DEGIL — v158: gecmis ayda kalmis grup, bu ayda kadrosu yok', lf.indexOf('FUNDA F - GAMZE G')===-1, (lf.match(/FUNDA F[^<]{0,30}/)||[''])[0]);
  t('BU AY bitiren GUNCEL grup listede (JALE-KUMRU 8/8)', lf.indexOf('JALE J - KUMRU K')!==-1);
  t('HALE-IPEK grubu (kendisi yeni aya yazilmis) listede DEGIL', lf.indexOf('HALE H - IPEK I')===-1);

  console.log('[2] GELECEK HAFTA: ay kapsami + kisi katlama');
  const startISO = w.eval('isoDate(addDays(startOfWeek(0),7))');
  const mos = w.eval('(function(){const s=addDays(startOfWeek(0),7),e=addDays(startOfWeek(0),14),r=[];for(let d0=new Date(s);d0<e;d0=addDays(d0,1)){const mo=isoDate(d0).slice(0,7);if(!r.includes(mo))r.push(mo);}return r;})()');
  const cokAyli = mos.length>1, sonAy = mos[mos.length-1];
  w.eval(`
    state.members.push(
      {id:'uE',name:'EYLUL YENI',joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:{'${sonAy}':{enrolled:true}}},
      {id:'uT',name:'TUANA T',joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'uT2',name:'TUANA T (2. Paket)',secondOfMember:'uT',joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'uI',name:'IREM GIBI',joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}}
    );
    state.groups.push({id:'gT',name:'TUANA GRUBU',size:2,memberIds:['uT'],defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['uT']},monthlyNotes:{}});
    state.lessons.push({id:'nw1',date:'${startISO}',time:'10:00',durationMin:45,instructorId:'h1',size:1,memberIds:['uT'],groupId:'gT',packageMonth:'${startISO.slice(0,7)}',status:'planned'});
  `);
  const nwm = w.eval('(function(){const r=getNextWeekMissing();return {g:r.groups.map(x=>x.name||""),m:r.members.map(x=>x.name||"")};})()');
  if (cokAyli) {
    t('hafta '+mos.join('+')+' kapsiyor: SON AYA kayitli EYLUL YENI listede (OYKU vakasi)', nwm.m.includes('EYLUL YENI'), JSON.stringify(nwm.m));
  } else { console.log('  ATLA cok-ayli hafta senaryosu (bu hafta tek ay: '+mos.join()+')'); }
  t('TUANA T (2. Paket) listede DEGIL — kisinin grup dersi var (TAMELLA vakasi)', !nwm.m.includes('TUANA T (2. Paket)'), JSON.stringify(nwm.m));
  t('TUANA T de listede degil (dersi var)', !nwm.m.includes('TUANA T'));
  if (mos.includes(CM)) {
    t('IREM GIBI (bu ay kayitli, dersi yok) listede', nwm.m.includes('IREM GIBI'), JSON.stringify(nwm.m));
    t('BUKET KALIR gibi eski-ay uyesi listede DEGIL (hafta ayina kayitli degil)', !nwm.m.includes('BUKET KALIR'));
  } else { console.log('  ATLA bu-ay senaryolari (hafta bu aya dokunmuyor)'); }

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
