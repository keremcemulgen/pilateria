// v172 — ÇAPRAZ YÜZEY TUTARLILIK (Kerem, 2026-09-16: "ödemelerin, toplam ödemelerin, bütün ödeme ve derslerin
// birbirini sağladığından emin ol"). _dev/audit/pl-audit.js sayfaya enjekte edilir; TAM tutarlı zengin bir
// fixture'da (grup + bireysel + v171 payı + v172 elle hak + taksit + iade + geçen ay ödemesi + pasif üye +
// aylık hak 6) 0 uyumsuzluk beklenir; sonra bilerek bozulan veride (yetim ödemeler, kayıp üye) denetimin
// bunları YAKALADIĞI ölçülür (denetimin kendisinin doğrulanması).
const fs = require('fs'); const path = require('path');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const AUDIT = fs.readFileSync(path.join(__dirname, '..', 'audit', 'pl-audit.js'), 'utf-8');
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.__PL_DLG_AUTO__=(o)=>(o&&o.input)?String(o.input.value):true; w.alert=()=>{}; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderArchive','closeFillSlotModal'].forEach(fn=>window[fn]=function(){});");
  w.eval(AUDIT);
  const CM = w.eval('currentMonth()'); const PM = shiftM(CM,-1);
  function fixture(){
    w.eval(`
      state.settings.reformers=12; state.settings.instructorShareRate=30;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500},{id:'p4',name:'4 Ders',sessions:4,price:4500}];
      state.instructors=[{id:'h1',name:'HOCA BIR',shareRate:30}];
      state.members=[
        {id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'B',name:'BURCU',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${PM}':{enrolled:true},'${CM}':{enrolled:true}}},
        {id:'C',name:'CEREN',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'D',name:'DENIZ',joinDate:'2026-01-01',defaultPackageId:'p4',totalPrice:4500,packages:[],monthly:{'${CM}':{enrolled:true,sessionsOverride:4}}},
        {id:'E',name:'ELIF',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'F',name:'FUNDA',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${PM}':{enrolled:true},'${CM}':{enrolled:false}},archivePeriods:[{from:'${CM}',to:null}]},
        {id:'G',name:'GAMZE',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${CM}':{enrolled:true}}}
      ];
      state.groups=[
        {id:'G1',name:'AYSE - BURCU',size:3,memberIds:['A','B'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'10:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:17000,status:'active'}],monthlyMembers:{},monthlyNotes:{},
          monthlyPartials:{'${CM}':[{memberId:'G',at:'${CM}-05',sessions:2,price:2125,note:''}]}},
        {id:'G2',name:'CEREN',size:2,memberIds:['C'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'11:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:8500,status:'active'}],monthlySessions:{'${CM}':6},monthlyMembers:{},monthlyNotes:{}}
      ];
      state.lessons=[];
      ['${CM}-01','${CM}-03'].forEach((dt,i)=>state.lessons.push({id:'Y'+i,groupId:'G1',memberIds:['A','B','G'],date:dt,time:'10:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:3}));
      ['${CM}-08','${CM}-10','${CM}-15','${CM}-17'].forEach((dt,i)=>state.lessons.push({id:'P'+i,groupId:'G1',memberIds:['A','B'],date:dt,time:'10:00',status:'planned',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:2}));
      state.lessons.push({id:'X0',groupId:'G1',memberIds:['A','B'],date:'${CM}-22',time:'10:00',status:'cancelled',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:2});
      ['${CM}-02','${CM}-04','${CM}-09'].forEach((dt,i)=>state.lessons.push({id:'C'+i,groupId:'G2',memberIds:['C'],date:dt,time:'11:00',status:i===2?'missed':'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G2',instructorId:'h1',size:1}));
      ['${CM}-02','${CM}-05'].forEach((dt,i)=>state.lessons.push({id:'D'+i,memberIds:['D'],date:dt,time:'12:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'D',instructorId:'h1',size:1}));
      ['${CM}-12','${CM}-19'].forEach((dt,i)=>state.lessons.push({id:'DP'+i,memberIds:['D'],date:dt,time:'12:00',status:'planned',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'D',instructorId:'h1',size:1}));
      state.lessons.push({id:'E0',memberIds:['E'],date:'${CM}-03',time:'13:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'E',instructorId:'h1',size:1});
      state.lessons.push({id:'F0',memberIds:['F'],date:'${PM}-20',time:'13:00',status:'completed',packageMonth:'${PM}',packageOwnerType:'member',packageOwnerId:'F',instructorId:'h1',size:1});
      state.payments=[
        {id:'PA',memberId:'A',groupId:'G1',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:4000,listPrice:8500,method:'Nakit',pkgName:'8 Ders'},
        {id:'PB',memberId:'B',groupId:'G1',date:'${CM}-02',packageMonth:'${CM}',sessions:8,amount:8500,listPrice:8500,method:'IBAN',pkgName:'8 Ders'},
        {id:'PBprev',memberId:'B',groupId:'G1',date:'${PM}-02',packageMonth:'${PM}',sessions:8,amount:8500,listPrice:8500,method:'Nakit',pkgName:'8 Ders'},
        {id:'PG',memberId:'G',groupId:'G1',date:'${CM}-06',packageMonth:'${CM}',sessions:2,amount:2125,listPrice:2125,method:'Nakit',pkgName:'8 Ders',autoTick:true},
        {id:'PD',memberId:'D',groupId:'',date:'${CM}-01',packageMonth:'${CM}',sessions:4,amount:4500,listPrice:4500,method:'Nakit',pkgName:'4 Ders'},
        {id:'PDr',memberId:'D',groupId:'',date:'${CM}-07',packageMonth:'${CM}',sessions:0,amount:-500,listPrice:0,method:'Nakit',pkgName:'4 Ders',refund:true,note:'1 ders iadesi'},
        {id:'PF',memberId:'F',groupId:'',date:'${PM}-01',packageMonth:'${PM}',sessions:8,amount:8500,listPrice:8500,method:'Nakit',pkgName:'8 Ders'}
      ];
      document.getElementById('member-month').innerHTML='<option value="${PM}">${PM}</option><option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
      currentGroupDetailMonth='${CM}';
      if (window.__partialOfferQueue) __partialOfferQueue.length=0; __undoStack=[];
    `);
  }
  console.log('[1] tam tutarli veri: 0 uyumsuzluk (' + CM + ')');
  fixture();
  const r1 = JSON.parse(w.eval(`JSON.stringify(__plAudit('${CM}'))`));
  console.log('   ozet:', JSON.stringify({checks:r1.checks, mismatch:r1.mismatchCount, counts:r1.counts, notes:r1.notes.length}));
  if (r1.mismatchCount) console.log('   ornek:', JSON.stringify(r1.sample));
  t('uyumsuzluk 0', r1.mismatchCount===0, JSON.stringify(r1.sample));
  t('en az 80 sağlama yapıldı', r1.checks>=80, r1.checks);
  // elle hesap: G1 = A 8.500 + B 8.500 + G payı 2.125 = 19.125; G2 8.500; D 4.500; E 8.500; G (gruptan ayrıldı, bireysel aktif) 8.500 → 49.125
  // ödenmiş = 4.000 + 8.500 + 2.125 + 4.500 − 500 (iade) = 18.625 (geçen ay ödemeleri hariç); kalan = 4.500 + 8.500 + 500 + 8.500 + 8.500 = 30.500
  t('beklenen 49.125 / ödenmiş 18.625 / kalan 30.500 (elle hesap)', r1.counts.expected===49125 && r1.counts.paid===18625 && r1.counts.pending===30500, JSON.stringify(r1.counts));
  t('ödeme toplamı = 18.625 (iade dahil, geçen ay hariç), 5 kayıt', r1.counts.paySum===18625 && r1.counts.payments===5, JSON.stringify(r1.counts));
  t('yetim ödeme 0', r1.counts.orphans===0, JSON.stringify(r1.counts.orphanCats));
  console.log('[2] gecen ay (' + PM + '): pasif uyenin gecen ay odemesi o ayda sayilir, 0 uyumsuzluk');
  const r2 = JSON.parse(w.eval(`JSON.stringify(__plAudit('${PM}'))`));
  t('gecen ay uyumsuzluk 0', r2.mismatchCount===0, JSON.stringify(r2.sample));
  t('gecen ay odeme toplami 17.000 (B + F), yetim 0', r2.counts.paySum===17000 && r2.counts.orphans===0, JSON.stringify(r2.counts));

  console.log('[3] denetimin kendisi: bilerek bozulan veri YAKALANIR');
  fixture();
  w.eval(`state.payments.push({id:'ORPH1',memberId:'B',groupId:'',date:'${CM}-03',packageMonth:'${CM}',sessions:8,amount:1000,listPrice:1000,method:'Nakit',pkgName:'8 Ders'});`); // grup uyesine bireysel odeme
  w.eval(`state.payments.push({id:'ORPH2',memberId:'F',groupId:'',date:'${CM}-03',packageMonth:'${CM}',sessions:8,amount:2000,listPrice:2000,method:'Nakit',pkgName:'8 Ders'});`); // pasif uyeye odeme
  w.eval(`state.payments.push({id:'ORPH3',memberId:'ZZZ',groupId:'',date:'${CM}-03',packageMonth:'${CM}',sessions:8,amount:100,listPrice:100,method:'Nakit',pkgName:'8 Ders'});`); // uye yok
  w.eval(`state.lessons.push({id:'LX',groupId:'G1',memberIds:['A','QQQ'],date:'${CM}-25',time:'10:00',status:'planned',packageMonth:'${CM}',instructorId:'h1',size:2});`); // kayip uye
  const r3 = JSON.parse(w.eval(`JSON.stringify(__plAudit('${CM}'))`));
  console.log('   ozet:', JSON.stringify({mismatch:r3.mismatchCount, orphans:r3.counts.orphans, cats:r3.counts.orphanCats, sample:r3.sample.slice(0,6)}));
  t('yetim odemeler 3 kategoriyle yakalandi', r3.counts.orphans===3 && r3.counts.orphanCats.bireysel_odeme_ama_uye_grupta===1 && r3.counts.orphanCats.uye_o_ay_pasif===1 && r3.counts.orphanCats.uye_yok===1, JSON.stringify(r3.counts.orphanCats));
  t('PAID_ROWS≠ΣPAYMENTS bildirildi', r3.sample.some(s=>s.indexOf('PAID_ROWS≠ΣPAYMENTS')===0));
  t('kayip uyeli ders + uyesiz odeme bildirildi', r3.sample.some(s=>s.indexOf('LESSON_MEMBER_MISSING')===0) && r3.sample.some(s=>s.indexOf('PAY_MEMBER_MISSING')===0));
  t('ozet kisisel veri icermez (isim yok, id maskeli)', !/AYSE|BURCU|FUNDA/.test(JSON.stringify(r3)) && !/ORPH1|ZZZ/.test(JSON.stringify(r3.sample)));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
