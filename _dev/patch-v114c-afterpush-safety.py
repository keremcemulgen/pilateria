#!/usr/bin/env python3
# v114c — KENDI v114 YAMAMIN GUVENLIK OZ-ELESTIRISI (deploy oncesi diff incelemesinde yakalandi)
#
# HATA: v114'te 'after-push' tazelemesini "yakin push (6sn replika gecikmesi)" korumasindan MUAF tuttum.
#   if (reason !== 'after-push' && __sbLastPushAt && (Date.now() - __sbLastPushAt) < 6000) ... return;
# Gerekce "after-push zaten 7sn sonra planlaniyor, 6sn'yi asar" idi. Ama muafiyet TAM DA tehlikeli
# durumda devreye giriyor: t0'da push basarili -> after-push t0+7000'e planlandi; kullanici t0+6800'de
# YENI bir degisiklik yapip push etti. t0+7000'de after-push calisir, isDirty() temiz, muafiyet yuzunden
# 6sn korumasi ATLANIR -> sbResync TAM state'i sunucudan EZER (LWW yok, wholesale 'state = sbRowsToState').
# Supabase okuma replikasi 200ms'lik yazimi henuz gormediyse kullanicinin YENI degisikligi GERI DONER.
# Bu, v46/v103'te kapatilmis olan "revert" hata sinifinin ta kendisi = "hicbir seyi bozma" ihlali.
#
# COZUM: 6sn koruma her reason icin (after-push dahil) GECERLI. Ama after-push yakalamasi DUSMESIN diye,
# koruma engellediginde yeniden ertelenir. Boylece: veri guvenligi TAM korunur + ortagin verisini cekme
# garantisi de kaybolmaz (push akisi durur durmaz ilk denemede gecer).
# NOT: 4sn "asiri tetikleme" kismasi muafiyeti KALIR — o yalnizca hiz kismasi, veri guvenligi tasimaz;
# araya baska bir (engellenmis) resync girdiginde __sbLastResync tazelenip after-push'u dusurmesin diye gerekli.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()

old = (
"    if (reason !== 'after-push' && __sbLastPushAt && (Date.now() - __sbLastPushAt) < 6000) "
"{ __trace('RESYNC('+reason+'): yakın push → tazeleme atlandı'); return; }\n"
)
new = (
"    if (__sbLastPushAt && (Date.now() - __sbLastPushAt) < 6000) {\n"
"      __trace('RESYNC('+reason+'): yakın push → tazeleme atlandı');\n"
"      // v114c VERİ GÜVENLİĞİ: replika gecikmesi koruması 'after-push' için de GEÇERLİ (yoksa yeni yerel\n"
"      // değişiklik bayat bulut haliyle EZİLİR). Yakalama düşmesin diye güvenli aralığın ardına ERTELE.\n"
"      if (reason === 'after-push') { clearTimeout(sbResync._afterPush); sbResync._afterPush = setTimeout(function(){ try { sbResync('after-push'); } catch(e){} }, (window.__sbAfterPushMs || 7000)); }\n"
"      return;\n"
"    }\n"
)
assert s.count(old) == 1, 'ANCHOR FAIL: yakin-push korumasi bulunamadi (%d)' % s.count(old)
s = s.replace(old, new, 1)
io.open(P, 'w', encoding='utf-8').write(s)
print('OK v114c: after-push artik 6sn replika korumasina TABI (engellenirse ertelenir)')
