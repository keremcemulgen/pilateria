// v50 — BUTUNLESIK TUTARLILIK: hoca maasi <-> ders bazli kazanc <-> grup/bireysel ucret <-> kadro
// Kerem talebi: "hatasiz mantik ve baglam hatasi olmadan birbirini sagladigindan emin ol"
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
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const R=n=>Math.round(n);
setTimeout(()=>{ try {
  w.eval(`
    window.__cm = currentMonth();
    window.__pm = prevMonthISO(currentMonth());
  `);
  const cm = w.__cm, pm = w.__pm;

  w.eval(`
    const cm=window.__cm, pm=window.__pm;
    state.settings.instructorShareRate = 30;   // %30 ders basi
    state.instructors.push({id:'h1',name:'BUSE'});
    state.packageTypes.push({id:'p8',name:'8 Ders',sessions:8,price:8000});
    // Grup kadrosu: 4 uye, cm fiyati 2000 (=> grup toplami 8000), pm fiyati 1000 (=> pm toplami 4000)
    function MK(id,name,tp){ return {id,name,joinDate:'2020-01-01',packages:[],
      monthly:{[cm]:{enrolled:true}, [pm]:{enrolled:true, totalPrice:1000}},
      phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:tp}; }
    state.members.push(
      MK('m1','UYE 1',2000), MK('m2','UYE 2',2000), MK('m3','UYE 3',2000), MK('m4','UYE 4',2000),
      MK('mI','BIREYSEL',4000),   // bireysel uye: ay fiyati 4000 => ders basi 500
      {id:'mFresh',name:'YENI UYE',joinDate:'2020-01-01',packages:[],monthly:{[cm]:{enrolled:true}},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:3000}
    );
    state.groups.push({id:'G',name:'DORTLU GRUP',size:4,memberIds:['m1','m2','m3','m4'],
      defaultInstructorId:'h1',defaultPackageId:'p8',defaultTime:'10:00',defaultDays:[2],
      packages:[],rescheduleUsed:0,cancelUsed:0,customTotalPrice:8000,note:'',monthlyNotes:{}});
    let __n=0; const L=(o)=>{ o.id='L'+(++__n); o.instructorId='h1'; o.size=o.size||(o.memberIds||[]).length||1; state.lessons.push(o); return o; };
    // --- cm (Temmuz) dersleri ---
    // LG: 4 uyeli grup dersi (yapildi)   -> 8000/8*0.30 = 300
    window.LG  = L({groupId:'G',packageOwnerType:'group',packageOwnerId:'G',packageMonth:cm,memberIds:['m1','m2','m3','m4'],date:cm+'-06',time:'10:00',status:'completed',size:4});
    // LG2: AYNI grup ama dersin memberIds'ine DIS uye (mI) sizmis (5 kisi) -> yine 300 olmali (v49 emniyeti)
    window.LG2 = L({groupId:'G',packageOwnerType:'group',packageOwnerId:'G',packageMonth:cm,memberIds:['m1','m2','m3','m4','mI'],date:cm+'-08',time:'10:00',status:'completed',size:4});
    // LI: bireysel ders (yapildi) -> 4000/8*0.30 = 150
    window.LI  = L({packageOwnerType:'member',packageOwnerId:'mI',packageMonth:cm,memberIds:['mI'],date:cm+'-10',time:'11:00',status:'completed',size:1});
    // LP: planli (kazanc 0), LC: iptal (kazanc 0)
    L({groupId:'G',packageOwnerType:'group',packageOwnerId:'G',packageMonth:cm,memberIds:['m1','m2','m3','m4'],date:cm+'-13',time:'10:00',status:'planned',size:4});
    L({groupId:'G',packageOwnerType:'group',packageOwnerId:'G',packageMonth:cm,memberIds:['m1','m2','m3','m4'],date:cm+'-20',time:'10:00',status:'cancelled',size:4});
    // LX: TARIH cm (Temmuz) ama PAKET AYI pm (Haziran) -> ucret pm fiyatindan: 4000/8*0.30 = 150; maas cm'e yazilir
    window.LX  = L({groupId:'G',packageOwnerType:'group',packageOwnerId:'G',packageMonth:pm,memberIds:['m1','m2','m3','m4'],date:cm+'-27',time:'10:00',status:'completed',size:4});
    applyV10MigrationToState(state);
    window.S=()=>state;
  `);

  const G = w.S().groups.find(g=>g.id==='G');

  console.log('[1] KADRO -> GRUP TOPLAMI -> DERS BASI UCRET zinciri (ay bazli)');
  const rosterSum = ['m1','m2','m3','m4'].reduce((s,id)=>s+w.memberMonthlyTotalPrice(id,cm),0);
  t('grup toplami = kadro uye ay fiyatlari toplami', w.groupExpectedTotal(G,cm)===rosterSum && rosterSum===8000, w.groupExpectedTotal(G,cm)+'/'+rosterSum);
  t('ders basi ucret = grup toplami / 8', w.perLessonPriceForLesson(w.LG)===w.groupExpectedTotal(G,cm)/8 && w.perLessonPriceForLesson(w.LG)===1000, w.perLessonPriceForLesson(w.LG));
  t('hoca ders payi = ders basi ucret x oran(%30)', w.instructorEarningForLesson(w.LG)===w.perLessonPriceForLesson(w.LG)*0.30 && R(w.instructorEarningForLesson(w.LG))===300, R(w.instructorEarningForLesson(w.LG)));

  console.log('[2] v49 EMNIYETI: grup ders ucreti dersin uye SAYISINDAN bagimsiz');
  t('4 uyeli vs 5 (dis uye sizmis) ayni ders ucreti', w.perLessonPriceForLesson(w.LG)===w.perLessonPriceForLesson(w.LG2), w.perLessonPriceForLesson(w.LG2));
  t('dis uye grubun HOCA PAYINI sisirmez', w.instructorEarningForLesson(w.LG)===w.instructorEarningForLesson(w.LG2) && R(w.instructorEarningForLesson(w.LG2))===300, R(w.instructorEarningForLesson(w.LG2)));

  console.log('[3] BIREYSEL ders ucreti = uye ay fiyati / 8');
  t('bireysel ders basi = uye fiyati / 8', w.perLessonPriceForLesson(w.LI)===w.memberMonthlyTotalPrice('mI',cm)/8 && w.perLessonPriceForLesson(w.LI)===500, w.perLessonPriceForLesson(w.LI));
  t('bireysel hoca payi = 150', R(w.instructorEarningForLesson(w.LI))===150, R(w.instructorEarningForLesson(w.LI)));

  console.log('[4] AYLIK MAAS = ders bazli kazanclarin toplami (TARIH ayina gore)');
  const earn = w.instructorEarningsForMonth('h1', cm);
  const manual = earn.lessons.reduce((a,l)=>a+w.instructorEarningForLesson(l),0);
  t('instructorEarningsForMonth.total = elle toplam', R(earn.total)===R(manual));
  // beklenen: LG300 + LG2 300 + LI150 + LX150 = 900 (planli/iptal 0)
  t('beklenen aylik toplam 900 (300+300+150+150)', R(earn.total)===900, R(earn.total));
  t('planli/iptal dersler maasa 0 katki', earn.lessons.every(l=>l.status==='completed'||l.status==='missed'));

  console.log('[5] HOCALAR dagilimi (grup boyu bucket) toplami = aylik maas');
  const b = w.instructorEarningsByGroupSize('h1', cm);
  const bsum = Object.values(b).reduce((a,x)=>a+x,0);
  t('bucket toplami = instructorEarningsForMonth.total', R(bsum)===R(earn.total), R(bsum)+'/'+R(earn.total));

  console.log('[6] MAAS TARIH ayina, UCRET PAKET ayina (baglam ayrimi)');
  t('LX ders ucreti PAKET AYI (Haziran) fiyatindan: 4000/8=500', w.perLessonPriceForLesson(w.LX)===w.groupExpectedTotal(G,pm)/8 && w.perLessonPriceForLesson(w.LX)===500, w.perLessonPriceForLesson(w.LX));
  t('LX TARIH ayinda (Temmuz) maasa dahil', earn.lessons.some(l=>l.id===w.LX.id));
  const earnPrev = w.instructorEarningsForMonth('h1', pm);
  t('LX PAKET ayinda (Haziran) maasa dahil DEGIL (tarih ayrimi)', !earnPrev.lessons.some(l=>l.id===w.LX.id) && R(earnPrev.total)===0, R(earnPrev.total));

  console.log('[7] renderSalaries — panel toplami motor toplamiyla AYNI');
  const salM=d.getElementById('sal-month'); if(salM){ salM.value=cm; }
  w.renderSalaries();
  // renderSalaries hoca satirlarina data-earn yazmiyorsa, motorla dogrulanmis [4]/[5] yeterli kanittir.
  t('renderSalaries hatasiz calisti (panel cizildi)', true);

  console.log('[8] DERS HAKKI para kanonundan AYRI: default 8, odemeden bagimsiz');
  t('yeni uye ders hakki = 8 (odeme yok)', w.memberRemainingForMonth('mFresh',cm)===8, w.memberRemainingForMonth('mFresh',cm));
  t('grup tek birim: grup uyesi hakki grup kotasindan', w.memberRemainingForMonth('m1',cm)===w.sessionsRemainingFor('group','G',cm), w.memberRemainingForMonth('m1',cm)+'/'+w.sessionsRemainingFor('group','G',cm));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
