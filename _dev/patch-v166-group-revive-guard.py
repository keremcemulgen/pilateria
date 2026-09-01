# -*- coding: utf-8 -*-
# v166 — Kerem (secenek 1, 2026-09-01): AYNI KADROYLA YENI GRUP ACILIRKEN KORUMA.
# VAKA: Temmuz paketi Agustos'a uzayan grup; uyeler Agustos'ta "aydan cikar" ile pasife alindi (uye
# kaydina yazilir, GRUP kaydinin temel kadrosu dokunulmaz). Eylul'de ayni 4 kisiyle yeni grup kurulunca
# uyeler yeniden aktif oldu, eski grup kaydi onlari hala kadrosunda saydigi icin "4 uye baska yerden
# bu gruba tasindi" uyarisi cikti (her satirda eski grubun adi kisaliyordu). Sonuc dogruydu ama
# kafa karistirici ve gereksiz: kisi ayni, grup ayni — yeni kayit yerine ESKI KAYIT aya tasinmali.
# v166 KURALI: saveGroup (yeni grup) → __findSameRosterGroup(kadro, ay): ayni KISI kumesiyle (2.paket
# klonlari koke katlanir) kadrosu olan grup varsa:
#   • o ay zaten AKTIFse → "zaten aktif; ayni ay 2. paket icin '+ N. Paket' kullan; yine de ayri grup?"
#     (Iptal → o grubun detayi acilir, yeni kayit ACILMAZ)
#   • degilse → "o grubu {ay} ayina tasiyayim mi?" (Evet → reviveGroupForMonth: pasiflik ay'da kapanir,
#     kadro ay'dan itibaren, uyeler aya kaydedilir, baska baglamlardan tasinir, form alanlari gruba
#     yazilir, ay paketi + otomatik dersler; yeni kayit ACILMAZ. Hayir → eski davranis)
# Her iki yol da geri alinabilir (v165 __undoSnapshot).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) yardimcilar (removeMemberFromOtherContexts'in hemen onune) ----------
rep("""function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };""",
"""// ===== v166 (Kerem, secenek 1): AYNI KADROYLA ZATEN GRUP VARSA yeni kayit acma — o kaydi aya tasi =====
// Grubun "son ayi": paket ayi / iptal olmayan ders ayi / dolu kadro anahtari — en buyugu.
function __groupLastMonth(g) {
  let last = '';
  ((g && g.packages) || []).forEach(function(p){ if (p && p.month && String(p.month) > last) last = String(p.month); });
  (state.lessons || []).forEach(function(l){ if (l && l.groupId === g.id && l.status !== 'cancelled') { const pm = l.packageMonth || String(l.date || '').slice(0, 7); if (pm > last) last = pm; } });
  Object.keys((g && g.monthlyMembers) || {}).forEach(function(k){ if ((g.monthlyMembers[k] || []).filter(Boolean).length && k > last) last = k; });
  return last;
}
// Verilen kadroyla (KISI kumesi; 2.paket klonu koke katlanir) ay'daki kadrosu AYNI olan grup.
// Tercih: kok grup (klon degil) > son ayi en yeni. Donus: { g, last, activeInAy } | null
function __findSameRosterGroup(memberIds, ay, excludeGid) {
  const want = {}; let n = 0;
  (memberIds || []).filter(Boolean).forEach(function(mid){ const p = personIdOf(mid); if (!want[p]) { want[p] = 1; n++; } });
  if (!n) return null;
  const cands = [];
  (state.groups || []).forEach(function(g){
    if (!g || g.id === excludeGid) return;
    const roster = (resolveGroupMembersForMonth(g, ay) || []).filter(Boolean);
    if (!roster.length) return;
    const have = {}; let k = 0, same = true;
    roster.forEach(function(mid){ const p = personIdOf(mid); if (!want[p]) same = false; if (!have[p]) { have[p] = 1; k++; } });
    if (!same || k !== n) return;
    cands.push({ g: g, last: __groupLastMonth(g), clone: !!g.secondOfGroup, activeInAy: !isGroupInactiveInMonth(g, ay) && activeGroupRosterForMonth(g, ay).length > 0 });
  });
  if (!cands.length) return null;
  cands.sort(function(a, b){ return (a.clone - b.clone) || (b.last > a.last ? 1 : (b.last < a.last ? -1 : 0)); });
  return cands[0];
}
// Grup pasifligini ay'da kapat (uyedeki donem modelinin aynisi): eski archived bayragi doneme donusur.
function __closeGroupArchiveAt(g, ay) {
  if (!g || !ay) return;
  if (g.archived) {
    const fromM = String(g.archivedAt || '').slice(0, 7);
    if (fromM && fromM < ay) { if (!Array.isArray(g.archivePeriods)) g.archivePeriods = []; g.archivePeriods.push({ from: fromM, to: ay }); }
    g.archived = false; delete g.archivedAt;
  }
  __closeArchivePeriodAt(g, ay);
}
// Mevcut grup kaydini ay'a tasir: yeni kayit acmadan ayni kayit devam eder.
function reviveGroupForMonth(gid, ay, memberIds, opts) {
  const g = state.groups.find(function(x){ return x.id === gid; });
  if (!g || !ay) return null;
  opts = opts || {};
  const ids = (memberIds || []).filter(Boolean);
  __undoSnapshot('Grubu aya taşı: ' + (groupDisplayName(g, ay) || g.name || 'Grup') + ' — ' + ay);
  __closeGroupArchiveAt(g, ay);
  applyRosterChange(g, ay, function(){ return ids.slice(); });
  ids.forEach(function(aid){
    const am = state.members.find(function(x){ return x.id === aid; });
    if (am && am.archived && typeof unarchiveMember === 'function') unarchiveMember(aid, ay);
    setMemberMonthly(aid, ay, { enrolled: true });
    if (am) __closeArchivePeriodAt(am, ay);
  });
  const notes = [];
  ids.forEach(function(mid){
    const r = removeMemberFromOtherContexts(mid, gid, ay);
    if (r.groups.length || r.individualLessons) {
      const m = state.members.find(function(x){ return x.id === mid; });
      const parts = [];
      if (r.groups.length) parts.push(r.groups.join(', '));
      if (r.individualLessons) parts.push(r.individualLessons + ' bireysel ders');
      notes.push('• ' + (m ? m.name : mid) + ': ' + parts.join(' + ') + ' → taşındı');
    }
  });
  // Formdaki alanlar gruba yazilir (kullanicinin bu ay icin gordugu/doldurdugu degerler)
  if (opts.size) g.size = opts.size;
  if (opts.defaultInstructorId) g.defaultInstructorId = opts.defaultInstructorId;
  if (opts.defaultPackageId) g.defaultPackageId = opts.defaultPackageId;
  if (opts.defaultTime) g.defaultTime = opts.defaultTime;
  if (opts.defaultDays && opts.defaultDays.length) g.defaultDays = opts.defaultDays.slice();
  if (opts.instructorShareRate !== undefined) g.instructorShareRate = opts.instructorShareRate; // null = varsayilan
  if (opts.memberInstructorRates && Object.keys(opts.memberInstructorRates).length) g.memberInstructorRates = Object.assign({}, g.memberInstructorRates || {}, opts.memberInstructorRates);
  if (opts.waGroupLink) g.waGroupLink = opts.waGroupLink;
  if (opts.customTotalPrice !== undefined) { if (opts.customTotalPrice === null || opts.customTotalPrice === '' || isNaN(+opts.customTotalPrice)) delete g.customTotalPrice; else g.customTotalPrice = +opts.customTotalPrice; }
  if (opts.note) { if (!g.monthlyNotes) g.monthlyNotes = {}; g.monthlyNotes[ay] = opts.note; }
  const typed = String(opts.name || '').trim();
  if (typed && typed !== autoGroupName(ids) && typed !== groupDisplayName(g, ay)) __setGroupMonthlyName(g, ay, typed); else __autoNameAfterRosterChange(g, ay);
  const start = (ay === currentMonth()) ? todayISO() : (ay + '-01');
  createGroupPackage(g, ay, start, { instructorShareRate: g.instructorShareRate, instructorId: g.defaultInstructorId });
  save();
  let autoMsg = '';
  const r = autoGenerateGroupLessons(gid, start);
  if (r.reason === 'no-schedule') autoMsg = '⚠️ Gün veya saat seçilmediği için otomatik ders oluşturulamadı. Grup detayından eklenebilir.';
  else if (r.created > 0) autoMsg = '✅ ' + r.created + ' ders otomatik olarak takvime eklendi' + (r.skipped ? ' (' + r.skipped + ' çakışma atlandı)' : '') + '.';
  save();
  return { g: g, notes: notes, autoMsg: autoMsg };
}
function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };""")

# ---------- 2) saveGroup: yeni grup yolunda koruma ----------
rep("""  const __gAy = (typeof window.__groupEditCtxMonth === 'string' && window.__groupEditCtxMonth) ? window.__groupEditCtxMonth : __groupOpsCtxMonth();
  const __baseline = (id && Array.isArray(window.__groupEditBaselineIds)) ? window.__groupEditBaselineIds.slice() : null;""",
"""  const __gAy = (typeof window.__groupEditCtxMonth === 'string' && window.__groupEditCtxMonth) ? window.__groupEditCtxMonth : __groupOpsCtxMonth();
  const __baseline = (id && Array.isArray(window.__groupEditBaselineIds)) ? window.__groupEditBaselineIds.slice() : null;
  // v166 (Kerem, secenek 1): AYNI KADROYLA ZATEN GRUP VARSA yeni kayit acma — o kaydi aya tasi
  if (isNewPreCheck && memberIds.length) {
    const __same = __findSameRosterGroup(memberIds, __gAy);
    if (__same) {
      const __nm = groupDisplayName(__same.g, __same.last || __gAy) || __same.g.name || 'Grup';
      const __ayLbl = pkgMonthLabel(__gAy);
      if (__same.activeInAy) {
        if (!confirm('ℹ️ Bu üyelerle «' + __nm + '» grubu ' + __ayLbl + ' ayında ZATEN AKTİF.\\n\\nAynı ay içinde ikinci paket için grup sayfasındaki "+ N. Paket" düğmesini kullanmalısın.\\n\\nYine de ayrı bir grup kaydı açılsın mı? (Üyeler eski gruptan bu yeni gruba taşınır.)')) {
          closeModal('modal-group'); openGroupDetail(__same.g.id, __gAy); return;
        }
      } else if (confirm('ℹ️ Bu üyelerle zaten «' + __nm + '» grubu var (son paket: ' + (__same.last ? pkgMonthLabel(__same.last) : '—') + ').\\n\\nYeni bir kayıt açmak yerine o grubu ' + __ayLbl + ' ayına taşıyayım mı?\\n\\n• Evet → aynı grup kaydı devam eder (geçmiş paketler ve dersler bir arada kalır), taşıma uyarısı çıkmaz.\\n• Hayır → ayrı yeni grup kaydı açılır.')) {
        const __r = reviveGroupForMonth(__same.g.id, __gAy, memberIds, {
          name: document.getElementById('mg-name').value.trim(), size: size, defaultInstructorId: defaultInstructorId, defaultPackageId: defaultPackageId,
          defaultTime: defaultTime, defaultDays: defaultDays, instructorShareRate: groupRate, memberInstructorRates: memberInstructorRates,
          waGroupLink: waLinkRaw, customTotalPrice: (customTotalRaw === '' ? null : customTotalPrice), note: document.getElementById('mg-note').value.trim()
        });
        closeModal('modal-group');
        renderGroups(); renderMembers(); renderCalendar(); renderDashboard();
        refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen();
        let __msg = '✅ «' + (groupDisplayName(__r.g, __gAy) || __nm) + '» grubu ' + __ayLbl + ' ayına taşındı — aynı kayıt devam ediyor, yeni kayıt açılmadı.';
        if (__r.notes.length) __msg += '\\n\\nℹ️ ' + __r.notes.length + ' üye başka yerden bu gruba taşındı:\\n' + __r.notes.join('\\n');
        if (__r.autoMsg) __msg += '\\n\\n' + __r.autoMsg;
        alert(__msg);
        return;
      }
    }
  }""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.01.88">', '<meta name="app-version" content="2026.09.01.89">')
rep("const APP_VERSION = '2026.09.01.88';", "const APP_VERSION = '2026.09.01.89';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v165-2026-09-01-88';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v166-2026-09-01-89';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
