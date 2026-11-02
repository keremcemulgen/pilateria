# -*- coding: utf-8 -*-
# v216 — GRUP KADRO GEÇMİŞİ DONDURULUR + "GRUBUNDAN DÜŞMÜŞ ÜYE" ONARIMI (Kerem 02.11: "Z. U. H.'yi Kasım'da ekliyorum
# üyelere ağustosta temmuzda geri çıkıyor kontrol et. Bu nasıl kökten çözmek")
# ÖLÇÜLDÜ (PC Chrome'daki kopya, giriş yok, salt okunur): Z. U. H. ile eşinin grubunun (Haziran'dan beri) HİÇ ay kadrosu kaydı yoktu
# (eski grup: tüm aylar `memberIds`'ten okunur). 01→02.11 arasında Kasım işlemleri sırasında YALNIZ Ekim kadrosu [eşi] olarak
# sabitlendi → kadro okuma kuralı ("o ay kaydı yoksa SONRAKİ ilk kayıt") yüzünden HAZİRAN–EYLÜL kadroları da [eşi] oldu → Z. U. H.
# Haziran ve Temmuz'da grubun derslerine girmiş ve gruba ödemiş olduğu halde ayrıca BİREYSEL + borçlu (6.000 / 6.500 ₺) göründü.
# KÖK: kadro değişikliği yalnız bir önceki ayı sabitliyordu; daha eski kayıtsız aylar ilk sabitlenen aya bağlı kalıyordu → TEK bir
# sabitleme bütün geçmişi yeniden yazabiliyordu.
# ÇÖZÜM: (1) `__freezeGroupHistory216(g, ay)`: her kadro değişikliğinden (ve doğrudan kadro yazan yollardan) ÖNCE grubun ilk kanıt
#   ayından (paket/ders/ödeme/kadro kaydı) işlem ayına kadar kaydı olmayan HER ay o anki kadrosuyla sabitlenir (görünüm değişmez; sonraki
#   hiçbir işlem geçmişi yeniden yazamaz). (2) ONARIM-4 (Kerem'in önceki kararı "Bulup listele, ben onaylayayım"): bir grubun o ayki
#   derslerine girmiş / gruba ödemiş ama o ayın kadrosunda görünmeyen ve bu yüzden o ay BİREYSEL borçlu görünen üyeler açılışta adıyla
#   sorulur: "Kadroya geri koy" → o aylarda grubun kadrosuna geri yazılır (bireysel borç kalkar; ders/ödeme değişmez; Geri Al'lı) /
#   "Kalsın" → bir daha sorulmaz / "Sonra".
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:160])
    s = s.replace(old, new)

rep('<meta name="app-version" content="2026.11.02.138">', '<meta name="app-version" content="2026.11.02.139">')
rep("const APP_VERSION = '2026.11.02.138';", "const APP_VERSION = '2026.11.02.139';")

# (1) geçmişi dondur
rep("""function applyRosterChange(g, ctxAy, mutateFn) {
  if (!g) return;
  const ay = ctxAy || currentMonth();
  if (!g.monthlyMembers) g.monthlyMembers = {};
  const pm = prevMonthISO(ay);""", """// v216: grubun KANIT ayları (paket / ders / gruba ödeme / kadro kaydı) — geçmiş kadro dondurmanın başlangıcı
function __groupEvidenceMonths216(g) {
  const out = new Set();
  try {
    if (!g) return [];
    const pmOf = function(x){ return x.packageMonth || String(x.date || '').slice(0, 7); };
    (g.packages || []).forEach(function(p){ if (p && p.month) out.add(String(p.month)); });
    Object.keys(g.monthlyMembers || {}).forEach(function(k){ out.add(k); });
    (state.lessons || []).forEach(function(l){ if (l && l.groupId === g.id) out.add(pmOf(l)); });
    (state.payments || []).forEach(function(p){ if (p && p.groupId === g.id) out.add(pmOf(p)); });
  } catch(e) {}
  return Array.from(out).filter(function(a){ return /^\\d{4}-\\d{2}$/.test(a); }).sort();
}
// v216 (Kerem: "kökten çöz"): beforeAy'dan ÖNCEKİ, kadro kaydı olmayan HER ay (grubun ilk kanıt ayından itibaren) O ANKİ kadrosuyla
// sabitlenir — görünüm değişmez; sonraki kadro değişiklikleri geçmişi ("kayıt yoksa sonraki ilk kayıt" kuralıyla) yeniden YAZAMAZ.
function __freezeGroupHistory216(g, beforeAy) {
  try {
    if (!g || !/^\\d{4}-\\d{2}$/.test(String(beforeAy || ''))) return 0;
    if (!g.monthlyMembers || typeof g.monthlyMembers !== 'object') g.monthlyMembers = {};
    const ev = __groupEvidenceMonths216(g).filter(function(a){ return a < beforeAy; });
    if (!ev.length) return 0;
    const pins = {}; let a = ev[0], guard = 0;
    while (a < beforeAy && guard++ < 240) {
      if (!(a in g.monthlyMembers)) pins[a] = (resolveGroupMembersForMonth(g, a) || []).slice(); // önce HEPSİ hesaplanır (yazım okumayı etkilemesin)
      const p = a.split('-').map(Number); const d = new Date(p[0], p[1], 1); a = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }
    const ks = Object.keys(pins); ks.forEach(function(k){ g.monthlyMembers[k] = pins[k]; });
    return ks.length;
  } catch(e) { return 0; }
}
function applyRosterChange(g, ctxAy, mutateFn) {
  if (!g) return;
  const ay = ctxAy || currentMonth();
  if (!g.monthlyMembers) g.monthlyMembers = {};
  __freezeGroupHistory216(g, ay); // v216: geçmiş aylar sabit — tek sabitleme geçmişi yeniden yazamaz
  const pm = prevMonthISO(ay);""")

# doğrudan kadro yazan yollar da önce dondurur
rep("""    r.monthlyMembers = r.monthlyMembers || {}; r.monthlyMembers[ay] = ros.slice();""",
    """    r.monthlyMembers = r.monthlyMembers || {}; __freezeGroupHistory216(r, ay); r.monthlyMembers[ay] = ros.slice(); // v216: önce geçmiş sabit""")
rep("""    const g = (state.groups || []).find(function(x){ return x && x.id === h.gid; }); if (!g || !g.monthlyMembers) return;
    g.monthlyMembers[h.S] = (g.monthlyMembers[h.S] || []).filter(function(x){ return x !== h.mid; });""",
    """    const g = (state.groups || []).find(function(x){ return x && x.id === h.gid; }); if (!g || !g.monthlyMembers) return;
    if (!(h.S in g.monthlyMembers)) { const __nx216 = (function(){ const p = h.S.split('-').map(Number); const d = new Date(p[0], p[1], 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })(); __freezeGroupHistory216(g, __nx216); } // v216
    g.monthlyMembers[h.S] = (g.monthlyMembers[h.S] || []).filter(function(x){ return x !== h.mid; });""")

# (2) ONARIM-4
rep("""async function __offerSpillJoinRepair191() {
  if (__spillRepairAsked191) return;
  __spillRepairAsked191 = true;
  try { await __offerSpillJoinUndecided195(); } catch(e) {} // v195
  try { await __offerSpillJoinYes213(); } catch(e) {} // v213""", """// v216 ONARIM-4: grubun o ayki derslerine girmiş (yapıldı/yandı) ya da gruba ödemiş ama o ayın kadrosunda görünmeyen — bu yüzden o ay
// Üyeler'de ayrıca BİREYSEL (borçlu) satırı çıkan — üyeler. (Kadro geçmişi tek sabitlemeyle yeniden yazılmış eski gruplar.)
function __groupOrphanScan216() {
  const hits = {};
  try {
    const pmOf = function(x){ return x.packageMonth || String(x.date || '').slice(0, 7); };
    const ev = {}; // gid|mid|ay → {les, paid}
    (state.lessons || []).forEach(function(l){
      if (!l || !l.groupId || (l.status !== 'completed' && l.status !== 'missed')) return;
      const ay = pmOf(l); (l.memberIds || []).forEach(function(mid){ if (!mid) return; const k = l.groupId + '|' + mid + '|' + ay; (ev[k] = ev[k] || { les: 0, paid: 0 }).les++; });
    });
    (state.payments || []).forEach(function(p){
      if (!p || !p.groupId || !p.memberId || p.refund || !((+p.amount || 0) > 0)) return;
      const k = p.groupId + '|' + p.memberId + '|' + pmOf(p); (ev[k] = ev[k] || { les: 0, paid: 0 }).paid += (+p.amount || 0);
    });
    Object.keys(ev).forEach(function(k){
      const parts = k.split('|'); const gid = parts[0], mid = parts[1], ay = parts[2];
      if (!/^\\d{4}-\\d{2}$/.test(ay)) return;
      const g = (state.groups || []).find(function(x){ return x && x.id === gid; }); if (!g || isGroupInactiveInMonth(g, ay)) return;
      const m = (state.members || []).find(function(x){ return x && x.id === mid; }); if (!m) return;
      if (g.orphan216 && g.orphan216[mid + '|' + ay] === 'keep') return;
      if ((resolveGroupMembersForMonth(g, ay) || []).includes(mid)) return;            // kadroda — sorun yok
      if (partialShareFor(g.id, mid, ay)) return;                                       // ayrılan payı var (bilinçli)
      if (!__memberActiveInMonth(m, ay)) return;                                        // o ay pasif — görünmüyor
      if ((state.groups || []).some(function(x){ return x && !isGroupInactiveInMonth(x, ay) && (resolveGroupMembersForMonth(x, ay) || []).includes(mid); })) return; // başka grupta
      if (!__hasIndividualUnit179(mid, ay)) return;                                     // bireysel satırı yok
      if (!(ev[k].paid > 0) && ev[k].les < 2) return;                                   // tek misafir dersi — kadro dışı katılım olabilir
      if ((state.lessons || []).some(function(l){ return l && !l.groupId && l.status !== 'cancelled' && (l.memberIds || []).includes(mid) && pmOf(l) === ay; })) return; // gerçekten bireysel dersleri var
      if ((state.payments || []).some(function(p){ return p && p.memberId === mid && !p.groupId && (+p.amount || 0) > 0 && pmOf(p) === ay; })) return; // bireysel ödemesi var
      const hk = gid + '|' + mid; const h = hits[hk] = hits[hk] || { gid: gid, mid: mid, months: [] };
      h.months.push({ ay: ay, les: ev[k].les, paid: ev[k].paid, bal: (function(){ try { return +memberBalanceForMonth(mid, ay) || 0; } catch(e) { return 0; } })() });
    });
  } catch(e) {}
  return Object.keys(hits).map(function(k){ hits[k].months.sort(function(a, b){ return a.ay < b.ay ? -1 : 1; }); return hits[k]; });
}
function __applyGroupOrphanFix216(h) {
  const g = (state.groups || []).find(function(x){ return x && x.id === h.gid; }); if (!g) return false;
  const last = h.months[h.months.length - 1].ay; const p = last.split('-').map(Number); const d = new Date(p[0], p[1], 1);
  __freezeGroupHistory216(g, d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  h.months.forEach(function(x){
    const cur = (g.monthlyMembers[x.ay] || resolveGroupMembersForMonth(g, x.ay) || []).slice();
    if (cur.includes(h.mid)) return;
    const fi = cur.indexOf(''); if (fi >= 0) cur[fi] = h.mid; else cur.push(h.mid);
    g.monthlyMembers[x.ay] = cur;
  });
  return true;
}
async function __offerGroupOrphanRepair216() {
  const hits = __groupOrphanScan216(); if (!hits.length) return 0;
  let n = 0;
  for (const h of hits) {
    const g = state.groups.find(function(x){ return x && x.id === h.gid; }); const m = state.members.find(function(x){ return x && x.id === h.mid; });
    if (!g || !m) continue;
    const gName = g.name || groupDisplayName(g, h.months[0].ay) || 'Grup'; // kayıtlı ad (o ayın bozuk kadrosundan türeyen ad değil)
    const lines = h.months.map(function(x){ return '• ' + pkgMonthLabel(x.ay) + ': grubun ' + x.les + ' dersinde' + (x.paid ? ', gruba ' + money(x.paid) + ' ₺ ödemiş' : '') + (x.bal > 0 ? ' — ayrıca BİREYSEL ' + money(x.bal) + ' ₺ borçlu görünüyor' : ''); }).join('\\n');
    const ans = await plDialog({
      msg: '🔧 Grubundan düşmüş üye\\n\\n' + m.name + ' — «' + gName + '»\\n\\n' + lines + '\\n\\nBu aylarda grubun derslerine girmiş ama grubun o ayki kadrosunda görünmüyor (grubun eski kadro kaydı sonradan yeniden yazılmış); bu yüzden Üyeler\\'de ayrıca bireysel satırı çıkıyor.\\n\\n"Kadroya geri koy" → o aylarda grubun kadrosuna geri yazılır, bireysel satır/borç kalkar. Dersler ve ödemeler değişmez. (Geri Al ile geri alınabilir.)',
      buttons: [{ label: 'Kadroya geri koy', value: 'fix', cls: 'ok' }, { label: 'Kalsın', value: 'keep', cls: 'secondary' }, { label: 'Sonra', value: null, cls: 'secondary' }],
      escValue: null
    });
    if (ans === 'fix') {
      if (!n) __undoSnapshot('Onarım: grubundan düşmüş üye');
      if (__applyGroupOrphanFix216(h)) { n++; try { __trace('ONARIM v216: ' + m.name + ' «' + gName + '» kadrosuna geri yazıldı: ' + h.months.map(function(x){ return x.ay; }).join(', ')); } catch(e) {} }
    } else if (ans === 'keep') {
      if (!g.orphan216 || typeof g.orphan216 !== 'object') g.orphan216 = {};
      h.months.forEach(function(x){ g.orphan216[h.mid + '|' + x.ay] = 'keep'; }); n++;
    }
  }
  if (n) { save(); try { renderMembers(); renderGroups(); renderDashboard(); renderCalendar(); refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {} }
  return n;
}
async function __offerSpillJoinRepair191() {
  if (__spillRepairAsked191) return;
  __spillRepairAsked191 = true;
  try { await __offerSpillJoinUndecided195(); } catch(e) {} // v195
  try { await __offerSpillJoinYes213(); } catch(e) {} // v213
  try { await __offerGroupOrphanRepair216(); } catch(e) {} // v216""")

io.open(P, 'w', encoding='utf-8').write(s)
W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v215-2026-11-02-138';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v215-2026-11-02-138';", "const CACHE_NAME = 'pilateria-v216-2026-11-02-139';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v216 OK')
