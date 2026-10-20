// v210 — GERİ AL ÜYE DENETİMİ (Chromium, GERÇEK TIKLAMA): Üyeler › "+ Yeni Üye" → Kaydet → "↩️ Geri Al" düğmesi yeni üyeyi
// gösterir → tıkla → üye kalkar; üye detayı › "🗑 Pasife Al" → "pay kaydı" sorusu cevaplanır → TEK "↩️ Geri Al" → üye geri aktif,
// pay da kalkar. Telefon (390) + masaüstü (1366); sayfa hatası yok.
// Kullanım: NODE_PATH=/opt/node-tools/node_modules node _dev/audit/undo-member-chromium.js http://127.0.0.1:8765/pilateria.html
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
const FX = () => {
  sbHideAuth(); document.body.classList.remove('pl-authlock', 'pl-staff-view');
  window.__msgs = []; window.alert = function(m){ window.__msgs.push(String(m)); }; window.confirm = function(m){ window.__msgs.push(String(m)); return true; };
  window.__PL_DLG_AUTO__ = (o) => { window.__msgs.push(String((o && o.msg) || '')); return (o && o.input) ? String(o.input.value) : true; };
  const CM = currentMonth();
  state.packageTypes = [{ id: 'p8', name: '8 Ders', sessions: 8, price: 4500 }];
  state.instructors = [{ id: 'h1', name: 'HOCA BİR', shareRate: 30 }];
  state.members = [
    { id: 'u1', name: 'DERYA DENEME', joinDate: '2026-01-01', defaultPackageId: 'p8', totalPrice: 4500, packages: [], monthly: { [CM]: { enrolled: true } } },
    { id: 'u2', name: 'KEREM DENEME', joinDate: '2026-01-01', defaultPackageId: 'p8', totalPrice: 4500, packages: [], monthly: { [CM]: { enrolled: true } } }
  ];
  state.groups = [{ id: 'g1', name: 'DERYA DENEME - KEREM DENEME', size: 2, memberIds: ['u1', 'u2'], defaultInstructorId: 'h1', defaultPackageId: 'p8', packages: [], monthlyMembers: { [CM]: ['u1', 'u2'] }, monthlyNotes: {} }];
  state.lessons = [{ id: 'L1', date: CM + '-02', time: '10:00', status: 'completed', groupId: 'g1', memberIds: ['u1', 'u2'], instructorId: 'h1', packageMonth: CM }];
  state.payments = [];
  __undoStack = []; __undoExt = {}; __undoPrevRows = null; try { localStorage.removeItem('pilateria_undo'); } catch(e) {}
  save(); switchPage('members'); renderMembers(); renderUndoBtn(); window.scrollTo(0, 0);
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let ok = 0, fail = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  for (const [vname, vp] of [['telefon', { width: 390, height: 844 }], ['masaustu', { width: 1366, height: 900 }]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200); await p.evaluate(FX); await p.waitForTimeout(300);
    const undoBtn = p.locator('#page-members .undo-btn');
    // 1) + Yeni Üye → Kaydet
    await p.locator('#page-members button', { hasText: '+ Yeni Üye' }).first().click();
    await p.waitForTimeout(200);
    await p.fill('#mm-name', 'TIKLA YENI');
    await p.locator('#modal-member button', { hasText: 'Kaydet' }).first().click();
    await p.waitForTimeout(300);
    t(vname + ': yeni üye eklendi', await p.evaluate(() => state.members.some(m => m.name === 'TIKLA YENI')));
    const lbl = (await undoBtn.textContent()) || '';
    t(vname + ': Geri Al düğmesi görünür ve yeni üyeyi söyler', (await undoBtn.isVisible()) && /Yeni üye: TIKLA YENI/.test(lbl), lbl);
    await undoBtn.click(); await p.waitForTimeout(300);
    t(vname + ': Geri Al tıklandı → yeni üye kalktı', await p.evaluate(() => !state.members.some(m => m.name === 'TIKLA YENI')));
    t(vname + ': yığın boş → düğme gizli', !(await undoBtn.isVisible()));
    // 2) üye detayı → 🗑 Pasife Al (o ay derse girmiş: pay sorusu) → tek Geri Al
    await p.evaluate(() => openMemberDetail('u1', currentMonth())); await p.waitForTimeout(250);
    await p.locator('#modal-member-detail button', { hasText: 'Pasife Al' }).first().click();
    await p.waitForTimeout(400);
    const st = await p.evaluate(() => ({ en: isMemberEnrolledInMonth('u1', currentMonth()), pay: !!partialShareFor('g1', 'u1', currentMonth()), n: __undoStack.length, lbl: (__undoStack[__undoStack.length - 1] || {}).label || '' }));
    t(vname + ': pasife alındı + pay kaydı soruldu/kaydedildi, TEK Geri Al adımı', st.en === false && st.pay === true && st.n === 1 && /ayından çıkar \+ Pay kaydı/.test(st.lbl), JSON.stringify(st));
    await p.evaluate(() => { try { closeModal('modal-member-detail'); } catch(e) {} switchPage('members'); });
    await p.waitForTimeout(200);
    await undoBtn.click(); await p.waitForTimeout(300);
    const st2 = await p.evaluate(() => ({ en: isMemberEnrolledInMonth('u1', currentMonth()), pay: !!partialShareFor('g1', 'u1', currentMonth()), n: __undoStack.length }));
    t(vname + ': tek Geri Al → üye yeniden aktif, pay kalktı', st2.en === true && st2.pay === false && st2.n === 0, JSON.stringify(st2));
    t(vname + ': sayfa hatası yok', errs.length === 0, JSON.stringify(errs).slice(0, 300));
    await ctx.close();
  }
  console.log('SONUC: ' + ok + '/' + (ok + fail));
  await b.close(); process.exit(fail ? 1 : 0);
})();
