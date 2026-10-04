# -*- coding: utf-8 -*-
# v188 — CANLI KOK SEBEP (2026-10-04, KUMIS / NESE, Eylul paketi Ekim'e sarkiyor):
# (1) Ekim'de olusturulan uyenin kayit tarihi (joinDate) 2026-10-04 → v57 kanonu "joinDate ayi > ay ise o ay aktif degil"
#     dedigi icin Eylul paketine ACIKCA kaydedilen (monthly[Eylul].enrolled:true + Eylul kadrosunda) uye Eylul'de YOK
#     sayiliyordu: kadroda gorunmuyor, sarkan 6 derse yazilmiyor, Eylul uye listesinde aramada cikmiyordu.
#     KURAL: o aya ACIK kayit (enrolled:true) kayit tarihinden ustundur — kasitli islem tarih varsayimini yener.
# (2) applyRosterChange "kadroya GERI giren uyenin ayrilan payi duser" kuralini HAM ay kadrosuyla bakiyordu. Pasife alinan
#     uye (v179: pasife al ay kadrosu anahtarina dokunmaz) ham kadroda durdugu icin o aya yapilan HER kadro degisikliginde
#     (ornegin yerine yeni uye eklemek) "Nese · ayrildi · 2 ders" payi siliniyordu. KURAL: pay yalniz bu degisiklikle AKTIF
#     kadroya GERCEKTEN giren uye icin duser (once aktif kadroda yok, degisiklikten sonra var).
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# (1) acik kayit kayit tarihini yener
rep("""  const jd = String(mm.joinDate || '').slice(0, 7);
  if (jd && jd > pm) return false;
  let rsm; try { rsm = ROSTER_START_MONTH; } catch (e) { rsm = '2026-08'; } // TDZ guvenligi (load sirasi)
  const mo = (mm.monthly || {})[pm];""",
"""  const mo = (mm.monthly || {})[pm];
  const jd = String(mm.joinDate || '').slice(0, 7);
  if (jd && jd > pm && !(mo && mo.enrolled === true)) return false; // v188: o aya ACIK kayit (sarkan pakete giren yeni uye) kayit tarihini yener
  let rsm; try { rsm = ROSTER_START_MONTH; } catch (e) { rsm = '2026-08'; } // TDZ guvenligi (load sirasi)""")

# (2) pay yalniz aktif kadroya GERCEKTEN giren uye icin duser
rep("""  g.memberIds = mutateFn((g.memberIds||[]).slice());
  Object.keys(g.monthlyMembers).forEach(k => {
    if (k >= ay) g.monthlyMembers[k] = mutateFn((g.monthlyMembers[k]||[]).slice());
  });
  // v171: kadroya (geri) giren uyenin o ayki "ayrilan payi" duser — pay + kadro fiyati CIFT sayilmaz
  try { const __r171 = (resolveGroupMembersForMonth(g, ay) || []).filter(Boolean); __partialsOf(g, ay).forEach(function(p){ if (__r171.includes(p.memberId)) removePartialShare(g.id, p.memberId, ay); }); } catch(e) {}""",
"""  // v188: bu degisiklikle AKTIF kadroya GERCEKTEN giren uyeler (pasif/ayrilmis uye ham kadroda dursa da aktif degildir)
  let __in188 = [];
  try { const __act188 = (activeGroupRosterForMonth(g, ay) || []).filter(Boolean); __in188 = (mutateFn(__act188.slice()) || []).filter(function(x){ return x && !__act188.includes(x); }); } catch(e) { __in188 = []; }
  g.memberIds = mutateFn((g.memberIds||[]).slice());
  Object.keys(g.monthlyMembers).forEach(k => {
    if (k >= ay) g.monthlyMembers[k] = mutateFn((g.monthlyMembers[k]||[]).slice());
  });
  // v171: kadroya (geri) giren uyenin o ayki "ayrilan payi" duser — pay + kadro fiyati CIFT sayilmaz
  // v188: yalniz bu degisiklikle aktif kadroya GIREN uye — yerine baskasi eklenince pasif uyenin payi SILINMEZ
  try { const __r171 = (resolveGroupMembersForMonth(g, ay) || []).filter(Boolean); __partialsOf(g, ay).forEach(function(p){ if (__r171.includes(p.memberId) && __in188.includes(p.memberId)) removePartialShare(g.id, p.memberId, ay); }); } catch(e) {}""")

# (3) aramada sonuc yoksa "liste henuz olusturulmadi" YANILTMASI: liste VAR ama filtre/arama bos donduyse bunu soyle
rep("""  const tb = document.getElementById('members-tbody');
  if (!rows.length) {
    // v23: Yeni ay (>=2026-08) henuz olusturulmadiysa kurulum secenekleri goster""",
"""  const tb = document.getElementById('members-tbody');
  if (!rows.length && buildMemberRows(monthISO).length) { // v188: ay listesi VAR, yalniz arama/filtre bos — "olusturulmadi" denmez
    const __mab188 = document.getElementById('month-add-btn'); if (__mab188) __mab188.style.display = (monthISO && monthISO >= ROSTER_START_MONTH) ? '' : 'none';
    const __msg188 = '<div class="big">🔍</div><div style="font-weight:700;margin:6px 0;">Bu ayda aramaya / filtreye uyan üye yok</div><div style="color:var(--muted);font-size:13px;">' + (monthISO || '') + ' listesi var — aramayı ya da filtreyi değiştir, başka ayda olabilir.</div>';
    tb.innerHTML = '<tr><td colspan="12"><div class="empty empty-filter-188" style="padding:22px;">' + __msg188 + '</div></td></tr>';
    { const __wc188 = document.getElementById('members-cards'); if (__wc188) __wc188.innerHTML = '<div class="empty empty-filter-188" style="padding:22px;">' + __msg188 + '</div>'; }
    return;
  }
  if (!rows.length) {
    // v23: Yeni ay (>=2026-08) henuz olusturulmadiysa kurulum secenekleri goster""")

# (4) Kerem (2026-10-04): "kalan ders sayisi hakkina esitse eklensin" — kendi hakki olan uye, hakki paketin ADAY derslerinin
#     hepsini karsiliyorsa (secilecek bir sey yok) derslere OTOMATIK yazilir; hakki adaylardan AZSA v187 gecerli: Kerem secer.
#     Aday = o paketin iptal-disi dersi ki uye zaten icinde ya da (planli + elle cikarilmamis + gruba katilim tarihinden sonra).
rep("""// Yeni grup dersinin OTOMATIK uyeleri: o ayin aktif kadrosu − kendi hakki olanlar (onlari Kerem secer)""",
"""// v188: kendi hakki olan uye icin SECIM gerekiyor mu? hakki < aday ders sayisi ise EVET (Kerem secer); hakki adaylarin
// hepsini karsiliyorsa HAYIR (6 hak · 6 kalan ders → hepsine otomatik). Hakki yoksa secim sorusu yoktur (false).
function __ownHakNeedsChoice188(mid, g, pm, st) {
  if (!__hasOwnHak187(mid, pm, st)) return false;
  const S0 = st || state;
  const __mm188 = ((S0.members) || []).find(function(x){ return x && x.id === mid; });
  const q = +(((__mm188 && __mm188.monthly && __mm188.monthly[pm]) || {}).sessionsOverride);
  if (!(q >= 0) || !g) return true;
  const jd = (g.memberJoinDates && g.memberJoinDates[mid]) ? String(g.memberJoinDates[mid]).slice(0, 10) : '';
  const cand = ((S0.lessons) || []).filter(function(l){
    if (!l || l.groupId !== g.id || l.status === 'cancelled') return false;
    if ((l.packageMonth || String(l.date || '').slice(0, 7)) !== pm) return false;
    if ((l.memberIds || []).includes(mid)) return true;
    if (l.status !== 'planned') return false;
    if ((l.excludedMemberIds || []).includes(mid)) return false;
    if (jd && String(l.date || '') < jd) return false;
    return true;
  }).length;
  return q < cand;
}
// Yeni grup dersinin OTOMATIK uyeleri: o ayin aktif kadrosu − kendi hakki olanlar (onlari Kerem secer)""")
rep("""    if (!present.has(mid) && __pm187 && __hasOwnHak187(mid, __pm187, st)) return false; // v187: kendi hakki olan uye — Kerem secer""",
"""    if (!present.has(mid) && __pm187 && __hasOwnHak187(mid, __pm187, st) && __ownHakNeedsChoice188(mid, g, __pm187, st)) return false; // v187: kendi hakki olan uye — Kerem secer · v188: hakki kalan derslerin hepsini karsiliyorsa otomatik""")
rep("""function __dropOwnHakFromPlanned187(g, mid, ay) {
  try {""",
"""function __dropOwnHakFromPlanned187(g, mid, ay) {
  try { // v188: hakki kalan derslerin HEPSINI karsiliyorsa secilecek bir sey yok → hepsine yazilir
    if (g && !__ownHakNeedsChoice188(mid, g, ay)) {
      syncGroupLessonsToRoster(g.id, ay);
      const __n188 = (state.lessons || []).filter(function(l){ return l && l.groupId === g.id && l.status === 'planned' && (l.packageMonth || String(l.date || '').slice(0, 7)) === ay && (l.memberIds || []).includes(mid); }).length;
      if (typeof plToast === 'function') { try { const m = state.members.find(function(x){ return x.id === mid; }); plToast('📅 ' + ((m && m.name) || 'Üye') + ' — kalan ' + __n188 + ' derse eklendi (hakkı ' + memberSessionsOverride(mid, ay) + ')', 6000); } catch(e) {} }
      return;
    }
  } catch(e) {}
  try {""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.10.04.110">', '<meta name="app-version" content="2026.10.04.111">')
rep("const APP_VERSION = '2026.10.04.110';", "const APP_VERSION = '2026.10.04.111';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v187-2026-10-04-110'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v188-2026-10-04-111'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
