// v125 — DEPOLAMA HIJYENI + panel indeks esdegerligi + render yonlendirme
// Yamasiz build'de FAIL etmeli: bozuk-yedek anahtarlari hic budanmiyor, gunluk halka 5, save() sinyalsiz.
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
    w.alert=(m)=>{w.__a=m;};w.confirm=()=>true;w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
    // kirli tohum: budanmasi gereken anahtarlar
    try {
      w.localStorage.setItem('pilateria_corrupted_BACKUP_100','a');
      w.localStorage.setItem('pilateria_corrupted_BACKUP_200','b');
      w.localStorage.setItem('pilateria_corrupted_BACKUP_300','c');
      ['2026-07-20','2026-07-21','2026-07-22','2026-07-23','2026-07-24'].forEach(d=>w.localStorage.setItem('pilateria_daily_'+d,'x'));
    } catch(e) {}
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function lsKeys(pfx){ const o=[]; for(let i=0;i<w.localStorage.length;i++){ const k=w.localStorage.key(i); if(k&&k.indexOf(pfx)===0)o.push(k);} return o.sort(); }
setTimeout(()=>{ try {
  console.log('[1] bozuk-yedek anahtarlari acilista budanir (en yeni 1 kalir)');
  const cb = lsKeys('pilateria_corrupted_BACKUP_');
  t('corrupted_BACKUP sayisi 1', cb.length === 1, cb.join(','));
  t('kalan en yenisi (_300)', cb.length === 1 && /_300$/.test(cb[0]), cb.join(','));

  console.log('[2] gunluk halka 3 gune iner (sunucuda saatlik+gecelik+aybasi yedek var)');
  const dl = lsKeys('pilateria_daily_');
  t('gunluk yedek sayisi 3', dl.length === 3, dl.join(','));
  t('en yeni 3 gun kaldi', dl.length === 3 && dl[0].endsWith('07-22') && dl[2].endsWith('07-24'), dl.join(','));

  console.log('[3] save() basari sinyali dondurur');
  t('save() === true', w.save() === true, String(w.save()));

  console.log('[4] KOTA DOLUNCA: buda + yeniden dene, kullaniciyi panik alertine BOGMA');
  w.__a = '';
  w.eval(`
    window.__q = 0;
    const __os = Storage.prototype.setItem;
    window.__restoreSI = () => { Storage.prototype.setItem = __os; };
    Storage.prototype.setItem = function(k, v){
      if (k === 'pilateria' && window.__q === 0) { window.__q = 1; const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
      return __os.apply(this, arguments);
    };`);
  const r = w.save();
  w.eval('window.__restoreSI()');
  t('kota hatasi tetiklendi', w.eval('window.__q') === 1);
  t('save kurtarip true dondu', r === true, String(r));
  t('YEREL DEPO DOLU alerti CIKMADI (otomatik kurtarildi)', !/YEREL DEPO DOLU/.test(String(w.__a||'')), String(w.__a||'').slice(0,60));

  console.log('[5] getNextWeekMissing esdegerlik (indeksli surum ayni sonucu verir)');
  const nwISO = w.eval("(function(){ const d = addDays(startOfWeek(0), 8); return (d && d.toISOString) ? d.toISOString().slice(0,10) : String(d).slice(0,10); })()");
  const cm = w.eval('currentMonth()');
  w.eval(`
    state.members=[
      {id:'m1',name:'M1',joinDate:'2026-01-01',monthly:{'${cm}':{enrolled:true}}},
      {id:'m2',name:'M2',joinDate:'2026-01-01',monthly:{'${cm}':{enrolled:true}}},
      {id:'m3',name:'SOLO',joinDate:'2026-01-01',monthly:{'${cm}':{enrolled:true}}}
    ];
    state.groups=[
      {id:'g1',name:'G1',size:2,memberIds:['m1'],monthlyMembers:{},packages:[]},
      {id:'g2',name:'G2',size:2,memberIds:['m2'],monthlyMembers:{},packages:[]}
    ];
    state.lessons=[{id:'L1',date:'${nwISO}',time:'10:00',durationMin:45,size:2,memberIds:['m1'],groupId:'g1',status:'planned'}];
    state.payments=[];`);
  const nw = w.eval("(function(){ const r=getNextWeekMissing(); return JSON.stringify({g:r.groups.map(x=>x.id), m:r.members.map(x=>x.id)}); })()");
  t('gelecek hafta dersi olan g1 listede YOK, g2 VAR, solo uye VAR', nw === '{"g":["g2"],"m":["m3"]}', nw);

  console.log('[6] getOverduePayments esdegerlik');
  w.eval(`
    state.members=[
      {id:'m1',name:'BIR',joinDate:'2026-01-01',totalPrice:1000,monthly:{}},
      {id:'m3',name:'SOLO',joinDate:'2026-01-01',totalPrice:500,monthly:{}}
    ];
    state.groups=[{id:'g1',name:'GRUP',size:1,memberIds:['m1'],monthlyMembers:{},packages:[]}];
    state.lessons=[
      {id:'a1',date:'2026-06-03',time:'10:00',durationMin:45,size:1,memberIds:['m1'],groupId:'g1',packageMonth:'2026-06',status:'completed'},
      {id:'a2',date:'2026-06-04',time:'11:00',durationMin:45,size:1,memberIds:['m3'],groupId:'',packageMonth:'2026-06',status:'completed'}
    ];
    state.payments=[{id:'p1',memberId:'m1',groupId:'g1',date:'2026-06-03',amount:400,listPrice:1000,sessions:8,method:'Nakit',packageMonth:'2026-06'}];`);
  const ov = w.eval("(function(){ const r=getOverduePayments(); return JSON.stringify(r.map(x=>({l:x.label,mi:x.missing})).sort((a,b)=>a.l<b.l?-1:1)); })()");
  t('grup 600 eksik + solo 500 eksik', /"mi":600/.test(ov) && /"mi":500/.test(ov) && (JSON.parse(ov).length===2), ov);

  console.log('[7] kaydetme yollari tam panel yenilemesi yerine yerinde tazeleme kullanir');
  t('savePayment eski 5li render zinciri KALKTI', !html.includes("renderPayments(); renderDashboard(); renderMembers(); renderCalendar(); if(typeof renderReports==='function') renderReports();"));
  t('deletePayment __refreshUIInPlace kullanir', /function deletePayment\(\)[\s\S]{0,400}__refreshUIInPlace\(\)/.test(html));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
