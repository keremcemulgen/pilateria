# -*- coding: utf-8 -*-
# v213 — ÖNCEKİ AYIN PAKETİNE ASLA YAZMA (Kerem 01.11): "Uygulama yine geriye dönük üye ekliyor. Hemen kontrol et sebebini bul.
# Kadroya üye ekliyorum Ekim için uyarı veriyor eylüle üye ekliyor borç ödeme çıkarıyor."
# KÖK (yeniden üretildi — no-spill-join-213-test yamasız v212'de FAIL): Ekim'e gruba üye eklenince grubun Eylül paketinden Ekim tarihli
# "planlı" (işaretlenmemiş) dersi varsa v195 sorusu çıkıyordu: «Eylül paketi Ekim ayına sarkıyor … X bu derslere de girsin mi?»
# [✅ Evet, Eylül paketine de girsin] [Hayır, yalnız Ekim]. Evet (yeşil, ilk düğme) → üye Eylül kadrosuna + Eylül'ün planlı derslerine
# yazılıyor; ardından "kalan derse göre ücret" sorusu Vazgeç ile geçilince Eylül için TAM ÜCRET borcu → Geciken Ödemeler'de Eylül borcu.
# (Hayır seçilince Eylül'e bir şey yazılmıyordu.) Aynı şikâyet v195'te (15.10, "Ekim'e üye ekliyorum, Eylül'e de ekliyor") soruya
# çevrilmişti; Kerem kararı (AskUserQuestion 01.11): "Hiç sorma, asla yazma" + onarım "Bulup listele, ben onaylayayım".
# ÇÖZÜM: (1) __joinSpilledPackage186 hiçbir şey yapmaz — bir aya eklenen üye YALNIZ o ay ve sonrasına yazılır (gerekirse önceki ayın
# sayfasından elle eklenir). (2) ONARIM-3: açılışta "Eylül paketine de girsin = Evet" kararıyla önceki aya yazılmış ve hâlâ o ayın
# kadrosunda duran üyeler tek tek sorulur: "<Ay> paketinden çıkar" → o ayın kadrosu, planlı dersleri, kalan derse göre yazılan
# ücret/hak ve (başka kaydı yoksa) o ay kaydı geri alınır → borç kalkar; yapılmış dersler ve girilmiş ödemeler SİLİNMEZ.
# "Kalsın" → bir daha sorulmaz.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:160])
    s = s.replace(old, new)

rep('<meta name="app-version" content="2026.10.24.135">', '<meta name="app-version" content="2026.11.01.136">')
rep("const APP_VERSION = '2026.10.24.135';", "const APP_VERSION = '2026.11.01.136';")

# (1) önceki ayın paketine ne otomatik ne soruyla yazılır
rep("""function __joinSpilledPackage186(g, mid, ctxAy) {
  try {
    if (!g || !mid || !ctxAy) return '';""",
    """function __joinSpilledPackage186(g, mid, ctxAy) {
  // v213 (Kerem 01.11: "Uygulama yine geriye dönük üye ekliyor … Ekim için uyarı veriyor eylüle üye ekliyor borç ödeme çıkarıyor" →
  // karar "Hiç sorma, asla yazma"): bir aya eklenen üye YALNIZ o ay ve sonrasına yazılır; önceki ayın (sarkan) paketine ne otomatik
  // ne soruyla yazılır. Gerekirse önceki ayın sayfasından elle eklenir. (Aşağıdaki eski gövde çalışmaz — geçmiş kayıt için duruyor.)
  try { if (g && mid && ctxAy && __groupSpillMonth186(g, ctxAy)) __trace('SARKAN PAKET (v213): ' + mid + ' yalnız ' + ctxAy + ' ve sonrasına yazıldı — önceki ayın paketine dokunulmadı'); } catch(e) {}
  return '';
  try {
    if (!g || !mid || !ctxAy) return '';""")

# (2) ONARIM-3: "Evet" kararıyla önceki aya yazılmış üyeler — tek tek sorulur
rep("""async function __offerSpillJoinRepair191() {
  if (__spillRepairAsked191) return;
  __spillRepairAsked191 = true;
  try { await __offerSpillJoinUndecided195(); } catch(e) {} // v195""",
    """// v213 ONARIM-3 (Kerem 01.11 "Bulup listele, ben onaylayayım"): "<önceki ay> paketine de girsin = Evet" kararıyla önceki ayın paketine
// yazılmış ve hâlâ o ayın kadrosunda duran üyeler. Çıkarılırsa: o ayın kadrosu, planlı dersleri, kalan derse göre yazılan ücret/hak ve
// (başka kaydı yoksa) o ay kaydı geri alınır → o ayın borcu kalkar. Yapılmış dersler ve girilmiş ödemeler SİLİNMEZ.
function __spillJoinYesScan213() {
  const hits = [];
  try {
    (state.groups || []).forEach(function(g){
      if (!g || !g.spillJoin195 || typeof g.spillJoin195 !== 'object') return;
      Object.keys(g.spillJoin195).forEach(function(k){
        if (g.spillJoin195[k] !== 'yes') return;
        const i = String(k).lastIndexOf('|'); if (i < 1) return;
        const mid = String(k).slice(0, i), S = String(k).slice(i + 1);
        if (!/^\\d{4}-\\d{2}$/.test(S) || S < __SPILL_SCAN_SINCE195) return;
        const inS = (activeGroupRosterForMonth(g, S) || []).includes(mid) || ((g.monthlyMembers || {})[S] || []).includes(mid);
        if (!inS) return; // zaten çıkmış
        const m = (state.members || []).find(function(x){ return x && x.id === mid; }); if (!m) return;
        const pmOf = function(x){ return x.packageMonth || String(x.date || '').slice(0, 7); };
        const jd = String(((g.memberJoinDates || {})[mid]) || '');
        let T = jd.slice(0, 7);
        if (!T || T <= S) { const p = S.split('-').map(Number); const dt = new Date(p[0], p[1], 1); T = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); }
        const done = (state.lessons || []).filter(function(l){ return l && l.groupId === g.id && (l.status === 'completed' || l.status === 'missed') && pmOf(l) === S && (l.memberIds || []).includes(mid); }).length;
        const planned = (state.lessons || []).filter(function(l){ return l && l.groupId === g.id && l.status === 'planned' && pmOf(l) === S && (l.memberIds || []).includes(mid); }).length;
        const paid = (state.payments || []).filter(function(p){ return p && p.memberId === mid && (p.groupId || '') === g.id && pmOf(p) === S; }).reduce(function(a, p){ return a + (+p.amount || 0); }, 0);
        hits.push({ gid: g.id, mid: mid, S: S, T: T, done: done, planned: planned, paid: paid });
      });
    });
  } catch(e) {}
  return hits;
}
async function __offerSpillJoinYes213() {
  const hits = __spillJoinYesScan213(); if (!hits.length) return 0;
  let n = 0;
  for (const h of hits) {
    const g = state.groups.find(function(x){ return x && x.id === h.gid; }); const m = state.members.find(function(x){ return x && x.id === h.mid; });
    if (!g || !m) continue;
    const lblS = pkgMonthLabel(h.S), lblT = pkgMonthLabel(h.T);
    const ans = await plDialog({
      msg: '🔧 Önceki aya yazılmış üye\\n\\n' + m.name + ' — «' + (groupDisplayName(g, h.S) || g.name || 'Grup') + '»\\n\\n' + lblT + ' için gruba alınırken "' + lblS + ' paketine de girsin" seçilmiş; ' + lblS + ' kadrosuna yazılmış'
        + (h.planned ? ', ' + lblS + ' paketinin ' + h.planned + ' planlı dersinde görünüyor' : '') + (h.done ? '; bu paketten ' + h.done + ' ders yapılmış görünüyor (yapılmış dersler olduğu gibi kalır)' : '') + '.'
        + (h.paid ? '\\n' + lblS + ' için ' + money(h.paid) + ' ₺ ödeme girilmiş — ödeme SİLİNMEZ.' : '')
        + '\\n\\n"' + lblS + ' paketinden çıkar" → ' + lblS + ' kadrosu, planlı dersleri, kalan derse göre yazılan ücret/hak ve ' + lblS + ' borcu kalkar. ' + lblT + ' kaydı aynen kalır. (Geri Al ile geri alınabilir.)',
      buttons: [{ label: lblS + ' paketinden çıkar', value: 'remove', cls: 'ok' }, { label: 'Kalsın', value: 'keep', cls: 'secondary' }, { label: 'Sonra', value: null, cls: 'secondary' }],
      escValue: null
    });
    if (ans === 'remove') {
      if (!n) __undoSnapshot('Onarım: önceki aya yazılmış üye');
      __spillJoinUndo195(g, h.mid, h.S, h.T); __spillJoinRecord195(g, h.mid, h.S, 'no'); n++;
      try { __trace('ONARIM v213: ' + m.name + ' ' + h.S + ' paketinden çıkarıldı'); } catch(e) {}
    } else if (ans === 'keep') { __spillJoinRecord195(g, h.mid, h.S, 'keep'); n++; }
  }
  if (n) { save(); try { renderMembers(); renderGroups(); renderDashboard(); renderCalendar(); refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {} }
  return n;
}
async function __offerSpillJoinRepair191() {
  if (__spillRepairAsked191) return;
  __spillRepairAsked191 = true;
  try { await __offerSpillJoinUndecided195(); } catch(e) {} // v195
  try { await __offerSpillJoinYes213(); } catch(e) {} // v213""")

# v195 onarımında "Kalsın" artık 'keep' yazar ('yes' = eski soruda "Evet" — v213 onarımı bunları sorar; Kerem'in onayladığını tekrar sormaz)
rep("""    else if (ans === 'keep') { __spillJoinRecord195(g, h.mid, h.S, 'yes'); n++; }
  }
  if (n) { save(); try { renderMembers(); renderGroups(); renderDashboard(); renderCalendar(); refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {} }
}
// v213 ONARIM-3""", """    else if (ans === 'keep') { __spillJoinRecord195(g, h.mid, h.S, 'keep'); n++; } // v213: 'keep' (onaylandı) — 'yes' v213 onarımında yeniden sorulurdu
  }
  if (n) { save(); try { renderMembers(); renderGroups(); renderDashboard(); renderCalendar(); refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {} }
}
// v213 ONARIM-3""")
io.open(P, 'w', encoding='utf-8').write(s)
W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v212-2026-10-24-135';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v212-2026-10-24-135';", "const CACHE_NAME = 'pilateria-v213-2026-11-01-136';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v213 OK')
