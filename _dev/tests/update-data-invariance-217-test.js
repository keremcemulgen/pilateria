// v217 KALICI KURAL (Kerem 03.11): "Bir daha hiçbir güncelleme uygulamada mevcut girilmiş bilgileri değiştirmeyecek."
// GÜNCELLEME VERİ KORUMA KAPISI: aynı kayıtlı veriyle (localStorage 'pilateria') ESKİ sürüm (git HEAD = canlıdaki) ve YENİ sürüm açılır;
// açılıştan sonra kaydedilen veri BİREBİR aynı olmalı (yeni sürüm açılışta hiçbir kaydı farklı yazamaz / silemez / ekleyemez).
// Ayrıca yeni sürüm kendi çıktısıyla yeniden açılınca veri değişmemeli (açılış tekrarında kayma yok).
// Fikstür canlı veri ŞEKİLLERİNİ taklit eder (gerçek kişi yok): ay kadrosu kaydı olmayan eski grup, kadrolu grup, 2. paket klonu,
// pasif dönemli / arşivli üye, sarkan paket, bireysel üye, ayrılan payı, uzayan paket, gelecek ay planlı dersler, ödemeler, iadeler.
// Kullanım: node update-data-invariance-217-test.js <yeni.html> [eski.html]  (eski verilmezse: git show HEAD:pilateria.html)
const fs = require('fs'); const path = require('path'); const { JSDOM } = require('jsdom'); const { execSync } = require('child_process');
const NEW = fs.readFileSync(process.argv[2], 'utf-8');
let OLD = '';
try { OLD = process.argv[3] ? fs.readFileSync(process.argv[3], 'utf-8') : execSync('git show HEAD:pilateria.html', { cwd: path.join(__dirname, '..', '..'), maxBuffer: 64 * 1024 * 1024 }).toString('utf-8'); } catch (e) { OLD = ''; }
let pass = 0, fail = 0;
function t(n, c, x) { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } }
const tick = ms => new Promise(r => setTimeout(r, ms || 100));
function addM(ym, k) { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
const now = new Date(); const CUR = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
const P3 = addM(CUR, -3), P2 = addM(CUR, -2), P1 = addM(CUR, -1), N1 = addM(CUR, 1);
function fixture() {
  const en = (arr) => { const o = {}; arr.forEach(a => o[a] = { enrolled: true }); return o; };
  const mk = (id, n, mo, extra) => Object.assign({ id, name: n, phone: '', joinDate: P3 + '-01', defaultPackageId: 'p8', totalPrice: 6500, instructorId: 'h1', packages: [], monthly: mo }, extra || {});
  const members = [
    mk('A', 'AYLA DENEME', en([P3, P2, P1, CUR])), mk('B', 'BERNA DENEME', en([P3, P2, P1, CUR])),
    mk('C', 'CEMRE DENEME', en([P2, P1, CUR])), mk('D', 'DUYGU DENEME', en([P2, P1, CUR])),
    mk('E', 'EBRU DENEME', Object.assign(en([P3, P2, CUR]), { [P1]: { enrolled: false } }), { archivePeriods: [{ from: P1, to: CUR, reason: '' }] }),
    mk('F', 'FULYA DENEME', en([P3, P2]), { archivePeriods: [{ from: P1, to: null }] }),
    mk('I', 'IPEK DENEME', Object.assign(en([P2, P1, CUR]), { [CUR]: { enrolled: true, totalPrice: 7000, sessionsOverride: 8 } })),
    mk('Q', 'SEDA DENEME', en([P3]), { archived: true, archivedAt: P2 + '-01', archivedReason: 'manual' }),
    mk('A2', 'AYLA DENEME (2. Paket)', en([P1]), { secondOfMember: 'A' }),
    mk('Z', 'ZEYNEP DENEME', { [P3]: { totalPrice: 6000 }, [P2]: { enrolled: true }, [P1]: { enrolled: true }, [CUR]: { enrolled: true } })
  ];
  const pk = (a, st) => ({ month: a, startDate: a + '-03', sessions: 8, price: 0, status: st || 'active' });
  const groups = [
    { id: 'GL', name: 'AYLA DENEME - BERNA DENEME', size: 3, memberIds: ['A', 'B', 'Z'], defaultInstructorId: 'h1', defaultPackageId: 'p8', defaultDays: [1, 3], defaultTime: '10:00', customTotalPrice: 13000, packages: [pk(P3, 'completed'), pk(P2, 'completed'), pk(P1, 'completed'), pk(CUR)], monthlyMembers: {}, monthlyNotes: {} },
    { id: 'GK', name: 'CEMRE DENEME - DUYGU DENEME - EBRU DENEME', size: 3, memberIds: ['C', 'D', 'E'], defaultInstructorId: 'h1', defaultPackageId: 'p8', defaultDays: [2, 4], defaultTime: '11:00', customTotalPrice: 13500,
      packages: [pk(P2, 'completed'), pk(P1, 'completed'), pk(CUR)], monthlyMembers: { [P2]: ['C', 'D', 'E'], [P1]: ['C', 'D', 'E'], [CUR]: ['C', 'D', 'E'] }, monthlyNotes: {},
      monthlyPartials: { [P1]: { E: { sessions: 2, price: 1125, note: 'ayrıldı' } } }, memberJoinDates: { E: P2 + '-05' } },
    { id: 'G2', name: 'AYLA DENEME (2. Paket)', size: 2, memberIds: ['A2'], secondOfGroup: 'GL', defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [pk(P1, 'completed')], monthlyMembers: { [P2]: [], [P1]: ['A2'] }, monthlyNotes: {} },
    { id: 'GX', name: 'FULYA DENEME', size: 2, memberIds: ['F'], defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [pk(P3, 'completed'), pk(P2, 'extended')], monthlyMembers: { [P3]: ['F'] }, monthlyNotes: {}, archived: true, archivedAt: P1 + '-01' }
  ];
  const lessons = []; let n = 0;
  const L = (gid, mids, date, status, pm, extra) => lessons.push(Object.assign({ id: 'L' + (n++), groupId: gid, memberIds: mids, date, time: gid === 'GK' ? '11:00' : '10:00', status, packageMonth: pm, instructorId: 'h1', size: gid ? 3 : 1 }, extra || {}));
  const today = now.toISOString().slice(0, 10);
  [P3, P2, P1].forEach(a => ['05', '07', '12', '14', '19', '21', '26', '28'].forEach(d => L('GL', ['A', 'B', 'Z'], a + '-' + d, 'completed', a)));
  ['04', '06', '11', '13', '18', '20', '25', '27'].forEach((d, i) => { const dt = CUR + '-' + d; L('GL', ['A', 'B', 'Z'], dt, dt < today ? 'completed' : 'planned', CUR); });
  [P2, P1].forEach(a => ['03', '10', '17', '24'].forEach(d => L('GK', ['C', 'D', 'E'], a + '-' + d, 'completed', a)));
  ['02', '09'].forEach(d => L('GK', ['C', 'D', 'E'], CUR + '-' + d, 'planned', P1)); // sarkan
  ['16', '23', '30'].forEach(d => L('GK', ['C', 'D', 'E'], CUR + '-' + d, 'planned', CUR));
  ['04', '11'].forEach(d => L('GK', ['C', 'D', 'E'], N1 + '-' + d, 'planned', N1));
  L('G2', ['A2'], P1 + '-15', 'completed', P1); L('G2', ['A2'], P1 + '-22', 'missed', P1);
  [P3, P2].forEach(a => ['08', '15'].forEach(d => L('GX', ['F'], a + '-' + d, 'completed', a)));
  [P2, P1].forEach(a => ['06', '13', '20'].forEach(d => L('', ['I'], a + '-' + d, 'completed', a)));
  L('', ['I'], CUR + '-28', 'planned', CUR); L('', ['I'], CUR + '-01', 'cancelled', CUR, { cancelReason: 'x' });
  L('', ['Q'], P3 + '-09', 'completed', P3);
  const payments = []; let pn = 0; const P = (mid, gid, a, amt, extra) => payments.push(Object.assign({ id: 'P' + (pn++), memberId: mid, groupId: gid, date: a + '-04', packageMonth: a, amount: amt, method: 'Nakit', sessions: 8 }, extra || {}));
  [P3, P2, P1].forEach(a => { P('A', 'GL', a, 4500); P('B', 'GL', a, 4500); P('Z', 'GL', a, 4000); });
  [P2, P1].forEach(a => { P('C', 'GK', a, 4500); P('D', 'GK', a, 4500); }); P('E', 'GK', P2, 4500);
  P('I', '', P2, 6500); P('I', '', P1, 6500); P('I', '', CUR, 3000, { method: 'IBAN' }); P('I', '', P1, -500, { refund: true, method: 'Nakit' });
  P('A2', 'G2', P1, 4500); P('F', 'GX', P3, 6000); P('Q', '', P3, 6500);
  return { members, groups, lessons, payments, packageTypes: [{ id: 'p8', name: '8 Ders', sessions: 8, price: 6500 }], instructors: [{ id: 'h1', name: 'HOCA', shareRate: 30 }],
    settings: { reformers: 12, groupPackageDays: 30, lessonDuration: 50 }, monthInit: { [P2]: true, [P1]: true, [CUR]: true }, expenses: [], campaigns: [] };
}
function boot(html, raw) {
  return new Promise((resolve) => {
    const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://localhost/p.html', pretendToBeVisual: true, beforeParse(w) {
      w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
      w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }); if (!w.structuredClone) w.structuredClone = o => JSON.parse(JSON.stringify(o));
      Object.defineProperty(w.navigator, 'serviceWorker', { value: { register: () => Promise.resolve({}), getRegistrations: () => Promise.resolve([]) }, configurable: true });
      w.__PL_DLG_AUTO__ = (o) => null; // hiçbir onarım/soru onaylanmaz (açılış KENDİLİĞİNDEN veri değiştirmemeli)
      w.alert = () => {}; w.confirm = () => false; w.prompt = () => null; w.scrollTo = () => {};
      try { w.localStorage.setItem('pilateria', raw); } catch (e) {}
    } });
    setTimeout(() => {
      const w = dom.window; let out = '';
      try { w.eval('try { save(); } catch(e) {}'); } catch (e) {}
      try { const s = w.localStorage.getItem('pilateria') || ''; out = (typeof w.__plzDecompress === 'function') ? w.__plzDecompress(s) : s; } catch (e) { out = 'ERR ' + e.message; }
      const st = (function(){ try { return w.eval('JSON.stringify(state)'); } catch (e) { return 'ERR'; } })();
      w.close(); resolve({ saved: out, state: st });
    }, 3500);
  });
}
// sürümden bağımsız alanlar (zaman damgası, sürüm etiketi) karşılaştırma dışı
const VOLATILE = /^(_lastLocalEditAt|savedAt|__savedAt|updatedAt|_updatedAt|lastModified|__ver|appVersion|_v|__migratedAt|__lastSave)$/;
function norm(json) {
  let o; try { o = JSON.parse(json); } catch (e) { return json; }
  const walk = (x) => { if (Array.isArray(x)) return x.map(walk); if (x && typeof x === 'object') { const r = {}; Object.keys(x).sort().forEach(k => { if (!VOLATILE.test(k)) r[k] = walk(x[k]); }); return r; } return x; };
  return JSON.stringify(walk(o));
}
function firstDiff(a, b) {
  const A = JSON.parse(a), B = JSON.parse(b), out = [];
  [...new Set(Object.keys(A).concat(Object.keys(B)))].forEach(k => {
    const x = A[k], y = B[k];
    if (JSON.stringify(x) === JSON.stringify(y)) return;
    if (Array.isArray(x) && Array.isArray(y)) {
      const ix = Object.fromEntries(x.map(r => [r.id, JSON.stringify(r)])), iy = Object.fromEntries(y.map(r => [r.id, JSON.stringify(r)]));
      Object.keys(ix).forEach(id => { if (!(id in iy)) out.push(k + ' SİLİNDİ ' + id); else if (ix[id] !== iy[id]) out.push(k + ' DEĞİŞTİ ' + id + ': ' + ix[id].slice(0, 160) + ' → ' + iy[id].slice(0, 160)); });
      Object.keys(iy).forEach(id => { if (!(id in ix)) out.push(k + ' EKLENDİ ' + id); });
    } else out.push(k + ' DEĞİŞTİ: ' + String(JSON.stringify(x)).slice(0, 160) + ' → ' + String(JSON.stringify(y)).slice(0, 160));
  });
  return out.slice(0, 12);
}
setTimeout(async () => { try {
  const X = JSON.stringify(fixture());
  console.log('[1] ESKİ (canlı) ve YENİ sürüm aynı kayıtlı veriyle açılır → kaydedilen veri BİREBİR aynı');
  if (!OLD) { t('eski sürüm okunamadı (git HEAD)', false); }
  else {
    const o = await boot(OLD, X), nw = await boot(NEW, X);
    const a = norm(o.saved), b = norm(nw.saved);
    t('açılış sonrası kaydedilen veri: eski sürüm = yeni sürüm', a === b, firstDiff(a, b).join('\n        '));
    const sa = norm(o.state), sb = norm(nw.state);
    t('bellekteki veri: eski sürüm = yeni sürüm', sa === sb, firstDiff(sa, sb).join('\n        '));
    console.log('[2] YENİ sürüm kendi kaydıyla yeniden açılır → veri değişmez (açılış tekrarında kayma yok)');
    const n2 = await boot(NEW, nw.saved);
    t('ikinci açılış: kaydedilen veri aynen', norm(n2.saved) === b, firstDiff(b, norm(n2.saved)).join('\n        '));
    console.log('[3] Girilmiş kayıtlar korunur (sayılar)');
    const B = JSON.parse(b), I = JSON.parse(X);
    t('üye / grup / ödeme sayısı açılışta değişmez', B.members.length === I.members.length && B.groups.length === I.groups.length && B.payments.length === I.payments.length, [B.members.length, B.groups.length, B.payments.length].join('/'));
    t('ödemeler (tutar, ay, kişi) aynen', JSON.stringify(B.payments.map(p => [p.id, p.memberId, p.groupId, p.amount, p.packageMonth])) === JSON.stringify(I.payments.map(p => [p.id, p.memberId, p.groupId, p.amount, p.packageMonth])));
    t('YAPILMIŞ / YANAN dersler (tarih, kişi, paket ayı) aynen', JSON.stringify(B.lessons.filter(l => l.status !== 'planned').map(l => [l.id, l.date, l.status, l.packageMonth, (l.memberIds || []).join(',')])) === JSON.stringify(I.lessons.filter(l => l.status !== 'planned').map(l => [l.id, l.date, l.status, l.packageMonth, (l.memberIds || []).join(',')])));
  }
  console.log('\nSONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  process.exit(fail ? 1 : 0);
} catch (e) { console.log('TEST COKTU', e && e.stack || e); process.exit(2); } }, 50);
