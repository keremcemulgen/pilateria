# -*- coding: utf-8 -*-
# v152 — Kerem (2026-08-24): "grupta olan uyelerin isimleri degistikce grup ismi de
# guncellenecekti ama boyle yaziyor" (HILAL BENK: 3 uyeli grup tek isim gosteriyor —
# uye listesi + Geciken Odemeler).
# KOK NEDEN: v41'in __autoNameAfterRosterChange'i monthlyNames[ay]'a ANLIK GORUNTU (snapshot)
# yazar; groupDisplayName kayitli anlik goruntuyu OLDUGU GIBI dondururdu. Kadro sonradan
# degisen her yol (boş slota uye ekleme, Aya Uye Ekle, pasif/aktif, 2. paket klonu ekleme...)
# anlik goruntuyu tazelemek zorundaydi — tazelemeyen her yol BAYAT ad birakiyordu. Yapisal hata.
# KOK COZUM (goruntuleme aninda gercek):
#   - Kayitli ad ELLE verilmis bir adsa (__looksLikeAutoName degilse) AYNEN kazanir (v41 kurali).
#   - OTOMATIK kaliptaysa ad, o AYIN AKTIF kadrosundan HER GORUNTULEMEDE CANLI turetilir
#     (>= ROSTER_START_MONTH: aylik kadro kanonu sayesinde her ay KENDI kadrosunun adini verir —
#     gecmis aylar dahil dogru kalir). Kanon ONCESI aylar (aylik kadro yok) kayitli anlik
#     goruntuyu korur — tarih yeniden yazilmaz.
#   - Boylece kadroyu degistiren HICBIR yolun ad tazelemeyi hatirlamasi gerekmez; snapshot
#     yazimlari (autoNameAfterRosterChange) zararsiz YEDEK olarak kalir (bos kadro fallback'i).
#   - groupName(id) yardimcisi da ay-farkindali groupDisplayName'e baglandi (v141 cakisma
#     etiketi); onay pencereleri de guncel adi soyler.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) groupDisplayName: bayat anlik goruntu yerine CANLI turetme ----------
rep("""function groupDisplayName(g, monthISO) {
  if (!g) return '—';
  const ay = monthISO || currentMonth();
  const mn = g.monthlyNames || {};
  const keys = Object.keys(mn).filter(k => k && k <= ay).sort();
  if (keys.length) return mn[keys[keys.length - 1]] || (g.name || '—');
  if (__looksLikeAutoName(g.name)) {
    const auto = autoGroupName(__activeRosterForMonth(g, ay)); // v42: aydan cikarilan uye grup adinda GORUNMEZ
    if (auto) return auto;
  }
  return g.name || '—';
}""",
"""function groupDisplayName(g, monthISO) {
  if (!g) return '—';
  const ay = monthISO || currentMonth();
  const mn = g.monthlyNames || {};
  const keys = Object.keys(mn).filter(k => k && k <= ay).sort();
  const stored = keys.length ? (mn[keys[keys.length - 1]] || '') : '';
  // v152 (Kerem): ELLE verilen ad KAZANIR; otomatik kaliptaki ad (uye adlarindan olusan) her
  // goruntulemede o AYIN AKTIF kadrosundan CANLI turetilir — kadro degisince ad kendiliginden
  // degisir, bayat anlik goruntu kalmaz. Aylik kadro kanonu (>= ROSTER_START_MONTH) sayesinde
  // gecmis aylar KENDI kadrosunun adini verir; kanon oncesi aylar kayitli adi korur (tarih sabit).
  if (stored && !__looksLikeAutoName(stored)) return stored; // elle ad — dokunulmaz
  const canDerive = stored ? (ay >= ROSTER_START_MONTH) : __looksLikeAutoName(g.name);
  if (canDerive) {
    const auto = autoGroupName(__activeRosterForMonth(g, ay)); // v42: aydan cikarilan uye grup adinda GORUNMEZ
    if (auto) return auto;
  }
  return stored || g.name || '—';
}""")

# ---------- 2) groupName(id) yardimcisi ay-farkindali (tek cagiran: v141 cakisma etiketi) ----------
rep("""function groupName(id) { return (state.groups.find(g=>g.id===id)||{}).name || '—'; }""",
"""function groupName(id, monthISO) { const g = state.groups.find(g2=>g2.id===id); return g ? groupDisplayName(g, monthISO) : '—'; } // v152: ham .name yerine ay-farkindali guncel ad""")

# ---------- 3) onay pencereleri guncel adi soyler ----------
rep("""`⚠️ ${g.name} grubu""", """`⚠️ ${groupDisplayName(g)} grubu""", 3)
rep("""`"${g.name}" grubu""", """`"${groupDisplayName(g)}" grubu""", 4)

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.18.74">', '<meta name="app-version" content="2026.08.24.75">')
rep("const APP_VERSION = '2026.08.18.74';", "const APP_VERSION = '2026.08.24.75';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v151-2026-08-18-74';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v152-2026-08-24-75';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
