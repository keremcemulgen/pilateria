// v157 — GRUBA "+ N. Paket" (Kerem, 2026-08-30): "gruplara grup sayfasindan ayni bireysel ve grup
// uyelerine yapildigi gibi 2. paket olusturulabilmeli".
// KURAL (uyelerdeki v149/v150 akisinin grup karsiligi):
//  - Grup detayinda "+ N. Paket" butonu; N = groupPkgSlotForMonth (sirali, ay-baglamli).
//  - Olusturma: kaynak grubun O AYKI aktif kadrosundaki HER KISI icin uyenin kendi klon kaydi
//    (pkgSlotForMonth motoru: varsa uyuyan klon uyandirilir, yoksa acilir) + yeni grup kaydi
//    (secondOfGroup=kok, pkgNo=N, kadro=klonlar, ay'a kayitli). Ad v152 canli turetimle olusur.
//  - O numarali UYUYAN ikiz grup (arsivsiz ama o ay kadrosuz) varsa YENIDEN KULLANILIR: yeni grup
//    ACILMAZ; ikizin kadrosu o aya yazilir, uyeleri uyandirilir (v150 mukerrer-kayit kanonu).
// Yamasiz build'de FAIL etmeli (fonksiyonlar ve buton yok).
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
  const NM = shiftM(CM,+1);
  w.eval(`
    state.settings.reformers=10;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[
      {id:'m1',name:'ASLI BIR',joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}},
      {id:'m2',name:'BERNA IKI',joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}}
    ];
    state.groups=[{id:'gS',name:'ASLI BIR - BERNA IKI',size:2,memberIds:['m1','m2'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultTime:'10:00',defaultDays:[2,4],monthlyMembers:{'${CM}':['m1','m2']},monthlyNotes:{},packages:[]}];
    state.lessons=[]; state.payments=[];
  `);

  console.log('[1] fonksiyonlar tanimli (yamasizda FAIL)');
  t('createGroupSecondPackage var', w.eval("typeof createGroupSecondPackage")==='function', w.eval("typeof createGroupSecondPackage"));
  t('groupPkgSlotForMonth var', w.eval("typeof groupPkgSlotForMonth")==='function');
  if (w.eval("typeof createGroupSecondPackage")!=='function') { console.log('\nSONUC: '+pass+' gecti, '+(fail+9)+' kaldi (fonksiyon yok — kalan iddialar sayildi)'); process.exit(1); }

  console.log('[2] grup detayinda "+ 2. Paket" butonu');
  w.openGroupDetail('gS', CM);
  const gd = d.getElementById('gd-body') ? d.getElementById('gd-body').innerHTML : d.body.innerHTML;
  t('buton "+ 2. Paket" gorunur', gd.indexOf('createGroupSecondPackage')!==-1 && /\+\s*2\. Paket/.test(gd));
  w.closeModal('modal-group-detail');

  console.log('[3] olusturma: klon uyeler + secondOfGroup/pkgNo + kadro + ad');
  w.createGroupSecondPackage('gS', CM);
  const yeni = w.eval("JSON.stringify(state.groups.filter(g=>g.secondOfGroup==='gS'))");
  const ng = JSON.parse(yeni)[0];
  t('yeni ikiz grup olustu (secondOfGroup=gS)', !!ng, yeni.slice(0,80));
  t('pkgNo=2', ng && ng.pkgNo===2, ng && ng.pkgNo);
  t('kadro 2 klon uye', ng && (ng.memberIds||[]).length===2 && (ng.monthlyMembers||{})[CM] && ng.monthlyMembers[CM].length===2, ng && JSON.stringify(ng.memberIds));
  const klonlar = w.eval("JSON.stringify(state.members.filter(m=>m.secondOfMember).map(m=>({ad:m.name,kok:m.secondOfMember,kayit:!!(m.monthly&&m.monthly['"+CM+"']&&m.monthly['"+CM+"'].enrolled)})))");
  const kj = JSON.parse(klonlar);
  t('her kisi icin "(2. Paket)" klonu acildi ve aya kayitli', kj.length===2 && kj.every(k=>/\(2\. Paket\)$/.test(k.ad) && k.kayit), klonlar);
  t('ikizin adi canli turetimle "(2. Paket)" tasir', /\(2\. Paket\)/.test(w.eval(`groupDisplayName(state.groups.find(g=>g.secondOfGroup==='gS'), '${CM}')`)), w.eval(`groupDisplayName(state.groups.find(g=>g.secondOfGroup==='gS'), '${CM}')`));

  console.log('[4] numara sirasi: ikiz aktifken teklif "+ 3. Paket"');
  const s2 = w.eval(`JSON.stringify(groupPkgSlotForMonth('gS','${CM}'))`);
  t('slot n=3 (2 dolu)', JSON.parse(s2).n===3, s2);

  console.log('[5] uyuyan ikiz yeniden kullanilir (yeni kayit ACILMAZ)');
  const onceGrup = w.eval('state.groups.length'), onceUye = w.eval('state.members.length');
  const sNM = JSON.parse(w.eval(`JSON.stringify(groupPkgSlotForMonth('gS','${NM}'))`));
  t('NM baglaminda slot.reuse = uyuyan ikiz', !!(sNM.reuse) && sNM.n===2, JSON.stringify(sNM));
  w.createGroupSecondPackage('gS', NM);
  t('yeni grup ACILMADI (reuse)', w.eval('state.groups.length')===onceGrup, w.eval('state.groups.length')+' vs '+onceGrup);
  t('ikizin NM kadrosu dolduruldu', w.eval(`(state.groups.find(g=>g.secondOfGroup==='gS').monthlyMembers['${NM}']||[]).length`)===2);
  t('klon uyeler NM icin uyandirildi', w.eval(`state.members.filter(m=>m.secondOfMember&&m.monthly&&m.monthly['${NM}']&&m.monthly['${NM}'].enrolled===true).length`)===2);
  t('uye kaydi sayisi degismedi (mukerrer klon acilmadi)', w.eval('state.members.length')===onceUye);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
