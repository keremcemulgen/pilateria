# -*- coding: utf-8 -*-
# v151 — Kerem (2026-08-18): "Beril Topgul'un 2. paketi PASIF uyelerde ve uye listesinde YOKKEN
# uye detayinda sonraki-uye sirasinda cikiyor. Ayrica uye VE grup detayindaki ileri/geri sirasi
# ilgili sayfa listesiyle AYNI olmali. Kok sebepleri bul, kokten coz."
# KOK NEDENLER:
#  1) openMemberDetail gezinmesi state.members'in TAMAMINI (arsivsiz) DUZ ALFABETIK geziyordu —
#     ay kaydina (enrolled) bakmiyordu: ay-pasif "(2. Paket)" klonu gezinmeye siziyordu ve sira
#     uye listesinin (bireyseller once, sonra gruplar kucukten buyuge) sirasiyla uyusmuyordu.
#  2) openGroupDetail gezinmesi arsivsiz TUM gruplari geziyordu — Gruplar sayfasinin ay filtresi
#     (aktif uye / odeme / paket / packageStart) uygulanmiyordu.
# KOK COZUM — TEK KAYNAK: liste uretimi paylasilan fonksiyonlara cikarildi; sayfa listeleri de
# gezinme de AYNI fonksiyonu kullanir, bir daha ayrisamaz:
#   memberNavListForMonth(ay)  = buildMemberRows(ay) sirasindaki UYE KAYITLARI (uye listesi kanonu)
#   passiveNavListForMonth(ay) = Pasif Uyeler sayfasinin listesi (renderArchive bunu kullanir)
#   groupNavListForMonth(ay)   = Gruplar sayfasinin listesi (renderGroups bunu kullanir)
# Uye detayi: kayit aktif listedeyse orada, degilse Pasif listesinde gezilir; ikisinde de yoksa
# gezinme kapali. Gezinme dugmeleri goruntulenen AYI tasir (ctxAy) — ay gorunumu bozulmaz.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) TEK KAYNAK yardimcilari (renderArchive'in hemen onune) ----------
rep("""function renderArchive() {""",
"""// v151 (Kerem): DETAY GEZINMESI = SAYFA LISTESI — tek kaynak.
// Uye listesi sirasi = buildMemberRows kanonu (bireyseller alfabetik, sonra gruplar kucukten
// buyuge ve uyeleri). Ay-pasif/arsivli kayitlar aktif gezinmeye SIZMAZ.
function memberNavListForMonth(ay) {
  const seen = {}; const out = [];
  buildMemberRows(ay || currentMonth()).forEach(function(r){
    if (!r.memberId || seen[r.memberId]) return;
    seen[r.memberId] = true;
    const mm = state.members.find(function(x){ return x.id === r.memberId; });
    if (mm) out.push(mm);
  });
  return out;
}
// Pasif Uyeler sayfasinin listesi — renderArchive ve pasif kayit gezinmesi AYNI diziyi kullanir.
function passiveNavListForMonth(ay) {
  const a = ay || currentMonth();
  return state.members.filter(function(m){
    if (m.joinDate && String(m.joinDate).slice(0,7) > a) return false; // henuz katilmamis = pasif degil
    return !isMemberEnrolledInMonth(m.id, a); // o ay aktif degilse = pasif
  }).sort(function(x,y){ return (x.name||'').localeCompare(y.name||'','tr'); });
}
// Gruplar sayfasinin listesi (ayni ay filtresi + ada gore sira) — renderGroups ve grup gezinmesi bunu kullanir.
function groupNavListForMonth(monthISO) {
  let l = state.groups.slice().filter(function(g){ return !isGroupInactiveInMonth(g, monthISO || currentMonth()); });
  if (monthISO) {
    l = l.filter(function(g){
      // 1) Aktif üye filtresi (üye listesiyle aynı mantık)
      const activeMids = (g.memberIds||[]).filter(function(mid){
        if (!mid) return false;
        const mm = state.members.find(function(x){ return x.id === mid; });
        if (!mm || mm.archived) return false;
        return isMemberEnrolledInMonth(mid, monthISO);
      });
      if (activeMids.length > 0) return true;
      // 2) O ay için ödeme varsa
      if (state.payments.some(function(p){ return p.groupId === g.id && (p.packageMonth || (p.date||'').slice(0,7)) === monthISO; })) return true;
      // 3) Paket o ay'a denk gelirse (sarkma/sonradan paket için)
      if ((g.packages||[]).some(function(p){ return p.month === monthISO; })) return true;
      // 4) packageStartDate o ay'da başlıyorsa
      return g.packageStartDate && g.packageStartDate.startsWith(monthISO);
    });
  }
  return l.sort(function(a,b){ return (a.name||'').localeCompare(b.name||'','tr'); });
}
function renderArchive() {""")

# ---------- 2) renderArchive tek kaynagi kullanir ----------
rep("""  let passives = state.members.filter(m => {
    if (m.joinDate && String(m.joinDate).slice(0,7) > ay) return false; // henuz katilmamis = pasif degil
    return !isMemberEnrolledInMonth(m.id, ay); // o ay aktif degilse = pasif
  });
  if (q) passives = passives.filter(m => (m.name||'').toLowerCase().includes(q) || (m.phone||'').toLowerCase().includes(q));
  passives.sort((a,b)=>(a.name||'').localeCompare(b.name||'','tr'));""",
"""  let passives = passiveNavListForMonth(ay); // v151: TEK KAYNAK — pasif kayit gezinmesiyle ayni liste
  if (q) passives = passives.filter(m => (m.name||'').toLowerCase().includes(q) || (m.phone||'').toLowerCase().includes(q));""")

# ---------- 3) renderGroups tek kaynagi kullanir ----------
rep("""  let list = state.groups.slice()
    .filter(g => !isGroupInactiveInMonth(g, monthISO || currentMonth()))
    .sort((a,b)=>(a.name||'').localeCompare(b.name||'','tr'));""",
"""  let list = groupNavListForMonth(monthISO); // v151: TEK KAYNAK — grup detay gezinmesiyle ayni liste+sira""")

rep("""  // v11: Ay filtresi — Üye listesindeki ile TUTARLI:
  // - Grubun o ay'da aktif (archived olmayan, enrolled) üyesi varsa göster
  // - Veya o ay'a denk gelen ödeme/paket/packageStart varsa göster
  if (monthISO) {
    list = list.filter(g => {
      // 1) Aktif üye filtresi (üye listesiyle aynı mantık)
      const activeMids = (g.memberIds||[]).filter(mid => {
        if (!mid) return false;
        const mm = state.members.find(x => x.id === mid);
        if (!mm || mm.archived) return false;
        return isMemberEnrolledInMonth(mid, monthISO);
      });
      if (activeMids.length > 0) return true;
      // 2) O ay için ödeme varsa
      const hasPay = state.payments.some(p => p.groupId === g.id && (p.packageMonth || (p.date||'').slice(0,7)) === monthISO);
      if (hasPay) return true;
      // 3) Paket o ay'a denk gelirse (sarkma/sonradan paket için)
      const hasPkg = (g.packages||[]).some(p => p.month === monthISO);
      if (hasPkg) return true;
      // 4) packageStartDate o ay'da başlıyorsa
      return g.packageStartDate && g.packageStartDate.startsWith(monthISO);
    });
  }""",
"""  // v151: ay filtresi groupNavListForMonth icine tasindi (v11 kurallari aynen orada).""")

# ---------- 4) uye detayi gezinmesi = liste ----------
rep("""  // v10: Navigation — aktif üye listesindeki sıralamayla önceki/sonraki
  const memList = state.members.slice().filter(x => !x.archived).sort((a,b)=>(a.name||'').localeCompare(b.name||'','tr'));
  // archived üyeler için de gezilebilsin
  const fullList = state.members.slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'','tr'));
  const list = m.archived ? fullList : memList;""",
"""  // v151 (Kerem): GEZINME = UYE LISTESI — buildMemberRows sirasiyla BIREBIR (bireyseller once,
  // sonra gruplar); ay-pasif/arsivli kayitlar SIZMAZ. Pasif kayit goruntuleniyorsa Pasif
  // Uyeler sirasinda gezilir; hicbirinde yoksa gezinme kapali.
  let list = memberNavListForMonth(ctxAy);
  if (!list.some(x => x.id === id)) list = passiveNavListForMonth(ctxAy);
  if (!list.some(x => x.id === id)) list = [m];""")

# ---------- 5) uye gezinme dugmeleri goruntulenen ayi tasir ----------
rep("""    <button onclick="openMemberDetail('${prevM?prevM.id:''}')" ${!prevM?'disabled':''}>← ${prevM?escapeHtml(prevM.name||''):'Önceki yok'}</button>
    <div class="pos">${idx+1}/${list.length}</div>
    <button onclick="openMemberDetail('${nextM?nextM.id:''}')" ${!nextM?'disabled':''}>${nextM?escapeHtml(nextM.name||''):'Sonraki yok'} →</button>""",
"""    <button onclick="openMemberDetail('${prevM?prevM.id:''}','${ctxAy}')" ${!prevM?'disabled':''}>← ${prevM?escapeHtml(prevM.name||''):'Önceki yok'}</button>
    <div class="pos">${idx+1}/${list.length}</div>
    <button onclick="openMemberDetail('${nextM?nextM.id:''}','${ctxAy}')" ${!nextM?'disabled':''}>${nextM?escapeHtml(nextM.name||''):'Sonraki yok'} →</button>""")

# ---------- 6) grup detayi gezinmesi = Gruplar sayfasi listesi ----------
rep("""  // v10: Navigation — listedeki sıralamayla aynı sırayla önceki/sonraki grup
  const groupsList = state.groups.slice().filter(x => !x.archived).sort((a,b)=>(a.name||'').localeCompare(b.name||'','tr'));""",
"""  // v151 (Kerem): GEZINME = GRUPLAR SAYFASI LISTESI (ayni ay filtresi + ayni sira); listede yoksa gezinme kapali
  let groupsList = groupNavListForMonth(monthISO);
  if (!groupsList.some(x => x.id === id)) groupsList = [g];""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.18.73">', '<meta name="app-version" content="2026.08.18.74">')
rep("const APP_VERSION = '2026.08.18.73';", "const APP_VERSION = '2026.08.18.74';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v150-2026-08-18-73';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v151-2026-08-18-74';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
