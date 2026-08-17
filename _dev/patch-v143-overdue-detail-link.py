# -*- coding: utf-8 -*-
# v143 — Kerem vakasi (Tamella/yetim grup, 2026-08-14): Geciken Odemeler satirindaki ISME tiklaninca
# kaynak detay ACILSIN — grup satiri openGroupDetail(borclu ay baglami), bireysel satir openMemberDetail.
# Boylece kadrosu bosalmis (Uyeler listesinde gorunmeyen) "yetim" gruplara da panelden ulasilir;
# Detay > Duzenle > "Pasife Al / Sil" yolu acilir. (Arayuzde ayri Gruplar sekmesi YOK — dogrulandi.)
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

rep("""<td><b>${o.label}</b>${o.groupId?`<br><small style="color:var(--p2)">👯 grup</small>`:''}</td>""",
"""<td><b style="cursor:pointer;text-decoration:underline dotted;" onclick="${o.groupId ? `openGroupDetail('${o.groupId}','${(o.months&&o.months[0])||''}')` : `openMemberDetail('${o.memberId}')`}" title="Detayı aç — bu borcun kaynağını gör">${o.label}</b>${o.groupId?`<br><small style="color:var(--p2)">👯 grup — ada dokun: detay</small>`:''}</td>""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.02.65">', '<meta name="app-version" content="2026.08.14.66">')
rep("const APP_VERSION = '2026.08.02.65';", "const APP_VERSION = '2026.08.14.66';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v142-2026-08-02-65';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v143-2026-08-14-66';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
