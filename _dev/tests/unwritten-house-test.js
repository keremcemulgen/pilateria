// v56 — YAZILMAYAN DERSLERIN PARASI ISLETMEYE KALIR (hocaya degil)
// Kerem senaryosu: 8-derslik paket satildi+odendi, uye/grup 6. derste birakti, 7-8 HIC YAZILMADI.
// Hoca = 6 x (toplam/8) x oran. Yazilmayan 2 dersin payi hocaya GITMEZ -> isletmede kalir.
// Ek kilitler: birim fiyat toplam/8 SABIT (yazilan sayisindan bagimsiz); "son ders" isareti ve paket
// tamamlanmasi (autoComplete/completed) birim fiyati DEGISTIRMEZ; planli ders kazandirmaz.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{}; }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
const R=x=>Math.round((+x)*100)/100;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval('window.S=()=>state;');
  const ay='2026-07';

  console.log('[1] BIREYSEL: 8-lik paket (4500), 6 ders yazildi, 2 HIC yazilmadi');
  w.eval(`
    state.settings=state.settings||{}; state.settings.instructorShareRate=30;
    state.instructors=[{id:'h',name:'DERYA'}];
    state.members=[{id:'mB',name:'mB',joinDate:'2026-01-01',archived:false,totalPrice:4500,
      packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:4500,status:'active'}],
      monthly:{'2026-07':{enrolled:true}}}];
    state.groups=[];
    state.payments=[{id:'P1',memberId:'mB',date:'2026-07-01',packageMonth:'2026-07',amount:4500,method:'cash'}];
    const L=(id,day)=>({id,date:'2026-07-'+('0'+day).slice(-2),time:'10:00',status:'completed',instructorId:'h',
      memberIds:['mB'],packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'mB',size:1});
    state.lessons=[L('B1',1),L('B2',3),L('B3',6),L('B4',8),L('B5',10),L('B6',13)]; // 6 yazildi; 7-8 YOK
  `);
  t('birim fiyat = 4500/8 = 562.5 (6 yazilmis olsa da bolen 8)', R(w.perLessonPriceForLesson(w.S().lessons[0]))===562.5, w.perLessonPriceForLesson(w.S().lessons[0]));
  let e1 = w.instructorEarningsForMonth('h', ay);
  t('hoca ay maasi = 6 x 562.5 x %30 = 1012.5 (8 ders DEGIL)', R(e1.total)===1012.5, e1.total);
  t('yazilmayan 2 dersin hoca payi (337.5) HESABA GIRMEDI -> isletmede', R(4500*0.30 - e1.total)===337.5, 4500*0.30-e1.total);
  t('isletmeye kalan = tahsilat - hoca = 4500-1012.5 = 3487.5', R(4500 - e1.total)===3487.5, 4500-e1.total);
  t('paket kalan (yazilmamis hak) = 2', w.packageRemainingSessions('member','mB',ay)===2, w.packageRemainingSessions('member','mB',ay));

  console.log('[2] SON DERS isareti birim fiyati ve maasi DEGISTIRMEZ');
  w.eval("S().lessons.find(x=>x.id==='B6').isLastOfPackage=true;");
  const B6=w.S().lessons.find(x=>x.id==='B6');
  t('B6 "SON DERS" rozeti alir', w.isLastLessonOfPackage(B6)===true);
  t('birim fiyat hala 562.5 (750 OLMADI)', R(w.perLessonPriceForLesson(B6))===562.5, w.perLessonPriceForLesson(B6));
  t('onceki ders (B1) birim fiyati da 562.5', R(w.perLessonPriceForLesson(w.S().lessons[0]))===562.5);
  e1 = w.instructorEarningsForMonth('h', ay);
  t('hoca maasi hala 1012.5', R(e1.total)===1012.5, e1.total);

  console.log('[3] PAKET TAMAMLANMASI (autoComplete/completed) fiyati DEGISTIRMEZ');
  w.eval('autoCompletePackages();');
  t('6/8: paket hala active (otomatik erken tamamlanmaz)', w.S().members[0].packages[0].status==='active', w.S().members[0].packages[0].status);
  w.eval("S().members[0].packages[0].status='completed';"); // elle/son-ders sonrasi tamamlandi say
  t('completed pakette birim fiyat YINE 562.5 (yalniz "uzadi" 0 verir)', R(w.perLessonPriceForLesson(B6))===562.5, w.perLessonPriceForLesson(B6));
  e1 = w.instructorEarningsForMonth('h', ay);
  t('completed pakette hoca maasi YINE 1012.5', R(e1.total)===1012.5, e1.total);
  w.eval("S().members[0].packages[0].status='active';");

  console.log('[4] PLANLI ders de kazandirmaz (yalniz yapildi/yandi)');
  w.eval(`state.lessons.push({id:'B7',date:'2026-07-15',time:'10:00',status:'planned',instructorId:'h',
    memberIds:['mB'],packageMonth:'2026-07',packageOwnerType:'member',packageOwnerId:'mB',size:1});`);
  e1 = w.instructorEarningsForMonth('h', ay);
  t('planli B7 eklendi -> maas hala 1012.5', R(e1.total)===1012.5, e1.total);
  w.eval("state.lessons=state.lessons.filter(x=>x.id!=='B7');");

  console.log('[5] GRUP: 4 kisi x 4500, 8-lik; 6 grup dersi yazildi, 2 yazilmadi');
  w.eval(`
    const M=id=>({id,name:id,joinDate:'2026-01-01',archived:false,totalPrice:4500,packages:[],monthly:{'2026-07':{enrolled:true}}});
    state.members=[M('g1'),M('g2'),M('g3'),M('g4')];
    state.groups=[{id:'G',name:'G',size:4,memberIds:['g1','g2','g3','g4'],monthlyMembers:{'2026-07':['g1','g2','g3','g4']},
      packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:18000,status:'active'}]}];
    const L=(id,day)=>({id,date:'2026-07-'+('0'+day).slice(-2),time:'11:00',status:'completed',instructorId:'h',
      groupId:'G',memberIds:['g1','g2','g3','g4'],packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'G',size:4});
    state.lessons=[L('G1',1),L('G2',3),L('G3',6),L('G4',8),L('G5',10),L('G6',13)];
  `);
  t('grup ders tabani = 4 x 562.5 = 2250 (sabit)', R(w.perLessonPriceForLesson(w.S().lessons[0]))===2250, w.perLessonPriceForLesson(w.S().lessons[0]));
  const eg = w.instructorEarningsForMonth('h', ay);
  t('hoca = 6 x 2250 x %30 = 4050 (8 ders 5400 DEGIL)', R(eg.total)===4050, eg.total);
  t('yazilmayan 2 grup dersinin payi (1350) isletmede', R(18000*0.30 - eg.total)===1350, 18000*0.30-eg.total);
  t('grup paket kalan (yazilmamis hak) = 2', w.packageRemainingSessions('group','G',ay)===2, w.packageRemainingSessions('group','G',ay));

  console.log('[6] v56 FIX: uyeye acilan paket kaydi = SATIN ALINAN hak (5-lik uyede 8 yazilmaz)');
  w.eval(`
    state.packageTypes=[{id:'pt8',name:'8 DERS',sessions:8,price:4500}];
    state.members.push({id:'m5',name:'m5',joinDate:'2026-01-01',archived:false,totalPrice:2815.5,packages:[],
      monthly:{'2026-08':{enrolled:true,sessionsOverride:5}}});
  `);
  w.eval("createMemberPackage(S().members.find(x=>x.id==='m5'), '2026-08', '2026-08-01');");
  const p5 = w.S().members.find(x=>x.id==='m5').packages.find(p=>p.month==='2026-08');
  t('5-lik uyenin kaydi sessions=5 (override; tip[0]=8 DEGIL)', p5 && p5.sessions===5, p5&&p5.sessions);
  t('quota da 5', w.sessionQuotaFor('member','m5','2026-08')===5, w.sessionQuotaFor('member','m5','2026-08'));
  t('pay = 2815.5/5 = 563.1', R(w.memberPerLessonPrice('m5','2026-08'))===563.1, w.memberPerLessonPrice('m5','2026-08'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
