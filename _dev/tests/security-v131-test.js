// v131 — bakim turu: O-2/O-3/O-4/O-6/O-7 + taksit-indirim kusuru + extended ikizi + olu kod
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
    w.alert=()=>{};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};
    try { Object.defineProperty(w, 'crypto', { value: require('crypto').webcrypto, configurable: true }); } catch(e) { try { w.crypto.subtle = require('crypto').webcrypto.subtle; } catch(e2) {} }
    w.__PL_DLG_AUTO__=(o)=>{ if(!o||!o.input) return true; return /fiyat/i.test(o.msg||'') ? '1500' : 'sarkti notu'; };
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(async ()=>{ try {
  const cm = w.eval('currentMonth()');

  console.log('[1] O-3: bozuk id referanslariyla birlikte temizlenir');
  w.eval(`
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:1500}]; /* kampanya tabani = liste; tavana uysun */
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.campaigns=[{id:'c10',name:'YUZDE10',type:'percent',value:10,active:true,note:''}];
    state.members=[
      {id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:1500,packages:[],monthly:{'${cm}':{enrolled:true}}},
      {id:'m2',name:'KAMP',joinDate:'2026-01-01',totalPrice:1500,packages:[],monthly:{'${cm}':{enrolled:true}}},
      {id:'m3',name:'FIYATSIZ',joinDate:'2026-01-01',packages:[],monthly:{'${cm}':{enrolled:true}}},
      {id:'x\\" onclick=\\"hack()',name:'KOTU',joinDate:'2026-01-01',packages:[],monthly:{}}
    ];
    state.groups=[{id:'g1',name:'GRUP',size:2,memberIds:['m1','x\\" onclick=\\"hack()'],defaultInstructorId:'h1',packages:[],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[{id:'L1',date:'${cm}-05',time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['x\\" onclick=\\"hack()','m1'],groupId:'',packageMonth:'${cm}',status:'planned'}];
    state.payments=[{id:'py0',memberId:'x\\" onclick=\\"hack()',groupId:'',date:'${cm}-02',amount:100,listPrice:100,sessions:8,method:'Nakit',packageMonth:'${cm}'}];
    state.expenses=[];
    sanitizeStateText(state);`);
  const badLeft = w.eval(`state.members.some(m=>/["<>]/.test(String(m.id))) || state.lessons.some(l=>(l.memberIds||[]).some(i=>/["<>]/.test(String(i)))) || state.payments.some(p=>/["<>]/.test(String(p.memberId)))`);
  t('id alanlarinda tehlikeli karakter kalmadi', badLeft === false);
  const consistent = w.eval(`(function(){ const mid = state.members[3].id; return state.lessons[0].memberIds.includes(mid) && state.payments[0].memberId === mid && state.groups[0].memberIds.includes(mid); })()`);
  t('temizlenen id TUM referanslarda ayni (iliski kopmadi)', consistent === true, w.eval('state.members[3].id'));

  console.log('[2] O-6: prototype pollution kapisi');
  t('__sbBadKey fonksiyonu var ve __proto__ yakalar', w.eval("typeof __sbBadKey==='function' && __sbBadKey('__proto__') && __sbBadKey('constructor') && !__sbBadKey('m1')"));
  t('alim noktalarinda kapi kurulu (2 cekim + realtime)', (html.match(/__sbBadKey\(String\(row\.id\)\)/g)||[]).length >= 3);
  t('kirli nesne prototipe sizamiyor', w.eval("(function(){ const all={x:{}}; const row={id:'__proto__',data:{polluted:1}}; if (!__sbBadKey(String(row.id))) all.x[row.id]=row.data; return ({}).polluted === undefined; })()"));

  console.log('[3] O-2: eski PIN dogru giriste PBKDF2 formatina yukselir');
  const legacy = await w.eval("pinHash('1234')");
  w.eval("state._pinHash = " + JSON.stringify(legacy) + "; localStorage.setItem(PIN_HASH_KEY, " + JSON.stringify(legacy) + ");");
  const okPin = await w.eval("verifyPin('1234', getStoredPinHash())");
  t('eski format dogru PIN kabul', okPin === true);
  t('dogrulama sonrasi pbkdf2 formatina yukseltildi', w.eval("String(getStoredPinHash()).indexOf('pbkdf2$') === 0"), w.eval("String(getStoredPinHash()).slice(0,20)"));
  const okAfter = await w.eval("verifyPin('1234', getStoredPinHash())");
  t('yukseltilmis hash ile PIN hala calisiyor', okAfter === true);

  console.log('[4] TAKSIT INDIRIM DEGILDIR (v123 yan etkisi)');
  w.openPaymentModal('m1');
  d.getElementById('mp-amount').value = '1000';
  w.savePayment();
  const p1 = w.eval("JSON.stringify(state.payments.filter(p=>p.memberId==='m1').pop())");
  t('taksit kaydinda discount = 0', /"discount":0/.test(p1), p1.slice(0,140));
  w.openPaymentModal('m2');
  d.getElementById('mp-campaign').value = 'c10'; w.applyCampaign();
  w.savePayment();
  const p2 = w.eval("JSON.stringify(state.payments.filter(p=>p.memberId==='m2').pop())");
  t('kampanyali kayitta GERCEK indirim korunur (150)', /"discount":150/.test(p2), p2.slice(0,160));
  w.openPaymentModal('m3');
  d.getElementById('mp-list').value = '1000';
  d.getElementById('mp-amount').value = '900';
  w.savePayment();
  const p3 = w.eval("JSON.stringify(state.payments.filter(p=>p.memberId==='m3').pop())");
  t('fiyatsiz uyede eski davranis surer (discount 100)', /"discount":100/.test(p3), p3.slice(0,140));

  console.log('[5] EXTENDED IKIZI (v122 notu)');
  w.eval(`state.groups[0].memberIds=['m1']; state.groups[0].packages=[{month:'${cm}',sessions:8,price:3000,status:'active',startDate:'${cm}-01'}];`);
  const balOnce = w.eval("memberBalanceForMonth('m1','"+cm+"')");
  await w.markGroupPackageExtended('g1', cm, true);
  const balExt = w.eval("memberBalanceForMonth('m1','"+cm+"')");
  t('uzatilan ayda uye bakiyesi 0 olur', balExt === 0, balOnce + ' -> ' + balExt);
  t('__extZero bayragi kondu', w.eval("!!(state.members[0].monthly['"+cm+"']||{}).__extZero"));
  await w.markGroupPackageExtended('g1', cm, false);
  t('geri alinca bakiye geri gelir', w.eval("memberBalanceForMonth('m1','"+cm+"')") > 0, w.eval("memberBalanceForMonth('m1','"+cm+"')"));
  t('bayrak temizlendi', w.eval("!((state.members[0].monthly['"+cm+"']||{}).__extZero)"));

  console.log('[6] STATIK: O-4 + O-7 + olu kod');
  t('cerceve kirici pilateria.html icinde', html.includes('window.top !== window.self'));
  const sw = fs.readFileSync('sw.js','utf-8');
  t('sw.js res.ok kontrolu', sw.includes('res && res.ok'));
  t('recover+kurtar ASSETS listesinde', sw.includes("'./recover.html'") && sw.includes("'./kurtar.html'"));
  const rec = fs.readFileSync('recover.html','utf-8'), kur = fs.readFileSync('kurtar.html','utf-8'), idx = fs.readFileSync('index.html','utf-8');
  t('cerceve kirici recover/kurtar/index icinde', [rec,kur,idx].every(x=>x.includes('window.top !== window.self')));
  t('sbPickWinner olu kodu kaldirildi', !html.includes('function sbPickWinner'));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
