// v180 — AY LISTESI VERIYE GORE (Kerem 2026-09-28: "Haziran paketlerini neden goremiyorum, ay listesinde Haziran yok").
// Kok: Uyeler (-2..+3), Gruplar (-3..+3), Hocalar (-6..+3) ay secicileri BUGUNE gore sabit pencereydi — zaman gectikce
// verisi olan eski aylar listeden dusuyordu. v180: tek kaynak monthOptionsHTML180 — en eski veri ayindan (ders/odeme/
// paket/kadro/pay) bugun+3'e kadar; veri sonradan gelirse (bulut yuklemesi) liste yeniden kurulur, secim korunur.
// Yamasiz (v179) build'de FAIL eder.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=true; w.alert=()=>{}; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{}; w.print=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const sh = (k) => { const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-1+k,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); };
  const OLD = sh(-4), OLDER = sh(-7), NEXT3 = sh(3), NEXT4 = sh(4);
  const opts = (id) => [...d.querySelectorAll('#' + id + ' option')].map(o => o.value);
  w.eval(`
    state.settings.reformers=12; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
    state.instructors=[{id:'h1',name:'HOCA1',shareRate:30}];
    state.members=[{id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[{month:'${OLD}',startDate:'${OLD}-01',sessions:8,price:4500,status:'completed'}],monthly:{'${OLD}':{enrolled:true},'${CM}':{enrolled:true}}}];
    state.groups=[]; state.lessons=[{id:'L1',memberIds:['A'],date:'${OLD}-05',time:'10:00',status:'completed',packageMonth:'${OLD}',packageOwnerType:'member',packageOwnerId:'A',instructorId:'h1',size:1}];
    state.payments=[{id:'P1',memberId:'A',groupId:'',date:'${OLD}-01',packageMonth:'${OLD}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'}];
    document.getElementById('member-month').innerHTML=''; document.getElementById('group-month').innerHTML='';
  `);

  console.log('[1] Uyeler ay listesi: verisi olan ' + OLD + ' (4 ay once) listede, bugun secili, +3 aya kadar');
  w.eval("renderMembers()"); await tick();
  { const o = opts('member-month'); t('Uyeler: ' + OLD + ' listede', o.includes(OLD), JSON.stringify(o)); t('Uyeler: secili = bu ay', d.getElementById('member-month').value === CM, d.getElementById('member-month').value); t('Uyeler: son secenek bugun+3 (' + NEXT3 + '), +4 yok', o[o.length-1] === NEXT3 && !o.includes(NEXT4), o[o.length-1]); t('Uyeler: ' + OLDER + ' (veri yok) listede degil', !o.includes(OLDER)); }

  console.log('[2] Gruplar ve Hocalar ay listeleri ayni kaynaktan');
  w.eval("renderGroups()"); await tick();
  t('Gruplar: ' + OLD + ' listede, secili bu ay', opts('group-month').includes(OLD) && d.getElementById('group-month').value === CM, JSON.stringify(opts('group-month')));
  w.eval("switchPage('instructors'); renderInstructors();"); await tick();
  { const o = [...d.querySelectorAll('#instructor-list select option')].map(x => x.value); t('Hocalar: ' + OLD + ' listede, bu ay secili', o.includes(OLD) && [...d.querySelectorAll('#instructor-list select option')].some(x => x.selected && x.value === CM), JSON.stringify(o)); }

  console.log('[3] Veri SONRADAN gelirse (bulut yuklemesi) liste genisler, SECIM korunur');
  w.eval(`document.getElementById('member-month').value='${OLD}'; state.payments.push({id:'P2',memberId:'A',groupId:'',date:'${OLDER}-01',packageMonth:'${OLDER}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'}); renderMembers();`); await tick();
  { const o = opts('member-month'); t('Uyeler: ' + OLDER + ' eklendi', o.includes(OLDER), JSON.stringify(o)); t('Uyeler: secim ' + OLD + ' korundu', d.getElementById('member-month').value === OLD, d.getElementById('member-month').value); }

  console.log('[4] Veri yoksa eski pencere (bugun-2..+3) — bos kurulumda liste bos kalmaz');
  w.eval(`state.members=[]; state.lessons=[]; state.payments=[]; state.groups=[]; document.getElementById('member-month').innerHTML=''; renderMembers();`); await tick();
  { const o = opts('member-month'); t('bos veri: ' + sh(-2) + ' … ' + NEXT3 + ' (6 ay), bu ay secili', o[0] === sh(-2) && o[o.length-1] === NEXT3 && o.length === 6 && d.getElementById('member-month').value === CM, JSON.stringify(o)); }

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
