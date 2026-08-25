// v154 — DERS HAKKI TAVANI (Kerem: "yandi ve yapildi toplami 8'i gecemez, ayarlardan ben
// degistirmedigim surece; toplami 8 olmus kisilere toplu dersten ya da takvimden 9. ders girilemez").
// KOK NEDEN: kota kanonu (sessionsRemainingFor, v43) yalniz GOSTERIM ve odeme secicilerinde
// kullaniliyordu — saveLesson (takvim/modal), saveBatchDates (toplu) ve iptal->yapildi durum
// gecisleri (quickSetStatus / markLessonStatus) hak tavanini HIC denetlemiyordu.
// v154 KURALI: iptal-disi ders sayisi paketin hakkini (sessionQuotaFor — Ayarlar/aylik override)
// ASAMAZ. Dolu birime yeni ders GIRILEMEZ; iptal kaydini geri acmak da tavani asamaz. Hak
// Ayarlar'dan/aylik override'dan artirilirsa ayni giris SERBEST kalir. Yamasiz build'de FAIL etmeli.
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
    w.prompt=()=>null;w.scrollTo=()=>{};
    // KANON: uygulama alert'i plDialog'a sarar — metinler __PL_DLG_AUTO__'ya o.msg ile gelir.
    w.__alerts=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__alerts.push(String((o&&o.msg)||'')); return o&&o.input?null:true; };
    w.alert=(m)=>{ w.__alerts.push(String(m||'')); };
    w.confirm=()=>true;
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
setTimeout(()=>{ try {
  const CM = w.eval('currentMonth()');
  w.eval(`
    state.settings.reformers=10; state.settings.open=8; state.settings.close=23;
    state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8000}];
    state.instructors=[{id:'h1',name:'HOCA A',shareRate:30},{id:'h2',name:'HOCA B',shareRate:30}];
    const M=function(id,ad){ return {id:id,name:ad,joinDate:'2026-01-01',totalPrice:8000,defaultPackageId:'p8',packages:[],monthly:{'${CM}':{enrolled:true}}}; };
    state.members=[M('u1','ASLI DOLU'),M('u2','BADE TOPLU'),M('u3','CANSU IPTAL'),M('u4','DERYA GRUP'),M('u5','EMEL GRUP')];
    state.groups=[{id:'g1',name:'G DOLU',size:2,memberIds:['u4','u5'],packages:[],monthlyMembers:{'${CM}':['u4','u5']},monthlyNotes:{}}];
    state.lessons=[];
    window.__doldur = function(pref, tip, oid, gid, mids, adet, st){
      for (let i=0;i<adet;i++) state.lessons.push({id:pref+i, date:'${CM}-'+String((i%25)+2).padStart(2,'0'),
        time: (10+(i%10))+':00', durationMin:45, instructorId:'h1', size:(mids||[]).length||1,
        memberIds:(mids||[]).slice(), groupId:gid||'', packageMonth:'${CM}', status: st||'completed'});
    };
    __doldur('a','member','u1','',['u1'],8);                       // 8/8 dolu
    __doldur('b','member','u2','',['u2'],8);                       // toplu icin 8/8
    __doldur('c','member','u3','',['u3'],8);                       // 8/8 + asagida 1 iptal
    state.lessons.push({id:'cX', date:'${CM}-27', time:'09:00', durationMin:45, instructorId:'h1', size:1,
      memberIds:['u3'], groupId:'', packageMonth:'${CM}', status:'cancelled'}); // iptal — hak yemez
    __doldur('g','group','g1','g1',['u4','u5'],8);                 // grup 8/8
  `);

  console.log('[1] TAKVIM/MODAL: 8/8 dolu bireysele 9. ders GIRILEMEZ');
  const onceki = w.eval('state.lessons.length');
  w.openLessonModal(null, CM + '-28', '21:00');
  // uye secimi arama akisiyla eklenir; sozlesme = #ml-members icindeki isaretli inputlar. Dogrudan ekle:
  d.getElementById('ml-members').insertAdjacentHTML('beforeend', '<label><input type="checkbox" value="u1" checked> ASLI DOLU</label>');
  d.getElementById('ml-instructor').value = 'h2';
  d.getElementById('ml-size').value = '1';
  w.saveLesson();
  t('ders SAYISI degismedi (9. yazilmadi)', w.eval('state.lessons.length') === onceki, w.eval('state.lessons.length') + ' vs ' + onceki);
  t('uyari hak dolulugunu soyler', /hak/i.test(d.getElementById('ml-warning').textContent), d.getElementById('ml-warning').textContent.slice(0,120));

  console.log('[2] AYARLARDAN HAK ARTINCA AYNI GIRIS SERBEST');
  w.eval(`setMemberMonthly('u1','${CM}',{sessionsOverride:9});`); // aylik hak override (Ayarlar/detay "hak: duzenle")
  w.saveLesson();
  t('hak 9 olunca 9. ders KAYDEDILDI', w.eval('state.lessons.length') === onceki + 1, w.eval('state.lessons.length') + ' vs ' + (onceki+1));
  w.closeModal('modal-lesson');

  console.log('[3] TOPLU DERS GIR: 8/8 dolu birime 9 satirlik liste YAZILMAZ (hicbir kayit)');
  w.eval(`
    __batchDatesTarget = { type:'member', id:'u2', packageMonth:'${CM}' };
    __batchDatesRows = state.lessons.filter(l=>!l.groupId && (l.memberIds||[]).includes('u2'))
      .map(l=>({lessonId:l.id, date:l.date, time:l.time, status:l.status||'planned'}));
    __batchDatesRows.push({lessonId:null, date:'${CM}-28', time:'22:00'}); // 9. satir
  `);
  const oncekiU2 = w.eval("state.lessons.filter(l=>!l.groupId && (l.memberIds||[]).includes('u2')).length");
  w.__alerts.length = 0;
  w.saveBatchDates();
  t('u2 ders sayisi degismedi (8 kaldi)', w.eval("state.lessons.filter(l=>!l.groupId && (l.memberIds||[]).includes('u2')).length") === oncekiU2, w.eval("state.lessons.filter(l=>!l.groupId && (l.memberIds||[]).includes('u2')).length"));
  t('uyari verildi ve hak dolulugunu soyler', w.__alerts.some(m=>/hak|⛔/i.test(m)), w.__alerts.join('|').slice(0,120));

  console.log('[4] IPTALI GERI ACMAK TAVANI ASAMAZ (quickSetStatus)');
  w.__alerts.length = 0;
  w.quickSetStatus('cX', 'completed'); // 8/8 doluyken iptal dersi yapildiya cekmek = 9. tuketim
  t('iptal kaydi IPTAL kaldi', w.eval("state.lessons.find(l=>l.id==='cX').status") === 'cancelled', w.eval("state.lessons.find(l=>l.id==='cX').status"));
  t('uyari verildi', w.__alerts.some(m=>/hak|⛔/i.test(m)));

  console.log('[5] GRUP: 8/8 dolu gruba modal ile 9. ders GIRILEMEZ');
  const onceGrup = w.eval("state.lessons.filter(l=>l.groupId==='g1').length");
  w.openLessonModal(null, CM + '-28', '20:00', 'g1');
  d.getElementById('ml-instructor').value = 'h2';
  w.saveLesson();
  t('grup ders sayisi degismedi', w.eval("state.lessons.filter(l=>l.groupId==='g1').length") === onceGrup, w.eval("state.lessons.filter(l=>l.groupId==='g1').length"));
  w.closeModal('modal-lesson');

  console.log('[6] MEVCUT DERSI DUZENLEMEK ENGELLENMEZ (kendisi sayilmaz)');
  w.openLessonModal('a0');
  d.getElementById('ml-time').value = '09:30';
  d.getElementById('ml-instructor').value = 'h2'; // hoca cakismasina takilmasin — test edilen sey KOTA
  w.saveLesson();
  t('duzenleme kaydedildi (saat degisti)', w.eval("state.lessons.find(l=>l.id==='a0').time") === '09:30', w.eval("state.lessons.find(l=>l.id==='a0').time"));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
