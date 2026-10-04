// v176 — MALI DENETIM (Kerem 2026-09-27: "uygulamayi bastan sona kontrol et, gelir hesaplamasinda vs bir hata var mi
// yok mu bundan emin ol"). Uc bagimsiz kod denetiminin (gelir/vergi, hoca hakedisi, bakiye/hak) BULGULARI burada
// olcume donusturuldu; her bolum yamasiz build'de FAIL eder, v176 ile gecer. Bolum kodlari rapordaki F1..F27.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
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
    w.prompt=()=>null; w.scrollTo=()=>{}; w.print=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
const seen = (sub) => w.__msgs.some(m=>m.indexOf(sub)!==-1);
const J = (expr) => JSON.parse(w.eval('JSON.stringify(' + expr + ')'));
const eq = (a,b) => Math.abs((+a||0)-(+b||0)) < 0.011;
const parseTL = s => { s = String(s || '').replace(/[^\d.,-]/g, ''); if (!s) return 0; if (s.indexOf(',') !== -1) s = s.replace(/\./g, '').replace(',', '.'); else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); return +s || 0; };
const statVal = (sel, label) => { const e = [...d.querySelectorAll(sel)].find(x => ((x.querySelector('.label')||{}).textContent||'').trim().indexOf(label) === 0); return e ? ((e.querySelector('.value')||{}).textContent||'').trim() : null; };
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const sh = (k) => { const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-1+k,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); };
  const PREV2 = sh(-2), PREV1 = sh(-1), NEXT = sh(1);
  const TODAY = w.eval('todayISO()');
  const dd = (ay, day) => ay + '-' + String(day).padStart(2,'0');
  // Zengin, deterministik veri. Her bolum fixture() ile sifirdan baslar.
  function fixture(){
    w.eval(`
      state.settings.reformers=12; state.settings.instructorShareRate=30;
      delete state.settings.kdvRate; delete state.settings.gvRate; delete state.settings.taxOfficialMode; delete state.settings.taxStartMonth; delete state.settings.taxOpeningLoss; delete state.settings.taxLedger;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500},{id:'p12',name:'12 Ders',sessions:12,price:6000}];
      state.instructors=[{id:'h1',name:'HOCA1',shareRate:30},{id:'h2',name:'HOCA2',shareRate:30}];
      state.campaigns=[]; state.expenses=[]; state.instructorPayouts=[];
      state.members=[
        {id:'A',name:'AYSE',phone:'05551112200',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${PREV1}':{enrolled:true},'${CM}':{enrolled:true}}},
        {id:'B',name:'BURCU',phone:'05551112201',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${PREV1}':{enrolled:true},'${CM}':{enrolled:true}}},
        {id:'C',name:'CEREN',phone:'05551112233',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${PREV1}':{enrolled:true,totalPrice:4000},'${CM}':{enrolled:true}}},
        {id:'D',name:'DENIZ',joinDate:'2026-01-01',defaultPackageId:'',totalPrice:'',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'E',name:'ECE',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:0,status:'extended'}],monthly:{'${PREV1}':{enrolled:true},'${CM}':{enrolled:true,totalPrice:0,extendedNote:'uzadi'}}},
        {id:'F',name:'FUNDA',joinDate:'2026-01-01',defaultPackageId:'',totalPrice:'',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'G',name:'GAMZE',joinDate:'2026-01-01',defaultPackageId:'',totalPrice:'',packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'X',name:'XENIA',joinDate:'2026-01-01',defaultPackageId:'p12',totalPrice:6500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'Y',name:'YAREN',joinDate:'2026-01-01',defaultPackageId:'p12',totalPrice:6500,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'P',name:'PELIN',phone:'05551112255',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:6000,packages:[],monthly:{'${CM}':{enrolled:true}}},
        {id:'Q',name:'QUEEN',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:6000,packages:[],monthly:{'${CM}':{enrolled:true}}}
      ];
      state.groups=[
        {id:'G1',name:'AYSE - BURCU',size:2,memberIds:['A','B'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[1,3],defaultTime:'10:00',packages:[{month:'${PREV1}',startDate:'${PREV1}-01',sessions:8,price:9000,status:'completed'},{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${PREV1}':['A','B'],'${CM}':['A','B']},monthlyNotes:{}},
        {id:'G2',name:'FUNDA - GAMZE',size:2,memberIds:['F','G'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2,4],defaultTime:'11:00',customTotalPrice:9000,packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${CM}':['F','G']},monthlyNotes:{}},
        {id:'G3',name:'XENIA - YAREN',size:2,memberIds:['X','Y'],defaultInstructorId:'h2',defaultPackageId:'p12',defaultDays:[1,3],defaultTime:'12:00',instructorShareRate:40,packages:[{month:'${CM}',startDate:'${CM}-01',sessions:12,price:13000,status:'active'}],monthlyMembers:{'${CM}':['X','Y']},monthlyNotes:{}}
      ];
      state.lessons=[];
      for (let i=0;i<8;i++) state.lessons.push({id:'g1p'+i,groupId:'G1',memberIds:['A','B'],date:'${PREV1}-'+String(2+i*3).padStart(2,'0'),time:'10:00',status:'completed',packageMonth:'${PREV1}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:2});
      for (let i=0;i<8;i++) state.lessons.push({id:'g1c'+i,groupId:'G1',memberIds:['A','B'],date:'${CM}-'+String(1+i*3).padStart(2,'0'),time:'10:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:2});
      for (let i=0;i<8;i++) state.lessons.push({id:'g2c'+i,groupId:'G2',memberIds:['F','G'],date:'${CM}-'+String(1+i*3).padStart(2,'0'),time:'11:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G2',instructorId:'h1',size:2});
      for (let i=0;i<12;i++) state.lessons.push({id:'g3c'+i,groupId:'G3',memberIds:['X','Y'],date:'${CM}-'+String(1+i*2).padStart(2,'0'),time:'12:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G3',instructorId:'h2',size:2});
      for (let i=0;i<8;i++) state.lessons.push({id:'cp'+i,memberIds:['C'],date:'${PREV1}-'+String(2+i*3).padStart(2,'0'),time:'13:00',status:'completed',packageMonth:'${PREV1}',packageOwnerType:'member',packageOwnerId:'C',instructorId:'h1',size:1});
      for (let i=0;i<8;i++) state.lessons.push({id:'cc'+i,memberIds:['C'],date:'${CM}-'+String(1+i*3).padStart(2,'0'),time:'13:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'C',instructorId:'h1',size:1});
      state.lessons.push({id:'ep0',memberIds:['E'],date:'${PREV1}-05',time:'14:00',status:'completed',packageMonth:'${PREV1}',packageOwnerType:'member',packageOwnerId:'E',instructorId:'h1',size:1});
      state.lessons.push({id:'ec0',memberIds:['E'],date:'${CM}-02',time:'14:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'E',instructorId:'h1',size:1});
      state.lessons.push({id:'pq0',memberIds:['P','Q'],date:'${CM}-03',time:'15:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'',packageOwnerId:'',instructorId:'h2',size:2});
      state.payments=[
        {id:'pa',memberId:'A',groupId:'G1',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'},
        {id:'pb',memberId:'B',groupId:'G1',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:2000,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'},
        {id:'pap',memberId:'A',groupId:'G1',date:'${PREV1}-01',packageMonth:'${PREV1}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'IBAN',pkgName:'8 Ders'},
        {id:'pbp',memberId:'B',groupId:'G1',date:'${PREV1}-01',packageMonth:'${PREV1}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'IBAN',pkgName:'8 Ders'},
        {id:'pc',memberId:'C',groupId:'',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'IBAN',pkgName:'8 Ders'}
      ];
      document.getElementById('member-month').innerHTML='<option value="${PREV2}">${PREV2}</option><option value="${PREV1}">${PREV1}</option><option value="${CM}">${CM}</option><option value="${NEXT}">${NEXT}</option>';
      document.getElementById('member-month').value='${CM}';
      if (window.__partialOfferQueue) __partialOfferQueue.length=0; __undoStack=[];
      while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }
      try { closeWaModal(); } catch(e) {} try { const b=document.getElementById('modal-whatsapp-bulk'); if (b) b.remove(); } catch(e) {}
    `);
    w.__msgs.length=0; CONFIRM = () => true;
  }
  const bal = (mid, ay) => w.eval(`memberBalanceForMonth('${mid}','${ay}')`);
  const gexp = (gid, ay) => w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='${gid}'),'${ay}')`);

  console.log('[F1] GRUP "Paket Uzadı (0 TL)": aya ozel fiyati olan uye de 0 olur; geri alinca eski fiyat doner');
  fixture();
  w.eval(`setMemberMonthly('A','${CM}',{totalPrice:5000});`);
  t('on kosul: grup beklenen 9500', eq(gexp('G1', CM), 9500), gexp('G1', CM));
  w.eval(`__groupPackageExtendCore(state.groups.find(g=>g.id==='G1'),'${CM}','not');`);
  t('uzadi: grup beklenen 0 (aya ozel fiyatli uye de 0)', eq(gexp('G1', CM), 0), gexp('G1', CM));
  t('uzadi: A bakiyesi 0', eq(bal('A', CM), 0), bal('A', CM));
  t('uzadi: vadesi gecen listesinde G1 yok', !J('getOverduePayments()').some(o=>o.groupId==='G1'));
  await w.eval(`markGroupPackageExtended('G1','${CM}',false)`); await tick(60);
  t('geri al: A fiyati 5000 geri geldi, B fiyati tanimsiz (genel 4500)', w.eval(`memberMonthlyTotalPrice('A','${CM}')`)===5000 && w.eval(`memberMonthlyTotalPrice('B','${CM}')`)===4500, w.eval(`memberMonthlyTotalPrice('A','${CM}')`)+'/'+w.eval(`memberMonthlyTotalPrice('B','${CM}')`));

  console.log('[F2] TIK (grup): uyeye ozel hak grubun paket kaydina yazilmaz — grubun hakki yazilir');
  fixture();
  w.eval(`state.groups.find(g=>g.id==='G1').packages = state.groups.find(g=>g.id==='G1').packages.filter(p=>p.month!=='${CM}'); state.payments = state.payments.filter(p=>p.id!=='pa'); setMemberMonthly('A','${CM}',{sessionsOverride:3});`);
  await w.eval(`togglePaidTick('A','G1',null,'${CM}')`); await tick(80);
  { const p = J(`(state.groups.find(g=>g.id==='G1').packages||[]).find(p=>p.month==='${CM}')||null`); t('tik ile olusan grup paketi 8 ders (uyenin 3 degil)', !!p && +p.sessions===8, JSON.stringify(p)); }
  t('tik odemesi uyenin kendi hakkini tasir (3)', J(`state.payments.filter(p=>p.memberId==='A'&&p.packageMonth==='${CM}')`).some(p=>+p.sessions===3));

  console.log('[F3] ODEME PENCERESI AYI: vadesi gecen kartı ve uye detayi borcun/detayin ayini verir; on-dolum paket ayinin fiyati');
  fixture();
  w.eval(`state.payments = state.payments.filter(p=>p.id!=='pc'); state.payments.push({id:'pcp',memberId:'C',groupId:'',date:'${PREV1}-01',packageMonth:'${PREV1}',sessions:8,amount:1000,listPrice:4000,discount:0,method:'Nakit',pkgName:'8 Ders'});`);
  w.eval("document.getElementById('dash-month').value='"+CM+"'; window.__dashMonthUserSet=true; renderDashboard();");
  { const h = d.getElementById('overdue-list').innerHTML; const m = h.match(/openPaymentModal\('C'[^)]*\)/); t('vadesi gecen karti: + Odeme borcun ayini (' + PREV1 + ') tasir', !!m && m[0].indexOf(PREV1) !== -1, m && m[0]); }
  w.eval(`openMemberDetail('C','${PREV1}')`); await tick();
  { const h = d.getElementById('md-content').innerHTML; const m = h.match(/openPaymentModal\('C'[^)]*\)/); t('uye detayi (' + PREV1 + '): + Paket/Odeme detayin ayini tasir', !!m && m[0].indexOf(PREV1) !== -1, m && m[0]); }
  w.eval(`openPaymentModal('C', null, '', '${PREV1}')`); await tick();
  t('on-dolum: liste fiyati paket ayinin fiyati (4000), guncel ayin degil', +d.getElementById('mp-list').value===4000, d.getElementById('mp-list').value);
  t('paket ayi alani ' + PREV1, d.getElementById('mp-pkg-month').value===PREV1);
  w.eval("closeModal('modal-payment'); closeModal('modal-member-detail');"); await tick();

  console.log('[F4] WHATSAPP {kalan}: vadesi gecen mesaji borcun ayini, toplu mesaj gorunen ayi, bugunun dersi paket ayini kullanir');
  fixture();
  w.eval(`state.payments = state.payments.filter(p=>p.id!=='pc'); state.payments.push({id:'pc2',memberId:'C',groupId:'',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'});`); // CM odendi, PREV1 (4000) odenmedi
  w.eval("openWhatsAppModal('C','overdue')"); await tick();
  { const txt = (d.getElementById('modal-whatsapp')||{}).textContent||''; t('vadesi gecen WhatsApp: 4.000 ₺ (borclu ay), 0 ₺ degil', /4\.000 ₺/.test(txt) && !/\b0 ₺ bakiyeniz/.test(txt), txt.replace(/\s+/g,' ').slice(0,140)); }
  w.eval("closeWaModal(); document.getElementById('member-month').value='"+PREV1+"'; renderMembers(); openWaBulkModal(['C'],'wa-reminder');"); await tick();
  { const txt = (d.getElementById('modal-whatsapp-bulk')||{}).textContent||''; t('toplu WhatsApp: gorunen ayin (' + PREV1 + ') bakiyesi 4.000 ₺', /4\.000 ₺/.test(txt), txt.replace(/\s+/g,' ').slice(0,140)); }
  w.eval("const b=document.getElementById('modal-whatsapp-bulk'); if (b) b.remove(); document.getElementById('member-month').value='"+CM+"';");
  w.eval(`state.payments = state.payments.filter(p=>!['pap','pbp'].includes(p.id)); state.lessons = state.lessons.filter(l=>!(l.groupId==='G1' && l.date==='${TODAY}')); /* v186: tarih-bagimsiz — fikstur dersi bugune denk gelirse 'bugunun dersi' o olurdu */ state.lessons.push({id:'tdy',groupId:'G1',memberIds:['A','B'],date:'${TODAY}',time:'18:00',status:'planned',packageMonth:'${PREV1}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:2});`);
  { const r = J('getTodayMessageTargets()'); const g = (r.groups||[]).find(x=>x.group && x.group.id==='G1'); t('bugunun dersi (paketi ' + PREV1 + '): grup bakiyesi 9.000 (o paketin ayi)', !!g && eq(g.balance, 9000), g && g.balance); }

  console.log('[F5] "Onceki ay listesini bu aya cek": 2. paket klonu tasinmaz (Yeni Ay Hazirligi ile ayni kural)');
  fixture();
  w.eval(`state.members.push({id:'C2',name:'CEREN (2. Paket)',secondOfMember:'C',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${PREV1}':{enrolled:true}}}); state.members.forEach(function(m){ if (m.monthly && m.monthly['${CM}']) delete m.monthly['${CM}']; });`);
  w.eval(`initMonthFromPrevious('${CM}')`); await tick();
  t('klon bu aya ALINMADI, kok uye alindi', w.eval(`isMemberEnrolledInMonth('C2','${CM}')`)===false && w.eval(`isMemberEnrolledInMonth('C','${CM}')`)===true);

  console.log('[F6] AYRILAN PAYI + yeniden aktive: uye kadroya donunce payi duser (cift sayim yok)');
  fixture();
  w.eval(`state.groups.find(g=>g.id==='G1').monthlyPartials={'${CM}':[{memberId:'B',at:'${CM}-10',sessions:2,price:1125,note:''}]}; const bb=state.members.find(m=>m.id==='B'); bb.archivePeriods=[{from:'${CM}'}]; bb.monthly['${CM}']={enrolled:false};`);
  t('on kosul: B kadroda ama pasif, grup beklenen 4500+1125', eq(gexp('G1', CM), 5625), gexp('G1', CM));
  w.eval(`reactivateMemberForMonth('B','${CM}')`); await tick();
  t('aktive sonrasi: pay dustu, grup beklenen 9000', eq(gexp('G1', CM), 9000), gexp('G1', CM));
  t('B fiyati 4500 (pay 1125 degil)', w.eval(`memberPriceForGroupMonth('B','G1','${CM}')`)===4500);

  console.log('[F7] BAKIYE: o ay kayitli olmayan (pasif) uyenin bakiyesi 0 (borc uydurulmaz)');
  fixture();
  w.eval(`const cc=state.members.find(m=>m.id==='C'); cc.archivePeriods=[{from:'${CM}'}]; cc.monthly['${CM}']={enrolled:false}; state.payments = state.payments.filter(p=>p.id!=='pc');`);
  t('pasif C bakiyesi 0', eq(bal('C', CM), 0), bal('C', CM));

  console.log('[F8] v175 Bireysele Cevir: grubun AYLIK hakki (hak: duzenle) uyeye gecer');
  fixture();
  w.eval(`state.members.push({id:'Z',name:'ZEYNEP',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${CM}':{enrolled:true}}}); state.groups.push({id:'S1',name:'ZEYNEP',size:1,memberIds:['Z'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[5],defaultTime:'09:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:4500,status:'active'}],monthlySessions:{'${CM}':4},monthlyMembers:{'${CM}':['Z']},monthlyNotes:{}});`);
  t('on kosul: grup hakki 4', w.eval(`sessionQuotaFor('group','S1','${CM}')`)===4);
  w.eval(`convertSoloGroupToIndividual175('S1','Z','${CM}',{})`); await tick();
  t('donusum sonrasi uyenin hakki 4 (8 degil)', w.eval(`sessionQuotaFor('member','Z','${CM}')`)===4, w.eval(`sessionQuotaFor('member','Z','${CM}')`));

  console.log('[F9] GRUPLAR KARTI + otomatik tamamlama: paket kaydindaki 8 degil, gercek hak (10)');
  fixture();
  w.eval(`state.groups.find(g=>g.id==='G1').monthlySessions={'${CM}':10}; document.getElementById('group-month').value='${CM}'; renderGroups();`);
  { const card = [...d.querySelectorAll('#groups-list .card, #groups-list > div > div')].find(x => /AYSE/.test(x.textContent)) || d.getElementById('groups-list'); const txt = card.textContent.replace(/\s+/g,' '); t('kart: "8 yapildi + 0 planli / 10" ve "tamamlandi" YOK', /\/ 10/.test(txt) && !/tamamlandı/.test(txt), txt.slice(0,200)); }
  w.eval('autoCompletePackages()');
  t('otomatik tamamlama: hak 10 iken 8 yapildi → paket hala active', J(`state.groups.find(g=>g.id==='G1').packages.find(p=>p.month==='${CM}')`).status==='active');

  console.log('[F10] GRUP DETAYI iptal/saat sayaclari: ders iptali paket kaydina islenir, ay gorunumunde gorunur');
  fixture();
  w.eval(`const l=state.lessons.find(x=>x.id==='g1c7'); l.status='planned'; openLessonModal('g1c7'); markLessonStatus('cancelled');`); await tick();
  w.eval("closeModal('modal-lesson'); openGroupDetail('G1','"+CM+"');"); await tick();
  t('detayda "İptal: 1/" (paket sayaci)', /İptal:\s*1\//.test(d.getElementById('gd-content').textContent.replace(/<[^>]+>/g,'')), (d.getElementById('gd-content').textContent.match(/İptal:[^\n]{0,8}/)||[''])[0]);
  t('grup sayaci da 1 (limit kontrolu)', w.eval("state.groups.find(g=>g.id==='G1').cancelUsed")===1);
  w.eval("closeModal('modal-group-detail')");

  console.log('[F11] VERGI MODELI: gecmis yil zarari kullanildikca DUSER (her yil yeniden dusulmez)');
  fixture();
  w.eval(`state.settings.taxStartMonth='2025-01'; state.settings.taxOpeningLoss=10000; state.settings.taxOpeningKdv=0; state.settings.kdvRate=20; state.settings.gvRate=15; state.settings.taxRegime='sahis'; state.settings.taxOfficialMode='iban'; state.payments=[{id:'t1',memberId:'C',groupId:'',date:'2025-06-01',packageMonth:'2025-06',sessions:8,amount:36000,listPrice:36000,discount:0,method:'IBAN',pkgName:'x'},{id:'t2',memberId:'C',groupId:'',date:'2026-06-01',packageMonth:'2026-06',sessions:8,amount:36000,listPrice:36000,discount:0,method:'IBAN',pkgName:'x'}]; state.expenses=[]; state.instructorPayouts=[];`);
  { const r25 = J("taxMonthModel('2025-12')"), r26 = J("taxMonthModel('2026-12')"); t('2025: 30.000 kar − 10.000 devir = 20.000 matrah', eq(r25.kalanMatrah, 20000), r25.kalanMatrah); t('2026: zarar 2025te tukendi → matrah 30.000', eq(r26.kalanMatrah, 30000), r26.kalanMatrah); }
  w.eval(`state.payments[0].amount=6000; state.payments[0].listPrice=6000;`); // 2025 kar 5000 < zarar 10000
  { const r26 = J("taxMonthModel('2026-12')"); t('2026: 2025te 5.000 kullanildi, kalan 5.000 devir → matrah 25.000', eq(r26.kalanMatrah, 25000), r26.kalanMatrah); }

  console.log('[F12] KDV: varsayilan oran ve resmi yontem (IBAN + Kredi Karti) tek kaynaktan — odeme penceresi/liste/rapor ↔ resmi defter ayni');
  fixture();
  w.eval("delete state.settings.kdvRate; state.settings.taxOfficialMode='iban_kk';");
  { const a = J("calcTax(1200,'IBAN')"), b = J("calcTax(1200,'Kredi Kartı')"), c = J("calcTax(1200,'Nakit')"); t('oran girilmemisse KDV %20 (defterle ayni): IBAN 1200 → KDV 200', eq(a.kdv, 200), a.kdv); t('resmi yontem IBAN+KK ise kredi karti da KDVli (200)', eq(b.kdv, 200), b.kdv); t('nakit KDVsiz', eq(c.kdv, 0)); }
  w.eval("state.settings.taxOfficialMode='iban';");
  t('resmi yontem yalniz IBAN ise kredi karti KDVsiz', eq(J("calcTax(1200,'Kredi Kartı')").kdv, 0));
  w.eval("state.settings.kdvRate=0; state.settings.taxStartMonth='"+CM+"'; state.payments=[{id:'k0',memberId:'C',groupId:'',date:'"+CM+"-02',packageMonth:'"+CM+"',sessions:8,amount:1200,listPrice:1200,discount:0,method:'IBAN',pkgName:'x'}];");
  t('acik %0 KDV her iki modelde de 0', eq(J("calcTax(1200,'IBAN')").kdv, 0) && eq(J("taxMonthModel('"+CM+"')").hesapKdv, 0), J("taxMonthModel('"+CM+"')").hesapKdv);

  console.log('[F13] NET KAR: elle girilen "Hoca Maaşı" gideri (bordro zaten Hoca Odemelerinde) cift dusulmez');
  fixture();
  w.eval(`state.instructorPayouts=[{id:'po1',instructorId:'h1',year:${+CM.slice(0,4)},month:${+CM.slice(5,7)},amount:3000,paidDate:'${CM}-05',method:'Nakit'}]; state.expenses=[{id:'e1',date:'${CM}-05',category:'Hoca Maaşı',amount:3000,note:'elle',resmi:false}];`);
  { const r = J(`netProfitForMonth('${CM}')`); t('net = gelir − 3000 (bir kez)', eq(r.net, r.rev - 3000), JSON.stringify(r)); }

  console.log('[F14] RAPOR: "Diğer" satiri yalniz iade varken de gorunur (TOPLAM ile tutarli)');
  fixture();
  w.eval(`state.payments.push({id:'rf',memberId:'C',groupId:'',date:'${CM}-05',packageMonth:'${CM}',sessions:0,amount:-300,listPrice:0,discount:0,method:'Diğer',pkgName:'x',refund:true}); document.getElementById('rep-month').value='${CM}'; renderReports();`);
  { const rows = [...d.querySelectorAll('#tax-panel table tr')].map(tr => tr.textContent.replace(/\s+/g,' ').trim()); const dig = rows.find(r => /^Diğer/.test(r)); t('Diğer satiri var ve 1 kayit / −300', !!dig && /^Diğer\s*1\s*[-−]300/.test(dig), dig || rows.filter(r=>/TOPLAM/.test(r)).join(' | ')); }

  console.log('[F15] ODEMELER: "Toplam Ders Hakkı" taksitleri cift saymaz');
  fixture();
  w.eval(`state.payments = state.payments.filter(p=>p.id!=='pc'); state.payments.push({id:'pc1',memberId:'C',groupId:'',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:2000,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'},{id:'pc2',memberId:'C',groupId:'',date:'${CM}-10',packageMonth:'${CM}',sessions:8,amount:2500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'}); document.getElementById('pay-month').value='${CM}'; document.getElementById('pay-member-filter').value='C'; renderPayments();`);
  t('C icin Toplam Ders Hakki 8 (16 degil)', +statVal('#pay-summary .stat','Toplam Ders Hakkı')===8, statVal('#pay-summary .stat','Toplam Ders Hakkı'));
  w.eval("document.getElementById('pay-member-filter').value='';");

  console.log('[F16] UYELER satiri / vadesi gecen: fiyat tanimsizsa borc UYDURULMAZ; "uzadi" (0 ₺) borc degildir');
  fixture();
  { const rows = J(`buildMemberRows('${CM}')`); const rd = rows.find(r=>r.memberId==='D'); const re = rows.find(r=>r.memberId==='E'); t('D (fiyat/paket yok): satirda beklenen 0 (7000/4500 uydurma yok)', rd && +rd.totalPrice===0 && +rd.remaining===0, rd && JSON.stringify({tot:rd.totalPrice,rem:rd.remaining})); t('E (uzadi, 0 ₺): satirda kalan 0', re && +re.remaining===0, re && JSON.stringify({tot:re.totalPrice,rem:re.remaining})); }
  t('E (uzadi, 0 ₺) bu ay icin vadesi gecenlerde YOK (onceki ayin gercek borcu kalir)', !J('getOverduePayments()').some(o=>o.memberId==='E' && !o.groupId && (o.months||[]).includes(CM)), JSON.stringify(J('getOverduePayments()').filter(o=>o.memberId==='E').map(o=>[o.months,o.missing])));
  w.eval(`state.payments.push({id:'pd',memberId:'D',groupId:'',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:3000,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'},{id:'pdr',memberId:'D',groupId:'',date:'${CM}-07',packageMonth:'${CM}',sessions:0,amount:-500,listPrice:0,discount:0,method:'Nakit',pkgName:'8 Ders',refund:true});`);
  { const rd = J(`buildMemberRows('${CM}')`).find(r=>r.memberId==='D'); t('D odeme + iade: beklenen negatif/uydurma degil (0), odenen 2500', rd && +rd.totalPrice===0 && eq(rd.paid, 2500) && +rd.remaining===0, rd && JSON.stringify({tot:rd.totalPrice,paid:rd.paid,rem:rd.remaining})); }

  console.log('[F17] HOCA HAKEDISI TABANI: grup uyesi → GRUBUN hakki (v172); grup-toplam fiyatli grup 0 degil; grupsuz cok-uyeli ders uyelerin payi');
  fixture();
  { const e2 = w.eval(`instructorEarningsForMonth('h2','${CM}').total`); t('G3 (12 ders, uyeler 12 derslik tipte 6500): 12 ders × (6500/12 × 2) × %40 = 5200 (+450 P/Q)', eq(e2, 5200 + 450), e2 + ' (5200 grup + 450 P/Q dersi beklenir)'); }
  // Bolen kurali (v54 korunur): TEMMUZ'daki gibi grubun hak kaydi yanlis (4) ama uyeler 4500/8 ise hoca 2 kat ALMAZ
  w.eval(`state.groups.find(g=>g.id==='G1').packages.find(p=>p.month==='${CM}').sessions=4;`);
  { const base = w.eval("perLessonPriceForLesson(state.lessons.find(l=>l.id==='g1c0'))"); t('grup hak kaydi 4 (yanlis) iken de taban uyenin kendi hakkiyla: 4500/8 × 2 = 1125 (2250 degil)', eq(base, 1125), base); }
  w.eval(`state.groups.find(g=>g.id==='G1').packages.find(p=>p.month==='${CM}').sessions=8;`);
  { const l = J("state.lessons.find(l=>l.id==='pq0')"); const e = w.eval("instructorEarningForLesson(state.lessons.find(l=>l.id==='pq0'))"); t('grupsuz 2 uyeli ders: (6000/8 + 6000/8) × %30 = 450', eq(e, 450), e); }
  { const g2 = w.eval("state.lessons.filter(l=>l.groupId==='G2').reduce((a,l)=>a+instructorEarningForLesson(l),0)"); t('G2 (uyelerde fiyat yok, grup toplam 9000): 8 ders → 9000 × %30 = 2700', eq(g2, 2700), g2); }
  { const e1 = w.eval(`instructorEarningsForMonth('h1','${CM}').total`); t('h1 toplam = G1 (9000×%30=2700) + G2 2700 + C (4500×%30=1350) + E (0, uzadi) = 6750', eq(e1, 6750), e1); }
  // Kerem 2026-09-28: GECMIS aylar da guncel kurala gore (eksik odenen bordro "Kismi" olur, Kalani Ode ile kapanir)
  w.eval(`state.groups.find(g=>g.id==='G3').packages.push({month:'2026-07',startDate:'2026-07-01',sessions:12,price:13000,status:'completed'}); state.groups.find(g=>g.id==='G3').monthlyMembers['2026-07']=['X','Y']; state.members.find(m=>m.id==='X').monthly['2026-07']={enrolled:true}; state.members.find(m=>m.id==='Y').monthly['2026-07']={enrolled:true}; state.lessons.push({id:'old1',groupId:'G3',memberIds:['X','Y'],date:'2026-07-02',time:'12:00',status:'completed',packageMonth:'2026-07',packageOwnerType:'group',packageOwnerId:'G3',instructorId:'h2',size:2});`);
  { const e = w.eval("instructorEarningForLesson(state.lessons.find(l=>l.id==='old1'))"); t('2026-07 grup dersi de GUNCEL taban (6500/12×2 × %40 = 433,33)', eq(e, 13000/12*0.4), e); }

  console.log('[F18] 2. PAKET klonu hoca oranini tasir (uye ve grup)');
  fixture();
  w.eval(`state.members.find(m=>m.id==='C').instructorShareRate=50; state.groups.find(g=>g.id==='G3').memberInstructorRates={X:45};`);
  w.eval(`createSecondPackage('member','C','${CM}')`); await tick();
  { const c2 = J("state.members.find(m=>m.secondOfMember==='C')||null"); t('uye klonu: oran 50 kopyalandi', !!c2 && +c2.instructorShareRate===50, c2 && c2.instructorShareRate); }
  w.eval(`createGroupSecondPackage('G3','${CM}')`); await tick();
  { const g2 = J("state.groups.find(g=>g.secondOfGroup==='G3')||null"); const xc = J("(state.members.find(m=>m.secondOfMember==='X')||{}).id||''"); t('grup klonu: grup orani 40 + X klonunun uye orani 45', !!g2 && +g2.instructorShareRate===40 && g2.memberInstructorRates && +g2.memberInstructorRates[xc]===45, g2 && JSON.stringify({r:g2.instructorShareRate, mr:g2.memberInstructorRates})); }

  console.log('[F18b] ONARIM: mevcut 2. paket klonlari kok oranini geri alir (yuklemede, idempotent; elle girilmis orana dokunmaz)');
  fixture();
  w.eval(`state.members.find(m=>m.id==='C').instructorShareRate=50; state.members.push({id:'C2',name:'CEREN (2. Paket)',secondOfMember:'C',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,instructorShareRate:null,packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:4500,instructorShareRate:null,status:'active'}],monthly:{'${CM}':{enrolled:true}}},{id:'X2',name:'XENIA (2. Paket)',secondOfMember:'X',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:6500,instructorShareRate:35,packages:[],monthly:{'${CM}':{enrolled:true}}},{id:'Y2',name:'YAREN (2. Paket)',secondOfMember:'Y',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:6500,instructorShareRate:null,packages:[],monthly:{'${CM}':{enrolled:true}}}); state.members.find(m=>m.id==='X').instructorShareRate=55; state.groups.find(g=>g.id==='G3').memberInstructorRates={X:45,Y:42}; state.groups.push({id:'G3b',name:'XENIA - YAREN (2. Paket)',secondOfGroup:'G3',pkgNo:2,size:2,memberIds:['X2','Y2'],defaultInstructorId:'h2',defaultPackageId:'p12',defaultDays:[1,3],defaultTime:'12:00',packages:[],monthlyMembers:{'${CM}':['X2','Y2']},monthlyNotes:{}}); state.lessons.push({id:'c2l',memberIds:['C2'],date:'${CM}-20',time:'16:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'C2',instructorId:'h1',size:1});`);
  t('on kosul: klon dersi varsayilan %30 ile hesaplaniyor', w.eval("resolveInstructorRate(state.lessons.find(l=>l.id==='c2l'))")===30);
  { const n = w.eval("typeof __migV176CloneRates==='function' ? __migV176CloneRates(state) : -1"); t('onarim calisti (uye klonu + grup klonu + uye-bazli oranlar)', n>=3, n); }
  t('C2 orani 50 (kok), X2 elle 35 KORUNDU, Y2 kok orani yok → bos kaldi', w.eval("state.members.find(m=>m.id==='C2').instructorShareRate")===50 && w.eval("state.members.find(m=>m.id==='X2').instructorShareRate")===35 && !w.eval("rateDefined(state.members.find(m=>m.id==='Y2').instructorShareRate)"));
  t('klon grup: grup orani 40, uye-bazli X2→45, Y2→42', w.eval("state.groups.find(g=>g.id==='G3b').instructorShareRate")===40 && J("state.groups.find(g=>g.id==='G3b').memberInstructorRates").X2===45 && J("state.groups.find(g=>g.id==='G3b').memberInstructorRates").Y2===42, JSON.stringify(J("state.groups.find(g=>g.id==='G3b').memberInstructorRates")));
  t('klon dersi artik %50', w.eval("resolveInstructorRate(state.lessons.find(l=>l.id==='c2l'))")===50);
  t('ikinci calistirma bir sey degistirmez (idempotent)', w.eval("typeof __migV176CloneRates==='function' ? __migV176CloneRates(state) : -1")===0);

  console.log('[F19] HOCA MAASLARI "Kalan": hoca hoca hesaplanir (fazla odeme digerinin borcunu gizlemez)');
  fixture();
  w.eval(`state.lessons=[{id:'l1',memberIds:['C'],date:'${CM}-01',time:'13:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'C',instructorId:'h1',size:1},{id:'l2',memberIds:['P'],date:'${CM}-01',time:'15:00',status:'completed',packageMonth:'${CM}',packageOwnerType:'member',packageOwnerId:'P',instructorId:'h2',size:1}]; state.instructorPayouts=[{id:'po1',instructorId:'h1',year:${+CM.slice(0,4)},month:${+CM.slice(5,7)},amount:500,paidDate:'${CM}-05',method:'Nakit'}]; document.getElementById('sal-month').value='${CM}'; renderSalaries();`);
  t('h1 168,75 hak / 500 odendi; h2 225 hak / 0 → Kalan 225 (0 degil)', eq(parseTL(statVal('#salaries-content .stat','Kalan')), 225), statVal('#salaries-content .stat','Kalan'));

  console.log('[F20] DERS PENCERESI: grup secilince varsayilan yuzde grubun orani');
  fixture();
  w.eval(`openLessonModalForGroup('G3','${CM}')`); await tick();
  t('placeholder "Varsayılan: %40"', /%40/.test(d.getElementById('ml-instructor-rate').placeholder), d.getElementById('ml-instructor-rate').placeholder);
  w.eval("closeModal('modal-lesson')");

  console.log('[F21] DERS HAKKI: paketi olmayan ay eski aktif paketin hakkini miras almaz (v170: o ayin paketi > tip)');
  fixture();
  w.eval(`state.members.find(m=>m.id==='C').packages=[{month:'${PREV1}',startDate:'${PREV1}-01',sessions:12,price:6000,status:'active'}];`);
  t('C ' + CM + ' hakki 8 (tip), 12 degil', w.eval(`sessionQuotaFor('member','C','${CM}')`)===8, w.eval(`sessionQuotaFor('member','C','${CM}')`));
  w.eval(`state.groups.find(g=>g.id==='G1').packages=[{month:'${PREV1}',startDate:'${PREV1}-01',sessions:10,price:9000,status:'active'}];`);
  t('G1 ' + CM + ' hakki 8 (tip), 10 degil', w.eval(`sessionQuotaFor('group','G1','${CM}')`)===8, w.eval(`sessionQuotaFor('group','G1','${CM}')`));

  console.log('[F22] UYE PENCERESI: paket degisimi GECMIS aylari yeniden fiyatlamaz (gecmis dondurulur, gelecek yeni pakete uyar)');
  fixture();
  w.eval(`const c=state.members.find(m=>m.id==='C'); c.totalPrice=''; c.monthly['${PREV1}']={enrolled:true}; c.monthly['${CM}']={enrolled:true}; state.payments.push({id:'pcp2',memberId:'C',groupId:'',date:'${PREV1}-01',packageMonth:'${PREV1}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'});`);
  t('on kosul: C ' + PREV1 + ' fiyati 4500 (8 Ders tipi)', w.eval(`memberMonthlyTotalPrice('C','${PREV1}')`)===4500);
  w.eval(`document.getElementById('member-month').value='${CM}'; openMemberModal('C');`); await tick();
  w.eval("document.getElementById('mm-package').value='p12'; document.getElementById('mm-total-price').value=''; saveMember();"); await tick(80);
  t(CM + ': yeni paket fiyati 6000', w.eval(`memberMonthlyTotalPrice('C','${CM}')`)===6000, w.eval(`memberMonthlyTotalPrice('C','${CM}')`));
  t(PREV1 + ' (dersi olan gecmis ay): 4500 KALDI (bakiye uydurulmadi)', w.eval(`memberMonthlyTotalPrice('C','${PREV1}')`)===4500 && eq(bal('C', PREV1), 0), w.eval(`memberMonthlyTotalPrice('C','${PREV1}')`) + ' bal=' + bal('C', PREV1));
  t(NEXT + ' (gelecek): yeni paket 6000', w.eval(`memberMonthlyTotalPrice('C','${NEXT}')`)===6000);
  w.eval("while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }");

  console.log('[F23] KAMPANYA: indirim borc birakmaz; taksitte indirim bir kez; duzenlemede kampanya kaybolmaz; kilitli grup payinda kampanya kaydedilmez');
  fixture();
  w.eval(`state.campaigns=[{id:'c1',name:'Yaz10',type:'percent',value:10,active:true,start:'',end:'',limit:0}]; state.payments = state.payments.filter(p=>p.id!=='pc');`);
  w.eval(`openPaymentModal('C', null, '', '${CM}')`); await tick();
  w.eval("document.getElementById('mp-campaign').value='c1'; applyCampaign();");
  t('kampanya uygulandi: tutar 4050', +d.getElementById('mp-amount').value===4050, d.getElementById('mp-amount').value);
  w.eval("savePayment()"); await tick(80);
  { const p = J("state.payments.filter(p=>p.memberId==='C' && p.campaignId==='c1')"); t('kayit: indirim 450, tutar 4050', p.length===1 && eq(p[0].discount,450) && eq(p[0].amount,4050), JSON.stringify(p.map(x=>[x.amount,x.discount]))); }
  t('C bakiyesi 0 (indirim borc degil)', eq(bal('C', CM), 0), bal('C', CM));
  t('C bu ay icin vadesi gecenlerde YOK', !J('getOverduePayments()').some(o=>o.memberId==='C' && !o.groupId && (o.months||[]).includes(CM)));
  { const r = J(`buildMemberRows('${CM}')`).find(r=>r.memberId==='C'); t('Uyeler satiri: ucret 4050 / odenen 4050 / kalan 0', r && eq(r.totalPrice,4050) && eq(r.remaining,0), r && JSON.stringify({tot:r.totalPrice,rem:r.remaining})); }
  // taksit: P 6000, %10 → 5400; 2700 + 2700
  w.eval(`openPaymentModal('P', null, '', '${CM}')`); await tick();
  w.eval("document.getElementById('mp-campaign').value='c1'; applyCampaign();");
  t('ozel fiyatli uye (6000): kampanya UYENIN fiyatindan → 5400 (paket tipi 4500 → 4050 degil)', +d.getElementById('mp-amount').value===5400, d.getElementById('mp-amount').value);
  w.eval("document.getElementById('mp-amount').value='2700'; savePayment();"); await tick(80);
  w.eval(`openPaymentModal('P', null, '', '${CM}')`); await tick();
  w.eval("document.getElementById('mp-campaign').value='c1'; applyCampaign(); document.getElementById('mp-amount').value='2700'; savePayment();"); await tick(80);
  { const p = J("state.payments.filter(p=>p.memberId==='P')"); const disc = p.reduce((a,x)=>a+(+x.discount||0),0); t('taksitli kampanya: toplam indirim 600 (bir kez), P bakiyesi 0', p.length===2 && eq(disc,600) && eq(bal('P', CM),0), JSON.stringify(p.map(x=>[x.amount,x.discount])) + ' bal=' + bal('P', CM)); }
  t('kampanya kullanim sayisi paket bazli (2 kisi = 2 kullanim, 3 degil)', w.eval("(function(){ const c=state.campaigns[0]; c.limit=2; return campaignUsable(c, todayISO()); })()")===false && w.eval("(function(){ const c=state.campaigns[0]; c.limit=3; return campaignUsable(c, todayISO()); })()")===true);
  // duzenleme: kampanya suresi bitmis olsa da kayittaki kampanya korunur
  w.eval("state.campaigns[0].end='2020-01-01'; state.campaigns[0].limit=0;");
  { const pid = J("state.payments.find(p=>p.memberId==='C' && p.campaignId==='c1').id"); w.eval(`openPaymentModal('C','${pid}','','${CM}')`); await tick(); t('duzenlemede kampanya secili kalir (suresi bitmis olsa da)', d.getElementById('mp-campaign').value==='c1', d.getElementById('mp-campaign').value); w.eval("savePayment()"); await tick(80); const p = J(`state.payments.find(p=>p.id==='${pid}')`); t('kaydedince kampanya ve indirim korunur', p.campaignId==='c1' && eq(p.discount,450), JSON.stringify([p.campaignId,p.discount])); }
  // kilitli grup payi + kampanya: kampanya uygulanmadiysa kaydedilmez
  w.eval("state.campaigns[0].end=''; state.payments = state.payments.filter(p=>p.id!=='pb');");
  w.eval(`openPaymentModal('B', null, 'G1', '${CM}')`); await tick();
  w.eval("document.getElementById('mp-campaign').value='c1'; applyCampaign(); savePayment();"); await tick(80);
  { const p = J("state.payments.filter(p=>p.memberId==='B' && p.packageMonth==='"+CM+"')"); t('kilitli grup payi: tutar 4500, kampanya KAYDEDILMEDI', p.length===1 && eq(p[0].amount,4500) && !p[0].campaignId, JSON.stringify(p.map(x=>[x.amount,x.campaignId,x.discount]))); }
  w.eval("while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }");

  console.log('[F24] GRUBU PASIFE AL: bu ayda ders/odeme varsa GELECEK aydan itibaren; onceki paketin sarkan planli dersleri iptal edilmez');
  fixture();
  w.eval(`state.lessons.push({id:'sp1',groupId:'G1',memberIds:['A','B'],date:'${NEXT}-02',time:'10:00',status:'planned',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:2},{id:'sp2',groupId:'G1',memberIds:['A','B'],date:'${NEXT}-09',time:'10:00',status:'planned',packageMonth:'${NEXT}',packageOwnerType:'group',packageOwnerId:'G1',instructorId:'h1',size:2});`);
  w.eval("archiveGroupMonthly('G1')"); await tick(80);
  t('bu ay (ders+odeme var) grup AKTIF kaldi, gelecek aydan pasif', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${CM}')`)===false && w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${NEXT}')`)===true);
  { const rows = J(`buildMemberRows('${CM}')`); t('bu ay A/B hala GRUP satiri (borclu bireysel olmadi)', rows.filter(r=>['A','B'].includes(r.memberId)).every(r=>r.type==='group'), JSON.stringify(rows.filter(r=>['A','B'].includes(r.memberId)).map(r=>r.type))); }
  t('bu ayin paketine ait sarkan planli ders KORUNDU, gelecek ayin planli dersi iptal', J("state.lessons.find(l=>l.id==='sp1')").status==='planned' && J("state.lessons.find(l=>l.id==='sp2')").status==='cancelled', JSON.stringify([J("state.lessons.find(l=>l.id==='sp1')").status, J("state.lessons.find(l=>l.id==='sp2')").status]));
  fixture();
  w.eval(`state.lessons = state.lessons.filter(l=>l.groupId!=='G1' || l.packageMonth!=='${CM}'); state.payments = state.payments.filter(p=>!['pa','pb'].includes(p.id));`);
  w.eval("archiveGroupMonthly('G1')"); await tick(80);
  t('bu ayda ders/odeme yoksa bu aydan itibaren pasif', w.eval(`isGroupInactiveInMonth(state.groups.find(g=>g.id==='G1'),'${CM}')`)===true);

  console.log('[F25] ORANTILI (sonradan katildi) odeme: orantili fiyat o ayin fiyati olur — kalan borc uydurulmaz');
  fixture();
  w.eval(`state.payments = state.payments.filter(p=>p.id!=='pb'); for (let i=0;i<4;i++) { const l = state.lessons.find(x=>x.id==='g1c'+i); l.memberIds=['A']; }`); // B 4 derse katilmadi → 4/8 kaldi
  w.eval(`openPaymentModal('B', null, 'G1', '${CM}')`); await tick();
  w.eval("const cb=document.getElementById('mp-prorate'); cb.checked=true; onProrateToggle();"); await tick();
  { const amt = +d.getElementById('mp-amount').value; t('orantili tutar 2250 (4/8)', eq(amt, 2250), amt); }
  w.eval("savePayment()"); await tick(80);
  t('B bakiyesi 0, grup beklenen 4500+2250', eq(bal('B', CM), 0) && eq(gexp('G1', CM), 6750), bal('B', CM) + ' / ' + gexp('G1', CM));
  w.eval("while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }");

  console.log('[F26] VADESI GECEN: kurus yuvarlama farki (0,01) borc degildir');
  fixture();
  w.eval(`state.groups.find(g=>g.id==='G1').size=3; state.groups.find(g=>g.id==='G1').memberIds=['A','B','C']; state.groups.find(g=>g.id==='G1').monthlyMembers['${CM}']=['A','B','C']; ['A','B','C'].forEach(function(id){ setMemberMonthly(id,'${CM}',{totalPrice:3333.33}); }); state.payments = state.payments.filter(p=>!['pa','pb','pc'].includes(p.id)); ['A','B','C'].forEach(function(id,i){ state.payments.push({id:'r'+i,memberId:id,groupId:'G1',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:3333.33,listPrice:3333.33,discount:0,method:'Nakit',pkgName:'8 Ders'}); }); setMemberMonthly('A','${CM}',{totalPrice:3333.34});`); // toplam 10000 vs odenen 9999.99
  t('0,01 fark: vadesi gecenlerde G1 YOK', !J('getOverduePayments()').some(o=>o.groupId==='G1'), JSON.stringify(J('getOverduePayments()').filter(o=>o.groupId==='G1').map(o=>o.missing)));

  console.log('[F27] RESMI DEFTER "kayit disi fark": iki taraf da TAHSILAT AYI esasiyla (paket ayi ile karistirilmaz)');
  fixture();
  w.eval(`state.settings.taxOfficialMode='iban'; state.settings.kdvRate=20; state.settings.gvRate=15; state.settings.taxStartMonth='${PREV1}'; state.payments=[{id:'x1',memberId:'C',groupId:'',date:'${CM}-02',packageMonth:'${PREV1}',sessions:8,amount:1200,listPrice:1200,discount:0,method:'IBAN',pkgName:'x'}]; state.expenses=[]; state.instructorPayouts=[];`);
  { const a = J(`taxMonthModel('${PREV1}')`), b = J(`taxMonthModel('${CM}')`); t(PREV1 + ': resmi gelir 0 ↔ fark 0 (1.200 "kayit disi" gorunmez)', eq(a.kayitDisiFark, 0), a.kayitDisiFark); t(CM + ': resmi kar 1000, tahsilat 1200 → fark 200', eq(b.kayitDisiFark, 200), b.kayitDisiFark); }

  console.log('[F28] YAPILMIS derste katilan herkes hoca tabanina girer — sonradan kadrodan cikan/pasif uye dahil (canli 07.09 20:00 vakasi)');
  fixture();
  // D2: eskiden G1'deydi, 5. dersten sonra pasife alindi (kadrodan cikti, pay yok); ilk 4 derse katildi (memberIds'de)
  w.eval(`state.members.push({id:'D2',name:'DIDEM',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,packages:[],monthly:{'${PREV1}':{enrolled:true},'${CM}':{enrolled:false}},archivePeriods:[{from:'${CM}'}]}); state.groups.find(g=>g.id==='G1').monthlyMembers['${PREV1}']=['A','B','D2']; for (let i=0;i<4;i++) { const l = state.lessons.find(x=>x.id==='g1c'+i); l.memberIds=['A','B','D2']; l.size=3; }`); // D2 gecen ay kadrodaydi (canli DIDEM gibi), bu ay ayrildi/pasif
  { const l = J("state.lessons.find(x=>x.id==='g1c0')"); const base = w.eval("perLessonPriceForLesson(state.lessons.find(x=>x.id==='g1c0'))"); t('yapilmis ders: taban 3 kisi (4500/8 × 3 = 1687,5) — kadro disi katilan sayilir', eq(base, 1687.5), base); }
  { const e1 = w.eval(`instructorEarningsForMonth('h1','${CM}').total`); t('h1 toplam 4 derste +562,5 taban → 6750 + 4×168,75 = 7425', eq(e1, 7425), e1); }
  w.eval(`const lx = state.lessons.find(x=>x.id==='g1c1'); lx.memberIds=['A','B','X'];`); // X: G3'un uyesi — G1'e SIZAN (hic G1'de olmamis)
  { const base = w.eval("perLessonPriceForLesson(state.lessons.find(x=>x.id==='g1c1'))"); t('baska grubun sizan uyesi (hic bu grupta olmamis) tabana GIRMEZ (v49 korunur) = 1125', eq(base, 1125), base); }
  w.eval(`const lp = state.lessons.find(x=>x.id==='g1c7'); lp.status='planned'; lp.memberIds=['A','B','D2'];`);
  { const base = w.eval("perLessonPriceForLesson(state.lessons.find(x=>x.id==='g1c7'))"); t('PLANLI derste kadro disi uye tabana girmez (v49 emniyeti korunur)', eq(base, 1125), base); }
  w.eval("openLessonModal('g1c0')"); await tick();
  { const boxes = [...d.querySelectorAll('#ml-members input[type=checkbox]')].map(b => ({ id: b.value, on: b.checked })); const d2 = boxes.find(b=>b.id==='D2'); const txt = d.getElementById('ml-members').textContent; t('ders penceresi: DIDEM listede ve ISARETLI, "kadro dışı" rozetli; A,B isaretli', !!d2 && d2.on && /kadro dışı/.test(txt) && boxes.filter(b=>b.on).length===3, JSON.stringify(boxes) + ' ' + /kadro dışı/.test(txt)); }
  w.eval("closeModal('modal-lesson')");

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
