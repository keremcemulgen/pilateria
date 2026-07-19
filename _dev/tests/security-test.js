// Pilateria — GUVENLIK TESTI: XSS temizligi (kaynak+yukleme), PIN PBKDF2 cift-format, CSP varligi
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { webcrypto } = require('crypto');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    if(!w.crypto||!w.crypto.subtle){ Object.defineProperty(w,'crypto',{value:webcrypto,configurable:true}); }
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{}; }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(async ()=>{ try {
  w.eval('window.S=()=>state; window.setState=(o)=>{state=o;};');

  console.log('[1] CSP + referrer meta head\'de');
  const csp = d.querySelector('meta[http-equiv="Content-Security-Policy"]');
  t('CSP meta var', !!csp);
  t('connect-src JSONBin + self ile kisitli', csp && /connect-src 'self' https:\/\/api\.jsonbin\.io/.test(csp.content));
  t('object-src none', csp && /object-src 'none'/.test(csp.content));
  t('base-uri self', csp && /base-uri 'self'/.test(csp.content));
  t('frame-ancestors none (clickjacking)', csp && /frame-ancestors 'none'/.test(csp.content));
  t('referrer no-referrer', !!d.querySelector('meta[name="referrer"][content="no-referrer"]'));

  console.log('[2] XSS: kotu niyetli isim/not KAYNAKTA temizlenir (save)');
  w.eval(`
    state.members.push({id:'x1', name:'<img src=x onerror=alert(1)>', note:'<script>steal()</script>', adres:'<b>adr', phone:'<svg>', tcno:'<i>', health:'<a>', packages:[{month:'2026-06',extendedNote:'<x>'}], monthly:{}, instructorId:'', totalPrice:1000});
    state.groups.push({id:'g1', name:'GRUP<script>', note:'<iframe>', memberIds:['x1'], size:1, packages:[], defaultInstructorId:'', defaultPackageId:'', defaultTime:'', defaultDays:[], rescheduleUsed:0, cancelUsed:0});
    save();
  `);
  const m = w.S().members.find(x=>x.id==='x1');
  const g = w.S().groups.find(x=>x.id==='g1');
  t('uye adi < > sokuldu', !/[<>]/.test(m.name), JSON.stringify(m.name));
  t('uye notu < > sokuldu', !/[<>]/.test(m.note), JSON.stringify(m.note));
  t('adres/phone/tcno/health temiz', !/[<>]/.test(m.adres+m.phone+m.tcno+m.health));
  t('paket extendedNote temiz', !/[<>]/.test(m.packages[0].extendedNote));
  t('grup adi+notu temiz', !/[<>]/.test(g.name+g.note));

  console.log('[3] XSS: BULUTTAN gelen zehirli veri yuklemede temizlenir');
  // sanitizeStateText'i dogrudan zehirli state ile cagir (pullFromCloud'un yaptigi)
  const poison = { settings:{}, members:[{id:'p',name:'<script>x</script>',note:'ok',packages:[],monthly:{}}], groups:[], lessons:[{id:'l',note:'<img onerror=1>'}], payments:[{id:'pay',pkgName:'<b>',note:'<i>',method:'<x>'}], instructors:[], packageTypes:[{id:'pt',name:'<u>'}], campaigns:[], waTemplates:[] };
  w.sanitizeStateText(poison);
  t('buluttan uye adi temiz', !/[<>]/.test(poison.members[0].name), poison.members[0].name);
  t('buluttan ders notu temiz', !/[<>]/.test(poison.lessons[0].note));
  t('buluttan odeme alanlari temiz', !/[<>]/.test(poison.payments[0].pkgName+poison.payments[0].note+poison.payments[0].method));
  t('buluttan paket adi temiz', !/[<>]/.test(poison.packageTypes[0].name));

  console.log('[4] XSS: render sonrasi DOM\'da <script>/<img onerror> YOK');
  d.getElementById('member-month').value='';
  w.renderMembers();
  const cardsHtml = d.getElementById('members-cards').innerHTML + d.getElementById('members-tbody').innerHTML;
  // Acklar soküldü -> hicbir GERCEK etiket olusamaz (onerror= sadece zararsiz DUZ METIN olarak kalabilir)
  t('DOM\'da <img/<script/<svg/<iframe ETIKETI yok', !/<img|<script|<svg|<iframe/i.test(cardsHtml));
  t('render alaninda onerror tasiyan element yok', d.querySelectorAll('#members-cards [onerror], #members-tbody [onerror]').length === 0);
  t('injecte <script> elementi yok', d.querySelectorAll('#members-cards script, #members-tbody script').length === 0);

  console.log('[5] PIN PBKDF2 + cift-format dogrulama');
  const v2 = await w.pinHashV2('1234');
  t('yeni hash pbkdf2$ formatinda', v2.startsWith('pbkdf2$'), v2.slice(0,30));
  t('dogru PIN pbkdf2 dogrular', await w.verifyPin('1234', v2));
  t('yanlis PIN reddedilir', !(await w.verifyPin('9999', v2)));
  // eski format geriye uyumluluk
  const legacy = await w.pinHash('5678');
  t('eski SHA-256 hash hala dogrulanir (kilitlenme yok)', await w.verifyPin('5678', legacy));
  t('eski formatta yanlis PIN reddedilir', !(await w.verifyPin('0000', legacy)));
  t('ayni PIN farkli tuz -> farkli hash (tuz calisiyor)', (await w.pinHashV2('1234')) !== v2);

  console.log('[6] Otomatik kilit altyapisi + dis kaynak yok');
  t('PIN_AUTOLOCK suresi tanimli (3dk)', w.eval('typeof PIN_AUTOLOCK_MS') === 'number' && w.eval('PIN_AUTOLOCK_MS') === 180000);
  t('harici <script src> yok', d.querySelectorAll('script[src^="http"]').length === 0);
  t('harici stylesheet yok', [...d.querySelectorAll('link[rel=stylesheet]')].filter(l=>/^https?:/.test(l.getAttribute('href')||'')).length === 0);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
