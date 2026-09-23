// v175 — "1 KISILIK (BIREYSEL)" MEVCUT KAYITTA VE PASIFTEN CIKARMADA DA GERCEKTEN BIREYSEL.
// Kerem 2026-09-23: "Duygu'yu pasiften cektim, grupta cikti, hemen bireyseli sectim, yine de grup".
// KOK NEDEN 1: pasiften cikarma (v58 kanonu) uyeyi ESKI 1 kisilik grubunun kadrosuna geri yazar;
//   v173'un bireysel donusumu ise yalniz YENI grup kaydinda calisiyordu — mevcut grubu Duzenle'de
//   "1 kisilik (bireysel)" secmek grup kaydini 1 kisilik GRUP olarak kaydediyordu (etiket yalan).
// KOK NEDEN 2: uygulamada 1 kisilik bir grup kaydini bireysele ceviren HICBIR yol yoktu.
// v175: tek cekirdek donusturucu convertSoloGroupToIndividual175(grup, uye, ay) — o aydan itibaren
//   dersler/odemeler uyeye tasinir, uye paketi acilir, kadrodan cikar, grup bos kalirsa aydan itibaren
//   pasif; 3 giris: pasiften cikarma sorusu, grup Duzenle (mevcut kayit, 1 kisilik + tek uye),
//   grup detayi "Bireysele Cevir". Yamasiz build'de FAIL etmeli.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const AUDIT = fs.readFileSync(path.join(__dirname, '..', 'audit', 'pl-audit.js'), 'utf-8');
let CONFIRM = () => true;
const dom = new JSDOM(html, {
  runScripts:'dangerously', url:'https://localhost/p.html', pretendToBeVisual:true,
  beforeParse(w){
    w.matchMedia=w.matchMedia||(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}));
    w.fetch=()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})});
    if(!w.structuredClone)w.structuredClone=o=>JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator,'serviceWorker',{value:{register:()=>Promise.resolve({}),getRegistrations:()=>Promise.resolve([])},configurable:true});
    w.__msgs=[]; w.__PL_DLG_AUTO__=(o)=>{ w.__msgs.push(String((o&&o.msg)||'')); return (o&&o.input)?String(o.input.value):true; };
    w.alert=(m)=>{ w.__msgs.push(String(m||'')); };
    w.confirm=(m)=>{ w.__msgs.push(String(m||'')); return CONFIRM(String(m||'')); };
    w.prompt=()=>null; w.scrollTo=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
function seen(sub){ return w.__msgs.some(m=>m.indexOf(sub)!==-1); }
function count(sub){ return w.__msgs.filter(m=>m.indexOf(sub)!==-1).length; }
const J = (expr) => JSON.parse(w.eval('JSON.stringify(' + expr + ')'));
const stack = () => w.eval('JSON.stringify(__modalStack)');
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const sh = (k) => { const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-1+k,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); };
  const PREV2 = sh(-2), PREV1 = sh(-1), NEXT = sh(1);
  // Duygu'nun canli durumu: PREV2'de 1 kisilik grup paketi (8 ders yapildi), PREV1'den itibaren pasif, CM'de paket yok.
  function fixture(o){
    o = o || {};
    w.eval(`
      state.settings.reformers=12;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:8500}];
      state.instructors=[{id:'h1',name:'HOCA',shareRate:30}];
      state.members=[
        {id:'DZ',name:'DUYGU',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:8500,packages:[],monthly:{'${PREV2}':{enrolled:true}},archivePeriods:[{from:'${PREV1}'}]},
        {id:'A',name:'AYSE',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:6500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'B',name:'BURCU',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:6500,packages:[],monthly:{'${CM}':{enrolled:true}}}
      ];
      state.groups=[
        {id:'G1',name:'DUYGU',size:1,memberIds:['DZ'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'10:00',
          packages:[{month:'${PREV2}',startDate:'${PREV2}-01',sessions:8,price:8500,status:'completed'}],monthlyMembers:{},monthlyNotes:{}},
        {id:'G2',name:'AYSE - BURCU',size:2,memberIds:['A','B'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'12:00',
          packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:13000,status:'active'}],monthlyMembers:{'${CM}':['A','B']},monthlyNotes:{}}
      ];
      state.lessons=[];
      for (let i=0;i<8;i++) state.lessons.push({id:'J'+i,groupId:'G1',memberIds:['DZ'],date:'${PREV2}-'+String(2+i*3).padStart(2,'0'),time:'10:00',status:'completed',packageMonth:'${PREV2}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:1});
      state.lessons.push({id:'K0',groupId:'G2',memberIds:['A','B'],date:'${CM}-27',time:'12:00',status:'planned',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G2',instructorId:'h1',size:2});
      state.payments=[];
      document.getElementById('member-month').innerHTML='<option value="${PREV2}">${PREV2}</option><option value="${CM}">${CM}</option><option value="${NEXT}">${NEXT}</option>';
      document.getElementById('member-month').value='${CM}';
      if (window.__partialOfferQueue) __partialOfferQueue.length=0; __undoStack=[];
      while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }
    `);
    if (o.cmPackage) w.eval(`
      state.groups[0].packages.push({month:'${CM}',startDate:'${CM}-02',sessions:8,price:8500,status:'active'});
      state.groups[0].monthlyMembers={'${CM}':['DZ'],'${NEXT}':['DZ']};
      state.members[0].archivePeriods=[{from:'${PREV1}',to:'${CM}'}]; state.members[0].monthly['${CM}']={enrolled:true};
      for (let i=0;i<8;i++) state.lessons.push({id:'S'+i,groupId:'G1',memberIds:['DZ'],date:'${CM}-'+String(2+i*3).padStart(2,'0'),time:'10:00',status:(i<2?'completed':'planned'),packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:1});
      for (let i=0;i<2;i++) state.lessons.push({id:'N'+i,groupId:'G1',memberIds:['DZ'],date:'${NEXT}-'+String(3+i*4).padStart(2,'0'),time:'10:00',status:'planned',packageMonth:'${NEXT}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:1});
      state.payments.push({id:'P1',memberId:'DZ',groupId:'G1',amount:3000,date:'${CM}-03',packageMonth:'${CM}',method:'cash'});
    `);
    w.__msgs.length=0; CONFIRM = () => true;
  }
  const rowType = (mid, ay) => (J(`(buildMemberRows('${ay}').find(r=>r.memberId==='${mid}')||{})`).type || null);
  const inGroup = (mid, ay) => { const g = J(`memberActiveGroupForMonth('${mid}','${ay}')`); return g ? g.id : null; };
  const dzLessons = (ay) => J(`state.lessons.filter(l=>(l.memberIds||[]).includes('DZ') && (l.packageMonth||l.date.slice(0,7))==='${ay}')`);

  console.log('[1] KEREM AKISI A: pasiften cikar → "1 kisilik grupta gorunuyor, bireysel olsun mu?" → TAMAM → gercekten bireysel');
  fixture();
  t('on kosul: DZ bu ay pasif, listede yok', rowType('DZ', CM)===null);
  CONFIRM = (m) => m.indexOf('BİREYSEL') >= 0 ? true : true;
  w.eval(`(typeof reactivateMemberForMonthUI175==='function' ? reactivateMemberForMonthUI175 : reactivateMemberForMonth)('DZ','${CM}')`); await tick(120);
  t('bireysel sorusu soruldu', seen('BİREYSEL'), w.__msgs.slice(0,3).join(' | ').slice(0,200));
  t('DZ bu ay hicbir grupta DEGIL', inGroup('DZ', CM)===null, inGroup('DZ', CM));
  t('Uyeler satiri tipi = individual', rowType('DZ', CM)==='individual', rowType('DZ', CM));
  t('bu ay kayitli (enrolled)', w.eval(`isMemberEnrolledInMonth('DZ','${CM}')`)===true);
  { const p = J(`(state.members.find(m=>m.id==='DZ').packages||[]).find(p=>p.month==='${CM}')||null`); t('uye paketi acildi: 8 ders / 8500', !!p && +p.sessions===8 && +p.price===8500, JSON.stringify(p)); }
  t('grup bu aydan itibaren pasif, gecmis ay aktif', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${CM}')`)===true && w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${PREV2}')`)===false);
  t('gecmis ayin grup dersleri DOKUNULMADI (8 yapildi, grupta)', J(`state.lessons.filter(l=>l.groupId==='G1'&&l.packageMonth==='${PREV2}'&&l.status==='completed').length`)===8);
  { const ls = dzLessons(CM); t('bu ay bireysel dersler otomatik acildi (grup gun/saatinden, 8 ders, grupsuz)', ls.length===8 && ls.every(l=>!l.groupId && l.time==='10:00'), ls.length + ' ders'); }
  t('Geri Al yiginda "Bireysele çevir" var', J('__undoStack.map(s=>s.label||"")').some(l=>l.indexOf('Bireysele')>=0), JSON.stringify(J('__undoStack.map(s=>s.label||"")')));

  console.log('[2] pasiften cikar → VAZGEC → eski davranis (v58): grup kadrosunda kalir');
  fixture();
  CONFIRM = (m) => m.indexOf('BİREYSEL') >= 0 ? false : true;
  w.eval(`(typeof reactivateMemberForMonthUI175==='function' ? reactivateMemberForMonthUI175 : reactivateMemberForMonth)('DZ','${CM}')`); await tick(120);
  t('soru soruldu', seen('BİREYSEL'));
  t('DZ grupta kaldi (G1)', inGroup('DZ', CM)==='G1', inGroup('DZ', CM));
  t('grup aktif kaldi', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${CM}')`)===false);

  console.log('[3] KEREM AKISI B: grupta cikti → Duzenle → "1 kisilik (bireysel)" → Kaydet → TAMAM → gercekten bireysel');
  fixture();
  CONFIRM = (m) => m.indexOf('BİREYSEL') >= 0 ? false : true;
  w.eval(`(typeof reactivateMemberForMonthUI175==='function' ? reactivateMemberForMonthUI175 : reactivateMemberForMonth)('DZ','${CM}')`); await tick(120);
  t('on kosul: DZ G1 kadrosunda (grup gibi gorunuyor)', inGroup('DZ', CM)==='G1');
  w.__msgs.length=0; CONFIRM = () => true;
  w.eval("openGroupModal('G1')"); await tick();
  t('on kosul: boyut secimi "1 kisilik (bireysel)"', d.getElementById('mg-size').value==='1' && J("[...document.querySelectorAll('#mg-members input.gm-mc:checked')].map(x=>x.value)").join()==='DZ');
  w.eval("saveGroup()"); await tick(150);
  t('bireysel sorusu soruldu (mevcut kayit)', seen('BİREYSEL'), w.__msgs.join(' | ').slice(0,200));
  t('DZ bu ay hicbir grupta DEGIL', inGroup('DZ', CM)===null, inGroup('DZ', CM));
  t('Uyeler satiri tipi = individual', rowType('DZ', CM)==='individual', rowType('DZ', CM));
  t('grup penceresi kapandi, uye detayi acildi', stack()==='["modal-member-detail"]', stack());
  t('grup bu aydan itibaren pasif', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${CM}')`)===true);
  t('hala 2 grup kaydi (yeni grup ACILMADI)', w.eval('state.groups.length')===2);
  // ayni akis GRUP DETAYI ustunden: detay → Duzenle → Kaydet → Tamam → detay kapanir, uye detayi acilir
  fixture();
  CONFIRM = (m) => m.indexOf('BİREYSEL') >= 0 ? false : true;
  w.eval(`reactivateMemberForMonth('DZ','${CM}')`); await tick(120);
  CONFIRM = () => true; w.__msgs.length=0;
  w.eval(`openGroupDetail('G1','${CM}'); openGroupModal('G1');`); await tick();
  t('on kosul: yigin detay>grup', stack()==='["modal-group-detail","modal-group"]', stack());
  w.eval("saveGroup()"); await tick(200);
  t('detay ustunden: grup penceresi + grup detayi kapandi, uye detayi acildi', stack()==='["modal-member-detail"]', stack());
  t('detay ustunden: DZ bireysel', inGroup('DZ', CM)===null && rowType('DZ', CM)==='individual');

  console.log('[4] Duzenle → VAZGEC → 1 kisilik grup olarak kalir; ayni grupta bir daha SORULMAZ (keepSolo)');
  fixture();
  CONFIRM = (m) => m.indexOf('BİREYSEL') >= 0 ? false : true;
  w.eval(`(typeof reactivateMemberForMonthUI175==='function' ? reactivateMemberForMonthUI175 : reactivateMemberForMonth)('DZ','${CM}')`); await tick(120);
  w.__msgs.length=0;
  w.eval("openGroupModal('G1')"); await tick(); w.eval("saveGroup()"); await tick(150);
  t('soruldu ve vazgecildi: DZ grupta', seen('BİREYSEL') && inGroup('DZ', CM)==='G1');
  w.__msgs.length=0;
  w.eval("openGroupModal('G1')"); await tick(); w.eval("saveGroup()"); await tick(150);
  t('ikinci kaydette soru YOK', !seen('BİREYSEL'), w.__msgs.join(' | ').slice(0,160));
  t('kayit basarili, DZ grupta', inGroup('DZ', CM)==='G1');

  console.log('[5] GRUP DETAYI "Bireysele Çevir": bu ayin dersleri/odemesi/paketi uyeye TASINIR, sonraki ay da');
  fixture({cmPackage:true});
  t('on kosul: DZ G1 kadrosunda, grup satiri', inGroup('DZ', CM)==='G1' && rowType('DZ', CM)==='group');
  w.eval(`openGroupDetail('G1','${CM}')`); await tick();
  const btn = [...d.querySelectorAll('#modal-group-detail button')].find(b => /Bireysele Çevir/.test(b.textContent));
  t('grup detayinda "Bireysele Çevir" dugmesi var', !!btn);
  if (btn) { btn.click(); await tick(200); }
  t('DZ bu ay hicbir grupta DEGIL', inGroup('DZ', CM)===null, inGroup('DZ', CM));
  { const ls = dzLessons(CM); t('bu ayin 8 dersi uyeye tasindi (grupsuz, sahibi uye, durumlar korunmus: 2 yapildi)', ls.length===8 && ls.every(l=>!l.groupId && l.packageOwnerType==='member' && l.packageOwnerId==='DZ' && (l.memberIds||[]).join()==='DZ') && ls.filter(l=>l.status==='completed').length===2, JSON.stringify(ls.map(l=>[l.id,l.groupId||'-',l.status]))); }
  { const ls = dzLessons(NEXT); t('sonraki ayin 2 planli dersi de uyeye tasindi', ls.length===2 && ls.every(l=>!l.groupId && l.status==='planned'), JSON.stringify(ls.map(l=>[l.id,l.groupId||'-']))); }
  t('otomatik EK ders uretilmedi (bu ay tam 8 ders)', dzLessons(CM).length===8);
  { const p = J(`state.payments.find(p=>p.id==='P1')`); t('grup odemesi uyenin bireysel odemesi oldu (groupId bos, tutar ayni)', p && !p.groupId && +p.amount===3000, JSON.stringify(p)); }
  { const p = J(`(state.members.find(m=>m.id==='DZ').packages||[]).find(p=>p.month==='${CM}')||null`); t('uye paketi: 8 ders / 8500 / baslangic grubun paket baslangici', !!p && +p.sessions===8 && +p.price===8500 && p.startDate===CM+'-02', JSON.stringify(p)); }
  t('grubun bu ayki paket kaydi kaldirildi (cift sayim yok)', !J(`(state.groups.find(g=>g.id==='G1').packages||[]).some(p=>p.month==='${CM}')`));
  t('grup beklenen toplami bu ay 0', w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='G1'),'${CM}')`)===0);
  t('grup kadrosu bu ay ve sonraki ay bos', J(`resolveGroupMembersForMonth(state.groups.find(g=>g.id==='G1'),'${CM}')`).filter(Boolean).length===0 && J(`resolveGroupMembersForMonth(state.groups.find(g=>g.id==='G1'),'${NEXT}')`).filter(Boolean).length===0);
  t('grup bu aydan itibaren pasif, gecmis ay aktif', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${CM}')`)===true && w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${PREV2}')`)===false);
  { const r = J(`(buildMemberRows('${CM}').find(r=>r.memberId==='DZ')||{})`); t('Uyeler: bireysel satir, odenen 3000 / kalan 5500', r.type==='individual' && +r.paid===3000 && +r.remaining===5500, JSON.stringify({type:r.type,paid:r.paid,remaining:r.remaining})); }
  t('grup detayi kapandi, uye detayi acildi', stack()==='["modal-member-detail"]', stack());
  t('kontrol grubu G2 dokunulmadi', J(`resolveGroupMembersForMonth(state.groups.find(g=>g.id==='G2'),'${CM}')`).join()==='A,B' && w.eval(`state.lessons.filter(l=>l.groupId==='G2').length`)===1);
  { w.eval(AUDIT); const r = J(`__plAudit('${CM}')`); t('capraz yuzey denetimi: donusum sonrasi 0 uyumsuzluk (' + r.checks + ' saglama)', r.mismatchCount===0, JSON.stringify(r.sample||r.mismatches).slice(0,200)); }
  { const st = J(`sessionsFinishState('member','DZ','${CM}')`); t('uye paketinde 2 yapildi / 8 hak (dersler sahibini degistirdi)', +st.done===2 && +st.quota===8, JSON.stringify(st)); }
  t('takvimde bu ay DZ dersi 8 (kopya yok)', w.eval(`state.lessons.filter(l=>(l.memberIds||[]).includes('DZ') && l.date.slice(0,7)==='${CM}').length`)===8);

  console.log('[6] GERI AL: donusum tek adimda geri alinir');
  w.eval("undoLast()"); await tick(150);
  t('DZ yeniden G1 kadrosunda', inGroup('DZ', CM)==='G1', inGroup('DZ', CM));
  t('dersler yeniden grupta (8)', w.eval(`state.lessons.filter(l=>l.groupId==='G1'&&l.packageMonth==='${CM}').length`)===8);
  t('odeme yeniden grupta', J(`state.payments.find(p=>p.id==='P1')`).groupId==='G1');
  t('grup aktif', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${CM}')`)===false);

  console.log('[7] 2+ kisilik grupta hicbir sey degismedi');
  fixture();
  w.__msgs.length=0;
  w.eval(`openGroupDetail('G2','${CM}')`); await tick();
  t('2 kisilik grup detayinda "Bireysele Çevir" YOK', ![...d.querySelectorAll('#modal-group-detail button')].some(b => /Bireysele Çevir/.test(b.textContent)));
  w.eval("closeModal('modal-group-detail'); openGroupModal('G2')"); await tick(); w.eval("saveGroup()"); await tick(150);
  t('2 kisilik kaydette bireysel sorusu YOK', !seen('BİREYSEL'));
  t('G2 kadrosu ayni', J(`resolveGroupMembersForMonth(state.groups.find(g=>g.id==='G2'),'${CM}')`).join()==='A,B');
  // 2 kisilik grubu 1'e indirip tek uye birakmak: kadroda BASKA uye varken donusum TEKLIF EDILMEZ (once normal kayit)
  w.__msgs.length=0;
  w.eval("openGroupModal('G2')"); await tick();
  w.eval("document.querySelectorAll('#mg-members input.gm-mc').forEach(function(c){ c.checked = (c.value==='A'); }); document.getElementById('mg-size').value='1'; saveGroup();"); await tick(150);
  t('kadroda baska uye varken soru YOK, normal kayit (B cikti, A kaldi)', !seen('BİREYSEL') && J(`resolveGroupMembersForMonth(state.groups.find(g=>g.id==='G2'),'${CM}')`).filter(Boolean).join()==='A', w.__msgs.join(' | ').slice(0,160));

  console.log('[8] PERSONEL hesabinda soru/donusum YOK (para tasiyan islem) — v58 davranisi');
  fixture();
  w.eval("__sbRole='staff';");
  w.__msgs.length=0;
  w.eval(`(typeof reactivateMemberForMonthUI175==='function' ? reactivateMemberForMonthUI175 : reactivateMemberForMonth)('DZ','${CM}')`); await tick(120);
  t('personelde soru yok, DZ grupta', !seen('BİREYSEL') && inGroup('DZ', CM)==='G1', w.__msgs.join(' | ').slice(0,120));
  w.eval("__sbRole='owner';");

  console.log('[8b] PROGRAMATIK cagri (paket/grup uyandirma) soru SORMAZ — v58 aynen');
  fixture(); w.__msgs.length=0; CONFIRM = () => true;
  w.eval(`reactivateMemberForMonth('DZ','${CM}')`); await tick(120);
  t('programatik aktive: soru yok, DZ grupta (v58)', !seen('BİREYSEL') && inGroup('DZ', CM)==='G1', w.__msgs.join(' | ').slice(0,120));
  t('Aktive Et dugmeleri UI sarmalini cagiriyor (3 yer)', (html.match(/onclick=\"reactivateMemberForMonthUI175\(/g)||[]).length===3, String((html.match(/onclick=\"reactivateMemberForMonthUI175\(/g)||[]).length));

  console.log('[9] Duzenle: kadro BOS + tek uye isaretli + 1 kisilik → soru sorulur; Vazgec → normal kayit (uye gruba girer)');
  fixture();
  w.eval("state.groups[0].memberIds=[]; state.groups[0].monthlyMembers={};"); // bos 1 kisilik grup
  CONFIRM = (m) => m.indexOf('BİREYSEL') >= 0 ? false : true;
  w.__msgs.length=0;
  w.eval("openGroupModal('G1')"); await tick();
  w.eval("document.getElementById('mg-show-all').checked=true; renderGroupMembersCheckboxes([], 'G1'); document.getElementById('mg-show-archived').checked=true; renderGroupMembersCheckboxes([], 'G1'); document.querySelectorAll('#mg-members input.gm-mc').forEach(function(c){ c.checked = (c.value==='DZ'); }); document.getElementById('mg-size').value='1'; saveGroup();"); await tick(150);
  t('soru soruldu, vazgecildi → DZ gruba girdi (normal kayit)', seen('BİREYSEL') && inGroup('DZ', CM)==='G1', w.__msgs.join(' | ').slice(0,160) + ' | grup=' + inGroup('DZ', CM));

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
