// v127 — GIDER + NET KAR + IADE. Yamasiz build'de FAIL etmeli.
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
    w.alert=(m)=>{w.__a=m;};w.confirm=(m)=>{w.__c=m;return w.__cAns!==false;};w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  const cm = w.eval('currentMonth()');

  console.log('[1] SENKRON KABLOLAMASI');
  t('state.expenses dizisi var', w.eval('Array.isArray(state.expenses)'));
  t("SB_TABLES 'expenses' icerir", w.eval("SB_TABLES.indexOf('expenses') !== -1"));
  t('mergeColls expenses icerir', w.eval("typeof __sbMergeColls==='function' && __sbMergeColls().indexOf('expenses') !== -1"));
  w.eval(`state.expenses=[{id:'e1',date:'${cm}-03',category:'Kira',amount:300,note:'test kira'}];`);
  t('sbStateToRows expenses satiri uretir', w.eval("(function(){try{const r=sbStateToRows();return !!(r.expenses && r.expenses.e1 && r.expenses.e1.amount===300);}catch(e){return false;}})()"));
  t('sbRowsToState expenses okur', w.eval("(function(){try{const st=sbRowsToState({expenses:{e1:{id:'e1',date:'2026-01-01',amount:5}}});return st.expenses.length===1;}catch(e){return false;}})()"));
  t('sbApplyOne expenses uygular', w.eval("(function(){try{__sbShadow.expenses={e9:JSON.stringify({id:'e9',date:'2026-01-02',amount:7})};sbApplyOne('expenses','e9');return (state.expenses||[]).some(x=>x.id==='e9');}catch(e){return false;}})()"));
  w.eval("state.expenses = state.expenses.filter(x=>x.id!=='e9');");

  console.log('[2] GIDER UI + NET KAR');
  w.eval(`
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.members=[{id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:1500,packages:[],monthly:{'${cm}':{enrolled:true}}}];
    state.groups=[]; state.lessons=[]; state.campaigns=[];
    state.payments=[{id:'py1',memberId:'m1',groupId:'',date:'${cm}-05',amount:1000,listPrice:1500,sessions:8,method:'Nakit',packageMonth:'${cm}'}];
    state.instructorPayouts=[{id:'ip1',instructorId:'h1',year:+('${cm}'.split('-')[0]),month:+('${cm}'.split('-')[1]),amount:200,paidDate:'${cm}-06',note:''}];
    state.expenses=[{id:'e1',date:'${cm}-03',category:'Kira',amount:300,note:'test kira'}];`);
  const np = w.eval("(function(){try{const n=netProfitForMonth('"+cm+"');return JSON.stringify(n);}catch(e){return 'YOK';}})()");
  t('netProfitForMonth 1000-200-300=500', /"net":500/.test(np), np);
  w.eval("document.getElementById('pay-month') && (document.getElementById('pay-month').value='"+cm+"'); renderPayments();");
  t('gider karti listelendi', /test kira/.test((d.getElementById('expenses-list')||{}).innerHTML||''), ((d.getElementById('expenses-list')||{}).innerHTML||'yok').slice(0,60));
  t('gider toplami basliga yazildi', /300/.test((d.getElementById('expenses-total')||{}).textContent||''));
  if (d.getElementById('exp-date')) { d.getElementById('exp-date').value = cm + '-07'; d.getElementById('exp-amount').value = '50'; d.getElementById('exp-note').value = 'su'; }
  let addOk = false; try { w.addExpense(); addOk = w.eval('state.expenses.length') === 2; } catch(e) {}
  t('addExpense kaydetti', addOk, w.eval('JSON.stringify((state.expenses||[]).length)'));
  w.__cAns = false; try { w.removeExpense('e1'); } catch(e) {}
  t('onay reddi silmedi', w.eval("(state.expenses||[]).some(x=>x.id==='e1')"));
  w.__cAns = true; try { w.removeExpense('e1'); } catch(e) {}
  t('onayla silindi', w.eval("!(state.expenses||[]).some(x=>x.id==='e1')"));
  w.eval("state.expenses=[{id:'e1',date:'"+cm+"-03',category:'Kira',amount:300,note:'test kira'}];");
  w.renderReports();
  t('raporda NET KAR paneli', /NET KÂR/.test((d.getElementById('net-profit-panel')||{}).innerHTML||''), 'panel: ' + !!d.getElementById('net-profit-panel'));
  w.renderDashboard();
  t('panelde s-netprofit dolu', /\d/.test((d.getElementById('s-netprofit')||{}).textContent||''), (d.getElementById('s-netprofit')||{}).textContent);

  console.log('[3] IADE');
  w.openPaymentModal('m1');
  t('mp-refund kutusu var', !!d.getElementById('mp-refund'));
  if (d.getElementById('mp-refund')) { d.getElementById('mp-refund').checked = true; w.onRefundToggle(); }
  d.getElementById('mp-amount').value = '200';
  d.getElementById('mp-note').value = '';
  // uygulama alert'i plAlert diyaloguna sarar (v120) — mesaji __PL_DLG_AUTO__ kancasindan yakala
  w.eval("window.__PL_DLG_AUTO__ = function(o){ window.__dlgMsg = (o && o.msg) || ''; return (o && o.input) ? null : true; }; window.__dlgMsg='';");
  w.savePayment();
  t('aciklamasiz iade ENGELLENDI', /açıklama/i.test(w.eval("window.__dlgMsg||''")) && w.eval('state.payments.length') === 1, w.eval("window.__dlgMsg||''").slice(0,60) + ' / adet=' + w.eval('state.payments.length'));
  d.getElementById('mp-note').value = '2 ders iadesi';
  w.savePayment();
  const last = w.eval('JSON.stringify(state.payments[state.payments.length-1])');
  t('iade NEGATIF kaydedildi (-200)', /"amount":-200/.test(last), last.slice(0,140));
  t('iade bayragi var', /"refund":true/.test(last));
  t('paket olusturulmadi (iade)', w.eval("((state.members.find(x=>x.id==='m1')||{}).packages||[]).length") === 0);
  t('odenen dustu: paidTowards 800', w.eval("memberPaidTowardsMonth('m1','','"+cm+"')") === 800, w.eval("memberPaidTowardsMonth('m1','','"+cm+"')"));
  t('kalan yukseldi: 700', w.eval("memberBalanceForMonth('m1','"+cm+"')") === 700, w.eval("memberBalanceForMonth('m1','"+cm+"')"));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
