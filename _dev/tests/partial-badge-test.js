// v194 (Kerem 14.10, canli TAM*** TAG***): Uyeler tablosunda GRUP uyesinin KISMI odemesi gorunmuyordu — satir sari (v110)
// ama hic odemeyenle ayni, tik ✅ (tam odeyenle ayni), ortak grup hucrelerinde kisi bazli tutar yok.
// KURAL: 0 < odenen < kendi fiyati → ad yaninda "🟡 Kısmi 4.400 / 4.500 · kalan 100 ₺" rozeti, tik 🟡, satir 'pay-part'.
// Tam odeyen ✅ (rozet yok), hic odemeyen ⬜ (rozet yok). Bireysel satirda da ayni; pay (ayrilan) satirinda da.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const html=fs.readFileSync(process.argv[2],'utf-8');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://localhost/p.html',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
  w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})}); if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
  Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
  w.alert=()=>{}; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{}; w.__PL_DLG_AUTO__=(o)=>(o&&o.input?null:true); }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  const CM=w.eval('currentMonth()');
  w.eval(`['renderCalendar','renderDashboard','renderGroups','renderArchive'].forEach(fn=>window[fn]=function(){});
    state.packageTypes=[{id:'p4',name:'4 KİŞİLİK',sessions:8,price:4500}]; state.instructors=[{id:'I',name:'ICLAL',shareRate:30}];
    const mk=(id,n,tp)=>({id,name:n,joinDate:'2026-01-01',defaultPackageId:'p4',totalPrice:tp||4500,packages:[],monthly:{'${CM}':{enrolled:true}}});
    state.members=[mk('Y','YAGMUR'),mk('N','NURGUL'),mk('V','VENNUR'),mk('T','TAMELLA'),mk('B','BIREYSEL',8500),mk('A','AYRILAN')];
    state.groups=[{id:'G',name:'YAGMUR - NURGUL - VENNUR - TAMELLA',size:4,memberIds:['Y','N','V','T'],defaultInstructorId:'I',defaultPackageId:'p4',packages:[{month:'${CM}',startDate:'${CM}-05',sessions:8,price:18000,status:'active'}],monthlyMembers:{'${CM}':['Y','N','V','T']},monthlyNotes:{},
      monthlyPartials:{'${CM}':[{at:'${CM}-10',note:'',memberId:'A',sessions:2,price:1125}]}}];
    state.members.find(m=>m.id==='A').monthly['${CM}']={enrolled:false};
    state.lessons=[]; state.payments=[
      {id:'p1',memberId:'Y',groupId:'G',date:'${CM}-14',amount:4500,method:'Nakit',packageMonth:'${CM}'},
      {id:'p2',memberId:'N',groupId:'G',date:'${CM}-07',amount:4500,method:'Nakit',packageMonth:'${CM}'},
      {id:'p3',memberId:'T',groupId:'G',date:'${CM}-14',amount:4400,method:'Nakit',packageMonth:'${CM}'},
      {id:'p4',memberId:'B',groupId:'',date:'${CM}-03',amount:5000,method:'IBAN',packageMonth:'${CM}'},
      {id:'p5',memberId:'A',groupId:'G',date:'${CM}-11',amount:600,method:'Nakit',packageMonth:'${CM}'}];
    document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option>'; document.getElementById('member-month').value='${CM}'; switchPage('members'); renderMembers();`);
  const row = name => [...d.querySelectorAll('#members-table tbody tr')].find(tr => (tr.querySelector('td b')||{}).textContent === name);
  const tick = tr => (tr.querySelector('button[onclick^="togglePaidTick"]')||{}).textContent;
  const badge = tr => (tr.querySelector('.pay-part-badge-194')||{}).textContent || '';
  console.log('[1] GRUP uyesi KISMI (4.400/4.500): rozet + 🟡 tik + pay-part');
  const T = row('TAMELLA');
  t('TAMELLA satiri sari (pay-due) + pay-part', T && /pay-due/.test(T.className) && /pay-part/.test(T.className), T && T.className);
  t('rozet: "🟡 Kısmi 4.400 / 4.500 · kalan 100 ₺"', /🟡 Kısmi 4\.400 \/ 4\.500 · kalan 100 ₺/.test(badge(T)), badge(T));
  t('tik 🟡', tick(T) === '🟡', tick(T));
  t('tik basligi kalani soyluyor', /kalan 100 ₺ tahsil/.test((T.querySelector('button[onclick^="togglePaidTick"]')||{}).title||''));
  console.log('[2] TAM odeyen ve HIC odemeyen degismedi');
  const Y = row('YAGMUR'), V = row('VENNUR');
  t('YAGMUR yesil, tik ✅, rozet yok', /pay-ok/.test(Y.className) && !/pay-part/.test(Y.className) && tick(Y)==='✅' && badge(Y)==='', Y.className+' '+tick(Y));
  t('VENNUR sari, tik ⬜, rozet yok', /pay-due/.test(V.className) && !/pay-part/.test(V.className) && tick(V)==='⬜' && badge(V)==='', V.className+' '+tick(V));
  console.log('[3] BIREYSEL kismi (5.000/8.500) ve AYRILAN payi kismi (600/1.125)');
  const B = row('BIREYSEL'), A = row('AYRILAN');
  t('bireysel: rozet "🟡 Kısmi 5.000 / 8.500 · kalan 3.500 ₺" + 🟡', /Kısmi 5\.000 \/ 8\.500 · kalan 3\.500 ₺/.test(badge(B)) && tick(B)==='🟡', badge(B)+' '+tick(B));
  t('ayrilan payi: rozet "🟡 Kısmi 600 / 1.125 · kalan 525 ₺" + 🟡', /Kısmi 600 \/ 1\.125 · kalan 525 ₺/.test(badge(A)) && tick(A)==='🟡', badge(A)+' '+tick(A));
  console.log('[4] kalan tahsil edilince rozet kalkar, ✅');
  w.eval(`state.payments.push({id:'p6',memberId:'T',groupId:'G',date:'${CM}-15',amount:100,method:'Nakit',packageMonth:'${CM}'}); renderMembers();`);
  const T2 = row('TAMELLA');
  t('TAMELLA tam: yesil, ✅, rozet yok', /pay-ok/.test(T2.className) && !/pay-part/.test(T2.className) && tick(T2)==='✅' && badge(T2)==='', T2.className+' '+tick(T2));
  console.log('[5] tik ile kalan tahsil (v110) ayni calisiyor');
  w.eval(`state.payments = state.payments.filter(p=>p.id!=='p6'); renderMembers();`);
  w.eval(`togglePaidTick('T','G',null,'${CM}')`);
  setTimeout(()=>{ const sum = w.eval("state.payments.filter(p=>p.memberId==='T').reduce((a,p)=>a+p.amount,0)"); t('tik → kalan 100 tahsil edildi (toplam 4.500)', sum===4500, sum);
    console.log('SONUC: '+pass+' gecti, '+fail+' kaldi'); process.exit(fail?1:0); }, 200);
} catch(e){ console.error('TEST COKTU',e); process.exit(2);} },1300);
