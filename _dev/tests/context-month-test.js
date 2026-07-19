// v34 — SAYFANIN AYI TEK BAGLAMDIR (Kerem sikayet seti, 2026-07-15)
// Senaryolar birebir: gecmis ay sayfasinda pasife alma / gruba geri ekleme / fiyat guncelleme / odeme ayi / ay secicisiz grup sayfasi
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
    w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;
  }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }

setTimeout(async ()=>{ try {
  // KURULUM: Haziran'dan beri var olan 2 kisilik grup + uyeler (bugun Temmuz 2026)
  w.eval(`
    state.members.push(
      {id:'cA',name:'CTX AYSE',joinDate:'2026-05-01',monthly:{},packages:[],totalPrice:4000,phone:'',tcno:'',adres:'',instructorId:'',health:'',note:''},
      {id:'cB',name:'CTX BUSE',joinDate:'2026-05-01',monthly:{},packages:[],totalPrice:4000,phone:'',tcno:'',adres:'',instructorId:'',health:'',note:''}
    );
    state.groups.push({id:'cG',name:'CTX GRUP',size:2,memberIds:['cA','cB'],packages:[],defaultDays:[],defaultTime:'10:00',defaultInstructorId:'',defaultPackageId:'',rescheduleUsed:0,cancelUsed:0,note:''});
    renderMembers();
  `);
  const setMonth = (ay) => { d.getElementById('member-month').value = ay; };

  console.log('[1] HAZIRAN PASIFE AL → v45 CARRY-FORWARD: Haziran+sonrasi pasif, Mayis korunur');
  setMonth('2026-06');
  w.deleteMember('cA'); // v42: "Pasife Al" = sadece o ay (enrolled:false), arsivleme YOK
  const mA = w.eval(`state.members.find(x=>x.id==='cA')`);
  t('ARSIVLENMEDI (ay-bazli, m.archived degil)', !mA.archived, JSON.stringify(mA.monthly));
  t('Haziranda PASIF (enrolled degil)', w.isMemberEnrolledInMonth('cA','2026-06')===false);
  t('TEMMUZDA da PASIF (carry-forward)', w.isMemberEnrolledInMonth('cA','2026-07')===false);
  t('MAYISTA arsiv yok (gecmis korunur)', w.isMemberInactiveInMonth(mA,'2026-05')===false);
  t('kadroda KALIR (roster korunur, ay-bazli)', w.resolveGroupMembersForMonth(w.eval(`state.groups.find(g=>g.id==='cG')`),'2026-06').includes('cA'));
  t('Mayis kadrosunda DURUYOR', w.resolveGroupMembersForMonth(w.eval(`state.groups.find(g=>g.id==='cG')`),'2026-05').includes('cA'));
  const rows6 = w.buildMemberRows('2026-06');
  t('Haziran uye listesinde gorunmez', !rows6.some(r=>r.memberId==='cA' || (r.member&&r.member.id==='cA')));

  console.log('[2] HAZIRAN sayfasinda GRUBA GERI EKLE → Haziranda gorunur, unarchive to=Haziran');
  setMonth('2026-06');
  w.assignMemberToSlot('cA','cG',0);
  const g2 = w.eval(`state.groups.find(g=>g.id==='cG')`);
  t('Haziran kadrosuna dondu', w.resolveGroupMembersForMonth(g2,'2026-06').includes('cA'));
  const mA2 = w.eval(`state.members.find(x=>x.id==='cA')`);
  t('arsiv kalkti', !mA2.archived);
  t('Haziranda AKTIF (donem to=2026-06)', w.isMemberInactiveInMonth(mA2,'2026-06')===false);
  t('Temmuzda da AKTIF', w.isMemberInactiveInMonth(mA2,'2026-07')===false);

  console.log('[3] GRUP SAYFASI: ay dropdown YOK, sabit ay etiketi VAR');
  w.openGroupDetail('cG','2026-06');
  const gd = d.getElementById('gd-content').innerHTML;
  t('ay SELECT yok', !/<select[^>]*openGroupDetail/.test(gd));
  t('sabit Haziran etiketi var', gd.includes('Haziran 2026'));

  console.log('[4] ODEME = ACILDIGI SAYFANIN AYI (secenek yok)');
  w.openGroupPaymentModal('cG'); // grup detayi Haziran'dan acik
  t('paket ayi gizli alan = 2026-06', d.getElementById('mp-pkg-month').value==='2026-06', d.getElementById('mp-pkg-month').value);
  t('etikette Haziran yazar', (d.getElementById('mp-pkg-month-label')||{}).value==='Haziran 2026');
  t('artik select degil', d.getElementById('mp-pkg-month').tagName==='INPUT');
  w.closeModal('modal-payment');

  console.log('[5] FIYAT: grup detayindan duzenleme GRUBUN AYINA yazilir + satirda gorunur');
  w.openGroupDetail('cG','2026-06');
  w.openMemberModal('cB'); // grup detayi acikken → ctx Haziran olmali
  t('duzenleme basligi Haziran', d.getElementById('mm-title').textContent.includes('Haziran'));
  d.getElementById('mm-total-price').value = '6000';
  w.saveMember();
  const mB = w.eval(`state.members.find(x=>x.id==='cB')`);
  t('Haziran fiyati 6000 yazildi', (mB.monthly['2026-06']||{}).totalPrice===6000, JSON.stringify(mB.monthly));
  t('kanon Haziran=6000 doner', w.memberMonthlyTotalPrice('cB','2026-06')===6000);
  t('Temmuz fiyati etkilenmedi (fallback 4000)', w.memberMonthlyTotalPrice('cB','2026-07')===4000);
  w.openGroupDetail('cG','2026-06');
  t('grup satirinda 6.000 gorunur (takili degil)', d.getElementById('gd-content').innerHTML.includes('6.000'));

  console.log('[6] TEMMUZ gorunumu Haziran isleminden etkilenmez (kadro ayrimi)');
  setMonth('2026-07');
  const g3 = w.eval(`state.groups.find(g=>g.id==='cG')`);
  t('Temmuz kadrosu guncel liste', w.resolveGroupMembersForMonth(g3,'2026-07').includes('cA') && w.resolveGroupMembersForMonth(g3,'2026-07').includes('cB'));

  console.log(`\nSONUC: ${pass} gecti, ${fail} kaldi`);
  process.exit(fail?1:0);
} catch(err) { console.error('TEST HATASI:', err); process.exit(1); } }, 700);
