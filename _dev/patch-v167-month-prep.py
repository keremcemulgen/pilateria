# -*- coding: utf-8 -*-
# v167 — Kerem (secenek 2, 2026-09-01): "YENI AY HAZIRLIGI" — ay gecisi TEK EKRANDA.
# Bugune kadar ay donumu dagitik akislarla yapiliyordu (Aya Uye Ekle, Paket Uzadi, aydan cikar, yeni
# grup...) ve her adim ayri yerde/ayri kuralla oldugu icin hatalar cikti (mukerrer grup, tasima uyarisi,
# rozet farki). v167: Uyeler sayfasindaki "🗓️ Yeni Ay Hazirligi" dugmesi (ve bos-ay ekrani) hedef ay T
# icin kaynak ay S=T-1'in her birimini (S'te aktif gruplar + gruba dahil olmayan bireysel uyeler) listeler;
# her birim icin T durumu (Devam ediyor / Paket Uzadi / Pasif / Kismen / Karar bekliyor) ve uc islem:
#   ▶ Devam   : grup → ayni kayit, S'teki aktif kadro T'den itibaren; uyeler T'ye kayitli (S fiyat
#               override'i > 0 ise kopyalanir; paket uzamasindan gelen 0 kopyalanmaz); grup T'de pasifse
#               pasiflik T'de kapanir; daha once "Uzadi" isaretlendiyse geri alinir (fiyat varsayilana)
#   📌 Uzadı  : Devam + T paketi 'extended' (0 TL, not) — mevcut markGroup/MemberPackageExtended cekirdegi
#   ⏸ Pasif   : grup → T'den baslayan arsiv donemi + uyeler T'den cikarilir (aydan cikar cekirdegi);
#               uye → aydan cikar cekirdegi (onay penceresi yok, tek yedekle geri alinabilir)
#   "Bekleyenlerin hepsi devam etsin" toplu islem.
# Her islem v165 __undoSnapshot ile geri alinabilir. removeMemberFromMonth ve mark*PackageExtended
# cekirdek/kabuk olarak ayrildi (davranis AYNI; cekirdek onaysiz/yedeksiz cagrilabilir).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) removeMemberFromMonth → kabuk + cekirdek ----------
rep("""  __undoSnapshot((m.name || 'Üye') + ' — ' + monthISO + ' ayından çıkar'); // v165
  // v45 CARRY-FORWARD: monthISO'dan itibaren ACIK arsiv donemi — geri alana kadar sonraki aylarda da pasif
  if (!Array.isArray(m.archivePeriods)) m.archivePeriods = [];""",
"""  __undoSnapshot((m.name || 'Üye') + ' — ' + monthISO + ' ayından çıkar'); // v165
  __removeMemberFromMonthCore(memberId, monthISO); // v167: cekirdek (onaysiz) — Yeni Ay Hazirligi da kullanir
  save();
  if (typeof renderMembers === 'function') renderMembers();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderGroups === 'function') renderGroups();
  if (typeof renderCalendar === 'function') renderCalendar(); // v41: dersler de guncellendi
  return true;
}
// v167: onay/yedek/kayit/render OLMADAN cekirdek — davranis removeMemberFromMonth ile birebir ayni
function __removeMemberFromMonthCore(memberId, monthISO) {
  const m = state.members.find(x=>x.id===memberId);
  if (!m || !monthISO) return false;
  // v45 CARRY-FORWARD: monthISO'dan itibaren ACIK arsiv donemi — geri alana kadar sonraki aylarda da pasif
  if (!Array.isArray(m.archivePeriods)) m.archivePeriods = [];""")
rep("""    return activeGroupRosterForMonth(gg, __pm, state, true).length > 0;
  });
  save();
  if (typeof renderMembers === 'function') renderMembers();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderGroups === 'function') renderGroups();
  if (typeof renderCalendar === 'function') renderCalendar(); // v41: dersler de guncellendi
  return true;
}""",
"""    return activeGroupRosterForMonth(gg, __pm, state, true).length > 0;
  });
  return true;
}""")

# ---------- 2) Paket Uzadi cekirdekleri ----------
rep("""async function markGroupPackageExtended(groupId, monthISO, mark) {
  const g = state.groups.find(x => x.id === groupId);
  if (!g || !monthISO) return;""",
"""// v167: "Paket uzadi" CEKIRDEGI (onay/not penceresi/yedek yok) — kabuk ve Yeni Ay Hazirligi ayni kurali kullanir
function __groupPackageExtendCore(g, monthISO, note) {
  if (!g || !monthISO) return null;
  let pkg = (g.packages||[]).find(p => p.month === monthISO);
  if (!pkg) pkg = createGroupPackage(g, monthISO, monthISO + '-01', { price: 0 });
  pkg.status = 'extended';
  pkg.price = 0;
  pkg.extendedNote = String(note || '');
  try { resolveGroupMembersForMonth(g, monthISO).forEach(function(mid){ if (!mid) return; const mm = state.members.find(function(x){return x.id===mid;}); const cur = mm && mm.monthly && mm.monthly[monthISO]; if (cur && cur.totalPrice !== undefined && cur.totalPrice !== null && cur.totalPrice !== '' && !cur.__extZero) return; setMemberMonthly(mid, monthISO, { totalPrice: 0, __extZero: true }); }); } catch(e) {}
  return pkg;
}
function __memberPackageExtendCore(m, monthISO, note) {
  if (!m || !monthISO) return null;
  let pkg = (m.packages||[]).find(p => p.month === monthISO);
  if (!pkg) pkg = createMemberPackage(m, monthISO, monthISO + '-01', { price: 0 });
  pkg.status = 'extended';
  pkg.price = 0;
  pkg.extendedNote = String(note || '');
  setMemberMonthly(m.id, monthISO, { totalPrice: 0, extendedNote: pkg.extendedNote });
  return pkg;
}
async function markGroupPackageExtended(groupId, monthISO, mark) {
  const g = state.groups.find(x => x.id === groupId);
  if (!g || !monthISO) return;""")
rep("""    __undoSnapshot('Paket uzadı: ' + groupDisplayName(g, monthISO) + ' — ' + monthISO); // v165
    pkg.status = 'extended';
    pkg.price = 0;
    pkg.extendedNote = note;
    // v131 (v122 notu): UYE-AY IKIZI — uyelerin o ayki fiyat override'i da 0'lanir (markMemberPackageExtended
    // bunu zaten yapiyordu, grup surumu yapmiyordu); yoksa "paket uzadi (0 TL)" derken uyeden hala para istenir.
    // __extZero bayragi geri almayi guvenli kilar: yalniz bizim koydugumuz 0'lar silinir.
    try { resolveGroupMembersForMonth(g, monthISO).forEach(function(mid){ if (!mid) return; const mm = state.members.find(function(x){return x.id===mid;}); const cur = mm && mm.monthly && mm.monthly[monthISO]; if (cur && cur.totalPrice !== undefined && cur.totalPrice !== null && cur.totalPrice !== '' && !cur.__extZero) return; setMemberMonthly(mid, monthISO, { totalPrice: 0, __extZero: true }); }); } catch(e) {}
  } else {""",
"""    __undoSnapshot('Paket uzadı: ' + groupDisplayName(g, monthISO) + ' — ' + monthISO); // v165
    // v131 (v122 notu): UYE-AY IKIZI — uyelerin o ayki fiyat override'i da 0'lanir; __extZero bayragi geri
    // almayi guvenli kilar (yalniz bizim koydugumuz 0'lar silinir). v167: cekirdege tasindi.
    __groupPackageExtendCore(g, monthISO, note);
  } else {""")
rep("""    __undoSnapshot('Paket uzadı: ' + (m.name || 'Üye') + ' — ' + monthISO); // v165
    pkg.status = 'extended';
    pkg.price = 0;
    pkg.extendedNote = note;
    // Aylık fiyat override'ı da güncelle
    setMemberMonthly(memberId, monthISO, { totalPrice: 0, extendedNote: note });
  } else {""",
"""    __undoSnapshot('Paket uzadı: ' + (m.name || 'Üye') + ' — ' + monthISO); // v165
    __memberPackageExtendCore(m, monthISO, note); // v167: cekirdek (aylik fiyat override'i da 0'lanir)
  } else {""")

# ---------- 3) Yeni Ay Hazirligi motoru (removeMemberFromOtherContexts bloğunun onune, v166 yardimcilarindan sonra) ----------
rep("""function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };""",
"""// ===== v167 (Kerem, secenek 2): YENI AY HAZIRLIGI — ay gecisi tek ekranda =====
var __prepMonth = '';
function __prepShiftMonth(ym, d) { const p = String(ym).split('-').map(Number); const dt = new Date(p[0], p[1] - 1 + d, 1); return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); }
function __prepLabel(ay) { try { return pkgMonthLabel(ay) || ay; } catch(e) { return ay; } }
// S ayinin birimleri: S'te aktif (klon olmayan) gruplar + S'te kayitli, gruba dahil olmayan (klon olmayan) uyeler
function __prepUnits(T) {
  const S = prevMonthISO(T);
  const units = [];
  (state.groups || []).forEach(function(g){
    if (!g || g.secondOfGroup) return;
    if (isGroupInactiveInMonth(g, S)) return;
    const roster = activeGroupRosterForMonth(g, S);
    if (!roster.length) return;
    // tamami 2.paket klonu olan grup (eski "+2. Paket" akisi): klon sonraki aya MIRAS almaz (v58) — birim degil
    if (roster.every(function(mid){ const mm = state.members.find(function(x){ return x.id === mid; }); return !!(mm && mm.secondOfMember); })) return;
    units.push({ kind: 'group', id: g.id, name: groupDisplayName(g, S) || g.name || 'Grup', members: roster.slice(), g: g });
  });
  (state.members || []).forEach(function(m){
    if (!m || m.secondOfMember) return;
    if (!isMemberEnrolledInMonth(m.id, S)) return;
    if (memberActiveGroupForMonth(m.id, S)) return;
    units.push({ kind: 'member', id: m.id, name: m.name || 'Üye', members: [m.id], m: m });
  });
  units.sort(function(a, b){ return (a.kind === b.kind ? 0 : (a.kind === 'group' ? -1 : 1)) || String(a.name).localeCompare(String(b.name), 'tr'); });
  return { S: S, units: units };
}
// T'de ACIKCA cikarilmis mi (enrolled:false / T'yi kapsayan arsiv donemi / eski archived bayragi)
function __prepMemberOut(m, T) {
  if (!m) return false;
  const mo = (m.monthly || {})[T];
  if (mo && mo.enrolled === false) return true;
  for (const per of (m.archivePeriods || [])) { const f = String((per && per.from) || '').slice(0, 7); const t = (per && per.to) ? String(per.to).slice(0, 7) : null; if (f && T >= f && (!t || T < t)) return true; }
  if (m.archived) { const a = String(m.archivedAt || '').slice(0, 7); if (!a || T >= a) return true; }
  return false;
}
// Birimin T durumu: 'extended' | 'active' | 'partial' | 'passive' | 'pending'
function __prepStatus(u, T) {
  if (u.kind === 'group') {
    const g = u.g;
    if (isGroupInactiveInMonth(g, T)) return 'passive';
    const act = activeGroupRosterForMonth(g, T);
    const pkg = (g.packages || []).find(function(p){ return p && p.month === T; });
    if (act.length && pkg && pkg.status === 'extended') return 'extended';
    if (!act.length) { return u.members.every(function(mid){ return __prepMemberOut(state.members.find(function(x){ return x.id === mid; }), T); }) ? 'passive' : 'pending'; }
    const settled = u.members.every(function(mid){ return act.includes(mid) || __prepMemberOut(state.members.find(function(x){ return x.id === mid; }), T); });
    return settled ? 'active' : 'partial';
  }
  const m = u.m;
  if (isMemberEnrolledInMonth(m.id, T)) { const pkg = (m.packages || []).find(function(p){ return p && p.month === T; }); return (pkg && pkg.status === 'extended') ? 'extended' : 'active'; }
  if (__prepMemberOut(m, T)) return 'passive';
  return 'pending';
}
// S paketinin ders ozeti (yapildi / yandi / planli / hak)
function __prepLessonStats(u, S) {
  let done = 0, missed = 0, planned = 0;
  (state.lessons || []).forEach(function(l){
    if (!l) return;
    const pm = l.packageMonth || String(l.date || '').slice(0, 7);
    if (pm !== S) return;
    if (u.kind === 'group') { if (l.groupId !== u.id) return; }
    else { if (l.groupId || !(l.memberIds || []).includes(u.id)) return; }
    if (l.status === 'completed') done++; else if (l.status === 'missed') missed++; else if (l.status === 'planned') planned++;
  });
  let sessions = 0;
  try { const p = u.kind === 'group' ? groupPackageForMonth(u.g, S) : memberPackageForMonth(u.m, S); sessions = (p && p.month === S && +p.sessions) || 0; } catch(e) {}
  return { done: done, missed: missed, planned: planned, sessions: sessions };
}
// --- cekirdek islemler (onay/yedek/kayit yok) ---
function __prepContinueMemberCore(mid, S, T) {
  const m = state.members.find(function(x){ return x.id === mid; });
  if (!m) return;
  if (m.archived && typeof unarchiveMember === 'function') unarchiveMember(mid, T);
  const rec = { enrolled: true };
  const ov = (m.monthly || {})[S], cur = (m.monthly || {})[T];
  const curHas = !!(cur && cur.totalPrice !== undefined && cur.totalPrice !== null && cur.totalPrice !== '');
  if (ov && ov.totalPrice !== undefined && ov.totalPrice !== null && ov.totalPrice !== '' && +ov.totalPrice > 0 && !ov.__extZero && !curHas) rec.totalPrice = +ov.totalPrice; // S fiyati devam (uzama 0'i kopyalanmaz)
  setMemberMonthly(mid, T, rec);
  __closeArchivePeriodAt(m, T);
  // daha once T'de "uzadi" isaretlendiyse geri al (fiyat varsayilana)
  const pkg = (m.packages || []).find(function(p){ return p && p.month === T; });
  if (pkg && pkg.status === 'extended') {
    pkg.status = 'active'; delete pkg.extendedNote;
    const dp = (state.packageTypes || []).find(function(p){ return p.id === (m.defaultPackageId || ''); }) || (state.packageTypes || [])[0] || { price: 0 };
    pkg.price = m.totalPrice ? +m.totalPrice : (+dp.price || 0);
    const mo = (m.monthly || {})[T];
    if (mo && (mo.__extZero || (mo.extendedNote !== undefined && +mo.totalPrice === 0))) { delete mo.totalPrice; delete mo.__extZero; delete mo.extendedNote; }
  }
  if (T >= ROSTER_START_MONTH) { if (!state.monthInit) state.monthInit = {}; state.monthInit[T] = true; }
}
function __prepContinueGroupCore(g, S, T) {
  const roster = activeGroupRosterForMonth(g, S);
  __closeGroupArchiveAt(g, T);
  const curT = (resolveGroupMembersForMonth(g, T) || []).filter(Boolean);
  const same = curT.length === roster.length && roster.every(function(x){ return curT.includes(x); });
  if (!same) applyRosterChange(g, T, function(){ return roster.slice(); });
  roster.forEach(function(mid){ __prepContinueMemberCore(mid, S, T); });
  const pkg = (g.packages || []).find(function(p){ return p && p.month === T; });
  if (pkg && pkg.status === 'extended') { // daha once "uzadi" denmisse geri al
    pkg.status = 'active'; delete pkg.extendedNote;
    const dp = (state.packageTypes || []).find(function(p){ return p.id === g.defaultPackageId; }) || (state.packageTypes || [])[0] || { price: 0 };
    pkg.price = (g.customTotalPrice !== undefined && g.customTotalPrice !== null && g.customTotalPrice !== '') ? +g.customTotalPrice : (+dp.price || 0);
    roster.forEach(function(mid){ const mm = state.members.find(function(x){ return x.id === mid; }); const cur = mm && mm.monthly && mm.monthly[T]; if (cur && cur.__extZero) { delete cur.totalPrice; delete cur.__extZero; } });
  }
  try { syncGroupLessonsToRoster(g.id, T); } catch(e) {}
}
function __prepPassiveGroupCore(g, S, T) {
  const roster = activeGroupRosterForMonth(g, S);
  if (!isGroupInactiveInMonth(g, T)) { if (!Array.isArray(g.archivePeriods)) g.archivePeriods = []; g.archivePeriods.push({ from: T, to: null }); }
  roster.forEach(function(mid){ __removeMemberFromMonthCore(mid, T); });
  (state.lessons || []).forEach(function(l){ if (l && l.groupId === g.id && l.status === 'planned' && (l.packageMonth || String(l.date || '').slice(0, 7)) >= T) l.status = 'cancelled'; });
}
function __prepAfterChange() {
  save();
  renderMonthPrep();
  try { renderMembers(); renderGroups(); renderDashboard(); renderCalendar(); if (typeof renderArchive === 'function') renderArchive(); } catch(e) {}
  try { refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {}
}
async function prepAction(kind, id, action) {
  const T = __prepMonth; if (!T) return;
  const S = prevMonthISO(T);
  const g = kind === 'group' ? state.groups.find(function(x){ return x.id === id; }) : null;
  const m = kind === 'member' ? state.members.find(function(x){ return x.id === id; }) : null;
  if (!g && !m) return;
  const name = g ? (groupDisplayName(g, S) || g.name || 'Grup') : (m.name || 'Üye');
  if (action === 'extend') {
    const note = await plPrompt('Paket uzaması nedeni / notu (opsiyonel):', 'Paket geçen aydan sarktı, bu ay ücret alınmadı.');
    if (note === null) return;
    __undoSnapshot('Yeni ay — Paket uzadı: ' + name + ' — ' + T);
    if (g) { __prepContinueGroupCore(g, S, T); __groupPackageExtendCore(g, T, note); }
    else { __prepContinueMemberCore(id, S, T); __memberPackageExtendCore(m, T, note); }
  } else if (action === 'continue') {
    __undoSnapshot('Yeni ay — Devam: ' + name + ' — ' + T);
    if (g) __prepContinueGroupCore(g, S, T); else __prepContinueMemberCore(id, S, T);
  } else if (action === 'passive') {
    __undoSnapshot('Yeni ay — Pasif: ' + name + ' — ' + T);
    if (g) __prepPassiveGroupCore(g, S, T); else __removeMemberFromMonthCore(id, T);
  } else return;
  __prepAfterChange();
}
function prepAllContinue() {
  const T = __prepMonth; if (!T) return;
  const S = prevMonthISO(T);
  const pend = __prepUnits(T).units.filter(function(u){ return __prepStatus(u, T) === 'pending'; });
  if (!pend.length) { alert('Karar bekleyen birim yok.'); return; }
  const ng = pend.filter(function(u){ return u.kind === 'group'; }).length;
  if (!confirm(pend.length + ' birim (' + ng + ' grup, ' + (pend.length - ng) + ' bireysel) ' + __prepLabel(T) + ' ayında DEVAM olarak işaretlenecek.\\n\\n• Aynı kayıt, aynı kadro; üyeler ' + __prepLabel(T) + ' listesine alınır.\\n• Geri Al ile tek seferde geri alınabilir.\\n\\nDevam?')) return;
  __undoSnapshot('Yeni ay — Bekleyenler devam (' + pend.length + ') — ' + T);
  pend.forEach(function(u){ if (u.kind === 'group') __prepContinueGroupCore(u.g, S, T); else __prepContinueMemberCore(u.id, S, T); });
  __prepAfterChange();
  if (typeof plToast === 'function') { try { plToast('✅ ' + pend.length + ' birim ' + __prepLabel(T) + ' ayında devam ediyor'); } catch(e) {} }
}
function openMonthPrep(T) {
  let ay = T || ((document.getElementById('member-month') || {}).value || '') || currentMonth();
  let rsm; try { rsm = ROSTER_START_MONTH; } catch(e) { rsm = '2026-08'; }
  if (ay < rsm) ay = currentMonth();
  __prepMonth = ay;
  renderMonthPrep();
  openModal('modal-month-prep');
}
function setMonthPrepMonth(v) { if (v) { __prepMonth = v; renderMonthPrep(); } }
function renderMonthPrep() {
  const box = document.getElementById('month-prep-body'); if (!box) return;
  const T = __prepMonth || currentMonth(), S = prevMonthISO(T);
  const res = __prepUnits(T), units = res.units;
  const cm = currentMonth(), opts = [];
  const vals = []; for (let d = -1; d <= 3; d++) vals.push(__prepShiftMonth(cm, d));
  if (vals.indexOf(T) === -1) vals.push(T); vals.sort();
  vals.forEach(function(v){ opts.push('<option value="' + v + '"' + (v === T ? ' selected' : '') + '>' + escapeHtml(__prepLabel(v)) + '</option>'); });
  const ST = {
    active:   { l: '✅ Devam ediyor',  c: '#5A7050', b: '#e8f0e0' },
    extended: { l: '📌 Paket uzadı',   c: '#8a6d1d', b: '#fff3cd' },
    passive:  { l: '⏸ Pasif',          c: '#8a8573', b: '#f5f0e0' },
    partial:  { l: '⚠️ Kısmen',        c: '#b5651d', b: '#fdebd0' },
    pending:  { l: '⏳ Karar bekliyor', c: '#6B8DB0', b: '#e3f2fd' }
  };
  const counts = { active: 0, extended: 0, passive: 0, partial: 0, pending: 0 };
  const rows = units.map(function(u){
    const st = __prepStatus(u, T); counts[st]++;
    const s = ST[st] || ST.pending;
    const ls = __prepLessonStats(u, S);
    let sub = '';
    if (u.kind === 'group') sub = u.members.map(function(mid){ return escapeHtml(memberName(mid)); }).join(' · ');
    const lsTxt = __prepLabel(S) + ': ' + ((!ls.sessions && !ls.done && !ls.missed && !ls.planned) ? 'ders kaydı yok' : (ls.done + '/' + (ls.sessions || '?') + ' ders yapıldı' + (ls.missed ? ', ' + ls.missed + ' yandı' : '') + (ls.planned ? ', ' + ls.planned + ' planlı' : '')));
    let extra = '';
    if (st === 'active' && u.kind === 'group') { const act = activeGroupRosterForMonth(u.g, T); if (act.length !== u.members.length) extra = ' (' + act.length + '/' + u.members.length + ')'; }
    if (st === 'partial' && u.kind === 'group') { const act = activeGroupRosterForMonth(u.g, T); extra = ' (' + act.length + '/' + u.members.length + ' kayıtlı)'; }
    const b = function(action, label, title, on) { return '<button class="btn small ' + (on ? '' : 'secondary') + '" onclick="prepAction(\\'' + u.kind + '\\',\\'' + u.id + '\\',\\'' + action + '\\')" title="' + title + '">' + label + '</button>'; };
    return '<div class="prep-row" data-kind="' + u.kind + '" data-id="' + u.id + '" data-status="' + st + '" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 6px;border-bottom:1px solid var(--border);">' +
      '<div style="flex:1;min-width:220px;"><div style="font-weight:700;">' + (u.kind === 'group' ? '👥 ' : '👤 ') + escapeHtml(u.name) + '</div>' + (sub ? '<div style="font-size:12px;color:var(--muted);">' + sub + '</div>' : '') + '<div style="font-size:12px;color:var(--muted);">' + escapeHtml(lsTxt) + '</div></div>' +
      '<div style="min-width:150px;"><span class="badge prep-status" style="background:' + s.b + ';color:' + s.c + ';">' + s.l + extra + '</span></div>' +
      '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
        b('continue', '▶ Devam', 'Aynı kayıt, aynı kadro — ' + __prepLabel(T) + ' listesine alınır', st === 'active') +
        b('extend', '📌 Uzadı', 'Paket geçen aydan sarktı, bu ay ücret alınmaz (0 ₺)', st === 'extended') +
        b('passive', '⏸ Pasif', __prepLabel(T) + ' ayından itibaren listeden düşer (geçmiş korunur)', st === 'passive') +
      '</div></div>';
  });
  const ng = units.filter(function(u){ return u.kind === 'group'; }).length;
  box.innerHTML =
    '<div class="row" style="align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">' +
      '<div>Kaynak ay: <b>' + escapeHtml(__prepLabel(S)) + '</b> → Hedef ay: <select id="month-prep-month" style="width:auto;display:inline-block;min-width:150px;" onchange="setMonthPrepMonth(this.value)">' + opts.join('') + '</select></div>' +
      '<button class="btn small" onclick="prepAllContinue()"' + (counts.pending ? '' : ' disabled') + ' title="Karar bekleyen tüm birimleri DEVAM olarak işaretle">▶ Bekleyenlerin hepsi devam etsin (' + counts.pending + ')</button>' +
    '</div>' +
    '<div id="month-prep-summary" style="font-size:13px;color:var(--muted);margin-bottom:8px;">' + units.length + ' birim (' + ng + ' grup · ' + (units.length - ng) + ' bireysel) — ✅ Devam ' + counts.active + ' · 📌 Uzadı ' + counts.extended + ' · ⏸ Pasif ' + counts.passive + (counts.partial ? ' · ⚠️ Kısmen ' + counts.partial : '') + ' · ⏳ Bekleyen ' + counts.pending + '</div>' +
    (rows.length ? '<div style="max-height:60vh;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:0 6px;">' + rows.join('') + '</div>'
                 : '<div class="empty" style="padding:22px;">' + escapeHtml(__prepLabel(S)) + ' ayında aktif grup/üye yok — hazırlanacak bir şey yok.</div>');
}
function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };""")

# ---------- 4) arayuz: modal + dugmeler ----------
rep("""<div class="modal-bg" id="modal-batch-dates">""",
"""<div class="modal-bg" id="modal-month-prep">
  <div class="modal" style="max-width:940px;">
    <div class="row between">
      <h2 style="margin:0;">🗓️ Yeni Ay Hazırlığı</h2>
      <button class="btn secondary small" onclick="closeModal('modal-month-prep')">Kapat</button>
    </div>
    <div style="padding:8px 12px;background:#fff8e1;border-radius:6px;font-size:13px;color:#8a7b20;margin:10px 0;">
      💡 Geçen ayın her grubu ve bireysel üyesi için bu ay ne olacağına tek ekrandan karar ver: <b>▶ Devam</b> (aynı kayıt, aynı kadro — yeni grup açma), <b>📌 Uzadı</b> (paket geçen aydan sarktı, bu ay ücret yok) veya <b>⏸ Pasif</b> (bu aydan itibaren listeden düşer, geçmiş korunur). Her adım ↩️ Geri Al ile geri alınabilir.
    </div>
    <div id="month-prep-body"></div>
  </div>
</div>
<div class="modal-bg" id="modal-batch-dates">""")

rep("""      <button class="btn secondary" id="month-add-btn" style="display:none;" onclick="openMonthAddPicker((document.getElementById('member-month')||{}).value||'')" title="Seçili aya üye ekle (yalnız o ay etkilenir)">🗓️+ Aya Üye Ekle</button>""",
"""      <button class="btn secondary" id="month-add-btn" style="display:none;" onclick="openMonthAddPicker((document.getElementById('member-month')||{}).value||'')" title="Seçili aya üye ekle (yalnız o ay etkilenir)">🗓️+ Aya Üye Ekle</button>
      <button class="btn secondary pl-owner-only" id="month-prep-btn" onclick="openMonthPrep((document.getElementById('member-month')||{}).value||'')" title="Geçen ayın grup ve üyeleri için seçili ay: Devam / Paket Uzadı / Pasif — tek ekranda">🗓️ Yeni Ay Hazırlığı</button>""")

rep("""          <button class="btn secondary" onclick="initMonthEmpty('${monthISO}')">🆕 Boş başla</button>""",
"""          <button class="btn secondary" onclick="initMonthEmpty('${monthISO}')">🆕 Boş başla</button>
          <button class="btn secondary pl-owner-only" onclick="openMonthPrep('${monthISO}')">🗓️ Yeni Ay Hazırlığı (tek tek karar ver)</button>""")
rep("""          <button class="btn secondary" style="width:100%;" onclick="initMonthEmpty('${monthISO}')">🆕 Boş başla</button>""",
"""          <button class="btn secondary" style="width:100%;margin-bottom:8px;" onclick="initMonthEmpty('${monthISO}')">🆕 Boş başla</button>
          <button class="btn secondary pl-owner-only" style="width:100%;" onclick="openMonthPrep('${monthISO}')">🗓️ Yeni Ay Hazırlığı</button>""")

# undoLast: acik hazirlik penceresi de tazelensin
rep("""  ['modal-member-detail','modal-group-detail','modal-group','modal-member','modal-payment','modal-lesson','modal-batch-dates'].forEach(function(id){ try { var el = document.getElementById(id); if (el && el.classList.contains('open')) closeModal(id); } catch(e) {} });""",
"""  ['modal-member-detail','modal-group-detail','modal-group','modal-member','modal-payment','modal-lesson','modal-batch-dates'].forEach(function(id){ try { var el = document.getElementById(id); if (el && el.classList.contains('open')) closeModal(id); } catch(e) {} });
  try { var __mp = document.getElementById('modal-month-prep'); if (__mp && __mp.classList.contains('open')) renderMonthPrep(); } catch(e) {} // v167""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.01.89">', '<meta name="app-version" content="2026.09.01.90">')
rep("const APP_VERSION = '2026.09.01.89';", "const APP_VERSION = '2026.09.01.90';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v166-2026-09-01-89';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v167-2026-09-01-90';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
