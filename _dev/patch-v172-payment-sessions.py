# -*- coding: utf-8 -*-
# v172 — Kerem (2026-09-16): "Duzenle'de 3 ders tanimladigim uyenin Odeme al sayfasinda eski 8 hak
# gozukuyor — kok sebebi bul." KOK NEDEN ("TEK GERCEK, COK YUZEY" ailesi, v169/v170/v171 ile ayni):
# uyenin "Ders Hakki (bu ay)" (monthly[ay].sessionsOverride) yalniz BIREYSEL akista okunuyordu;
# grup uyesinde odeme penceresi/tik/toplu odeme ders sayisini SAHIP BIRIMDEN (grubun hakki, 8)
# aliyordu: openPaymentModal `sessionQuotaFor(groupId ? 'group' : 'member', ...)`, togglePaidTick
# `pkgObj.sessions`, saveGroupPaymentAll tek `sessions` (modal alani) her uyeye. Uye penceresinin
# "Otomatik: N" ipucu da grup uyesinde grubun degil uyenin paket TIPINI gosteriyordu. Ayrica pencerede
# uye degistirilince (onPayMemberChange) ders sayisi hic guncellenmiyordu (onceki uyenin degeri kalir).
# v172 TEK KAYNAK: memberEffectiveQuota(uye, ay, grup) = pay dersi (v171 ayrilan) > elle hak >
# grubun hakki (grup uyesi) > uyenin kotasi. Odeme KAYDININ ders sayisi = bu. Grup PAKETI
# olusturulurken (ilk odeme) uyeye ozel hak grubun hakkina KARISMAZ (elle hak yoksa eski davranis:
# alandaki sayi). Kayit duzenleme yolu degismez (kaydin kendi sayisi).
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:100])
    s = s.replace(old, new)

# ---------- 1) TEK KAYNAK ----------
rep("""function memberPaidTowardsMonth(memberId, groupId, monthISO, excludePayId) {""",
"""// v172 TEK KAYNAK (Kerem: "3 hak verdigim uyeye odemede 8 gozukuyor"): uyenin O AYKI KENDI ders hakki.
// Sira: v171 payi (o gruptan ayrilmis uyenin pay dersi) > elle hak (sessionsOverride) > grup uyesiyse
// GRUBUN hakki (aylik hak > o ayin paketi > tip) > uyenin kendi kotasi. groupId '' = bireysel baglam;
// undefined = o ay aktif grubunu kendi bulur. Odeme penceresi / tik / toplu odeme / uye penceresi bunu okur.
function memberEffectiveQuota(memberId, ay, groupId) {
  const a = ay || currentMonth();
  let gid = groupId;
  if (gid === undefined || gid === null) { const g = memberActiveGroupForMonth(memberId, a); gid = g ? g.id : ''; }
  if (gid) { const ps = partialShareFor(gid, memberId, a); if (ps) return Math.max(0, Math.round(+ps.sessions || 0)); }
  const ov = memberSessionsOverride(memberId, a); if (ov !== null) return ov;
  if (gid) return +sessionQuotaFor('group', gid, a) || 8;
  return +sessionQuotaFor('member', memberId, a) || 8;
}
// Uyeye ozel hak (elle hak / pay) alana yazildiysa grup PAKETI olusturulurken GRUBUN hakki kullanilir
function __groupPkgSessions172(memberId, groupId, ay, fieldSessions) {
  try {
    if (memberSessionsOverride(memberId, ay) !== null || partialShareFor(groupId, memberId, ay)) return +sessionQuotaFor('group', groupId, ay) || fieldSessions || 8;
  } catch(e) {}
  return fieldSessions;
}
function memberPaidTowardsMonth(memberId, groupId, monthISO, excludePayId) {""")

# ---------- 2) ODEME PENCERESI ACILISI ----------
rep("""    document.getElementById('mp-sessions').value = sessionQuotaFor(groupId ? 'group' : 'member', groupId || memberId, pkgMonthCtx || currentMonth()) || 8; // v45: otomatik ders hakki (opsiyonel — odeme buna baglanmaz)""",
"""    document.getElementById('mp-sessions').value = memberEffectiveQuota(memberId || mSel.value, pkgMonthCtx || currentMonth(), groupId || '') || 8; // v45 otomatik ders hakki (opsiyonel) · v172: UYENIN kendi hakki (elle hak > grubun hakki)""")

# ---------- 3) PENCEREDE UYE DEGISIMI ----------
rep("""  document.getElementById('mp-group').value = g ? g.id : '';
  setupPayPriceLock(mid, '', g ? g.id : '');
  if (!g) {""",
"""  document.getElementById('mp-group').value = g ? g.id : '';
  { const __ay172 = ((document.getElementById('mp-pkg-month')||{}).value) || String(document.getElementById('mp-date').value || todayISO()).slice(0,7);
    const __se172 = document.getElementById('mp-sessions'); if (__se172) __se172.value = memberEffectiveQuota(mid, __ay172, g ? g.id : '') || 8; } // v172: ders sayisi secilen uyenin hakki
  setupPayPriceLock(mid, '', g ? g.id : '');
  if (!g) {""")

# ---------- 4) GRUP KILIDI (v171 yalniz payi yaziyordu → tek kaynak) ----------
rep("""  const __ps171 = partialShareFor(gid, mid, month); // v171 (F13): ayrilan uyenin payi — ders sayisi alani da payin dersi
  if (__ps171) { const __se171 = document.getElementById('mp-sessions'); if (__se171) __se171.value = +__ps171.sessions || 0; }""",
"""  const __ps171 = partialShareFor(gid, mid, month); // v171 (F13): ayrilan uyenin payi
  { const __se171 = document.getElementById('mp-sessions'); if (__se171) __se171.value = memberEffectiveQuota(mid, month, gid) || 0; } // v172: ders sayisi = uyenin hakki (pay > elle hak > grubun hakki)""")

# ---------- 5) TIK ----------
rep("""    const __rec2 = buildPaymentRecord('', memberId, groupId||'', todayISO(), __pk0, (__psT171 ? (+__psT171.sessions || 0) : (+__pk0.sessions||8)), __kal, __kal, 'Nakit', '', '', 'Tik ile kalan tahsil' + (__psT171 ? ' (ayrılan üye payı)' : ''), false);""",
"""    const __rec2 = buildPaymentRecord('', memberId, groupId||'', todayISO(), __pk0, (memberEffectiveQuota(memberId, ay, groupId || '') || (+__pk0.sessions||8)), __kal, __kal, 'Nakit', '', '', 'Tik ile kalan tahsil' + (__psT171 ? ' (ayrılan üye payı)' : ''), false); // v172: uyenin hakki""")
rep("""    const sessions = __psT171 ? (+__psT171.sessions || 0) : (+pkgObj.sessions || 8); // v171 (F14): pay odemesinin ders sayisi payin dersi""",
"""    const sessions = memberEffectiveQuota(memberId, ay, groupId || '') || (+pkgObj.sessions || 8); // v171 (F14) pay dersi · v172: elle hak > grubun hakki (TEK KAYNAK)""")

# ---------- 6) TOPLU GRUP ODEMESI ----------
rep("""    const rec = buildPaymentRecord('', mid, groupId, date, __mPkg, sessions, listPrice, __amt, method, campaignId, campaignName, note, false);
    rec.packageMonth = packageMonth;
    if (!campaignId) { const __cDsc = paymentCapCheck(mid, groupId, packageMonth, 0, ''); if (__cDsc.defined > 0) rec.discount = 0; } // v131: taksit indirim degistir""".replace('degistir','degildir'),
"""    const __sess172 = (function(){ try { const ov = memberSessionsOverride(mid, packageMonth); if (ov !== null) return ov; return __fieldMemberSpecific172 ? (memberEffectiveQuota(mid, packageMonth, groupId) || sessions) : sessions; } catch(e) { return sessions; } })(); // v172: elle hakki olan uyeye KENDI hakki; alan baska uyeye ozelse digerlerine grubun hakki; yoksa alandaki sayi
    const rec = buildPaymentRecord('', mid, groupId, date, __mPkg, __sess172, listPrice, __amt, method, campaignId, campaignName, note, false);
    rec.packageMonth = packageMonth;
    if (!campaignId) { const __cDsc = paymentCapCheck(mid, groupId, packageMonth, 0, ''); if (__cDsc.defined > 0) rec.discount = 0; } // v131: taksit indirim degildir""")
rep("""  ensureGroupPackageStart(groupId, __pkgStartAll);
  if (!(g.packages||[]).find(p => p.month === packageMonth)) {
    createGroupPackage(g, packageMonth, __pkgStartAll, { sessions });
  }""",
"""  ensureGroupPackageStart(groupId, __pkgStartAll);
  if (!(g.packages||[]).find(p => p.month === packageMonth)) {
    createGroupPackage(g, packageMonth, __pkgStartAll, { sessions: __groupPkgSessions172(document.getElementById('mp-member').value, groupId, packageMonth, sessions) }); // v172: uyeye ozel hak grubun paketine karismaz
  }""")


# 6b) toplu odeme: alandaki sayi acilan uyeye ozel mi? (elle hak / pay) — digerlerine grubun hakki
rep("""  if (!confirm(__cmsg)) return;
  for (const mid of __targetMids) {
    const __amt = __amtByMid[mid] || 0;""",
"""  if (!confirm(__cmsg)) return;
  const __fieldMemberSpecific172 = (function(){ try { const mm = (document.getElementById('mp-member')||{}).value || ''; return memberSessionsOverride(mm, packageMonth) !== null || !!partialShareFor(groupId, mm, packageMonth); } catch(e) { return false; } })(); // v172
  for (const mid of __targetMids) {
    const __amt = __amtByMid[mid] || 0;""")
# ---------- 7) TEK ODEME KAYDI: grup paketi ----------
rep("""      if (g && !(g.packages||[]).find(p => p.month === data.packageMonth)) {
        createGroupPackage(g, data.packageMonth, __pkgStart, { sessions });
      }""",
"""      if (g && !(g.packages||[]).find(p => p.month === data.packageMonth)) {
        createGroupPackage(g, data.packageMonth, __pkgStart, { sessions: __groupPkgSessions172(memberId, groupId, data.packageMonth, sessions) }); // v172: uyeye ozel hak grubun paketine karismaz
      }""")

# ---------- 8) UYE PENCERESI "Otomatik: N" ----------
rep("""    const __auto = m.id ? sessionQuotaFor('member', m.id, __ctxMonth) : 8;
    sessEl.placeholder = 'Otomatik: ' + __auto;""",
"""    const __auto = m.id ? (function(){ try { const g = memberActiveGroupForMonth(m.id, __ctxMonth || currentMonth()); return g ? (+sessionQuotaFor('group', g.id, __ctxMonth || currentMonth()) || 8) : sessionQuotaFor('member', m.id, __ctxMonth); } catch(e) { return sessionQuotaFor('member', m.id, __ctxMonth); } })() : 8; // v172: grup uyesinde GRUBUN hakki (bos birakilirsa gecerli olan)
    sessEl.placeholder = 'Otomatik: ' + __auto;""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.15.94">', '<meta name="app-version" content="2026.09.16.95">')
rep("const APP_VERSION = '2026.09.15.94';", "const APP_VERSION = '2026.09.16.95';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v171-2026-09-15-94';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v172-2026-09-16-95';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
