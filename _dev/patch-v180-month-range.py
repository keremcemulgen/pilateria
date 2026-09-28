# -*- coding: utf-8 -*-
# v180 — AY LISTESI VERIYE GORE (Kerem 2026-09-28: "Haziran paketlerini neden goremiyorum, ay listesinde Haziran yok").
# KOK: Uyeler (-2..+3), Gruplar (-3..+3), Hocalar (-6..+3) ay secicileri BUGUNE gore SABIT pencereydi; zaman gectikce
# verisi olan eski aylar (Haziran paketleri) listeden dusuyordu — veri duruyor, ulasilamiyordu. Tek kaynak:
# monthOptionsHTML180(secili): en eski veri ayi (ders/odeme/paket/kadro/pay/uye-ay) → bugun+3; veri sonradan gelirse
# (bulut yuklemesi) liste yeniden kurulur, secim korunur. Veri yoksa eski pencere (-2..+3).
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep("""function ensureMemberMonthSelect() {
  const sel = document.getElementById('member-month');
  if (!sel || sel.options.length > 0) return;
  const now = new Date();
  const options = []; // v27: "Tüm dönemler" KALDIRILDI — her görünüm bir aya ait
  const __cmSel = currentMonth();
  for (let i=-2; i<=3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const v = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const l = d.toLocaleDateString('tr-TR', {month:'long', year:'numeric'});
    options.push(`<option value="${v}" ${i===0?'selected':''}>${l}</option>`);
  }
  sel.innerHTML = options.join('');
}""",
"""// ===== v180: AY LISTESI VERIYE GORE — TEK KAYNAK =====
// En eski veri ayi (ders/odeme paket ayi, grup/uye paketleri, kadro/pay anahtarlari, uye-ay kayitlari); en fazla 60 ay geri.
function __dataMonthMin180() {
  let mn = '';
  const chk = v => { v = String(v || '').slice(0, 7); if (/^\\d{4}-\\d{2}$/.test(v) && (!mn || v < mn)) mn = v; };
  (state.lessons || []).forEach(l => { if (l) chk(l.packageMonth || l.date); });
  (state.payments || []).forEach(p => { if (p) chk(p.packageMonth || p.date); });
  (state.groups || []).forEach(g => { if (!g) return; (g.packages || []).forEach(p => { if (p) chk(p.month); }); Object.keys(g.monthlyMembers || {}).forEach(chk); Object.keys(g.monthlyPartials || {}).forEach(chk); });
  (state.members || []).forEach(m => { if (!m) return; (m.packages || []).forEach(p => { if (p) chk(p.month); }); Object.keys(m.monthly || {}).forEach(chk); });
  return mn;
}
function __monthRange180() {
  const now = new Date();
  let start = new Date(now.getFullYear(), now.getMonth() - 2, 1); // veri yoksa eski pencere
  const mn = __dataMonthMin180();
  if (mn) { const p = mn.split('-').map(Number); const dmin = new Date(p[0], p[1] - 1, 1); const floor = new Date(now.getFullYear(), now.getMonth() - 60, 1); if (dmin < start) start = (dmin < floor ? floor : dmin); }
  const end = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  const out = [];
  for (let dt = new Date(start); dt <= end; dt.setMonth(dt.getMonth() + 1)) out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  return out;
}
function monthOptionsHTML180(selected) {
  const sel = selected || currentMonth();
  return __monthRange180().map(v => { const p = v.split('-').map(Number); const lbl = new Date(p[0], p[1] - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }); return `<option value="${v}" ${v === sel ? 'selected' : ''}>${lbl}</option>`; }).join('');
}
// <select>'i veri araligiyla kurar; aralik degistiyse (veri sonradan geldi) yeniden kurar, secimi korur
function __ensureMonthSelect180(sel) {
  if (!sel) return;
  const range = __monthRange180().join(',');
  if (sel.options.length > 0 && sel.dataset.range180 === range) return;
  const prev = sel.options.length > 0 ? sel.value : '';
  sel.innerHTML = monthOptionsHTML180(prev && range.split(',').includes(prev) ? prev : currentMonth());
  sel.dataset.range180 = range;
}
function ensureMemberMonthSelect() {
  __ensureMonthSelect180(document.getElementById('member-month')); // v180: veri araligi (v27: "Tüm dönemler" yok — her görünüm bir aya ait)
}""")

rep("""function ensureGroupMonthSelect() {
  const sel = document.getElementById('group-month');
  if (!sel || sel.options.length > 0) return;
  const now = new Date();
  const options = []; // v27: "Tüm aylar" kaldirildi
  const __cmSel2 = currentMonth();
  for (let i=-3; i<=3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const v = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const l = d.toLocaleDateString('tr-TR', {month:'long', year:'numeric'});
    options.push(`<option value="${v}" ${i===0?'selected':''}>${l}</option>`);
  }
  sel.innerHTML = options.join('');
}""",
"""function ensureGroupMonthSelect() {
  __ensureMonthSelect180(document.getElementById('group-month')); // v180: veri araligi (v27: "Tüm aylar" yok)
}""")

rep("""  const now = new Date();
  const monthOptions = []; // v27: "Tum aylar" kaldirildi — hakedis/dagilim hep ay bazli
  for (let i = -6; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const v = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const lbl = d.toLocaleDateString('tr-TR', {month:'long', year:'numeric'});
    monthOptions.push(`<option value="${v}" ${v===monthISO?'selected':''}>${lbl}</option>`);
  }""",
"""  const monthOptions = [monthOptionsHTML180(monthISO)]; // v180: veri araligi (v27: "Tum aylar" kaldirildi — hakedis/dagilim hep ay bazli)""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.09.28.102">', '<meta name="app-version" content="2026.09.28.103">')
rep("const APP_VERSION = '2026.09.28.102';", "const APP_VERSION = '2026.09.28.103';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v179-2026-09-28-102'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v180-2026-09-28-103'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
