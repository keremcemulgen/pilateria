# -*- coding: utf-8 -*-
# v162 — Kerem (2026-09-01, ACIL): Temmuz paketi Agustos'a sarkan grubun uyelerini Agustos
# listesinden sildi; Eylul'de ayni kisilerle YENI grup acinca:
#  (a) "4 uye baska yerden bu gruba tasindi: GULENAY YILMAZ - ..." (eski kaydin BAYAT stored adi),
#  (b) yeni grup TEMMUZ listesinde MUKERRER gorundu (temel kadro tum gecmis aylara sizdi),
#  (c) yeni grubun Eylul kadrosu BOS kaldi (uyeler Agustos'tan pasifti, kimse Eylul'e kaydetmedi),
#  (d) mukerrer gruptan "uyeyi sil" deyince IŞIL orijinal Temmuz grubundan da dustu (uye-bazli
#      "aydan cikar" kanonu mukerrer kayit yuzunden orijinali vurdu; Temmuz'dan pasif donem yazildi).
# KOK NEDEN: saveGroup YENI-GRUP yolu sayfanin ayina capalanmiyordu (dogum siniri yok, uye kaydi
# yok, paket/otomatik ders bugune); removeMemberFromOtherContexts ay'da pasif grubu da "sahip"
# sayip mutasyona ugratiyor ve nota bayat g.name yaziyordu.
# KURALLAR (v34/v156 ay-capasi kanonunun devami):
#  1) Yeni grup: monthlyMembers[baglam-1] = [] (grup bu aydan once yoktu), uyeler baglam ayina
#     kaydedilir (arsiv/pasif donem o ayda kapanir), paket + baslangic + otomatik dersler baglam ayi.
#     Tasima bundan SONRA calisir -> eski kayit o aydan itibaren uyeyi birakir (mukerrer grup olmaz).
#  2) Tasima: ay'da pasif (arsiv/donem) grup uye tutamaz — dokunulmaz, not yazilmaz. Not metni:
#     kaydin o ayki GORUNEN adi + "(son paket: Ay Yil)".
#  3) __migV162Repair (idempotent, load + bulut cekisinde): kanon (2026-08) sonrasi dogmus ve dogum
#     siniri olmayan gruplara sinir; hic anahtari olmayan + dogdugu ayda hic uyesi kayitli olmayan
#     YETIM gruba uyeleri o aya kaydet; kanon-ONCESI ayda odemesi VE dersi olan uyenin o ay icin
#     "cikarildi" kaydi celiskilidir -> geri al, pasif donemi ertesi aydan baslat (IŞIL Temmuz).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1a) saveGroup: yeni grupta uyeler baglam ayina kaydedilir; tasima baglam ayiyla ----------
rep("""  const transferNotes = [];
  newlyAdded.forEach(mid => {
    const removed = removeMemberFromOtherContexts(mid, data.id);""",
"""  // v162 (Kerem): YENI GRUP SAYFANIN AYINA CAPALANIR — uyeler baglam ayina kaydedilir (pasif/arsiv
  // donemi o ayda kapanir) ki grup kendi ayinda kadrolu dogsun. Tasima bundan SONRA calisir: eski
  // kayit o aydan itibaren uyeyi birakir, ayni kisilerle iki grup ayni ayda gorunmez.
  if (isNew) {
    memberIds.forEach(aid => {
      const __am = state.members.find(x=>x.id===aid);
      if (__am && __am.archived && typeof unarchiveMember === 'function') unarchiveMember(aid, __gAy);
      setMemberMonthly(aid, __gAy, { enrolled: true });
      if (__am) __closeArchivePeriodAt(__am, __gAy);
    });
  }
  const transferNotes = [];
  newlyAdded.forEach(mid => {
    const removed = removeMemberFromOtherContexts(mid, data.id, __gAy); // v162: baglam ayi acik""")

# ---------- 1b) saveGroup: yeni grupta dogum siniri + paket/baslangic baglam ayina ----------
rep("""    // Yeni grup: paket başlangıcını bugün yap + ilk paket kaydını oluştur
    data.packageStartDate = todayISO();
    data.rescheduleUsed = 0;
    data.cancelUsed = 0;
    data.packages = [];
    data.archived = false;
    state.groups.push(data);
    // v10: İlk paketi oluştur (bu ay için)
    if (memberIds.length > 0 || defaultPackageId) {
      createGroupPackage(data, todayISO().slice(0,7), todayISO(), {""",
"""    // v162 (Kerem): paket + baslangic + DOGUM SINIRI sayfanin ayina (bugune degil) — grup, acildigi
    // aydan once hicbir ayda gorunmez (Temmuz'a sizan mukerrer grup vakasi).
    data.packageStartDate = (__gAy === currentMonth()) ? todayISO() : (__gAy + '-01');
    data.rescheduleUsed = 0;
    data.cancelUsed = 0;
    data.packages = [];
    data.archived = false;
    data.monthlyMembers = {};
    { const __pmB = prevMonthISO(__gAy); if (__pmB) data.monthlyMembers[__pmB] = []; }
    state.groups.push(data);
    // v10: İlk paketi oluştur (baglam ayi icin)
    if (memberIds.length > 0 || defaultPackageId) {
      createGroupPackage(data, __gAy, data.packageStartDate, {""")

# ---------- 2) removeMemberFromOtherContexts: pasif grup uye tutamaz + dogru ad ----------
rep("""    if (__keep && (g.secondOf === keepGroupId || __keep.secondOf === g.id || (__keep.secondOf && __keep.secondOf === g.secondOf))) return;
    const __has = (g.memberIds||[]).includes(memberId) || Object.keys(g.monthlyMembers||{}).some(k => k >= __ay && (g.monthlyMembers[k]||[]).includes(memberId));
    if (__has) {
      const __wasAuto = __isAutoGroupName(g.name, g.memberIds); // v28""",
"""    if (__keep && (g.secondOf === keepGroupId || __keep.secondOf === g.id || (__keep.secondOf && __keep.secondOf === g.secondOf))) return;
    if (isGroupInactiveInMonth(g, __ay)) return; // v162: ay'da pasif (arsiv/donem) grup uye tutamaz — dokunulmaz
    const __has = (g.memberIds||[]).includes(memberId) || Object.keys(g.monthlyMembers||{}).some(k => k >= __ay && (g.monthlyMembers[k]||[]).includes(memberId));
    if (__has) {
      const __lbl162 = (function(){ // v162: not = o ayki GORUNEN ad + son paket ayi (bayat g.name degil)
        let last = '';
        ((g.packages) || []).forEach(function(p){ if (p && p.month && String(p.month) > last) last = String(p.month); });
        (state.lessons || []).forEach(function(l){ if (l && l.groupId === g.id && l.status !== 'cancelled') { const pm = l.packageMonth || String(l.date || '').slice(0, 7); if (pm > last) last = pm; } });
        let nm = ''; try { nm = groupDisplayName(g, __ay); } catch(e) { nm = ''; }
        nm = nm || g.name || 'Grup';
        return '«' + nm + '»' + (last ? ' (son paket: ' + pkgMonthLabel(last) + ')' : '');
      })();
      const __wasAuto = __isAutoGroupName(g.name, g.memberIds); // v28""")

rep("""      syncGroupLessonsToRoster(g.id, __ay);
      removed.groups.push(g.name);""",
"""      syncGroupLessonsToRoster(g.id, __ay);
      removed.groups.push(__lbl162);""")

# ---------- 3) migration ----------
rep("""  try { __repairStaleGroupNames(s); } catch(e) {}
  return s;
}""",
"""  try { __repairStaleGroupNames(s); } catch(e) {}
  // 7) v162: ay-capasiz dogan gruplar + kanon-oncesi celiskili "cikarildi" kayitlari (idempotent)
  try { __migV162Repair(s); } catch(e) {}
  return s;
}
// v162 (Kerem, 2026-09-01): ONARIM — idempotent, load() ve bulut cekisinde calisir.
//  A) ROSTER kanonu (2026-08+) sonrasi dogmus ve dogum siniri olmayan grup: monthlyMembers[dogum-1]=[]
//     (temel kadro gecmis aylara sizmasin). Hic anahtari olmayan + dogdugu ayda hic uyesi kayitli
//     olmayan YETIM grup: uyeleri dogdugu aya kaydedilir (pasif donem o ayda kapanir).
//  B) Kanon-ONCESI ayda odemesi VE iptal-disi dersi olan uyenin o ay icin enrolled:false kaydi
//     celiskilidir (mukerrer gruptan silme kazasi): geri alinir, o aydan baslayan pasif donem
//     ertesi aydan baslatilir. Odemesi/dersi olmayan gercek ayrilanlara DOKUNULMAZ.
function __migV162Repair(s) {
  let rsm; try { rsm = ROSTER_START_MONTH; } catch(e) { rsm = '2026-08'; }
  const nextM = function(ym){ const p = String(ym).split('-').map(Number); const d = new Date(p[0], p[1], 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const prevM = function(ym){ const p = String(ym).split('-').map(Number); const d = new Date(p[0], p[1] - 2, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const findM = function(mid){ return (s.members || []).find(function(x){ return x && x.id === mid; }); };
  (s.groups || []).forEach(function(g){
    if (!g) return;
    const mm = g.monthlyMembers || {};
    const keys = Object.keys(mm).sort();
    const evid = [];
    (g.packages || []).forEach(function(p){ if (p && p.month) evid.push(String(p.month)); });
    keys.forEach(function(k){ if ((mm[k] || []).filter(Boolean).length) evid.push(k); });
    (s.lessons || []).forEach(function(l){ if (l && l.groupId === g.id) evid.push(l.packageMonth || String(l.date || '').slice(0, 7)); });
    const birth = evid.filter(Boolean).sort()[0];
    if (!birth || birth < rsm) return;
    if (keys.some(function(k){ return k < birth; })) return;
    const pmB = prevM(birth);
    if (!pmB) return;
    g.monthlyMembers = g.monthlyMembers || {};
    g.monthlyMembers[pmB] = [];
    const mids = (g.memberIds || []).filter(Boolean);
    if (!keys.length && mids.length) {
      const anyOn = mids.some(function(mid){ const m = findM(mid); return !!(m && m.monthly && m.monthly[birth] && m.monthly[birth].enrolled === true); });
      if (!anyOn) mids.forEach(function(mid){
        const m = findM(mid); if (!m) return;
        m.monthly = m.monthly || {};
        m.monthly[birth] = Object.assign({}, m.monthly[birth] || {}, { enrolled: true });
        try { __closeArchivePeriodAt(m, birth); } catch(e) {}
      });
    }
  });
  (s.members || []).forEach(function(m){
    if (!m || !m.monthly) return;
    Object.keys(m.monthly).forEach(function(mo){
      const e = m.monthly[mo]; if (!e || e.enrolled !== false || mo >= rsm) return;
      const hasPay = (s.payments || []).some(function(p){ return p && p.memberId === m.id && (p.packageMonth || String(p.date || '').slice(0, 7)) === mo; });
      if (!hasPay) return;
      const hasLes = (s.lessons || []).some(function(l){ return l && l.status !== 'cancelled' && (l.memberIds || []).includes(m.id) && (l.packageMonth || String(l.date || '').slice(0, 7)) === mo; });
      if (!hasLes) return;
      e.enrolled = true;
      const nm = nextM(mo);
      if (Array.isArray(m.archivePeriods)) {
        m.archivePeriods = m.archivePeriods.map(function(per){
          const f = String((per && per.from) || '').slice(0, 7);
          if (f !== mo) return per;
          const t = (per && per.to) ? String(per.to).slice(0, 7) : null;
          if (t && t <= nm) return null;
          return Object.assign({}, per, { from: nm });
        }).filter(Boolean);
      }
    });
  });
}""")

# ---------- 4) groupNavListForMonth (Gruplar sayfasi + gezinme): kadro AY-COZUMLU olmali ----------
# Ham g.memberIds kullaniyordu -> dogum sinirini/ay anahtarlarini gormuyor, grup dogmadigi aylarda
# listeleniyordu (Temmuz'daki mukerrer grup Gruplar sayfasinda da gorunurdu). v57 kanonu: ay kadrosu
# TEK KAYNAK = resolveGroupMembersForMonth.
rep("""      // 1) Aktif üye filtresi (üye listesiyle aynı mantık)
      const activeMids = (g.memberIds||[]).filter(function(mid){""",
"""      // 1) Aktif üye filtresi (üye listesiyle aynı mantık) — v162: AY-COZUMLU kadro (dogum siniri/ay anahtarlari)
      const activeMids = (resolveGroupMembersForMonth(g, monthISO)||[]).filter(function(mid){""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.31.84">', '<meta name="app-version" content="2026.09.01.85">')
rep("const APP_VERSION = '2026.08.31.84';", "const APP_VERSION = '2026.09.01.85';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v161-2026-08-31-84';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v162-2026-09-01-85';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
