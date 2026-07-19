#!/usr/bin/env python3
# v56 (Kerem): YAZILMAYAN (hic olusturulmamis) derslerin parasi ISLETMEYE kalir, hocaya degil.
#
# DAVRANIS ANALIZI (mevcut mimari):
# - Hoca maasi = instructorEarningsForMonth -> YALNIZ lessonHappened (completed/missed) dersler ders-ders toplanir.
#   YAZILMAMIS ders state.lessons'ta olmadigindan hesaba HIC girmez; PLANLI ders de kazandirmaz.
#   -> "yazilmayan dersin parasi isletmeye kalir" ZATEN mimari geregi dogru. Bu yama + yeni test bunu KILITLER.
# - "Son ders" (isLastOfPackage) yalniz takvim rozeti (isLastLessonOfPackage) - para hesabina girmez.
# - autoCompletePackages yalniz status='completed' yapar, pkg.sessions'a DOKUNMAZ; perLessonPriceForLesson
#   yalniz 'extended'da 0 verir -> paket tamamlaninca onceki derslerin birim fiyati DEGISMEZ (toplam/8 sabit).
#
# BU YAMANIN KAPATTIGI 2 SIZINTI YOLU (birim fiyati bozabilecek kenar durumlar):
# 1) createMemberPackage paket kaydinin sessions'ini HER ZAMAN packageTypes[0]'dan aliyordu (uyenin kendi
#    tanimina bakmadan). 5-derslik uyede (override=5) ders/odeme kaydi acilinca kayit sessions=8 olusuyordu.
#    FIX: sessions kaynagi = opts > uyenin o-ay override'i > uyenin (o-ay/default) paket tipi > tip[0] > 8.
#    Boylece paket kaydi = SATIN ALINAN hak. (Quota ve v54 para boleni zaten override-oncelikli; bu fix
#    kayit-fallback yolunu da tutarli yapar.)
# 2) perLessonPriceForLesson bireysel fallback (uye fiyati 0 + kayit fiyati varsa) sabit /8 boluyordu;
#    kayit 5-derslikse yanlis. FIX: /(kayit.sessions || 8).
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# 1) createMemberPackage: uyenin kendi paket tanimindan sessions
cm_old = (
    "function createMemberPackage(m, monthISO, startDate, opts) {\n"
    "  if (!m) return null;\n"
    "  opts = opts || {};\n"
    "  if (!m.packages) m.packages = [];\n"
    "  const exists = m.packages.find(p => p.month === monthISO);\n"
    "  if (exists) return exists;\n"
    "  const defaultPkg = (state.packageTypes||[])[0] || {sessions:8, price:7000};\n"
    "  const newPkg = {\n"
    "    month: monthISO,\n"
    "    startDate: startDate || (monthISO + '-01'),\n"
    "    sessions: opts.sessions || defaultPkg.sessions || 8,\n"
)
cm_new = (
    "function createMemberPackage(m, monthISO, startDate, opts) {\n"
    "  if (!m) return null;\n"
    "  opts = opts || {};\n"
    "  if (!m.packages) m.packages = [];\n"
    "  const exists = m.packages.find(p => p.month === monthISO);\n"
    "  if (exists) return exists;\n"
    "  // v56: kayit sessions'i = SATIN ALINAN hak — uyenin o-ay override'i > uyenin (o-ay/default) paket tipi > tip[0].\n"
    "  const __ownPkgId = (monthISO && m.monthly && m.monthly[monthISO] && m.monthly[monthISO].packageId) || m.defaultPackageId || '';\n"
    "  const __ownPkg = (state.packageTypes||[]).find(p => p.id === __ownPkgId) || null;\n"
    "  const defaultPkg = __ownPkg || (state.packageTypes||[])[0] || {sessions:8, price:7000};\n"
    "  let __ovS = null; try { __ovS = memberSessionsOverride(m.id, monthISO); } catch(e) {}\n"
    "  const newPkg = {\n"
    "    month: monthISO,\n"
    "    startDate: startDate || (monthISO + '-01'),\n"
    "    sessions: opts.sessions || __ovS || defaultPkg.sessions || 8,\n"
)
rep(cm_old, cm_new, 1, "createMemberPackage-sessions")

# 2) bireysel fallback: /8 sabit -> /(kayit sessions || 8)
rep("        return ((pkg ? (+pkg.price || 0) : 0)) / PKG_LESSON_DIVISOR;",
    "        return ((pkg ? (+pkg.price || 0) : 0)) / ((pkg && +pkg.sessions) || PKG_LESSON_DIVISOR);",
    1, "member-fallback-divisor")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s.count("__ownPkgId") == 2 and s.count("__ovS") == 3
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v56 uygulandi. fark=%d bayt" % (len(s)-len(o)))
