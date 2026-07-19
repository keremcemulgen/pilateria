#!/usr/bin/env python3
# v53 (Kerem): "yazarken her harften sonra tekrar tiklamak gerekiyor" — KOK FIX
# Kok neden: bir arama input'u, oninput'ta KENDI konteynerini innerHTML ile yeniden ciziyor
# -> input DOM dugumu her tusta yok edilip yeniden yaratiliyor -> focus + caret kayboluyor.
# Etkilenen 2 yer (tum uygulamada bu desendeki TEK iki yer):
#   - renderGroupMembersCheckboxes  (#mg-members / mg-member-search)  [grup olustur/duzenle modali]
#   - renderLessonMembersCheckboxes (#ml-members / ml-member-search)  [ders modali]
# Diger arama kutulari (member-search/group-search/archive-search) STATIK ve AYRI liste
# konteynerine yazdigindan focus kaybetmiyor -> dokunulmuyor.
# Cozum: swap oncesi odakli descendant input'u id ile yakalayip innerHTML sonrasi geri koyan
# genel yardimci setHTMLKeepFocus(el, html); iki fonksiyonu bundan gecir.
import io, sys

PATH = "pilateria.html"
with io.open(PATH, "r", encoding="utf-8") as f:
    src = f.read()
orig = src

def rep(s, old, new, n=1, label=""):
    c = s.count(old)
    assert c == n, "ANCHOR '%s' beklenen %d, bulunan %d" % (label, n, c)
    return s.replace(old, new)

# --- 1) Yardimci fonksiyonu renderGroupMembersCheckboxes tanimindan HEMEN ONCE ekle ---
helper = (
    "// v53 (Kerem): innerHTML ile yeniden cizilen konteynerdeki ODAKLI input, her tusta focus/caret\n"
    "// kaybediyordu (grup + ders modali uye-arama kutulari). Bu yardimci swap oncesi odakli descendant\n"
    "// input'u id ile yakalar, innerHTML'i uygular, sonra odagi + secim araligini geri koyar.\n"
    "function setHTMLKeepFocus(el, html){\n"
    "  var a = document.activeElement;\n"
    "  var keepId = (a && a.id && el.contains(a)) ? a.id : null;\n"
    "  var s = null, e = null;\n"
    "  if (keepId) { try { s = a.selectionStart; e = a.selectionEnd; } catch(_){} }\n"
    "  el.innerHTML = html;\n"
    "  if (keepId) {\n"
    "    var n = document.getElementById(keepId);\n"
    "    if (n) {\n"
    "      try { n.focus({preventScroll:true}); } catch(_){ try { n.focus(); } catch(__){} }\n"
    "      if (s != null) { try { n.setSelectionRange(s, e); } catch(_){} }\n"
    "    }\n"
    "  }\n"
    "}\n"
)
src = rep(
    src,
    "function renderGroupMembersCheckboxes(selected, currentGroupId) {",
    helper + "function renderGroupMembersCheckboxes(selected, currentGroupId) {",
    1, "helper-before-renderGroupMembersCheckboxes",
)

# --- 2) renderGroupMembersCheckboxes: mEl.innerHTML = ... -> setHTMLKeepFocus(mEl, ...) ---
g_old = (
    "  mEl.innerHTML = filterBar + (rows\n"
    "    ? rows\n"
    "    : '<div class=\"empty\" style=\"padding:20px;\">Uygun üye yok. <button type=\"button\" class=\"btn small\" onclick=\"quickAddMemberFromGroup(\\''+(currentGroupId||'')+'\\')\">+ Yeni Üye Oluştur</button></div>');"
)
g_new = (
    "  setHTMLKeepFocus(mEl, filterBar + (rows\n"
    "    ? rows\n"
    "    : '<div class=\"empty\" style=\"padding:20px;\">Uygun üye yok. <button type=\"button\" class=\"btn small\" onclick=\"quickAddMemberFromGroup(\\''+(currentGroupId||'')+'\\')\">+ Yeni Üye Oluştur</button></div>'));"
)
src = rep(src, g_old, g_new, 1, "group-members-innerHTML")

# --- 3) renderLessonMembersCheckboxes: temp var + helper cagrisi ---
l_old_start = "  mEl.innerHTML = searchBar + (sortedMembers.length ? sortedMembers.map(m => {"
l_new_start = "  const __mlKeepHTML = searchBar + (sortedMembers.length ? sortedMembers.map(m => {"
src = rep(src, l_old_start, l_new_start, 1, "lesson-members-innerHTML-start")

l_old_end = "  }).join('') : emptyMsg);"
l_new_end = "  }).join('') : emptyMsg);\n  setHTMLKeepFocus(mEl, __mlKeepHTML);"
src = rep(src, l_old_end, l_new_end, 1, "lesson-members-innerHTML-end")

# --- Butunluk kontrolleri ---
assert src.count("</script>") == 3, "</script> sayisi != 3 (%d)" % src.count("</script>")
assert src.count("init();") == 1, "init(); sayisi != 1 (%d)" % src.count("init();")
assert src.rstrip().endswith("</html>"), "dosya </html> ile bitmiyor"
assert src.count("setHTMLKeepFocus") == 3, "setHTMLKeepFocus beklenen 3 (1 tanim + 2 cagri), bulunan %d" % src.count("setHTMLKeepFocus")
assert src != orig, "degisiklik yok?!"

with io.open(PATH, "w", encoding="utf-8") as f:
    f.write(src)
print("OK patch v53 uygulandi. Fark: %d bayt. setHTMLKeepFocus=%d" % (len(src)-len(orig), src.count("setHTMLKeepFocus")))
