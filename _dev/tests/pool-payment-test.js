// v177 — HAVUZ ODEME (Kerem 2026-09-28): "yarida baska gruba gectiyse [eski grupta] sadece 1 derslik parasi x kac derse
// girdiyse o para olmali". Ayrilan/tasinan uyenin odemesi eski grubun havuzunda kalip KALAN uyelerin borcunu gizliyordu.
// v177 kurali: (1) grubun "Toplanan"i yalniz o ay kadrodaki uyelerin (kendi fiyatina kadar) + payi olan ayrilanlarin
// (payina kadar) odemelerini sayar; kadro disi paysiz odeme ve fazlasi ASKIDA (uyenin kartinda "fazla odeme").
// (2) Tasinmada eski grupta pay = uyenin 1-ders fiyati x aldigi ders (otomatik, sorusuz); odemenin payi asan kismi
// yeni gruba (veya bireysele) tasinir — kayit ikiye bolunur, toplam degismez, vergi alanlari yeniden hesaplanir.
// Her bolum yamasiz (v176) build'de FAIL eder.
const fs = require('fs');
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
const has = (fn) => w.eval("typeof " + fn) === 'function';
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const TODAY = w.eval('todayISO()');
  const dd = (day) => CM + '-' + String(day).padStart(2,'0');
  function fixture(){
    w.eval(`
      state.settings.reformers=12; state.settings.instructorShareRate=30; delete state.settings.taxOfficialMode; state.settings.kdvRate=20; state.settings.gvRate=15;
      state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
      state.instructors=[{id:'h1',name:'HOCA1',shareRate:30}];
      state.campaigns=[]; state.expenses=[]; state.instructorPayouts=[];
      const mk = (id,name,price) => ({id:id,name:name,phone:'',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:price,packages:[],monthly:{'${CM}':{enrolled:true}}});
      state.members=[mk('A','AYSE',4500),mk('B','BURCU',4500),mk('C','CEREN',4500),mk('F','FILIZ',4500),mk('D','DENIZ',4500),mk('E','ECE',4500),mk('H','HALE',4500),mk('X','XENIA',4500)];
      state.members.push({id:'GP',name:'GUL',phone:'',joinDate:'2026-01-01',defaultPackageId:'',totalPrice:'',packages:[],monthly:{'${CM}':{enrolled:true}}});
      state.groups=[
        {id:'GA',name:'SALI',size:4,memberIds:['A','B','C','F'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[2],defaultTime:'18:15',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:18000,status:'active'}],monthlyMembers:{'${CM}':['A','B','C','F']},monthlyNotes:{}},
        {id:'GB',name:'PERSEMBE',size:4,memberIds:['D','E'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[4],defaultTime:'20:00',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${CM}':['D','E']},monthlyNotes:{}},
        {id:'GC',name:'CUMA',size:3,memberIds:['GP','H'],defaultInstructorId:'h1',defaultPackageId:'p8',defaultDays:[5],defaultTime:'12:15',packages:[{month:'${CM}',startDate:'${CM}-01',sessions:8,price:9000,status:'active'}],monthlyMembers:{'${CM}':['GP','H']},monthlyNotes:{}}
      ];
      state.lessons=[];
      [1,3,5].forEach((day,i)=> state.lessons.push({id:'ga'+i,groupId:'GA',memberIds:['A','B','C'],date:'${CM}-'+String(day).padStart(2,'0'),time:'18:15',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'GA',instructorId:'h1',size:4}));
      [2,4].forEach((day,i)=> state.lessons.push({id:'gc'+i,groupId:'GC',memberIds:['GP','H'],date:'${CM}-'+String(day).padStart(2,'0'),time:'12:15',status:'completed',packageMonth:'${CM}',packageOwnerType:'group',packageOwnerId:'GC',instructorId:'h1',size:3}));
      state.payments=[
        {id:'pb',memberId:'B',groupId:'GA',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders',net:4500,kdv:0,gv:0,pocket:4500,kdvRate:0,gvRate:0},
        {id:'pf',memberId:'F',groupId:'GA',date:'${CM}-02',packageMonth:'${CM}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'IBAN',pkgName:'8 Ders',net:3750,kdv:750,gv:562.5,pocket:3187.5,kdvRate:20,gvRate:15},
        {id:'pd',memberId:'D',groupId:'GB',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'},
        {id:'pe',memberId:'E',groupId:'GB',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'Nakit',pkgName:'8 Ders'},
        {id:'pg',memberId:'GP',groupId:'GC',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:3000,listPrice:3000,discount:0,method:'Nakit',pkgName:'8 Ders'}
      ];
      document.getElementById('member-month').innerHTML='<option value="${CM}">${CM}</option>';
      document.getElementById('member-month').value='${CM}';
      if (window.__partialOfferQueue) __partialOfferQueue.length=0; __undoStack=[];
      while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }
    `);
    w.__msgs.length=0; CONFIRM = () => true;
  }
  const gpaid = (gid) => w.eval(`groupPaidForMonth(state.groups.find(g=>g.id==='${gid}'),'${CM}')`);
  const gexp  = (gid) => w.eval(`groupExpectedTotal(state.groups.find(g=>g.id==='${gid}'),'${CM}')`);
  const gbal  = (gid) => w.eval(`groupBalanceForMonth('${gid}','${CM}')`);
  const mpaid = (mid, gid) => w.eval(`memberPaidTowardsMonth('${mid}','${gid}','${CM}')`);
  const pays  = (mid, gid) => J(`state.payments.filter(p=>p.memberId==='${mid}'&&(p.groupId||'')==='${gid}'&&p.packageMonth==='${CM}')`);
  const share = (gid, mid) => J(`partialShareFor('${gid}','${mid}','${CM}')`);
  const earnGA = () => w.eval(`state.lessons.filter(l=>l.groupId==='GA').reduce((a,l)=>a+instructorEarningForLesson(l),0)`);

  console.log('[0] ON KOSUL (v176 hali): GA beklenen 18000, toplanan 9000, kalan 9000; hoca tabani 3 x 1687,5');
  fixture();
  t('GA beklenen 18000', eq(gexp('GA'), 18000), gexp('GA'));
  t('GA toplanan 9000 (B 4500 + F 4500)', eq(gpaid('GA'), 9000), gpaid('GA'));
  t('GA kalan 9000', eq(gbal('GA'), 9000), gbal('GA'));
  const earnBefore = earnGA();
  t('hoca hakedisi 3 ders x 1687,5 x %30 = 1518,75', eq(earnBefore, 1518.75), earnBefore);

  console.log('[1] TASINMA (B: GA → GB, 3 ders almis, 4500 odemis): pay = 562,5 x 3 = 1687,5 eski grupta; 2812,5 yeni gruba');
  w.eval("assignMemberToSlot('B','GB',2)"); await tick(120);
  t('pay sorusu SORULMADI (otomatik kural)', !seen('payı olarak kaydedilsin'), w.__msgs.filter(m=>/pay/i.test(m)).join(' | ').slice(0,160));
  { const s = share('GA','B'); t('GA pay kaydi: 3 ders · 1687,5 ₺ · not "taşındı"', !!s && +s.sessions===3 && eq(s.price,1687.5) && /taşın/.test(s.note||''), JSON.stringify(s)); }
  t('B artik GB kadrosunda, GA kadrosunda degil', J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GB'),'${CM}')`).includes('B') && !J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GA'),'${CM}')`).includes('B'));
  { const a = pays('B','GA'), b = pays('B','GB');
    t('B → GA odemesi 1687,5 (tek kayit, bolundu)', a.length===1 && eq(a[0].amount,1687.5), JSON.stringify(a.map(p=>p.amount)));
    t('B → GB odemesi 2812,5 (yeni kayit, ayni tarih/yontem, not "taşındı")', b.length===1 && eq(b[0].amount,2812.5) && b[0].date===a[0].date && b[0].method==='Nakit' && /taşın/.test(b[0].note||''), JSON.stringify(b));
    t('toplam degismedi: 1687,5 + 2812,5 = 4500', eq((a[0]||{}).amount + (b[0]||{}).amount, 4500));
    if (a.length && b.length) { const tA = J(`calcTax(1687.5,'Nakit')`), tB = J(`calcTax(2812.5,'Nakit')`); t('vergi alanlari yeniden hesaplandi (net = tutar, Nakit)', eq(a[0].net, tA.net) && eq(b[0].net, tB.net) && eq(a[0].pocket, tA.pocket) && eq(b[0].pocket, tB.pocket), JSON.stringify([a[0].net,b[0].net])); }
  }
  t('GA toplanan 6187,5 (F 4500 + B payi 1687,5)', eq(gpaid('GA'), 6187.5), gpaid('GA'));
  t('GA beklenen 15187,5 (A+C+F 13500 + B payi 1687,5)', eq(gexp('GA'), 15187.5), gexp('GA'));
  t('GA kalan 9000 = A 4500 + C 4500 (B parasi gizlemiyor)', eq(gbal('GA'), 9000), gbal('GA'));
  t('GB toplanan 11812,5 (D 4500 + E 4500 + B 2812,5)', eq(gpaid('GB'), 11812.5), gpaid('GB'));
  t('B GB ye odenmis 2812,5; GB de kalani 1687,5 (paket baslamadi → tam ucret 4500)', eq(mpaid('B','GB'), 2812.5) && eq(w.eval(`memberBalanceForMonth('B','${CM}')`), 1687.5), mpaid('B','GB') + ' / ' + w.eval(`memberBalanceForMonth('B','${CM}')`));
  t('hoca hakedisi DEGISMEDI (pay/ders = 562,5)', eq(earnGA(), earnBefore), earnGA());
  w.eval("renderMembers()"); await tick();
  { const rows = J(`buildMemberRows('${CM}')`); const r = rows.find(x=>x.groupId==='GA' && x.isFirstInGroup); t('Uyeler satiri GA: toplanan 6187,5 · kalan 9000', !!r && eq(r.groupPaid,6187.5) && eq(r.remaining,9000), r && JSON.stringify([r.groupPaid, r.remaining]));
    const pr = rows.find(x=>x.groupId==='GA' && x.memberId==='B'); t('Uyeler satiri GA: BURCU "ayrıldı · 3 ders" satiri, odenen 1687,5', !!pr && pr.isPartial && eq(pr.paid,1687.5), pr && JSON.stringify([pr.note, pr.paid])); }
  w.eval(`openGroupDetail('GA','${CM}')`); await tick();
  t('grup detayi GA "Toplanan (Ay)" 6.187,50', eq(parseTL(statVal('#gd-content .grid-stats .stat','Toplanan')), 6187.5), statVal('#gd-content .grid-stats .stat','Toplanan'));
  w.eval("closeModal('modal-group-detail')");
  if (TODAY > dd(1)) { const ov = J('getOverduePayments()').find(o=>o.groupId==='GA'); t('vadesi gecen: GA eksik 9000', !!ov && eq(ov.missing, 9000), ov && ov.missing); }
  else console.log('  (atla) vadesi gecen — ayin ilk gunu, ders henuz vadesi gelmedi');
  { const st = J('__undoStack.map(s=>s.label)'); t('Geri Al yigininda "Taşınma" adimi var', st.some(l=>/Taşınma/.test(l)), JSON.stringify(st)); }

  console.log('[2] TASINMA ders almadan (F: GA → GB, 0 ders, 4500 odemis): odemenin TAMAMI yeni gruba, pay yok');
  w.eval("assignMemberToSlot('F','GB',3)"); await tick(120);
  t('GA da F payi yok', !share('GA','F'));
  { const a = pays('F','GA'), b = pays('F','GB'); t('F odemesi tamamen GB ye gecti (4500, ayni kayit id pf)', a.length===0 && b.length===1 && b[0].id==='pf' && eq(b[0].amount,4500) && /taşın/.test(b[0].note||''), JSON.stringify({a:a.map(p=>p.amount), b:b.map(p=>[p.id,p.amount])})); }
  t('GA toplanan 1687,5 (yalniz B payi); kalan 9000', eq(gpaid('GA'), 1687.5) && eq(gbal('GA'), 9000), gpaid('GA') + ' / ' + gbal('GA'));

  console.log('[3] FIYATSIZ UYE tasinmasi (GUL: GC → GB, 2 ders, fiyati yok): otomatik kural UYGULANMAZ — v171 sorusu kalir, odeme yerinde');
  w.eval("state.groups.find(g=>g.id==='GB').size=6;");
  w.eval("assignMemberToSlot('GP','GB',4)"); await tick(120);
  t('pay sorusu SORULDU (ucret bilinmiyor)', seen('payı olarak kaydedilsin'));
  { const a = pays('GP','GC'); t('GUL odemesi GC de kaldi (3000)', a.length===1 && eq(a[0].amount,3000), JSON.stringify(a.map(p=>p.amount))); }

  console.log('[4] PASIFE ALMA + FAZLA ODEME (E: GB ye 4500 odemis, 0 ders, aydan cikarildi): Toplanan saymaz, kartinda "fazla odeme"');
  fixture();
  w.eval(`removeMemberFromMonth('E','${CM}')`); await tick(80);
  t('E GB kadrosunda degil', !J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='GB'),'${CM}')`).includes('E'));
  t('GB toplanan 4500 (yalniz D) — E nin parasi D nin borcunu gizlemiyor', eq(gpaid('GB'), 4500), gpaid('GB'));
  t('GB beklenen 4500, kalan 0', eq(gexp('GB'), 4500) && eq(gbal('GB'), 0), gexp('GB') + ' / ' + gbal('GB'));
  t('__memberExcess177(E) = 4500 (askida)', has('__memberExcess177') && eq(w.eval(`__memberExcess177('E','${CM}')`), 4500), has('__memberExcess177') ? w.eval(`__memberExcess177('E','${CM}')`) : 'fonksiyon yok');
  w.eval(`openMemberDetail('E','${CM}')`); await tick();
  t('uye detayi: "Fazla ödeme 4.500" uyarisi', /Fazla ödeme[^<]*4\.500/.test(d.getElementById('md-content').innerHTML), (d.getElementById('md-content').textContent.match(/Fazla[^\n]{0,60}/)||[''])[0]);
  w.eval("closeModal('modal-member-detail')");
  w.eval(`document.getElementById('pay-month').value='${CM}'; document.getElementById('pay-member-filter').value=''; renderPayments();`); await tick();
  { const tr = [...d.querySelectorAll('#payments-tbody tr, #pay-table tbody tr, table tbody tr')].find(x => x.textContent.indexOf('ECE') !== -1 && x.textContent.indexOf('4.500') !== -1); t('odemeler listesi: ECE satirinda "kadro dışı" rozeti', !!tr && /kadro dışı/.test(tr.textContent), tr ? tr.textContent.replace(/\s+/g,' ').slice(0,140) : 'satir yok'); }

  console.log('[5] KADRODAKI UYENIN FAZLASI (D: 4500 odedi, fiyati 4000 a indi): Toplanan 4000 sayar, fazla 500');
  fixture();
  w.eval(`setMemberMonthly('D','${CM}',{totalPrice:4000});`);
  t('GB toplanan 8500 (D 4000 + E 4500)', eq(gpaid('GB'), 8500), gpaid('GB'));
  t('GB kalan 0 (beklenen 8500)', eq(gbal('GB'), 0) && eq(gexp('GB'), 8500), gbal('GB') + ' / ' + gexp('GB'));
  t('__memberExcess177(D) = 500', has('__memberExcess177') && eq(w.eval(`__memberExcess177('D','${CM}')`), 500));

  console.log('[6] KADRO DISI PAYSIZ ODEME (X hic GB de olmadi, GB ye 1000 yazilmis): sayilmaz, rozet');
  fixture();
  w.eval(`state.payments.push({id:'px',memberId:'X',groupId:'GB',date:'${CM}-03',packageMonth:'${CM}',sessions:8,amount:1000,listPrice:1000,discount:0,method:'Nakit',pkgName:'8 Ders'});`);
  t('GB toplanan 9000 (X in 1000 i haric)', eq(gpaid('GB'), 9000), gpaid('GB'));
  t('__memberExcess177(X) = 1000', has('__memberExcess177') && eq(w.eval(`__memberExcess177('X','${CM}')`), 1000));

  console.log('[7] BIREYSELE GECIS (C: GA → bireysel, 3 ders, 4500 odemis): pay 1687,5 GA da, 2812,5 bireysel kayda');
  fixture();
  w.eval(`state.payments.push({id:'pc',memberId:'C',groupId:'GA',date:'${CM}-01',packageMonth:'${CM}',sessions:8,amount:4500,listPrice:4500,discount:0,method:'IBAN',pkgName:'8 Ders',net:3750,kdv:750,gv:562.5,pocket:3187.5,kdvRate:20,gvRate:15});`);
  w.eval(`__createIndividualUnit173('C','${CM}',{price:4500})`); await tick(120);
  { const s = share('GA','C'); t('GA pay kaydi C: 3 ders · 1687,5', !!s && +s.sessions===3 && eq(s.price,1687.5), JSON.stringify(s)); }
  { const a = pays('C','GA'), b = pays('C',''); t('C: GA 1687,5 · bireysel 2812,5', a.length===1 && eq(a[0].amount,1687.5) && b.length===1 && eq(b[0].amount,2812.5), JSON.stringify({a:a.map(p=>p.amount), b:b.map(p=>p.amount)})); }
  t('C bireysel odenmis 2812,5', eq(mpaid('C',''), 2812.5), mpaid('C',''));
  { const b = pays('C',''); const tB = J(`calcTax(2812.5,'IBAN')`); t('bolunen IBAN kaydinin KDV/net alanlari yeniden hesaplandi', b.length===1 && eq(b[0].net, tB.net) && eq(b[0].kdv, tB.kdv), JSON.stringify(b.map(p=>[p.net,p.kdv]))); }

  console.log('[8] TUTARLILIK: grup kalani = kadro kalanlari + pay kalanlari (fiyatli gruplar, tasinma sonrasi)');
  fixture();
  w.eval("assignMemberToSlot('B','GB',2)"); await tick(120);
  ['GA','GB'].forEach(gid => {
    const roster = J(`activeGroupRosterForMonth(state.groups.find(g=>g.id==='${gid}'),'${CM}')`);
    let sum = 0;
    roster.forEach(mid => { const pr = w.eval(`memberMonthlyTotalPrice('${mid}','${CM}')`) || 0; sum += Math.max(0, pr - mpaid(mid, gid)); });
    J(`__partialsOf(state.groups.find(g=>g.id==='${gid}'),'${CM}')`).forEach(p => { sum += Math.max(0, (+p.price||0) - mpaid(p.memberId, gid)); });
    t(gid + ': groupBalanceForMonth == Σ max(0, fiyat − odenen)', eq(gbal(gid), sum), gbal(gid) + ' vs ' + sum);
  });
  { const rows = J(`buildMemberRows('${CM}')`); ['GA','GB','GC'].forEach(gid => { const r = rows.find(x=>x.groupId===gid && x.isFirstInGroup); t(gid + ': Uyeler satiri kalan == groupBalanceForMonth', !!r && eq(r.remaining, gbal(gid)), r && r.remaining); }); }
  t('GC: fiyatsiz kadro uyesinin (GUL) odemesi ESKISI GIBI sayilir (sinir yok) → toplanan 3000', eq(gpaid('GC'), 3000), gpaid('GC'));

  console.log('[8b] PERSONEL tasidi (F16: para gormez): otomatik kural YOK — pay yalniz ders sayisi (v171 personel sorusu), odeme yerinde; yonetici ucreti girip "Fazlayi tasi" ile boler');
  fixture();
  w.eval("__sbRole='staff';");
  w.eval("assignMemberToSlot('B','GB',2)"); await tick(120);
  { const s = share('GA','B'); t('personel: pay 3 ders, FIYAT YOK; "Ücretini yönetici girer" soruldu', !!s && +s.sessions===3 && (s.price===undefined || s.price===null) && seen('Ücretini yönetici girer'), JSON.stringify(s)); }
  { const a = pays('B','GA'); t('personel: B odemesi GA da 4500 kaldi (bolunmedi)', a.length===1 && eq(a[0].amount,4500), JSON.stringify(a.map(p=>p.amount))); }
  w.eval("__sbRole='owner';");
  w.eval(`setPartialShare('GA','B','${CM}',3,1687.5,'taşındı');`);
  t('yonetici ucreti girdi: payi asan 2812,5 askida', eq(w.eval(`__memberGroupExcess177('B','GA','${CM}')`), 2812.5), w.eval(`__memberGroupExcess177('B','GA','${CM}')`));
  w.eval(`openGroupDetail('GA','${CM}')`); await tick();
  t('grup detayi ayrilanlar: "payı aşan 2.812,50" + "Fazlayı taşı" dugmesi', /payı aşan[^<]*2\.812,50/.test(d.getElementById('gd-content').innerHTML) && /__moveExcessToCurrentUnit177\('GA','B'/.test(d.getElementById('gd-content').innerHTML), (d.getElementById('gd-content').textContent.match(/payı aşan[^\n]{0,40}/)||[''])[0]);
  w.eval("closeModal('modal-group-detail')");
  await w.eval(`__moveExcessToCurrentUnit177('GA','B','${CM}')`); await tick(60);
  { const a = pays('B','GA'), b = pays('B','GB'); t('Fazlayi tasi: GA 1687,5 · GB 2812,5', a.length===1 && eq(a[0].amount,1687.5) && b.length===1 && eq(b[0].amount,2812.5), JSON.stringify({a:a.map(p=>p.amount), b:b.map(p=>p.amount)})); }
  t('GA toplanan 6187,5 · kalan 9000', eq(gpaid('GA'), 6187.5) && eq(gbal('GA'), 9000), gpaid('GA') + ' / ' + gbal('GA'));

  console.log('[9] CAPRAZ YUZEY DENETIMI (_dev/audit/pl-audit.js) tasinma + askida odeme sonrasi 0 uyumsuzluk');
  { const path = require('path'); const auditSrc = fs.readFileSync(path.join(__dirname, '..', 'audit', 'pl-audit.js'), 'utf-8'); w.eval(auditSrc);
    w.eval(`setMemberMonthly('D','${CM}',{totalPrice:4000});`); // D fazla odedi (500 askida) — kadro uyesi
    const a0 = J(`__plAudit('${CM}',{detail:false})`);
    t('__plAudit (tasinma + fazla odeme): 0 uyumsuzluk (' + a0.checks + ' kontrol)', a0.mismatchCount === 0, JSON.stringify(a0.sample));
    t('__plAudit: askida 500 (D nin fazlasi)', eq(a0.counts.askida, 500), a0.counts.askida);
    w.eval(`state.payments.push({id:'px',memberId:'X',groupId:'GB',date:'${CM}-03',packageMonth:'${CM}',sessions:8,amount:1000,listPrice:1000,discount:0,method:'Nakit',pkgName:'8 Ders'});`);
    const a = J(`__plAudit('${CM}',{detail:false})`);
    t('__plAudit (+ kadro disi paysiz odeme): yalniz yetim-odeme bayragi (1 uyumsuzluk), grup satiri tutarli', a.mismatchCount === 1 && /PAID_ROWS/.test(a.sample[0]||''), JSON.stringify(a.sample));
    t('__plAudit: askida 1500 (D 500 + X 1000)', eq(a.counts.askida, 1500), a.counts.askida); }

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
