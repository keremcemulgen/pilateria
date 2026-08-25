# -*- coding: utf-8 -*-
# v154 — Kerem (2026-08-24): "Yandi ve yapildi olan derslerin toplami 8'i GECEMEZ (ayarlardan ben
# degistirmedigim surece). Toplu ders gir kismindan ya da takvimden, bu iki toplam 8 olmus
# kisilere 9. ders GIRILEMEZ. Ayarlarda ders paketleri ayarindan degistirmedigim surece boyle."
# KOK NEDEN: kota kanonu (v43 sessionsRemainingFor) yalniz GOSTERIM/odeme secicilerindeydi;
# YAZMA yollari denetimsizdi: saveLesson (takvim+modal), saveBatchDates (toplu), iptal->yapildi
# durum gecisleri (quickSetStatus + markLessonStatus) ve scheduleGroupMonth (4 haftalik otomatik).
# v154 KURALI (kesin tavan): birimin (grup ya da bireysel uye) bir paket ayindaki IPTAL-DISI ders
# sayisi, paketin hakkini (sessionQuotaFor: Ayarlar'daki paket tanimi / aylik override) ASAMAZ.
#  - Yeni ders (modal/takvim/toplu/otomatik) dolu birime YAZILMAZ (v18 kanonu: sorun varsa hicbir
#    kayit yazilmaz).
#  - Iptal edilmis dersi geri acmak (iptal -> yapildi/yandi/planli) tavani asacaksa ENGELLENIR.
#  - Mevcut dersi duzenlemek serbesttir (kendisi sayilmaz); iptal kaydini iptal olarak duzenlemek
#    hak yemez. Hak artirilirsa ayni giris kendiliginden serbest kalir.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) ortak tavan yardimcisi (sessionsRemainingFor'un hemen ardina) ----------
rep("""// Bir uyenin O AYKI kalan dersi: grup uyesiyse GRUBUN kalani (tek birim), degilse bireysel.""",
"""// v154 (Kerem): DERS HAKKI TAVANI — birimin paket ayindaki IPTAL-DISI ders sayisi hakki asamaz.
// excludeLessonId: duzenlenen dersin kendisi sayilmaz. Donus: engel mesaji ya da null (serbest).
function quotaCeilingMsg(ownerType, ownerId, pm, excludeLessonId) {
  const quota = sessionQuotaFor(ownerType, ownerId, pm);
  if (!(quota > 0)) return null;
  const dolu = (state.lessons || []).filter(function(l){
    if (!l || l.id === excludeLessonId || l.status === 'cancelled') return false;
    const lpm = l.packageMonth || String(l.date || '').slice(0, 7);
    if (lpm !== pm) return false;
    if (ownerType === 'group') return l.groupId === ownerId;
    return !l.groupId && (l.memberIds || []).includes(ownerId);
  }).length;
  if (dolu >= quota) {
    const ad = ownerType === 'group' ? groupNameForMonth(ownerId, pm) : memberName(ownerId);
    return '⛔ ' + ad + ' — ' + pm + ' paketinde ders hakkı dolu (' + dolu + '/' + quota + '). ' +
      (quota + 1) + '. ders girilemez. Hakkı artırmak için Ayarlar → Ders Paketleri ya da detaydaki "hak: düzenle".';
  }
  return null;
}
// Bir uyenin O AYKI kalan dersi: grup uyesiyse GRUBUN kalani (tek birim), degilse bireysel.""")

# ---------- 2) saveLesson (takvim + modal): dolu birime yeni ders yazilmaz ----------
rep("""  else packageMonth = String(date).slice(0,7);
  let packageOwnerType = '';""",
"""  else packageMonth = String(date).slice(0,7);
  // v154 (Kerem): HAK TAVANI — dolu birime yeni ders girilemez; iptal kaydini duzenlemek hak yemez.
  {
    const __ex154 = id ? state.lessons.find(function(x){ return x.id === id; }) : null;
    const __willCount = __ex154 ? (__ex154.status !== 'cancelled') : true;
    if (__willCount) {
      const __units = groupId ? [['group', groupId]] : checked.map(function(mid){ return ['member', mid]; });
      for (let __i = 0; __i < __units.length; __i++) {
        const __qmsg = quotaCeilingMsg(__units[__i][0], __units[__i][1], packageMonth, id || null);
        if (__qmsg) { w.textContent = __qmsg; return; }
      }
    }
  }
  let packageOwnerType = '';""")

# ---------- 3) saveBatchDates (toplu): sonuc listesi hakki asarsa hicbir kayit yazilmaz ----------
rep("""function saveBatchDates() {
  if (!__batchDatesTarget) return;
  const packageMonth = __batchDatesTarget.packageMonth || currentMonth();""",
"""function saveBatchDates() {
  if (!__batchDatesTarget) return;
  const packageMonth = __batchDatesTarget.packageMonth || currentMonth();
  // v154 (Kerem): HAK TAVANI — listedeki iptal-disi satir sayisi paketin hakkini asamaz (v18: hicbir kayit yazilmaz).
  {
    const __resCnt = (__batchDatesRows || []).filter(function(r){ return r && (r.status || 'planned') !== 'cancelled'; }).length;
    const __q154 = sessionQuotaFor(__batchDatesTarget.type, __batchDatesTarget.id, packageMonth);
    if (__q154 > 0 && __resCnt > __q154) {
      const __ad154 = __batchDatesTarget.type === 'group' ? groupNameForMonth(__batchDatesTarget.id, packageMonth) : memberName(__batchDatesTarget.id);
      alert('⛔ ' + __ad154 + ' — ' + packageMonth + ' paketinde hak ' + __q154 + ' ders; listede ' + __resCnt + ' iptal-dışı ders var. Hakkı aşan giriş yapılamaz (Ayarlar → Ders Paketleri ya da detaydaki "hak: düzenle" ile artırabilirsin). Hiçbir kayıt yazılmadı.');
      return;
    }
  }""")

# ---------- 4) quickSetStatus: iptali geri acmak tavani asamaz ----------
rep("""function quickSetStatus(id, status) {
  const l = state.lessons.find(x=>x.id===id); if (!l) return;
  const prev = l.status || 'planned';""",
"""function quickSetStatus(id, status) {
  const l = state.lessons.find(x=>x.id===id); if (!l) return;
  const prev = l.status || 'planned';
  // v154 (Kerem): iptal edilmis dersi geri acmak hak tavanini asacaksa ENGELLENIR.
  if (prev === 'cancelled' && status !== 'cancelled') {
    const __pm = l.packageMonth || String(l.date || '').slice(0, 7);
    const __units = l.groupId ? [['group', l.groupId]] : (l.memberIds || []).map(function(mid){ return ['member', mid]; });
    for (let __i = 0; __i < __units.length; __i++) {
      const __qmsg = quotaCeilingMsg(__units[__i][0], __units[__i][1], __pm, l.id);
      if (__qmsg) { alert(__qmsg + '\\n\\nİptali geri açmak için önce başka bir dersi iptal et ya da hakkı artır.'); return; }
    }
  }""")

# ---------- 5) markLessonStatus (modal durum degistirme): ayni kural ----------
rep("""  const l = state.lessons.find(x=>x.id===id); if (!l) return;
  const prev = l.status || 'planned';
  // Only consume rights on transition TO cancelled (from non-cancelled)""",
"""  const l = state.lessons.find(x=>x.id===id); if (!l) return;
  const prev = l.status || 'planned';
  // v154 (Kerem): iptal edilmis dersi geri acmak hak tavanini asacaksa ENGELLENIR.
  if (prev === 'cancelled' && newStatus !== 'cancelled') {
    const __pm = l.packageMonth || String(l.date || '').slice(0, 7);
    const __units = l.groupId ? [['group', l.groupId]] : (l.memberIds || []).map(function(mid){ return ['member', mid]; });
    for (let __i = 0; __i < __units.length; __i++) {
      const __qmsg = quotaCeilingMsg(__units[__i][0], __units[__i][1], __pm, l.id);
      if (__qmsg) { alert(__qmsg + '\\n\\nİptali geri açmak için önce başka bir dersi iptal et ya da hakkı artır.'); return; }
    }
  }
  // Only consume rights on transition TO cancelled (from non-cancelled)""")

# ---------- 6) scheduleGroupMonth (4 haftalik otomatik): tavani asan gunler atlanir ----------
rep("""      if (usedRf + needed > getReformers() || instConflict) { skipped++; continue; }
      state.lessons.push({""",
"""      if (usedRf + needed > getReformers() || instConflict) { skipped++; continue; }
      if (quotaCeilingMsg('group', groupId, dISO.slice(0, 7), null)) { skipped++; continue; } // v154: hak tavani
      state.lessons.push({""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.24.76">', '<meta name="app-version" content="2026.08.24.77">')
rep("const APP_VERSION = '2026.08.24.76';", "const APP_VERSION = '2026.08.24.77';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v153-2026-08-24-76';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v154-2026-08-24-77';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
