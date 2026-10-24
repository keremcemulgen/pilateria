// v212 (Kerem 24.10): "Panelde Ekim 2026 tahsilatı yazan miktar nasıl hesaplanıyor. Üyeler kısmında yazan miktarla birbirine uymuyor"
// → karar (AskUserQuestion): "Panel paket ayına dönsün". Panel tahsilat kartı = Üyeler › Ödenmiş (o ayın PAKETLERİ için alınan; ödeme
// günü fark etmez) — TEK KAYNAK membersMonthStats212. Net Kâr kartı para esasında kalır (Finans › Özet ile aynı).
// Yamasız v211'de FAIL etmeli (Panel ödeme günü esaslıydı: Ekim'de alınan Eylül/Kasım paketi ödemeleri Panel'de, Üyeler'de değil).
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
    w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.scrollTo = () => {}; w.__PL_DLG_AUTO__ = (o) => o && o.input ? null : true;
  }
});
const w = dom.window, d = w.document;
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const num = (s) => +String(s || '').replace(/[^0-9,-]/g, '').replace(',', '.');

setTimeout(() => { try {
  w.eval("['renderCalendar','renderGroups','renderArchive','refreshGroupDetailIfOpen','refreshMemberDetailIfOpen'].forEach(function(fn){ window[fn] = function(){}; }); window.plToast = function(){};");
  const CM = w.eval('currentMonth()');
  const PM = w.eval(`(function(){ const d = parseISO('${CM}-01'); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })()`);
  const NM = w.eval(`(function(){ const d = parseISO('${CM}-01'); d.setMonth(d.getMonth() + 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })()`);
  w.eval(`
    state.settings.groupPackageDays = 30;
    state.packageTypes = [{ id: 'p8', name: '8 Ders', sessions: 8, price: 4500 }];
    state.instructors = [{ id: 'h1', name: 'HOCA BIR', shareRate: 30 }];
    const mk = (id, name) => ({ id: id, name: name, joinDate: '2026-01-01', defaultPackageId: 'p8', totalPrice: 4500, packages: [], monthly: { '${PM}': { enrolled: true }, '${CM}': { enrolled: true }, '${NM}': { enrolled: true } } });
    state.members = [mk('a1', 'AYLA DENEME'), mk('b1', 'BERNA DENEME'), mk('c1', 'CANSU DENEME')];
    state.groups = [{ id: 'g1', name: 'BERNA - CANSU', size: 2, memberIds: ['b1', 'c1'], defaultInstructorId: 'h1', defaultPackageId: 'p8', customTotalPrice: 8000, packages: [], monthlyMembers: { '${PM}': ['b1', 'c1'], '${CM}': ['b1', 'c1'], '${NM}': ['b1', 'c1'] }, monthlyNotes: {} }];
    state.lessons = [];
    state.payments = [
      { id: 'P1', memberId: 'a1', groupId: '', date: '${CM}-05', packageMonth: '${CM}', amount: 4500, method: 'Nakit', sessions: 8 },  // bu ayın paketi, bu ay alındı
      { id: 'P2', memberId: 'a1', groupId: '', date: '${CM}-02', packageMonth: '${PM}', amount: 4500, method: 'IBAN', sessions: 8 },   // GEÇEN ayın paketi, bu ay alındı
      { id: 'P3', memberId: 'b1', groupId: 'g1', date: '${PM}-28', packageMonth: '${CM}', amount: 4000, method: 'Nakit', sessions: 8 },// bu ayın paketi, GEÇEN ay alındı
      { id: 'P4', memberId: 'c1', groupId: 'g1', date: '${CM}-20', packageMonth: '${NM}', amount: 4000, method: 'IBAN', sessions: 8 }  // GELECEK ayın paketi, bu ay alındı
    ];
    const mm = document.getElementById('member-month'); if (mm) { [ '${PM}', '${CM}', '${NM}' ].forEach(function(v){ if (![...mm.options].some(function(o){ return o.value === v; })) { const o = document.createElement('option'); o.value = v; o.textContent = v; mm.appendChild(o); } }); mm.value = '${CM}'; }
    switchPage('members'); renderMembers();
  `);
  const membersPaid = () => { const st = [...d.querySelectorAll('#members-stats .stat')].find(e => /Ödenmiş/.test((e.querySelector('.label') || {}).textContent || '')); return st ? num(st.querySelector('.value').textContent) : NaN; };

  console.log('[1] Üyeler › Ödenmiş = bu ayın PAKETLERİ (ödeme günü fark etmez)');
  t('tek kaynak membersMonthStats212 var', w.eval('typeof membersMonthStats212') === 'function');
  const up = membersPaid();
  t('Üyeler › Ödenmiş = 8.500 (P1 4.500 + P3 4.000 — geçen ay alınan bu ayın paketi DAHİL)', up === 8500, up);
  t('membersMonthStats212(ay).paid = Üyeler kartı', w.eval(`typeof membersMonthStats212 === 'function' ? membersMonthStats212('${CM}').paid : -1`) === up, w.eval(`typeof membersMonthStats212 === 'function' ? membersMonthStats212('${CM}').paid : -1`));

  console.log('[2] Panel tahsilatı = Üyeler › Ödenmiş (Kerem: "birbirine uymuyor" → artık aynı)');
  w.eval(`window.__dashMonthUserSet = true; document.getElementById('dash-month').value = '${CM}'; switchPage('dashboard');`);
  const pv = num(d.getElementById('s-revenue').textContent);
  t('Panel ' + CM + ' tahsilatı = 8.500 = Üyeler › Ödenmiş', pv === 8500 && pv === up, d.getElementById('s-revenue').textContent + ' vs ' + up);
  t('Panel bu ay alınan GEÇEN/GELECEK ay paketlerini (P2, P4) SAYMAZ', pv !== 13000, pv);
  t('kart etiketi "… Tahsilatı (₺)"', /Tahsilatı/.test(d.getElementById('s-revenue-label').textContent), d.getElementById('s-revenue-label').textContent);
  t('kart altı: "bu ayın paketleri · Üyeler › Ödenmiş ile aynı"', /bu ayın paketleri/.test((d.getElementById('s-revenue-sub') || {}).textContent || '') && /Üyeler › Ödenmiş ile aynı/.test((d.getElementById('s-revenue-sub') || {}).textContent || ''), (d.getElementById('s-revenue-sub') || {}).textContent);
  t('panel başlık notu esasları söyler (tahsilat = paketler, net kâr = para esası)', /tahsilat = bu ayın paketleri/.test(d.getElementById('page-dashboard').textContent) && /net kâr = para esası/.test(d.getElementById('page-dashboard').textContent));

  console.log('[3] Net Kâr kartı para esasında kalır (Finans › Özet ile aynı); Finans/Raporlar tahsilatı ödeme günü');
  const np = d.getElementById('s-netprofit').textContent.trim();
  const fs208 = w.eval(`JSON.stringify(finSummary208('${CM}').studio)`);
  const S = JSON.parse(fs208);
  t('Net Kâr kartı = finSummary208.studio.net', w.eval(`money(finSummary208('${CM}').studio.net)`) === np, np + ' vs ' + S.net);
  t('Net Kâr kartı altı: "para esası"', /para esası/.test((d.getElementById('s-netprofit-sub') || {}).textContent || ''), (d.getElementById('s-netprofit-sub') || {}).textContent);
  t('Finans › Özet tahsilatı (ödeme günü) DEĞİŞMEDİ: 13.000 (P1 + P2 + P4)', S.uye === 13000, S.uye);

  console.log('[4] Geçen ay: Panel = Üyeler (P2 geçen ayın paketi)');
  w.eval(`document.getElementById('dash-month').value = '${PM}'; renderDashboard();`);
  const pvPrev = num(d.getElementById('s-revenue').textContent);
  w.eval(`document.getElementById('member-month').value = '${PM}'; renderMembers();`);
  const upPrev = membersPaid();
  t('geçen ay Panel = Üyeler = 4.500 (P2)', pvPrev === 4500 && upPrev === 4500, pvPrev + ' / ' + upPrev);
  w.eval(`document.getElementById('member-month').value = '${CM}'; renderMembers(); document.getElementById('dash-month').value = '${CM}';`);

  console.log('[5] Panel görünmezken ağır hesap atlanır; Panel\'e dönünce GÜNCEL rakam');
  w.eval("switchPage('members');");
  w.eval(`state.payments.push({ id: 'P5', memberId: 'a1', groupId: '', date: '${CM}-21', packageMonth: '${CM}', amount: 1000, method: 'Nakit', sessions: 0 }); save(); renderMembers(); renderDashboard();`);
  const upNow = membersPaid();
  t('Üyeler › Ödenmiş 9.500 oldu', upNow === 9500, upNow);
  w.eval("switchPage('dashboard');");
  const pvNow = num(d.getElementById('s-revenue').textContent);
  t('Panel\'e geçince 9.500 (Üyeler ile aynı)', pvNow === 9500, d.getElementById('s-revenue').textContent);

  console.log('');
  console.log('SONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.log('TEST COKTU', e && e.stack || e); process.exit(2); } }, 1200);
