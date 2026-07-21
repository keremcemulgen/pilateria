#!/usr/bin/env python3
# v64 (Kerem): Bireysel uye detayindaki "AY Dersleri" listesi SALT-OKUNURdu (grup detayinda satir-basi
# "Duzenle" vardi — openGroupLessonModal, v55'te uye secimi de eklendi; bireysel tarafta boyle satir-ici
# duzenleme HIC YOKTU, dersler takvimden aciliyordu). Simdi bireysel uye ders satirina da "Duzenle" eklendi:
# openLessonModal(id) = TAM ders editoru (tarih/saat/hoca/durum butonlari + icinde Sil) — takvimin kullandigi
# ayni, kanitli modal. Ayrica saveLesson/markLessonStatus/deleteLesson artik ACIK UYE DETAYINI tazeler
# (refreshMemberDetailIfOpen) — duzenleme aninda liste guncellenir. l.size guard: "undefined kisilik" bitti.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# 1) Uye detay ders listesi: Islem sutunu + Duzenle + size guard + baslik ipucu
rep(
    "    <details open><summary>${ctxAy} Dersleri (${lessons.length})</summary>\n"
    "      ${lessons.length ? '<div class=\"table-wrap\"><table class=\"sticky-head\"><thead class=\"sticky-thead\"><tr><th>Tarih</th><th>Saat</th><th>Hoca</th><th>Tip</th><th>Durum</th></tr></thead><tbody>' +\n"
    "        lessons.map(l=>`<tr><td>${fmtDate(l.date)}</td><td>${escapeHtml(l.time)}</td><td>${escapeHtml(instructorName(l.instructorId))}</td><td>${l.size} kişilik</td><td>${lessonStatusBadge(l.status||'planned')}</td></tr>`).join('') + '</tbody></table></div>' : '<div class=\"empty\">Ders kaydı yok.</div>'}\n"
    "    </details>",
    "    <details open><summary>${ctxAy} Dersleri (${lessons.length}) <span style=\"color:var(--muted);font-size:11px;font-weight:normal;\">— Düzenle ile tarih/saat/durum/hoca değiştir</span></summary>\n"
    "      ${lessons.length ? '<div class=\"table-wrap\"><table class=\"sticky-head\"><thead class=\"sticky-thead\"><tr><th>Tarih</th><th>Saat</th><th>Hoca</th><th>Tip</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>' +\n"
    "        lessons.map(l=>`<tr><td>${fmtDate(l.date)}</td><td>${escapeHtml(l.time)}</td><td>${escapeHtml(instructorName(l.instructorId))}</td><td>${(l.size||(l.memberIds||[]).length||1)} kişilik</td><td>${lessonStatusBadge(l.status||'planned')}</td><td><button class=\"btn small secondary\" onclick=\"openLessonModal('${l.id}')\" title=\"Dersi düzenle (tarih/saat/durum/hoca; içinde Sil de var)\">Düzenle</button></td></tr>`).join('') + '</tbody></table></div>' : '<div class=\"empty\">Ders kaydı yok.</div>'}\n"
    "    </details>",
    1, "member-lesson-edit-btn")

# 2) saveLesson: acik uye detayini da tazele
rep(
    "  if (typeof renderGroups === 'function') renderGroups();\n"
    "  refreshGroupDetailIfOpen();\n"
    "}",
    "  if (typeof renderGroups === 'function') renderGroups();\n"
    "  refreshGroupDetailIfOpen();\n"
    "  if (typeof refreshMemberDetailIfOpen === 'function') refreshMemberDetailIfOpen(); // v64: uye detayindan ders duzenlenince liste guncellensin\n"
    "}",
    1, "saveLesson-refresh-member")

# 3) markLessonStatus: durum degisince acik detaylar tazelensin
rep(
    "  renderCalendar(); renderDashboard();\n"
    "  // Update rights info display",
    "  renderCalendar(); renderDashboard();\n"
    "  if (typeof refreshGroupDetailIfOpen === 'function') refreshGroupDetailIfOpen();\n"
    "  if (typeof refreshMemberDetailIfOpen === 'function') refreshMemberDetailIfOpen(); // v64\n"
    "  // Update rights info display",
    1, "markStatus-refresh")

# 4) deleteLesson: silince acik detaylar tazelensin
rep(
    "  closeModal('modal-lesson');\n"
    "  renderCalendar(); renderDashboard();\n"
    "}",
    "  closeModal('modal-lesson');\n"
    "  renderCalendar(); renderDashboard();\n"
    "  if (typeof refreshGroupDetailIfOpen === 'function') refreshGroupDetailIfOpen();\n"
    "  if (typeof refreshMemberDetailIfOpen === 'function') refreshMemberDetailIfOpen(); // v64\n"
    "}",
    1, "deleteLesson-refresh")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v64 uygulandi. fark=%d bayt" % (len(s)-len(o)))
