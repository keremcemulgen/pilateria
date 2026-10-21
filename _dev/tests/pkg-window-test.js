// v211 (Kerem 21.10): "Üyeler kısmında paket başlangıç tarihleri yanlış gözüküyor — her ay yazılan ilk ders tarihi paket başlangıcında
// yazmalı; bitiş de son ders tarihi (yanan + yapılan = 8 ders olduğunda)." + "Bu şekilde yeni ayda ilk dersi yazılmamış üye veya grup
// olduğunda Üyeler sayfasından kolayca anlayabilmiş olacağım." Kararlar (AskUserQuestion): bitiş "paket bitince"; "30 gün kuralı öncelikli
// kalacak, son ders girildiğinde 30'dan az/fazla olursa o son dersin tarihi"; elle düzeltme ileri/geri tarihli olabilir ama ilk ders
// yazıldığında başlangıç kendiliğinden oraya gelir.
// TEK KAYNAK pkgWindow211 → Üyeler tablosu, telefon kartları, grup detayı kutusu, ders penceresi. Yamasız v210'da FAIL etmeli.
const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(process.argv[2], 'utf-8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously', url: 'https://localhost/p.html', pretendToBeVisual: true,
  beforeParse(w) {
    w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    if (!w.structuredClone) w.structuredClone = o => JSON.parse(JSON.stringify(o));
    Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: () => Promise.resolve({}), getRegistrations: () => Promise.resolve([]) }, configurable: true });
    w.__msgs = []; w.__ANS = null;
    w.__PL_DLG_AUTO__ = (o) => { w.__msgs.push(String((o && o.msg) || '')); if (o && o.input) return w.__ANS; return true; };
    w.alert = (m) => { w.__msgs.push(String(m || '')); }; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {};
  }
});
const w = dom.window, d = w.document;
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const tick = (ms) => new Promise(r => setTimeout(r, ms || 0));
const AY = '2026-10';
const row = (mid) => w.eval(`(function(){ var r = buildMemberRows('${AY}').find(function(x){ return x.memberId === '${mid}' && !x.isPartial; }); return r ? JSON.stringify({ s: r.pkgStart || '', e: r.pkgEnd || '' }) : 'null'; })()`);
const R = (mid) => JSON.parse(row(mid) || 'null') || { s: 'YOK', e: 'YOK' };
const L = (id, owner, date, st, extra) => `{ id: '${id}', date: '${date}', time: '10:00', status: '${st}', instructorId: 'h1', packageMonth: '${AY}', ${owner}${extra ? ', ' + extra : ''} }`;

setTimeout(async () => { try {
  w.eval("['renderCalendar','renderDashboard','renderGroups','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen','__refreshUIInPlace'].forEach(function(fn){ window[fn] = function(){}; }); window.plToast = function(){};");
  w.eval(`
    state.settings.groupPackageDays = 30; state.settings.reformers = 10;
    state.packageTypes = [{ id: 'p8', name: '8 Ders', sessions: 8, price: 4500 }];
    state.instructors = [{ id: 'h1', name: 'HOCA BIR', shareRate: 30 }];
    const mk = (id, name, mon) => ({ id: id, name: name, joinDate: '2026-01-01', defaultPackageId: 'p8', totalPrice: 4500, packages: [], monthly: { '${AY}': Object.assign({ enrolled: true }, mon || {}) } });
    state.members = [
      mk('a1', 'AYSE DENEME'), mk('b1', 'BURCU DENEME'), mk('c1', 'CEREN DENEME', { sessionsOverride: 6 }), mk('d1', 'DERYA DENEME'),
      mk('n1', 'NESE DENEME'), mk('n2', 'TAMELLA DENEME'), mk('n3', 'SEZEN DENEME', { packageStartDate: '2026-10-25' }),
      mk('e1', 'EMEL DENEME', { packageStartDate: '2026-10-25' }), mk('e2', 'ESRA DENEME')
    ];
    state.members.find(function(m){ return m.id === 'b1'; }).packages = [{ month: '${AY}', startDate: '${AY}-01', sessions: 8, price: 4500, status: 'active' }];
    state.groups = [
      { id: 'g1', name: 'NESE - TAMELLA - SEZEN', size: 3, memberIds: ['n1', 'n2', 'n3'], defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [{ month: '${AY}', startDate: '${AY}-01', sessions: 8, price: 0, status: 'active' }], monthlyMembers: { '${AY}': ['n1', 'n2', 'n3'] }, monthlyNotes: {} },
      { id: 'g2', name: 'EMEL - ESRA', size: 2, memberIds: ['e1', 'e2'], defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [{ month: '${AY}', startDate: '${AY}-01', sessions: 8, price: 0, status: 'active' }], monthlyMembers: { '${AY}': ['e1', 'e2'] }, monthlyNotes: {} }
    ];
    state.lessons = [
      ${L('LA0', "memberIds: ['a1']", '2026-10-02', 'cancelled')},
      ${['06', '09', '13', '16', '20', '23', '27', '30'].map((dd, i) => L('LA' + (i + 1), "memberIds: ['a1']", '2026-10-' + dd, 'planned')).join(',\n      ')},
      ${['01', '03', '06', '08', '10', '13'].map((dd, i) => L('LC' + (i + 1), "memberIds: ['c1']", '2026-10-' + dd, 'completed')).join(',\n      ')},
      ${['07', '10', '14', '17', '21', '24', '28', '31'].map((dd, i) => L('LG' + (i + 1), "groupId: 'g1', memberIds: ['n1','n2','n3']", '2026-10-' + dd, 'planned')).join(',\n      ')}
    ];
    state.payments = [{ id: 'pb', memberId: 'b1', amount: 4500, date: '${AY}-03', packageMonth: '${AY}', sessions: 8, method: 'Nakit' }];
    const mm = document.getElementById('member-month'); if (mm) { mm.innerHTML = '<option value="${AY}">Ekim</option>'; mm.value = '${AY}'; }
  `);

  console.log('[1] BİREYSEL: başlangıç = ilk ders (iptal sayılmaz); paket sürerken bitiş = 30 gün kuralı');
  t('tek kaynak pkgWindow211 var', w.eval('typeof pkgWindow211') === 'function');
  let a = R('a1');
  t('AYSE başlangıç 06.10 (02.10 iptal ders sayılmaz)', a.s === '2026-10-06', a.s);
  t('AYSE bitiş 04.11 (06.10 + 30 gün kuralı — paket sürüyor)', a.e === '2026-11-04', a.e);
  w.eval("['LA1','LA2','LA3','LA4','LA5','LA6','LA7'].forEach(function(id, i){ state.lessons.find(function(l){ return l.id === id; }).status = (i === 2 ? 'missed' : 'completed'); });");
  a = R('a1');
  t('7 ders (yapıldı + yandı) — paket sürüyor, bitiş hâlâ 04.11', a.e === '2026-11-04', a.e);
  w.eval("state.lessons.find(function(l){ return l.id === 'LA8'; }).status = 'missed';");
  a = R('a1');
  t('8. ders YANDI → yanan + yapılan = 8 → bitiş = o dersin tarihi 30.10 (30 günden kısa)', a.e === '2026-10-30', a.e);
  w.eval("state.lessons.find(function(l){ return l.id === 'LA8'; }).date = '2026-11-12';");
  a = R('a1');
  t('8. ders 12.11\'de yapıldıysa bitiş 12.11 (30 günden uzun)', a.e === '2026-11-12', a.e);
  w.eval("state.lessons.find(function(l){ return l.id === 'LA8'; }).date = '2026-10-30';");

  console.log('[2] Ödeme var, paket kaydı var, DERS YOK → başlangıç/bitiş "—" (yeni ayda ilk dersi yazılmamış üye görünür)');
  const b = R('b1');
  t('BURCU başlangıç boş (ödeme tarihi / ayın 1\'i YAZILMAZ)', b.s === '', b.s);
  t('BURCU bitiş boş', b.e === '', b.e);

  console.log('[3] HAK 6: yapıldı + yandı = hak olunca bitiş o dersin tarihi');
  const c = R('c1');
  t('CEREN (hak 6, 6 ders yapıldı) bitiş 13.10', c.s === '2026-10-01' && c.e === '2026-10-13', c.s + ' → ' + c.e);
  w.eval("state.lessons.find(function(l){ return l.id === 'LC6'; }).status = 'planned';");
  t('CEREN 5/6 → bitiş 30 gün kuralı (30.10)', R('c1').e === '2026-10-30', R('c1').e);
  w.eval("state.lessons = state.lessons.filter(function(l){ return l.id !== 'LC6'; }); state.lessons.find(function(l){ return l.id === 'LC5'; }).isLastOfPackage = true;");
  t('⭐ son ders işaretli (erken kapandı, planlı kalmadı) → bitiş ⭐ dersin tarihi 10.10', R('c1').e === '2026-10-10', R('c1').e);

  console.log('[4] GRUP: herkes grubun penceresi; paket kaydının tarihi (ayın 1\'i) değil İLK DERS');
  let n1 = R('n1'), n2 = R('n2'), n3 = R('n3');
  t('NESE/TAMELLA başlangıç 07.10 (paket kaydı 01.10 sayılmaz)', n1.s === '2026-10-07' && n2.s === '2026-10-07', n1.s + ' / ' + n2.s);
  t('SEZEN eski elle tarih (25.10) — ilk ders yazıldığı için ilk derse geçti (07.10)', n3.s === '2026-10-07', n3.s);
  t('bitiş 30 gün kuralı 05.11 (herkes aynı)', n1.e === '2026-11-05' && n3.e === '2026-11-05', n1.e + ' / ' + n3.e);
  w.eval("['LG1','LG2','LG3','LG4','LG5','LG6','LG7','LG8'].forEach(function(id, i){ state.lessons.find(function(l){ return l.id === id; }).status = (i === 4 ? 'missed' : 'completed'); });");
  n1 = R('n1'); n2 = R('n2');
  t('grup 8/8 (1 yandı) → bitiş 31.10 herkes', n1.e === '2026-10-31' && n2.e === '2026-10-31', n1.e + ' / ' + n2.e);

  console.log('[5] Dersi girilmemiş GRUP → "—"; eski elle tarih (ders yokken) görünür');
  const e1 = R('e1'), e2 = R('e2');
  t('ESRA (g2, ders yok) başlangıç/bitiş boş', e2.s === '' && e2.e === '', JSON.stringify(e2));
  t('EMEL eski elle tarih 25.10 (ders yokken) + 30 gün → 23.11', e1.s === '2026-10-25' && e1.e === '2026-11-23', JSON.stringify(e1));

  console.log('[6] ELLE DÜZELTME (ileri/geri): ilk ders değişmedikçe elle tarih; ilk ders girilince/değişince kendiliğinden ilk derse geçer');
  w.eval("state.lessons.forEach(function(l){ if (l.groupId === 'g1') l.status = 'planned'; });");
  w.__ANS = '2026-10-03';
  await w.editMonthlyPackageStart('n2', AY, 'g1');
  t('TAMELLA elle 03.10 (geri tarihli düzeltme) görünür', R('n2').s === '2026-10-03', R('n2').s);
  t('elle düzeltme anındaki ilk ders saklandı (07.10)', w.eval("((state.members.find(function(m){ return m.id === 'n2'; }).monthly || {})['" + AY + "'] || {}).packageStartBasis") === '2026-10-07');
  t('NESE grubun ilk dersinde kaldı (07.10)', R('n1').s === '2026-10-07', R('n1').s);
  w.eval(`state.lessons.push(${L('LG0', "groupId: 'g1', memberIds: ['n1','n2','n3']", '2026-10-05', 'planned')});`);
  t('daha ERKEN ders girildi → TAMELLA kendiliğinden ilk derse (05.10)', R('n2').s === '2026-10-05', R('n2').s);
  t('NESE de 05.10', R('n1').s === '2026-10-05', R('n1').s);
  w.__ANS = '2026-10-15';
  await w.editMonthlyPackageStart('d1', AY, '');
  t('DERYA (dersi yok) elle 15.10 (ileri tarihli) görünür', R('d1').s === '2026-10-15' && R('d1').e === '2026-11-13', JSON.stringify(R('d1')));
  w.eval(`state.lessons.push(${L('LD1', "memberIds: ['d1']", '2026-10-08', 'planned')});`);
  t('ilk dersi yazılınca başlangıç kendiliğinden 08.10', R('d1').s === '2026-10-08', R('d1').s);
  w.__ANS = '2026-10-09';
  await w.editMonthlyPackageStart('d1', AY, '');
  t('dersten SONRA elle düzeltme (09.10) görünür', R('d1').s === '2026-10-09', R('d1').s);
  w.__ANS = '';
  await w.editMonthlyPackageStart('d1', AY, '');
  t('boş bırakınca elle tarih silindi → ilk ders 08.10', R('d1').s === '2026-10-08' && !w.eval("((state.members.find(function(m){ return m.id === 'd1'; }).monthly || {})['" + AY + "'] || {}).packageStartDate"), R('d1').s);

  console.log('[7] GRUP elle düzeltme (grup detayı): herkes; ilk ders değişince kendiliğinden ilk derse');
  w.__ANS = '2026-10-04';
  await w.editGroupPkgStart('g1', AY);
  t('g1 elle 04.10 → NESE 04.10 (TAMELLA kendi tarihi değişmişti → ilk ders/grup)', R('n1').s === '2026-10-04', R('n1').s);
  t('paket kaydında elle işareti + o anki ilk ders', w.eval("(function(){ var p = state.groups.find(function(g){ return g.id === 'g1'; }).packages.find(function(p){ return p.month === '" + AY + "'; }); return p.startManual === true && p.startBasis === '2026-10-05'; })()"));
  w.eval("state.lessons.find(function(l){ return l.id === 'LG0'; }).status = 'cancelled';");
  t('ilk ders iptal edildi (ilk ders 07.10 oldu) → grup başlangıcı kendiliğinden 07.10', R('n1').s === '2026-10-07', R('n1').s);

  console.log('[8] Ödeme penceresinde elle yazılan başlangıç (bireysel) elle düzeltme sayılır');
  w.eval("openPaymentModal('b1', null, '', '" + AY + "');");
  w.eval("document.getElementById('mp-date').value = '" + AY + "-05'; document.getElementById('mp-amount').value = '0'; document.getElementById('mp-pkg-start').value = '2026-10-12';");
  w.eval("state.payments = state.payments.filter(function(p){ return p.memberId !== 'b1'; }); savePayment();");
  t('BURCU (dersi yok) ödemede yazılan 12.10 görünür', R('b1').s === '2026-10-12', JSON.stringify(R('b1')));

  console.log('[9] ÖDEME GECİKMESİ: vade = paket başlangıcı (ilk ders; elle düzeltildiyse elle tarih)');
  const ovOf = (pred) => w.eval(`JSON.stringify((getOverduePayments({ includeFuture: true }) || []).filter(function(o){ return ${pred}; }).map(function(o){ return { ay: (o.monthsDetail || [])[0] && o.monthsDetail[0].ay, due: (o.monthsDetail || [])[0] && o.monthsDetail[0].firstDate, first: o.firstLessonDate }; }))`);
  let ov = JSON.parse(ovOf("o.memberId === 'a1' && !o.groupId"));
  t('AYSE vadesi ilk ders 06.10 (iptal 02.10 sayılmaz)', ov.length === 1 && ov[0].due === '2026-10-06', JSON.stringify(ov));
  ov = JSON.parse(ovOf("o.memberId === 'b1' && !o.groupId"));
  t('BURCU (dersi yok, elle başlangıç 12.10) vadesi 12.10', ov.length === 1 && ov[0].due === '2026-10-12', JSON.stringify(ov));
  w.__ANS = '2026-10-20';
  await w.editMonthlyPackageStart('d1', AY, '');
  ov = JSON.parse(ovOf("o.memberId === 'd1' && !o.groupId"));
  t('DERYA ileri tarihli elle başlangıç 20.10 → vade 20.10 (ilk ders 08.10 değil)', ov.length === 1 && ov[0].due === '2026-10-20' && ov[0].first === '2026-10-20', JSON.stringify(ov));
  ov = JSON.parse(ovOf("o.groupId === 'g2'"));
  t('dersi girilmemiş g2 için vade/gecikme YOK', ov.length === 0, JSON.stringify(ov));
  ov = JSON.parse(ovOf("o.groupId === 'g1'"));
  t('g1 vadesi grubun paket başlangıcı 07.10', ov.length === 1 && ov[0].due === '2026-10-07', JSON.stringify(ov));
  w.__ANS = '';
  await w.editMonthlyPackageStart('d1', AY, '');

  console.log('[10] EKRANLAR: Üyeler tablosu, telefon kartları, grup detayı, ders penceresi aynı kaynaktan');
  w.eval("state.lessons.forEach(function(l){ if (l.groupId === 'g1') l.status = 'completed'; }); state.lessons.find(function(l){ return l.id === 'LG0'; }).status = 'cancelled';");
  w.eval("renderMembers();");
  const trOf = (name) => [...d.querySelectorAll('#members-table tbody tr')].find(tr => [...tr.querySelectorAll('b')].some(b => b.textContent.trim() === name)); // üye adı hücresi (grup adı hücresi değil)
  const trE = trOf('ESRA DENEME');
  t('tablo: ESRA başlangıç hücresi "—" ve "ders girilmedi" ipucu', !!trE && /ders girilmedi/i.test(trE.innerHTML), trE ? trE.innerHTML.slice(0, 400) : 'satır yok');
  const trA = trOf('AYSE DENEME');
  t('tablo: AYSE bitiş 30.10.2026 + ✓ (paket bitti)', !!trA && trA.innerHTML.indexOf('30.10.2026') !== -1 && trA.innerHTML.indexOf('✓') !== -1, trA ? trA.textContent.replace(/\s+/g, ' ').slice(0, 200) : 'satır yok');
  const cards = (d.getElementById('members-cards') || {}).innerHTML || '';
  t('telefon: dersi girilmemiş birim "İlk ders girilmedi"', /İlk ders girilmedi/.test(cards));
  t('telefon: AYSE kartında 📅 başlangıç–bitiş', /📅[^<]*06\.10/.test(cards), (cards.match(/📅[^<]{0,60}/g) || []).slice(0, 4).join(' | '));
  w.eval("openGroupDetail('g1', '" + AY + "');");
  const gd = (d.getElementById('gd-content') || {}).textContent || '';
  t('grup detayı: g1 paketi 07.10.2026 – 31.10.2026 · bitti 8/8', gd.indexOf('07.10.2026') !== -1 && gd.indexOf('31.10.2026') !== -1 && /8\/8/.test(gd) && /bitti/i.test(gd), (gd.match(/📦[^🔄]{0,140}/) || [''])[0]);
  w.eval("openGroupDetail('g2', '" + AY + "');");
  const gd2 = (d.getElementById('gd-content') || {}).textContent || '';
  t('grup detayı: g2 "ilk ders henüz girilmedi"', /ilk ders henüz girilmedi/i.test(gd2), (gd2.match(/📦[^🔄]{0,140}/) || [''])[0]);
  w.eval("openLessonModal('LG3');");
  const ri = (d.getElementById('ml-rights-info') || {}).textContent || '';
  t('ders penceresi: paket penceresi o dersin paket ayından (07.10.2026 – 31.10.2026)', ri.indexOf('07.10.2026') !== -1 && ri.indexOf('31.10.2026') !== -1, ri.slice(0, 200));
  try { w.eval("closeModal('modal-lesson'); closeModal('modal-group-detail');"); } catch (e) {}

  // Canlı veride (21.10) Ekim'in "—"lerinin çoğu: Eylül paketi Ekim'e PLANLI dersle sarkıyor (ör. son ders 27.10) → Ekim paketi henüz
  // başlamadı (normal). Kırmızı "—" yalnız GERÇEK eksikte kalmalı (önceki paket bitti / hiç ders yok), yoksa Kerem'in "yeni ayda ilk dersi
  // yazılmamış üye veya grup" işareti gürültüde kaybolur.
  console.log('[11] ÖNCEKİ AYIN PAKETİ SÜRÜYOR: Eylül paketi Ekime planlı dersle sarkıyorsa "⏳ Eylül paketi sürüyor"; bitmişse kırmızı "—"');
  w.eval(`
    const mk9 = (id, name) => ({ id: id, name: name, joinDate: '2026-01-01', defaultPackageId: 'p8', totalPrice: 4500, packages: [], monthly: { '2026-09': { enrolled: true }, '${AY}': { enrolled: true } } });
    state.members.push(mk9('p1', 'PELIN DENEME'), mk9('s1', 'SELMA DENEME'), mk9('s2', 'SONGUL DENEME'), mk9('f1', 'FUNDA DENEME'), mk9('f2', 'FERDA DENEME'));
    state.groups.push(
      { id: 'g3', name: 'SELMA - SONGUL', size: 2, memberIds: ['s1', 's2'], defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [], monthlyMembers: { '2026-09': ['s1', 's2'], '${AY}': ['s1', 's2'] }, monthlyNotes: {} },
      { id: 'g4', name: 'FUNDA - FERDA', size: 2, memberIds: ['f1', 'f2'], defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [], monthlyMembers: { '2026-09': ['f1', 'f2'], '${AY}': ['f1', 'f2'] }, monthlyNotes: {} }
    );
    const L9 = (id, own, date, st) => Object.assign({ id: id, date: date, time: '11:00', status: st, instructorId: 'h1', packageMonth: '2026-09' }, own);
    ['2026-09-22', '2026-09-24', '2026-09-29', '2026-10-01', '2026-10-06', '2026-10-08'].forEach(function(dt, i){
      state.lessons.push(L9('PP' + i, { memberIds: ['p1'] }, dt, 'completed'), L9('PG' + i, { groupId: 'g3', memberIds: ['s1', 's2'] }, dt, 'completed'));
    });
    ['2026-10-22', '2026-10-27'].forEach(function(dt, i){
      state.lessons.push(L9('PPx' + i, { memberIds: ['p1'] }, dt, 'planned'), L9('PGx' + i, { groupId: 'g3', memberIds: ['s1', 's2'] }, dt, 'planned'));
    });
    ['2026-09-21', '2026-09-23', '2026-09-28', '2026-09-30', '2026-10-05', '2026-10-07', '2026-10-12', '2026-10-19'].forEach(function(dt, i){
      state.lessons.push(L9('FG' + i, { groupId: 'g4', memberIds: ['f1', 'f2'] }, dt, 'completed'));
    });
  `);
  const W = (tp, id, ay) => JSON.parse(w.eval(`JSON.stringify(pkgWindow211('${tp}', '${id}', '${ay || AY}'))`));
  const wp = W('member', 'p1'), wg3 = W('group', 'g3'), wg4 = W('group', 'g4');
  t('PELIN (bireysel) Ekim: başlangıç yok, önceki paket 2026-09 sürüyor, son ders 27.10', wp.start === '' && wp.prevPm === '2026-09' && wp.prevLast === '2026-10-27', JSON.stringify(wp));
  t('g3 Ekim: başlangıç yok, Eylül paketi sürüyor (son ders 27.10)', wg3.start === '' && wg3.prevPm === '2026-09' && wg3.prevLast === '2026-10-27', JSON.stringify(wg3));
  t('g4 Ekim: Eylül paketi 19.10\'da BİTTİ, Ekim dersi yok → sürmüyor (gerçek eksik)', wg4.start === '' && wg4.prevPm === '', JSON.stringify(wg4));
  const w4s = W('group', 'g4', '2026-09'), w3s = W('group', 'g3', '2026-09');
  t('g4 Eylül penceresi: 21.09 – 19.10 ✓ (8. ders, 30 günden kısa)', w4s.start === '2026-09-21' && w4s.end === '2026-10-19' && w4s.finished === true, JSON.stringify(w4s));
  t('g3 Eylül penceresi: 22.09 – 21.10 (30 gün kuralı, 6/8 sürüyor)', w3s.start === '2026-09-22' && w3s.end === '2026-10-21' && !w3s.finished && w3s.done === 6, JSON.stringify(w3s));
  w.eval("renderMembers();");
  const trP = trOf('PELIN DENEME'), trS = trOf('SELMA DENEME'), trF = trOf('FUNDA DENEME');
  t('tablo: PELIN başlangıç "⏳ Eylül paketi sürüyor" (soluk, kırmızı değil)', !!trP && /pkg-prevrun/.test(trP.innerHTML) && /Eylül( \d{4})? paketi sürüyor/.test(trP.innerHTML) && !/pkg-nolesson/.test(trP.innerHTML), trP ? trP.innerHTML.slice(0, 500) : 'satır yok');
  t('tablo: PELIN ipucu son dersi söyler (27.10.2026)', !!trP && /son ders 27\.10\.2026/.test(trP.innerHTML));
  t('tablo: SELMA (g3) başlangıç "⏳ Eylül paketi sürüyor"', !!trS && /pkg-prevrun/.test(trS.innerHTML) && /Eylül( \d{4})? paketi sürüyor/.test(trS.innerHTML), trS ? trS.innerHTML.slice(0, 500) : 'satır yok');
  t('tablo: FUNDA (g4) KIRMIZI "—" (gerçek eksik)', !!trF && /pkg-nolesson/.test(trF.innerHTML) && !/paketi sürüyor/.test(trF.innerHTML), trF ? trF.innerHTML.slice(0, 500) : 'satır yok');
  t('tablo: ESRA (g2, hiç ders yok) hâlâ KIRMIZI "—"', !!trOf('ESRA DENEME') && /pkg-nolesson/.test(trOf('ESRA DENEME').innerHTML));
  const cards2 = (d.getElementById('members-cards') || {}).innerHTML || '';
  t('telefon: "⏳ Eylül paketi sürüyor (son ders 27.10.2026)" satırı var (PELIN + g3)', (cards2.match(/⏳ Eylül( \d{4})? paketi sürüyor \(son ders 27\.10\.2026\)/g) || []).length >= 2, (cards2.match(/⏳[^<]{0,60}/g) || []).join(' | '));
  t('telefon: g4 grubu "İlk ders girilmedi" (kırmızı)', /SELMA|FUNDA/.test(cards2) && (cards2.match(/mc-nolesson/g) || []).length >= 2, (cards2.match(/📅 İlk ders girilmedi/g) || []).length);
  w.eval("openGroupDetail('g3', '" + AY + "');");
  const gd3 = (d.getElementById('gd-content') || {}).textContent || '';
  t('grup detayı g3: "Eylül paketi sürüyor (son ders 27.10.2026) — Ekim paketi ilk dersiyle başlar"', /Eylül( \d{4})? paketi sürüyor \(son ders 27\.10\.2026\)/.test(gd3) && /Ekim( \d{4})? paketi ilk dersiyle başlar/.test(gd3) && !/ilk ders henüz girilmedi/.test(gd3), (gd3.match(/📦[^🔄]{0,160}/) || [''])[0]);
  w.eval("openGroupDetail('g4', '" + AY + "');");
  const gd4 = (d.getElementById('gd-content') || {}).textContent || '';
  t('grup detayı g4: "ilk ders henüz girilmedi"', /ilk ders henüz girilmedi/.test(gd4) && !/paketi sürüyor/.test(gd4), (gd4.match(/📦[^🔄]{0,160}/) || [''])[0]);
  try { w.eval("closeModal('modal-group-detail');"); } catch (e) {}
  const ovAll = JSON.parse(w.eval(`JSON.stringify(getOverduePayments({ includeFuture: true }).filter(function(r){ return ['g3','g4'].indexOf(r.groupId) !== -1 || r.memberId === 'p1' && !r.groupId; }).map(function(r){ return { k: r.groupId || r.memberId, m: r.months }; }))`));
  t('vade: Ekim paketi başlamamış birimlerde EKİM vadesi yok', ovAll.every(r => r.m.indexOf(AY) === -1), JSON.stringify(ovAll));
  w.eval(`state.lessons.push({ id: 'PO1', date: '2026-10-29', time: '11:00', status: 'planned', instructorId: 'h1', packageMonth: '${AY}', memberIds: ['p1'] });`);
  const wp2 = W('member', 'p1');
  t('PELIN Ekim paketinin ilk dersi (29.10) yazılınca başlangıç 29.10 (sürüyor etiketi kalkar)', wp2.start === '2026-10-29' && wp2.prevPm === '', JSON.stringify(wp2));

  console.log('');
  console.log('SONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.log('TEST COKTU', e && e.stack || e); process.exit(1); } }, 1500);
