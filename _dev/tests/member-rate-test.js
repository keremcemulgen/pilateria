// v177 — GRUP DERSINDE UYEYE OZEL HOCA ORANI (Kerem 2026-09-28: "3'ü yap, grupta da kişiye özel olabiliyor").
// v176'ya kadar grubun uye-bazli orani (memberInstructorRates) yalniz uye derse TEK BASINA katildiginda islerdi;
// 4 kisilik derste grubun orani herkese uygulanirdi. v177: hakedis = Σ (uyenin 1-ders payi x o uyenin orani).
// Ayrica paket kaydina kopyalanan oran (bayat anlik goruntu) artik cozumde YOK: grubun/uyenin GUNCEL orani her ay
// (Kerem 28.09: eski aylar guncel kurala gore). Her bolum yamasiz (v176) build'de FAIL eder.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return (o&&o.input)?String(o.input.value):true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{}; w.print=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
const J = (expr) => JSON.parse(w.eval('JSON.stringify(' + expr + ')'));
const eq = (a,b) => Math.abs((+a||0)-(+b||0)) < 0.011;
const parseTL = s => { s = String(s || '').replace(/[^\d.,-]/g, ''); if (!s) return 0; if (s.indexOf(',') !== -1) s = s.replace(/\./g, '').replace(',', '.'); else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); return +s || 0; };
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  function fixture(){
    w.eval(`
      state.settings.reformers=12; state.settings.instructorShareRate=30;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
      state.instructors=[{id:'h1',name:'HOCA1',shareRate:30},{id:'h2',name:'HOCA2',shareRate:40}];
      state.campaigns=[]; state.expenses=[]; state.instructorPayouts=[];
      const mk = (id,name,rate) => ({id:id,name:name,phone:'',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,instructorShareRate:rate,packages:[],monthly:{'${CM}':{enrolled:true}}});
      state.members=[mk('A1','ASLI',null),mk('A2','BANU',null),mk('A3','CANSU',null),mk('A4','DERYA',null),mk('M1','MELIS',50),mk('M2','NAZ',null)];
      state.members.find(m=>m.id==='M1').packages=[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:4500,instructorShareRate:30,status:'active'}]; // bayat paket orani (uyenin guncel orani 50)
      state.groups=[
        {id:'G4',name:'DORTLU',size:4,memberIds:['A1','A2','A3','A4'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1],defaultTime:'10:00',memberInstructorRates:{A1:50},packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:18000,status:'active'}],monthlyMembers:{'${CM}':['A1','A2','A3','A4']},monthlyNotes:{}}
      ];
      state.lessons=[
        {id:'L1',groupId:'G4',memberIds:['A1','A2','A3','A4'],date:'${CM}-02',time:'10:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G4',instructorId:'h1',size:4},
        {id:'L2',groupId:'G4',memberIds:['A1'],date:'${CM}-04',time:'10:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G4',instructorId:'h1',size:4},
        {id:'L3',groupId:'G4',memberIds:['A1','A2','A3','A4'],date:'${CM}-06',time:'10:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G4',instructorId:'h1',size:4,instructorRateOverride:40},
        {id:'L4',memberIds:['M1','M2'],date:'${CM}-03',time:'15:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'',packageOwnerId:'',instructorId:'h2',size:2},
        {id:'L5',memberIds:['M1'],date:'${CM}-05',time:'16:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'M1',instructorId:'h2',size:1}
      ];
      state.payments=[];
      document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
      __undoStack=[];
      while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }
    `);
    w.__msgs.length=0;
  }
  const earn = (id) => w.eval(`instructorEarningForLesson(state.lessons.find(l=>l.id==='${id}'))`);
  const base = (id) => w.eval(`perLessonPriceForLesson(state.lessons.find(l=>l.id==='${id}'))`);

  console.log('[1] 4 KISILIK DERS, A1 uyeye ozel %50: hakedis = 562,5x0,5 + 3x562,5x0,3 = 787,5');
  fixture();
  t('taban 4 x 562,5 = 2250 (degismedi)', eq(base('L1'), 2250), base('L1'));
  t('L1 hakedis 787,5 (v176: 675)', eq(earn('L1'), 787.5), earn('L1'));
  t('L2 (A1 tek basina) 281,25 — eskisi gibi', eq(earn('L2'), 281.25), earn('L2'));
  t('L3 ders override %40 herkesi ezer: 2250 x 0,4 = 900', eq(earn('L3'), 900), earn('L3'));
  t('resolveInstructorRate(l, uye): A1 → 50, A2 → 30 (hoca)', w.eval("resolveInstructorRate(state.lessons.find(l=>l.id==='L1'),'A1')")===50 && w.eval("resolveInstructorRate(state.lessons.find(l=>l.id==='L1'),'A2')")===30, w.eval("resolveInstructorRate(state.lessons.find(l=>l.id==='L1'),'A1')") + '/' + w.eval("resolveInstructorRate(state.lessons.find(l=>l.id==='L1'),'A2')"));

  console.log('[2] GRUP ORANI %35 + uyeye ozel %50: 562,5x0,5 + 3x562,5x0,35 = 871,875');
  w.eval("state.groups.find(g=>g.id==='G4').instructorShareRate=35;");
  t('L1 hakedis 871,88', eq(earn('L1'), 871.875), earn('L1'));
  t('resolveInstructorRate(l): uye verilmezse grubun orani 35', w.eval("resolveInstructorRate(state.lessons.find(l=>l.id==='L1'))")===35);

  console.log('[3] PAKET KAYDINA KOPYALANAN ORAN (bayat) artik cozumde YOK — grubun GUNCEL orani');
  w.eval("state.groups.find(g=>g.id==='G4').packages[0].instructorShareRate=20;");
  t('grup paketinde %20 kopyasi olsa da oran 35 (v176: 20)', w.eval("resolveInstructorRate(state.lessons.find(l=>l.id==='L1'),'A2')")===35 && eq(earn('L1'), 871.875), w.eval("resolveInstructorRate(state.lessons.find(l=>l.id==='L1'),'A2')"));
  t('uye paketindeki %30 kopyasi olsa da MELIS in guncel orani 50: L5 = 562,5 x 0,5', eq(earn('L5'), 281.25), earn('L5'));

  console.log('[4] GRUPSUZ 2 UYELI DERS (M1 %50, M2 hoca %40): 562,5x0,5 + 562,5x0,4 = 506,25');
  t('L4 hakedis 506,25 (v176: ilk uyenin orani herkese → 562,5)', eq(earn('L4'), 506.25), earn('L4'));

  console.log('[5] AY TOPLAMLARI ve YUZEYLER tutarli');
  fixture();
  w.eval("state.groups.find(g=>g.id==='G4').instructorShareRate=35;");
  { const tot = w.eval(`instructorEarningsForMonth('h1','${CM}').total`); const sum = earn('L1')+earn('L2')+earn('L3'); t('instructorEarningsForMonth == Σ ders', eq(tot, sum), tot + ' vs ' + sum);
    const b = J(`instructorEarningsByGroupSize('h1','${CM}')`); t('boyuta gore dagilim toplami == ay toplami', eq(b[1]+b[2]+b[3]+b[4]+b[5], tot), JSON.stringify(b)); }
  w.eval(`__instructorMonth='${CM}'; switchPage('instructors'); renderInstructors();`); await tick();
  { const rows = [...d.querySelectorAll('#instructor-list table tbody tr')].map(tr => tr.textContent.replace(/\s+/g,' ').trim());
    const r1 = rows.find(r => /^02 /.test(r) && /DORTLU/.test(r));
    t('Hocalar sayfasi ders satiri: karma oran etiketi (%35 + üyeye özel %50) ve hakedis 871,88', !!r1 && /50/.test(r1) && /871,88/.test(r1), r1 && r1.slice(0,160)); }
  w.eval(`document.getElementById('sal-month').value='${CM}'; renderSalaries();`); await tick();
  { const tot = w.eval(`instructorEarningsForMonth('h1','${CM}').total`); const row = [...d.querySelectorAll('#salaries-content tr')].find(tr => tr.textContent.indexOf('HOCA1') !== -1);
    t('Maaslar: HOCA1 hakedisi ay toplamiyla ayni', !!row && [...row.querySelectorAll('td')].some(td => eq(parseTL(td.textContent.split('₺')[0]), tot)), row && row.textContent.replace(/\s+/g,' ').slice(0,120)); }

  console.log('[6] KAYNAK: resolveInstructorRate cagrilarinda paket orani okunmuyor');
  { const src = w.eval("resolveInstructorRate.toString()"); t('resolveInstructorRate icinde pkg.instructorShareRate YOK', src.indexOf('pkg.instructorShareRate') === -1); }

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
