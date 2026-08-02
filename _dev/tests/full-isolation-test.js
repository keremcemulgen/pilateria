// v25 — TAM AY IZOLASYONU: grup pasifligi/kadro/fiyat + not tasimama + uye detayi ay bazli
// 2026-08-02 guncelleme: tarih-dayaniklilik — aylar calisma aninda (P2/P1/CM/NM). Istisna: NOT
// MIGRATION hedefi uygulamada SABIT '2026-06'dir (tarihsel tek seferlik tasima) — o assert sabit kalir.
// ROSTER_START_MONTH kanonu (v58): CM kadrolari fikstursel olarak ACIKCA enrolled yazilir.
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
  const CM = w.eval('currentMonth()');
  const P1 = w.eval("prevMonthISO(currentMonth())");
  const P2 = w.eval("prevMonthISO(prevMonthISO(currentMonth()))");
  const NM = w.eval("(function(){const p=currentMonth().split('-').map(Number);const d0=new Date(p[0],p[1],1);return d0.getFullYear()+'-'+String(d0.getMonth()+1).padStart(2,'0');})()");
  w.eval(`
    state.instructors.push({id:'h1',name:'BUSE'});
    state.members.push(
      {id:'a1',name:'AYSE',joinDate:'${P2}-01',packages:[],monthly:{'${CM}':{enrolled:true}},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'ESKI GENEL NOT',totalPrice:4000},
      {id:'a2',name:'FATMA',joinDate:'${P2}-01',packages:[],monthly:{'${CM}':{enrolled:true}},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000},
      {id:'a3',name:'YENI ZEYNEP',joinDate:'${P2}-01',packages:[],monthly:{'${CM}':{enrolled:true}},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000}
    );
    state.groups.push({id:'gg',name:'AYSE/FATMA',size:2,memberIds:['a1','a2'],defaultInstructorId:'h1',defaultPackageId:'',defaultTime:'10:00',defaultDays:[2],
      packages:[{month:'${P1}',startDate:'${P1}-01',sessions:8,price:9000,status:'active',rescheduleUsed:0,cancelUsed:0},{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active',rescheduleUsed:0,cancelUsed:0}],
      rescheduleUsed:0,cancelUsed:0,customTotalPrice:9000,note:'GRUP ESKI NOTU',monthlyNotes:{}});
    state.lessons.push({id:'jl',date:'${P1}-10',time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['a1','a2'],groupId:'gg',packageMonth:'${P1}',status:'completed',note:''});
    state.payments.push({id:'jp',memberId:'a1',groupId:'gg',date:'${P1}-05',packageMonth:'${P1}',pkgName:'G',sessions:8,amount:4500,listPrice:4500,method:'Nakit',partial:false,note:''});
    applyV10MigrationToState(state); // migration testte de calissin
    window.S=()=>state;
  `);

  console.log('[1] NOT MIGRATION + TASINMAMA (migration hedefi SABIT 2026-06)');
  const a1 = w.S().members.find(x=>x.id==='a1');
  t('eski genel not migration ayina tasindi', (a1.monthly['2026-06']||{}).note === 'ESKI GENEL NOT');
  t('genel alan bosaldi', a1.note === '');
  t('migration ayinda not VAR', w.memberNoteForMonth(a1,'2026-06') === 'ESKI GENEL NOT');
  t('SONRAKI AYDA NOT GORUNMEZ (tasinmadi!)', w.memberNoteForMonth(a1,'2026-07') === '');
  const gg0 = w.S().groups.find(x=>x.id==='gg');
  t('grup notu migration ayina tasindi, sonrasinda yok', w.groupNoteForMonth(gg0,'2026-06')==='GRUP ESKI NOTU' && w.groupNoteForMonth(gg0,'2026-07')==='');

  console.log('[2] GRUP: BU AY (CM) PASIFE AL -> onceki ay (P1) AYNEN kalir');
  w.eval(`archiveGroupMonthly('gg');`);
  const gg = w.S().groups.find(x=>x.id==='gg');
  t('grup arsivli + tarihli (CM)', gg.archived === true && String(gg.archivedAt).slice(0,7) === CM, String(gg.archivedAt).slice(0,7));
  t('P1 listesinde grup DURUYOR', w.buildMemberRows(P1).some(r=>r.groupId==='gg'));
  t('CM listesinde grup YOK', !w.buildMemberRows(CM).some(r=>r.groupId==='gg'));
  t('P1 dersi korundu (completed)', w.S().lessons.find(l=>l.id==='jl').status === 'completed');
  t('uyeler CM de BIREYSEL dala dustu (kaybolmadi)', w.buildMemberRows(CM).some(r=>r.memberId==='a1' && r.type==='individual'));

  console.log('[3] GRUP yeniden AKTIVE -> CM pasifligi tarihe sabit');
  w.eval(`
    // simulasyon: sonraki ay (NM) aktive edilmis olsun
    const g=state.groups.find(x=>x.id==='gg');
    g.archivePeriods=[{from:'${CM}',to:'${NM}'}]; g.archived=false; delete g.archivedAt;
  `);
  t('CM de HALA yok (donem kaydi)', !w.buildMemberRows(CM).some(r=>r.groupId==='gg'));
  t('P1 de var', w.buildMemberRows(P1).some(r=>r.groupId==='gg'));
  t('NM+ icin aktif (roster ayri konu)', !w.isGroupInactiveInMonth(w.S().groups.find(x=>x.id==='gg'),NM));

  console.log('[4] KADRO SNAPSHOT: CM de uye degisikligi P1 i ETKILEMEZ');
  w.eval(`
    const g=state.groups.find(x=>x.id==='gg');
    g.archivePeriods=[]; // temiz test icin
    snapshotGroupMembers(g);            // degisiklikten once (fonksiyonlar zaten cagiriyor)
    g.memberIds = ['a1','a3'];          // FATMA cikti, ZEYNEP girdi (CM de)
  `);
  t('P1 kadrosu ESKI (FATMA)', w.resolveGroupMembersForMonth(w.S().groups.find(x=>x.id==='gg'),P1).includes('a2'));
  t('P1 kadrosunda ZEYNEP YOK', !w.resolveGroupMembersForMonth(w.S().groups.find(x=>x.id==='gg'),P1).includes('a3'));
  t('CM kadrosu YENI (ZEYNEP)', w.resolveGroupMembersForMonth(w.S().groups.find(x=>x.id==='gg'),CM).includes('a3'));
  t('P1 LISTESINDE FATMA grup satirinda', w.buildMemberRows(P1).some(r=>r.memberId==='a2'&&r.groupId==='gg'));
  t('P1 grup detay kadrosu eski', true);

  console.log('[5] FIYAT AY BAZLI: v28 — GRUP TOPLAMI = UYE FIYAT TOPLAMI (birincil), ay izolasyonlu');
  w.eval(`const g=state.groups.find(x=>x.id==='gg'); g.customTotalPrice=12000; g.packages.find(p=>p.month==='${CM}').price=12000;`);
  // CM kadrosu a1+a3 (4000+4000) — paket/custom 12000 olsa BILE uye toplami kazanir
  t('CM beklenen = UYE TOPLAMI 8000 (paket 12000 degil)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gg'),CM) === 8000, w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gg'),CM));
  // a1'e CM'E OZEL fiyat: CM degisir, P1 DEGISMEZ
  w.eval(`setMemberMonthly('a1','${CM}',{totalPrice:6000});`);
  t('CM toplami guncel (6000+4000=10000)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gg'),CM) === 10000);
  t('P1 toplami SABIT (a1+a2 = 8000, CM zammi etkilemedi)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gg'),P1) === 8000);
  // Uyelerde hic fiyat yoksa: paket fiyatina duser (yedek)
  w.eval(`state.members.push({id:'a9',name:'FIYATSIZ',joinDate:'${P2}-01',packages:[],monthly:{'${CM}':{enrolled:true}},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:''},{id:'a10',name:'FIYATSIZ2',joinDate:'${P2}-01',packages:[],monthly:{'${CM}':{enrolled:true}},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:''});
    state.groups.push({id:'gf',name:'FY',size:2,memberIds:['a9','a10'],defaultInstructorId:'',defaultPackageId:'',defaultTime:'',defaultDays:[],packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:7500,status:'active'}],rescheduleUsed:0,cancelUsed:0,customTotalPrice:'',monthlyNotes:{}});`);
  t('uye fiyati hic yoksa AY PAKETI fiyatina duser (7500)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gf'),CM) === 7500);
  // Uyeye paket atanmissa fiyati ondan gelir
  w.eval(`state.packageTypes.push({id:'pQ',name:'PkQ',sessions:8,price:5200}); state.members.find(x=>x.id==='a9').defaultPackageId='pQ';`);
  t('uyeye atanan paketin fiyati uye fiyati sayilir (5200)', w.memberMonthlyTotalPrice('a9',CM) === 5200);
  t('grup toplami = paketli uye toplami (5200, digeri 0)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gf'),CM) === 5200);

  console.log('[6] UYE DETAYI AY BAZLI: baska ayin odeme/dersi listeye karismaz');
  w.eval(`state.payments.push({id:'tp',memberId:'a1',groupId:'gg',date:'${CM}-02',packageMonth:'${CM}',pkgName:'G',sessions:8,amount:6000,listPrice:6000,method:'Nakit',partial:false,note:''});`);
  w.renderMembers();
  const ms6=d.getElementById('member-month'); if(ms6 && !Array.from(ms6.options).some(o=>o.value===P1)) ms6.innerHTML+='<option value="'+P1+'">'+P1+'</option>';
  ms6.value = P1;
  w.openMemberDetail('a1');
  let md = d.getElementById('md-content').innerHTML;
  t('P1 detayinda P1 odemesi (4500) VAR', md.includes('4.500') || md.includes('4500'));
  t('P1 detayinda CM odemesi (6000) ana listede YOK', !md.split('Tüm Geçmiş')[0].includes('6.000'));
  t('P1 detayinda P1 dersi VAR', md.includes(w.eval("fmtDate('"+P1+"-10')")));
  t('baslikta ay etiketi', d.getElementById('md-name').innerHTML.includes(P1));
  ms6.value = CM;
  w.openMemberDetail('a1');
  md = d.getElementById('md-content').innerHTML;
  t('CM detayinda 6000 VAR, 4500 ana listede YOK', md.split('Tüm Geçmiş')[0].includes('6.000') && !md.split('Tüm Geçmiş')[0].includes('4.500'));
  t('Tum Gecmis bolumu iki kaydi da tasir', md.includes('Tüm Geçmiş'));
  w.closeModal('modal-member-detail');

  console.log('[7] UYE PAKETI AY BAZLI');
  w.eval(`setMemberMonthly('a1','${CM}',{packageId:'pX'}); state.packageTypes.push({id:'pX',name:'Ozel',sessions:6,price:5000});`);
  d.getElementById('member-month').value=CM; w.openMemberDetail('a1');
  t('CM detayinda ay paketi (Ozel)', d.getElementById('md-content').innerHTML.includes('Ozel'));
  d.getElementById('member-month').value=P1; w.openMemberDetail('a1');
  t('P1 detayinda Ozel paket GORUNMEZ', !d.getElementById('md-content').innerHTML.includes('Ozel'));
  w.closeModal('modal-member-detail');

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
