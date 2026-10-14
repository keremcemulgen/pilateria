# -*- coding: utf-8 -*-
# v191 (Kerem 14.10): "Ayni ay icinde boyle bir sey nasil oluyor, Eylul'de boyle bir durum yoktu — kok sebebini bul ve duzelt."
# CANLI (IŞI*** TİP***): Eylul'de kok kayit Gizem'in grubunda (01–30.09 paketi, odendi), 2. paket klonu Iclal'in grubunda
# (16.09'da baslayan Eylul paketi Ekim'e sarkiyor). 10.10'da (Ekim) kok kayit Iclal'in grubuna alininca v186 "sarkan pakete
# katil" kurali kok kaydi EYLUL kadrosuna da yazdi (4 kisilik grupta 5. kayit), "Eylul paketinde 6 ders yapildi 2 kaldi"
# sorusuyla kokun EYLUL hakkini 2 + orantili yapti (bu kayit Gizem'in Eylul paketini de yonetir → Gizem'in 7 dersinin tabani
# 2.250 → 3.938, hakedis +3.544 ₺ sismis gorunur), 15/17.10 planli derslerine klonla birlikte ikinci kez yazdi; Eylul uye
# listesinde Iclal grubunda 4.500 ₺ hayalet borc.
# KOK: __joinSpilledPackage186 "yeni gelen" ile "zaten o ay baska yerde ucretlenmis kisi"yi ayirmiyordu.
# KURAL: (a) ayni KISI (kok/2. paket klonu) o paketin kadrosunda zaten varsa, (b) uyenin o ayda BASKA grupta aktif birimi
# varsa, (c) o ay bireysel paketi varsa → sarkan pakete EKLENMEZ; uye yalniz baglam ayindan itibaren gruptadir.
# ONARIM: bozuk kayit (katilis tarihi paket ayindan sonra + (a)/(b)) yonetici acilisinda TEK SORUYLA gosterilir; Evet →
# o ayin kadrosundan ve o paketin planli derslerinden cikar, onerinin yazdigi orantili hakki geri alir (Geri Al'li).
#
# AYRICA KRITIK (ayni incelemede bulundu): sbLoadAll/sbResync tam cekimi .range() olmadan yapiyordu; Supabase/PostgREST
# istek basina en fazla 1000 satir dondurur. Ders tablosu 1000'i asinca kimligi 'xs…' sonrasi (y/z) ~%6 ders HIC
# yuklenmiyordu (canli: iki farkli gunde ders sayisi tam 1000; odemelerde y/z var, derslerde yok). Bulutta veri durur
# (silme yalniz mezar tasiyla) ama uygulamada gorunmez: takvim, hakedis, paket sayaclari eksik. Cozum: SAYFALI cekim
# (count:'exact' + range, sunucu siniri ne olursa olsun), sayfa hatasinda eksik veri state'e YAZILMAZ.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# ---------- (1) SAYFALI TAM CEKIM ----------
rep("""async function sbLoadAll() {""",
"""// v191 KRITIK: Supabase/PostgREST tek istekte en fazla 1000 satir dondurur — tam cekim SAYFALI (count + range).
// Sayfa siniri sunucuda daha kucuk olsa bile 'count' ile eksiksiz; herhangi bir sayfa hata verirse {error} doner (cagiran
// eksik veriyi state'e YAZMAZ). range() desteklemeyen eski/sahte istemcide tek istek (geri uyumlu).
var __SB_PAGE191 = 1000;
async function __sbSelectAll191(t) {
  const rows = [];
  let total = null;
  for (let page = 0; page < 1000; page++) {
    let q = sbClient.from(t).select('id,data', page === 0 ? { count: 'exact' } : undefined).order('id');
    const ranged = !!(q && typeof q.range === 'function');
    if (ranged) q = q.range(rows.length, rows.length + __SB_PAGE191 - 1);
    const r = await q;
    if (r && r.error) return { data: null, error: r.error };
    const d = (r && r.data) || [];
    if (page === 0 && r && typeof r.count === 'number') total = r.count;
    for (let i = 0; i < d.length; i++) rows.push(d[i]);
    if (!ranged || !d.length) break;
    if (total !== null) { if (rows.length >= total) break; }
    else if (d.length < __SB_PAGE191) break;
  }
  return { data: rows, error: null };
}
async function sbLoadAll() {""")
rep("""      const r = await sbClient.from(t).select('id,data').order('id'); // v40: deterministik yukleme sirasi""",
"""      const r = await __sbSelectAll191(t); // v40: deterministik yukleme sirasi (order id) · v191: SAYFALI (1000 satir siniri)""")
rep("""      try { const r = await sbClient.from(t).select('id,data').order('id'); if (r && r.error) __resyncOk = false;""",
"""      try { const r = await __sbSelectAll191(t); /* v191: SAYFALI */ if (r && r.error) __resyncOk = false;""")

# acilista (yonetici) onarim teklifi
rep("""  sbSubscribeAll();
  setCloudDot && setCloudDot('ok');
  try { __pilOffsiteDaily(); } catch(e) {} // v104: gunde 1 kez ikinci buluta (JSONBin) tam yedek
}""",
"""  sbSubscribeAll();
  setCloudDot && setCloudDot('ok');
  try { __pilOffsiteDaily(); } catch(e) {} // v104: gunde 1 kez ikinci buluta (JSONBin) tam yedek
  try { if (__sbRole === 'owner') setTimeout(function(){ try { __offerSpillJoinRepair191(); } catch(e) {} }, 2500); } catch(e) {} // v191: sarkan pakete yanlis katilim onarimi (soruyla)
}""")

# ---------- (2) SARKAN PAKETE KATILIM KORUMASI ----------
rep("""// Yeni uye devam eden pakete (S) de girer: gidenin bos slotu, katilis tarihi, S kaydi, kalan derse gore ucret/hak sorusu.
function __joinSpilledPackage186(g, mid, ctxAy) {""",
"""// v191 (canli IŞI***): sarkan pakete katilim YALNIZ o ay hicbir yerde ucretlenmemis (gercekten yeni gelen) icin.
// (a) ayni KISI (kok / 2. paket klonu) o paketin kadrosunda zaten varsa, (b) uyenin o ayda BASKA grupta aktif birimi
// varsa, (c) o ay bireysel paketi varsa → EKLENMEZ (ikinci kez yazmak: hayali borc + o ayin hakki/fiyati bozulur + ayni
// derste ayni kisi iki kez). Bos donus = engel yok.
function __spillJoinBlock191(g, mid, S) {
  try {
    const pid = personIdOf(mid);
    const same = function(list){ return (list || []).some(function(x){ return x && x !== mid && personIdOf(x) === pid; }); };
    if (same(activeGroupRosterForMonth(g, S)) || same(resolveGroupMembersForMonth(g, S))) return 'ayni-kisi';
    if ((state.groups || []).some(function(o){ return o && o.id !== g.id && (activeGroupRosterForMonth(o, S) || []).includes(mid); })) return 'baska-grup';
    if (typeof __hasIndividualUnit179 === 'function' && __hasIndividualUnit179(mid, S)) return 'bireysel';
  } catch(e) {}
  return '';
}
// Yeni uye devam eden pakete (S) de girer: gidenin bos slotu, katilis tarihi, S kaydi, kalan derse gore ucret/hak sorusu.
function __joinSpilledPackage186(g, mid, ctxAy) {""")
rep("""    if (activeGroupRosterForMonth(g, S).includes(mid)) return '';
    const m = state.members.find(function(x){ return x && x.id === mid; }); if (!m) return '';
    applyRosterChange(g, S, function(mids){""",
"""    if (activeGroupRosterForMonth(g, S).includes(mid)) return '';
    const m = state.members.find(function(x){ return x && x.id === mid; }); if (!m) return '';
    { const __blk191 = __spillJoinBlock191(g, mid, S); if (__blk191) { try { __trace('SARKAN PAKET: ' + (m.name || mid) + ' ' + S + ' paketine eklenmedi (' + __blk191 + ')'); } catch(e) {} return ''; } } // v191
    applyRosterChange(g, S, function(mids){""")

# ---------- (3) ONARIM (tarama + soru) ----------
rep("""// Onceki paketlerin bu ay ve sonrasi tarihli PLANLI derslerinden uyeyi cikar (paket ayi ne olursa olsun)""",
"""// v191 ONARIM TARAYICISI: v186 ile sarkan pakete YANLIS yazilmis kayit — katilis tarihi paket ayindan SONRAKI bir ayda VE
// (ayni kisinin diger kaydi o pakette | uyenin o ay baska grupta aktif birimi var). Yalniz okur; degisiklik yapmaz.
function __spillJoinRepairScan191() {
  const hits = [];
  try {
    (state.groups || []).forEach(function(g){
      if (!g || !g.monthlyMembers) return;
      Object.keys(g.monthlyMembers).forEach(function(S){
        if (!/^\\d{4}-\\d{2}$/.test(S)) return;
        const raw = (g.monthlyMembers[S] || []).filter(Boolean);
        raw.forEach(function(mid){
          const jd = String(((g.memberJoinDates || {})[mid]) || '');
          if (!jd || jd.slice(0, 7) <= S) return;
          const pid = personIdOf(mid);
          const same = raw.some(function(x){ return x !== mid && personIdOf(x) === pid; });
          const other = (state.groups || []).some(function(o){ return o && o.id !== g.id && (activeGroupRosterForMonth(o, S) || []).includes(mid); });
          if (!same && !other) return;
          const m = (state.members || []).find(function(x){ return x && x.id === mid; }); if (!m) return;
          const mo = m.monthly && m.monthly[S];
          const fixHak = !!(mo && mo.__prorata === true && mo.sessionsOverride !== undefined && mo.sessionsOverride !== null && mo.sessionsOverride !== '');
          const lessonIds = (state.lessons || []).filter(function(l){ return l && l.groupId === g.id && l.status === 'planned' && (l.packageMonth || String(l.date || '').slice(0, 7)) === S && (l.memberIds || []).includes(mid); }).map(function(l){ return l.id; });
          hits.push({ gid: g.id, S: S, mid: mid, jd: jd, same: same, other: other, fixHak: fixHak, hak: fixHak ? mo.sessionsOverride : null, lessonIds: lessonIds });
        });
      });
    });
  } catch(e) {}
  return hits;
}
function __applySpillJoinRepair191(hits) {
  (hits || []).forEach(function(h){
    const g = (state.groups || []).find(function(x){ return x && x.id === h.gid; }); if (!g || !g.monthlyMembers) return;
    g.monthlyMembers[h.S] = (g.monthlyMembers[h.S] || []).filter(function(x){ return x !== h.mid; });
    (state.lessons || []).forEach(function(l){ if (l && (h.lessonIds || []).includes(l.id)) l.memberIds = (l.memberIds || []).filter(function(x){ return x !== h.mid; }); });
    if (h.fixHak) { const m = (state.members || []).find(function(x){ return x && x.id === h.mid; }); const mo = m && m.monthly && m.monthly[h.S]; if (mo) { delete mo.sessionsOverride; delete mo.__prorata; } }
  });
}
var __spillRepairAsked191 = false;
async function __offerSpillJoinRepair191() {
  if (__spillRepairAsked191) return;
  const hits = __spillJoinRepairScan191(); if (!hits.length) return;
  __spillRepairAsked191 = true;
  const lines = hits.map(function(h){
    const g = state.groups.find(function(x){ return x.id === h.gid; }) || {};
    const m = state.members.find(function(x){ return x.id === h.mid; }) || {};
    const ayS = pkgMonthLabel(h.S), ayJ = pkgMonthLabel(h.jd.slice(0, 7));
    const hoca = (typeof instructorName === 'function' && g.defaultInstructorId) ? instructorName(g.defaultInstructorId) : '';
    return '• ' + (m.name || 'Üye') + ' — «' + (groupDisplayName(g, h.S) || g.name || 'Grup') + '»' + (hoca ? ' (hoca: ' + hoca + ')' : '') + ' ' + ayS + ' paketi\\n'
      + '   ' + fmtDate(h.jd) + ' tarihinde ' + ayJ + ' için gruba alınırken ' + ayS + ' paketine de yanlışlıkla yazılmış'
      + (h.same ? ' (aynı kişinin diğer kaydı zaten bu pakette)' : '') + (h.other ? ' (' + ayS + ' paketi başka grupta)' : '') + '.\\n'
      + '   → ' + ayS + ' listesinden çıkar' + (h.lessonIds.length ? ', bu paketin ' + h.lessonIds.length + ' planlı dersinden çıkar' : '')
      + (h.fixHak ? ', ' + ayS + ' ders hakkını (' + h.hak + ') otomatiğe döndür' : '') + '. ' + ayJ + ' kaydı aynen kalır.';
  });
  const ok = await plConfirm('🔧 Veri onarımı\\n\\n' + lines.join('\\n\\n') + '\\n\\nDüzeltilsin mi? (Geri Al ile geri alınabilir)', 'Evet, düzelt');
  if (!ok) { try { __trace('ONARIM v191: kullanıcı reddetti (' + hits.length + ')'); } catch(e) {} return; }
  __undoSnapshot('Onarım: sarkan pakete yanlış katılım (' + hits.length + ')');
  __applySpillJoinRepair191(hits);
  try { __trace('ONARIM v191: ' + hits.length + ' kayıt düzeltildi'); } catch(e) {}
  save();
  try { renderMembers(); renderGroups(); renderDashboard(); renderCalendar(); refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {}
  if (typeof plToast === 'function') { try { plToast('🔧 ' + hits.length + ' kayıt düzeltildi — Geri Al ile geri alınabilir', 6000); } catch(e) {} }
}
// Onceki paketlerin bu ay ve sonrasi tarihli PLANLI derslerinden uyeyi cikar (paket ayi ne olursa olsun)""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.10.04.113">', '<meta name="app-version" content="2026.10.14.114">')
rep("const APP_VERSION = '2026.10.04.113';", "const APP_VERSION = '2026.10.14.114';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v190-2026-10-04-113'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v191-2026-10-14-114'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
