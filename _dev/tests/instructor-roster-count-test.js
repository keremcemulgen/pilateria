// v183 — HOCALAR: "Uye ve Grup Dagilimi" SAYIMI (Kerem 2026-09-29: "hocalarin kac grubu ve uye sayisi oldugunu gosteren
// bolum dogru mu? Ayni aydaki ikinci paketleri uye sayisi ve yeni grup olarak mi gosteriyor?").
// Kok: instructorMemberBreakdown / instructorGroupCountForMonth her UYE KAYDINI ve her GRUP KAYDINI saydi —
// 2. paket klonu (secondOfMember) ikinci kisi, 2. paket grubu (secondOfGroup / klonlardan olusan eski ikiz) ikinci grup
// olarak sayiliyordu (v59 kanonu: uye sayisi = benzersiz KISI). Ayrica g.archived / m.archived bayragi GECMIS aylarda da
// dislaniyordu (sonradan pasife alinan grup/uye, aktif oldugu ayda gorunmuyordu). v183: tek kaynak __instructorRoster183.
// v184: [4] Hocalar kartinda grup/uye listesi, [5] Uyeler listesinde secilen hoca + hoca adiyla arama.
// Yamasiz (v182) build'de FAIL eder; [4][5] v183'te FAIL eder.
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
    w.__msgs=[]; w.__PL_DLG_AUTO__=true; w.alert=()=>{}; w.confirm=()=>true; w.prompt=()=>null; w.scrollTo=()=>{}; w.print=()=>{};
  }});
const w=dom.window, d=w.document;
let pass=0,fail=0;
function t(n,c,x){ if(c){pass++;console.log('  OK ',n);} else {fail++;console.log('  FAIL',n,x!==undefined?'-> '+x:'');} }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 40));
const J = (expr) => JSON.parse(w.eval('JSON.stringify(' + expr + ')') || 'null');
setTimeout(async ()=>{ try {
  w.eval("['renderArchive','renderCalendar'].forEach(fn=>window[fn]=function(){});");
  const CM = w.eval('currentMonth()');
  const sh = (k) => { const p=CM.split('-').map(Number); const dt=new Date(p[0],p[1]-1+k,1); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); };
  const NEXT = sh(1);
  w.eval(`
    state.settings.reformers=12; state.packageTypes=[{id:'p8',name:'8 Ders',sessions:8,price:4500}];
    state.instructors=[{id:'h1',name:'HOCA1',shareRate:30},{id:'h2',name:'HOCA2',shareRate:30}];
    const mk = (id,name,o) => Object.assign({id:id,name:name,phone:'',joinDate:'2026-01-01',defaultPackageId:'p8',totalPrice:4500,instructorId:'h1',packages:[],monthly:{'${CM}':{enrolled:true}}}, o||{});
    const NM = {A:'AYSE',B:'BERNA',C:'CEREN',F:'FUNDA',G:'GAMZE',I:'IREM',Z:'ZEYNEP',K:'KUBRA'};
    const cl = (id,root,n) => mk(id, NM[root] + ' (' + n + '. Paket)', {secondOfMember: root});
    state.members=[
      mk('A','AYSE'),mk('B','BERNA'),mk('C','CEREN'),cl('A2','A',2),cl('B2','B',2),cl('C2','C',2),
      mk('D','DUYGU'),mk('E','EMEL'),cl('A3','A',3),
      mk('F','FUNDA'),mk('G','GAMZE'),cl('F2','F',2),cl('G2','G',2),
      mk('I','IREM'),cl('I2','I',2),
      mk('X','XENA',{archived:true,archivedAt:'${NEXT}-01'}),mk('Y','YASEMIN'),
      mk('Z','ZEYNEP',{instructorId:'h2'}),cl('Z2','Z',2),
      mk('K','KUBRA'),cl('K2','K',2)
    ];
    state.groups=[
      // GA 4 kisilik (3 kisi) + ikizi GA2 (secondOfGroup) ayni ay → 1 grup, 3 kisi (+1 2. paket grubu)
      {id:'GA',name:'AYSE - BERNA - CEREN',size:4,memberIds:['A','B','C'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['A','B','C']}},
      {id:'GA2',name:'AYSE (2. Paket) - BERNA (2. Paket) - CEREN (2. Paket)',secondOfGroup:'GA',pkgNo:2,size:4,memberIds:['A2','B2','C2'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['A2','B2','C2']}},
      // GM 4 kisilik KARMA (gercek D,E + A'nin 3. paketi) → gercek ayri grup; A tekrar kisi sayilmaz
      {id:'GM',name:'DUYGU - EMEL - AYSE (3. Paket)',size:4,memberIds:['D','E','A3'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['D','E','A3']}},
      // GB 2 kisilik + ESKI tip ikiz GB2 (secondOfGroup bagi YOK, tamami klon, ayni kisiler) → 1 grup
      {id:'GB',name:'FUNDA - GAMZE',size:2,memberIds:['F','G'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['F','G']}},
      {id:'GB2',name:'FUNDA (2. Paket) - GAMZE (2. Paket)',size:2,memberIds:['F2','G2'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['F2','G2']}},
      // GX 3 kisilik: SONRAKI ay pasife alinmis (archived bayragi bugun true) — bu ay aktifti → sayilir
      {id:'GX',name:'XENA - YASEMIN',size:3,memberIds:['X','Y'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['X','Y']},archived:true,archivedAt:'${NEXT}-01'},
      // GZ: kok grup h2'de, 2. paket grubu h1'de → h1 icin TEK grubu (kok baska hocada)
      {id:'GZ',name:'ZEYNEP',size:2,memberIds:['Z'],defaultInstructorId:'h2',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['Z']}},
      {id:'GZ2',name:'ZEYNEP (2. Paket)',secondOfGroup:'GZ',pkgNo:2,size:2,memberIds:['Z2'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['Z2']}},
      // GK: K bireysel degil, K2 (2. paket) 2 kisilik grupta — K bireysel sayilir, K2 grubu gercek grup, K tekrar kisi DEGIL
      {id:'GK',name:'KUBRA (2. Paket)',size:2,memberIds:['K2'],defaultInstructorId:'h1',defaultPackageId:'p8',packages:[],monthlyMembers:{'${CM}':['K2']}}
    ];
    state.lessons=[]; state.payments=[];
  `);
  // beklenen (h1, CM):
  //  bireysel: I (I2 = 2. paket), K  → 2 kisi, +1 2. paket
  //  2 kisilik: GB (F,G) [GB2 ikiz], GZ2 (Z — kok grup h2'de), GK (K2 → K zaten bireysel sayildi) → 3 grup; kisi F,G,Z = 3; +2. paket: GB2 grubu, F2,G2 kaydi, K2 kaydi
  //  3 kisilik: GX (X,Y) → 1 grup, 2 kisi
  //  4 kisilik: GA (A,B,C) [GA2 ikiz], GM (D,E; A3 = A'nin 3. paketi) → 2 grup, 5 kisi; +1 ikiz grup; +4 paket kaydi (A2,B2,C2,A3)
  //  TOPLAM kisi: 2+3+2+5 = 12 ; grup: 3+1+2 = 6
  console.log('[1] tek kaynak __instructorRoster183');
  t('fonksiyon var', w.eval("typeof __instructorRoster183")==='function');
  const R = J(`__instructorRoster183('h1','${CM}')`);
  t('toplam benzersiz KISI = 12 (klon kayitlari ikinci kisi degil)', R && R.persons===12, R && R.persons);
  t('toplam grup = 6 (2. paket gruplari ayri grup degil)', R && R.groups===6, R && R.groups);
  t('bireysel: 2 kisi (IREM, KUBRA), +1 2. paket kaydi', R && R.bySize[1].persons===2 && R.bySize[1].extraRecords===1, R && JSON.stringify(R.bySize[1]));
  t('2 kisilik: 3 grup, 3 kisi, 1 ikiz grup', R && R.bySize[2].groups===3 && R.bySize[2].persons===3 && R.bySize[2].twinGroups===1, R && JSON.stringify(R.bySize[2]));
  t('3 kisilik: GX (sonraki ay pasif) BU AY sayilir — 1 grup, 2 kisi', R && R.bySize[3].groups===1 && R.bySize[3].persons===2, R && JSON.stringify(R.bySize[3]));
  t('4 kisilik: 2 grup (GA + karma GM), 5 kisi, 1 ikiz grup, 4 ek paket kaydi', R && R.bySize[4].groups===2 && R.bySize[4].persons===5 && R.bySize[4].twinGroups===1 && R.bySize[4].extraRecords===4, R && JSON.stringify(R.bySize[4]));
  t('toplam ek 2. paket kaydi = 8 (A2,B2,C2,A3,F2,G2,K2,I2)', R && R.extraRecords===8, R && R.extraRecords);
  t('toplam ikiz grup = 2 (GA2, GB2)', R && R.twinGroups===2, R && R.twinGroups);

  console.log('[2] eski fonksiyonlar ayni kaynaga baglandi');
  const br = J(`(function(){ const b = instructorMemberBreakdown('h1','${CM}'); return [1,2,3,4,5].map(s => b[s].length); })()`);
  t('instructorMemberBreakdown kova kisi sayilari [2,3,2,5,0]', JSON.stringify(br)==='[2,3,2,5,0]', JSON.stringify(br));
  const gc = J(`instructorGroupCountForMonth('h1','${CM}')`);
  t('instructorGroupCountForMonth {2:3,3:1,4:2}', gc && gc[2]===3 && gc[3]===1 && gc[4]===2 && (gc[5]||0)===0, JSON.stringify(gc));
  const R2 = J(`__instructorRoster183('h2','${CM}')`);
  t('h2: kok grup GZ (1 grup, 1 kisi)', R2 && R2.groups===1 && R2.persons===1, JSON.stringify(R2));

  console.log('[3] Hocalar sayfasi');
  w.eval(`__instructorMonth='${CM}'; switchPage('instructors'); renderInstructors();`); await tick();
  const card = [...d.querySelectorAll('#instructor-list .card')].find(c => /HOCA1/.test(c.textContent));
  const ctext = card ? card.textContent.replace(/\s+/g,' ') : '';
  const uyeStat = card ? [...card.querySelectorAll('.stat')].find(s => /Üye/.test((s.querySelector('.label')||{}).textContent||'')) : null;
  t('Uye kutusu = 12', uyeStat && (uyeStat.querySelector('.value')||{}).textContent.trim()==='12', uyeStat && uyeStat.textContent.replace(/\s+/g,' '));
  t('Uye kutusu alt satiri: 2 bireysel + 6 grup, 2. paket kaydi notu', uyeStat && /2 bireysel \+ 6 grup/.test(uyeStat.textContent) && /2\. paket/.test(uyeStat.textContent), uyeStat && uyeStat.textContent.replace(/\s+/g,' '));
  const cell = (lbl) => { const c = card && [...card.querySelectorAll('.inst-bd-cell')].find(x => ((x.querySelector('.ibd-lbl')||{}).textContent||'').trim()===lbl); return c ? c.textContent.replace(/\s+/g,' ') : ''; };
  t('4 kisilik hucre: "2 grup · 5 üye" ve 2. paket notu', /^\s*2\b/.test(cell('4 kişilik grup')) && /2 grup · 5 üye/.test(cell('4 kişilik grup')) && /2\. paket/.test(cell('4 kişilik grup')), cell('4 kişilik grup'));
  t('2 kisilik hucre: "3 grup · 3 üye"', /3 grup · 3 üye/.test(cell('2 kişilik grup')), cell('2 kişilik grup'));
  t('3 kisilik hucre (GX) gorunur: "1 grup · 2 üye"', /1 grup · 2 üye/.test(cell('3 kişilik grup')), cell('3 kişilik grup'));
  t('bireysel hucre: 2 (+2. paket notu)', /^\s*2\b/.test(cell('Bireysel üye')) && /2\. paket/.test(cell('Bireysel üye')), cell('Bireysel üye'));

  console.log('[4] v184: Hocalar kartinda gruplar ve uyeler LISTESI (sayimla ayni kaynak)');
  const det = card && card.querySelector('details.inst-roster-184');
  const dtext = det ? det.textContent.replace(/\s+/g,' ') : '';
  t('liste var ve acik', !!det && det.open, dtext.slice(0,120));
  t('ozet: 6 grup · 12 üye · 2 2. paket grubu', /6 grup · 12 üye · 2 2\. paket grubu/.test(dtext), dtext.slice(0,160));
  t('grup adlari listede (AYSE - BERNA - CEREN, DUYGU - EMEL - AYSE (3. Paket), FUNDA - GAMZE, XENA - YASEMIN, ZEYNEP (2. Paket), KUBRA (2. Paket))', ['AYSE - BERNA - CEREN','DUYGU - EMEL','FUNDA - GAMZE','XENA - YASEMIN','ZEYNEP (2. Paket)','KUBRA (2. Paket)'].every(n => dtext.indexOf(n) !== -1), dtext);
  t('kadro adlari listede (DUYGU, EMEL, XENA, YASEMIN)', ['DUYGU','EMEL','XENA','YASEMIN'].every(n => dtext.indexOf(n) !== -1));
  { const lines = det ? [...det.querySelectorAll(':scope > div')].map(x => x.textContent.replace(/\s+/g,' ')) : [];
    const twinLine = lines.find(x => /↳/.test(x) && /BERNA \(2\. Paket\)/.test(x));
    const ga = lines.findIndex(x => /^\s*👯 AYSE - BERNA - CEREN/.test(x));
    t('GA2 satiri "3 kayıt (aynı kişiler ...)"', /3 kayıt \(aynı kişiler/.test(twinLine||''), twinLine);
    t('GA2 ikiz grubu "↳ 2. paket grubu" olarak GA\'nin HEMEN altinda', !!twinLine && ga !== -1 && lines[ga+1] === twinLine, JSON.stringify(lines.slice(0,4)));
    const ind = lines.find(x => /Bireysel/.test(x));
    t('bireysel satiri: IREM, KUBRA + IREM (2. Paket) "2. paket" etiketli', !!ind && /IREM/.test(ind) && /KUBRA/.test(ind) && /IREM \(2\. Paket\) 2\. paket/.test(ind), ind);
    const gk = lines.find(x => /KUBRA \(2\. Paket\)/.test(x) && /👯/.test(x));
    t('GK grubunda KUBRA (2. Paket) "2. paket" etiketli (KUBRA bireysel sayildi)', !!gk && /2\. paket/.test(gk.replace(/KUBRA \(2\. Paket\)/,'')), gk); }
  const glink = det && [...det.querySelectorAll('a')].find(a => /XENA - YASEMIN/.test(a.textContent));
  if (glink) { glink.click(); await tick(); }
  t('grup adina tikla → grup detayi (GX) acilir', w.eval("(typeof currentGroupDetailId!=='undefined'?currentGroupDetailId:'')")==='GX' || /XENA/.test((d.getElementById('gd-content')||{}).textContent||''), w.eval("typeof currentGroupDetailId!=='undefined'?currentGroupDetailId:'?'"));
  w.eval("while(__modalStack.length){ closeModal(__modalStack[__modalStack.length-1]); }");

  console.log('[5] v184: Uyeler listesinde secilen hoca yazar (grup: grubun hocasi, bireysel: uyenin hocasi); arama hoca adiyla');
  w.eval(`switchPage('members'); const sel=document.getElementById('member-month'); sel.innerHTML='<option value="${CM}">${CM}</option>'; sel.value='${CM}'; document.getElementById('member-search').value=''; renderMembers();`); await tick();
  const gcell = [...d.querySelectorAll('#members-table td.grp-name-cell')].find(td => /AYSE - BERNA - CEREN/.test(td.textContent));
  t('grup hucresi: GA → 🧑‍🏫 HOCA1', !!gcell && /🧑‍🏫 HOCA1/.test(gcell.textContent), gcell && gcell.textContent.replace(/\s+/g,' '));
  const gz = [...d.querySelectorAll('#members-table td.grp-name-cell')].find(td => /^\s*👯 ZEYNEP\s/.test(td.textContent) || /👯 ZEYNEP🧑|👯 ZEYNEP\d|👯 ZEYNEP \d/.test(td.textContent.replace(/\s+/g,' ')));
  t('GZ (kok grup, h2) → 🧑‍🏫 HOCA2', !!gz && /🧑‍🏫 HOCA2/.test(gz.textContent), gz && gz.textContent.replace(/\s+/g,' '));
  const irow = [...d.querySelectorAll('#members-table tbody tr')].find(tr => /\bIREM\b/.test(tr.textContent) && !/Paket/.test(tr.textContent));
  t('bireysel satir (IREM): "Bireysel" + 🧑‍🏫 HOCA1', !!irow && /Bireysel/.test(irow.textContent) && /🧑‍🏫 HOCA1/.test(irow.textContent), irow && irow.textContent.replace(/\s+/g,' ').slice(0,120));
  const cards = (d.getElementById('members-cards')||{}).textContent || '';
  t('mobil: grup basligi ve bireysel kartta hoca', /AYSE - BERNA - CEREN\s*🧑‍🏫 HOCA1/.test(cards.replace(/\s+/g,' ')) && /IREM\s*· 🧑‍🏫 HOCA1/.test(cards.replace(/\s+/g,' ')), cards.replace(/\s+/g,' ').slice(0,300));
  w.eval("document.getElementById('member-search').value='hoca2'; renderMembers();"); await tick();
  { const names = [...d.querySelectorAll('#members-table tbody tr')].map(tr => tr.textContent.replace(/\s+/g,' ')).filter(x => x.trim());
    t('arama "hoca2" → yalniz HOCA2 birimleri (ZEYNEP grubu)', names.length>=1 && names.some(x => /ZEYNEP/.test(x)) && names.every(x => /ZEYNEP/.test(x) || /BOŞ/.test(x)) , JSON.stringify(names.map(x=>x.slice(0,60)))); }
  w.eval("document.getElementById('member-search').value=''; renderMembers();");

  console.log('');
  console.log('SONUC: '+pass+' gecti, '+fail+' kaldi');
  process.exit(fail?1:0);
} catch(e){ console.log('TEST HATASI', e&&e.stack||e); process.exit(1); } }, 1500);
