# -*- coding: utf-8 -*-
# v142 — Kerem (2026-08-02, ekran goruntusuyle): uye/grup detayindaki ders SAYACLARI iptal dersi
# saymasin — sayi = YAPILAN + YANAN (hakedis/kota kanonuyla ayni dil). Planli ve iptal ayri
# rozetle gorunur (iptal "sayilmaz" notuyla), LISTE SATIRLARI AYNEN kalir (tarihsel kayit gorunur).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) uye detayi basligi ----------
rep("""<details open><summary>${ctxAy} Dersleri (${lessons.length}) <span style="color:var(--muted);font-size:11px;font-weight:normal;">— Düzenle ile tarih/saat/durum/hoca değiştir</span></summary>""",
"""<details open><summary>${(function(){
      const y = lessons.filter(l => l.status === 'completed').length;
      const f = lessons.filter(l => l.status === 'missed').length;
      const p = lessons.filter(l => (l.status || 'planned') === 'planned').length;
      const c = lessons.filter(l => l.status === 'cancelled').length;
      return `${ctxAy} Dersleri (${y + f}) <span style="color:var(--muted);font-size:11px;font-weight:normal;">— ✅ ${y} yapıldı${f ? ` · 🔥 ${f} yandı` : ''}${p ? ` · 📅 ${p} planlı` : ''}${c ? ` · 🚫 ${c} iptal (sayılmaz)` : ''} · Düzenle ile değiştir</span>`;
    })()}</summary>""")

# ---------- 2) Tum Gecmis sayaci ----------
rep("""(${allPayments.length} ödeme · ${allLessons.length} ders)""",
"""(${allPayments.length} ödeme · ${allLessons.filter(l => l.status === 'completed' || l.status === 'missed').length} ders)""")

# ---------- 3) grup detayi basligi ----------
rep("""<details open style="margin-top:8px;"><summary>📅 Grup Dersleri (${groupLessons.length}) — tıklayarak düzenle</summary>""",
"""<details open style="margin-top:8px;"><summary>${(function(){
      const y = groupLessons.filter(l => l.status === 'completed').length;
      const f = groupLessons.filter(l => l.status === 'missed').length;
      const p = groupLessons.filter(l => (l.status || 'planned') === 'planned').length;
      const c = groupLessons.filter(l => l.status === 'cancelled').length;
      return `📅 Grup Dersleri (${y + f}) <span style="color:var(--muted);font-size:11px;font-weight:normal;">— ✅ ${y} yapıldı${f ? ` · 🔥 ${f} yandı` : ''}${p ? ` · 📅 ${p} planlı` : ''}${c ? ` · 🚫 ${c} iptal (sayılmaz)` : ''} · tıklayarak düzenle</span>`;
    })()}</summary>""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.02.64">', '<meta name="app-version" content="2026.08.02.65">')
rep("const APP_VERSION = '2026.08.02.64';", "const APP_VERSION = '2026.08.02.65';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v141-2026-08-02-64';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v142-2026-08-02-65';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
