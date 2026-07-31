# -*- coding: utf-8 -*-
# v138 — TAM SIGORTA MODU (Kerem 2026-07-31): hoca/ay bazli, istege bagli.
# Hoca tam sigorta isterse: IBAN'a TAM bordro maasi yatar (tamSaat x saatlik ucret, varsayilan
# 225 saat -> 124.78 ile 28.075,50), SGK tam ay uzerinden odenir. Studyonun ustlendigi maliyet
# GERCEK ders saati kadardir; fark (maas farki + SGK farki) HOCANIN BORCU olur, elden geri alinir.
# MUHASEBE TUTARLILIGI:
#  - Bol-Ode (tam): IBAN +tam bordro, (hakedis>tam ise Nakit +fazlasi), maas farki NEGATIF nakit
#    kaydiyla geri alinir -> payout TOPLAMI = HAKEDIS (rozet ve reel net kar dogru kalir).
#  - SGK Gidere Yaz: TAM prim Vergi/SGK yazilir (resmi defterde tam gorunmeli — bordro tam!),
#    fark NEGATIF 'Diger' kaydiyla (resmi degil) dusulur -> reel net SGK maliyeti = GERCEK saat.
#  - Resmi defter (v137): bordroIban IBAN payout'lardan tam bordroyu, Vergi/SGK tam primi gorur. Dogru.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) motor: tam sigorta dali ----------
rep("""  const saat = e.lessons.length;
  const w = +state.settings.sgkHourlyWage || 0;
  const c = +state.settings.sgkHourlyCost || 0;
  const hakedis = Math.round(e.total * 100) / 100;
  let iban = Math.round(saat * w * 100) / 100;
  if (iban > hakedis) iban = hakedis; // bordro hakedisi ASAMAZ
  const sgk = Math.round(saat * c * 100) / 100;
  const nakit = Math.max(0, Math.round((hakedis - iban) * 100) / 100);
  return { saat: saat, iban: iban, sgk: sgk, nakit: nakit, hakedis: hakedis, aktif: w > 0 };
}""",
"""  const saat = e.lessons.length;
  const w = +state.settings.sgkHourlyWage || 0;
  const c = +state.settings.sgkHourlyCost || 0;
  const hakedis = Math.round(e.total * 100) / 100;
  const instX = state.instructors.find(function(i){ return i.id === instructorId; });
  const tam = !!(w > 0 && instX && instX.sgkTam && instX.sgkTam[yyyymm]); // v138: hoca/ay bazli TAM SIGORTA
  const tamSaat = +state.settings.sgkFullMonthHours || 225;
  const sgkReal = Math.round(saat * c * 100) / 100;
  let iban, sgk, maasFark = 0, sgkFark = 0;
  if (tam) {
    // v138 Kerem: IBAN'a TAM bordro (hakedisle KIRPILMAZ); SGK tam ay. Stüdyonun ustlendigi
    // maliyet GERCEK saat kadar; fark (maas + SGK) hocanin borcu — elden geri alinir.
    iban = Math.round(tamSaat * w * 100) / 100;
    sgk = Math.round(tamSaat * c * 100) / 100;
    maasFark = Math.max(0, Math.round((iban - hakedis) * 100) / 100);
    sgkFark = Math.max(0, Math.round((sgk - sgkReal) * 100) / 100);
  } else {
    iban = Math.round(saat * w * 100) / 100;
    if (iban > hakedis) iban = hakedis; // bordro hakedisi ASAMAZ
    sgk = sgkReal;
  }
  const nakit = Math.max(0, Math.round((hakedis - iban) * 100) / 100);
  return { saat: saat, iban: iban, sgk: sgk, nakit: nakit, hakedis: hakedis, aktif: w > 0,
           tam: tam, tamSaat: tamSaat, sgkReal: sgkReal, sgkFark: sgkFark, maasFark: maasFark,
           borc: Math.round((maasFark + sgkFark) * 100) / 100 };
}
// v138: hoca/ay bazli tam sigorta anahtari (instructors kaydinda tasinir, senkron olur)
function toggleSgkTam(instructorId, yyyymm) {
  const inst = state.instructors.find(function(i){ return i.id === instructorId; });
  if (!inst) return;
  inst.sgkTam = inst.sgkTam || {};
  if (inst.sgkTam[yyyymm]) {
    delete inst.sgkTam[yyyymm];
    if (window.plToast) plToast('🛡️ Tam sigorta KAPANDI — ' + yyyymm);
  } else {
    const w = +state.settings.sgkHourlyWage || 0;
    if (!(w > 0)) { alert('Önce Ayarlar > Bordro: Asgari Saatlik Ücret alanını doldur.'); return; }
    const tamSaat = +state.settings.sgkFullMonthHours || 225;
    if (!confirm(inst.name + ' — ' + yyyymm + ': TAM SİGORTA açılsın mı?\\n\\nİBAN bordrosu ' + tamSaat + ' saat × ' + money(w) + ' ₺ = ' + money(Math.round(tamSaat * w * 100) / 100) + ' ₺ olur; SGK tam ay üzerinden ödenir; gerçek saatle aradaki fark hocanın borcu olarak gösterilir.')) return;
    inst.sgkTam[yyyymm] = true;
    if (window.plToast) plToast('🛡️ Tam sigorta AÇIK — ' + yyyymm);
  }
  save(); renderSalaries();
}""")

# ---------- 2) Bol-Ode: tam sigorta dali ----------
rep("""  const parc = yyyymm.split('-').map(Number);
  const paid = (state.instructorPayouts||[])""",
"""  const parc = yyyymm.split('-').map(Number);
  if (pr.tam) { // v138: tam sigorta — IBAN tam bordro, maas farki hocadan elden geri (negatif kayit)
    const oncekiT = (state.instructorPayouts||[]).filter(function(p){ return p.instructorId===instructorId && p.year===parc[0] && p.month===parc[1]; });
    if (oncekiT.length) { alert('Bu ayda mevcut ödeme kaydı var — tam sigorta Böl-Öde için önce "Geri Al" ile temizle.'); return; }
    const instT = state.instructors.find(function(i){ return i.id===instructorId; });
    const msjT = (instT ? instT.name : 'Hoca') + ' — ' + yyyymm + ' (🛡️ TAM SİGORTA ' + pr.tamSaat + ' saat):\\n\\n' +
      '🏦 İBAN (tam bordro): ' + money(pr.iban) + ' ₺\\n' +
      (pr.nakit > 0 ? '💵 Nakit (elden): ' + money(pr.nakit) + ' ₺\\n' : '') +
      (pr.maasFark > 0 ? '↩️ Hocadan elden GERİ: ' + money(pr.maasFark) + ' ₺ (maaş farkı — negatif kayıt)\\n' : '') +
      (pr.sgkFark > 0 ? '\\n⚠️ SGK farkı ' + money(pr.sgkFark) + ' ₺ de hocanın borcudur — "SGK Gidere Yaz" tahsil kaydını otomatik oluşturur.\\n' : '') +
      '\\nKayıtlar yazılacak. Onaylıyor musun?';
    if (!confirm(msjT)) return;
    if (!Array.isArray(state.instructorPayouts)) state.instructorPayouts = [];
    const gunT = todayISO();
    state.instructorPayouts.push({ id: uid(), instructorId: instructorId, year: parc[0], month: parc[1], amount: pr.iban, paidDate: gunT, method: 'IBAN', note: 'bordro (tam sigorta ' + pr.tamSaat + ' saat)' });
    if (pr.nakit > 0) state.instructorPayouts.push({ id: uid(), instructorId: instructorId, year: parc[0], month: parc[1], amount: pr.nakit, paidDate: gunT, method: 'Nakit', note: 'elden' });
    if (pr.maasFark > 0) state.instructorPayouts.push({ id: uid(), instructorId: instructorId, year: parc[0], month: parc[1], amount: -pr.maasFark, paidDate: gunT, method: 'Nakit', note: 'tam sigorta maaş farkı — hocadan elden geri alındı' });
    const mdlT = document.getElementById('modal-inst-pay'); if (mdlT) mdlT.remove();
    save(); renderSalaries();
    if (window.plToast) plToast('🛡️ Tam sigorta kayıtları yazıldı');
    return;
  }
  const paid = (state.instructorPayouts||[])""")

# ---------- 3) SGK Gidere Yaz: tam prim + fark tahsil kaydi ----------
rep("""  const isaret = 'SGK-OTO-' + yyyymm;
  if (state.expenses.find(function(e){ return e && e.note && e.note.indexOf(isaret) !== -1; })) { alert('Bu ayın SGK gideri zaten yazılmış (Ödemeler > Giderler).'); return; }
  if (!confirm(`${yyyymm} hoca SGK primi ${money(sgkTot)} ₺ gider olarak kaydedilecek (Vergi/SGK). Onaylıyor musun?`)) return;
  state.expenses.push({ id: uid(), date: yyyymm + '-28', category: 'Vergi/SGK', amount: sgkTot, note: 'Hoca SGK primi [' + isaret + ']' });""",
"""  const isaret = 'SGK-OTO-' + yyyymm;
  if (state.expenses.find(function(e){ return e && e.note && e.note.indexOf(isaret) !== -1; })) { alert('Bu ayın SGK gideri zaten yazılmış (Ödemeler > Giderler).'); return; }
  const farkTot = Math.round(state.instructors.reduce(function(a, i) { return a + (instructorPayrollForMonth(i.id, yyyymm).sgkFark || 0); }, 0) * 100) / 100; // v138: tam sigorta farki
  if (!confirm(`${yyyymm} hoca SGK primi ${money(sgkTot)} ₺ gider olarak kaydedilecek (Vergi/SGK).${farkTot > 0 ? ' Bunun ' + money(farkTot) + ' ₺ kadarı tam sigorta farkı — hocalardan elden tahsil kaydı da yazılacak (net maliyet gerçek saat kadar kalır).' : ''} Onaylıyor musun?`)) return;
  state.expenses.push({ id: uid(), date: yyyymm + '-28', category: 'Vergi/SGK', amount: sgkTot, note: 'Hoca SGK primi [' + isaret + ']' });
  if (farkTot > 0 && !state.expenses.find(function(e){ return e && e.note && e.note.indexOf('[SGKFARK-OTO-' + yyyymm + ']') !== -1; })) {
    state.expenses.push({ id: uid(), date: yyyymm + '-28', category: 'Diğer', amount: -farkTot, resmi: false, kdvRate: 0, note: 'Tam sigorta SGK farkı — hocalardan elden tahsil [SGKFARK-OTO-' + yyyymm + ']' });
  }""")

# ---------- 4) hoca satiri: 🛡️ dugmesi + tam rozet + borc satiri ----------
rep("""🧾 Gidere Yaz</button>`; })()}</td>""",
"""🧾 Gidere Yaz</button>`; })()}${__pr134.aktif ? ` <button class="btn small ${__pr134.tam ? 'ok' : 'secondary'}" onclick="toggleSgkTam('${inst.id}','${m}')" title="Tam sigorta: İBAN'a tam bordro (${__pr134.tamSaat} saat × saatlik ücret), SGK tam ay; gerçek saatle fark hocanın borcu olur">${__pr134.tam ? '🛡️ TAM ✓' : '🛡️'}</button>` : ''}</td>""")

rep("""${__pr134.aktif && total > 0 ? `<br><small style="color:var(--muted);">🏦 ${money(__pr134.iban)} · 💵 ${money(__pr134.nakit)} · ${__pr134.saat} sa${(+state.settings.sgkHourlyCost > 0) ? ' · SGK ' + money(__pr134.sgk) : ''}</small>` : ''}</td>""",
"""${__pr134.aktif && total > 0 ? `<br><small style="color:var(--muted);">${__pr134.tam ? '🛡️ TAM · ' : ''}🏦 ${money(__pr134.iban)} · 💵 ${money(__pr134.nakit)} · ${__pr134.saat} sa${(+state.settings.sgkHourlyCost > 0) ? ' · SGK ' + money(__pr134.sgk) : ''}</small>` : ''}${__pr134.tam && __pr134.borc > 0 ? `<br><small style="color:var(--bad);">↩️ hoca borcu ${money(__pr134.borc)} ₺ (maaş ${money(__pr134.maasFark)} + SGK ${money(__pr134.sgkFark)})</small>` : ''}</td>""")

# ---------- 5) ay seridi: geri alinacak toplami ----------
rep("""<button class="btn small secondary" style="margin-top:4px;" onclick="addSgkExpenseForMonth('${m}')">Gidere Yaz</button></div>""",
"""<button class="btn small secondary" style="margin-top:4px;" onclick="addSgkExpenseForMonth('${m}')">Gidere Yaz</button></div>
        ${(function(){ const b = Math.round(state.instructors.reduce(function(a,i){ return a + (instructorPayrollForMonth(i.id, m).borc || 0); }, 0) * 100) / 100; return b > 0 ? `<div class="stat warn"><div class="label">↩️ Hocalardan Geri Alınacak</div><div class="value">${money(b)} ₺</div><div style="font-size:10px;color:var(--muted);">tam sigorta farkı (elden)</div></div>` : ''; })()}""")

# ---------- 6) odeme modali seridi: tam bilgisi + borc ----------
rep("""🏦 Bordro (İBAN): <b>${money(pr.iban)} ₺</b> (${pr.saat} sa)""",
"""${pr.tam ? `🛡️ <b>TAM SİGORTA</b> (${pr.tamSaat} sa) · ` : ''}🏦 Bordro (İBAN): <b>${money(pr.iban)} ₺</b> (${pr.saat} sa)""")

rep("""İBAN + Nakit olarak kaydet</button></div>""",
"""İBAN + Nakit olarak kaydet</button>${pr.tam && pr.borc > 0 ? `<br><span style="color:var(--bad);font-size:12px;">↩️ hoca borcu: <b>${money(pr.borc)} ₺</b> (maaş farkı ${money(pr.maasFark)} + SGK farkı ${money(pr.sgkFark)}) — elden geri alınır</span>` : ''}</div>""")

# ---------- 7) Ayarlar: tam sigorta ayl覺k saat ----------
rep("""        <input type="number" id="set-sgk-cost" min="0" step="0.01" placeholder="örn. muhasebecinden al">
      </div>""",
"""        <input type="number" id="set-sgk-cost" min="0" step="0.01" placeholder="örn. muhasebecinden al">
      </div>
      <div class="field">
        <label>Tam Sigorta Aylık Saat <small style="color:var(--muted);font-weight:400;">— SGK tam ay kabulü (varsayılan 225); tam bordro = bu saat × saatlik ücret</small></label>
        <input type="number" id="set-sgk-fullhours" min="1" step="0.5">
      </div>""")

rep("""  const __sc134 = document.getElementById('set-sgk-cost'); if (__sc134) __sc134.value = s.sgkHourlyCost ?? '';""",
"""  const __sc134 = document.getElementById('set-sgk-cost'); if (__sc134) __sc134.value = s.sgkHourlyCost ?? '';
  const __sf138 = document.getElementById('set-sgk-fullhours'); if (__sf138) __sf138.value = s.sgkFullMonthHours ?? 225;""")

rep("""  state.settings.sgkHourlyCost = +((document.getElementById('set-sgk-cost')||{}).value) || 0; // v134""",
"""  state.settings.sgkHourlyCost = +((document.getElementById('set-sgk-cost')||{}).value) || 0; // v134
  state.settings.sgkFullMonthHours = +((document.getElementById('set-sgk-fullhours')||{}).value) || 225; // v138""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.31.60">', '<meta name="app-version" content="2026.07.31.61">')
rep("const APP_VERSION = '2026.07.31.60';", "const APP_VERSION = '2026.07.31.61';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v137-2026-07-31-60';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v138-2026-07-31-61';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
