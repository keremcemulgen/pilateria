# -*- coding: utf-8 -*-
# v179 — UYE-AY-BIRIM MODELI (Kerem 2026-09-28: "bu ve benzeri hata/problem guncellemelerini yama seklinde degil
# KOKTEN cozmen gerekiyor" + "sorsun ben seceyim").
# KOK: uygulama ayi "uye-ay" TEK KAYIT (member.monthly[ay]) sanirdi; gercek hayat "uye-ay-BIRIM" (grup A → grup B →
# bireysel ayni ayda). v171 pay, v175 solo→bireysel, v176 F28, v177 P1/P2, v178 detay ayrimi hep bu kokun parcalariydi.
#  U1 memberUnitsForMonth(uye, ay): TEK KAYNAK — acik birim (su anki grup / bireysel) + kapali birimler (payli ayrilan
#     grup, paysiz kadro disi odeme/ders, bireysel birim payi). Her birim: dersler, yapildi/planli, fiyat/pay, odenen,
#     kalan, fazla. __hasIndividualUnit179: yalniz kapali birimi olan (ayrilan payi) uye BIREYSEL sayilmaz —
#     Uyeler satiri, bakiye, vadesi gecen bunu kullanir.
#  U2 Uye detayi birim birim: acik birim ana listede; "Diger birimlerdeki dersleri" icinde her kapali birim kendi
#     basligi + para satiriyla (v178 ayrimi genellendi).
#  U3 "Aktive Et" BIRIM SORAR (her uyede): eski grubu «X» / BIREYSEL / Vazgec. Bireysel: 1 kisilik grupsa v175
#     donusumu, degilse bireysel paket (grup kaydindan cikar). Personel + programatik cagri: v58 (soru yok).
#  U4 SARKAN PAKET: tasinma/grup penceresinden cikarma bagla­m ayindan onceki paketin bu aya sarkan planli dersleri varsa
#     ayrilma O PAKETIN AYINDAN uygulanir (kadro, pay = 1 ders x alinan, sarkan planli derslerden duser); odeme fazlasi
#     yeni birimin BAGLAM AYI paketine DEVIR olur. Pasife alma: bu ay ve sonrasi tarihli planli derslerden (paket ayi ne
#     olursa olsun) duser; onceki paket/odeme oldugu gibi.
#  U5 BIREYSEL → GRUP: bireysel birim payi (m.monthly[ay].__soloShare179 = 1 ders x alinan), odeme fazlasi gruba;
#     yapilmis bireysel derslerin hoca tabani pay/ders (degismez); bireysele donunce pay duser.
#  U6 v171 pasife alma pay onerisi = uyenin 1-ders fiyati x alinan (v54 bolen: uyenin KENDI hakki).
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# ---------- U1: tek kaynak ----------
rep("""// Uyenin o ay ODENMEMIS pay borclari (tum gruplar) — uye bakiyesi/WhatsApp hatirlatmasi icin
function memberPartialDebtForMonth(memberId, ay) {""",
"""// ===== v179: UYE-AY-BIRIM — TEK KAYNAK =====
// Bir uyenin secili aydaki BIRIMLERI: acik birim (su anki grup ya da bireysel) + kapali birimler (payli ayrilan grup,
// paysiz kadro disi odeme/ders olan grup, bireysel birim payi). Kadro/pay/odeme/ders kayitlarindan TURETILIR (migrasyon yok).
function __soloShare179Of(memberId, ay) {
  try { const m = state.members.find(x => x && x.id === memberId); const mo = m && m.monthly && m.monthly[ay]; return (mo && mo.__soloShare179 && typeof mo.__soloShare179 === 'object') ? mo.__soloShare179 : null; } catch(e) { return null; }
}
function __soloShareDebt179(memberId, ay) {
  const ss = __soloShare179Of(memberId, ay); if (!ss) return 0;
  if (!memberActiveGroupForMonth(memberId, ay)) return 0; // yeniden bireysel: pay gecersiz (bireysele donuste silinir)
  return Math.max(0, __roundTL((+ss.price || 0) - memberPaidTowardsMonth(memberId, '', ay)));
}
// Uyenin o ay GERCEK bir bireysel birimi var mi? Kayitli + grupsuz + (ayrilan payi disinda bir bireysel izi: paket / ders / odeme)
function __hasIndividualUnit179(memberId, ay) {
  if (!ay) return true;
  if (!isMemberEnrolledInMonth(memberId, ay)) return false;
  if (memberActiveGroupForMonth(memberId, ay)) return false;
  const hasPartial = (state.groups || []).some(g => g && !!partialShareFor(g.id, memberId, ay));
  if (!hasPartial) return true;
  const m = state.members.find(x => x && x.id === memberId); if (!m) return false;
  const pmOf = x => x.packageMonth || String(x.date || '').slice(0, 7);
  if ((m.packages || []).some(p => p && p.month === ay)) return true;
  if ((state.lessons || []).some(l => l && !l.groupId && (l.memberIds || []).includes(memberId) && pmOf(l) === ay && l.status !== 'cancelled')) return true;
  if ((state.payments || []).some(p => p && p.memberId === memberId && !p.groupId && pmOf(p) === ay)) return true;
  return false;
}
function memberUnitsForMonth(memberId, ay) {
  const m = state.members.find(x => x && x.id === memberId); if (!m || !ay) return [];
  const pmOf = x => x.packageMonth || String(x.date || '').slice(0, 7);
  const les = (state.lessons || []).filter(l => l && (l.memberIds || []).includes(memberId) && pmOf(l) === ay);
  const pays = (state.payments || []).filter(p => p && p.memberId === memberId && pmOf(p) === ay);
  const units = [], seen = {};
  const gname = g => { try { return groupDisplayName(g, ay) || g.name || 'Grup'; } catch(e) { return (g && g.name) || 'Grup'; } };
  const mk = (kind, gid, open) => {
    const g = kind === 'group' ? state.groups.find(x => x && x.id === gid) : null;
    const u = { kind: kind, gid: gid || '', open: !!open, name: kind === 'group' ? (g ? gname(g) : 'Silinmiş grup') : 'Bireysel', lessons: [], done: 0, planned: 0, cancelled: 0, paid: 0, price: null, quota: null, share: null, noShare: false };
    units.push(u); seen[kind === 'group' ? 'g:' + (gid || '') : 'i'] = u; return u;
  };
  const curG = memberActiveGroupForMonth(memberId, ay);
  if (curG) { const u = mk('group', curG.id, true); u.price = +memberPriceForGroupMonth(memberId, curG.id, ay) || 0; try { u.quota = +memberEffectiveQuota(memberId, ay, curG.id) || null; } catch(e) { try { u.quota = +sessionQuotaFor('member', memberId, ay) || null; } catch(e2) { u.quota = null; } } }
  else if (__hasIndividualUnit179(memberId, ay)) { const u = mk('individual', '', true); u.price = +memberMonthlyTotalPrice(memberId, ay) || 0; try { u.quota = +sessionQuotaFor('member', memberId, ay) || null; } catch(e) { u.quota = null; } }
  (state.groups || []).forEach(g => { if (!g) return; const ps = partialShareFor(g.id, memberId, ay); if (ps && !seen['g:' + g.id]) { const u = mk('group', g.id, false); u.share = ps; u.price = (ps.price === undefined || ps.price === null || ps.price === '') ? null : +ps.price; u.quota = +ps.sessions || null; } });
  const ss = __soloShare179Of(memberId, ay); if (ss && !seen['i']) { const u = mk('individual', '', false); u.share = ss; u.price = +ss.price || 0; u.quota = +ss.sessions || null; }
  les.forEach(l => { const k = l.groupId ? 'g:' + l.groupId : 'i'; let u = seen[k]; if (!u) { u = mk(l.groupId ? 'group' : 'individual', l.groupId || '', false); u.noShare = true; } u.lessons.push(l); const st = l.status || 'planned'; if (st === 'completed' || st === 'missed') u.done++; else if (st === 'cancelled') u.cancelled++; else u.planned++; });
  pays.forEach(p => { const k = p.groupId ? 'g:' + p.groupId : 'i'; let u = seen[k]; if (!u) { u = mk(p.groupId ? 'group' : 'individual', p.groupId || '', false); u.noShare = true; } u.paid += (+p.amount || 0); });
  units.forEach(u => {
    u.paid = Math.round(u.paid * 100) / 100;
    u.lessons.sort((a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || '')));
    const pr = (u.price === null) ? null : (+u.price || 0);
    u.balance = (pr !== null && pr > 0) ? Math.max(0, Math.round((pr - u.paid) * 100) / 100) : 0;
    u.excess = u.open ? ((pr !== null && pr > 0) ? Math.max(0, Math.round((u.paid - pr) * 100) / 100) : 0) : Math.max(0, Math.round((u.paid - (pr || 0)) * 100) / 100);
    u.label = u.open ? (u.kind === 'group' ? 'bu birim (grup)' : 'bu birim (bireysel)') : (u.kind === 'group' ? (u.share ? 'önceki grup · payı' : 'önceki grup (paysız)') : (u.share ? 'önceki bireysel · payı' : 'önceki bireysel'));
  });
  units.sort((a, b) => (a.open === b.open) ? 0 : (a.open ? -1 : 1));
  return units;
}
// Uyenin o ay ODENMEMIS pay borclari (tum gruplar) — uye bakiyesi/WhatsApp hatirlatmasi icin
function memberPartialDebtForMonth(memberId, ay) {""")

# bakiye: bireysel birimi olmayan (yalniz ayrilan payi) uye + bireysel birim payi borcu
rep("""function memberBalanceForMonth(memberId, monthISO) {
  const ay = monthISO || currentMonth();
  const __pd = memberPartialDebtForMonth(memberId, ay); // v171: ayrildigi gruplardaki odenmemis paylar da borcudur (F4)
  const defined = +memberMonthlyTotalPrice(memberId, ay) || 0;
  if (defined <= 0) return __pd;
  if (ay >= ROSTER_START_MONTH && !isMemberEnrolledInMonth(memberId, ay)) return __pd; // v176 (F7): o ay kayitli degilse (pasif) kendi fiyati borc degildir
  const g = memberActiveGroupForMonth(memberId, ay);
  const paid = memberPaidTowardsMonth(memberId, g ? g.id : '', ay);""",
"""function memberBalanceForMonth(memberId, monthISO) {
  const ay = monthISO || currentMonth();
  const __pd = memberPartialDebtForMonth(memberId, ay) + __soloShareDebt179(memberId, ay); // v171: ayrildigi gruplardaki odenmemis paylar da borcudur (F4); v179: bireysel birim payi
  const defined = +memberMonthlyTotalPrice(memberId, ay) || 0;
  if (defined <= 0) return __pd;
  if (ay >= ROSTER_START_MONTH && !isMemberEnrolledInMonth(memberId, ay)) return __pd; // v176 (F7): o ay kayitli degilse (pasif) kendi fiyati borc degildir
  const g = memberActiveGroupForMonth(memberId, ay);
  if (!g && !__hasIndividualUnit179(memberId, ay)) return __pd; // v179: yalniz kapali birimi (ayrilan payi) olan uye — kendi fiyati borc degil
  const paid = memberPaidTowardsMonth(memberId, g ? g.id : '', ay);""")

# Uyeler satiri: bireysel satir yalniz gercek bireysel birimi olana
rep("""    const inGroup = state.groups.some(g => !isGroupInactiveInMonth(g, monthISO) && resolveGroupMembersForMonth(g, monthISO).includes(m.id));
    if (inGroup) return;
    if (monthISO && !isMemberEnrolledInMonth(m.id, monthISO)) return;""",
"""    const inGroup = state.groups.some(g => !isGroupInactiveInMonth(g, monthISO) && resolveGroupMembersForMonth(g, monthISO).includes(m.id));
    if (inGroup) return;
    if (monthISO && !isMemberEnrolledInMonth(m.id, monthISO)) return;
    if (monthISO && !__hasIndividualUnit179(m.id, monthISO)) return; // v179: yalniz ayrilan payi olan uye bireysel satir degil (grubun altinda "ayrildi" satiri)""")

# vadesi gecen (bireysel): ayni kural
rep("""      ay => (memberActiveGroupForMonth(m.id, ay) ? 0 : (+memberMonthlyTotalPrice(m.id, ay) || 0)), // v176 (F16): acik 0 (uzadi) genel fiyata DUSMEZ""",
"""      ay => ((memberActiveGroupForMonth(m.id, ay) || !__hasIndividualUnit179(m.id, ay)) ? 0 : (+memberMonthlyTotalPrice(m.id, ay) || 0)), // v176 (F16): acik 0 (uzadi) genel fiyata DUSMEZ; v179: yalniz ayrilan payi olan uye bireysel borclu degil""")

# hoca tabani: bireysel birim payi varsa yapilmis bireysel dersin payi sabit (pay/ders)
rep("""        const __pp = memberPerLessonPrice(m.id, l.packageMonth);
        if (__pp > 0) return __pp;""",
"""        const __ss179 = __soloShare179Of(m.id, l.packageMonth); // v179: bireysel birim payi — grup gecisi fiyati degistirse de yapilmis bireysel dersin tabani sabit
        if (__ss179 && +__ss179.sessions > 0 && +__ss179.price > 0) return (+__ss179.price) / (+__ss179.sessions);
        const __pp = memberPerLessonPrice(m.id, l.packageMonth);
        if (__pp > 0) return __pp;""")

# ---------- U2: uye detayi birim birim ----------
rep("""  const lessonsAllUnits = allLessons.filter(l => lesMonthOf(l) === ctxAy);
  // v178 (Kerem): BU BIRIMIN dersleri ana listede; onceki/baska gruplardaki (grup uyesiyse grupsuz) dersler ayri bolumde
  const __curG178 = memberActiveGroupForMonth(id, ctxAy);
  const __isOwn178 = l => __curG178 ? (l.groupId === __curG178.id) : !l.groupId;
  const lessons = lessonsAllUnits.filter(__isOwn178);
  const otherLessons178 = lessonsAllUnits.filter(l => !__isOwn178(l));""",
"""  const lessonsAllUnits = allLessons.filter(l => lesMonthOf(l) === ctxAy);
  // v178/v179 (Kerem): BIRIM BIRIM — acik birimin dersleri ana listede; kapali birimler (onceki grup / bireysel pay) ayri
  const __units179 = memberUnitsForMonth(id, ctxAy);
  const __openU179 = __units179.find(u => u.open) || null;
  const __curG178 = memberActiveGroupForMonth(id, ctxAy);
  const lessons = __openU179 ? __openU179.lessons.slice() : [];
  const otherLessons178 = lessonsAllUnits.filter(l => !(__openU179 && __openU179.lessons.indexOf(l) !== -1));
  const __closedUnits179 = __units179.filter(u => !u.open);""")
rep("""    ${otherLessons178.length ? (function(){ // v178: onceki/baska birimlerdeki dersler — grup adiyla, bu birimin hakkina sayilmaz
      const __unitOf = l => { if (!l.groupId) return { key: '', name: 'bireysel', badge: 'bireysel ders' }; const g = state.groups.find(x => x && x.id === l.groupId); const nm = g ? (groupDisplayName(g, ctxAy) || g.name || 'Grup') : 'Silinmiş grup'; const ps = g ? partialShareFor(g.id, id, ctxAy) : null; return { key: l.groupId, name: nm, badge: 'önceki grup', share: ps }; };
      const __units = {}; otherLessons178.forEach(l => { const u = __unitOf(l); if (!__units[u.key]) __units[u.key] = { u: u, n: 0 }; __units[u.key].n++; });
      const __hint = Object.keys(__units).map(k => { const x = __units[k]; return escapeHtml(x.u.name) + ' ' + x.n + ' ders' + (x.u.share ? ' · payı ' + (x.u.share.sessions || 0) + ' ders / ' + money(x.u.share.price || 0) + ' ₺' : ''); }).join(' · ');
      return `<details open><summary>Diğer birimlerdeki dersleri (${otherLessons178.length}) <span style="color:var(--muted);font-size:11px;font-weight:normal;">— ${__hint} · bu birimin ders hakkına sayılmaz</span></summary>
      <div class="table-wrap"><table class="sticky-head"><thead class="sticky-thead"><tr><th>Tarih</th><th>Saat</th><th>Grup</th><th>Hoca</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>` +
        otherLessons178.map(l => { const u = __unitOf(l); return `<tr style="opacity:.85;"><td>${fmtDate(l.date)}</td><td>${escapeHtml(l.time)}</td><td>${escapeHtml(u.name)} <span class="badge" style="background:#f5f0e0;color:#8a8573;font-size:10px;">${u.badge}</span></td><td>${escapeHtml(instructorName(l.instructorId))}</td><td>${lessonStatusBadge(l.status||'planned')}</td><td><button class="btn small secondary" onclick="openLessonModal('${l.id}')" title="Dersi düzenle">Düzenle</button></td></tr>`; }).join('') +
        '</tbody></table></div></details>';
    })() : ''}""",
"""    ${(__closedUnits179.length || otherLessons178.length) ? (function(){ // v179: kapali birimler — her biri kendi basligi + para satiri (dersler bu birimin hakkina sayilmaz)
      const __nOther = otherLessons178.length;
      const __hint = __closedUnits179.map(u => escapeHtml(u.name) + ' ' + (u.done + u.planned) + ' ders' + (u.share ? ' · payı ' + (u.share.sessions || 0) + ' ders / ' + money(u.share.price || 0) + ' ₺' : '')).join(' · ');
      const __badge = u => (u.kind === 'group' ? (u.share ? 'önceki grup' : 'önceki grup (paysız)') : (u.share ? 'önceki bireysel' : 'bireysel ders'));
      const __money = u => { if (u.noShare) return (u.paid > 0 ? '⚠️ kadro dışı ödeme ' + money(u.paid) + ' ₺ — grup toplamına sayılmaz' : 'pay kaydı yok'); const pr = (u.price === null) ? null : +u.price; return (pr === null ? 'pay ücreti girilmedi (✏️ grup detayı)' : ('pay ' + money(pr) + ' ₺')) + ' · ödenen ' + money(u.paid) + ' ₺' + (u.balance > 0 ? ' · <span style="color:#c62828;">kalan ' + money(u.balance) + ' ₺</span>' : '') + (u.excess > 0 ? ' · <span style="color:#8a5a00;">⚠️ payı aşan ' + money(u.excess) + ' ₺</span>' : ''); };
      const __rows = u => u.lessons.map(l => `<tr style="opacity:.85;"><td>${fmtDate(l.date)}</td><td>${escapeHtml(l.time)}</td><td>${escapeHtml(u.name)} <span class="badge" style="background:#f5f0e0;color:#8a8573;font-size:10px;">${__badge(u)}</span></td><td>${escapeHtml(instructorName(l.instructorId))}</td><td>${lessonStatusBadge(l.status||'planned')}</td><td><button class="btn small secondary" onclick="openLessonModal('${l.id}')" title="Dersi düzenle">Düzenle</button></td></tr>`).join('');
      return `<details open><summary>Diğer birimlerdeki dersleri (${__nOther}) <span style="color:var(--muted);font-size:11px;font-weight:normal;">— ${__hint || 'pay kaydı'} · bu birimin ders hakkına sayılmaz</span></summary>` +
        __closedUnits179.map(u => `<div style="margin:6px 0 2px;font-size:12px;"><b>${escapeHtml(u.name)}</b> <span class="badge" style="background:#f5f0e0;color:#8a8573;font-size:10px;">${__badge(u)}</span> <span style="color:var(--muted);">— ${u.done} yapıldı${u.planned ? ' · ' + u.planned + ' planlı' : ''}${u.cancelled ? ' · ' + u.cancelled + ' iptal' : ''} · ${__money(u)}</span></div>` +
          (u.lessons.length ? `<div class="table-wrap"><table class="sticky-head"><thead class="sticky-thead"><tr><th>Tarih</th><th>Saat</th><th>Grup</th><th>Hoca</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>${__rows(u)}</tbody></table></div>` : '')).join('') +
        '</details>';
    })() : ''}""")

# ---------- U3: Aktive Et birim sorar ----------
rep("""function reactivateMemberForMonthUI175(id, month) {
  reactivateMemberForMonth(id, month);
  const m = state.members.find(function(x){ return x && x.id === id; });
  if (!m || !month) return;
  let solo = null; try { solo = __soloGroupHolding175(id, month); } catch(e) { solo = null; }
  if (!solo || solo.keepSolo175 || !__soloAllowed175()) return;
  if (!confirm(__soloConfirm175(solo, m, month, 'reactivate'))) return;
  const res = convertSoloGroupToIndividual175(solo.id, id, month, {});
  if (typeof renderArchive === 'function') renderArchive();
  __afterSoloConvert175(res, id, month, {});
}""",
"""// v179 (Kerem: "sorsun ben seceyim"): "Aktive Et" HER uyede BIRIM sorar — eski grubu / BIREYSEL / Vazgec.
// Eski grubu: v58 (kadroya doner). Bireysel: 1 kisilik grupsa v175 donusumu (dersler/odemeler uyeye), degilse bireysel
// paket (grup kaydindan cikar; v177 pay/odeme kurali). Grubu yoksa soru yok (bireysel). Personel: v58 (para tasiyan secim yok).
async function reactivateMemberForMonthUI175(id, month) {
  const m = state.members.find(function(x){ return x && x.id === id; });
  if (!m || !month) return;
  if (!__soloAllowed175()) { reactivateMemberForMonth(id, month); return; }
  const prevG = (state.groups || []).find(function(g){ return g && !isGroupInactiveInMonth(g, month) && (resolveGroupMembersForMonth(g, month) || []).includes(id); });
  if (!prevG) { reactivateMemberForMonth(id, month); return; }
  let gn = ''; try { gn = groupDisplayName(prevG, month); } catch(e) { gn = ''; }
  gn = gn || prevG.name || 'Grup';
  const wouldBeSolo = (resolveGroupMembersForMonth(prevG, month) || []).filter(function(x){ return x && x !== id && __memberActiveInMonth(state.members.find(function(y){ return y && y.id === x; }) || {}, month); }).length === 0;
  let ans = await plDialog({
    msg: (m.name || 'Üye') + ' — ' + pkgMonthLabel(month) + ' ayında hangi birimde aktif olsun?\\n\\n' +
      '• Eski grubu «' + gn + '»: kadrosuna geri döner.\\n' +
      '• BİREYSEL: bireysel paket açılır, grup kaydında görünmez' + (wouldBeSolo ? ' (1 kişilik grup kaydı bu aydan itibaren kapanır; dersleri ve ödemeleri üyeye geçer)' : ' (grupta aldığı dersler varsa payı 1 ders × alınan olarak kalır)') + '.\\n' +
      '• Başka gruba: Gruplar sayfasında o grubun boş slotuna ekle.',
    buttons: [{ label: '↩️ Eski grubu «' + gn + '»', value: 'group', cls: 'ok' }, { label: '👤 Bireysel', value: 'individual' }, { label: 'Vazgeç', value: null, cls: 'secondary' }],
    escValue: null
  });
  if (ans === true) ans = 'group'; // genel otomatik cevap (test kancasi) → v58
  if (ans !== 'group' && ans !== 'individual') return;
  if (ans === 'group') { reactivateMemberForMonth(id, month); return; }
  reactivateMemberForMonth(id, month);
  let solo = null; try { solo = __soloGroupHolding175(id, month); } catch(e) { solo = null; }
  if (solo) {
    const res = convertSoloGroupToIndividual175(solo.id, id, month, {});
    if (typeof renderArchive === 'function') renderArchive();
    __afterSoloConvert175(res, id, month, {});
    return;
  }
  const __pid = ((getMemberMonthlyOverride(id, month) || {}).packageId) || m.defaultPackageId || '';
  __createIndividualUnit173(id, month, { packageId: __pid });
  try { renderArchive(); renderMembers(); renderGroups(); renderDashboard(); refreshMemberDetailIfOpen(); refreshGroupDetailIfOpen(); } catch(e) {}
  if (typeof plToast === 'function') { try { plToast('👤 ' + (m.name || 'Üye') + ' — ' + pkgMonthLabel(month) + ': bireysel (grup kaydından çıkarıldı)'); } catch(e) {} }
}""")

# ---------- U4: sarkan paket ----------
rep("""function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };
  const __ay = ctxAy || __groupOpsCtxMonth(); // v34
  const __keep = state.groups.find(x => x.id === keepGroupId);
  __undoSnapshotIfMove177(memberId, keepGroupId, __ay); // v177: tasinma tek "Geri Al" adimi (kadro + pay + odeme)
  state.groups.forEach(g => {""",
"""// v179 (U4): SARKAN PAKET — baglam ayindan ONCEKI paketin bu aya (ve sonrasina) sarkan PLANLI dersinde uye varsa,
// ayrilma o paketin ayindan uygulanir (pay = o paketteki alinan ders). Yoksa '' doner.
function __spillPackageMonth179(g, memberId, ctxAy) {
  let best = '';
  (state.lessons || []).forEach(l => {
    if (!l || !g || l.groupId !== g.id || l.status !== 'planned' || !(l.memberIds || []).includes(memberId)) return;
    const pm = l.packageMonth || String(l.date || '').slice(0, 7);
    if (pm >= ctxAy || String(l.date || '') < ctxAy + '-01') return;
    if (!best || pm < best) best = pm;
  });
  return best;
}
// Onceki paketlerin bu ay ve sonrasi tarihli PLANLI derslerinden uyeyi cikar (paket ayi ne olursa olsun)
function __dropFromFutureLessons179(g, memberId, ctxAy) {
  let n = 0;
  (state.lessons || []).forEach(l => {
    if (!l || !g || l.groupId !== g.id || l.status !== 'planned' || !(l.memberIds || []).includes(memberId)) return;
    const pm = l.packageMonth || String(l.date || '').slice(0, 7);
    if (pm >= ctxAy || String(l.date || '') < ctxAy + '-01') return;
    l.memberIds = (l.memberIds || []).filter(x => x !== memberId); n++;
  });
  return n;
}
// v179 (U5): BIREYSEL → GRUP gecisinde bireysel birim payi (1 ders x alinan) + odeme fazlasi gruba
function __transferSoloShare179(memberId, toGroupId, ay) {
  try {
    const m = state.members.find(x => x && x.id === memberId); if (!m || !toGroupId || !ay) return null;
    const __staff = !!(typeof SUPABASE_MODE !== 'undefined' && SUPABASE_MODE && typeof __sbRole !== 'undefined' && __sbRole === 'staff');
    if (__staff) return null;
    if (!isMemberEnrolledInMonth(memberId, ay) || memberActiveGroupForMonth(memberId, ay)) return null;
    if (__soloShare179Of(memberId, ay)) return null;
    const pmOf = x => x.packageMonth || String(x.date || '').slice(0, 7);
    const taken = (state.lessons || []).filter(l => l && !l.groupId && (l.memberIds || []).includes(memberId) && pmOf(l) === ay && (l.status === 'completed' || l.status === 'missed')).length;
    const paysTotal = memberPaidTowardsMonth(memberId, '', ay);
    if (!taken && !(paysTotal > 0)) return null;
    const per = +memberPerLessonPrice(memberId, ay) || 0;
    if (taken > 0 && !(per > 0)) return null;
    const share = Math.round(per * taken * 100) / 100;
    const toG = state.groups.find(x => x && x.id === toGroupId);
    const toName = '«' + ((toG && (groupDisplayName(toG, ay) || toG.name)) || 'yeni grup') + '»';
    setMemberMonthly(memberId, ay, { __soloShare179: { sessions: taken, price: share, note: 'taşındı → ' + toName, at: todayISO() } });
    let mv = { moved: 0 };
    if (paysTotal > share + 0.005) mv = __movePaymentsOnTransfer177(memberId, '', toGroupId, ay, share, '↔ taşındı: bireysel → ' + toName);
    if (typeof plToast === 'function' && (taken > 0 || mv.moved > 0)) { try { plToast('📎 ' + (m.name || 'Üye') + ' — bireysel payı: ' + taken + ' ders · ' + money(share) + ' ₺' + (mv.moved > 0 ? ' · ' + money(mv.moved) + ' ₺ ödeme ' + toName + ' kaydına taşındı' : '')); } catch(e) {} }
    return { taken: taken, share: share, moved: mv.moved };
  } catch(e) { return null; }
}
function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };
  const __ay = ctxAy || __groupOpsCtxMonth(); // v34
  const __keep = state.groups.find(x => x.id === keepGroupId);
  __undoSnapshotIfMove177(memberId, keepGroupId, __ay); // v177: tasinma tek "Geri Al" adimi (kadro + pay + odeme)
  if (keepGroupId) { try { __transferSoloShare179(memberId, keepGroupId, __ay); } catch(e) {} } // v179 (U5): bireysel → grup
  state.groups.forEach(g => {""")
rep("""      applyRosterChange(g, __ay, mids => {
        const out = mids.map(x => x === memberId ? '' : x);
        while (out.length > 0 && out[out.length-1] === '') out.pop();
        return out;
      });
      __autoNameAfterRosterChange(g, __ay); // v41: ad AY BAZLI guncellenir (elle ay-adi korunur)
      syncGroupLessonsToRoster(g.id, __ay);
      __transferShareAndPayments177(g, memberId, keepGroupId, __ay); // v177 (P2): pay = 1-ders x alinan; fazla odeme yeni kayda
      __queuePartialOffer(g, memberId, __ay); // v171: (pay yazilmadiysa — fiyatsiz uye) payi sorulur""",
"""      const __effAy179 = __spillPackageMonth179(g, memberId, __ay) || __ay; // v179 (U4): sarkan paket → ayrilma paketin ayindan
      applyRosterChange(g, __effAy179, mids => {
        const out = mids.map(x => x === memberId ? '' : x);
        while (out.length > 0 && out[out.length-1] === '') out.pop();
        return out;
      });
      __autoNameAfterRosterChange(g, __effAy179); // v41: ad AY BAZLI guncellenir (elle ay-adi korunur)
      syncGroupLessonsToRoster(g.id, __effAy179);
      __dropFromFutureLessons179(g, memberId, __ay); // v179: onceki paketlerin bu aya sarkan planli dersleri
      __transferShareAndPayments177(g, memberId, keepGroupId, __effAy179, __ay); // v177 (P2): pay = 1-ders x alinan; fazla odeme yeni kayda (v179: baglam ayina DEVIR)
      __queuePartialOffer(g, memberId, __effAy179); // v171: (pay yazilmadiysa — fiyatsiz uye) payi sorulur""")
# transfer: toMonth parametresi
rep("""function __transferShareAndPayments177(g, memberId, keepGroupId, ay) {
  try {""",
"""function __transferShareAndPayments177(g, memberId, keepGroupId, ay, toMonth) {
  try {""")
rep("""    if (paysTotal > share + 0.005) mv = __movePaymentsOnTransfer177(memberId, g.id, keepGroupId || '', ay, share, '↔ taşındı: ' + fromName + ' → ' + toName);""",
"""    if (paysTotal > share + 0.005) mv = __movePaymentsOnTransfer177(memberId, g.id, keepGroupId || '', ay, share, '↔ taşındı: ' + fromName + ' → ' + toName + ((toMonth && toMonth !== ay) ? ' (' + pkgMonthLabel(ay) + ' → ' + pkgMonthLabel(toMonth) + ' devri)' : ''), toMonth);""")
rep("""function __movePaymentsOnTransfer177(memberId, fromGid, toGid, ay, keepAmt, note) {""",
"""function __movePaymentsOnTransfer177(memberId, fromGid, toGid, ay, keepAmt, note, toMonth) {
  const __toAy = toMonth || ay; // v179: sarkan paketten tasinan odeme yeni birimin BAGLAM ayina devreder""")
rep("""      p.groupId = toGid; p.__movedFrom177 = fromGid; p.note = ((p.note || '') + ' ' + note).trim();
      moved += amt; move = Math.round((move - amt) * 100) / 100;""",
"""      p.groupId = toGid; p.__movedFrom177 = fromGid; p.note = ((p.note || '') + ' ' + note).trim(); if (__toAy !== ay) p.packageMonth = __toAy;
      moved += amt; move = Math.round((move - amt) * 100) / 100;""")
rep("""      const np = Object.assign({}, p, { id: uid(), amount: move, listPrice: move, discount: 0, campaignId: '', campaignName: '', groupId: toGid, note: ((p.note || '') + ' ' + note).trim(), __splitOf177: p.id, __movedFrom177: fromGid });""",
"""      const np = Object.assign({}, p, { id: uid(), amount: move, listPrice: move, discount: 0, campaignId: '', campaignName: '', groupId: toGid, packageMonth: __toAy, note: ((p.note || '') + ' ' + note).trim(), __splitOf177: p.id, __movedFrom177: fromGid });""")
# geri al etiketi: bireysel → grup
rep("""    const from = state.groups.filter(g => g && g.id !== keepGroupId && !isGroupInactiveInMonth(g, ay) && activeGroupRosterForMonth(g, ay).includes(memberId) && (memberPaidTowardsMonth(memberId, g.id, ay) > 0 || __lessonsTakenInGroup(memberId, g.id, ay) > 0));
    if (!from.length) return;
    const keepG = keepGroupId ? state.groups.find(x => x && x.id === keepGroupId) : null;
    __undoSnapshot('Taşınma: ' + (m.name || 'Üye') + ' — ' + from.map(g => '«' + (groupDisplayName(g, ay) || g.name || 'Grup') + '»').join(', ') + ' → ' + (keepGroupId ? ('«' + ((keepG && (groupDisplayName(keepG, ay) || keepG.name)) || 'yeni grup') + '»') : 'bireysel'));""",
"""    const from = state.groups.filter(g => g && g.id !== keepGroupId && !isGroupInactiveInMonth(g, ay) && (activeGroupRosterForMonth(g, ay).includes(memberId) || __spillPackageMonth179(g, memberId, ay)) && (memberPaidTowardsMonth(memberId, g.id, ay) > 0 || __lessonsTakenInGroup(memberId, g.id, ay) > 0 || __spillPackageMonth179(g, memberId, ay)));
    const pmOf = x => x.packageMonth || String(x.date || '').slice(0, 7);
    const soloTrace = !!keepGroupId && !from.length && !memberActiveGroupForMonth(memberId, ay) && isMemberEnrolledInMonth(memberId, ay) && ((state.lessons || []).some(l => l && !l.groupId && (l.memberIds || []).includes(memberId) && pmOf(l) === ay && (l.status === 'completed' || l.status === 'missed')) || (state.payments || []).some(p => p && p.memberId === memberId && !p.groupId && pmOf(p) === ay)); // v179 (U5)
    if (!from.length && !soloTrace) return;
    const keepG = keepGroupId ? state.groups.find(x => x && x.id === keepGroupId) : null;
    __undoSnapshot('Taşınma: ' + (m.name || 'Üye') + ' — ' + (from.length ? from.map(g => '«' + (groupDisplayName(g, ay) || g.name || 'Grup') + '»').join(', ') : 'bireysel') + ' → ' + (keepGroupId ? ('«' + ((keepG && (groupDisplayName(keepG, ay) || keepG.name)) || 'yeni grup') + '»') : 'bireysel'));""")
# bireysele donus: bireysel birim payi duser
rep("""  const removed = removeMemberFromOtherContexts(memberId, '', ay); // eski grup/ileri bireysel dersler
  if (m.archived && typeof unarchiveMember === 'function') unarchiveMember(memberId, ay);
  const __mm = { enrolled: true };""",
"""  const removed = removeMemberFromOtherContexts(memberId, '', ay); // eski grup/ileri bireysel dersler
  try { const __mo179 = m.monthly && m.monthly[ay]; if (__mo179 && __mo179.__soloShare179) delete __mo179.__soloShare179; } catch(e) {} // v179: yeniden bireysel — bireysel birim payi duser
  if (m.archived && typeof unarchiveMember === 'function') unarchiveMember(memberId, ay);
  const __mm = { enrolled: true };""")
# pasife alma cekirdegi: bu ay ve sonrasi TARIHLI planli dersler (paket ayi ne olursa olsun)
rep("""    if (__pm >= monthISO && (l.memberIds||[]).includes(memberId)) {""",
"""    if ((__pm >= monthISO || String(l.date || '') >= monthISO + '-01') && (l.memberIds||[]).includes(memberId)) { // v179 (U4): onceki paketin bu aya sarkan planli dersleri de""")
# grup penceresinden cikarma: sarkan paket
rep("""        __removed.forEach(rid => __queuePartialOffer(__pg0, rid, __gAy)); // v171""",
"""        __removed.forEach(rid => { // v171 + v179 (U4): sarkan paket varsa ayrilma o paketin ayindan
          const __effR = __spillPackageMonth179(__pg0, rid, __gAy);
          if (__effR) { applyRosterChange(__pg0, __effR, mids => { const out = mids.map(x => x === rid ? '' : x); while (out.length > 0 && out[out.length-1] === '') out.pop(); return out; }); syncGroupLessonsToRoster(__pg0.id, __effR); }
          __dropFromFutureLessons179(__pg0, rid, __gAy);
          __queuePartialOffer(__pg0, rid, __effR || __gAy);
        });""")

# ---------- U6: pasife alma pay onerisi = 1-ders (uyenin kendi hakki) x alinan ----------
rep("""        const base = +memberMonthlyTotalPrice(it.mid, it.ay) || 0;
        const sug = __prorataSuggest(it.mid, g.id, it.ay, taken);""",
"""        const base = +memberMonthlyTotalPrice(it.mid, it.ay) || 0;
        let __qm179 = q; try { __qm179 = +sessionQuotaFor('member', it.mid, it.ay) || q; } catch(e) {} // v179 (U6): v54 bolen — uyenin KENDI hakki
        const __per179 = +memberPerLessonPrice(it.mid, it.ay) || 0;
        const sug = __per179 > 0 ? Math.round(__per179 * taken * 100) / 100 : __prorataSuggest(it.mid, g.id, it.ay, taken);""")
rep("""          (base > 0 && q > 0 ? '(' + money(base) + ' × ' + taken + '/' + q + ' = ' + money(sug) + ')' : '(üyenin bu ay tanımlı fiyatı yok — tutarı gir)') +""",
"""          (base > 0 && __qm179 > 0 ? '(' + money(base) + ' × ' + taken + '/' + __qm179 + ' = ' + money(sug) + ')' : '(üyenin bu ay tanımlı fiyatı yok — tutarı gir)') +""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.09.28.101">', '<meta name="app-version" content="2026.09.28.102">')
rep("const APP_VERSION = '2026.09.28.101';", "const APP_VERSION = '2026.09.28.102';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v178-2026-09-28-101'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v179-2026-09-28-102'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
