#!/usr/bin/env python3
# v114 — SAGIR CIHAZ KOK FIX
# Kerem: "ortagim telefondan veri giriyor ama bende otomatik o girdigi yeni veriler gozukmuyor"
#
# KOK SEBEP (alma yolunda UC kalici sagirlik acigi + 2 yan acik):
#  A) sbResync KILIDI: kirli bayrak varken KOSULSUZ return. Basarisiz push bayragi takili birakir ->
#     her resync yalniz push -> cihaz buluttan BIR DAHA HIC veri cekemez. Push BASARILI olsa bile
#     tazeleme atlaniyordu (korunacak yerel degisiklik kalmadigi halde).
#  B) NABIZ YOK: realtime sessizce olurse (JWT suresi, mobil soket askiya alma, yayin ayari) ve sekme
#     ACIK kalirsa visibilitychange/online HIC atesLENMEZ -> tek tetikleyici kalmaz -> kalici sagir.
#  C) OLU KANAL: sbSubscribeAll, __sbChannel dolu diye erken donuyor; olu kanal sonsuza dek olu kalir.
#  D) realtime render UI mesgulken DUSUYOR (tekrar yok) — veri geliyor, ekran guncellenmiyor.
#  E) sbMigrateLocal upsert hatasinda subscribe ETMEDEN donuyor -> o oturum boyunca realtime yok.
#
# GUVENLIK GARANTISI KORUNDU: gonderilememis yerel degisiklik varken bulut hali state'i ASLA EZMEZ.
import io, sys

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
orig_len = len(s)

def rep(old, new, n=1, tag=''):
    c = s.count(old)
    assert c == n, 'ANCHOR FAIL [%s]: beklenen %d, bulunan %d' % (tag, n, c)
    return s.replace(old, new, n)

# ---------------------------------------------------------------- A) sbResync kilidi
old = "  if (reason !== 'rt-recover' && (now - __sbLastResync) < 4000) return; // asiri tetiklemeyi kis"
new = "  if (reason !== 'rt-recover' && reason !== 'after-push' && (now - __sbLastResync) < 4000) return; // asiri tetiklemeyi kis"
s = rep(old, new, 1, 'A1-throttle')

old = ("    if (typeof isDirty === 'function' && isDirty()) { __trace('RESYNC('+reason+'): kirli → sadece gönder, tazeleme YOK'); "
       "try { await sbFlushPush(); } catch(e){} return; }")
new = (
"    if (typeof isDirty === 'function' && isDirty()) {\n"
"      try { await sbFlushPush(); } catch(e){}\n"
"      // v114 KİLİT KIRICI (Kerem: \"ortağın girdiği veriler bende gözükmüyor\"): burada eskiden KOŞULSUZ\n"
"      // return vardı. Push başarısız olunca kirli bayrak takılı kalıyor → her resync yalnız push → cihaz\n"
"      // buluttan BİR DAHA HİÇ veri çekemiyordu (kalıcı sağırlık). Push BAŞARILI ise korunacak yerel\n"
"      // değişiklik KALMADIĞI için tazelemeyi replika gecikmesinin ardına planla.\n"
"      if (!(typeof isDirty === 'function' && isDirty())) {\n"
"        window.__sbPushStuck = 0;\n"
"        __trace('RESYNC('+reason+'): kirli → gönderildi, tazeleme planlandı');\n"
"        clearTimeout(sbResync._afterPush);\n"
"        sbResync._afterPush = setTimeout(function(){ try { sbResync('after-push'); } catch(e){} }, (window.__sbAfterPushMs || 7000));\n"
"        return;\n"
"      }\n"
"      // Gönderim HALA başarısız: yerel değişiklikler KORUNUR (ezme YOK) — ama sessiz kalma, kullanıcıya bildir.\n"
"      window.__sbPushStuck = (window.__sbPushStuck || 0) + 1;\n"
"      __trace('RESYNC('+reason+'): kirli → gönderim BAŞARISIZ ('+window.__sbPushStuck+') → yerel korundu, tazeleme YOK');\n"
"      if (window.__sbPushStuck === 3) { try { setCloudDot && setCloudDot('offline'); if (window.plToast) plToast('⚠️ Buluta gönderim takıldı — yeni veriler gelmiyor olabilir'); } catch(e){} }\n"
"      return;\n"
"    }"
)
s = rep(old, new, 1, 'A2-dirty-deadlock')

old = "    if (__sbLastPushAt && (Date.now() - __sbLastPushAt) < 6000) { __trace('RESYNC('+reason+'): yakın push → tazeleme atlandı'); return; }"
new = "    if (reason !== 'after-push' && __sbLastPushAt && (Date.now() - __sbLastPushAt) < 6000) { __trace('RESYNC('+reason+'): yakın push → tazeleme atlandı'); return; }"
s = rep(old, new, 1, 'A3-recent-push')

# ---------------------------------------------------------------- E) migrate hatasinda subscribe
old = "      if (r.error) { alert('Taşıma hatası (' + t + '): ' + r.error.message); return; }"
new = "      if (r.error) { alert('Taşıma hatası (' + t + '): ' + r.error.message); try { sbSubscribeAll(); } catch(e){} return; }"
s = rep(old, new, 1, 'E-migrate-error-subscribe')

# ---------------------------------------------------------------- C) olu kanal onarimi
old = "let __sbChannel = null, __sbRtTimer = null;"
new = (
"let __sbChannel = null, __sbRtTimer = null;\n"
"// v114 KANAL SAĞLIK DENETİMİ: sbSubscribeAll '__sbChannel dolu' diye erken döndüğü için bir kez ölen\n"
"// kanal sonsuza dek ölü kalıyordu (CHANNEL_ERROR/TIMED_OUT/CLOSED). Burada ölü kanal atılıp yeniden kurulur.\n"
"function sbHealChannel() {\n"
"  if (!sbClient) return;\n"
"  try {\n"
"    const __st = __sbChannel && __sbChannel.state;\n"
"    if (!__sbChannel || __st === 'closed' || __st === 'errored') {\n"
"      if (__sbChannel) { try { sbClient.removeChannel(__sbChannel); } catch(e){} }\n"
"      __sbChannel = null; __sbWasDropped = true;\n"
"      __trace('NABIZ: realtime kanalı ölü/kapalı → yeniden kuruluyor');\n"
"      sbSubscribeAll();\n"
"    }\n"
"  } catch(e){}\n"
"}"
)
s = rep(old, new, 1, 'C-heal-channel')

# ---------------------------------------------------------------- D) realtime render dusmesin
old = "        __sbRtTimer = setTimeout(() => { try { if (!__uiBusyForPull()) __refreshUIInPlace(); } catch(e){} if (window.plToast) plToast('☁️ Güncellendi'); }, 60);"
new = "        __sbRtTimer = setTimeout(function __rtRender(){ try { if (__uiBusyForPull()) { __sbRtTimer = setTimeout(__rtRender, 1500); return; } __refreshUIInPlace(); if (window.plToast) plToast('☁️ Güncellendi'); } catch(e){} }, 60);"
s = rep(old, new, 1, 'D-render-retry')

# ---------------------------------------------------------------- B) emniyet nabzi
old = (
"    if (!__sbListenersAdded) {\n"
"      __sbListenersAdded = true;"
)
new = (
"    // v114 EMNİYET NABZI: realtime sessizce ölürse (JWT süresi, mobil soket askıya alma, yayın ayarı) ve\n"
"    // sekme AÇIK kalırsa visibilitychange/online HİÇ ateşlenmez → tek tetikleyici kalmaz → cihaz kalıcı SAĞIR.\n"
"    // sbResync kendi güvenlik kilitlerini (kirli / meşgul / kısmi çekim / yakın push) zaten uyguladığı için\n"
"    // periyodik çağırmak GÜVENLİ: gönderilememiş yerel değişiklik varken bulut hali state'i EZMEZ.\n"
"    clearInterval(window.__sbHeartT);\n"
"    window.__sbHeartT = setInterval(function(){\n"
"      try {\n"
"        if (document.visibilityState !== 'visible') return;\n"
"        if (navigator.onLine === false) return;\n"
"        sbHealChannel();\n"
"        sbResync('nabız');\n"
"      } catch(e){}\n"
"    }, (window.__sbHeartbeatMs || 60000));\n"
"    if (!__sbListenersAdded) {\n"
"      __sbListenersAdded = true;"
)
s = rep(old, new, 1, 'B-heartbeat')

io.open(P, 'w', encoding='utf-8').write(s)
print('OK v114 yamandi. %d -> %d bayt (+%d)' % (orig_len, len(s), len(s) - orig_len))
