# -*- coding: utf-8 -*-
# v185 — YENI AY HAZIRLIGI: "EKSIKLERI TAMAMLA" — hedef aydaki her sey korunur (Kerem 2026-10-02).
# Senaryo: Ekim listesi Eylul'den erken cekildi; Eylul'e sonradan uye/grup eklendi; Ekim'de ders + odeme girildi.
# Kok: (1) toplu islem yalniz "bekleyen" birimleri aliyordu — Eylul'de mevcut gruba eklenen uye (Kismen / Uzadi gruplar)
# disarida kaliyordu; (2) grup Devam'i Ekim kadrosunu Eylul kadrosuyla DEGISTIRIYORDU: Ekim'de eklenen uye duser, Ekim'den
# acikca cikarilan uye geri yazilir, zaten kayitli uyenin Ekim fiyat/uzadi kaydi elden gecerdi.
# v185: Devam = BIRLESIM. Hedef ay kadrosu aynen kalir + kaynak ayin KARAR VERILMEMIS (hedef ayda ne kayitli ne cikarilmis)
# uyeleri eklenir; yalniz bunlar kaydedilir (fiyat kaynak aydan, hedefte fiyat yoksa). Acikca cikarilan uye ancak grubun
# TAMAMI cikarilmissa (Pasif → Devam) geri yazilir. Toplu dugme = karar bekleyen uyesi olan TUM birimler.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep(r"""function __prepContinueGroupCore(g, S, T) {
  const roster = activeGroupRosterForMonth(g, S);
  __closeGroupArchiveAt(g, T);
  const curT = (resolveGroupMembersForMonth(g, T) || []).filter(Boolean);
  const same = curT.length === roster.length && roster.every(function(x){ return curT.includes(x); });
  if (!same) applyRosterChange(g, T, function(){ return roster.slice(); });
  roster.forEach(function(mid){ __prepContinueMemberCore(mid, S, T); });""",
r"""// v185: hedef ayda KARAR VERILMEMIS uye = ne kayitli ne acikca cikarilmis
function __prepUndecided185(mid, T) {
  const mm = state.members.find(function(x){ return x.id === mid; }); if (!mm) return false;
  return !isMemberEnrolledInMonth(mid, T) && !__prepMemberOut(mm, T);
}
// Birimin hedef ayda karar bekleyen uyeleri (toplu "eksikleri tamamla" icin)
function __prepUndecidedOf185(u, T) {
  return (u.members || []).filter(function(mid){ return __prepUndecided185(mid, T); });
}
function __prepContinueGroupCore(g, S, T, opts) {
  opts = opts || {};
  const roster = activeGroupRosterForMonth(g, S);
  // v185: grubun TAMAMI hedef aydan cikarilmissa (Pasif → Devam) hepsi geri; aksi halde cikarilanlar (Kerem'in karari) korunur
  const allOut = roster.length > 0 && roster.every(function(mid){ return __prepMemberOut(state.members.find(function(x){ return x.id === mid; }), T); });
  const add = roster.filter(function(mid){ return allOut || __prepUndecided185(mid, T); });
  __closeGroupArchiveAt(g, T);
  const curT = (resolveGroupMembersForMonth(g, T) || []).filter(Boolean);
  const missing = add.filter(function(mid){ return !curT.includes(mid); });
  if (missing.length) applyRosterChange(g, T, function(mids){ const out = mids.slice(); missing.forEach(function(mid){ if (!out.includes(mid)) out.push(mid); }); return out; }); // v185: BIRLESIM — hedef ay kadrosundan kimse dusmez
  add.forEach(function(mid){ __prepContinueMemberCore(mid, S, T); }); // v185: yalniz eklenen / geri yazilan uyeler — kayitlilara dokunulmaz""")

rep(r"""  const pend = __prepUnits(T).units.filter(function(u){ return __prepStatus(u, T) === 'pending'; });
  if (!pend.length) { alert('Karar bekleyen birim yok.'); return; }""",
r"""  // v185: karar bekleyen uyesi olan TUM birimler (bekleyen + Kismen + Uzadi/Devam'da sonradan eklenen uye)
  const pend = __prepUnits(T).units.filter(function(u){ const st = __prepStatus(u, T); return st !== 'passive' && __prepUndecidedOf185(u, T).length > 0; });
  if (!pend.length) { alert('Karar bekleyen birim yok.'); return; }""")
rep(r"""' ayında DEVAM olarak işaretlenecek.\n\n• Aynı kayıt, aynı kadro; üyeler ' + __prepLabel(T) + ' listesine alınır.\n• Geri Al ile tek seferde geri alınabilir.\n\nDevam?')) return;""",
r"""' ayında DEVAM — yalnız EKSİKLER tamamlanır.\n\n• ' + S + ' ayında olup ' + __prepLabel(T) + ' listesinde henüz olmayan üyeler (sonradan eklenenler dahil) aynı grup/bireysel kayıtla ' + __prepLabel(T) + ' listesine alınır.\n• ' + __prepLabel(T) + ' ayında girdiğin HER ŞEY korunur: dersler, ödemeler, fiyatlar, paket uzadı, ' + __prepLabel(T) + '\'de eklediğin ve çıkardığın üyeler.\n• Geri Al ile tek seferde geri alınabilir.\n\nDevam?')) return;""")
rep(r"""  pend.forEach(function(u){ if (u.kind === 'group') __prepContinueGroupCore(u.g, S, T); else __prepContinueMemberCore(u.id, S, T); });
  __prepAfterChange();""",
r"""  pend.forEach(function(u){ if (u.kind === 'group') __prepContinueGroupCore(u.g, S, T); else __prepContinueMemberCore(u.id, S, T); });
  try { pend.forEach(function(u){ if (u.kind === 'group') syncGroupLessonsToRoster(u.g.id, T); }); } catch(e) {} // v185: eklenen uye hedef ayin PLANLI derslerine
  __prepAfterChange();""")
# sayac: karar bekleyen uyesi olan birimler
rep(r"""  const counts = { active: 0, extended: 0, passive: 0, partial: 0, pending: 0 };
  const rows = units.map(function(u){
    const st = __prepStatus(u, T); counts[st]++;""",
r"""  const counts = { active: 0, extended: 0, passive: 0, partial: 0, pending: 0 };
  let __fill185 = 0;
  const rows = units.map(function(u){
    const st = __prepStatus(u, T); counts[st]++;
    const __und185 = (st !== 'passive') ? __prepUndecidedOf185(u, T) : []; if (__und185.length) __fill185++;""")
rep(r"""'<button class="btn small" onclick="prepAllContinue()"' + (counts.pending ? '' : ' disabled') + ' title="Karar bekleyen tüm birimleri DEVAM olarak işaretle">▶ Bekleyenlerin hepsi devam etsin (' + counts.pending + ')</button>' +""",
r"""'<button class="btn small" onclick="prepAllContinue()"' + (__fill185 ? '' : ' disabled') + ' title="' + escapeHtml(__prepLabel(S)) + ' ayında olup ' + escapeHtml(__prepLabel(T)) + ' listesinde henüz olmayan TÜM üyeleri (sonradan eklenenler dahil) aynı grup/bireysel kayıtla alır — ' + escapeHtml(__prepLabel(T)) + ' ayındaki ders, ödeme, fiyat ve kararlar korunur">▶ Eksikleri tamamla — bekleyenlerin hepsi devam etsin (' + __fill185 + ')</button>' +""")
# satirda karar bekleyen uye notu
rep(r"""    if (st === 'partial' && u.kind === 'group') { const act = activeGroupRosterForMonth(u.g, T); extra = ' (' + act.length + '/' + u.members.length + ' kayıtlı)'; }""",
r"""    if (st === 'partial' && u.kind === 'group') { const act = activeGroupRosterForMonth(u.g, T); extra = ' (' + act.length + '/' + u.members.length + ' kayıtlı)'; }
    if (u.kind === 'group' && __und185.length) sub += (sub ? '<br>' : '') + '<span style="color:#6B8DB0;">⏳ ' + __prepLabel(T) + ' listesinde yok: ' + __und185.map(function(mid){ return escapeHtml(memberName(mid)); }).join(', ') + '</span>';""")
# prepAction continue (tek tik) da derslere yansisin
rep(r"""    __undoSnapshot('Yeni ay — Devam: ' + name + ' — ' + T);
    if (g) __prepContinueGroupCore(g, S, T); else __prepContinueMemberCore(id, S, T);""",
r"""    __undoSnapshot('Yeni ay — Devam: ' + name + ' — ' + T);
    if (g) { __prepContinueGroupCore(g, S, T); try { syncGroupLessonsToRoster(g.id, T); } catch(e) {} } else __prepContinueMemberCore(id, S, T);""")

rep(r"""  const pkg = (g.packages || []).find(function(p){ return p && p.month === T; });
  if (pkg && pkg.status === 'extended') { // daha once "uzadi" denmisse geri al""",
r"""  const pkg = (g.packages || []).find(function(p){ return p && p.month === T; });
  if (opts.fill && pkg && pkg.status === 'extended') { // v185: EKSIK TAMAMLAMA "uzadi"yi geri ALMAZ — eklenen uye de bu ay 0 ₺ (grubun uzama kurali)
    try { if (missing.length || add.length) __groupPackageExtendCore(g, T, pkg.extendedNote || ''); } catch(e) {}
  } else if (pkg && pkg.status === 'extended') { // daha once "uzadi" denmisse geri al (tek tik Devam)""")
rep(r"""  pend.forEach(function(u){ if (u.kind === 'group') __prepContinueGroupCore(u.g, S, T); else __prepContinueMemberCore(u.id, S, T); });
  try { pend""", r"""  pend.forEach(function(u){ if (u.kind === 'group') __prepContinueGroupCore(u.g, S, T, { fill: true }); else __prepContinueMemberCore(u.id, S, T); });
  try { pend""")

rep('<meta name="app-version" content="2026.09.29.107">', '<meta name="app-version" content="2026.10.02.108">')
rep("const APP_VERSION = '2026.09.29.107';", "const APP_VERSION = '2026.10.02.108';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v184-2026-09-29-107'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v185-2026-10-02-108'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
