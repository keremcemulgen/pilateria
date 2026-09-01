# -*- coding: utf-8 -*-
# v164 — Kerem (2026-09-01, ekran goruntuleri): Pasif Uyeler sayfasinda "Agustos 2026'dan beri
# pasif" gorunen uyeler, grup penceresindeki uye listesinde ROZETSIZ cikiyordu.
# KOK NEDEN: uc pasiflik kavrami var (eski global m.archived / arsiv donemi archivePeriods / aylik
# enrolled:false). Seciciler yalniz eski m.archived bayragina bakiyordu; ay-bazli pasifler (Kerem'in
# "aydan cikar" ile pasife aldiklari) gorunmuyordu.
# v164 KURALI: TEK KAYNAK memberPassiveInMonth(m, ay) = katilmis (joinDate <= ay) VE o ay kayitli
# degil (isMemberEnrolledInMonth false) — ucunu de kapsar. Rozeti basan her yer bunu kullanir:
# grup penceresi uye listesi (+ "pasifleri goster" suzgeci), bos slot doldurma, ders modali arama
# listesi, uye detayi basligi.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# 1) yardimci (passiveNavListForMonth'un hemen onune)
rep("""function passiveNavListForMonth(ay) {
  const a = ay || currentMonth();""",
"""// v164 (Kerem): "PASIF" ROZETI TEK KAYNAK — o ay katilmis ama kayitli olmayan uye (eski archived
// bayragi, arsiv donemi ve aylik enrolled:false hepsi). Henuz katilmamis (joinDate ileri) pasif DEGILDIR.
function memberPassiveInMonth(m, ay) {
  if (!m) return false;
  const a = ay || currentMonth();
  if (m.joinDate && String(m.joinDate).slice(0, 7) > a) return false;
  return !isMemberEnrolledInMonth(m.id, a);
}
function passiveNavListForMonth(ay) {
  const a = ay || currentMonth();""")

# 2) grup penceresi uye listesi
rep("""  const rows = sortedMembers.map(m => {
    const eng = memberIsEngaged(m.id, currentGroupId);
    const checked = selected.includes(m.id);
    if (!showAll && eng && !checked) return null;
    if (!showArchived && m.archived && !checked) return null;""",
"""  const __ctxAyMg = (typeof window.__groupEditCtxMonth === 'string' && window.__groupEditCtxMonth) || __groupOpsCtxMonth(); // v164: rozet ay-bazli
  const rows = sortedMembers.map(m => {
    const eng = memberIsEngaged(m.id, currentGroupId);
    const checked = selected.includes(m.id);
    const __pasifMg = memberPassiveInMonth(m, __ctxAyMg); // v164
    if (!showAll && eng && !checked) return null;
    if (!showArchived && __pasifMg && !checked) return null;""")

rep("""    const archBadge = m.archived ? '<span class="archived-badge">Pasif</span>' : '';
    const rateVal = memberRates[m.id];
    const rateInputVisible = checked;
    return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;${eng||m.archived?'opacity:.85;':''}">""",
"""    const archBadge = __pasifMg ? '<span class="archived-badge">Pasif</span>' : ''; // v164: ay-bazli
    const rateVal = memberRates[m.id];
    const rateInputVisible = checked;
    return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;${eng||__pasifMg?'opacity:.85;':''}">""")

# 3) bos slot doldurma listesi
rep("""    ? available.map(m => { const __pasif = !!m.archived; return `<button class="btn secondary\"""",
"""    ? available.map(m => { const __pasif = memberPassiveInMonth(m, __ctxAy); /* v164: ay-bazli */ return `<button class="btn secondary\"""")

# 4) uye detayi basligi
rep("""  document.getElementById('md-name').innerHTML = escapeHtml(m.name||'') + ` <span style="font-size:13px;color:var(--muted);font-weight:500;">— ${ctxAy}</span>` + (m.archived ? ' <span class="archived-badge">Pasif</span>' : '');""",
"""  document.getElementById('md-name').innerHTML = escapeHtml(m.name||'') + ` <span style="font-size:13px;color:var(--muted);font-weight:500;">— ${ctxAy}</span>` + (memberPassiveInMonth(m, ctxAy) ? ' <span class="archived-badge">Pasif</span>' : ''); // v164: ay-bazli""")

# 5) ders modali arama/kadro listesi
rep("""${m.archived?'<span class="archived-badge">Pasif</span>':''} ${m.instructorId?'<span class="instructor-pill">'+instructorName(m.instructorId)+'</span>':''}""",
"""${memberPassiveInMonth(m, __badgeMonth)?'<span class="archived-badge">Pasif</span>':''} ${m.instructorId?'<span class="instructor-pill">'+instructorName(m.instructorId)+'</span>':''}""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.01.86">', '<meta name="app-version" content="2026.09.01.87">')
rep("const APP_VERSION = '2026.09.01.86';", "const APP_VERSION = '2026.09.01.87';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v163-2026-09-01-86';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v164-2026-09-01-87';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
