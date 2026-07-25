#!/usr/bin/env python3
# v115 — TAZELEME ONCESI YEREL YEDEK (Kerem: "ortagimin girdigi odemeler hala gozukmuyor" olayinda bulundu)
#
# ACIK: sbResync basarili cekimden sonra yerel state'i BUTUNUYLE sunucu haliyle EZIYOR
#   state = sbRowsToState(all); ... save();
# ama ONCESINDE HICBIR yerel yedek almiyor. Tek dayanak __pilDailySnapshot, o da GUNDE BIR KEZ
# yaziyor ('if (localStorage.getItem(key)) return;') — yani bugunun girisleri gunluk halkada YOK.
# Sonuc: ters bir tazeleme (bulut bayat / bir tablo push'u reddedilmis / cihaz gec kalmis) yerel
# verinin uzerine yazarsa GERI DONUS NOKTASI KALMIYOR.
#
# COZUM (tamamen EK, hicbir davranisi degistirmez): uzerine yazmadan hemen once, YALNIZCA kayit
# sayisi AZALIYORSA yerel anlik yedek al. Azalma yonu tehlikeli olan yon; artis/esitlikte yazmayiz
# (5 dakikada bir 250KB+ senkron localStorage yazmasi pahali olurdu).
#
# UC INCE NOKTA:
#  1) YENI ANAHTAR: 'pilateria_pre_overwrite_backup'. 'pilateria_pre_resync_backup' YENIDEN
#     KULLANILMAZ — 15 Temmuz kurtarmasi tam da o eski tek seferlik anlik goruntuden yapildi,
#     uzerine yazmak gercek bir kurtarma noktasini yok ederdi.
#  2) FAKIRLESTIRME KORUMASI: ard arda iki azalma olursa ikincisi birincinin (daha zengin)
#     yedegini EZMEMELI. Mevcut yedek daha cok kayit tasiyorsa DOKUNULMAZ.
#  3) KOTA: yazma basarisiz olursa gunluk halkadan EN ESKIDEN baslayarak birer birer silip
#     yeniden dener; digerlerine (pre_cloud/pre_pull/pre_resync/mass_delete) dokunmaz.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()

old = (
"    __sbApplying = true; window.__pilSuppressDirty = true;\n"
"    state = sbRowsToState(all); applyV10MigrationToState(state); sanitizeStateText(state); save();\n"
)
new = (
"    // v115 KORUMA: ÜZERİNE YAZMADAN ÖNCE yerel anlık yedek. Günlük halka günde yalnız bir kez\n"
"    // alındığı için BUGÜNÜN girişlerini içermez; ters bir tazelemede dönüş noktası kalmıyordu.\n"
"    const __incoming = sbRowsToState(all);\n"
"    try {\n"
"      const __PL_SNAP_F = [['members','üye'], ['groups','grup'], ['lessons','ders'], ['payments','ödeme']];\n"
"      const __tot = function(st) { let n = 0; __PL_SNAP_F.forEach(function(p){ n += ((st && st[p[0]]) || []).length; }); return n; };\n"
"      const __shrink = [];\n"
"      __PL_SNAP_F.forEach(function(p) {\n"
"        const a = ((state && state[p[0]]) || []).length, b = ((__incoming && __incoming[p[0]]) || []).length;\n"
"        if (b < a) __shrink.push(p[1] + ' ' + a + '→' + b);\n"
"      });\n"
"      const __cur = __shrink.length ? localStorage.getItem('pilateria') : null;\n"
"      if (__cur) {\n"
"        // FAKİRLEŞTİRME KORUMASI: mevcut yedek daha zenginse (art arda ikinci azalma) DOKUNMA.\n"
"        let __old = -1;\n"
"        try { const __p = localStorage.getItem('pilateria_pre_overwrite_backup'); if (__p) __old = __tot(JSON.parse(__p)); } catch(e) {}\n"
"        if (__tot(state) >= __old) {\n"
"          let __ok = false;\n"
"          const __daily = [];\n"
"          for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('pilateria_daily_') === 0) __daily.push(k); }\n"
"          __daily.sort();\n"
"          for (;;) {\n"
"            try { localStorage.setItem('pilateria_pre_overwrite_backup', __cur); __ok = true; break; }\n"
"            catch(e) { if (!__daily.length) break; try { localStorage.removeItem(__daily.shift()); } catch(e2) { break; } } // KOTA: en eski günlükten başla\n"
"          }\n"
"          __trace(__ok ? ('🧷 TAZELEME ÖNCESİ yerel yedek alındı (azalan: ' + __shrink.join(', ') + ')')\n"
"                       : ('🧷 TAZELEME ÖNCESİ yedek YAZILAMADI (kota) — azalan: ' + __shrink.join(', ')));\n"
"        } else { __trace('🧷 Önceki (daha zengin) tazeleme yedeği korundu — azalan: ' + __shrink.join(', ')); }\n"
"      }\n"
"    } catch(e) { try { __trace('🧷 Tazeleme öncesi yedek hatası: ' + (e && (e.message || e))); } catch(_) {} }\n"
"    __sbApplying = true; window.__pilSuppressDirty = true;\n"
"    state = __incoming; applyV10MigrationToState(state); sanitizeStateText(state); save();\n"
)
assert s.count(old) == 1, 'ANCHOR FAIL: sbResync uzerine yazma blogu bulunamadi (%d)' % s.count(old)
s = s.replace(old, new, 1)
io.open(P, 'w', encoding='utf-8').write(s)
print('OK v115: sbResync uzerine yazmadan once (yalnizca AZALMA halinde) yerel yedek aliyor')
