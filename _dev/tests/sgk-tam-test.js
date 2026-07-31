// v138 — TAM SIGORTA MODU: hoca/ay bazli; IBAN tam bordro, fark hocanin borcu.
// Yamasiz build'de FAIL etmeli. Esra senaryosu: 62 saat gercek, 225 saat tam, saatlik 124.78.
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
function ev(x){ return w.eval(x); }
setTimeout(()=>{ try {
  const cm = ev('currentMonth()');
  w.eval(`
    state.settings.sgkHourlyWage = 124.78;
    state.settings.sgkHourlyCost = 40;
    state.settings.sgkFullMonthHours = 225;
    state.packageTypes=[]; state.campaigns=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[]; state.groups=[];
    state.instructors=[{id:'h1',name:'ESRA KARABABA',shareRate:30},{id:'h2',name:'ZEYNEP',shareRate:30}];
    state.members=[
      {id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:1600,packages:[],monthly:{'${cm}':{enrolled:true}}},
      {id:'m2',name:'BUYUK',joinDate:'2026-01-01',totalPrice:800000,packages:[],monthly:{'${cm}':{enrolled:true}}}
    ];
    state.lessons=[];
    for (let i = 0; i < 62; i++) { // Esra: 62 gercek ders saati
      state.lessons.push({id:'E'+i,date:'${cm}-'+String((i%28)+1).padStart(2,'0'),time:'10:00',instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m1',status:'completed'});
    }
    state.lessons.push({id:'Z1',date:'${cm}-05',time:'11:00',instructorId:'h2',size:1,memberIds:['m2'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m2',status:'completed'});
    state.lessons.push({id:'Z2',date:'${cm}-06',time:'12:00',instructorId:'h2',size:1,memberIds:['m2'],groupId:'',packageMonth:'${cm}',packageOwnerType:'member',packageOwnerId:'m2',status:'completed'});
  `);

  console.log('[1] NORMAL MOD (tam kapali) — v134/135 davranisi AYNEN');
  const pr0 = ev("JSON.stringify(instructorPayrollForMonth('h1','"+cm+"'))");
  t('toggleSgkTam var', ev("typeof toggleSgkTam === 'function'"));
  t('normal: iban hakedise kirpik 3720 (62x124.78=7736 > 3720)', /"iban":3720,/.test(pr0), pr0);
  t('normal: sgk gercek 2480 (62x40), borc 0', /"sgk":2480,/.test(pr0) && /"borc":0/.test(pr0));

  console.log('[2] TAM SIGORTA ACIK — Esra (hakedis 3720 < tam bordro)');
  w.toggleSgkTam('h1', cm);
  t('anahtar hoca kaydina yazildi', ev("!!state.instructors.find(i=>i.id==='h1').sgkTam['"+cm+"']"));
  const pr1 = ev("JSON.stringify(instructorPayrollForMonth('h1','"+cm+"'))");
  t('IBAN tam bordro 28075.5 (225 x 124.78; KIRPILMAZ)', /"iban":28075.5,/.test(pr1), pr1);
  t('SGK tam 9000 (225x40); gercek 2480 ayri', /"sgk":9000,/.test(pr1) && /"sgkReal":2480,/.test(pr1));
  t('maas farki 24355.5 (28075.5-3720)', /"maasFark":24355.5,/.test(pr1));
  t('SGK farki 6520 (9000-2480)', /"sgkFark":6520,/.test(pr1));
  t('HOCA BORCU 30875.5 (maas + SGK farki)', /"borc":30875.5/.test(pr1));
  t('nakit 0 (hakedis tam bordronun altinda)', /"nakit":0,/.test(pr1));

  console.log('[3] TAM SIGORTA — Zeynep (hakedis 60000 > tam bordro: fazlasi nakit, borc sadece SGK farki)');
  w.toggleSgkTam('h2', cm);
  const pr2 = ev("JSON.stringify(instructorPayrollForMonth('h2','"+cm+"'))");
  t('IBAN 28075.5 + nakit 31924.5 (60000 hakedis)', /"iban":28075.5,/.test(pr2) && /"nakit":31924.5,/.test(pr2), pr2);
  t('maas farki 0, borc = SGK farki 8920 (9000-80)', /"maasFark":0,/.test(pr2) && /"borc":8920/.test(pr2));

  console.log('[4] BOL-ODE (tam): payout TOPLAMI = HAKEDIS, rozet dogru');
  w.payInstructorSplit('h1', cm);
  const poH1 = ev("JSON.stringify((state.instructorPayouts||[]).filter(p=>p.instructorId==='h1').map(p=>({m:p.method,a:p.amount})))");
  t('Esra: IBAN +28075.5 ve Nakit -24355.5 (geri alim)', /"m":"IBAN","a":28075.5/.test(poH1) && /"m":"Nakit","a":-24355.5/.test(poH1), poH1);
  t('Esra payout toplami = hakedis 3720', Math.round(ev("(state.instructorPayouts||[]).filter(p=>p.instructorId==='h1').reduce((a,p)=>a+p.amount,0)")*100)/100 === 3720);
  w.payInstructorSplit('h2', cm);
  t('Zeynep: IBAN 28075.5 + Nakit 31924.5, toplam 60000', Math.round(ev("(state.instructorPayouts||[]).filter(p=>p.instructorId==='h2').reduce((a,p)=>a+p.amount,0)")*100)/100 === 60000);
  w.renderSalaries();
  t('rozet ✓ Odendi (toplam=hakedis)', (d.getElementById('salaries-content').innerHTML.match(/✓ Ödendi/g)||[]).length === 2);
  w.payInstructorSplit('h1', cm);
  t('tam modda ikinci Bol-Ode engellendi (once Geri Al)', /Geri Al/.test(String(w.__dlgMsg||'')) && ev("(state.instructorPayouts||[]).filter(p=>p.instructorId==='h1').length") === 2);

  console.log('[5] SGK GIDERE YAZ: tam prim + NEGATIF fark tahsili -> net maliyet gercek saat');
  w.addSgkExpenseForMonth(cm);
  const exps = ev("JSON.stringify(state.expenses.map(e=>({c:e.category,a:e.amount})))");
  t('Vergi/SGK 18000 (tam primler: 9000+9000)', exps.indexOf('"c":"Vergi/SGK","a":18000') !== -1, exps);
  t('Diger -15440 (fark tahsili: 6520+8920)', /"c":"Diğer","a":-15440/.test(exps), exps);
  t('ay gider NETI 2560 = gercek SGK (2480+80)', ev("expensesTotalForMonth('"+cm+"')") === 2560);
  w.addSgkExpenseForMonth(cm);
  t('mukerrer engellendi (2 kayit kaldi)', ev('state.expenses.length') === 2);

  console.log('[6] EKRAN');
  const sal = d.getElementById('salaries-content').innerHTML;
  t('satirda 🛡️ TAM rozeti + borc yazisi', /🛡️ TAM ✓/.test(sal) && /hoca borcu/.test(sal));
  t('satirda GERCEK SGK da yazar (v139: tam 9000 / gercek 2480)', /SGK tam/.test(sal) && /gerçek 2\.480|gerçek 2480/.test(sal.replace(/&nbsp;/g,' ')), (sal.match(/SGK tam[\s\S]{0,60}/)||['yok'])[0].replace(/<[^>]*>/g,' '));
  t('ay seridi SGK kutusunda gercek toplam 2560 (v139)', /gerçek: 2\.560|gerçek: 2560/.test(sal.replace(/&nbsp;/g,' ')));
  w.payInstructor('h2', cm, 60000);
  const mdl139 = d.getElementById('modal-inst-pay');
  t('odeme modalinda gercek SGK parantezde (v139: gercek 80)', !!mdl139 && /gerçek 80/.test(mdl139.innerHTML.replace(/&nbsp;/g,' ')), mdl139 ? ((mdl139.innerHTML.match(/SGK[\s\S]{0,80}/)||['SGK yok'])[0].replace(/<[^>]*>/g,' ')) : 'modal yok');
  if (mdl139) mdl139.remove();
  t('ay seridinde Geri Alinacak 39795.5 (30875.5+8920)', /Hocalardan Geri Alınacak/.test(sal) && /39\.795,5|39795.5|39.795,50/.test(sal.replace(/&nbsp;/g,' ')), sal.match(/Geri Alınacak[\s\S]{0,120}/) ? sal.match(/Geri Alınacak[\s\S]{0,120}/)[0].replace(/<[^>]*>/g,' ') : 'yok');

  console.log('[7] KAPAT: normal moda doner');
  w.toggleSgkTam('h1', cm);
  const pr3 = ev("JSON.stringify(instructorPayrollForMonth('h1','"+cm+"'))");
  t('tam kapaninca kirpik 3720 + borc 0', /"iban":3720,/.test(pr3) && /"borc":0/.test(pr3));

  console.log('[8] AYARLAR: tam sigorta saati');
  w.renderSettings();
  t('set-sgk-fullhours alani 225', d.getElementById('set-sgk-fullhours') && d.getElementById('set-sgk-fullhours').value === '225');
  d.getElementById('set-sgk-fullhours').value = '200';
  w.saveSettings();
  t('kalici yazildi (200)', ev('state.settings.sgkFullMonthHours') === 200);

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
