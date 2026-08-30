// v156 — TOPLU TARIH URETIMI HEDEF PAKET AYINDAN (Kerem, 2026-08-30):
// "Agustosta sali-carsamba varsayilan gun secilen grup, EYLUL ayi uye listesinde 'Varsayilan
// Gun/Saatten Doldur' deyince toplu ders gir sekmesinde AGUSTOS tarihlerini yaziyor. Kok nedeni
// bul, yama degil SISTEMIK cozum."
// KOK NEDEN: batchDatesAutoFill baslangic tarihini hedef paket ayindan (__batchDatesTarget.packageMonth)
// DEGIL, grubun eski packageStartDate alanindan (uyede: bugunden) aliyordu. Ayni hastalik
// scheduleGroupMonth'ta da var: bugunden uretir + derslere packageMonth yazmaz.
// v156 SISTEMIK KURALI: tarih uretimi HER ZAMAN hedef paket ayinin 1'inden baslar; scheduleGroupMonth
// grup detayinin acik oldugu ayin 1'inden uretir ve derslere packageMonth yazar; onay metni ayi soyler.
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
    // KANON: uygulama alert/confirm'i plDialog'a sarabilir — metinler __PL_DLG_AUTO__'ya o.msg ile gelir.
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return o&&o.input?null:true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); };
    w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return true; };
    w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
function shiftM(ym, dd){ const p=ym.split('-').map(Number); const dt=new Date(p[0], p[1]-1+dd, 1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
setTimeout(async ()=>{ try {
  w.eval('window.S=()=>state;');
  w.eval("['renderCalendar','renderMembers','renderGroups','renderDashboard','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','autoCompletePackages','openGroupDetail'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const NM = shiftM(CM, +1);   // Kerem'in vakasi: gelecek ayin listesi (Eylul)
  const PM = shiftM(CM, -1);   // geriye donuk giris (sarkan paket) — tarih-saglam pre-FAIL icin
  w.eval(`
    state.settings.reformers=10; state.settings.open=8; state.settings.close=22;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
    const M=function(id,ad,aylar){ const mo={}; (aylar||[]).forEach(function(a){ mo[a]={enrolled:true}; });
      return {id:id,name:ad,joinDate:'2026-01-01',totalPrice:4500,defaultPackageId:'p8',packages:[],monthly:mo}; };
    state.members=[M('x1','AYLIN X',['${CM}','${NM}']),M('x2','BURCU Y',['${CM}','${NM}']),
      M('mS','SEDA SOLO',['${PM}','${CM}'])];
    state.members.find(m=>m.id==='mS').defaultDays=[1,4]; state.members.find(m=>m.id==='mS').defaultTime='11:00';
    state.groups=[
      // Kerem'in vakasi: varsayilan gunler GECEN AY secildi (packageStartDate GECEN AYDA)
      {id:'gS',name:'AYLIN X - BURCU Y',size:2,memberIds:['x1','x2'],defaultInstructorId:'h1',defaultPackageId:'p8',
       defaultTime:'20:45',defaultDays:[2,3],packageStartDate:'${PM}-04',
       packages:[],monthlyMembers:{'${CM}':['x1','x2'],'${NM}':['x1','x2']},monthlyNotes:{}}
    ];
    state.lessons=[]; state.payments=[]; state.expenses=[]; state.instructorPayouts=[];
  `);

  console.log('[1] GRUP: '+NM+' (gelecek ay) modalinda otomatik doldur -> TUM tarihler '+NM+' ayindan');
  w.openBatchDatesGroup('gS', NM);
  t('hedef paket ayi dogru kilitlendi', w.eval('__batchDatesTarget.packageMonth')===NM, w.eval('__batchDatesTarget.packageMonth'));
  await w.batchDatesAutoFill();
  const rowsG = w.eval('JSON.stringify(__batchDatesRows)');
  const rg = JSON.parse(rowsG);
  t('8 satirin tarihi dolduruldu', rg.length===8 && rg.every(r=>r.date), rg.map(r=>r.date).join(','));
  t('TUM tarihler hedef ayda ('+NM+') — eski packageStartDate capasi yok', rg.every(r=>String(r.date).startsWith(NM)), rg.map(r=>r.date).join(','));
  t('saatler varsayilandan (20:45)', rg.every(r=>r.time==='20:45'), rg.map(r=>r.time).join(','));
  t('gunler varsayilan gunlerde (Sal/Car)', rg.every(r=>{ const dt=new Date(r.date+'T12:00:00'); return [2,3].includes(dt.getDay()); }), rg.map(r=>r.date).join(','));
  w.closeModal('modal-batch-dates');

  console.log('[2] UYE: '+PM+' (gecen ay, sarkan paket) modalinda doldur -> tarihler '+PM+' ayindan, bugunden DEGIL');
  w.openBatchDatesMember('mS', PM);
  await w.batchDatesAutoFill();
  const rm = JSON.parse(w.eval('JSON.stringify(__batchDatesRows)'));
  t('TUM tarihler hedef ayda ('+PM+') — bugun capasi yok', rm.length===8 && rm.every(r=>String(r.date).startsWith(PM)), rm.map(r=>r.date).join(','));
  w.closeModal('modal-batch-dates');

  console.log('[3] scheduleGroupMonth: grup detayi '+PM+' ayindayken uretim O AYIN takviminden + packageMonth yazilir');
  w.eval(`currentGroupDetailMonth='${PM}'; state.lessons=[];`);
  w.eval("__msgs.length=0;");
  w.scheduleGroupMonth('gS');
  const Ls = JSON.parse(w.eval("JSON.stringify(state.lessons.filter(l=>l.groupId==='gS'))"));
  t('4 hafta x 2 gun = 8 ders olustu', Ls.length===8, Ls.length);
  t('TUM ders tarihleri detay ayinda ('+PM+') — bugun capasi yok', Ls.length>0 && Ls.every(l=>String(l.date).startsWith(PM)), Ls.map(l=>l.date).join(','));
  t('TUM derslere packageMonth yazildi ('+PM+')', Ls.length>0 && Ls.every(l=>l.packageMonth===PM), JSON.stringify(Ls.map(l=>l.packageMonth)));
  const ayAdi = w.eval(`pkgMonthLabel('${PM}')`);
  t('onay metni hedef ayi soyler ('+ayAdi+')', w.eval('__msgs').some(m=>m.indexOf(ayAdi)!==-1), w.eval('__msgs').join(' | ').slice(0,160));

  console.log('[4] HEDEF AY = ICINDE BULUNULAN AY ise uretim bu ayin 1inden baslar (gerileme yok)');
  w.openBatchDatesGroup('gS', CM);
  await w.batchDatesAutoFill();
  const rc = JSON.parse(w.eval('JSON.stringify(__batchDatesRows)'));
  t('bu ay hedefinde TUM tarihler bu ayda ('+CM+')', rc.length===8 && rc.every(r=>String(r.date).startsWith(CM)), rc.map(r=>r.date).join(','));
  w.closeModal('modal-batch-dates');

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
