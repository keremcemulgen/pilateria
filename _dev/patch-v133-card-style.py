# -*- coding: utf-8 -*-
# v133 — Kerem geri bildirimi (v132 kartlari):
#  1) "(DERYA ÖZTEPE+)" kaligrafisi KALKTI — uyeler virgulle, hoca alt satirda duz yazi.
#  2) Planli ders karti cok koyuydu — ACIK yesil (#9fd8c0 + koyu yesil yazi); yapilan ders orta
#     yesilde (eski planli renk) kalir ki ikisi ayrissin. Iptal gri, yanan kirmizi ayni.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) CSS: acik yesil planli, orta yesil yapilan ----------
rep(""".pcal-card { background:var(--acc); color:var(--acc-contrast,#fff); border-radius:12px; padding:10px 14px; margin:6px 0; cursor:pointer; }""",
""".pcal-card { background:#9fd8c0; color:#0e3b2e; border-radius:12px; padding:10px 14px; margin:6px 0; cursor:pointer; }""")

rep(""".pcal-card.pcst-completed { background:var(--acc-strong,#0a5f52); }""",
""".pcal-card.pcst-completed { background:var(--acc); color:var(--acc-contrast,#fff); }""")

# ---------- 2) kart metni: parantez/arti kaligrafisi yok ----------
rep("""  const kisiler = l.groupId
    ? (function(){ const ns = (l.memberIds||[]).map(memberName).filter(Boolean); return ns.length ? ns.join('+') : (groupNameForMonth(l.groupId, ay) || 'Grup'); })()
    : ((l.memberIds||[]).map(memberName).filter(Boolean).join('+') || '(boş)');
""",
"""  const kisiler = l.groupId
    ? (function(){ const ns = (l.memberIds||[]).map(memberName).filter(Boolean); return ns.length ? ns.join(', ') : (groupNameForMonth(l.groupId, ay) || 'Grup'); })()
    : ((l.memberIds||[]).map(memberName).filter(Boolean).join(', ') || 'Boş ders');
""")

rep("""  return `<div class="pcal-card pcst-${st}" onclick="openLessonModal('${l.id}')">
    <div class="pcal-c1">${l.time} (${escapeHtml(kisiler)})${hoca ? `(${escapeHtml(hoca)}+)` : ''}${cancelled ? ' iptal' : ''}</div>
    <div class="pcal-c2">${l.time}${bit ? '–' + bit : ''} · ${dolu}/${l.size || state.settings.reformers} · ${(LESSON_STATUS[st]||{}).label || ''}</div>
  </div>`;
""",
"""  return `<div class="pcal-card pcst-${st}" onclick="openLessonModal('${l.id}')">
    <div class="pcal-c1">${l.time} · ${escapeHtml(kisiler)}${cancelled ? ' — iptal' : ''}</div>
    <div class="pcal-c2">${l.time}${bit ? '–' + bit : ''} · ${dolu}/${l.size || state.settings.reformers}${hoca ? ' · ' + escapeHtml(hoca) : ''} · ${(LESSON_STATUS[st]||{}).label || ''}</div>
  </div>`;
""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.30.55">', '<meta name="app-version" content="2026.07.30.56">')
rep("const APP_VERSION = '2026.07.30.55';", "const APP_VERSION = '2026.07.30.56';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v132-2026-07-30-55';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v133-2026-07-30-56';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
