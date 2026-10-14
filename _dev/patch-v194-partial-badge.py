# -*- coding: utf-8 -*-
# v194 (Kerem 14.10): "Kismi odeme yapanlar neden gozukmuyor? Tamella 4.400 odedi ama odemesinin kismi oldugu gozukmuyor."
# Uyeler tablosunda (masaustu) GRUP uyesinin satiri kismi odemede sari kaliyordu (v110) ama hic odemeyen uyeyle AYNI sari;
# tik dugmesi ✅ (tam odeyenle ayni); ortak "Grup Odenen/Kalan" hucrelerinde kisi bazli tutar yok → kismi odeme gorunmuyordu.
# (Mobil kartlar v123'ten beri "🟡 Kismi 4.400/4.500" yaziyor; grup detayi ve Odemeler sayfasi da.)
# COZUM: masaustu satirinda ad yaninda rozet "🟡 Kısmi 4.400 / 4.500 · kalan 100 ₺" (grup uyesi, pay satiri ve bireysel),
# tik dugmesi kismide 🟡 (baslik: kalani tahsil et); satir sinifi 'pay-part' (sari zemin + sol turuncu serit).
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep("""  #members-table tr.pay-ok  td { background: #E8F5E9; }           /* yeşil — ödeme alındı */""",
"""  #members-table tr.pay-ok  td { background: #E8F5E9; }           /* yeşil — ödeme alındı */
  #members-table tr.pay-part td:first-child { box-shadow: inset 4px 0 0 #f0a000; } /* v194: kısmi ödeme — turuncu şerit */
  .pay-part-badge-194 { display:inline-block; margin-left:6px; padding:1px 7px; border-radius:10px; background:#FFF3C4; color:#7a5b00; font-size:11px; font-weight:600; white-space:nowrap; vertical-align:middle; }""")

rep("""    if (!r.isEmpty) rowClasses.push(isPaid ? 'pay-ok' : 'pay-due');
    const rowClass = rowClasses.join(' ');""",
"""    if (!r.isEmpty) rowClasses.push(isPaid ? 'pay-ok' : 'pay-due');
    // v194: KISMI odeme (0 < odenen < kendi fiyati) — rozet + 🟡 tik; satir sarida kalir, sol serit turuncu
    const __own194 = r.isEmpty ? 0 : (r.type === 'group' ? (+r.ownPrice || 0) : (+r.totalPrice || 0));
    const __paid194 = +r.paid || 0;
    const __part194 = !r.isEmpty && !isPaid && __own194 > 0 && __paid194 > 0.005 && __paid194 < __own194 - 0.005;
    if (__part194) rowClasses.push('pay-part');
    const __partBadge194 = __part194 ? ' <span class="pay-part-badge-194" title="Kısmi ödeme — kalan ' + money(__own194 - __paid194) + ' ₺">🟡 Kısmi ' + money(__paid194) + ' / ' + money(__own194) + ' · kalan ' + money(__own194 - __paid194) + ' ₺</span>' : '';
    const __tick194 = __part194 ? '🟡' : ((+r.paid||0)>0 ? '✅' : '⬜');
    const __tickTitle194 = __part194 ? ('Kısmi ödeme: ' + money(__paid194) + ' / ' + money(__own194) + ' ₺ — tıkla: kalan ' + money(__own194 - __paid194) + ' ₺ tahsil') : ((+r.paid||0)>0 ? 'Ödemeyi kaldır' : 'Varsayılan paket fiyatıyla hızlı ödeme kaydı yarat');
    const rowClass = rowClasses.join(' ');""")

rep("""      <td><b>${r.name}</b>${r.type==='group' && r.ownPrice ? ' <small style="color:var(--muted);white-space:nowrap;">· '+money(r.ownPrice)+' ₺</small>' : ''}</td>""",
"""      <td><b>${r.name}</b>${r.type==='group' && r.ownPrice ? ' <small style="color:var(--muted);white-space:nowrap;">· '+money(r.ownPrice)+' ₺</small>' : ''}${__partBadge194}</td>""")

rep("""        <button class="btn small pl-owner-only" onclick="togglePaidTick('${r.memberId}','${r.groupId||''}',event)" title="${(+r.paid||0)>0?'Ödemeyi kaldır':'Varsayılan paket fiyatıyla hızlı ödeme kaydı yarat'}" style="${(+r.paid||0)>0?'background:#E8F5E9;color:#2E7D32;border:1px solid #2E7D32;':'background:#FFF8E1;color:#8a7b20;border:1px dashed #c9b85f;'}font-weight:600;">${(+r.paid||0)>0?'✅':'⬜'}</button>""",
"""        <button class="btn small pl-owner-only" onclick="togglePaidTick('${r.memberId}','${r.groupId||''}',event)" title="${__tickTitle194}" style="${__part194?'background:#FFF3C4;color:#7a5b00;border:1px solid #f0a000;':((+r.paid||0)>0?'background:#E8F5E9;color:#2E7D32;border:1px solid #2E7D32;':'background:#FFF8E1;color:#8a7b20;border:1px dashed #c9b85f;')}font-weight:600;">${__tick194}</button>""")

# pay (ayrilan uye) satiri: ayni rozet + 🟡 tik
rep("""        <td><b>${escapeHtml(r.name)}</b> <span class="badge" style="background:#f5f0e0;color:#8a8573;">ayrıldı · ${r.partialSessions} ders</span>${__own > 0 ? ' <small style="color:var(--muted);white-space:nowrap;">· ' + money(__own) + ' ₺</small>' : ''}</td>""",
"""        <td><b>${escapeHtml(r.name)}</b> <span class="badge" style="background:#f5f0e0;color:#8a8573;">ayrıldı · ${r.partialSessions} ders</span>${__own > 0 ? ' <small style="color:var(--muted);white-space:nowrap;">· ' + money(__own) + ' ₺</small>' : ''}${__partBadge194}</td>""")
rep("""          <button class="btn small pl-owner-only" onclick="togglePaidTick('${r.memberId}','${r.groupId}',event,'${monthISO||''}')" title="${__pd>0?'Ödemeyi kaldır':'Pay tutarıyla hızlı ödeme kaydı yarat'}" style="${__pd>0?'background:#E8F5E9;color:#2E7D32;border:1px solid #2E7D32;':'background:#FFF8E1;color:#8a7b20;border:1px dashed #c9b85f;'}font-weight:600;">${__pd>0?'✅':'⬜'}</button>""",
"""          <button class="btn small pl-owner-only" onclick="togglePaidTick('${r.memberId}','${r.groupId}',event,'${monthISO||''}')" title="${__part194 ? __tickTitle194 : (__pd>0?'Ödemeyi kaldır':'Pay tutarıyla hızlı ödeme kaydı yarat')}" style="${__part194?'background:#FFF3C4;color:#7a5b00;border:1px solid #f0a000;':(__pd>0?'background:#E8F5E9;color:#2E7D32;border:1px solid #2E7D32;':'background:#FFF8E1;color:#8a7b20;border:1px dashed #c9b85f;')}font-weight:600;">${__part194?'🟡':(__pd>0?'✅':'⬜')}</button>""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.10.14.116">', '<meta name="app-version" content="2026.10.14.117">')
rep("const APP_VERSION = '2026.10.14.116';", "const APP_VERSION = '2026.10.14.117';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v193-2026-10-14-116'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v194-2026-10-14-117'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
