// v152 — GRUP ADI KADRODAN CANLI TURETILIR (Kerem: "grupta olan uyelerin isimleri degistikce
// grup ismi de guncellenecekti ama 'HILAL BENK' 3 uyeli grupta tek isim yaziyor").
// KOK NEDEN: __autoNameAfterRosterChange monthlyNames[ay]'a ANLIK GORUNTU (snapshot) yaziyordu;
// groupDisplayName kayitli anlik goruntuyu oldugu gibi donduruyordu — kadro sonradan degisince
// (uye ekleme/cikarma/pasif) ad BAYAT kaliyordu.
// v152 KURALI: kayitli ad ELLE verilmis bir adsa (uye-adi kalibinda DEGILSE) aynen kalir;
// OTOMATIK kaliptaysa ad o AYIN AKTIF kadrosundan CANLI turetilir (>= ROSTER_START_MONTH —
// aylik kadro kanonu sayesinde gecmis aylar KENDI kadrosunun adini verir). Kanon oncesi aylar
// (aylik kadro yok) kayitli anlik goruntuyu korur — tarih yeniden yazilmaz.
// Yamasiz (v151) build'de FAIL etmeli.
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
setTimeout(()=>{ try {
  const CM = w.eval('currentMonth()');
  w.eval(`
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const M=function(id,ad){ return {id:id,name:ad,joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}}; };
    state.members=[M('mF','FERESHTEH SAMADPOUR BALDERLOU'),M('mH','HİLAL BENK'),M('mN','NAZ SÖNMEZ'),M('mE2','EDA YENİ'),M('mA','AYSE KAYA'),M('mU','FATMA UZ')];
    state.groups=[
      // KEREM VAKASI: grup 1 kisiyken adlandirilmis (anlik goruntu), sonra kadro 3'e cikmis — ad bayat
      {id:'gH',name:'HİLAL BENK',size:4,memberIds:['mF','mH','mN'],packages:[],
       monthlyNames:{'${CM}':'HİLAL BENK'}, monthlyMembers:{'${CM}':['mF','mH','mN','']}, monthlyNotes:{}},
      // ELLE verilmis ad (uye-adi kalibinda degil) — DOKUNULMAZ
      {id:'gM',name:'SABAH GRUBU',size:2,memberIds:['mA','mU'],packages:[],
       monthlyNames:{'${CM}':'SABAH GRUBU'}, monthlyMembers:{'${CM}':['mA','mU']}, monthlyNotes:{}},
      // KANON ONCESI tarih: eski ayin kayitli adi AYNEN kalir (tarih yeniden yazilmaz)
      {id:'gL',name:'AYSE KAYA - FATMA UZ',size:2,memberIds:['mH','mN'],packages:[],
       monthlyNames:{'2026-06':'AYSE KAYA - FATMA UZ'}, monthlyMembers:{}, monthlyNotes:{}}
    ];
    state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
  `);
  const TAM = 'FERESHTEH SAMADPOUR BALDERLOU - HİLAL BENK - NAZ SÖNMEZ';

  console.log('[1] KEREM VAKASI: bayat anlik goruntu yerine kadrodan CANLI ad');
  t('3 uyeli grubun adi 3 isim', w.eval(`groupDisplayName(state.groups[0], '${CM}')`) === TAM, w.eval(`groupDisplayName(state.groups[0], '${CM}')`));
  t('bos slot adi bozmaz (sondaki bos eleman atlanir)', w.eval(`groupDisplayName(state.groups[0], '${CM}')`).indexOf(' - ') !== -1);

  console.log('[2] UYE LISTESI AYNI ADI GOSTERIR (buildMemberRows) + groupName yardimcisi');
  const rows = w.eval(`buildMemberRows('${CM}').filter(r=>r.groupId==='gH').map(r=>r.groupName)`);
  t('uye listesindeki grup etiketi turetilmis ad', rows.length > 0 && rows.every(n => n === TAM), JSON.stringify(rows.slice(0,1)));
  t('groupName(id,ay) yardimcisi da turetilmis adi verir (v141 cakisma etiketi)', w.eval(`groupName('gH','${CM}')`) === TAM, w.eval(`groupName('gH','${CM}')`));

  console.log('[3] ELLE AD KAZANIR — dokunulmaz');
  t('SABAH GRUBU aynen kalir', w.eval(`groupDisplayName(state.groups[1], '${CM}')`) === 'SABAH GRUBU');

  console.log('[4] KADRO DEGISINCE AD KENDILIGINDEN DEGISIR');
  w.eval(`state.groups[0].monthlyMembers['${CM}'] = ['mF','mH','mN','mE2'];`); // uye EKLENDI (anlik goruntu tazelenmedi)
  t('yeni uye adi gorunur (EDA YENİ)', w.eval(`groupDisplayName(state.groups[0], '${CM}')`).indexOf('EDA YENİ') !== -1, w.eval(`groupDisplayName(state.groups[0], '${CM}')`));
  w.eval(`setMemberMonthly('mN','${CM}',{enrolled:false});`); // uye o ay PASIFE alindi
  t('pasif uye addan DUSER (NAZ yok)', w.eval(`groupDisplayName(state.groups[0], '${CM}')`).indexOf('NAZ') === -1);
  w.eval(`setMemberMonthly('mN','${CM}',{enrolled:true});`);
  // uye adi duzeltme GERCEK yol: saveMember rename'i __propagateMemberRename ile yayar (v-kanon)
  w.eval(`state.members.find(m=>m.id==='mH').name = 'HİLAL BENKX'; __propagateMemberRename('mH','HİLAL BENK','HİLAL BENKX');`);
  t('uye adi duzeltilince grup adi da duzelir', w.eval(`groupDisplayName(state.groups[0], '${CM}')`).indexOf('BENKX') !== -1, w.eval(`groupDisplayName(state.groups[0], '${CM}')`));
  w.eval(`state.members.find(m=>m.id==='mH').name = 'HİLAL BENK'; __propagateMemberRename('mH','HİLAL BENKX','HİLAL BENK');`);

  console.log('[5] TARIH YENIDEN YAZILMAZ (kanon oncesi ay kayitli adini korur)');
  t('2026-06 gorunumu eski adi verir', w.eval(`groupDisplayName(state.groups[2], '2026-06')`) === 'AYSE KAYA - FATMA UZ');

  console.log('[6] KADRO BUYUMUS HALIYLE DE TUTARLI (mE2 dahil 4 isim)');
  const dortlu = w.eval(`groupDisplayName(state.groups[0], '${CM}')`);
  t('4 uyeli guncel ad 4 isim icerir', dortlu.split(' - ').length === 4 && dortlu.indexOf('EDA YENİ') !== -1, dortlu);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
