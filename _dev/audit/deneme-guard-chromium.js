// DENEME KOPYASI KALKAN DENETİMİ (Kerem 03.11: "yapacağın güncellemeleri önce bir kopya alıp orada deneyeceksin ki yayında ki
// uygulamayı etkilemesin"). Gerçek Chromium: aynı kökende gerçek uygulamanın verisi (localStorage) varken deneme.html açılır,
// üye/ders/ödeme eklenir, yeniden yüklenir. Beklenen: gerçek localStorage BAYT BAYT aynı · dış ağa (Supabase vb.) TEK istek yok ·
// deneme verisi kopyadan gelir ve yalnız sessionStorage'da · bant görünür.
// Çalıştırma: NODE_PATH=/opt/node-tools/node_modules node _dev/audit/deneme-guard-chromium.js http://127.0.0.1:8765
const { chromium } = require('playwright');
const BASE = (process.argv[2] || 'http://127.0.0.1:8765').replace(/\/$/, '');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let pass = 0, fail = 0; const t = (n, c, x) => { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  for (const vp of [{ width: 390, height: 844, isMobile: true, hasTouch: true }, { width: 1280, height: 900 }]) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
    const ext = []; ctx.on('request', r => { const u = r.url(); if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) ext.push(u.slice(0, 80)); });
    const p = await ctx.newPage(); p.on('dialog', d => d.accept());
    // gerçek uygulamanın verisi (aynı köken) — sahte ama gerçek şekilde
    await p.goto(BASE + '/sw.js');
    await p.evaluate(() => {
      const cm = new Date().toISOString().slice(0, 7);
      const st = { members: [{ id: 'm1', name: 'AYLA DENEME', joinDate: '2026-01-01', packages: [], monthly: { [cm]: { enrolled: true } }, totalPrice: 6500 }], groups: [], lessons: [{ id: 'l1', groupId: '', memberIds: ['m1'], date: cm + '-02', time: '10:00', status: 'completed', packageMonth: cm, instructorId: 'h1', size: 1 }],
        payments: [{ id: 'p1', memberId: 'm1', groupId: '', date: cm + '-02', packageMonth: cm, amount: 6500, method: 'Nakit' }], packageTypes: [{ id: 'p8', name: '8 Ders', sessions: 8, price: 6500 }], instructors: [{ id: 'h1', name: 'HOCA', shareRate: 30 }], settings: { reformers: 10 } };
      localStorage.clear();
      localStorage.setItem('pilateria', JSON.stringify(st));
      localStorage.setItem('sb-nvbnmhaxumrfsxdzrzzj-auth-token', '{"sahte":"giris"}');
      localStorage.setItem('pilateria_sync', '{"sahte":"senkron"}');
      localStorage.setItem('pilateria_daily_2026-11-01', 'YEDEK');
    });
    const before = await p.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
    await p.goto(BASE + '/deneme.html'); await p.waitForTimeout(2500);
    const tag = '[' + vp.width + '] ';
    t(tag + 'DENEME bandı görünüyor', await p.evaluate(() => { const e = document.getElementById('deneme-band'); return !!e && e.offsetHeight > 0 && /DENEME KOPYASI/.test(e.textContent); }));
    t(tag + 'sürüm "-deneme"', /-deneme$/.test(await p.evaluate(() => APP_VERSION)));
    t(tag + 'veri kopyadan geldi (AYLA DENEME görünüyor)', await p.evaluate(() => state.members.some(m => m.name === 'AYLA DENEME')));
    t(tag + 'bulut kapalı (SUPABASE_MODE false, senkron yok)', await p.evaluate(() => SUPABASE_MODE === false && syncConfigured() === false));
    // değişiklikler: yeni üye + ders + ödeme + kayıt
    await p.evaluate(() => {
      try { sbHideAuth(); } catch(e) {} document.body.classList.remove('pl-authlock');
      const cm = currentMonth();
      state.members.push({ id: 'dn1', name: 'YENI DENEME UYE', joinDate: cm + '-01', packages: [], monthly: { [cm]: { enrolled: true } } });
      state.lessons.push({ id: 'dl1', groupId: '', memberIds: ['dn1'], date: cm + '-20', time: '12:00', status: 'planned', packageMonth: cm, instructorId: 'h1', size: 1 });
      state.payments.push({ id: 'dp1', memberId: 'dn1', groupId: '', date: cm + '-20', packageMonth: cm, amount: 1000, method: 'Nakit' });
      state.members[0].name = 'AYLA DEGISTI';
      save(); try { pushToCloud(true); } catch(e) {} try { fetch('https://nvbnmhaxumrfsxdzrzzj.supabase.co/rest/v1/x').catch(function(){}); } catch(e) {}
    });
    await p.waitForTimeout(800);
    await p.reload(); await p.waitForTimeout(2200);
    t(tag + 'yeniden yüklemede deneme değişiklikleri DENEMEDE duruyor', await p.evaluate(() => state.members.some(m => m.name === 'YENI DENEME UYE') && state.members.some(m => m.name === 'AYLA DEGISTI')));
    const ssKeys = await p.evaluate(() => Object.keys(sessionStorage).filter(k => k.indexOf('deneme:') === 0).length);
    t(tag + 'deneme verisi yalnız sessionStorage\'da (deneme: önekiyle)', ssKeys > 0, ssKeys);
    const after = await p.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
    t(tag + 'GERÇEK uygulamanın deposu BAYT BAYT AYNI (veri, giriş, senkron, yedek)', after === before, after.slice(0, 300));
    t(tag + 'dış ağa (Supabase vb.) ÇIKAN istek YOK', ext.filter(u => !/^chrome|^about/.test(u)).length === 0, JSON.stringify(ext.slice(0, 5)));
    t(tag + 'deneme sayfası service worker KAYDETMEDİ', (await p.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)) === 0);
    await ctx.close();
  }
  await b.close();
  console.log('SONUC: ' + pass + '/' + (pass + fail));
  process.exit(fail ? 1 : 0);
})();
