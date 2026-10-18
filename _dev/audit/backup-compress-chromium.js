// v204 DENETİM (Chromium): gerçek tarayıcı localStorage'ında yedek sıkıştırması — gerçek boyutta sentetik durum (~700K karakter) ile
// halka ×5 + günlük + undo + pre_pull yazılır; toplam yerel depo ham×1,6'nın altında kalmalı (eskiden ~ham×9); recover.html paketli
// yedekleri listeler. Yerel sunucu: python3 -m http.server 8765 (repo kökü). Çalıştır: node _dev/audit/backup-compress-chromium.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  let pass = 0, fail = 0; const t = (n, c, x) => { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  await p.goto('http://127.0.0.1:8765/pilateria.html', { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    try { sbHideAuth(); } catch (e) {}
    const rnd = (n) => Math.random().toString(36).slice(2, 2 + n);
    const st = { members: [], lessons: [], payments: [], expenses: [], groups: [], instructors: [{ id: 'p5cxj21z', name: 'GİZEM', shareRate: 30 }], packageTypes: [{ id: 'p1', name: 'BIREYSEL', sessions: 8, price: 4500 }], settings: { finance: { partners: ['Kerem ÖZTEPE', 'Derya ÖZTEPE'], startMonth: '2026-07' } } };
    for (let i = 0; i < 190; i++) st.members.push({ id: rnd(8), name: 'ÜYE ' + i + ' ÇĞİÖŞÜ', phone: '05' + String(300000000 + i * 7919), joinDate: '2026-0' + (1 + i % 9) + '-1' + (i % 9), defaultPackageId: 'p1', totalPrice: 4500, packages: [], monthly: { '2026-09': { enrolled: true, totalPrice: 4500 }, '2026-10': { enrolled: true } }, note: i % 5 ? '' : 'Bel ağrısı var 🙂' });
    for (let i = 0; i < 1110; i++) st.lessons.push({ id: rnd(8), date: '2026-' + String(7 + Math.floor(i / 370)).padStart(2, '0') + '-' + String(1 + i % 28).padStart(2, '0'), note: '', size: 1 + i % 3, time: String(8 + i % 12).padStart(2, '0') + ':00', status: i % 7 ? 'completed' : 'planned', groupId: '', memberIds: [st.members[i % 190].id], durationMin: 45, instructorId: 'p5cxj21z', packageMonth: '2026-0' + (7 + Math.floor(i / 370)), packageOwnerId: st.members[i % 190].id, isLastOfPackage: false, packageOwnerType: 'member', excludedMemberIds: [], instructorRateOverride: null });
    for (let i = 0; i < 280; i++) st.payments.push({ id: rnd(8), memberId: st.members[i % 190].id, groupId: '', date: '2026-09-' + String(1 + i % 28).padStart(2, '0'), packageMonth: '2026-09', pkgName: 'BIREYSEL', sessions: 8, amount: 4500 + (i % 5) * 250, listPrice: 4500, method: i % 2 ? 'IBAN' : 'Nakit', note: '' });
    for (let i = 0; i < 205; i++) st.expenses.push({ id: rnd(8), date: '2026-09-' + String(1 + i % 28).padStart(2, '0'), category: 'Market/Yemek', amount: Math.round(Math.random() * 500000) / 100, note: 'MOKA U /YANDEX GO ' + rnd(5), accountId: 'e2k5o0yh', scope: 'hane', source: 'card-import', fingerprint: rnd(8) + '|' + i });
    const raw = JSON.stringify(st);
    localStorage.clear(); localStorage.setItem('pilateria', raw);
    const t0 = performance.now(); const z = __plzCompress(raw); const tc = performance.now() - t0; const t1 = performance.now(); const ok = __plzDecompress(z) === raw; const td = performance.now() - t1;
    for (let i = 1; i <= 5; i++) __pilPreCloudRing(raw.replace('"members"', '"members' + i + '"'));
    __pilDailySnapshot();
    state = JSON.parse(raw); __undoStack = []; __undoPrevRows = null; __undoSnapshot('deneme');
    __pilBackupSet('pilateria_pre_pull_backup', JSON.stringify({ at: new Date().toISOString(), state: raw }));
    const keys = []; let total = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); const v = localStorage.getItem(k) || ''; keys.push(k + ':' + v.length); total += v.length; }
    const packed = ['pilateria_pre_cloud_1', 'pilateria_pre_cloud_5', 'pilateria_pre_cloud_backup', 'pilateria_undo', 'pilateria_pre_pull_backup'].concat(Object.keys(localStorage).filter(k => k.indexOf('pilateria_daily_') === 0)).map(k => k + ':' + __plzIsPacked(localStorage.getItem(k)));
    const ringBack = JSON.parse(__pilBackupGet('pilateria_pre_cloud_5')).state === raw.replace('"members"', '"members5"');
    return { rawLen: raw.length, zLen: z.length, tc, td, ok, total, keys, packed, ringBack, live: localStorage.getItem('pilateria') === raw };
  });
  console.log('raw', r.rawLen, 'packed', r.zLen, '(' + (r.zLen / r.rawLen * 100).toFixed(1) + '%)', 'compress', r.tc.toFixed(0), 'ms decompress', r.td.toFixed(0), 'ms');
  t('gidiş-dönüş birebir, canlı anahtar ham', r.ok && r.live);
  t('halka ×5 + tek slot + günlük + undo + pre_pull hepsi paketli', r.packed.every(x => x.endsWith('true')), r.packed.join(','));
  t('toplam yerel depo < ham × 1,6 (eskiden ≈ ham × 9)', r.total < r.rawLen * 1.6, r.total + ' / ' + r.rawLen + ' | ' + r.keys.join(' '));
  t('halka slotu çözülünce birebir', r.ringBack);
  // recover.html aynı origin: paketli yedekleri listeler
  await p.goto('http://127.0.0.1:8765/recover.html', { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const rec = await p.evaluate(() => { try { renderLocal(); } catch (e) { return { err: String(e) }; } const cards = [...document.querySelectorAll('#local-list .card')]; return { n: cards.length, txt: cards.map(c => c.textContent.replace(/\s+/g, ' ').slice(0, 90)) }; });
  t('recover.html: canlı + 5 halka + tek slot + günlük + pre_pull = 9 yedek listelendi (üye/ders sayılarıyla)', rec.n === 9 && rec.txt.every(x => /190.*üye/.test(x) || /üye/.test(x)), JSON.stringify(rec).slice(0, 400));
  t('sayfa hatası yok', errs.length === 0, JSON.stringify(errs).slice(0, 300));
  console.log('\nSONUC: ' + pass + ' gecti, ' + fail + ' kaldi');
  await b.close(); process.exit(fail ? 1 : 0);
})();
