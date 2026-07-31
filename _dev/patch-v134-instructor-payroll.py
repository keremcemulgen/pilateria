# -*- coding: utf-8 -*-
# v134 — HOCA BORDROSU (Kerem): "belli kismi IBAN'dan belli kismi nakit; derslere gore asgari ucret
# uzerinden saatlik SGK ve saatlik ucret hesaplanip o kisim IBAN'dan, kalan nakit elden."
#
# Tasarim:
#  - Ayarlar: sgkHourlyWage (asgari saatlik ucret, IBAN/bordro esasi) + sgkHourlyCost (saatlik SGK).
#    Asgari ucret DEGISKENDIR — uygulama sabitlemez; degerleri Kerem muhasebecisinden alip girer.
#  - Saat, HAKEDIS MOTORUYLA AYNI derslerden (lessonHappened: yapildi+yandi) — v41 kanonu DEGISMEZ.
#  - iban = saat x ucret (hakedisi asarsa hakedise kirpilir) · sgk = saat x maliyet · nakit = hakedis - iban.
#  - Hocalar sayfasi: hoca basina bolusum satiri + ay toplami seridi + "Gidere Yaz" (SGK, mukerrer korumali,
#    Vergi/SGK kategorisi — net kara otomatik girer cunku gider) + tek dokunusla IBAN+Nakit CIFT kayit.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) Ayarlar HTML ----------
rep("""        <input type="number" id="set-instructor-share" min="0" max="100" step="1">
      </div>
""",
"""        <input type="number" id="set-instructor-share" min="0" max="100" step="1">
      </div>
      <div class="field">
        <label>Bordro: Asgari Saatlik Ücret (₺) <small style="color:var(--muted);font-weight:400;">— hocaya İBAN'dan yatan saatlik tutar; asgari ücret değişince güncelle (0 = bordro hesabı kapalı)</small></label>
        <input type="number" id="set-sgk-wage" min="0" step="0.01" placeholder="örn. muhasebecinden al">
      </div>
      <div class="field">
        <label>Saatlik SGK Maliyeti (₺) <small style="color:var(--muted);font-weight:400;">— saat başına devlete ödenen prim; Hocalar sayfasından tek tuşla Gidere yazılır</small></label>
        <input type="number" id="set-sgk-cost" min="0" step="0.01" placeholder="örn. muhasebecinden al">
      </div>
""")

# ---------- 2) renderSettings doldurma ----------
rep("""  document.getElementById('set-instructor-share').value = s.instructorShareRate ?? 30;
""",
"""  document.getElementById('set-instructor-share').value = s.instructorShareRate ?? 30;
  const __sw134 = document.getElementById('set-sgk-wage'); if (__sw134) __sw134.value = s.sgkHourlyWage ?? '';
  const __sc134 = document.getElementById('set-sgk-cost'); if (__sc134) __sc134.value = s.sgkHourlyCost ?? '';
""")

# ---------- 3) saveSettings ----------
rep("""  state.settings.instructorShareRate = +document.getElementById('set-instructor-share').value || 30;
""",
"""  state.settings.instructorShareRate = +document.getElementById('set-instructor-share').value || 30;
  state.settings.sgkHourlyWage = +((document.getElementById('set-sgk-wage')||{}).value) || 0; // v134
  state.settings.sgkHourlyCost = +((document.getElementById('set-sgk-cost')||{}).value) || 0; // v134
""")

# ---------- 4) bordro motoru + bol-ode + SGK gideri ----------
rep("""function renderSalaries() {
""",
"""// ===== v134: HOCA BORDROSU — IBAN/nakit bolusumu (saat, hakedis motoruyla AYNI derslerden) =====
function instructorPayrollForMonth(instructorId, yyyymm) {
  const e = instructorEarningsForMonth(instructorId, yyyymm);
  const saat = Math.round(e.lessons.reduce(function(a, l) { return a + ((+l.durationMin || +state.settings.lessonDuration || 60) / 60); }, 0) * 100) / 100;
  const w = +state.settings.sgkHourlyWage || 0;
  const c = +state.settings.sgkHourlyCost || 0;
  const hakedis = Math.round(e.total * 100) / 100;
  let iban = Math.round(saat * w * 100) / 100;
  if (iban > hakedis) iban = hakedis; // bordro hakedisi ASAMAZ
  const sgk = Math.round(saat * c * 100) / 100;
  const nakit = Math.max(0, Math.round((hakedis - iban) * 100) / 100);
  return { saat: saat, iban: iban, sgk: sgk, nakit: nakit, hakedis: hakedis, aktif: w > 0 };
}
// Tek dokunusla IKI kayit: IBAN (bordro) + Nakit (elden). Onceki odemeler IBAN kismini kapatmis sayilir.
function payInstructorSplit(instructorId, yyyymm) {
  const pr = instructorPayrollForMonth(instructorId, yyyymm);
  const parc = yyyymm.split('-').map(Number);
  const paid = (state.instructorPayouts||[]).filter(function(p){ return p.instructorId===instructorId && p.year===parc[0] && p.month===parc[1]; }).reduce(function(a,p){ return a+(+p.amount||0); },0);
  const kalanToplam = Math.max(0, Math.round((pr.hakedis - paid) * 100) / 100);
  if (kalanToplam <= 0) { alert('Bu ay için ödenecek kalan yok.'); return; }
  const ibanKalan = Math.max(0, Math.round((pr.iban - paid) * 100) / 100);
  const ibanPay = Math.min(ibanKalan, kalanToplam);
  const nakitPay = Math.max(0, Math.round((kalanToplam - ibanPay) * 100) / 100);
  const inst = state.instructors.find(function(i){ return i.id===instructorId; });
  if (!confirm(`${inst ? inst.name : 'Hoca'} — ${yyyymm}:\\n\\n🏦 İBAN (bordro): ${money(ibanPay)} ₺\\n💵 Nakit (elden): ${money(nakitPay)} ₺\\n\\nİki ödeme kaydı birden yazılacak. Onaylıyor musun?`)) return;
  if (!Array.isArray(state.instructorPayouts)) state.instructorPayouts = [];
  const gun = todayISO();
  if (ibanPay > 0) state.instructorPayouts.push({ id: uid(), instructorId: instructorId, year: parc[0], month: parc[1], amount: ibanPay, paidDate: gun, method: 'IBAN', note: 'bordro (saatlik ücret)' });
  if (nakitPay > 0) state.instructorPayouts.push({ id: uid(), instructorId: instructorId, year: parc[0], month: parc[1], amount: nakitPay, paidDate: gun, method: 'Nakit', note: 'elden' });
  const mdl = document.getElementById('modal-inst-pay'); if (mdl) mdl.remove();
  save(); renderSalaries();
  if (window.plToast) plToast('💸 İBAN + Nakit kayıtları yazıldı');
}
// SGK primini tek dokunusla GIDER yap (Vergi/SGK) — ayni ay icin mukerrer korumali; net kara otomatik girer.
function addSgkExpenseForMonth(yyyymm) {
  const tot = state.instructors.reduce(function(a, i) { return a + instructorPayrollForMonth(i.id, yyyymm).sgk; }, 0);
  const sgkTot = Math.round(tot * 100) / 100;
  if (sgkTot <= 0) { alert('Bu ay için hesaplanan SGK yok — Ayarlar > Saatlik SGK Maliyeti alanını doldur.'); return; }
  state.expenses = state.expenses || [];
  const isaret = 'SGK-OTO-' + yyyymm;
  if (state.expenses.find(function(e){ return e && e.note && e.note.indexOf(isaret) !== -1; })) { alert('Bu ayın SGK gideri zaten yazılmış (Ödemeler > Giderler).'); return; }
  if (!confirm(`${yyyymm} hoca SGK primi ${money(sgkTot)} ₺ gider olarak kaydedilecek (Vergi/SGK). Onaylıyor musun?`)) return;
  state.expenses.push({ id: uid(), date: yyyymm + '-28', category: 'Vergi/SGK', amount: sgkTot, note: 'Hoca SGK primi [' + isaret + ']' });
  save(); renderSalaries();
  try { __refreshUIInPlace(); } catch(e) {}
  if (window.plToast) plToast('SGK gidere yazıldı — net kâra işlendi');
}
function renderSalaries() {
""")

# ---------- 5) hoca satirinda bolusum + Bol-Ode dugmesi ----------
rep("""    const actionBtn = fullyPaid
      ? `<button class="btn small secondary" onclick="undoPayInstructorMonth('${inst.id}','${m}')">Geri Al</button>`
      : `<button class="btn small ok" onclick="payInstructor('${inst.id}','${m}',${total})" ${total<=0?'disabled':''}>${total>0?(paidSum>0?'💸 Kalanı Öde':'💸 Öde'):'—'}</button>`;
""",
"""    const __pr134 = instructorPayrollForMonth(inst.id, m); // v134
    const actionBtn = fullyPaid
      ? `<button class="btn small secondary" onclick="undoPayInstructorMonth('${inst.id}','${m}')">Geri Al</button>`
      : ((total > 0 && __pr134.aktif ? `<button class="btn small ok" onclick="payInstructorSplit('${inst.id}','${m}')" title="Bordro kısmı İBAN'dan, kalanı nakit — iki kayıt birden">🏦+💵 Böl-Öde</button> ` : '')
        + `<button class="btn small ${(total > 0 && __pr134.aktif) ? 'secondary' : 'ok'}" onclick="payInstructor('${inst.id}','${m}',${total})" ${total<=0?'disabled':''}>${total>0?(paidSum>0?'💸 Kalanı Öde':'💸 Öde'):'—'}</button>`);
""")

rep("""      <td><b>${money(total)} ₺</b></td>
      <td>${paidBadge}</td>
""",
"""      <td><b>${money(total)} ₺</b>${__pr134.aktif && total > 0 ? `<br><small style="color:var(--muted);">🏦 ${money(__pr134.iban)} · 💵 ${money(__pr134.nakit)} · ${__pr134.saat} sa${(+state.settings.sgkHourlyCost > 0) ? ' · SGK ' + money(__pr134.sgk) : ''}</small>` : ''}</td>
      <td>${paidBadge}</td>
""")

# ---------- 6) ay toplami seridi ----------
rep("""    <div class="grid-stats">
      <div class="stat blue"><div class="label">Aylık Toplam Hak Edilen</div><div class="value">${money(grandTotal)} ₺</div></div>
      <div class="stat ok"><div class="label">Ödenen</div><div class="value">${money(paidTotal)} ₺</div></div>
      <div class="stat warn"><div class="label">Kalan</div><div class="value">${money(pending)} ₺</div></div>
    </div>
""",
"""    <div class="grid-stats">
      <div class="stat blue"><div class="label">Aylık Toplam Hak Edilen</div><div class="value">${money(grandTotal)} ₺</div></div>
      <div class="stat ok"><div class="label">Ödenen</div><div class="value">${money(paidTotal)} ₺</div></div>
      <div class="stat warn"><div class="label">Kalan</div><div class="value">${money(pending)} ₺</div></div>
    </div>
    ${(function(){
      if (!(+state.settings.sgkHourlyWage > 0) && !(+state.settings.sgkHourlyCost > 0)) {
        return `<div style="font-size:12px;color:var(--muted);margin:6px 0;">💡 İBAN/nakit bölüşümü için Ayarlar'dan <b>asgari saatlik ücret</b> ve <b>saatlik SGK maliyeti</b> gir — bordro otomatik hesaplanır.</div>`;
      }
      const prT = state.instructors.reduce(function(acc, i){ const p = instructorPayrollForMonth(i.id, m); acc.iban += p.iban; acc.nakit += p.nakit; acc.sgk += p.sgk; acc.saat += p.saat; return acc; }, { iban:0, nakit:0, sgk:0, saat:0 });
      return `<div class="grid-stats" style="margin-top:8px;">
        <div class="stat blue"><div class="label">🏦 İBAN'a Yatacak (bordro)</div><div class="value">${money(Math.round(prT.iban*100)/100)} ₺</div><div style="font-size:10px;color:var(--muted);">${Math.round(prT.saat*100)/100} saat</div></div>
        <div class="stat warn"><div class="label">💵 Nakit (elden)</div><div class="value">${money(Math.round(prT.nakit*100)/100)} ₺</div></div>
        <div class="stat ok"><div class="label">SGK Primi</div><div class="value">${money(Math.round(prT.sgk*100)/100)} ₺</div><button class="btn small secondary" style="margin-top:4px;" onclick="addSgkExpenseForMonth('${m}')">Gidere Yaz</button></div>
      </div>`;
    })()}
""")

# ---------- 7) odeme modalinda bolusum + Bol-Ode ----------
rep("""    <div style="font-size:13px;margin:6px 0;padding:8px 10px;background:#F1F8FF;border-radius:8px;">Hakediş: <b>${money(amount)} ₺</b> · Ödenen: <b>${money(paidSoFar)} ₺</b> · Kalan: <b>${money(kalan)} ₺</b></div>
""",
"""    <div style="font-size:13px;margin:6px 0;padding:8px 10px;background:#F1F8FF;border-radius:8px;">Hakediş: <b>${money(amount)} ₺</b> · Ödenen: <b>${money(paidSoFar)} ₺</b> · Kalan: <b>${money(kalan)} ₺</b></div>
    ${(function(){ const pr = instructorPayrollForMonth(instructorId, yyyymm); return pr.aktif ? `<div style="font-size:12.5px;margin:6px 0;padding:8px 10px;background:#E8F5E9;border-radius:8px;">🏦 Bordro (İBAN): <b>${money(pr.iban)} ₺</b> (${pr.saat} sa) · 💵 Nakit: <b>${money(pr.nakit)} ₺</b>${(+state.settings.sgkHourlyCost > 0) ? ` · SGK: <b>${money(pr.sgk)} ₺</b>` : ''}<br><button class="btn small" style="margin-top:6px;" onclick="payInstructorSplit('${instructorId}','${yyyymm}')">🏦+💵 İBAN + Nakit olarak kaydet</button></div>` : ''; })()}
""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.30.56">', '<meta name="app-version" content="2026.07.30.57">')
rep("const APP_VERSION = '2026.07.30.56';", "const APP_VERSION = '2026.07.30.57';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v133-2026-07-30-56';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v134-2026-07-30-57';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
