// v137 — RESMI DEFTER: KDV devri, matrah, zarar devri, tarife, resmi/reel ayrimi.
// Yamasiz build'de FAIL etmeli. Sayilar elle dogrulanmis sabit senaryo.
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
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};
    w.__PL_DLG_AUTO__=(o)=>{ w.__dlgMsg = o && o.msg; return o && o.input ? null : true; };
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function addM(ym,k){ const p=ym.split('-').map(Number); const dd=new Date(p[0],p[1]-1+k,1); return dd.getFullYear()+'-'+String(dd.getMonth()+1).padStart(2,'0'); }
function ev(x){ return w.eval(x); }
setTimeout(()=>{ try {
  const cm = ev('currentMonth()');
  const M0 = addM(cm,-2), M1 = addM(cm,-1);
  const Y = +cm.split('-')[0], MO = +cm.split('-')[1];
  w.eval(`
    state.settings.kdvRate = 20; state.settings.gvRate = 15;
    state.settings.taxRegime = 'sahis'; state.settings.taxOfficialMode = 'iban_kk';
    state.settings.taxStartMonth = '${M0}'; state.settings.taxOpeningKdv = 500;
    state.settings.taxOpeningLoss = 10000; state.settings.taxRentNet = 33000;
    state.settings.taxLedger = {}; delete state.settings.taxBrackets;
    state.packageTypes=[]; state.campaigns=[]; state.groups=[]; state.members=[]; state.lessons=[];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.payments=[
      {id:'P1',memberId:'m1',amount:12000,date:'${cm}-05',method:'IBAN'},
      {id:'P2',memberId:'m1',amount:6000,date:'${cm}-06',method:'Kredi Kartı'},
      {id:'P3',memberId:'m1',amount:5000,date:'${cm}-07',method:'Nakit'}
    ];
    state.expenses=[
      {id:'e1',date:'${cm}-03',category:'Malzeme/Ekipman',amount:1200,resmi:true,kdvRate:20,note:'reformer yedek'},
      {id:'e2',date:'${cm}-01',category:'Kira',amount:33000,resmi:true,kdvRate:0,note:'kira'},
      {id:'e3',date:'${cm}-04',category:'Temizlik',amount:500,note:'fissiz eski kayit'},
      {id:'e4',date:'${cm}-10',category:'Stopaj',amount:8250,note:'muhtasar'},
      {id:'e5',date:'${cm}-11',category:'Bağkur',amount:5000,note:''},
      {id:'e6',date:'${cm}-12',category:'Vergi/SGK',amount:1000,note:''},
      {id:'e7',date:'${cm}-13',category:'KDV Ödemesi',amount:700,note:'gecen donem'}
    ];
    state.instructorPayouts=[
      {id:'x1',instructorId:'h1',year:${Y},month:${MO},amount:2000,paidDate:'${cm}-15',method:'IBAN',note:'bordro'},
      {id:'x2',instructorId:'h1',year:${Y},month:${MO},amount:3000,paidDate:'${cm}-15',method:'Nakit',note:'elden'}
    ];`);

  console.log('[1] MOTOR — tek ay bilesenleri (elle dogrulanmis senaryo)');
  t('taxMonthModel var', ev("typeof taxMonthModel === 'function'"));
  t('resmi gelir 18000 (IBAN 12000 + POS 6000; nakit HARIC)', ev("taxMonthModel('"+cm+"').gelir") === 18000, ev("JSON.stringify(taxMonthModel('"+cm+"'))"));
  t('hesaplanan KDV 3000 (ic yuzde %20)', ev("taxMonthModel('"+cm+"').hesapKdv") === 3000);
  t('indirilecek KDV 200 (yalniz 🧾 fatura: 1200un KDVsi; fissiz 500 SAYILMAZ)', ev("taxMonthModel('"+cm+"').indKdv") === 200);
  t('matrah gideri 50250 (fatura net 34000 + bordro IBAN 2000 + stopaj 8250 + SGK 1000 + Bagkur 5000; KDV odemesi HARIC, nakit hoca odemesi HARIC)', ev("taxMonthModel('"+cm+"').gider") === 50250);
  t('fatura net 34000 (1000 + 33000)', ev("taxMonthModel('"+cm+"').faturaNet") === 34000);
  t('resmi ZARAR ay: -35250 (15000 net gelir - 50250)', ev("taxMonthModel('"+cm+"').kar") === -35250);
  t('vergi odemeleri dokumu dogru', ev("JSON.stringify([taxMonthModel('"+cm+"').vergiOde['Stopaj'],taxMonthModel('"+cm+"').vergiOde['Bağkur'],taxMonthModel('"+cm+"').vergiOde['Vergi/SGK'],taxMonthModel('"+cm+"').vergiOde['KDV Ödemesi']])") === '[8250,5000,1000,700]');

  console.log('[2] KDV DEVIR ZINCIRI (baslangic devri 500 dahil)');
  t('odenecek KDV 2300 (3000 - 200 - devir 500)', ev("taxMonthModel('"+cm+"').odenecekKdv") === 2300);
  t('onceki devir 500, yeni devir 0', ev("taxMonthModel('"+cm+"').devredenKdvOnceki") === 500 && ev("taxMonthModel('"+cm+"').devredenKdvYeni") === 0);
  w.eval("state.expenses.push({id:'eM1',date:'"+M1+"-05',category:'Malzeme/Ekipman',amount:6000,resmi:true,kdvRate:20,note:'onceki ay fatura'});");
  t('onceki ay faturasi devri buyutur: odenecek 1300 (devir 500+1000)', ev("taxMonthModel('"+cm+"').odenecekKdv") === 1300 && ev("taxMonthModel('"+cm+"').devredenKdvOnceki") === 1500);
  w.eval("state.expenses = state.expenses.filter(e=>e.id!=='eM1');");

  console.log('[3] ZARAR DEVRI + TAHMINI VERGI');
  t('yil ici kalan -45250 (ay zarari + baslangic devreden zarar 10000)', ev("taxMonthModel('"+cm+"').kalanMatrah") === -45250);
  t('devreden zarar 45250, vergi CIKMAZ (0)', ev("taxMonthModel('"+cm+"').devredenZarar") === 45250 && ev("taxMonthModel('"+cm+"').tahminiVergi") === 0);
  t('reel net -31650 (kayit disi dahil; netProfit SEMANTIGI DEGISMEDI)', ev("netProfitForMonth('"+cm+"').net") === -31650);
  t('resmi-reel fark 3600', ev("taxMonthModel('"+cm+"').kayitDisiFark") === 3600);

  console.log('[4] MUHASEBECI DUZELTMELERI (override) + KURUM REJIMI');
  w.eval("state.settings.taxLedger['"+cm+"'] = {gelir:24000, indKdv:150};");
  t('gelir override: hesap KDV 4000, odenecek 3350', ev("taxMonthModel('"+cm+"').hesapKdv") === 4000 && ev("taxMonthModel('"+cm+"').odenecekKdv") === 3350);
  t('kar override ile -30250 (20000 - 50250)', ev("taxMonthModel('"+cm+"').kar") === -30250);
  w.eval("state.settings.taxLedger = {}; state.settings.taxRegime = 'kurum';");
  t('kurumda Bagkur matraha GIRMEZ: gider 45250', ev("taxMonthModel('"+cm+"').gider") === 45250);
  w.eval("state.settings.taxOpeningLoss = 0; state.settings.taxLedger['"+cm+"'] = {gelir:24000, gider:1000};");
  t('kurum vergisi %25: kar 19000 -> vergi 4750', ev("taxMonthModel('"+cm+"').kar") === 19000 && ev("taxMonthModel('"+cm+"').tahminiVergi") === 4750);
  w.eval("state.settings.taxRegime='sahis'; state.settings.taxOpeningLoss=10000; state.settings.taxLedger={};");

  console.log('[5] GELIR VERGISI TARIFESI (GIB 2026 varsayilan + ozellestirme)');
  t('150000 -> 22500 (%15)', ev("__taxBracketCalc(150000)") === 22500);
  t('300000 -> 50500 (28500 + 110000x%20)', ev("__taxBracketCalc(300000)") === 50500);
  t('500000 -> 97500 (70500 + 100000x%27)', ev("__taxBracketCalc(500000)") === 97500);
  t('6000000 -> 2017500 (ust dilim %40)', ev("__taxBracketCalc(6000000)") === 2017500);
  w.eval("state.settings.taxBrackets = '100000:10,0:30';");
  t('ozel tarife: 200000 -> 40000', ev("__taxBracketCalc(200000)") === 40000);
  w.eval("delete state.settings.taxBrackets;");

  console.log('[6] EKRAN: Odemeler > Resmi Defter paneli');
  const pm = d.getElementById('pay-month'); if (pm) pm.value = cm;
  w.renderPayments();
  const tb = d.getElementById('tax-ledger-body').innerHTML;
  t('panel dolu: Odenecek KDV + devreden zarar + TAHMINIDIR', /Ödenecek KDV/.test(tb) && /devreden zarar/.test(tb) && /TAHMİNİDİR/.test(tb));
  t('muhasebeci duzeltme alanlari var', !!d.getElementById('tl-gelir') && !!d.getElementById('tl-gider'));
  t('ozet satiri devlete odenenleri sayar', /Stopaj/.test(tb) && /Bağkur/.test(tb));
  d.getElementById('tl-gelir').value = '24000'; d.getElementById('tl-not').value = 'muhasebeci temmuz';
  w.saveTaxOverrides(cm);
  t('override kaydedildi ve panelde esas alindi', ev("state.settings.taxLedger['"+cm+"'].gelir") === 24000 && /24.000|24000/.test(d.getElementById('tax-ledger-body').innerHTML));
  w.eval("state.settings.taxLedger={};");

  console.log('[7] KIRA + STOPAJ TEK TUS (net 33000 -> stopaj 8250)');
  if (pm) pm.value = M1;
  w.addRentWithStopaj();
  const kExp = ev("JSON.stringify((state.expenses||[]).filter(e=>String(e.date).slice(0,7)==='"+M1+"').map(e=>({c:e.category,a:e.amount,r:!!e.resmi})))");
  t('iki kayit: Kira 33000 + Stopaj 8250 (resmi)', /"c":"Kira","a":33000,"r":true/.test(kExp) && /"c":"Stopaj","a":8250,"r":true/.test(kExp), kExp);
  w.addRentWithStopaj();
  t('mukerrer engellendi', ev("(state.expenses||[]).filter(e=>String(e.date).slice(0,7)==='"+M1+"').length") === 2 && /zaten/.test(String(w.__dlgMsg||'')));
  if (pm) pm.value = cm;

  console.log('[8] GIDER FORMU: 🧾 + KDV alanlari addExpense ile kaydolur');
  d.getElementById('exp-date').value = cm + '-15';
  const catSel = d.getElementById('exp-cat'); catSel.value = 'Pazarlama';
  d.getElementById('exp-amount').value = '240';
  d.getElementById('exp-resmi').checked = true;
  d.getElementById('exp-kdv').value = '20';
  w.addExpense();
  const yeni = ev("JSON.stringify((state.expenses||[]).filter(e=>e.category==='Pazarlama').map(e=>({a:e.amount,r:!!e.resmi,k:+e.kdvRate})))");
  t('kayit resmi + KDV %20 tasiyor', /"a":240,"r":true,"k":20/.test(yeni), yeni);
  t('gider satirinda 🧾 rozeti', /🧾/.test(d.getElementById('expenses-list').innerHTML));

  console.log('[9] AYARLAR ALANLARI + KALICILIK');
  w.renderSettings();
  t('rejim/resmi-sayim/tarife alanlari var', !!d.getElementById('set-tax-regime') && !!d.getElementById('set-tax-official') && !!d.getElementById('set-tax-brackets'));
  t('tarife varsayilani GIB 2026', d.getElementById('set-tax-brackets').value === '190000:15,400000:20,1000000:27,5300000:35,0:40');
  t('net kira alani 33000', d.getElementById('set-tax-rent').value === '33000');
  d.getElementById('set-tax-openloss').value = '12000';
  w.saveSettings();
  t('saveSettings kalici yazdi (openLoss 12000)', ev('state.settings.taxOpeningLoss') === 12000);
  t('EXPENSE_CATS yeni kategoriler', ev("EXPENSE_CATS.indexOf('Stopaj')!==-1 && EXPENSE_CATS.indexOf('Bağkur')!==-1 && EXPENSE_CATS.indexOf('KDV Ödemesi')!==-1"));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
