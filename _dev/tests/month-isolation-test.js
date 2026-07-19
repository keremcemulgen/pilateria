// v22 — AY IZOLASYONU + GEC ODEME + 2.PAKET + otomatik ders sayisi testleri
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){ w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.alert=()=>{};w.confirm=()=>true;w.__PL_DLG_AUTO__=(o)=>o&&o.input?null:true;w.prompt=()=>null;w.scrollTo=()=>{}; }});
const w=dom.window,d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  w.eval(`
    state.instructors.push({id:'h1',name:'BUSE'});
    state.packageTypes.push({id:'p8',name:'8 Ders',sessions:8,price:8000});
    state.members.push(
      {id:'mA',name:'AYSE YILMAZ',joinDate:'2026-06-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'GENEL NOT A',totalPrice:4000},
      {id:'mB',name:'FATMA KAYA',joinDate:'2026-06-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000},
      {id:'mC',name:'ZEYNEP AK',joinDate:'2026-06-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:5000}
    );
    state.groups.push({id:'gX',name:'AYSE/FATMA',size:2,memberIds:['mA','mB'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultTime:'10:00',defaultDays:[2],packages:[],rescheduleUsed:0,cancelUsed:0,customTotalPrice:8000,note:'GRUP GENEL',monthlyNotes:{}});
    applyV10MigrationToState(state); // v25: genel notlar Haziran'a tasinir (fallback kalkti)
    window.S=()=>state;
  `);

  console.log('[1] NOT AY BAZLI + baska uyeye TASINMAZ');
  w.renderMembers(); // ay secenekleri dolsun
  d.getElementById('member-month').value = '2026-07';
  w.openMemberModal('mA');
  d.getElementById('mm-note').value = 'TEMMUZ OZEL NOTU';
  w.saveMember();
  const mA = w.S().members.find(x=>x.id==='mA'), mB = w.S().members.find(x=>x.id==='mB');
  t('Temmuz notu monthly kaydina yazildi', (mA.monthly['2026-07']||{}).note === 'TEMMUZ OZEL NOTU');
  t('genel alan bosaldi, not HAZIRANA sabitlendi (v25)', mA.note === '' && (mA.monthly['2026-06']||{}).note === 'GENEL NOT A', mA.note);
  t('BASKA UYEYE not tasinmadi', mB.note === '' && !(mB.monthly['2026-07']||{}).note);
  t('Haziran gorunumunde eski not', w.memberNoteForMonth(mA,'2026-06') === 'GENEL NOT A');
  t('Temmuz gorunumunde yeni not', w.memberNoteForMonth(mA,'2026-07') === 'TEMMUZ OZEL NOTU');

  console.log('[2] ZAM AY BAZLI: Temmuz fiyati Hazirani DEGISTIRMEZ');
  d.getElementById('member-month').value = '2026-07';
  w.openMemberModal('mC');
  d.getElementById('mm-total-price').value = 6000; // Temmuz zammi
  w.saveMember();
  const mC = w.S().members.find(x=>x.id==='mC');
  t('genel fiyat 5000 KALDI', +mC.totalPrice === 5000, mC.totalPrice);
  t('Temmuz fiyati 6000 (monthly)', w.memberMonthlyTotalPrice('mC','2026-07') === 6000);
  t('Haziran fiyati hala 5000', w.memberMonthlyTotalPrice('mC','2026-06') === 5000);

  console.log('[3] GEC ODEME: Temmuzda odenen HAZIRAN paketi Haziran gelirine');
  w.openPaymentModal('mC');
  d.getElementById('mp-date').value = '2026-07-05';        // odeme TEMMUZda
  d.getElementById('mp-pkg-month').value = '2026-06';      // paket HAZIRAN
  d.getElementById('mp-sessions').value = 8;
  d.getElementById('mp-amount').value = 5000;
  w.savePayment();
  const pay = w.S().payments.find(p=>p.memberId==='mC');
  t('odeme kaydi packageMonth=2026-06', pay && pay.packageMonth === '2026-06', pay && pay.packageMonth);
  t('odeme tarihi 2026-07-05 (bagimsiz)', pay.date === '2026-07-05');
  t('uye Haziran "odenmis" oldu', w.memberPaidForMonth('mC','2026-06') === 5000);
  t('Temmuz gelirine YAZILMADI', w.memberPaidForMonth('mC','2026-07') === 0);

  console.log('[4] PAKET BASLANGICI odeme tarihine ESITLENMEZ');
  const mcPkg = (w.S().members.find(x=>x.id==='mC').packages||[]).find(p=>p.month==='2026-06');
  t('paket olustu', !!mcPkg);
  t('startDate odeme tarihi DEGIL (ders yok -> ayin 1i)', mcPkg.startDate === '2026-06-01', mcPkg.startDate);
  // elle girilen baslangic (BIREYSEL uye mD ile — grup uyesi degil):
  w.eval("state.members.push({id:'mD',name:'DENIZ TAS',joinDate:'2026-07-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4500});");
  w.openPaymentModal('mD');
  d.getElementById('mp-date').value = '2026-07-06';
  d.getElementById('mp-pkg-month').value = '2026-07';
  d.getElementById('mp-pkg-start').value = '2026-07-26'; // ELLE
  d.getElementById('mp-sessions').value = 8;
  d.getElementById('mp-amount').value = 4500;
  w.savePayment();
  const mdPkg = (w.S().members.find(x=>x.id==='mD').packages||[]).find(p=>p.month==='2026-07');
  t('ELLE girilen paket baslangici kullanildi (26.07)', mdPkg && mdPkg.startDate === '2026-07-26', mdPkg && mdPkg.startDate);

  console.log('[5] v45: DERS SAYISI OTOMATIK DOLAR (opsiyonel) — odeme buna baglanmaz');
  w.openPaymentModal('mA');
  t('yeni odemede sessions OTOMATIK doldu (>=1, bos degil)', (+d.getElementById('mp-sessions').value) >= 1, d.getElementById('mp-sessions').value);
  t('sessions alani opsiyonel (min=0)', d.getElementById('mp-sessions').getAttribute('min') === '0');
  w.closeModal('modal-payment');

  console.log('[6] PASIF GECMISI: Temmuzda pasif, HAZIRANDA gorunmeye devam');
  w.eval(`const mm=state.members.find(x=>x.id==='mB'); mm.archived=true; mm.archivedAt='2026-07-15T10:00:00';`);
  const junRows = w.buildMemberRows('2026-06');
  const julRows = w.buildMemberRows('2026-07');
  t('HAZIRAN listesinde mB VAR (gecmis korunur)', junRows.some(r=>r.memberId==='mB'));
  t('TEMMUZ listesinde mB YOK', !julRows.some(r=>r.memberId==='mB'));
  w.eval(`const mm=state.members.find(x=>x.id==='mB'); mm.archived=false; delete mm.archivedAt;`);

  console.log('[7] v52: 2. PAKET UYE-BAZLI — grup uyesinden BAGIMSIZ KLON UYE (grup klonu YOK)');
  w.eval("window.openMemberDetail=function(){};"); // izolasyon: detay render'i test disi
  const activeBefore = w.S().members.filter(mm=>!mm.secondOfMember && w.isMemberEnrolledInMonth(mm.id,'2026-07')).length;
  w.createSecondPackage('group','gX','2026-07'); // geriye uyum: grup cagrisi -> ilk uyeden (mA) klon uye
  const cloneG = w.S().members.find(mm=>mm.secondOfMember==='mA');
  t('grup 2.paket -> KLON UYE (grup klonu OLUSMAZ)', !!cloneG && !w.S().groups.some(g=>g.secondOf==='gX'), cloneG&&cloneG.name);
  t('klon adi "(2. Paket)" iceriyor', cloneG && /\(2\. Paket\)/.test(cloneG.name), cloneG&&cloneG.name);
  t('klon secondOfMember=mA', cloneG && cloneG.secondOfMember==='mA');
  t('AKTIF uye sayisi DEGISMEDI (klon sayilmaz)', w.S().members.filter(mm=>!mm.secondOfMember && w.isMemberEnrolledInMonth(mm.id,'2026-07')).length===activeBefore, activeBefore);
  t('orijinal grup gX bozulmadi (mA,mB)', JSON.stringify(w.S().groups.find(g=>g.id==='gX').memberIds)===JSON.stringify(['mA','mB']));
  // klona odeme ASIL uyeyi etkilemez (ayri memberId)
  w.openPaymentModal(cloneG.id);
  d.getElementById('mp-date').value='2026-07-10';
  d.getElementById('mp-pkg-month').value='2026-07';
  d.getElementById('mp-sessions').value=8;
  d.getElementById('mp-amount').value=4000;
  w.savePayment();
  t('klon odemesi KLON uyeye bagli', w.S().payments.some(p=>p.memberId===cloneG.id));
  t('asil uye mA Temmuz odemesi YOK (bagimsiz)', !w.S().payments.some(p=>p.memberId==='mA' && (p.packageMonth==='2026-07')));

  console.log('[8] v52: 2. PAKET (bireysel uye) — bagimsiz klon uye');
  w.createSecondPackage('member','mC','2026-07');
  const cloneM = w.S().members.find(mm=>mm.secondOfMember==='mC');
  t('bireysel 2.paket -> klon uye (secondOfMember=mC)', !!cloneM && cloneM.secondOfMember==='mC');
  t('adi ZEYNEP + (2. Paket)', cloneM && cloneM.name.includes('ZEYNEP') && /\(2\. Paket\)/.test(cloneM.name), cloneM&&cloneM.name);
  t('klon Temmuz enrolled (bagimsiz)', cloneM && (cloneM.monthly['2026-07']||{}).enrolled===true);

  console.log('[9] GRUP notu ay bazli');
  w.eval(`currentGroupDetailId='gX'; currentGroupDetailMonth='2026-07';`);
  w.openGroupDetail('gX','2026-07');
  w.openGroupModal('gX');
  d.getElementById('mg-note').value = 'GRUP TEMMUZ NOTU';
  w.saveGroup();
  const gX = w.S().groups.find(g=>g.id==='gX');
  t('grup genel alani bosaldi, not HAZIRANDA (v25)', gX.note === '' && (gX.monthlyNotes||{})['2026-06'] === 'GRUP GENEL', gX.note);
  t('Temmuz grup notu ayri', (gX.monthlyNotes||{})['2026-07'] === 'GRUP TEMMUZ NOTU');
  t('Haziran gorunumu genel notu gosterir', w.groupNoteForMonth(gX,'2026-06') === 'GRUP GENEL');

  console.log('\\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
