# -*- coding: utf-8 -*-
# v149 — Kerem (2026-08-18): "3.pakete de aynı kurallar ile izin versin uygulama, şuan sadece
# 2.pakete izin veriyor."
# DURUM: Motor (createSecondPackage) zaten N. paketi dogru isler: klondan cagrilsa da ASILA
# baglar (secondOfMember=rootId, zincir yok), adini "(N. Paket)" koyar (N = aktif klon sayisi + 2),
# v52/v58/v59 kurallari (kisi sayisi degismez, acilan aya kayitli, arsiv bagimsiz) klon sayisindan
# bagimsiz calisir. KISIT YALNIZ UI'DAYDI:
#   - buton yalniz asil uyede gorunuyordu (!m.secondOfMember) -> (2. Paket) kaydindan 3. acilamiyordu,
#   - etiketi sabit "+ 2. Paket" idi -> asil uyeden ikinci kez basmak "ayni seyi tekrar acacak" gibi
#     gorunuyordu (aslinda 3.'yu acardi ama kullaniciya soylemiyordu),
#   - toast metni sabit "2. paket ..." idi.
# COZUM: buton pasif olmayan HER kayitta (asil + klon); etiket dinamik "+ N. Paket"
# (N = asilin AKTIF klon sayisi + 2 — arsivli klon sayilmaz, motorun numaralamasiyla birebir);
# toast metni de N ile soyler. Sinir yok: 4., 5. paket ayni yolla acilir.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) buton: klonlarda da gorunur + dinamik "+ N. Paket" etiketi ----------
rep("""      ${(!m.archived && !m.secondOfMember) ? `<button class="btn secondary pl-owner-only" onclick="createSecondPackage('member','${id}','${thisMonth}');" title="Bu kişi için AYNI kişi ama bağımsız 2. paket üye kaydı oluştur (gruba eklenebilir veya bireysel; aktif üye sayısını değiştirmez)">+ 2. Paket</button>` : ''}""",
"""      ${(!m.archived) ? (() => { const __pkRoot = m.secondOfMember || id; const __pkN = state.members.filter(x => x.secondOfMember === __pkRoot && !x.archived).length + 2; return `<button class="btn secondary pl-owner-only" onclick="createSecondPackage('member','${id}','${thisMonth}');" title="Bu kişi için AYNI kişi ama bağımsız ${__pkN}. paket üye kaydı oluştur (gruba eklenebilir veya bireysel; aktif üye sayısını değiştirmez)">+ ${__pkN}. Paket</button>`; })() : ''}""")

# ---------- 2) toast metni dinamik ----------
rep("""  if (typeof plToast === 'function') { try { plToast('2. paket için bağımsız üye kaydı açıldı — ödeme/dersi buradan yönet; istersen gruba ekle'); } catch(e){} }""",
"""  if (typeof plToast === 'function') { try { plToast(n + '. paket için bağımsız üye kaydı açıldı — ödeme/dersi buradan yönet; istersen gruba ekle'); } catch(e){} }""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.17.71">', '<meta name="app-version" content="2026.08.18.72">')
rep("const APP_VERSION = '2026.08.17.71';", "const APP_VERSION = '2026.08.18.72';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v148-2026-08-17-71';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v149-2026-08-18-72';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
