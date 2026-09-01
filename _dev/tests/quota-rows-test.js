// v169 — TOPLU GIRIS SATIR SAYISI = DERS HAKKI (Kerem, 2026-09-01: "4 ders hakki verilmis uyeye
// 8 ders girilme yeri aciliyor, sonra ders yazarken hata veriyor"). KOK NEDEN: hak tek kaynagi
// sessionQuotaFor (v43) ve v154 tavani buna gore ENGELLIYORDU ama satir/ders URETEN yollar hakki
// sormuyordu: modal dolgusu sabit 8, otomatik uretimler sabit 8 / paket TIPI; ustune v154 sayimi
// BOS satirlari da sayiyordu (4 dolu + 4 bos = 8 > 4 → sahte engel). v169: dolgu = hak; canli hak
// sayaci (#bd-quota); tavan sayimi yalniz tarih+saat dolu iptal-disi satirlar; autoGenerate* ve
// olusan paket sessions'i sessionQuotaFor'dan; hak 0 → uretim yok. Yamasiz build'de FAIL etmeli.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return o&&o.input?'not':true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); }; w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return true; }; w.prompt=()=>'not'; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
function quotaTxt(){ const el=d.getElementById('bd-quota'); return el ? el.textContent.replace(/\s+/g,' ') : null; }
function seen(sub){ return w.__msgs.some(m=>m.indexOf(sub)!==-1); }
setTimeout(async ()=>{ try {
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','renderArchive'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const NM = shiftM(CM,+1);
  function fixture(){
    w.eval(`
      state.settings.reformers=10;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500},{id:'p4',name:'4 Ders',sessions:4,price:4500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[
        {id:'u4',name:'DORT HAK',joinDate:'2026-01-01',defaultPackageId:'p8',defaultDays:[2],defaultTime:'10:00',packages:[],monthly:{'${CM}':{enrolled:true,sessionsOverride:4}}},
        {id:'uT',name:'TIP DORT',joinDate:'2026-01-01',defaultPackageId:'p4',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'u0',name:'SIFIR HAK',joinDate:'2026-01-01',defaultPackageId:'p8',defaultDays:[3],defaultTime:'12:00',packages:[],monthly:{'${CM}':{enrolled:true,sessionsOverride:0}}},
        {id:'u5',name:'BES DERSLI',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true,sessionsOverride:4}}},
        {id:'u8',name:'SEKIZ NORMAL',joinDate:'2026-01-01',defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'a1',name:'GRUP BIR',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}},
        {id:'a2',name:'GRUP IKI',joinDate:'2026-01-01',packages:[],monthly:{'${CM}':{enrolled:true},'${NM}':{enrolled:true}}}
      ];
      state.groups=[{id:'gH',name:'GRUP BIR - GRUP IKI',size:2,memberIds:['a1','a2'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1],defaultTime:'11:00',packages:[],monthlyMembers:{},monthlyNotes:{},monthlySessions:{'${NM}':4}}];
      state.lessons=[]; for (let i=1;i<=5;i++) state.lessons.push({id:'E'+i,memberIds:['u5'],date:'${CM}-0'+i,time:'13:00',status:'completed',packageMonth:'${CM}',instructorId:'h1'});
      state.payments=[];
      try { __undoStack=[]; localStorage.removeItem('pilateria_undo'); } catch(e){}
    `);
    w.__msgs.length = 0;
  }

  console.log('[1] 4 HAKLIK UYE → 4 satir + canli hak sayaci');
  t('__bdRowTarget169 / sayac var', w.eval("typeof __bdRowTarget169")==='function' && w.eval("typeof __bdActiveRowCount169")==='function', w.eval("typeof __bdRowTarget169"));
  if (w.eval("typeof __bdRowTarget169")!=='function') { console.log('\nSONUC: '+pass+' gecti, '+(fail+22)+' kaldi'); process.exit(1); }
  fixture();
  w.openBatchDatesMember('u4', CM);
  t('satir sayisi 4 (8 DEGIL)', w.eval("__batchDatesRows.length")===4, w.eval("__batchDatesRows.length"));
  t('sayac: hak 4, 0 dolu', (quotaTxt()||'').indexOf('ders hakkı: 4')!==-1 && (quotaTxt()||'').indexOf('listede 0 dolu')!==-1, quotaTxt());
  console.log('[2] otomatik doldur → 4 tarih; kaydet → HATASIZ 4 ders, paket sessions=4');
  await w.batchDatesAutoFill();
  t('4 satirin hepsi doldu, fazlasi yok', w.eval("__batchDatesRows.filter(r=>r.date&&r.time).length")===4);
  t('sayac: 4/4 yesil (KAYDEDILMEZ yok)', (quotaTxt()||'').indexOf('listede 4 dolu')!==-1 && (quotaTxt()||'').indexOf('KAYDEDİLMEZ')===-1, quotaTxt());
  w.__msgs.length=0;
  w.saveBatchDates();
  t('⛔ hak hatasi YOK', !seen('⛔'), w.__msgs.join(' || ').slice(0,200));
  t('4 ders yazildi', w.eval(`state.lessons.filter(l=>!l.groupId&&(l.memberIds||[]).includes('u4')&&l.packageMonth==='${CM}').length`)===4);
  t('olusan paket sessions=4 (override)', w.eval(`(((state.members.find(m=>m.id==='u4').packages)||[]).find(p=>p.month==='${CM}')||{}).sessions`)===4);

  console.log('[3] elle fazla satir → sayac kirmizi + v154 engeli (yalniz DOLU satir sayilir)');
  w.batchDatesAddRow(); w.batchDatesAddRow();
  w.eval(`batchDatesUpdate(4,'date','25.${CM.slice(5,7)}'); batchDatesUpdate(4,'time','1500');`);
  t('sayac kirmizi: 5 dolu, KAYDEDILMEZ uyarisi', (quotaTxt()||'').indexOf('listede 5 dolu')!==-1 && (quotaTxt()||'').indexOf('KAYDEDİLMEZ')!==-1, quotaTxt());
  w.__msgs.length=0;
  w.saveBatchDates();
  t('kaydet engellendi (hak 4, 5 dolu)', seen('⛔') && seen('hak 4'), w.__msgs.join(' || ').slice(0,200));
  t('ders sayisi 4 kaldi', w.eval(`state.lessons.filter(l=>!l.groupId&&(l.memberIds||[]).includes('u4')&&l.packageMonth==='${CM}').length`)===4);
  t('BOS 6. satir sayilmadi (dolu=5)', w.eval("__bdActiveRowCount169()")===5);
  w.closeModal('modal-batch-dates');

  console.log('[4] paket TIPI 4 ders → 4 satir; SIFIR hak → 1 bos satir + uretim yok');
  w.openBatchDatesMember('uT', CM);
  t('tip-bazli hak: 4 satir', w.eval("__batchDatesRows.length")===4, w.eval("__batchDatesRows.length"));
  w.closeModal('modal-batch-dates');
  w.openBatchDatesMember('u0', CM);
  t('hak 0: elle giris icin 1 bos satir + sayacta hak 0', w.eval("__batchDatesRows.length")===1 && (quotaTxt()||'').indexOf('ders hakkı: 0')!==-1, w.eval("__batchDatesRows.length")+' / '+quotaTxt());
  w.closeModal('modal-batch-dates');
  const r0 = w.eval(`JSON.stringify(autoGenerateMemberLessons('u0','${CM}-01'))`);
  t('hak 0 → otomatik uretim yok (no-quota)', JSON.parse(r0).reason==='no-quota' && w.eval("state.lessons.filter(l=>(l.memberIds||[]).includes('u0')).length")===0, r0);

  console.log('[5] mevcut ders > hak → hicbiri gizlenmez');
  w.openBatchDatesMember('u5', CM);
  t('5 mevcut ders, 5 satir (4 haga ragmen)', w.eval("__batchDatesRows.length")===5 && w.eval("__batchDatesRows.filter(r=>r.lessonId).length")===5, w.eval("__batchDatesRows.length"));
  w.closeModal('modal-batch-dates');

  console.log('[6] GRUP aylik hak 4 (gelecek ay) → 4 satir; otomatik uretim 4 ders + paket 4');
  w.openBatchDatesGroup('gH', NM);
  t('grup satir sayisi 4', w.eval("__batchDatesRows.length")===4, w.eval("__batchDatesRows.length"));
  w.closeModal('modal-batch-dates');
  const rg = w.eval(`JSON.stringify(autoGenerateGroupLessons('gH','${NM}-01'))`);
  t('grup otomatik uretim 4 ders (8 DEGIL)', JSON.parse(rg).created===4, rg);
  t('grup ders kayitlari 4 + paket sessions 4', w.eval(`state.lessons.filter(l=>l.groupId==='gH'&&l.packageMonth==='${NM}').length`)===4 && w.eval(`(((state.groups.find(g=>g.id==='gH').packages)||[]).find(p=>p.month==='${NM}')||{}).sessions`)===4);

  console.log('[7] hak tanimsiz → eski davranis (8) DEGISMEDI');
  w.openBatchDatesMember('u8', CM);
  t('normal uye: 8 satir', w.eval("__batchDatesRows.length")===8, w.eval("__batchDatesRows.length"));
  w.closeModal('modal-batch-dates');
  fixture();
  w.eval("delete state.groups[0].monthlySessions;");
  const rg8 = w.eval(`JSON.stringify(autoGenerateGroupLessons('gH','${NM}-01'))`);
  t('grup hak tanimsiz: 8 ders', JSON.parse(rg8).created===8, rg8);

  console.log('[8] KEREM SENARYOSU yamasizda coken hali: 4 haklik, yalniz 4 dolu + bos satirlar → kayit SERBEST');
  fixture();
  w.openBatchDatesMember('u4', CM);
  await w.batchDatesAutoFill();
  w.batchDatesAddRow(); w.batchDatesAddRow(); // 2 bos satir dursun (eski 8'lik dolgunun kalintisi gibi)
  w.__msgs.length=0;
  w.saveBatchDates();
  t('bos satirlar hak yemedi → hatasiz kayit', !seen('⛔') && w.eval(`state.lessons.filter(l=>!l.groupId&&(l.memberIds||[]).includes('u4')&&l.packageMonth==='${CM}').length`)===4, w.__msgs.join(' || ').slice(0,200));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
