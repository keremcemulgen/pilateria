# -*- coding: utf-8 -*-
# v178 — UYE DETAYI: BASKA BIRIMDEKI DERSLER AYRI (Kerem 2026-09-28: "Fereste'yi bireysele almama ragmen eski grubun
# 4 dersi listede; bu dersler onceki grubunda vb gibi listelenmeli — ona 8 derslik bireysel paket tanimlayacagim").
# Uye detayi, secili ayin derslerini ikiye ayirir:
#   • ana liste = BU BIRIMIN dersleri (o ay bireyselse grupsuz dersler; grup uyesiyse o grubun dersleri)
#   • "Diger birimlerdeki dersleri (N)" = onceki/baska gruplardaki (veya grup uyesiyse grupsuz) dersler, GRUP ADI +
#     "onceki grup" etiketi + o gruptaki pay bilgisiyle; Duzenle ayni.
# "Yapilan Ders (ay)" sayaci bu birimin derslerini sayar, altinda "+N diger birimde" notu. Odeme satirinda baska gruba
# yazilmis odeme grup adiyla etiketlenir. Kalan Ders zaten birim bazliydi (memberRemainingForMonth) — degismedi.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# 1) bolme: bu birimin dersleri / diger birimlerin dersleri
rep("""  const payments = allPayments.filter(p => payMonthOf(p) === ctxAy);
  const lessons = allLessons.filter(l => lesMonthOf(l) === ctxAy);
  const bought = payments.reduce((a,b)=>a+(+b.sessions||0),0);
  const used = lessons.filter(l=>l.status!=='cancelled').length;
  const r = Math.max(0, bought - used);
  const remCanon = memberRemainingForMonth(id, ctxAy); // v43: odemeden bagimsiz kalan (grup uyesi ise grubun kalani)
  const doneCount = lessons.filter(l=>l.status==='completed').length; // v43: gercekten YAPILAN""",
"""  const payments = allPayments.filter(p => payMonthOf(p) === ctxAy);
  const lessonsAllUnits = allLessons.filter(l => lesMonthOf(l) === ctxAy);
  // v178 (Kerem): BU BIRIMIN dersleri ana listede; onceki/baska gruplardaki (grup uyesiyse grupsuz) dersler ayri bolumde
  const __curG178 = memberActiveGroupForMonth(id, ctxAy);
  const __isOwn178 = l => __curG178 ? (l.groupId === __curG178.id) : !l.groupId;
  const lessons = lessonsAllUnits.filter(__isOwn178);
  const otherLessons178 = lessonsAllUnits.filter(l => !__isOwn178(l));
  const bought = payments.reduce((a,b)=>a+(+b.sessions||0),0);
  const used = lessons.filter(l=>l.status!=='cancelled').length;
  const r = Math.max(0, bought - used);
  const remCanon = memberRemainingForMonth(id, ctxAy); // v43: odemeden bagimsiz kalan (grup uyesi ise grubun kalani)
  const doneCount = lessons.filter(l=>l.status==='completed').length; // v43: gercekten YAPILAN (v178: bu birimin)
  const otherDone178 = otherLessons178.filter(l=>l.status==='completed' || l.status==='missed').length;""")

# 2) Yapilan Ders sayaci notu
rep("""      <div class="stat ok"><div class="label">Yapılan Ders (${ctxAy})</div><div class="value">${doneCount}</div></div>""",
"""      <div class="stat ok"><div class="label">Yapılan Ders (${ctxAy})</div><div class="value">${doneCount}</div>${otherDone178 ? `<div style="font-size:9.5px;color:var(--muted);margin-top:2px;" title="Bu ay başka birimde (önceki grup) yapılan dersler — aşağıda ayrı listelenir">+${otherDone178} diğer birimde</div>` : ''}</div>""")

# 3) diger birimler bolumu (ana listeden sonra)
rep("""        lessons.map(l=>`<tr><td>${fmtDate(l.date)}</td><td>${escapeHtml(l.time)}</td><td>${escapeHtml(instructorName(l.instructorId))}</td><td>${(l.size||(l.memberIds||[]).length||1)} kişilik</td><td>${lessonStatusBadge(l.status||'planned')}</td><td><button class="btn small secondary" onclick="openLessonModal('${l.id}')" title="Dersi düzenle (tarih/saat/durum/hoca; içinde Sil de var)">Düzenle</button></td></tr>`).join('') + '</tbody></table></div>' : '<div class="empty">Ders kaydı yok.</div>'}
    </details>
    <details open><summary>${ctxAy} Ödemeleri (${payments.length})""",
"""        lessons.map(l=>`<tr><td>${fmtDate(l.date)}</td><td>${escapeHtml(l.time)}</td><td>${escapeHtml(instructorName(l.instructorId))}</td><td>${(l.size||(l.memberIds||[]).length||1)} kişilik</td><td>${lessonStatusBadge(l.status||'planned')}</td><td><button class="btn small secondary" onclick="openLessonModal('${l.id}')" title="Dersi düzenle (tarih/saat/durum/hoca; içinde Sil de var)">Düzenle</button></td></tr>`).join('') + '</tbody></table></div>' : '<div class="empty">Ders kaydı yok.</div>'}
    </details>
    ${otherLessons178.length ? (function(){ // v178: onceki/baska birimlerdeki dersler — grup adiyla, bu birimin hakkina sayilmaz
      const __unitOf = l => { if (!l.groupId) return { key: '', name: 'bireysel', badge: 'bireysel ders' }; const g = state.groups.find(x => x && x.id === l.groupId); const nm = g ? (groupDisplayName(g, ctxAy) || g.name || 'Grup') : 'Silinmiş grup'; const ps = g ? partialShareFor(g.id, id, ctxAy) : null; return { key: l.groupId, name: nm, badge: 'önceki grup', share: ps }; };
      const __units = {}; otherLessons178.forEach(l => { const u = __unitOf(l); if (!__units[u.key]) __units[u.key] = { u: u, n: 0 }; __units[u.key].n++; });
      const __hint = Object.keys(__units).map(k => { const x = __units[k]; return escapeHtml(x.u.name) + ' ' + x.n + ' ders' + (x.u.share ? ' · payı ' + (x.u.share.sessions || 0) + ' ders / ' + money(x.u.share.price || 0) + ' ₺' : ''); }).join(' · ');
      return `<details open><summary>Diğer birimlerdeki dersleri (${otherLessons178.length}) <span style="color:var(--muted);font-size:11px;font-weight:normal;">— ${__hint} · bu birimin ders hakkına sayılmaz</span></summary>
      <div class="table-wrap"><table class="sticky-head"><thead class="sticky-thead"><tr><th>Tarih</th><th>Saat</th><th>Grup</th><th>Hoca</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>` +
        otherLessons178.map(l => { const u = __unitOf(l); return `<tr style="opacity:.85;"><td>${fmtDate(l.date)}</td><td>${escapeHtml(l.time)}</td><td>${escapeHtml(u.name)} <span class="badge" style="background:#f5f0e0;color:#8a8573;font-size:10px;">${u.badge}</span></td><td>${escapeHtml(instructorName(l.instructorId))}</td><td>${lessonStatusBadge(l.status||'planned')}</td><td><button class="btn small secondary" onclick="openLessonModal('${l.id}')" title="Dersi düzenle">Düzenle</button></td></tr>`; }).join('') +
        '</tbody></table></div></details>';
    })() : ''}
    <details open><summary>${ctxAy} Ödemeleri (${payments.length})""")

# 4) odeme satiri: baska gruba yazilmis odeme grup adiyla
rep("""<td>${escapeHtml(paymentPkgLabel(p))}</td><td>${p.sessions}</td><td><b>${money(p.amount)} ₺</b></td><td>${escapeHtml(p.method||'—')}</td><td onclick="event.stopPropagation()"><button class="btn small secondary" onclick="openPaymentModal('${p.memberId}','${p.id}','${p.groupId||''}');" title="Düzenle">✏️</button>""",
"""<td>${escapeHtml(paymentPkgLabel(p))}${(function(){ try { if (!p.groupId) return ''; const g = state.groups.find(x => x && x.id === p.groupId); if (!g) return ''; const own = __curG178 && __curG178.id === g.id; return '<br><small style="color:var(--p2)">👯 ' + escapeHtml(groupDisplayName(g, ctxAy) || g.name || 'Grup') + (own ? '' : ' <span class="badge" style="background:#f5f0e0;color:#8a8573;font-size:10px;">önceki grup</span>') + '</small>'; } catch(e) { return ''; } })()}</td><td>${p.sessions}</td><td><b>${money(p.amount)} ₺</b></td><td>${escapeHtml(p.method||'—')}</td><td onclick="event.stopPropagation()"><button class="btn small secondary" onclick="openPaymentModal('${p.memberId}','${p.id}','${p.groupId||''}');" title="Düzenle">✏️</button>""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.09.28.100">', '<meta name="app-version" content="2026.09.28.101">')
rep("const APP_VERSION = '2026.09.28.100';", "const APP_VERSION = '2026.09.28.101';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v177-2026-09-28-100'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v178-2026-09-28-101'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
