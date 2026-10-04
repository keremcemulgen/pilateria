# -*- coding: utf-8 -*-
# v187 — (Kerem 2026-10-04: "Ben secmek isterim") GRUPTA KENDI DERS HAKKI OLAN UYE DERSLERE OTOMATIK YAZILMAZ.
# Grupta uyeye ozel hak (o ay sessionsOverride: elle hak / kalan derse gore hak / odeme penceresinde farkli ders sayisi)
# varsa uye grubun planli derslerine OTOMATIK eklenmez — Kerem hangi derslere girecegini ders penceresinden secer.
# Tek kaynak __hasOwnHak187(mid, pm): kadro senkronu (__applyRosterOverrides), yeni ders olusturma (otomatik, hizli ekle,
# toplu ders, ders penceresi on-secimi) bunu kullanir. Uyenin ZATEN yazili oldugu dersler aynen kalir (secimi korunur).
# Katilim sorusunda (kalan derse gore hak) "Evet" denirse uye o paketin planli derslerinden cikarilir → secimi Kerem yapar.
# Grup ders penceresinde "kendi hakkı N · M derste" rozeti.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep(r"""function __applyRosterOverrides(roster, l, g) {
  const excl = new Set((l && l.excludedMemberIds) || []);
  const present = new Set((l && l.memberIds) || []);
  const jmap = (g && g.memberJoinDates) || {};
  const ldate = (l && l.date) || '';
  return (roster || []).filter(mid => {
    if (excl.has(mid)) return false;""",
r"""// ===== v187 (Kerem: "ben secmek isterim"): grupta KENDI HAKKI olan uye derslere OTOMATIK yazilmaz =====
function __hasOwnHak187(mid, pm, st) {
  const mm = (((st || state).members) || []).find(function(x){ return x && x.id === mid; });
  const o = mm && mm.monthly && pm && mm.monthly[pm];
  return !!(o && o.sessionsOverride !== undefined && o.sessionsOverride !== null && o.sessionsOverride !== '');
}
// Yeni grup dersinin OTOMATIK uyeleri: o ayin aktif kadrosu − kendi hakki olanlar (onlari Kerem secer)
function __groupAutoMembers187(g, pm, st) {
  return activeGroupRosterForMonth(g, pm, st).filter(function(mid){ return !__hasOwnHak187(mid, pm, st); });
}
function __applyRosterOverrides(roster, l, g, st) {
  const excl = new Set((l && l.excludedMemberIds) || []);
  const present = new Set((l && l.memberIds) || []);
  const jmap = (g && g.memberJoinDates) || {};
  const ldate = (l && l.date) || '';
  const __pm187 = (l && (l.packageMonth || String(l.date || '').slice(0, 7))) || '';
  return (roster || []).filter(mid => {
    if (excl.has(mid)) return false;
    if (!present.has(mid) && __pm187 && __hasOwnHak187(mid, __pm187, st)) return false; // v187: kendi hakki olan uye — Kerem secer""")
rep(r"""        roster = __applyRosterOverrides(roster, l, gg); // v54""",
r"""        roster = __applyRosterOverrides(roster, l, gg, s); // v54""")
# yeni ders olusturma yollari
rep(r"""      memberIds: activeGroupRosterForMonth(g, (ctxMonth || String(date||todayISO()).slice(0,7))), groupId: groupId, note:'', // v163: o ayin kadrosu""",
r"""      memberIds: __groupAutoMembers187(g, (ctxMonth || String(date||todayISO()).slice(0,7))), groupId: groupId, note:'', // v163: o ayin kadrosu · v187: kendi hakki olan secilmez""")
rep(r"""  renderLessonMembersCheckboxes(activeGroupRosterForMonth(g, __apm)); // v57: preselect = o ayin AKTIF kadrosu""",
r"""  renderLessonMembersCheckboxes(__groupAutoMembers187(g, __apm)); // v57: preselect = o ayin AKTIF kadrosu · v187: kendi hakki olan isaretsiz""")
rep(r"""            memberIds: activeGroupRosterForMonth(g, packageMonth), // v163: paket ayinin kadrosu""",
r"""            memberIds: __groupAutoMembers187(g, packageMonth), // v163: paket ayinin kadrosu · v187""")
rep(r"""  const mids = activeGroupRosterForMonth(g, ctxMonth || String(dISO).slice(0,7)); // v163: o ayin aktif kadrosu (ham memberIds degil)""",
r"""  const mids = __groupAutoMembers187(g, ctxMonth || String(dISO).slice(0,7)); // v163: o ayin aktif kadrosu · v187: kendi hakki olan secilmez""")
rep(r"""        newLesson.memberIds = activeGroupRosterForMonth(g, packageMonth); // v57 KOK FIX: bayat g.memberIds DEGIL, o ayin AKTIF kadrosu""",
r"""        newLesson.memberIds = __groupAutoMembers187(g, packageMonth); // v57 KOK FIX · v187: kendi hakki olan secilmez""")
# katilim sorusu "Evet": uye o paketin planli derslerinden cikar (secimi Kerem yapar)
rep(r"""          setMemberMonthly(it.mid, it.ay, { sessionsOverride: kalan });""",
r"""          setMemberMonthly(it.mid, it.ay, { sessionsOverride: kalan });
          __dropOwnHakFromPlanned187(g, it.mid, it.ay); // v187""")
rep(r"""        setMemberMonthly(it.mid, it.ay, { totalPrice: price, __prorata: true, sessionsOverride: kalan });""",
r"""        setMemberMonthly(it.mid, it.ay, { totalPrice: price, __prorata: true, sessionsOverride: kalan });
        __dropOwnHakFromPlanned187(g, it.mid, it.ay); // v187: kalan derse gore hak → derslerini Kerem secer""")
rep(r"""function __queueJoinOffer(g, memberId, ay) {""",
r"""// v187: kendi hakki atanan uye o paketin PLANLI derslerinden cikar (otomatik yazilmisti) — Kerem ders penceresinden secer
function __dropOwnHakFromPlanned187(g, mid, ay) {
  try {
    (state.lessons || []).forEach(function(l){
      if (!l || !g || l.groupId !== g.id || l.status !== 'planned') return;
      if ((l.packageMonth || String(l.date || '').slice(0, 7)) !== ay) return;
      if ((l.memberIds || []).includes(mid)) l.memberIds = l.memberIds.filter(function(x){ return x !== mid; });
    });
    if (typeof plToast === 'function') { try { const m = state.members.find(function(x){ return x.id === mid; }); plToast('📅 ' + ((m && m.name) || 'Üye') + ' — hangi derslere gireceğini ders penceresinden seç (kendi hakkı var)', 6000); } catch(e) {} }
  } catch(e) {}
}
function __queueJoinOffer(g, memberId, ay) {""")
# grup ders penceresi rozeti
rep(r"""      + `<span>${escapeHtml(nm)}</span>${left ? ' <span class="badge" style="font-size:10px;background:var(--danger);color:#fff;">ayrıldı</span>' : ''}${outside ? ' <span class="badge warn" style="font-size:10px;">kadro dışı</span>' : ''}</label>`;""",
r"""      + `<span>${escapeHtml(nm)}</span>${left ? ' <span class="badge" style="font-size:10px;background:var(--danger);color:#fff;">ayrıldı</span>' : ''}${outside ? ' <span class="badge warn" style="font-size:10px;">kadro dışı</span>' : ''}${(function(){ const __pmB = l.packageMonth || String(l.date || '').slice(0, 7); if (!__hasOwnHak187(mid, __pmB)) return ''; const __q = memberSessionsOverride(mid, __pmB); const __n = (state.lessons || []).filter(function(x){ return x && x.groupId === g.id && x.status !== 'cancelled' && (x.packageMonth || String(x.date || '').slice(0, 7)) === __pmB && (x.memberIds || []).includes(mid); }).length; return ' <span class="badge" style="font-size:10px;background:#eef2f7;color:#3a4a5a;" title="Kendi ders hakkı var — derslere otomatik yazılmaz, sen seçersin">kendi hakkı ' + __q + ' · ' + __n + ' derste</span>'; })()}</label>`;""")

rep('<meta name="app-version" content="2026.10.04.109">', '<meta name="app-version" content="2026.10.04.110">')
rep("const APP_VERSION = '2026.10.04.109';", "const APP_VERSION = '2026.10.04.110';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v186-2026-10-04-109'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v187-2026-10-04-110'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
