// v107 — PAKET AYI KANONU + BIRLESIK SECICI:
// [1] KEREM SIKAYETI birebir: Haziran paketi bitmemis grupta TEMMUZ dersleri girilir ->
//     TEMMUZA sayilir, Temmuz paketi otomatik dogar, Haziran DEGISMEZ, Temmuz kalan duser.
// [2] Bireysel uye secicide listelenir (paket ayi/kalan etiketiyle); secim hoca+yuzde+tik otomatik.
// [3] Grup secimi hoca yuzdesi placeholder'i doldurur.
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
  w.eval('window.S=()=>state;');
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','renderPayments','renderReports','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','autoCompletePackages'].forEach(fn=>window[fn]=function(){});");
  w.eval(`state.settings.groupPackageDays=30; state.settings.instructorShareRate=30;
    state.packageTypes=[{id:'p1',name:'8 Ders',sessions:8,price:8500}];
    state.instructors=[{id:'h1',name:'HOCA BIR',shareRate:30},{id:'h2',name:'HOCA IKI',shareRate:40}];
    state.members=[
      {id:'a',name:'AYSE',joinDate:'2026-01-01',packages:[],monthly:{'2026-06':{enrolled:true},'2026-07':{enrolled:true}}},
      {id:'b',name:'BANU',joinDate:'2026-01-01',packages:[],monthly:{'2026-06':{enrolled:true},'2026-07':{enrolled:true}}},
      {id:'z',name:'ZEYNEP SOLO',joinDate:'2026-01-01',instructorId:'h2',instructorShareRate:45,packages:[{month:'2026-07',startDate:'2026-07-01',sessions:8,price:5000,status:'active'}],monthly:{'2026-06':{enrolled:true},'2026-07':{enrolled:true}}}
    ];
    state.groups=[{id:'g1',name:autoGroupName(['a','b']),size:2,memberIds:['a','b'],defaultInstructorId:'h1',defaultPackageId:'p1',defaultTime:'10:00',defaultDays:[1],
      packages:[{month:'2026-06',startDate:'2026-06-01',sessions:8,price:8500,status:'active'}], monthlyMembers:{}, monthlyNotes:{}}];
    state.lessons=[]; state.payments=[];
    // HAZIRAN: yalniz 5 ders girilmis -> 3 KALAN (bitmemis!). Kerem'in tetik durumu.
    for(let i=0;i<5;i++) state.lessons.push({id:'jn'+i,date:'2026-06-0'+(i+1),time:'10:00',durationMin:45,instructorId:'h1',size:2,memberIds:['a','b'],groupId:'g1',packageMonth:'2026-06',packageOwnerType:'group',packageOwnerId:'g1',status:'completed'});
  `);

  console.log('[0] Baslangic: Haziran BITMEMIS (3 kalan), Temmuz paketi YOK');
  t('Haziran kalan = 3', w.sessionsRemainingFor('group','g1','2026-06')===3);
  t('Temmuz paketi henuz yok', !(w.S().groups[0].packages||[]).some(p=>p.month==='2026-07'));

  console.log('[1] KEREM AKISI: Temmuz hucresi -> grup sec -> paket ayi TEMMUZ (Haziran DEGIL) -> kaydet');
  w.openLessonModal(null, '2026-07-06', '10:00');
  w.applyGroupToLesson('g1');
  t('paket ayi = TEMMUZ (dersin ayi)', d.getElementById('ml-pkg-month').value==='2026-07', d.getElementById('ml-pkg-month').value);
  t('ipucu Hazirandaki 3 kalani soyluyor (yonlendirme, otomatik secim degil)', /3 ders hakkı kalmış/.test((d.getElementById('ml-pkg-hint')||{}).textContent||''), (d.getElementById('ml-pkg-hint')||{}).textContent);
  d.getElementById('ml-date').value='2026-07-06';
  d.getElementById('ml-time').value='10:00';
  d.getElementById('ml-instructor').value='h1';
  d.getElementById('ml-size').value='2';
  [...d.querySelectorAll('#ml-members input[type=checkbox]')].forEach(cb=>{ if(['a','b'].includes(cb.value)) cb.checked=true; });
  w.saveLesson();
  const nl = w.S().lessons.find(l=>l.date==='2026-07-06');
  t('ders TEMMUZA sayildi', nl && nl.packageMonth==='2026-07', nl&&nl.packageMonth);
  t('TEMMUZ paketi OTOMATIK dogdu', (w.S().groups[0].packages||[]).some(p=>p.month==='2026-07'));
  t('Haziran kalan HALA 3 (karisma yok)', w.sessionsRemainingFor('group','g1','2026-06')===3, w.sessionsRemainingFor('group','g1','2026-06'));
  t('Temmuz kalan 7 (8-1)', w.sessionsRemainingFor('group','g1','2026-07')===7, w.sessionsRemainingFor('group','g1','2026-07'));

  console.log('[2] BIRLESIK SECICI: bireysel uye listede, secim otomatik dolgu');
  w.openLessonModal(null, '2026-07-08', '11:00');
  const opts = d.getElementById('ml-group-select').innerHTML;
  t('Bireysel Uyeler optgroup var', /Bireysel Üyeler/.test(opts));
  t('ZEYNEP secenegi paket etiketiyle', /ZEYNEP SOLO · Bireysel · 📦/.test(opts), opts.slice(opts.indexOf('ZEYNEP'), opts.indexOf('ZEYNEP')+70));
  t('grup uyeleri (AYSE) bireysel listede DEGIL', !/AYSE · Bireysel/.test(opts));
  w.applyGroupToLesson('m:z');
  t('uye tiklendi (z)', [...d.querySelectorAll('#ml-members input:checked')].map(x=>x.value).join(',')==='z');
  t('hoca otomatik ZEYNEPin hocasi (h2)', d.getElementById('ml-instructor').value==='h2');
  t('kapasite 1', d.getElementById('ml-size').value==='1');
  t('yuzde placeholder %45 (uyenin ozel orani)', /45/.test(d.getElementById('ml-instructor-rate').placeholder), d.getElementById('ml-instructor-rate').placeholder);
  t('paket ayi TEMMUZ', d.getElementById('ml-pkg-month').value==='2026-07');
  w.saveLesson();
  const zl = w.S().lessons.find(l=>l.date==='2026-07-08');
  t('bireysel ders kaydedildi (z, Temmuz)', zl && !zl.groupId && zl.memberIds.join(',')==='z' && zl.packageMonth==='2026-07');
  t('ZEYNEP Temmuz kalan 7 (8-1)', w.sessionsRemainingFor('member','z','2026-07')===7, w.sessionsRemainingFor('member','z','2026-07'));

  console.log('[3] GRUP SECIMI yuzde placeholder doldurur');
  w.openLessonModal(null, '2026-07-09', '10:00');
  w.applyGroupToLesson('g1');
  t('grup yuzdesi placeholder dolu (%30 default)', /30/.test(d.getElementById('ml-instructor-rate').placeholder), d.getElementById('ml-instructor-rate').placeholder);

  console.log('\nSONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.error('TEST COKTU:',e); process.exit(2);} },800);
