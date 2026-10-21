// v211 — PAKET PENCERESİ DENETİMİ (Chromium, GERÇEK TIKLAMA): Üyeler tablosu (masaüstü) + kartlar (telefon) + grup detayı + Ödeme Gecikmesi.
// Başlangıç = ayın paketinin İLK DERSİ; bitiş = 30 gün kuralı (soluk), paket bitince (yapılan + yanan = hak) o dersin tarihi ✓;
// önceki ayın paketi bu aya PLANLI dersle sarkıyorsa "⏳ <Ay> paketi sürüyor"; gerçekten dersi girilmemiş birim KIRMIZI "—".
// Başlangıç hücresine tıkla → elle tarih → "✎" → ↩️ Geri Al → ilk derse döner. Sayfa hatası yok.
// Kullanım: NODE_PATH=/opt/node-tools/node_modules node _dev/audit/pkg-window-chromium.js http://127.0.0.1:8765/pilateria.html
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
const FX = () => {
  sbHideAuth(); document.body.classList.remove('pl-authlock', 'pl-staff-view');
  window.__msgs = []; window.__ANS = null;
  window.alert = function(m){ window.__msgs.push(String(m)); }; window.confirm = function(m){ window.__msgs.push(String(m)); return true; };
  window.__PL_DLG_AUTO__ = (o) => { window.__msgs.push(String((o && o.msg) || '')); return (o && o.input) ? window.__ANS : true; };
  const CM = currentMonth();
  const PM = (function(){ const d = parseISO(CM + '-01'); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })();
  window.__CM = CM; window.__PM = PM;
  state.settings.groupPackageDays = 30;
  state.packageTypes = [{ id: 'p8', name: '8 Ders', sessions: 8, price: 4500 }];
  state.instructors = [{ id: 'h1', name: 'HOCA BİR', shareRate: 30 }];
  const mk = (id, name) => ({ id: id, name: name, joinDate: '2026-01-01', defaultPackageId: 'p8', totalPrice: 4500, packages: [], monthly: { [PM]: { enrolled: true }, [CM]: { enrolled: true } } });
  state.members = [mk('u1', 'AYLA DENEME'), mk('u2', 'BERNA DENEME'), mk('u3', 'CANSU DENEME'), mk('u4', 'DIDEM DENEME'), mk('u5', 'EBRU DENEME'), mk('u6', 'FIGEN DENEME')];
  const G = (id, name, ids) => ({ id: id, name: name, size: ids.length, memberIds: ids, defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [{ month: CM, startDate: CM + '-01', sessions: 8, price: 0, status: 'active' }], monthlyMembers: { [PM]: ids, [CM]: ids }, monthlyNotes: {} });
  state.groups = [G('g1', 'BERNA - CANSU', ['u2', 'u3']), G('g2', 'DIDEM - EBRU', ['u4', 'u5']), G('g3', 'FIGEN', ['u6'])];
  const L = (id, date, st, pm, own) => Object.assign({ id: id, date: date, time: '10:00', status: st, instructorId: 'h1', packageMonth: pm }, own);
  state.lessons = [
    L('A0', CM + '-02', 'cancelled', CM, { memberIds: ['u1'] }),
    L('A1', CM + '-03', 'completed', CM, { memberIds: ['u1'] }), L('A2', CM + '-06', 'planned', CM, { memberIds: ['u1'] }), L('A3', CM + '-08', 'planned', CM, { memberIds: ['u1'] })
  ];
  ['01', '02', '04', '06', '08', '09', '11', '13'].forEach((dd, i) => state.lessons.push(L('G1' + i, CM + '-' + dd, i === 3 ? 'missed' : 'completed', CM, { groupId: 'g1', memberIds: ['u2', 'u3'] })));
  ['20', '22', '24', '26', '27', '28'].forEach((dd, i) => state.lessons.push(L('G2' + i, PM + '-' + dd, 'completed', PM, { groupId: 'g2', memberIds: ['u4', 'u5'] })));
  ['22', '27'].forEach((dd, i) => state.lessons.push(L('G2x' + i, CM + '-' + dd, 'planned', PM, { groupId: 'g2', memberIds: ['u4', 'u5'] })));
  state.payments = [];
  __undoStack = []; __undoExt = {}; __undoPrevRows = null; try { localStorage.removeItem('pilateria_undo'); } catch(e) {}
  save(); switchPage('members'); renderMembers(); renderUndoBtn(); window.scrollTo(0, 0);
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let ok = 0, fail = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  for (const [vname, vp] of [['masaustu', { width: 1366, height: 900 }], ['telefon', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200); await p.evaluate(FX); await p.waitForTimeout(300);
    const E = await p.evaluate(() => ({
      CM: __CM, PM: __PM, pmLbl: pkgMonthLabel(__PM), cmLbl: pkgMonthLabel(__CM),
      a1s: fmtDate(__CM + '-03'), a1e: fmtDate(addDaysISO(__CM + '-03', 29)), g1s: fmtDate(__CM + '-01'), g1e: fmtDate(__CM + '-13'),
      g2last: fmtDate(__CM + '-27'), man: fmtDate(__CM + '-05'), needOv: todayISO() > __CM + '-03'
    }));
    const reddish = (c) => { const m = String(c || '').match(/rgba?\((\d+), (\d+), (\d+)/); return !!m && +m[1] > 150 && +m[2] < 120 && +m[3] < 120; };
    if (vname === 'masaustu') {
      const rowOf = (name) => p.locator('#members-table tbody tr', { has: p.locator('b', { hasText: new RegExp('^' + name + '$') }) }).first();
      const r1 = rowOf('AYLA DENEME');
      const r1t = (await r1.innerText()).replace(/\s+/g, ' ');
      t(vname + ': AYLA başlangıç = ilk ders ' + E.a1s + ' (iptal 02 sayılmaz), bitiş 30 gün ' + E.a1e, r1t.includes(E.a1s) && r1t.includes(E.a1e) && !r1t.includes(fmtDateNode(E.CM + '-02')), r1t);
      const r2t = (await rowOf('BERNA DENEME').innerText()).replace(/\s+/g, ' ');
      t(vname + ': BERNA (g1) ' + E.g1s + ' – ' + E.g1e + ' ✓ (8. ders = paket bitti; ayın 1\'i kayıt tarihi değil, ilk ders)', r2t.includes(E.g1s) && r2t.includes(E.g1e + ' ✓'), r2t);
      const r4 = rowOf('DIDEM DENEME'); const r4h = await r4.innerHTML();
      t(vname + ': DIDEM (g2) "⏳ ' + E.pmLbl + ' paketi sürüyor" soluk (kırmızı değil)', /pkg-prevrun/.test(r4h) && r4h.includes(E.pmLbl + ' paketi sürüyor') && !/pkg-nolesson/.test(r4h), r4h.slice(0, 300));
      const r6 = rowOf('FIGEN DENEME'); const r6h = await r6.innerHTML();
      const red = await r6.locator('.pkg-nolesson').evaluate(el => getComputedStyle(el).color).catch(() => '');
      t(vname + ': FIGEN (g3, hiç ders yok) KIRMIZI "—"', /pkg-nolesson/.test(r6h) && reddish(red), red + ' | ' + r6h.slice(0, 200));
      // başlangıç hücresine tıkla → elle tarih (05) → ✎ → Geri Al → ilk derse döner
      await p.evaluate(() => { window.__ANS = __CM + '-05'; });
      await r1.locator('td', { hasText: E.a1s }).first().click();
      await p.waitForTimeout(400);
      const r1b = (await rowOf('AYLA DENEME').innerText()).replace(/\s+/g, ' ');
      t(vname + ': hücreye tıklandı → elle ' + E.man + ' ✎', r1b.includes(E.man) && r1b.includes('✎'), r1b);
      const undoBtn = p.locator('#page-members .undo-btn');
      const ulbl = (await undoBtn.textContent()) || '';
      t(vname + ': Geri Al düğmesi "Paket başlangıcı: AYLA DENEME"', (await undoBtn.isVisible()) && /Paket başlangıcı: AYLA DENEME/.test(ulbl), ulbl);
      await undoBtn.click(); await p.waitForTimeout(400);
      const r1c = (await rowOf('AYLA DENEME').innerText()).replace(/\s+/g, ' ');
      t(vname + ': Geri Al → başlangıç yine ilk ders ' + E.a1s + ' (✎ yok)', r1c.includes(E.a1s) && !r1c.includes('✎'), r1c);
      // grup detayı kutusu
      await p.evaluate(() => openGroupDetail('g2', __CM)); await p.waitForTimeout(250);
      const gd2 = (await p.locator('#gd-content').innerText()).replace(/\s+/g, ' ');
      t(vname + ': g2 detayı "' + E.pmLbl + ' paketi sürüyor (son ders ' + E.g2last + ')"', gd2.includes(E.pmLbl + ' paketi sürüyor (son ders ' + E.g2last + ')') && gd2.includes(E.cmLbl + ' paketi ilk dersiyle başlar'), (gd2.match(/📦.{0,160}/) || [''])[0]);
      await p.evaluate(() => { closeModal('modal-group-detail'); openGroupDetail('g1', __CM); }); await p.waitForTimeout(250);
      const gd1 = (await p.locator('#gd-content').innerText()).replace(/\s+/g, ' ');
      t(vname + ': g1 detayı ' + E.g1s + ' – ' + E.g1e + ' · ✅ paket bitti (8/8 ders)', gd1.includes(E.g1s + ' – ' + E.g1e) && gd1.includes('paket bitti (8/8 ders)'), (gd1.match(/📦.{0,160}/) || [''])[0]);
      await p.evaluate(() => { closeModal('modal-group-detail'); switchPage('dashboard'); renderDashboard(); }); await p.waitForTimeout(300);
      const dash = await p.locator('#page-dashboard').innerHTML();
      const ovr = await p.evaluate(() => getOverduePayments().map(r => (r.groupId || r.memberId) + '@' + r.firstLessonDate).join(','));
      t(vname + ': Ödeme Gecikmesi vadesi = paket başlangıcı (AYLA ' + E.CM + '-03, g1 ' + E.CM + '-01, g2 ' + E.PM + ' paketi ' + E.PM + '-20; g2 Ekim / derssiz g3 vadesi yok)', !E.needOv || (ovr.includes('u1@' + E.CM + '-03') && ovr.includes('g1@' + E.CM + '-01') && ovr.includes('g2@' + E.PM + '-20') && !ovr.includes('g2@' + E.CM) && !/g3@/.test(ovr)), ovr);
      t(vname + ': Ödeme Gecikmesi tablosu sütunu "Paket Başlangıcı"', !E.needOv || /<th[^>]*>Paket Başlangıcı<\/th>/.test(dash), (dash.match(/<th[^>]*>(İlk Ders|Paket Başlangıcı)<\/th>/) || ['yok'])[0]);
    } else {
      const cards = p.locator('#members-cards');
      const ctext = (await cards.innerText()).replace(/\s+/g, ' ');
      t(vname + ': AYLA kartı "📅 ' + E.a1s + ' – ' + E.a1e + '"', ctext.includes('📅 ' + E.a1s + ' – ' + E.a1e), (ctext.match(/📅[^📅]{0,40}/g) || []).join(' | '));
      t(vname + ': g1 başlığı "📅 ' + E.g1s + ' – ' + E.g1e + ' ✓"', ctext.includes('📅 ' + E.g1s + ' – ' + E.g1e + ' ✓'), (ctext.match(/📅[^📅]{0,40}/g) || []).join(' | '));
      t(vname + ': g2 başlığı "⏳ ' + E.pmLbl + ' paketi sürüyor (son ders ' + E.g2last + ')"', ctext.includes('⏳ ' + E.pmLbl + ' paketi sürüyor (son ders ' + E.g2last + ')'), (ctext.match(/⏳[^⏳]{0,50}/g) || []).join(' | '));
      const nl = cards.locator('.mc-nolesson').first();
      const nlTxt = await nl.innerText().catch(() => ''); const nlCol = await nl.evaluate(el => getComputedStyle(el).color).catch(() => '');
      t(vname + ': g3 başlığı "📅 İlk ders girilmedi" kırmızı', /İlk ders girilmedi/.test(nlTxt) && reddish(nlCol), nlTxt + ' | ' + nlCol);
      const vis = await nl.isVisible().catch(() => false);
      t(vname + ': kırmızı satır görünür (kart içinde)', vis);
    }
    t(vname + ': sayfa hatası yok', errs.length === 0, JSON.stringify(errs).slice(0, 300));
    await ctx.close();
  }
  console.log('SONUC: ' + ok + '/' + (ok + fail));
  await b.close(); process.exit(fail ? 1 : 0);
})();
function fmtDateNode(iso) { const [y, m, d] = iso.split('-'); return d + '.' + m + '.' + y; }
