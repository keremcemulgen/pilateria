// v215 — KEREM'İN AKIŞLARI GERÇEK CHROMIUM'DA (telefon + masaüstü, gerçek tıklama). Üyeler sayfası BU AY'dayken:
// (A) Gruplar → GELECEK ay → grup kartı → Düzenle → "+ Yeni Üye" → Kaydet → grubu Kaydet
// (B) önce GEÇEN ayın grup detayı açılıp kapatılır → Gruplar → GELECEK ay → "+ Yeni Grup" → üyeleri seç → Kaydet
// Beklenen: ekleme YALNIZ gelecek aya; BU AY ve GEÇEN AY Üyeler satırları, kadrolar, kayıtlar AYNEN.
// v214'te FAIL: (A) yeni üye BU AY'a bireysel + borçlu yazılıyordu (üye penceresi grup detayının ayını görmüyordu);
// (B) yeni grup kapanmış detayın BAYAT ayına (geçen ay) kuruluyordu.
// Çalıştırma: NODE_PATH=/opt/node-tools/node_modules node _dev/audit/future-slot-215-chromium.js http://127.0.0.1:8765/pilateria.html
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/pilateria.html';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let pass = 0, fail = 0; const t = (n, c, x) => { if (c) { pass++; console.log('  OK ', n); } else { fail++; console.log('  FAIL', n, x !== undefined ? '-> ' + x : ''); } };
  async function fresh(vp) {
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
    const p = await ctx.newPage(); p.on('dialog', async d => { await d.accept(); });
    await p.goto(URL); await p.waitForTimeout(2000);
    const M = await p.evaluate(() => {
      try { sbHideAuth(); } catch(e) {} document.body.classList.remove('pl-authlock', 'pl-staff-view'); try { __sbRole = 'owner'; } catch(e) {}
      window.__PL_DLG_AUTO__ = (o) => (o && o.buttons && o.buttons.length) ? o.buttons[0].value : (o && o.input ? null : true);
      const CM = currentMonth(); const pp = CM.split('-').map(Number);
      const sh = (k) => { const d = new Date(pp[0], pp[1] - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
      const PV = sh(-1), NX = sh(1);
      state.packageTypes = [{ id: 'p8', name: '8 Ders', sessions: 8, price: 4500 }]; state.instructors = [{ id: 'h1', name: 'HOCA', shareRate: 30 }];
      const en = (a) => { const o = {}; a.forEach(x => o[x] = { enrolled: true }); return o; };
      const mk = (id, n, mo) => ({ id, name: n, joinDate: '2026-01-01', defaultPackageId: 'p8', totalPrice: 4500, instructorId: 'h1', packages: [], monthly: mo });
      state.members = [mk('C', 'CEMRE DENEME', en([PV, CM, NX])), mk('D', 'DUYGU DENEME', en([PV, CM, NX])), mk('A', 'AYLA DENEME', en([PV, CM])), mk('X', 'XENA DENEME', en([PV, CM]))];
      state.groups = [{ id: 'GB', name: 'CEMRE DENEME - DUYGU DENEME', size: 3, memberIds: ['C', 'D'], defaultInstructorId: 'h1', defaultPackageId: 'p8', defaultDays: [2, 4], defaultTime: '11:00', customTotalPrice: 9000,
        packages: [{ month: PV, startDate: PV + '-03', sessions: 8, price: 0, status: 'active' }, { month: CM, startDate: CM + '-03', sessions: 8, price: 0, status: 'active' }], monthlyMembers: { [PV]: ['C', 'D'], [CM]: ['C', 'D'] }, monthlyNotes: {} }];
      state.lessons = []; state.payments = [];
      switchPage('members'); const sel = document.getElementById('member-month'); sel.value = CM; renderMembers();
      return { CM, PV, NX };
    });
    return { ctx, p, M };
  }
  const SNAP = (p, months) => p.evaluate((ms) => JSON.stringify(ms.map(M => ({ M, rows: buildMemberRows(M).map(r => (r.name || '-') + ':' + (r.groupId || '') + ':' + r.totalPrice + ':' + r.remaining).sort(),
    gr: state.groups.map(g => g.id + '=' + activeGroupRosterForMonth(g, M).join(',')).filter(x => !/=$/.test(x)).sort() }))), months);
  const toGroupsMonth = (p, NX) => p.evaluate((NX) => { switchPage('groups'); const s = document.getElementById('group-month'); if (![...s.options].some(o => o.value === NX)) s.insertAdjacentHTML('beforeend', '<option value="' + NX + '">' + NX + '</option>'); s.value = NX; renderGroups(); }, NX);
  for (const vp of [{ width: 390, height: 844, isMobile: true, hasTouch: true }, { width: 1280, height: 900 }]) {
    { // (A)
      const { ctx, p, M } = await fresh(vp); const tag = '[A ' + vp.width + '] ';
      const before = await SNAP(p, [M.PV, M.CM]);
      await toGroupsMonth(p, M.NX); await p.waitForTimeout(300);
      const card = await p.$('#page-groups .card[onclick*="GB"]'); t(tag + 'Gruplar (' + M.NX + ') grup kartı', !!card); if (card) { await card.click(); await p.waitForTimeout(400); }
      const ed = await p.$('#modal-group-detail button:has-text("Düzenle")'); t(tag + 'grup detayında Düzenle', !!ed); if (ed) { await ed.click(); await p.waitForTimeout(400); }
      t(tag + 'Grubu Düzenle penceresi ' + M.NX + ' ayında', (await p.evaluate(() => window.__groupEditCtxMonth)) === M.NX, await p.evaluate(() => window.__groupEditCtxMonth));
      const nu = await p.$('#modal-group button:has-text("+ Yeni Üye")'); t(tag + '"+ Yeni Üye" düğmesi', !!nu); if (nu) { await nu.click(); await p.waitForTimeout(400); }
      t(tag + 'Yeni Üye penceresi başlığı ' + M.NX + ' ayını gösteriyor', /Yeni Üye/.test(await p.textContent('#mm-title')) && (await p.evaluate(() => window.__memberEditCtxMonth)) === M.NX, (await p.textContent('#mm-title')) + ' / ' + (await p.evaluate(() => window.__memberEditCtxMonth)));
      await p.fill('#mm-name', 'YENI UYE DENEME');
      await p.click('#modal-member button[onclick="saveMember()"]'); await p.waitForTimeout(500);
      await p.click('#modal-group button[onclick="saveGroup()"]'); await p.waitForTimeout(900);
      const after = await SNAP(p, [M.PV, M.CM]);
      t(tag + 'GEÇEN AY + BU AY (' + M.PV + ', ' + M.CM + ') Üyeler satırları ve kadrolar AYNEN', after === before, before + '\n      → ' + after);
      const ok = await p.evaluate((NX) => activeGroupRosterForMonth(state.groups.find(g => g.id === 'GB'), NX).some(id => (state.members.find(m => m.id === id) || {}).name === 'YENI UYE DENEME'), M.NX);
      t(tag + 'yeni üye ' + M.NX + ' kadrosunda', ok === true);
      await ctx.close();
    }
    { // (B)
      const { ctx, p, M } = await fresh(vp); const tag = '[B ' + vp.width + '] ';
      await p.evaluate((PV) => openGroupDetail('GB', PV), M.PV); await p.waitForTimeout(300);
      await p.click('#modal-group-detail button:has-text("Kapat")'); await p.waitForTimeout(300);
      const before = await SNAP(p, [M.PV, M.CM]);
      await toGroupsMonth(p, M.NX); await p.waitForTimeout(300);
      await p.click('#page-groups .toolbar button:has-text("+ Yeni Grup")'); await p.waitForTimeout(400);
      t(tag + 'Yeni Grup penceresi ' + M.NX + ' ayında (kapanmış ' + M.PV + ' detayı değil)', (await p.evaluate(() => window.__groupEditCtxMonth)) === M.NX, await p.evaluate(() => window.__groupEditCtxMonth));
      await p.evaluate(() => { document.getElementById('mg-size').value = '2'; renderGroupMembersCheckboxes(['A', 'X'], ''); });
      await p.click('#modal-group button[onclick="saveGroup()"]'); await p.waitForTimeout(900);
      const after = await SNAP(p, [M.PV, M.CM]);
      t(tag + 'GEÇEN AY + BU AY Üyeler satırları ve kadrolar AYNEN', after === before, before + '\n      → ' + after);
      const ok = await p.evaluate((NX) => state.groups.some(g => g.id !== 'GB' && ['A', 'X'].every(x => activeGroupRosterForMonth(g, NX).includes(x))), M.NX);
      t(tag + 'yeni grup ' + M.NX + ' ayında AYLA + XENA ile', ok === true);
      await ctx.close();
    }
  }
  await b.close();
  console.log('SONUC: ' + pass + '/' + (pass + fail));
  process.exit(fail ? 1 : 0);
})();
