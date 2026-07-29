// v126 — HIZLI KAZANIMLAR: tatil, saglik rozeti, dogum gunu, toplu WA, maas esnekligi, kampanya tarih/limit, onaylar
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
    w.alert=(m)=>{w.__a=m;};w.confirm=(m)=>{w.__c=m;return w.__cAns!==false;};w.prompt=()=>null;w.scrollTo=()=>{};w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  const cm = w.eval('currentMonth()');
  w.eval(`
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8000},{id:'p2',name:'4 Ders',sessions:4,price:5000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    state.campaigns=[
      {id:'cx',name:'ESKI KAMPANYA',type:'percent',value:10,active:true,end:'2020-01-01',note:''},
      {id:'cl',name:'LIMITLI',type:'percent',value:5,active:true,limit:1,note:''},
      {id:'cok',name:'GECERLI',type:'percent',value:15,active:true,note:''}
    ];
    state.members=[
      {id:'m1',name:'AYSE',joinDate:'2026-01-01',totalPrice:1000,health:'Bel fıtığı',packages:[],monthly:{'${cm}':{enrolled:true}}},
      {id:'m2',name:'BURCU',joinDate:'2026-01-01',totalPrice:1000,packages:[],monthly:{'${cm}':{enrolled:true}}}
    ];
    state.groups=[{id:'g1',name:'AYSE - BURCU',size:2,memberIds:['m1','m2'],defaultInstructorId:'h1',packages:[],monthlyMembers:{},monthlyNotes:{}}];
    state.lessons=[{id:'L1',date:'${cm}-05',time:'10:00',durationMin:45,instructorId:'h1',size:1,memberIds:['m1'],groupId:'',packageMonth:'${cm}',status:'completed'}];
    state.payments=[{id:'pz',memberId:'m2',groupId:'',date:'${cm}-02',amount:100,listPrice:100,sessions:8,method:'Nakit',packageMonth:'${cm}',campaignId:'cl',campaignName:'LIMITLI'}];`);

  console.log('[1] KAPALI GUN');
  t('isHoliday fonksiyonu var', w.eval("typeof isHoliday === 'function'"));
  const holDay = w.eval(`(function(){ const wd = state.settings.workDays||[1,2,3,4,5,6]; for (let g=10; g<=20; g++) { const iso='${cm}-'+String(g).padStart(2,'0'); if (wd.includes(parseISO(iso).getDay())) return iso; } return '${cm}-15'; })()`);
  const cap0 = w.eval("monthOccupancy('"+cm+"').capacity");
  w.eval(`state.settings.holidays=[{date:'${holDay}',name:'TEST TATIL'}];`);
  const cap1 = w.eval("monthOccupancy('"+cm+"').capacity");
  t('isHoliday tatili taniyor', w.eval("isHoliday('"+holDay+"')") === true);
  t('doluluk kapasitesi kapali gunde duser', cap1 < cap0, cap1 + ' !< ' + cap0);
  t('ders eklerken KAPALI GUN onayi kodda', html.includes('KAPALI GÜN'));
  t('ayarlarda kapali gun karti', html.includes('holidays-list'));

  console.log('[2] DOGUM GUNU');
  w.openMemberModal();
  t('formda mm-birthday alani var', !!d.getElementById('mm-birthday'));
  const bd = w.eval(`(function(){ const t=todayISO().split('-').map(Number); const dd=new Date(t[0],t[1]-1,t[2]+2); return '1990-'+String(dd.getMonth()+1).padStart(2,'0')+'-'+String(dd.getDate()).padStart(2,'0'); })()`);
  d.getElementById('mm-name').value = 'DOGUM TEST';
  if (d.getElementById('mm-birthday')) d.getElementById('mm-birthday').value = bd;
  w.saveMember();
  t('dogum gunu kaydedildi', w.eval("(state.members.find(x=>x.name==='DOGUM TEST')||{}).birthday") === bd, w.eval("JSON.stringify((state.members.find(x=>x.name==='DOGUM TEST')||{}).birthday)"));
  w.eval("typeof __renderBirthdays==='function' && __renderBirthdays()");
  const bdE = d.getElementById('dash-birthdays');
  t('panel dogum gunu seridi gorunur', !!bdE && bdE.style.display === 'block' && /DOGUM TEST/.test(bdE.innerHTML), bdE ? (bdE.style.display + ' ' + bdE.textContent.slice(0,60)) : 'yok');

  console.log('[3] SAGLIK ROZETI');
  w.openGroupDetail('g1', cm);
  t('grup detayinda 🩺 (AYSE)', /🩺/.test(d.getElementById('gd-content').innerHTML));
  w.eval(`renderMembersCardsMobile(buildMemberRows('${cm}'), '${cm}');`);
  t('mobil kartta 🩺', /🩺/.test(d.getElementById('members-cards').innerHTML));

  console.log('[4] TOPLU WHATSAPP GIRISI');
  t('uye listesinde buton var', html.includes('openWaBulkFromMembers'));
  w.eval("document.getElementById('member-month') && (document.getElementById('member-month').value='"+cm+"')");
  let ok4 = false;
  try { w.openWaBulkFromMembers(); ok4 = !!d.getElementById('modal-whatsapp-bulk'); } catch(e) { ok4 = false; }
  t('modal acildi', ok4);
  if (d.getElementById('modal-whatsapp-bulk')) d.getElementById('modal-whatsapp-bulk').remove();

  console.log('[5] MAAS ESNEKLIGI');
  const hak = w.eval("instructorEarningsForMonth('h1','"+cm+"').total");
  t('hakedis > 0 (fixture)', hak > 0, String(hak));
  w.payInstructor('h1', cm, hak);
  const ipm = d.getElementById('modal-inst-pay');
  t('odeme MODALI acildi (dogrudan kayit degil)', !!ipm);
  t('modalda Hakedis/Kalan seridi', !!ipm && /Hakediş/.test(ipm.innerHTML) && /Kalan/.test(ipm.innerHTML));
  if (d.getElementById('ip-amount')) d.getElementById('ip-amount').value = '10';
  if (d.getElementById('ip-note')) d.getElementById('ip-note').value = 'avans';
  w.eval("typeof confirmPayInstructor==='function' && confirmPayInstructor('h1','"+cm+"')");
  t('kismi odeme kaydedildi (10 TL)', w.eval("(state.instructorPayouts||[]).filter(p=>p.instructorId==='h1').reduce((a,p)=>a+p.amount,0)") === 10);
  w.renderSalaries();
  t('maas tablosunda Kismi rozeti', /Kısmi/.test(d.getElementById('salaries-content').innerHTML));
  w.__c = '';
  w.payInstructor('h1', cm, hak);
  if (d.getElementById('ip-amount')) d.getElementById('ip-amount').value = '500';
  w.eval("confirmPayInstructor('h1','"+cm+"')");
  t('asim ONAY istedi', /aşıyor/.test(String(w.__c)), String(w.__c).slice(0,80));
  t('ayni aya IKINCI kayit yazilabildi', w.eval("(state.instructorPayouts||[]).filter(p=>p.instructorId==='h1').length") === 2, w.eval("(state.instructorPayouts||[]).length"));

  console.log('[6] KAMPANYA TARIH + LIMIT');
  w.openPaymentModal('m1');
  const copts = d.getElementById('mp-campaign').innerHTML;
  t('suresi gecmis kampanya listede YOK', !/ESKI KAMPANYA/.test(copts), copts.replace(/</g,' ').slice(0,120));
  t('limiti dolmus kampanya listede YOK', !/LIMITLI/.test(copts));
  t('gecerli kampanya listede VAR', /GECERLI/.test(copts));
  w.closeModal('modal-payment');
  t('ayarlarda tarih/limit alanlari', html.includes('data-cfield="start"') && html.includes('data-cfield="limit"'));

  console.log('[7] ONAYLAR');
  w.__cAns = false; // confirm -> hayir
  w.removePkg(0);
  t('onay reddedilince paket SILINMEDI', w.eval('state.packageTypes.length') === 2, w.eval('state.packageTypes.length'));
  w.__cAns = true;
  w.removePkg(0);
  t('onaylaninca silindi', w.eval('state.packageTypes.length') === 1);
  t('saveBatchDates silme onayi kodda', html.includes('takvimden SİLİNECEK'));

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
