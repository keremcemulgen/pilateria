# -*- coding: utf-8 -*-
# v125 — DEPOLAMA HIJYENI + PANEL PERFORMANSI + RENDER YONLENDIRME
# 3 is: (A) budanmayan localStorage anahtarlari (iPhone ~5MB kotasi 6. ayda %226 olacakti)
#       (B) getNextWeekMissing/getOverduePayments kare karmasiklik -> tek gecislik Map indeksi
#       (C) 6 kaydetme yolundaki coklu tam-sayfa render zinciri -> __refreshUIInPlace()
# (B) icin davranis ESDEGERLIK testiyle korunur (cikti birebir ayni olmali).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ================= A) DEPOLAMA =================
# A1. bozuk-yedek yazarken de en fazla 2 anahtar
rep("""      localStorage.setItem('pilateria_corrupted_BACKUP_' + Date.now(), raw.substring(0, 100000));
""",
"""      // v125: bozuk-yedek anahtarlari sinirsiz birikiyordu — yazarken de en fazla 2 tut
      const __oldCb = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('pilateria_corrupted_BACKUP_') === 0) __oldCb.push(k); }
      __oldCb.sort(); while (__oldCb.length >= 2) { try { localStorage.removeItem(__oldCb.shift()); } catch(_) {} }
      localStorage.setItem('pilateria_corrupted_BACKUP_' + Date.now(), raw.substring(0, 100000));
""")

# A2. gunluk halka 5 -> 3 (sunucu tarafinda saatlik 3g + gecelik 30g + aybasi 400g var — 2026-07-27'den beri)
rep("""    while (mine.length >= 5) localStorage.removeItem(mine.shift()); // en fazla 5 gun
""",
"""    while (mine.length >= 3) localStorage.removeItem(mine.shift()); // v125: en fazla 3 gun (sunucuda saatlik+gecelik+aybasi yedek var)
""")

# A3. acilis budayicisi + acil budama — __pilDailySnapshot'in hemen onune
rep("""function __pilDailySnapshot() {
""",
"""// v125: DEPOLAMA HIJYENI — budanmayan anahtarlar iPhone ~5MB kotasini zamanla dolduruyordu.
function __pilLsKeys(prefix) {
  const out = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(prefix) === 0) out.push(k); } } catch(e) {}
  return out.sort();
}
function __pilStoragePrune(aggressive) {
  try {
    const cb = __pilLsKeys('pilateria_corrupted_BACKUP_');
    const keepCb = aggressive ? 0 : 1;
    while (cb.length > keepCb) { try { localStorage.removeItem(cb.shift()); } catch(e) {} }
    const dl = __pilLsKeys('pilateria_daily_');
    const keepDl = aggressive ? 1 : 3;
    while (dl.length > keepDl) { try { localStorage.removeItem(dl.shift()); } catch(e) {} }
    if (aggressive) {
      // bulut (saatlik/gecelik/aybasi) + pre_cloud_1..5 halkasi koruyor; tek-slot eski yedekler kota aciliyken feda edilir
      ['pilateria_pre_pull_backup', 'pilateria_pre_overwrite_backup', 'pilateria_pre_cloud_backup'].forEach(function(k){ try { localStorage.removeItem(k); } catch(e) {} });
    }
    return true;
  } catch(e) { return false; }
}
function __pilDailySnapshot() {
""")

# A4. acilista buda (gunluk yedekten ONCE)
rep("""__pilDailySnapshot(); // v104: gunun ilk acilisinda cihaz-ici gunluk yedek (bulut/giris beklemez)
init().catch(""",
"""__pilStoragePrune(false); // v125: acilis budamasi — bozuk-yedek 1, gunluk halka 3
__pilDailySnapshot(); // v104: gunun ilk acilisinda cihaz-ici gunluk yedek (bulut/giris beklemez)
init().catch(""")

# A5. save(): kota dolunca otomatik buda + BIR kez yeniden dene; basari sinyali dondur
rep("""    if (SUPABASE_MODE && !window.__pilSuppressDirty && !__sbApplying) __trace('✎ YEREL değişiklik kaydedildi');
""",
"""    if (SUPABASE_MODE && !window.__pilSuppressDirty && !__sbApplying) __trace('✎ YEREL değişiklik kaydedildi');
    return true;
""")

rep("""    if (e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message||''))) {
      alert(
""",
"""    if (e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message||''))) {
      // v125: once KENDI KENDINE kurtar — agresif buda ve BIR kez yeniden dene
      if (!window.__pilQuotaRetry) {
        window.__pilQuotaRetry = true;
        try {
          __pilStoragePrune(true);
          localStorage.setItem('pilateria', JSON.stringify(state));
          window.__pilQuotaRetry = false;
          try { if (typeof __trace === 'function') __trace('🧹 DEPO DOLDU — eski yedekler budandi, kayit kurtarildi'); } catch(_) {}
          if (window.plToast) plToast('🧹 Yerel depo doldu — eski yedekler budandı, kaydın kurtarıldı');
          markDirtyAndSchedulePush();
          if (SUPABASE_MODE) sbSchedulePush();
          return true;
        } catch(e2) { window.__pilQuotaRetry = false; }
      }
      alert(
""")

rep("""        '1. Eski yedekleri temizle: F12 → Application → Local Storage → eski "pilateria_corrupted_BACKUP_*" leri sil\\n' +
""",
"""        '1. Otomatik budama da yetmedi — sayfayı tam yenile (Ctrl+Shift+R), sorun sürerse Claude\\'a bildir\\n' +
""")

rep("""    } else {
      alert('⚠️ Kayıt sırasında hata: ' + (e && e.message || e));
    }
  }
}
function uid() {""",
"""    } else {
      alert('⚠️ Kayıt sırasında hata: ' + (e && e.message || e));
    }
    return false;
  }
}
function uid() {""")

# ================= B) PANEL PERFORMANSI =================
# B1. getNextWeekMissing — entity basina tam ders taramasi yerine tek gecis
rep("""  const hasInRange = (pred) => state.lessons.some(l => { if(!l||l.status==='cancelled') return false; const d=parseISO(l.date); return d>=start && d<end && pred(l); });
  const groups = state.groups.filter(g => !isGroupInactiveInMonth(g, cm) && __activeRosterForMonth(g, cm).length>0 && !hasInRange(l => l.groupId===g.id));
  const inAnyGroup = new Set(); state.groups.forEach(g => __activeRosterForMonth(g, cm).forEach(id=>inAnyGroup.add(id)));
  const members = state.members.filter(m => !m.archived && isMemberEnrolledInMonth(m.id, cm) && !inAnyGroup.has(m.id) && !hasInRange(l => !l.groupId && (l.memberIds||[]).includes(m.id)));
""",
"""  // v125: TEK GECIS — grup/uye basina tam state.lessons taramasi kare karmasiklikti (ay 36'da ~1.5 sn olacakti)
  const __gHas = new Set(), __mHas = new Set();
  state.lessons.forEach(l => {
    if (!l || l.status === 'cancelled') return;
    const d = parseISO(l.date);
    if (!(d >= start && d < end)) return;
    if (l.groupId) __gHas.add(l.groupId);
    else (l.memberIds || []).forEach(id => __mHas.add(id));
  });
  const groups = state.groups.filter(g => !isGroupInactiveInMonth(g, cm) && __activeRosterForMonth(g, cm).length>0 && !__gHas.has(g.id));
  const inAnyGroup = new Set(); state.groups.forEach(g => __activeRosterForMonth(g, cm).forEach(id=>inAnyGroup.add(id)));
  const members = state.members.filter(m => !m.archived && isMemberEnrolledInMonth(m.id, cm) && !inAnyGroup.has(m.id) && !__mHas.has(m.id));
""")

# B2. getOverduePayments — ders ve odeme indeksleri (cikti birebir ayni)
rep("""function getOverduePayments() {
  const today = todayISO();
  const out = [];
""",
"""function getOverduePayments() {
  const today = todayISO();
  const out = [];
  // v125: TEK GECISLIK INDEKSLER — eski kod grup ve uye basina TUM ders/odeme dizisini tariyordu
  const __gLes = new Map(), __mLes = new Map();
  state.lessons.forEach(l => {
    if (!l || l.status === 'cancelled') return;
    if (l.groupId) { let a = __gLes.get(l.groupId); if (!a) __gLes.set(l.groupId, a = []); a.push(l); }
    else (l.memberIds || []).forEach(mid => { let a = __mLes.get(mid); if (!a) __mLes.set(mid, a = []); a.push(l); });
  });
  const __gPaid = new Map(), __mPaid = new Map();
  state.payments.forEach(p => {
    if (!p) return;
    const ay = p.packageMonth || (p.date ? String(p.date).slice(0,7) : '');
    if (p.groupId) { const k = p.groupId + '|' + ay; __gPaid.set(k, (__gPaid.get(k) || 0) + (+p.amount || 0)); }
    else if (p.memberId) { const k = p.memberId + '|' + ay; __mPaid.set(k, (__mPaid.get(k) || 0) + (+p.amount || 0)); }
  });
""")

rep("""    const gLessons = state.lessons.filter(l => l.groupId === g.id && l.status !== 'cancelled');
    if (!gLessons.length) return;
    const rows = __ovRows(__ovMonths(gLessons),
      ay => (isGroupInactiveInMonth(g, ay) ? 0 : groupExpectedTotal(g, ay)),
      ay => groupPaidForMonth(g, ay));
""",
"""    const gLessons = __gLes.get(g.id) || [];
    if (!gLessons.length) return;
    const rows = __ovRows(__ovMonths(gLessons),
      ay => (isGroupInactiveInMonth(g, ay) ? 0 : groupExpectedTotal(g, ay)),
      ay => __gPaid.get(g.id + '|' + ay) || 0);
""")

rep("""    const mLessons = state.lessons.filter(l => l && !l.groupId && l.status !== 'cancelled' && (l.memberIds||[]).includes(m.id));
    if (!mLessons.length) return;
    const rows = __ovRows(__ovMonths(mLessons),
      ay => (memberActiveGroupForMonth(m.id, ay) ? 0 : ((+memberMonthlyTotalPrice(m.id, ay) || 0) || (m.totalPrice ? +m.totalPrice : 0))),
      ay => memberPaidForMonth(m.id, ay));
""",
"""    const mLessons = __mLes.get(m.id) || [];
    if (!mLessons.length) return;
    const rows = __ovRows(__ovMonths(mLessons),
      ay => (memberActiveGroupForMonth(m.id, ay) ? 0 : ((+memberMonthlyTotalPrice(m.id, ay) || 0) || (m.totalPrice ? +m.totalPrice : 0))),
      ay => __mPaid.get(m.id + '|' + ay) || 0);
""")

# ================= C) RENDER YONLENDIRME (6 kaydetme yolu) =================
rep("""  renderGroups(); renderMembers(); renderCalendar(); renderDashboard();
""",
"""  __refreshUIInPlace(); // v125: yalniz aktif sayfa — digerleri sayfaya girince zaten render olur
""")

rep("""    save(); renderMembers(); renderPayments(); renderDashboard(); renderGroups(); refreshGroupDetailIfOpen();
""",
"""    save(); __refreshUIInPlace(); // v125
""")

rep("""  renderMembers(); renderPayments(); renderDashboard(); renderGroups();
""",
"""  __refreshUIInPlace(); // v125
""")

rep("""  renderPayments(); renderDashboard(); renderMembers(); renderCalendar(); if(typeof renderReports==='function') renderReports();
  if (groupId) renderGroups();
""",
"""  __refreshUIInPlace(); // v125: yalniz aktif sayfa + acik detaylar
""")

rep("""  renderPayments(); renderDashboard(); renderMembers(); renderGroups(); renderCalendar();
""",
"""  __refreshUIInPlace(); // v125
""")

rep("""  renderPayments(); renderDashboard();
}
function renderPayments() {""",
"""  __refreshUIInPlace(); // v125
}
function renderPayments() {""")

# ================= SURUM =================
rep('<meta name="app-version" content="2026.07.29.47">', '<meta name="app-version" content="2026.07.29.48">')
rep("const APP_VERSION = '2026.07.29.47';", "const APP_VERSION = '2026.07.29.48';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v124-2026-07-29-47';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v125-2026-07-29-48';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
