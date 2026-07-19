#!/usr/bin/env python3
# v55 (Kerem): Grup dersi "Dersi Duzenle" (modal-group-lesson) penceresine KATILAN UYE SECIMI ekle.
# Boylece her derste hangi uyelerin oldugu tikla-secilir; isaretsiz birakilan uye o dersten cikar ve
# v54 excludedMemberIds ile OTOMATIK geri gelmez. Gec katilani, katildigi dersten itibaren isaretlemek kolay.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# 1) HTML: hoca alani + fields-grid kapanisindan sonra, gl-warning'den once uye listesi bloku
html_old = (
    "      <label>Hoca<select id=\"gl-instructor\"></select></label>\n"
    "    </div>\n"
    "    <div id=\"gl-warning\" class=\"warning\" style=\"color:var(--bad);min-height:18px;font-size:13px;margin:6px 0;\"></div>\n"
)
html_new = (
    "      <label>Hoca<select id=\"gl-instructor\"></select></label>\n"
    "    </div>\n"
    "    <div style=\"margin-top:10px;\">\n"
    "      <div style=\"font-weight:600;font-size:13px;\">Katılan Üyeler (<span id=\"gl-member-count\">0</span>)</div>\n"
    "      <div style=\"font-size:11px;color:var(--muted);margin:2px 0 6px;\">İşaretsiz bıraktığın üye bu dersten çıkar ve otomatik geri eklenmez. Sonradan katılanı, katıldığı dersten itibaren işaretle.</div>\n"
    "      <div id=\"gl-members\" style=\"max-height:190px;overflow:auto;border:1px solid #eee;border-radius:8px;padding:8px;\"></div>\n"
    "    </div>\n"
    "    <div id=\"gl-warning\" class=\"warning\" style=\"color:var(--bad);min-height:18px;font-size:13px;margin:6px 0;\"></div>\n"
)
rep(html_old, html_new, 1, "gl-members-html")

# 2) JS: render fonksiyonlari — openGroupLessonModal tanimindan hemen once
funcs = (
    "function __groupLessonRoster(l) {\n"
    "  const g = state.groups.find(x => x.id === l.groupId);\n"
    "  if (!g) return { g: null, roster: [] };\n"
    "  const pm = l.packageMonth || (l.date || '').slice(0, 7);\n"
    "  const roster = resolveGroupMembersForMonth(g, pm).filter(mid => {\n"
    "    const mm = state.members.find(x => x.id === mid);\n"
    "    return mm && !isMemberInactiveInMonth(mm, pm) && isMemberEnrolledInMonth(mid, pm);\n"
    "  });\n"
    "  return { g, roster, pm };\n"
    "}\n"
    "function updateGroupLessonMemberCount() {\n"
    "  const el = document.getElementById('gl-member-count');\n"
    "  if (el) el.textContent = document.querySelectorAll('#gl-members input.gl-mc:checked').length;\n"
    "}\n"
    "function renderGroupLessonMembers(l) {\n"
    "  const host = document.getElementById('gl-members'); if (!host) return;\n"
    "  const { g, roster } = __groupLessonRoster(l);\n"
    "  if (!g) { host.innerHTML = ''; return; }\n"
    "  const present = new Set(l.memberIds || []);\n"
    "  const ids = roster.slice();\n"
    "  (l.memberIds || []).forEach(mid => { if (!ids.includes(mid)) ids.push(mid); });\n"
    "  if (!ids.length) { host.innerHTML = '<div style=\"font-size:12px;color:var(--muted);\">Grubun bu ay kadrosu boş.</div>'; updateGroupLessonMemberCount(); return; }\n"
    "  host.innerHTML = ids.map(mid => {\n"
    "    const m = state.members.find(x => x.id === mid);\n"
    "    const nm = m ? (m.name || mid) : mid;\n"
    "    const checked = present.has(mid);\n"
    "    const outside = !roster.includes(mid);\n"
    "    return `<label style=\"display:flex;align-items:center;gap:8px;padding:3px 0;cursor:pointer;font-weight:normal;\">`\n"
    "      + `<input type=\"checkbox\" class=\"gl-mc\" value=\"${mid}\" ${checked ? 'checked' : ''} style=\"width:auto\" onchange=\"updateGroupLessonMemberCount()\">`\n"
    "      + `<span>${escapeHtml(nm)}</span>${outside ? ' <span class=\"badge warn\" style=\"font-size:10px;\">kadro dışı</span>' : ''}</label>`;\n"
    "  }).join('');\n"
    "  updateGroupLessonMemberCount();\n"
    "}\n"
)
rep("function openGroupLessonModal(lessonId) {",
    funcs + "function openGroupLessonModal(lessonId) {",
    1, "gl-render-funcs")

# 3) openGroupLessonModal: uye listesini doldur
rep("  document.getElementById('gl-warning').textContent = '';\n  openModal('modal-group-lesson');",
    "  document.getElementById('gl-warning').textContent = '';\n  renderGroupLessonMembers(l);\n  openModal('modal-group-lesson');",
    1, "gl-open-render")

# 4) saveGroupLesson: isaretli uyeleri oku
rep("  const instructorId = document.getElementById('gl-instructor').value;\n  const l = state.lessons.find(x=>x.id===id); if (!l) return;",
    "  const instructorId = document.getElementById('gl-instructor').value;\n  const checkedM = [...document.querySelectorAll('#gl-members input.gl-mc:checked')].map(x => x.value);\n  const l = state.lessons.find(x=>x.id===id); if (!l) return;",
    1, "gl-save-read")

# 5) kapasite ihtiyaci = isaretli uye sayisi
rep("  const __need = (l.memberIds||[]).length || 1;",
    "  const __need = checkedM.length;",
    1, "gl-save-need")

# 6) kaydetmeden once memberIds + excludedMemberIds uygula
rep("  l.instructorId = instructorId;\n  save();\n  closeModal('modal-group-lesson');",
    "  l.instructorId = instructorId;\n"
    "  // v55/v54: elle secilen uyeler = ders kadrosu; isaretsiz kadro uyesi excludedMemberIds'e (geri gelmez)\n"
    "  { const __glr = __groupLessonRoster(l);\n"
    "    if (__glr.g) { const __chk = new Set(checkedM); l.excludedMemberIds = __glr.roster.filter(mid => !__chk.has(mid)); }\n"
    "    l.memberIds = checkedM;\n"
    "    if (__glr.g && +__glr.g.size) l.size = +__glr.g.size; }\n"
    "  save();\n  closeModal('modal-group-lesson');",
    1, "gl-save-apply")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s.count("renderGroupLessonMembers") == 2, "renderGroupLessonMembers beklenen 2, bulunan %d" % s.count("renderGroupLessonMembers")
assert s.count("id=\"gl-members\"") == 1 and s.count("__groupLessonRoster") == 3
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v55 uygulandi. renderGroupLessonMembers=%d __groupLessonRoster=%d fark=%d bayt" % (
    s.count("renderGroupLessonMembers"), s.count("__groupLessonRoster"), len(s)-len(o)))
