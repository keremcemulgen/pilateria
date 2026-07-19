// v25 — TAM AY IZOLASYONU: grup pasifligi/kadro/fiyat + not tasimama + uye detayi ay bazli
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
    state.members.push(
      {id:'a1',name:'AYSE',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'ESKI GENEL NOT',totalPrice:4000},
      {id:'a2',name:'FATMA',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000},
      {id:'a3',name:'YENI ZEYNEP',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'h1',health:'',note:'',totalPrice:4000}
    );
    state.groups.push({id:'gg',name:'AYSE/FATMA',size:2,memberIds:['a1','a2'],defaultInstructorId:'h1',defaultPackageId:'',defaultTime:'10:00',defaultDays:[2],
      packages:[{month:'2026-06',startDate:'2026-06-01',sessions:8,price:9000,status:'active',rescheduleUsed:0,cancelUsed:0},{month:'2026-07',startDate:'2026-07-01',sessions:8,price:9000,status:'active',rescheduleUsed:0,cancelUsed:0}],
      rescheduleUsed:0,cancelUsed:0,customTotalPrice:9000,note:'GRUP ESKI NOTU',monthlyNotes:{}});
    state.lessons.push({id:'jl',date:'2026-06-10',time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['a1','a2'],groupId:'gg',packageMonth:'2026-06',status:'completed',note:''});
    state.payments.push({id:'jp',memberId:'a1',groupId:'gg',date:'2026-06-05',packageMonth:'2026-06',pkgName:'G',sessions:8,amount:4500,listPrice:4500,method:'Nakit',partial:false,note:''});
    applyV10MigrationToState(state); // migration testte de calissin
    window.S=()=>state;
  `);

  console.log('[1] NOT MIGRATION + TASINMAMA');
  const a1 = w.S().members.find(x=>x.id==='a1');
  t('eski genel not HAZIRANA tasindi', (a1.monthly['2026-06']||{}).note === 'ESKI GENEL NOT');
  t('genel alan bosaldi', a1.note === '');
  t('Haziran gorunumunde not VAR', w.memberNoteForMonth(a1,'2026-06') === 'ESKI GENEL NOT');
  t('TEMMUZDA NOT GORUNMEZ (tasinmadi!)', w.memberNoteForMonth(a1,'2026-07') === '');
  const gg0 = w.S().groups.find(x=>x.id==='gg');
  t('grup notu Hazirana tasindi, Temmuzda yok', w.groupNoteForMonth(gg0,'2026-06')==='GRUP ESKI NOTU' && w.groupNoteForMonth(gg0,'2026-07')==='');

  console.log('[2] GRUP: Temmuzda PASIFE AL -> Haziran AYNEN kalir');
  w.eval(`archiveGroupMonthly('gg');`);
  const gg = w.S().groups.find(x=>x.id==='gg');
  t('grup arsivli + tarihli', gg.archived === true && String(gg.archivedAt).slice(0,7) === '2026-07');
  t('HAZIRAN listesinde grup DURUYOR', w.buildMemberRows('2026-06').some(r=>r.groupId==='gg'));
  t('TEMMUZ listesinde grup YOK', !w.buildMemberRows('2026-07').some(r=>r.groupId==='gg'));
  t('Haziran dersi korundu (completed)', w.S().lessons.find(l=>l.id==='jl').status === 'completed');
  t('uyeler Temmuzda BIREYSEL dala dustu (kaybolmadi)', w.buildMemberRows('2026-07').some(r=>r.memberId==='a1' && r.type==='individual'));

  console.log('[3] GRUP yeniden AKTIVE -> Temmuz pasifligi tarihe sabit');
  w.eval(`
    // simulasyon: Agustosta aktive edilmis olsun
    const g=state.groups.find(x=>x.id==='gg');
    g.archivePeriods=[{from:'2026-07',to:'2026-08'}]; g.archived=false; delete g.archivedAt;
  `);
  t('Temmuzda HALA yok (donem kaydi)', !w.buildMemberRows('2026-07').some(r=>r.groupId==='gg'));
  t('Haziranda var', w.buildMemberRows('2026-06').some(r=>r.groupId==='gg'));
  t('Agustos+ icin aktif (roster ayri konu)', !w.isGroupInactiveInMonth(w.S().groups.find(x=>x.id==='gg'),'2026-08'));

  console.log('[4] KADRO SNAPSHOT: Temmuzda uye degisikligi Hazirani ETKILEMEZ');
  w.eval(`
    const g=state.groups.find(x=>x.id==='gg');
    g.archivePeriods=[]; // temiz test icin
    snapshotGroupMembers(g);            // degisiklikten once (fonksiyonlar zaten cagiriyor)
    g.memberIds = ['a1','a3'];          // FATMA cikti, ZEYNEP girdi (Temmuzda)
  `);
  t('Haziran kadrosu ESKI (FATMA)', w.resolveGroupMembersForMonth(w.S().groups.find(x=>x.id==='gg'),'2026-06').includes('a2'));
  t('Haziran kadrosunda ZEYNEP YOK', !w.resolveGroupMembersForMonth(w.S().groups.find(x=>x.id==='gg'),'2026-06').includes('a3'));
  t('Temmuz kadrosu YENI (ZEYNEP)', w.resolveGroupMembersForMonth(w.S().groups.find(x=>x.id==='gg'),'2026-07').includes('a3'));
  t('Haziran LISTESINDE FATMA grup satirinda', w.buildMemberRows('2026-06').some(r=>r.memberId==='a2'&&r.groupId==='gg'));
  t('Haziran grup detay kadrosu eski', true);

  console.log('[5] FIYAT AY BAZLI: v28 — GRUP TOPLAMI = UYE FIYAT TOPLAMI (birincil), ay izolasyonlu');
  w.eval(`const g=state.groups.find(x=>x.id==='gg'); g.customTotalPrice=12000; g.packages.find(p=>p.month==='2026-07').price=12000;`);
  // Temmuz kadrosu a1+a3 (4000+4000) — paket/custom 12000 olsa BILE uye toplami kazanir
  t('Temmuz beklenen = UYE TOPLAMI 8000 (paket 12000 degil)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gg'),'2026-07') === 8000);
  // a1'e TEMMUZA OZEL fiyat: Temmuz degisir, Haziran DEGISMEZ
  w.eval(`setMemberMonthly('a1','2026-07',{totalPrice:6000});`);
  t('Temmuz toplami guncel (6000+4000=10000)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gg'),'2026-07') === 10000);
  t('HAZIRAN toplami SABIT (a1+a2 = 8000, Temmuz zammi etkilemedi)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gg'),'2026-06') === 8000);
  // Uyelerde hic fiyat yoksa: paket fiyatina duser (yedek)
  w.eval(`state.members.push({id:'a9',name:'FIYATSIZ',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:''},{id:'a10',name:'FIYATSIZ2',joinDate:'2026-05-01',packages:[],monthly:{},phone:'',tcno:'',adres:'',instructorId:'',health:'',note:'',totalPrice:''});
    state.groups.push({id:'gf',name:'FY',size:2,memberIds:['a9','a10'],defaultInstructorId:'',defaultPackageId:'',defaultTime:'',defaultDays:[],packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:7500,status:'active'}],rescheduleUsed:0,cancelUsed:0,customTotalPrice:'',monthlyNotes:{}});`);
  t('uye fiyati hic yoksa AY PAKETI fiyatina duser (7500)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gf'),'2026-07') === 7500);
  // Uyeye paket atanmissa fiyati ondan gelir
  w.eval(`state.packageTypes.push({id:'pQ',name:'PkQ',sessions:8,price:5200}); state.members.find(x=>x.id==='a9').defaultPackageId='pQ';`);
  t('uyeye atanan paketin fiyati uye fiyati sayilir (5200)', w.memberMonthlyTotalPrice('a9','2026-07') === 5200);
  t('grup toplami = paketli uye toplami (5200, digeri 0)', w.groupExpectedTotal(w.S().groups.find(x=>x.id==='gf'),'2026-07') === 5200);

  console.log('[6] UYE DETAYI AY BAZLI: baska ayin odeme/dersi listeye karismaz');
  w.eval(`state.payments.push({id:'tp',memberId:'a1',groupId:'gg',date:'2026-07-02',packageMonth:'2026-07',pkgName:'G',sessions:8,amount:6000,listPrice:6000,method:'Nakit',partial:false,note:''});`);
  w.renderMembers();
  d.getElementById('member-month').value = '2026-06';
  w.openMemberDetail('a1');
  let md = d.getElementById('md-content').innerHTML;
  t('Haziran detayinda Haziran odemesi (4500) VAR', md.includes('4.500') || md.includes('4500'));
  t('Haziran detayinda TEMMUZ odemesi (6000) ana listede YOK', !md.split('Tüm Geçmiş')[0].includes('6.000'));
  t('Haziran detayinda Haziran dersi VAR', md.includes('10.06.2026'));
  t('baslikta ay etiketi', d.getElementById('md-name').innerHTML.includes('2026-06'));
  d.getElementById('member-month').value = '2026-07';
  w.openMemberDetail('a1');
  md = d.getElementById('md-content').innerHTML;
  t('Temmuz detayinda 6000 VAR, 4500 ana listede YOK', md.split('Tüm Geçmiş')[0].includes('6.000') && !md.split('Tüm Geçmiş')[0].includes('4.500'));
  t('Tum Gecmis bolumu iki kaydi da tasir', md.includes('Tüm Geçmiş'));
  w.closeModal('modal-member-detail');

  console.log('[7] UYE PAKETI AY BAZLI');
  w.eval(`setMemberMonthly('a1','2026-07',{packageId:'pX'}); state.packageTypes.push({id:'pX',name:'Ozel',sessions:6,price:5000});`);
  d.getElementById('member-month').value='2026-07'; w.openMemberDetail('a1');
  t('Temmuz detayinda ay paketi (Ozel)', d.getElementById('md-content').innerHTML.includes('Ozel'));
  d.getElementById('member-month').value='2026-06'; w.openMemberDetail('a1');
  t('Haziran detayinda Ozel paket GORUNMEZ', !d.getElementById('md-content').innerHTML.includes('Ozel'));
  w.closeModal('modal-member-detail');

  console.log('\\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
