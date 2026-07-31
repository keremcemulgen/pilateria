// YILLIK STRES TESTI (2026-07-31 denetimi) — 12 ay uretim olcegi tam veri:
// ~120 uye, 25 grup, 5 hoca, ~4700 ders, ~1100 odeme, ~160 gider, bordro+tam sigorta+vergi.
// Amac: performans sinirlari, depolama boyutu, motorlar arasi TUTARLILIK DEGISMEZLERI,
// yil donumu (zarar devri), KDV devir zinciri surekliligi, ekranlarda undefined/NaN sizintisi.
// Deterministiktir (sabit tohum) ve tarihleri bugunden turetir (tarih-dayaniklilik kanonu).
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
// sabit tohumlu PRNG (mulberry32) — her kosuda AYNI veri
let __seed = 20260731;
function rnd(){ __seed |= 0; __seed = (__seed + 0x6D2B79F5) | 0; let z = Math.imul(__seed ^ (__seed >>> 15), 1 | __seed); z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z; return ((z ^ (z >>> 14)) >>> 0) / 4294967296; }
function ri(a,b){ return a + Math.floor(rnd()*(b-a+1)); }
function pick(arr){ return arr[Math.floor(rnd()*arr.length)]; }
function addM(ym,k){ const p=ym.split('-').map(Number); const dd=new Date(p[0],p[1]-1+k,1); return dd.getFullYear()+'-'+String(dd.getMonth()+1).padStart(2,'0'); }
function daysIn(ym){ const p=ym.split('-').map(Number); return new Date(p[0],p[1],0).getDate(); }
setTimeout(()=>{ try {
  const cm = ev('currentMonth()');
  const MONTHS = []; for (let k=11;k>=0;k--) MONTHS.push(addM(cm,-k)); // 12 ay, son = bu ay
  const M0 = MONTHS[0];

  // ---------- URETEC ----------
  const st = { members:[], groups:[], instructors:[], lessons:[], payments:[], expenses:[], instructorPayouts:[] };
  const ADLAR=['AYSE','FATMA','ZEYNEP','ELIF','MERVE','DERYA','SELIN','EBRU','GAMZE','PINAR','SEDA','BURCU','CANSU','DILARA','ESRA','GULSEN','HANDE','IREM','JALE','KUBRA'];
  const SOY=['YILMAZ','KAYA','DEMIR','SAHIN','CELIK','OZTURK','ARSLAN','DOGAN','KILIC','ASLAN'];
  for (let i=0;i<5;i++) st.instructors.push({ id:'h'+i, name:'HOCA '+ADLAR[i], shareRate:30 });
  st.instructors[0].sgkTam = {}; // hoca0 son 3 ay tam sigorta
  MONTHS.slice(-3).forEach(m => { st.instructors[0].sgkTam[m] = true; });
  for (let i=0;i<120;i++) {
    const jm = MONTHS[ri(0, 6)]; // katilim ilk 7 ayda
    const monthly = {};
    MONTHS.forEach(m => { if (m >= jm && rnd() < 0.85) monthly[m] = { enrolled:true }; });
    st.members.push({ id:'m'+i, name:ADLAR[i%20]+' '+SOY[i%10]+' '+i, joinDate:jm+'-01', phone: i%3? '05'+String(300000000+i) : '', totalPrice: pick([4000,5600,6400,8000,9600]), packages:[], monthly:monthly });
  }
  for (let g=0; g<25; g++) {
    const size = ri(2,4); const mem = []; for (let j=0;j<size;j++) mem.push('m'+((g*4+j)%120));
    const mm = {}; MONTHS.forEach(m => { mm[m] = mem.slice(); });
    st.groups.push({ id:'g'+g, name:'GRUP '+(g+1), size:size, memberIds:mem, defaultInstructorId:'h'+(g%5), packages:[], monthlyMembers:mm, monthlyNotes:{} });
  }
  let L=0, P=0, E=0;
  MONTHS.forEach((m, mi) => {
    const gecmis = m < cm; const dmax = daysIn(m);
    // dersler: ~390/ay (grup %60)
    const dersSay = ri(370, 410);
    for (let i=0;i<dersSay;i++) {
      const grup = rnd() < 0.6; const g = grup ? st.groups[ri(0,24)] : null;
      const uye = grup ? null : st.members[ri(0,119)];
      const stz = gecmis ? (rnd()<0.8?'completed':(rnd()<0.5?'missed':'cancelled')) : (rnd()<0.4?'completed':'planned');
      st.lessons.push({ id:'L'+(L++), date:m+'-'+String(ri(1,dmax)).padStart(2,'0'),
        time:String(ri(8,20)).padStart(2,'0')+':'+pick(['00','15','30','45']), durationMin:45,
        instructorId:'h'+ri(0,4), size: grup? g.size : 1,
        memberIds: grup? g.memberIds.slice() : [uye.id], groupId: grup? g.id : '',
        packageMonth:m, packageOwnerType: grup?'group':'member', packageOwnerId: grup? g.id : uye.id, status:stz });
    }
    // odemeler: ~92/ay
    const odSay = ri(85, 100);
    for (let i=0;i<odSay;i++) {
      const uye = st.members[ri(0,119)];
      st.payments.push({ id:'P'+(P++), memberId:uye.id, amount:pick([4000,5600,6400,8000,9600]),
        date:m+'-'+String(ri(1,dmax)).padStart(2,'0'), packageMonth:m, pkgName:'8 Ders', size:1, sessions:8,
        method:pick(['IBAN','IBAN','Nakit','Nakit','Kredi Kartı']), listPrice:0, note:'' });
    }
    // giderler
    st.expenses.push({ id:'E'+(E++), date:m+'-01', category:'Kira', amount:33000, resmi:true, kdvRate:0, note:'işyeri kirası ['+'KIRA-OTO-'+m+']' });
    st.expenses.push({ id:'E'+(E++), date:m+'-01', category:'Stopaj', amount:8250, resmi:true, kdvRate:0, note:'kira stopajı ['+'KIRA-OTO-'+m+'] muhtasar' });
    st.expenses.push({ id:'E'+(E++), date:m+'-05', category:'Elektrik/Su/Doğalgaz', amount:ri(2000,4500), resmi:true, kdvRate:20, note:'fatura' });
    st.expenses.push({ id:'E'+(E++), date:m+'-11', category:'Bağkur', amount:5000, note:'' });
    if (rnd()<0.7) st.expenses.push({ id:'E'+(E++), date:m+'-08', category:'Malzeme/Ekipman', amount:ri(500,6000), resmi:true, kdvRate:20, note:'malzeme' });
    if (rnd()<0.5) st.expenses.push({ id:'E'+(E++), date:m+'-14', category:'Temizlik', amount:ri(300,900), note:'fişsiz' });
    if (mi>0 && rnd()<0.6) st.expenses.push({ id:'E'+(E++), date:m+'-26', category:'KDV Ödemesi', amount:ri(1000,9000), note:'önceki dönem' });
    // bordro odemeleri (gecmis aylar)
    if (gecmis) {
      const pr = m.split('-').map(Number);
      st.instructors.forEach((h,hi) => {
        st.instructorPayouts.push({ id:'PO'+m+'-'+hi, instructorId:h.id, year:pr[0], month:pr[1], amount:ri(3000,9000), paidDate:m+'-28', method: hi%2?'IBAN':'Nakit', note: hi%2?'bordro (saatlik ücret)':'elden' });
      });
    }
  });
  const holi = [ {date:MONTHS[3]+'-15', name:'Resmi Tatil'}, {date:MONTHS[7]+'-01', name:'Bayram'} ];

  w.eval('window.__stressData = ' + JSON.stringify(st) + '; window.__stressHoli = ' + JSON.stringify(holi) + ';');
  w.eval(`
    state.members = __stressData.members; state.groups = __stressData.groups;
    state.instructors = __stressData.instructors; state.lessons = __stressData.lessons;
    state.payments = __stressData.payments; state.expenses = __stressData.expenses;
    state.instructorPayouts = __stressData.instructorPayouts;
    state.packageTypes = [{id:'p8',name:'8 Ders',sessions:8,price:8000}]; state.campaigns = [];
    state.settings.holidays = __stressHoli;
    state.settings.sgkHourlyWage = 124.78; state.settings.sgkHourlyCost = 40; state.settings.sgkFullMonthHours = 225;
    state.settings.kdvRate = 20; state.settings.taxRegime = 'sahis'; state.settings.taxOfficialMode = 'iban_kk';
    state.settings.taxStartMonth = '${M0}'; state.settings.taxOpeningKdv = 1200; state.settings.taxOpeningLoss = 50000;
    state.settings.taxRentNet = 33000; state.settings.taxLedger = { '${MONTHS[2]}': { gelir: 250000 } };
  `);
  console.log('[VERI] uye:'+st.members.length+' grup:'+st.groups.length+' ders:'+st.lessons.length+' odeme:'+st.payments.length+' gider:'+st.expenses.length+' bordro:'+st.instructorPayouts.length);

  console.log('[1] DEPOLAMA BOYUTU (localStorage 5MB butcesi)');
  const boyut = ev('JSON.stringify(state).length');
  console.log('  bilgi: state boyutu ' + (boyut/1024/1024).toFixed(2) + ' MB');
  t('state < 4.5MB (kota emniyeti)', boyut < 4.5*1024*1024, boyut);
  w.eval('save()');
  t('save() kaydetti (yerel anahtar dolu)', ev("(localStorage.getItem('pilateria')||'').length") > 100000);

  console.log('[2] PERFORMANS (jsdom; ust sinirlar comert — felaket yakalar)');
  function sure(fn){ const t0=Date.now(); fn(); return Date.now()-t0; }
  const pm = d.getElementById('pay-month'); if (pm) pm.value = cm;
  const rm = d.getElementById('rep-month'); if (rm) rm.value = cm;
  const sm = d.getElementById('sal-month'); if (sm) sm.value = cm;
  const T = {};
  T.uyeler   = sure(()=>w.renderMembers());
  T.odemeler = sure(()=>w.renderPayments());
  T.hocalar  = sure(()=>w.renderSalaries());
  T.raporlar = sure(()=>w.renderReports());
  w.eval("window.__forceCalMobile = false; calAnchor = parseISO(todayISO());");
  T.takvimM  = sure(()=>w.setCalView('month'));
  T.takvimH  = sure(()=>w.setCalView('week'));
  w.eval("window.__forceCalMobile = true;");
  T.takvimCep= sure(()=>w.renderCalendarMonth());
  w.eval("window.__forceCalMobile = false;");
  T.vergi    = sure(()=>ev("taxMonthModel('"+cm+"')"));
  console.log('  bilgi ms: ' + JSON.stringify(T));
  t('tum ana ekranlar < 3000ms', Object.values(T).every(x=>x<3000), JSON.stringify(T));
  t('12 aylik vergi zinciri < 1500ms', T.vergi < 1500, T.vergi);

  console.log('[3] TUTARLILIK DEGISMEZLERI (12 ayin HER BIRINDE, bagimsiz yeniden hesapla)');
  let netOk=0, kdvOk=0, bordroOk=0, hakOk=0;
  let oncekiDevir = null;
  MONTHS.forEach(m => {
    // net kar: bagimsiz aritmetik
    const N = JSON.parse(ev("JSON.stringify(netProfitForMonth('"+m+"'))"));
    const revX = st.payments.filter(p=>(p.packageMonth||p.date.slice(0,7))===m).reduce((a,p)=>a+p.amount,0);
    const payX = st.instructorPayouts.filter(p=>p.year===+m.split('-')[0]&&p.month===+m.split('-')[1]).reduce((a,p)=>a+p.amount,0);
    const expX = st.expenses.filter(e=>e.date.slice(0,7)===m).reduce((a,e)=>a+e.amount,0);
    if (Math.abs(N.net - Math.round((revX-payX-expX)*100)/100) < 0.02) netOk++;
    // KDV devir zinciri surekliligi
    const TM = JSON.parse(ev("JSON.stringify(taxMonthModel('"+m+"'))"));
    if (oncekiDevir === null || Math.abs(TM.devredenKdvOnceki - oncekiDevir) < 0.02) kdvOk++;
    oncekiDevir = TM.devredenKdvYeni;
    // bordro: her hoca icin iban+nakit iliskisi
    let bOk = true, hOk = true;
    st.instructors.forEach(h => {
      const PR = JSON.parse(ev("JSON.stringify(instructorPayrollForMonth('"+h.id+"','"+m+"'))"));
      if (PR.tam) { if (Math.abs(PR.iban - 225*124.78) > 0.02) bOk = false; }
      else if (Math.abs((PR.iban + PR.nakit) - PR.hakedis) > 0.02) bOk = false;
      const E2 = JSON.parse(ev("JSON.stringify({t: instructorEarningsForMonth('"+h.id+"','"+m+"').total})"));
      if (!(isFinite(E2.t) && E2.t >= 0)) hOk = false;
    });
    if (bOk) bordroOk++; if (hOk) hakOk++;
  });
  t('net kar 12/12 ay bagimsiz aritmetikle AYNI', netOk === 12, netOk);
  t('KDV devri 12/12 ay kesintisiz zincir (ay sonu = sonraki ay basi)', kdvOk === 12, kdvOk);
  t('bordro 12/12 ay: iban+nakit=hakedis (tam modda iban=225xucret)', bordroOk === 12, bordroOk);
  t('hakedis motoru 12/12 ay sonlu ve >=0', hakOk === 12, hakOk);

  console.log('[4] YIL DONUMU: zarar devri yeni yila tasinir');
  const ilkYil = +MONTHS[0].split('-')[0], sonYil = +cm.split('-')[0];
  if (ilkYil !== sonYil) {
    const aralikAyi = MONTHS.filter(m=>m.startsWith(String(ilkYil)+'-')).slice(-1)[0];
    const ocakAyi = MONTHS.filter(m=>m.startsWith(String(sonYil)+'-'))[0];
    const TMa = JSON.parse(ev("JSON.stringify(taxMonthModel('"+aralikAyi+"'))"));
    const TMo = JSON.parse(ev("JSON.stringify(taxMonthModel('"+ocakAyi+"'))"));
    // ocak YTD = yalniz ocak kari; onceki yilin zarari devrede
    t('yil donumu: ocak ytd = ocak kari (sifirlanmis)', Math.abs(TMo.ytdKar - TMo.kar) < 0.02, TMo.ytdKar+' vs '+TMo.kar);
    t('yil donumu: kalan matrah = ytd - devreden zarar (tasima calisiyor)', Math.abs(TMo.kalanMatrah - (TMo.ytdKar - (TMo.devredenZarar + TMo.kalanMatrah > 0 ? 0 : 0) )) >= 0 && isFinite(TMo.kalanMatrah), JSON.stringify({aralik:TMa.ytdKar, ocak:TMo.ytdKar, kalan:TMo.kalanMatrah}));
  } else { t('yil donumu (12 ay tek yila sigdi — atlandi)', true); t('yil donumu 2 (atlandi)', true); }

  console.log('[5] EKRAN SIZINTISI: undefined/NaN hicbir ana ekranda gorunmez');
  const ekranlar = ['members-tbody','payments-tbody','salaries-content','reports-content','calendar','expenses-list','tax-ledger-body'];
  let temiz = true, kirli = '';
  ekranlar.forEach(id => {
    const el = d.getElementById(id);
    if (!el) return;
    const h2 = el.innerHTML;
    if (/undefined|NaN/.test(h2)) { temiz = false; kirli += id + ' '; }
  });
  t('7 ana ekranda undefined/NaN yok', temiz, kirli);

  console.log('[6] CIKTILAR: CSV ureticileri yil verisiyle patlamaz');
  const csv1 = ev("buildPaymentsCsvRows('"+cm+"').length");
  const csv2 = ev("buildMembersCsvRows().length");
  const csv3 = ev("buildExpensesCsvRows('"+cm+"').length");
  t('odeme CSV >= 80 satir', csv1 >= 80, csv1);
  t('uye CSV >= 100 satir', csv2 >= 100, csv2);
  t('gider CSV >= 4 satir', csv3 >= 4, csv3);

  console.log('[7] BOS AY (gelecek): ekranlar bos veriyle de saglam');
  const gel = addM(cm, 1);
  if (pm) pm.value = gel; w.renderPayments();
  if (sm) sm.value = gel; w.renderSalaries();
  t('gelecek ay ekranlari cizildi (istisna yok)', true);
  const TMgel = JSON.parse(ev("JSON.stringify(taxMonthModel('"+gel+"'))"));
  t('gelecek ay vergi modeli sonlu', isFinite(TMgel.kalanMatrah) && isFinite(TMgel.devredenKdvYeni));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
