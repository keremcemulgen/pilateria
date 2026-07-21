#!/usr/bin/env python3
# v103 (Kerem, VERI KURTARMA KALKANI — iPhone sabah verisi icin ACIL):
# Bulut DOLU + cihazda DAHA YENI veri varken uygulama acilirsa, eski akis bulutu cihazin ustune yazip
# (sessizce) yeni veriyi YOK EDIYORDU. v102 yalniz "bulut BOS" halini koruyordu; tersini korumuyordu.
# v103: NORMAL yukleme (bulut -> cihaz) cihazi EZMEDEN once:
#  (a) cihaz halini TEK SLOT yedekle: localStorage 'pilateria_pre_cloud_backup' = {at, state}
#      -> recover.html bu anahtari listeler; kaza olsa bile veri geri alinabilir.
#  (b) cihaz buluttan DAHA YENI gorunuyorsa (uye/ders/odeme SAYISI fazla veya odeme tarihi daha yeni)
#      plConfirm ile BIRLESTIRME teklif et -> Evet: sbMigrateLocal (upsert, SILME YOK). Red -> normal akis.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# 1) sbLoadAll: v65 bos-bulut guard'inin hemen ardina, v47 dirty blogundan ONCE v103 blogu
rep(
    "  // v47 VERI GUVENLIGI: yenilemeden once gonderilememis (dirty) yerel degisiklikler VARSA koru + gonder\n"
    "  __trace('AÇILIŞ: sunucudan yükleme'",
    "  // v103 (Kerem, VERI KURTARMA KALKANI): NORMAL yukleme (bulut -> cihaz) cihazdaki veriyi EZMEDEN once:\n"
    "  // (a) cihaz halini TEK SLOT yedekle (pilateria_pre_cloud_backup) -> recover.html'de gorunur/geri yuklenir.\n"
    "  // (b) cihaz buluttan DAHA YENI gorunuyorsa EZME; once BIRLESTIRME teklif et (upsert, silme yok).\n"
    "  try {\n"
    "    if ((state.members || []).length) {\n"
    "      const __curRaw = localStorage.getItem('pilateria');\n"
    "      if (__curRaw) localStorage.setItem('pilateria_pre_cloud_backup', JSON.stringify({ at: new Date().toISOString(), state: __curRaw }));\n"
    "    }\n"
    "  } catch(e){}\n"
    "  try {\n"
    "    const __cloudSt = sbRowsToState(JSON.parse(JSON.stringify(all)));\n"
    "    const __c = function(st){ return { m:(st.members||[]).length, l:(st.lessons||[]).length, p:(st.payments||[]).length }; };\n"
    "    const __mx = function(st){ return (st.payments||[]).map(function(p){ return (p && p.date) || ''; }).sort().slice(-1)[0] || ''; };\n"
    "    const __L = __c(state), __C = __c(__cloudSt);\n"
    "    const __localNewer = (__L.p > __C.p) || (__L.l > __C.l) || (__L.m > __C.m) || (__mx(state) > __mx(__cloudSt));\n"
    "    if (__localNewer && __sbRole === 'owner') {\n"
    "      const __ok = await plConfirm('Bu cihazda buluttan DAHA YENİ görünen veriler var.\\n\\nCihaz: '+__L.m+' üye / '+__L.l+' ders / '+__L.p+' ödeme\\nBulut: '+__C.m+' üye / '+__C.l+' ders / '+__C.p+' ödeme\\n\\nCihazdaki veriler bulutla BİRLEŞTİRİLSİN mi? (Hiçbir kayıt silinmez)', 'Evet, birleştir');\n"
    "      if (__ok) {\n"
    "        __trace('AÇILIŞ: cihaz buluttan YENİ → BİRLEŞTİRİLDİ (upsert, silme yok)');\n"
    "        await sbMigrateLocal();\n"
    "        try { save(); } catch(e){}\n"
    "        try { __refreshUIInPlace(); } catch(e){}\n"
    "        return;\n"
    "      }\n"
    "      __trace('AÇILIŞ: cihaz yeni görünüyordu, kullanıcı BULUT halini seçti (cihaz hali pre_cloud_backup yedeğinde)');\n"
    "    }\n"
    "  } catch(e) { console.error('[sb] v103 yeni-cihaz kontrolü', e); }\n"
    "  // v47 VERI GUVENLIGI: yenilemeden once gonderilememis (dirty) yerel degisiklikler VARSA koru + gonder\n"
    "  __trace('AÇILIŞ: sunucudan yükleme'",
    1, "v103-local-newer-guard")

# 2) Surum: 2026.07.18.25 -> 2026.07.21.26 (meta + APP_VERSION)
rep("2026.07.18.25", "2026.07.21.26", 2, "app-version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v103 uygulandi. fark=%d bayt" % (len(s)-len(o)))
