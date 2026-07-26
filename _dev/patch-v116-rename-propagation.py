#!/usr/bin/env python3
# v116 — UYE YENIDEN ADLANDIRILINCA TAKVIMDEKI AD ESKI KALIYOR
# Kerem (26 Tem): "ismini degistirdigim uyenin takvimdeki ismi geriye donuk olarak ayni kaliyor".
#
# KOK SEBEP — grup adlari uye adlarindan URETILMIS ama METIN olarak DONDURULMUS. Iki bagimsiz yol:
#  (1) g.monthlyNames[ay] donmus bir METIN ('Ayşe Yılmaz - Fatma Kaya'). saveMember bu metne
#      hic dokunmaz. groupDisplayName ONCE monthlyNames'e baktigi ve 'ay <= secili ay' olan EN SON
#      anahtari kullandigi icin hem GECMIS hem GELECEK aylar eski yazimda kalir. Kerem'in gordugu bu.
#  (2) monthlyNames hic olmasa bile __looksLikeAutoName(g.name) her parcayi MEVCUT uye adlariyla
#      karsilastirir. Yeniden adlandirmadan sonra eski parca hicbir uyeye uymaz -> ad 'otomatik degil'
#      sanilir -> kadrodan yeniden turetme YAPILMAZ -> eski g.name donulur. Yani bir yeniden
#      adlandirma, otomatik uretilmis bir grup adini KALICI olarak dondurur.
#  Bireysel dersler etkilenmez: onlar memberName(id) ile CANLI cozer.
#
# KANON (Kerem'in v41 ay-bazli ad kurali korunarak): ay bazli ad KADRO gecmisini korur,
# YAZIM gecmisini DEGIL. Ayni insan yeniden adlandirildiginda gecmis aylar dahil her yerde yeni
# adiyla gorunur. ELLE yazilmis adlar ASLA degistirilmez.
#
# COZUM IKI PARCALI:
#  A) __propagateMemberRename(id, eskiAd, yeniAd) — saveMember icinden. KESIN eslesme: yalnizca
#     tam olarak eski ada esit parcalar yenilenir. Adas (ayni adi tasiyan baska uye) varsa DOKUNULMAZ.
#  B) __repairStaleGroupNames(s) — applyV10MigrationToState sonunda. v116 ONCESI yapilmis
#     yeniden adlandirmalar MEVCUT veride bayat kalmis olabilir (Kerem'in verisi tam boyle).
#     Kadroyla KONUM KONUM hizalar; YALNIZCA tek bir parcasi hicbir uyeye uymayan metni tazeler.
#     Guvenlik esikleri: tek parcali adlara dokunma (elle yazilmis olabilir), iki+ parca bayatsa
#     dokunma (bu bir yeniden adlandirma degil), baska bir uyeye uyan parca bayat SAYILMAZ.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()

# ---------------------------------------------------------------- 1) YARDIMCILAR
a1 = "// v41 (Kerem kurali): GRUP ADI AY BAZLIDIR.\n"
n1 = """// ───────── v116: UYE YENIDEN ADLANDIRILINCA DONMUS GRUP ADLARI ─────────
// Kanon: ay bazlı ad KADRO geçmişini korur, YAZIM geçmişini DEĞİL. Aynı insanın adı
// düzeltildiğinde geçmiş aylar dahil her yerde yeni yazımıyla görünür; ELLE yazılmış
// adlara ASLA dokunulmaz.
function __plFirstName(nm) { return ((nm || '').trim().split(/\\s+/)[0] || ''); }
// Donmuş adı parçalarına ayırır: yeni biçim ' - ' (tam ad), eski v18 biçimi '/' (ilk ad).
function __plNameParts(nm) {
  const s0 = (nm || '').trim();
  if (!s0) return null;
  if (s0.indexOf(' - ') >= 0) return { sep: ' - ', style: 'full',  parts: s0.split(' - ').map(function(p){ return p.trim(); }) };
  if (s0.indexOf('/')   >= 0) return { sep: '/',   style: 'first', parts: s0.split('/').map(function(p){ return p.trim(); }) };
  return { sep: '', style: 'single', parts: [s0] };
}
// ESKİ adı YENİ adla değiştirir. Hiçbir parça uymazsa null döner (=> YAZMA YOK).
function __plRewriteFrozen(stored, oldFull, newFull) {
  const pr = __plNameParts(stored);
  if (!pr) return null;
  const oldFirst = __plFirstName(oldFull), newFirst = __plFirstName(newFull);
  let hit = false;
  const out = pr.parts.map(function(p) {
    if (pr.style === 'first') { if (p === oldFirst) { hit = true; return newFirst; } return p; }
    if (p === oldFull) { hit = true; return newFull; }
    // tek üyeli grubun adı ilk-isim biçiminde donmuş olabilir ("Ayşe")
    if (pr.style === 'single' && oldFirst !== oldFull && p === oldFirst) { hit = true; return newFirst; }
    return p;
  });
  return hit ? out.join(pr.sep) : null;
}
// saveMember'dan çağrılır: ad düzeltildiyse donmuş grup adlarına YAY (geçmiş aylar dahil).
function __propagateMemberRename(memberId, oldName, newName) {
  const oldFull = (oldName || '').trim(), newFull = (newName || '').trim();
  if (!oldFull || !newFull || oldFull === newFull) return 0;   // ad değişmedi -> HİÇBİR yazma
  const ms = state.members || [];
  // ADAŞ KORUMASI: başka bir üye HÂLÂ eski adı taşıyorsa donmuş metin kime aitti belirsiz -> DOKUNMA.
  if (ms.some(function(m){ return m && m.id !== memberId && (m.name || '').trim() === oldFull; })) return 0;
  const oldFirst = __plFirstName(oldFull);
  const firstClash = ms.some(function(m){ return m && m.id !== memberId && __plFirstName(m.name) === oldFirst; });
  let n = 0;
  (state.groups || []).forEach(function(g) {
    if (!g) return;
    const apply = function(stored) {
      const pr = __plNameParts(stored);
      if (!pr) return null;
      if (pr.style === 'first' && firstClash) return null;   // eski '/' biçiminde ilk-ad adaşı -> DOKUNMA
      return __plRewriteFrozen(stored, oldFull, newFull);
    };
    const gn = apply(g.name);
    if (gn !== null && gn !== g.name) { g.name = gn; n++; }
    const mn = g.monthlyNames;
    if (mn) Object.keys(mn).forEach(function(k) {
      const v = apply(mn[k]);
      if (v !== null && v !== mn[k]) { mn[k] = v; n++; }
    });
  });
  return n;
}
// v116 ONARIM (idempotent): v116 ÖNCESİ yapılmış yeniden adlandırmalar mevcut veride BAYAT
// kalmış olabilir. Kadroyla KONUM KONUM hizalar ve YALNIZCA tek bir parçası hiçbir üyeye
// uymayan (= bir kişinin yazımı değişmiş) metni tazeler. Elle yazılmış adlar için eşikler:
//  · tek parçalı ada DOKUNMA (elle yazılmış olabilir)   · iki+ parça bayatsa DOKUNMA (bu bir
//  yeniden adlandırma değil)   · başka bir üyeye uyan parça BAYAT SAYILMAZ (kadro değişmiş).
function __repairStaleGroupNames(s) {
  let __gl = null; try { __gl = state; } catch(e) {}
  const st = s || __gl;
  if (!st || !Array.isArray(st.groups) || !Array.isArray(st.members)) return 0;
  const ms = st.members;
  const known = function(p, style) {
    return ms.some(function(m) {
      const nm = ((m && m.name) || '').trim();
      if (!nm) return false;
      return style === 'first' ? (__plFirstName(nm) === p) : (nm === p || __plFirstName(nm) === p);
    });
  };
  let n = 0;
  st.groups.forEach(function(g) {
    if (!g) return;
    const fix = function(stored, ay) {
      const pr = __plNameParts(stored);
      if (!pr || pr.parts.length < 2) return null;   // tek parçalı ad ELLE yazılmış olabilir -> DOKUNMA
      const cands = [];
      try { cands.push(resolveGroupMembersForMonth(g, ay) || []); } catch(e) {}
      try { if (st === __gl) cands.push(__activeRosterForMonth(g, ay) || []); } catch(e) {}
      for (let ci = 0; ci < cands.length; ci++) {
        const roster = cands[ci];
        if (!roster || roster.length !== pr.parts.length) continue;
        const names = roster.map(function(id) { const m = ms.find(function(x){ return x && x.id === id; }); return ((m && m.name) || '').trim(); });
        if (names.some(function(x){ return !x; })) continue;
        let stale = 0, bad = false;
        const out = pr.parts.map(function(p, i) {
          const want = pr.style === 'first' ? __plFirstName(names[i]) : names[i];
          if (p === want) return p;
          if (known(p, pr.style)) { bad = true; return p; }   // BAŞKA bir üyeye uyuyor -> kadro değişmiş
          stale++;
          return want;
        });
        if (bad || stale !== 1) continue;   // TAM BİR kişinin yazımı değişmiş olmalı
        const joined = out.join(pr.sep);
        if (joined !== stored) return joined;
      }
      return null;
    };
    const gn = fix(g.name, currentMonth());
    if (gn) { g.name = gn; n++; }
    const mn = g.monthlyNames;
    if (mn) Object.keys(mn).forEach(function(k) {
      const v = fix(mn[k], k);
      if (v) { mn[k] = v; n++; }
    });
  });
  return n;
}
// v41 (Kerem kurali): GRUP ADI AY BAZLIDIR.
"""
assert s.count(a1) == 1, 'ANCHOR FAIL 1: v41 ay bazli ad yorumu (%d)' % s.count(a1)
s = s.replace(a1, n1, 1)

# ---------------------------------------------------------------- 2) saveMember CAGRISI
a2 = """    const prev = state.members[i];
    state.members[i] = { ...prev, ...data, packages: prev.packages || [], archived: prev.archived || false };
  } else {
"""
n2 = """    const prev = state.members[i];
    state.members[i] = { ...prev, ...data, packages: prev.packages || [], archived: prev.archived || false };
    // v116: AD DÜZELTİLDİYSE donmuş grup adlarına YAY (geçmiş aylar dahil) — aynı insan, yeni yazım.
    try { __propagateMemberRename(id, (prev && prev.name) || '', name); } catch(e) {}
  } else {
"""
assert s.count(a2) == 1, 'ANCHOR FAIL 2: saveMember uye guncelleme blogu (%d)' % s.count(a2)
s = s.replace(a2, n2, 1)

# ---------------------------------------------------------------- 3) MIGRATION KANCASI
a3 = """    if (!s.settings.closeMinute) s.settings.closeMinute = 0;
  }
  return s;
}
"""
n3 = """    if (!s.settings.closeMinute) s.settings.closeMinute = 0;
  }
  // 6) v116: v116 ÖNCESİ yeniden adlandırmalardan kalan bayat grup adlarını kadroyla onar (idempotent)
  try { __repairStaleGroupNames(s); } catch(e) {}
  return s;
}
"""
assert s.count(a3) == 1, 'ANCHOR FAIL 3: applyV10MigrationToState sonu (%d)' % s.count(a3)
s = s.replace(a3, n3, 1)

io.open(P, 'w', encoding='utf-8').write(s)
print('OK v116: uye yeniden adlandirmasi donmus grup adlarina (gecmis aylar dahil) yayiliyor')
