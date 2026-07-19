#!/usr/bin/env python3
# v54a (Kerem): GRUP HOCA UCRETI = DERS-BAZLI AKTIF KADRO
# Kok: perLessonPriceForLesson grup dalinda taban = groupExpectedTotal(g,ay)/8 = O AYIN TUM kadrosunun
# fiyat toplami / 8 -> dersin O GUNKU kadrosundan bagimsiz, sabit. Gec katilan (2.paket/yeni uye) her derse
# yaziliyor + az-ders paketi /8 ile eksik hesaplaniyor.
# Fix (Kerem kararlari): (1) her uyenin 1-ders payi = kendi ay-fiyati / KENDI ders sayisi (sessionQuotaFor;
# eski sabit /8 degil). (2) grup dersi tabani = o derste BULUNAN (ve grubun o ayki kadrosundaki) uyelerin
# 1-ders paylari toplami. v49 emniyeti korunur: grup-disi sizan uye kadroda olmadigindan toplama katilmaz.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# 1) memberPerLessonPrice helper — PKG_LESSON_DIVISOR satirindan hemen sonra
anchor_div = "const PKG_LESSON_DIVISOR = 8;\n"
helper = anchor_div + (
    "function memberPerLessonPrice(memberId, monthISO) {\n"
    "  // v54: bir uyenin 1-ders parasal payi = ay-fiyati / KENDI ders sayisi (sessionQuotaFor; 8 varsayilan,\n"
    "  // gec-katilan/az-ders uye icin 5/7...). Grup+bireysel hoca ucreti tabaninda kullanilir.\n"
    "  const price = +memberMonthlyTotalPrice(memberId, monthISO) || 0;\n"
    "  if (!price) return 0;\n"
    "  let q;\n"
    "  try { q = +sessionQuotaFor('member', memberId, monthISO); } catch (e) { q = 0; }\n"
    "  if (!q || q < 1) q = PKG_LESSON_DIVISOR;\n"
    "  return price / q;\n"
    "}\n"
)
rep(anchor_div, helper, 1, "memberPerLessonPrice-helper")

# 2) perLessonPriceForLesson grup + bireysel dallarini yeniden yaz
old_block = (
    "    if (l.packageOwnerType === 'group') {\n"
    "      const g = state.groups.find(x => x.id === l.packageOwnerId);\n"
    "      if (g) {\n"
    "        const pkg = groupPackageForMonth(g, l.packageMonth);\n"
    "        // v41: grup ders ucreti = grubun O AYKI TOPLAM fiyati (uye fiyat toplami; stale paket kaydi DEGIL) / 8\n"
    "        const __gTot = (pkg && pkg.status === 'extended') ? 0 : (groupExpectedTotal(g, l.packageMonth) || (pkg ? (+pkg.price || 0) : 0));\n"
    "        return (+__gTot || 0) / PKG_LESSON_DIVISOR;\n"
    "      }\n"
    "    } else if (l.packageOwnerType === 'member') {\n"
    "      const m = state.members.find(x => x.id === l.packageOwnerId);\n"
    "      if (m) {\n"
    "        const pkg = memberPackageForMonth(m, l.packageMonth);\n"
    "        // v48 TEK KAYNAK + v41: bireysel ders ucreti = uyenin AY FIYATI / 8 (paket kac ders olursa olsun); uzadi ise 0\n"
    "        const __pp = (pkg && pkg.status === 'extended') ? 0 : (memberMonthlyTotalPrice(m.id, l.packageMonth) || (pkg ? (+pkg.price || 0) : 0));\n"
    "        return (+__pp || 0) / PKG_LESSON_DIVISOR;\n"
    "      }\n"
    "    }"
)
new_block = (
    "    if (l.packageOwnerType === 'group') {\n"
    "      const g = state.groups.find(x => x.id === l.packageOwnerId);\n"
    "      if (g) {\n"
    "        const pkg = groupPackageForMonth(g, l.packageMonth);\n"
    "        if (pkg && pkg.status === 'extended') return 0;\n"
    "        // v54 (Kerem): DERS-BAZLI taban = o derste BULUNAN (ve grubun o ayki kadrosundaki) uyelerin\n"
    "        // 1-ders paylari toplami. Her uye: ay-fiyati / kendi ders sayisi. 3 kisilik ders 3 uyeye,\n"
    "        // 4. uye katildiktan sonra 4 uyeye gore hesaplanir. v49 emniyeti: grup-disi sizan uye kadroda\n"
    "        // olmadigindan toplama KATILMAZ. memberIds bos/bayatsa eski kanona (grup toplami / 8) duser.\n"
    "        const __roster = new Set(resolveGroupMembersForMonth(g, l.packageMonth).filter(mid => {\n"
    "          const mm = state.members.find(x => x.id === mid);\n"
    "          return mm && !isMemberInactiveInMonth(mm, l.packageMonth) && isMemberEnrolledInMonth(mid, l.packageMonth);\n"
    "        }));\n"
    "        let __sum = 0, __n = 0;\n"
    "        (l.memberIds || []).forEach(mid => { if (__roster.has(mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth); __n++; } });\n"
    "        if (__n > 0) return __sum;\n"
    "        const __gTot = groupExpectedTotal(g, l.packageMonth) || (pkg ? (+pkg.price || 0) : 0);\n"
    "        return (+__gTot || 0) / PKG_LESSON_DIVISOR;\n"
    "      }\n"
    "    } else if (l.packageOwnerType === 'member') {\n"
    "      const m = state.members.find(x => x.id === l.packageOwnerId);\n"
    "      if (m) {\n"
    "        const pkg = memberPackageForMonth(m, l.packageMonth);\n"
    "        if (pkg && pkg.status === 'extended') return 0;\n"
    "        // v54: bireysel ders = uyenin AY FIYATI / KENDI ders sayisi (eski v41 sabit /8 yerine; Kerem karari).\n"
    "        const __pp = memberPerLessonPrice(m.id, l.packageMonth);\n"
    "        if (__pp > 0) return __pp;\n"
    "        return ((pkg ? (+pkg.price || 0) : 0)) / PKG_LESSON_DIVISOR;\n"
    "      }\n"
    "    }"
)
rep(old_block, new_block, 1, "perLessonPriceForLesson-rewrite")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s.count("memberPerLessonPrice") == 3, "memberPerLessonPrice beklenen 3 (1 tanim + 2 cagri), bulunan %d" % s.count("memberPerLessonPrice")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v54a uygulandi. memberPerLessonPrice=%d, fark=%d bayt" % (s.count("memberPerLessonPrice"), len(s)-len(o)))
