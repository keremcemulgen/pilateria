# -*- coding: utf-8 -*-
# v214 — Kerem 01.11: "İncele hata olmamalı" (ay Kasım'a dönünce 4 test FAIL). İNCELEME: 3 finans testi + individual-unit [4] TEST
# saat bağımlılığı / v190 sonrası bayat sözleşme (uygulama doğru: Ekim hakedişi vadesi, sınır geçen ödeme ayı, 30 gün penceresi,
# v190 "görülmemiş paket görülene kadar kalır"). GERÇEK EKSİK (individual-unit "paketi GEÇEN AY bitmiş pasif birim yine gizli"):
# Panel › "1 Kalan / Biten": kadrosundaki HERKES pasife alınmış (bu ay aktif kadrosu boş) grubun geçen ay biten paketi listede kalıyordu
# — aynı durumdaki pasif BİREYSEL üye düşüyordu (v153), grup için eşdeğer kural yoktu (v190 görülmemiş kuralı v158'i aşınca açığa çıktı).
# ÇÖZÜM: sarkmayan (bu aydan önce biten) paket için grubun bu ay aktif kadrosu boş VE paket kadrosundaki herkes şu an pasifse grup
# fiilen pasiftir → listeden düşer (hem güncel paket satırı hem v190 görülmemiş önceki paket satırları). Sarkan (bu ay süren) paket aynen.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:160])
    s = s.replace(old, new)
rep('<meta name="app-version" content="2026.11.01.136">', '<meta name="app-version" content="2026.11.02.137">')
rep("const APP_VERSION = '2026.11.01.136';", "const APP_VERSION = '2026.11.02.137';")
rep("""function renderDashboard() {""",
    """// v214: paketin kadrosundaki HERKES şu an pasif ve grubun bu ayki aktif kadrosu boş → grup fiilen pasif (pasif bireysel üyeyle aynı
// kural, v153) — Panel "1 Kalan / Biten" listesinden düşer. Sarkan (bu ay süren) paketlere uygulanmaz (çağıran kontrol eder).
function __grpAllPassive214(g, pkgAy, nowAy) {
  try {
    if (!g || !pkgAy || !nowAy) return false;
    if ((activeGroupRosterForMonth(g, nowAy) || []).filter(Boolean).length) return false;
    const ros = (activeGroupRosterForMonth(g, pkgAy) || []).filter(Boolean);
    if (!ros.length) return false;
    return ros.every(function(mid){ const mm = (state.members || []).find(function(x){ return x && x.id === mid; }); return !!mm && isMemberInactiveInMonth(mm, nowAy); });
  } catch(e) { return false; }
}
function renderDashboard() {""")
rep("""          if (isGroupInactiveInMonth(g, pm)) return;""",
    """          if (isGroupInactiveInMonth(g, pm)) return;
          if (!__liveG190 && __pkgEndMonth173('group', g.id, pm) < __nowAy && __grpAllPassive214(g, pm, __nowAy)) return; // v214: herkes pasif → grup fiilen pasif""")
rep("""      if (!__live173 && __groupRemovedForward(g, __nowAy)) return; // v159: sonraki aydan silinen grup takip edilmez""",
    """      if (!__live173 && __groupRemovedForward(g, __nowAy)) return; // v159: sonraki aydan silinen grup takip edilmez
      if (!__live173 && __grpAllPassive214(g, ay, __nowAy)) return; // v214: kadrodaki herkes pasif (bu ay aktif kadro yok) → grup fiilen pasif, bireysel pasif üye gibi düşer""")
# ── (B) ÖDENMİŞ AMA DERSİ OLMAYAN ÖNCEKİ PAKET (Kerem 02.11: "B. T.'ya neden ders yazılmamış gözüküyor Eylül ayinda" → karar
#    "O pakete yazsın, bana sorsun"). ÖLÇÜLDÜ (PC kopyası, salt okunur): bir bireysel üye (B. T.) 27.09 ödemesi "Eylül paketi" ama Eylül'e hiç ders
#    yok; 02.10'dan itibaren dersler (tarihine göre) Ekim paketine yazılmış, Ekim de 18.10'da ödenmiş → ödemeler ile dersler bir paket
#    kaymış. Aynı desen 1 bireysel üyede (Ağu/Eyl) ve 1 grupta (Eki/Kas). Mevcut kayıtlara DOKUNULMADI (Kerem: "bilmiyorum").
#    ÇÖZÜM: yeni ders yazılırken (Toplu Ders Gir açılışı / tek ders kaydı — paket ayı dersin ayında bırakılmışsa) birimin son 2 ayında
#    ÖDENMİŞ ama hiç (iptal dışı) dersi olmayan paketi varsa ve hedef paketin henüz dersi yoksa SORULUR: "<Eylül> paketine yaz" /
#    "<Ekim> paketine yaz". Eylül seçilince o oturumda o birimin sonraki yeni dersleri de, hak dolana kadar Eylül paketine gider.
rep("""function saveLesson() {
  clearModalErrors('modal-lesson');""",
    """// v214 (B): birimin targetAy'dan önceki 2 ayında ÖDENMİŞ ama hiç (iptal dışı) dersi olmayan paket (en eski) — hedef paketin dersi yoksa
function __unusedPaidPkg214(ownerType, ownerId, targetAy) {
  try {
    if (!ownerId || !/^\\d{4}-\\d{2}$/.test(String(targetAy || ''))) return '';
    const pmOf = function(x){ return x.packageMonth || String(x.date || '').slice(0, 7); };
    const mine = function(l){ return l && l.status !== 'cancelled' && (ownerType === 'group' ? l.groupId === ownerId : (!l.groupId && (l.memberIds || []).includes(ownerId))); };
    if ((state.lessons || []).some(function(l){ return mine(l) && pmOf(l) === targetAy; })) return '';
    const base = parseISO(targetAy + '-01'); const months = [];
    for (let i = 2; i >= 1; i--) { const d = new Date(base.getFullYear(), base.getMonth() - i, 1); months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); }
    for (const S of months) {
      const paid = (state.payments || []).some(function(p){ return p && !p.refund && (+p.amount || 0) > 0 && pmOf(p) === S && (ownerType === 'group' ? p.groupId === ownerId : (p.memberId === ownerId && !p.groupId)); });
      if (!paid) continue;
      if ((state.lessons || []).some(function(l){ return mine(l) && pmOf(l) === S; })) continue;
      return S;
    }
  } catch(e) {}
  return '';
}
var __unusedPkgDecided214 = {}; // oturum: 'tip:id|S' → 'no' (bir daha sorma)
var __unusedPkgRoute214 = {};   // oturum: 'tip:id' → S (Evet denen paket; hak dolana kadar yeni dersler oraya)
async function __askUnusedPkg214(ownerType, ownerId, T, S) {
  const g = ownerType === 'group' ? (state.groups || []).find(function(x){ return x && x.id === ownerId; }) : null;
  const name = ownerType === 'group' ? ((g && (groupDisplayName(g, S) || g.name)) || 'Grup') : memberName(ownerId);
  const lblS = pkgMonthLabel(S), lblT = pkgMonthLabel(T);
  const ans = await plDialog({
    msg: '📦 ' + name + ': ' + lblS + ' paketi ÖDENMİŞ ama hiç dersi yok.\\n\\nYazacağın dersler ' + lblS + ' paketine mi yazılsın?\\n(' + lblT + ' paketine yazılırsa ' + lblS + ' ödemesi derssiz kalır, dersler ' + lblT + ' paketinde görünür.)',
    buttons: [{ label: '📦 ' + lblS + ' paketine yaz', value: 'S', cls: 'ok' }, { label: lblT + ' paketine yaz', value: 'T', cls: 'secondary' }],
    escValue: null
  });
  if (ans === null || ans === undefined) return null; // vazgeç
  const k = ownerType + ':' + ownerId;
  if (ans === 'S') { __unusedPkgRoute214[k] = S; return S; }
  __unusedPkgDecided214[k + '|' + S] = 'no';
  return T;
}
function saveLesson() {
  clearModalErrors('modal-lesson');""")
rep("""  else if (checked.length === 1) packageMonth = String(date).slice(0,7); // v107: dersin ayi
  else packageMonth = String(date).slice(0,7);""",
    """  else if (checked.length === 1) packageMonth = String(date).slice(0,7); // v107: dersin ayi
  else packageMonth = String(date).slice(0,7);
  // v214 (B): YENİ ders, paket ayı dersin ayında bırakılmış → birimin ödenmiş ama dersi olmayan önceki paketi varsa SOR (Kerem: "bana sorsun")
  if (!id && !window.__unusedPkgSaving214 && packageMonth < String(date).slice(0, 7)) {
    // Seçici bir önceki dersten "<önceki ay>" seçili kaldıysa ve o paket bu oturumda bu soruyla seçildiyse: hakkı dolunca dersin ayına döner
    const __ow0 = groupId ? 'group:' + groupId : (checked.length === 1 ? 'member:' + checked[0] : '');
    if (__ow0 && __unusedPkgRoute214[__ow0] === packageMonth && sessionsRemainingFor(__ow0.split(':')[0], __ow0.slice(__ow0.indexOf(':') + 1), packageMonth) <= 0) {
      delete __unusedPkgRoute214[__ow0];
      packageMonth = String(date).slice(0, 7);
      try { const __sel0 = document.getElementById('ml-pkg-month'); if (__sel0 && [...__sel0.options].some(function(o){ return o.value === packageMonth; })) __sel0.value = packageMonth; } catch(e) {}
    }
  }
  if (!id && !window.__unusedPkgSaving214 && packageMonth === String(date).slice(0, 7)) {
    const __own214 = groupId ? ['group', groupId] : (checked.length === 1 ? ['member', checked[0]] : null);
    if (__own214) {
      const __k214 = __own214[0] + ':' + __own214[1];
      const __r214 = __unusedPkgRoute214[__k214];
      if (__r214 && __r214 < packageMonth && (sessionsRemainingFor(__own214[0], __own214[1], __r214) > 0)) {
        packageMonth = __r214; // oturumda "Eylül paketine yaz" denmişti — hak dolana kadar
        try { const __sel = document.getElementById('ml-pkg-month'); if (__sel) { if (![...__sel.options].some(function(o){ return o.value === __r214; })) { const o = document.createElement('option'); o.value = __r214; o.textContent = __r214; __sel.appendChild(o); } __sel.value = __r214; } } catch(e) {}
      } else {
        const __S214 = __unusedPaidPkg214(__own214[0], __own214[1], packageMonth);
        if (__S214 && __unusedPkgDecided214[__k214 + '|' + __S214] !== 'no') {
          (async function(){
            const useAy = await __askUnusedPkg214(__own214[0], __own214[1], packageMonth, __S214);
            if (!useAy) return;
            const __sel = document.getElementById('ml-pkg-month');
            if (__sel) { if (![...__sel.options].some(function(o){ return o.value === useAy; })) { const o = document.createElement('option'); o.value = useAy; o.textContent = useAy; __sel.appendChild(o); } __sel.value = useAy; }
            window.__unusedPkgSaving214 = true;
            try { saveLesson(); } finally { window.__unusedPkgSaving214 = false; }
          })();
          return;
        }
      }
    }
  }""")
rep("""function openBatchDatesGroup(groupId, monthISO) {
  const g = state.groups.find(x=>x.id===groupId); if (!g) return;""",
    """function openBatchDatesGroup(groupId, monthISO) {
  const g = state.groups.find(x=>x.id===groupId); if (!g) return;
  if (!window.__unusedPkgBatch214) { // v214 (B): ödenmiş ama dersi olmayan önceki paket → SOR
    const __T = monthISO || currentMonth(); const __S = __unusedPaidPkg214('group', groupId, __T);
    if (__S && __unusedPkgDecided214['group:' + groupId + '|' + __S] !== 'no') { (async function(){ const ay = await __askUnusedPkg214('group', groupId, __T, __S); if (!ay) return; window.__unusedPkgBatch214 = true; try { openBatchDatesGroup(groupId, ay); } finally { window.__unusedPkgBatch214 = false; } })(); return; }
  }""")
rep("""function openBatchDatesMember(memberId, monthISO) {
  const m = state.members.find(x => x.id === memberId); if (!m) return;""",
    """function openBatchDatesMember(memberId, monthISO) {
  const m = state.members.find(x => x.id === memberId); if (!m) return;
  if (!window.__unusedPkgBatch214) { // v214 (B): ödenmiş ama dersi olmayan önceki paket → SOR
    const __T = monthISO || currentMonth(); const __S = __unusedPaidPkg214('member', memberId, __T);
    if (__S && __unusedPkgDecided214['member:' + memberId + '|' + __S] !== 'no') { (async function(){ const ay = await __askUnusedPkg214('member', memberId, __T, __S); if (!ay) return; window.__unusedPkgBatch214 = true; try { openBatchDatesMember(memberId, ay); } finally { window.__unusedPkgBatch214 = false; } })(); return; }
  }""")
io.open(P, 'w', encoding='utf-8').write(s)
W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v213-2026-11-01-136';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v213-2026-11-01-136';", "const CACHE_NAME = 'pilateria-v214-2026-11-02-137';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v214 OK')
