#!/usr/bin/env python3
# v112 (Kerem: "her cihazda 'cihazda daha yeni var' uyarisi cikiyor, bulut guncel oldugu halde"):
# KOK NEDEN (3 korumanin yanlis-alarm dongusu):
#  v106/v108 mesru toplu ders silmeleri -> acik cihazlarda v104 REALTIME sigortasi (>12) atip silmeleri
#  REDDEDIYOR -> o cihazlarin YERELINDE bulutta olmayan (aslinda SILINMIS) dersler kaliyor ->
#  v103 'cihaz daha yeni' kontrolu SAYI bazliydi -> her giriste sahte 'birlestir?' uyarisi;
#  'Evet' denirse silinmis dersler buluta geri yuklenip dongu tazeleniyordu.
# FIX:
#  A) v103 kontrolu ID-BAZLI ve yalniz UYE+ODEME (para-kritik) tablolarinda: yerelde bulutta OLMAYAN
#     uye/odeme ID'si veya daha yeni odeme tarihi varsa sor. DERS farki tek basina uyari URETMEZ
#     (dersler mesru olarak silinir/supurulur). Gercek kurtarma senaryosu (ev PC: +uye +odeme) korunur.
#  B) v104 realtime sigortasi: esik 12 -> 25 + OTOTAMIR: tetiklendikten 20 sn sonra buluta bakar;
#     uye tablosu SAGLAMSA (wipe yok) sigorta acilir + sunucudan tam tazelenir (silmeler kabul edilir).
#     Bulut uye tablosu BOSSA koruma surer (gercek wipe savunmasi degismedi).
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---- A) v103 'cihaz daha yeni' = ID-BAZLI (uye+odeme) ----
rep(
    "    const __L = __c(state), __C = __c(__cloudSt);\n"
    "    const __localNewer = (__L.p > __C.p) || (__L.l > __C.l) || (__L.m > __C.m) || (__mx(state) > __mx(__cloudSt));",
    "    const __L = __c(state), __C = __c(__cloudSt);\n"
    "    // v112: SAYI degil ID bazli ve yalniz UYE+ODEME — ders silmeleri (supurme/son-ders) sahte alarm uretmesin.\n"
    "    const __idsOf = function(arr){ const st2 = new Set(); (arr||[]).forEach(function(x){ if (x && x.id) st2.add(x.id); }); return st2; };\n"
    "    const __hasMissing = function(locArr, cloudSet){ return (locArr||[]).some(function(x){ return x && x.id && !cloudSet.has(x.id); }); };\n"
    "    const __cmIds = __idsOf(__cloudSt.members), __cpIds = __idsOf(__cloudSt.payments);\n"
    "    const __localNewer = __hasMissing(state.members, __cmIds) || __hasMissing(state.payments, __cpIds) || (__mx(state) > __mx(__cloudSt));",
    1, "v103-id-based")

# ---- B1) Realtime sigorta esigi 12 -> 25 ----
rep(
    "          if (window.__rtDelWin.length > 12) {",
    "          if (window.__rtDelWin.length > 25) { // v112: 12 -> 25 (mesru toplu islemler 12'yi asabiliyor; wipe yuzlercedir)",
    1, "rt-threshold")

# ---- B2) OTOTAMIR: 20 sn sonra bulut saglikliysa sigortayi ac + tazele ----
rep(
    "            try { setCloudDot && setCloudDot('offline'); } catch(e) {}\n"
    "            return;\n"
    "          }",
    "            try { setCloudDot && setCloudDot('offline'); } catch(e) {}\n"
    "            // v112 OTOTAMIR: 20 sn sonra buluta bak — uyeler DURUYORSA silmeler mesru toplu islemdi:\n"
    "            // sigortayi ac + sunucudan TAM tazele (yerel hizalanir, 'cihaz daha yeni' sahte alarmi dogmaz).\n"
    "            // Bulut uye tablosu BOSSA (gercek wipe) koruma surer.\n"
    "            clearTimeout(window.__rtFuseVerifyT);\n"
    "            window.__rtFuseVerifyT = setTimeout(async function() {\n"
    "              try {\n"
    "                const __vr = await sbClient.from('members').select('id').limit(1);\n"
    "                const __alive = !(__vr && __vr.error) && ((__vr && __vr.data) || []).length > 0;\n"
    "                if (__alive) {\n"
    "                  window.__rtDelTripped = false; window.__rtDelWin = [];\n"
    "                  __trace('✅ SİGORTA OTOTAMİR: bulut sağlıklı (üyeler duruyor) — toplu silme meşruydu, sunucudan tazeleniyor');\n"
    "                  try { sbResync('rt-fuse-verify'); } catch(e) {}\n"
    "                } else {\n"
    "                  __trace('⛔ SİGORTA KALICI: bulut üye tablosu BOŞ/ulaşılamaz — koruma sürüyor (recover.html hazır)');\n"
    "                }\n"
    "              } catch(e) {}\n"
    "            }, (window.__rtFuseVerifyMs || 20000));\n"
    "            return;\n"
    "          }",
    1, "rt-autoheal")

# ---- Surum ----
rep("2026.07.23.34", "2026.07.23.35", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v112 uygulandi. fark=%d bayt" % (len(s)-len(o)))
