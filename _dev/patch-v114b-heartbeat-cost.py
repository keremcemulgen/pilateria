#!/usr/bin/env python3
# v114b — NABIZ MALIYET AYARI (kendi v114 yamamin oz-elestirisi)
# v114'te nabiz her 60sn'de TAM tazeleme yapiyordu: 13 tablo x ~250KB = ~15 MB/saat/sekme.
# Iki cihaz gunde 5 saat acik kalirsa aylik ~4.5 GB -> Supabase ucretsiz kotasini (5 GB) zorlar.
# Bu, "hicbir seyi bozmadan duzelt" kuralina aykiri bir yan etki olurdu.
#
# COZUM: nabiz IKI KADEMELI olsun —
#   1) her 60sn: KANAL SAGLIK DENETIMI (agdan BEDAVA). Kanal olmusse yeniden kurulur; yeniden
#      kurulum SUBSCRIBED olunca zaten sbResync('rt-recover') ile TAM yakalama yapar.
#   2) her 5dk: EMNIYET TAM TAZELEME — realtime 'joined' gorunup sessizce veri akitmiyorsa
#      (suresi dolmus JWT klasik ornegi) en kotu bayatlik 5dk ile SINIRLI kalir.
# Sekme gizliyken/cevrimdisiyken hicbiri calismaz. Kullanici sekmeler arasi gecerken zaten
# 'visible' resync'i __sbLastResync'i tazeledigi icin gereksiz tekrar cekim olmaz.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()

old = (
"    clearInterval(window.__sbHeartT);\n"
"    window.__sbHeartT = setInterval(function(){\n"
"      try {\n"
"        if (document.visibilityState !== 'visible') return;\n"
"        if (navigator.onLine === false) return;\n"
"        sbHealChannel();\n"
"        sbResync('nabız');\n"
"      } catch(e){}\n"
"    }, (window.__sbHeartbeatMs || 60000));\n"
)
new = (
"    clearInterval(window.__sbHeartT);\n"
"    window.__sbHeartT = setInterval(function(){\n"
"      try {\n"
"        if (document.visibilityState !== 'visible') return;\n"
"        if (navigator.onLine === false) return;\n"
"        sbHealChannel(); // (1) ağdan BEDAVA: ölü kanal → yeniden kur (SUBSCRIBED olunca rt-recover tam yakalar)\n"
"        // (2) EMNİYET TAM TAZELEME: pahalı olduğu için seyrek. Realtime 'joined' görünüp sessizce\n"
"        // veri akıtmıyorsa (süresi dolmuş JWT) en kötü bayatlık bu süreyle SINIRLI kalır.\n"
"        if ((Date.now() - __sbLastResync) >= (window.__sbFullSyncMs || 300000)) sbResync('nabız');\n"
"      } catch(e){}\n"
"    }, (window.__sbHeartbeatMs || 60000));\n"
)
assert s.count(old) == 1, 'ANCHOR FAIL: nabiz blogu bulunamadi (%d)' % s.count(old)
s = s.replace(old, new, 1)
io.open(P, 'w', encoding='utf-8').write(s)
print('OK v114b: nabiz iki kademeli (60sn kanal saglik / 5dk tam tazeleme)')
