#!/usr/bin/env python3
# v113 (Kerem: "kurtarma tarihe gore olsun; veri dun'den AZ olabilir, uye/odeme silebiliyorum"):
# TARIH KANONU — 'daha cok kayit = daha yeni' varsayimi YANLIS (silme mesru islemdir).
# 1) save(): gercek KULLANICI duzenlemesinde state._lastLocalEditAt damgalanir (senkron-uygulama yazimlari haric).
#    Bu alan buluta TASINMAZ (sbStateToRows yalniz listeleri+settings kopyalar) ve buluttan yuklemede sifirlanir
#    (sbRowsToState yeniden kurar) -> 'bulutla hizalandi, cihazda gonderilmemis duzenleme yok' anlamina gelir.
# 2) v103 'cihaz daha yeni' karari: ZAMANLA verilir — cihazin son YEREL duzenlemesi, bulutun son yaziminda
#    (_v damgalarinin en buyugu) 60 sn'den daha YENIYSE ve fark kaniti varsa sorulur. Bulut cihazdan sonra
#    yazilmissa (uye/odeme SILINMESI dahil) SESSIZCE bulut esas alinir. (Cevrimdisi duzenlemeler zaten v47
#    dirty akisiyla ayrica korunur — bu kontrol yalniz dirty-olmayan sapmalar icindir.)
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---- 1) save(): kullanici duzenleme damgasi ----
rep(
    "function save() {\n"
    "  try {\n"
    "    sanitizeStateText(state); // v21 GÜVENLİK: her kalici yazimdan once metinleri temizle",
    "function save() {\n"
    "  try {\n"
    "    // v113 TARIH KANONU: yalniz GERCEK kullanici duzenlemesi damgalanir (senkron-uygulama yazimi degil).\n"
    "    if (!window.__pilSuppressDirty && !__sbApplying) state._lastLocalEditAt = Date.now();\n"
    "    sanitizeStateText(state); // v21 GÜVENLİK: her kalici yazimdan once metinleri temizle",
    1, "save-stamp")

# ---- 2) v103 karari: ZAMAN + kanit ----
rep(
    "    const __cmIds = __idsOf(__cloudSt.members), __cpIds = __idsOf(__cloudSt.payments);\n"
    "    const __localNewer = __hasMissing(state.members, __cmIds) || __hasMissing(state.payments, __cpIds) || (__mx(state) > __mx(__cloudSt));",
    "    const __cmIds = __idsOf(__cloudSt.members), __cpIds = __idsOf(__cloudSt.payments);\n"
    "    // v113 (Kerem): TARIH KANONU — karar ICERIKLE degil ZAMANLA. Bulut, cihazin son yerel duzenlemesinden\n"
    "    // SONRA yazilmissa (uye/odeme silinmesi dahil) BULUT esastir, soru sorulmaz. Yalniz cihazda buluttan\n"
    "    // SONRAYA ait (gonderilmemis) duzenleme + fark kaniti varsa sorulur.\n"
    "    let __cloudMaxV = 0;\n"
    "    try { for (const __t in all) { const __tab = all[__t] || {}; for (const __rid in __tab) { const __dv = __tab[__rid] && __tab[__rid]._v; if (__dv && __dv > __cloudMaxV) __cloudMaxV = __dv; } } } catch(e) {}\n"
    "    const __tsNewer = (+state._lastLocalEditAt || 0) > (__cloudMaxV + 60000); // 60 sn cihaz-saati toleransi\n"
    "    const __evidence = __hasMissing(state.members, __cmIds) || __hasMissing(state.payments, __cpIds) || (__mx(state) > __mx(__cloudSt));\n"
    "    const __localNewer = __tsNewer && __evidence;",
    1, "v103-time-gate")

# ---- Surum ----
rep("2026.07.23.35", "2026.07.23.36", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v113 uygulandi. fark=%d bayt" % (len(s)-len(o)))
