# -*- coding: utf-8 -*-
# v150 — Kerem (2026-08-18): "2.paketi olmayan uyeye +3.paket geliyor. Bu sirayla olmali. Duzelt."
# KOK NEDEN: v149 numarasi = arsivli olmayan TUM klon sayisi + 2. Iki kusur:
#   1) GECMIS ayda kalmis (bu ay kayitli olmayan, v58 geregi klon yalniz acildigi aya kayitlidir)
#      bir "(2. Paket)" kaydi sayaca giriyor -> bu ay 2. paketi olmayan uyede "+ 3. Paket" cikiyor.
#   2) Numara bosluklarinda yanlis: "(2. Paket)" arsivli + "(3. Paket)" aktifken sayac 1+2=3 ->
#      MUKERRER "(3. Paket)" acilirdi.
# YENI KURAL (ay-baglamli + sirali):
#   - Bir numara ancak BAGLAM AYINDA KAYITLI (enrolled) ve arsivli olmayan bir klon tarafindan doludur.
#   - Teklif = 2'den baslayan EN KUCUK bos numara.
#   - O numarali UYKUDA kayit varsa (arsivli degil ama o ay kayitli degil) YENIDEN ETKINLESTIRILIR
#     (reactivateMemberForMonth) — mukerrer "(N. Paket)" kaydi ACILMAZ, gecmisi ayni kayitta birikir.
#   - Arsivli klon numara TUTMAZ (v52 kanonu surer: arsivlenince numara geri sarar; yeni kayit acilir).
# Buton ve motor AYNI hesabi (pkgSlotForMonth) kullanir — tek gercek.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) yardimci: ay-baglamli sirali paket yuvasi ----------
rep("""const ay = monthISO || currentMonth();
  let srcMember = null;
  if (sourceType === 'group') { const g = state.groups.find(x=>x.id===sourceId); srcMember = g ? state.members.find(x=>x.id===(g.memberIds||[]).filter(Boolean)[0]) : null; }""",
"""const ay = monthISO || currentMonth();
  let srcMember = null;
  if (sourceType === 'group') { const g = state.groups.find(x=>x.id===sourceId); srcMember = g ? state.members.find(x=>x.id===(g.memberIds||[]).filter(Boolean)[0]) : null; }
  // (pkgSlotForMonth asagida tanimli — buton ve motor ayni hesabi kullanir)""")

rep("""// ========== EMPTY SLOT FILL ==========""",
"""// v150 (Kerem): PAKET NUMARASI SIRALI VE AY-BAGLAMLI.
// Bir numara ancak o AY KAYITLI (enrolled) + arsivli olmayan bir klon tarafindan doludur;
// teklif = 2'den baslayan EN KUCUK bos numara. O numarali UYKUDA kayit (arsivli degil ama
// o ay kayitli degil) varsa YENIDEN KULLANILIR — mukerrer "(N. Paket)" kaydi acilmaz.
function pkgSlotForMonth(rootId, monthISO) {
  const ay = monthISO || currentMonth();
  const num = function(x){ const mt = /\\((\\d+)\\.\\s*Paket\\)\\s*$/.exec(x.name || ''); return mt ? +mt[1] : 0; };
  const taken = {}; const dormant = {};
  (state.members || []).forEach(function(x){
    if (x.secondOfMember !== rootId || x.archived) return;
    const n = num(x); if (!n) return;
    if (isMemberEnrolledInMonth(x.id, ay)) taken[n] = true;
    else if (!dormant[n]) dormant[n] = x;
  });
  let n = 2; while (taken[n]) n++;
  return { n: n, reuse: dormant[n] || null };
}
// ========== EMPTY SLOT FILL ==========""")

# ---------- 2) motor: sirali numara + uykuda kaydi yeniden kullan ----------
rep("""  const n = state.members.filter(x => x.secondOfMember === rootId && !x.archived).length + 2; // 1.paket=asil; ilk klon=2.
  const name = rootName + ' (' + n + '. Paket)';""",
"""  const __slot = pkgSlotForMonth(rootId, ay); // v150: sirali + ay-baglamli (buton ile ayni hesap)
  if (__slot.reuse) {
    const r = __slot.reuse;
    if (!confirm(`"${r.name}" kaydı zaten var (geçmiş bir aydan). Bu kayıt ${ay} ayı için YENİDEN ETKİNLEŞTİRİLECEK — yeni kayıt açılmaz; ödeme/ders geçmişi aynı kayıtta birikir.\\n\\nDevam?`)) return;
    reactivateMemberForMonth(r.id, ay);
    openMemberDetail(r.id, ay);
    if (typeof plToast === 'function') { try { plToast(r.name + ' bu aya eklendi — paket/ödemeyi buradan gir'); } catch(e){} }
    return;
  }
  const n = __slot.n;
  const name = rootName + ' (' + n + '. Paket)';""")

# ---------- 3) buton: ayni hesap ----------
rep("""      ${(!m.archived) ? (() => { const __pkRoot = m.secondOfMember || id; const __pkN = state.members.filter(x => x.secondOfMember === __pkRoot && !x.archived).length + 2; return `<button class="btn secondary pl-owner-only" onclick="createSecondPackage('member','${id}','${thisMonth}');" title="Bu kişi için AYNI kişi ama bağımsız ${__pkN}. paket üye kaydı oluştur (gruba eklenebilir veya bireysel; aktif üye sayısını değiştirmez)">+ ${__pkN}. Paket</button>`; })() : ''}""",
"""      ${(!m.archived) ? (() => { const __pkRoot = m.secondOfMember || id; const __slot = pkgSlotForMonth(__pkRoot, thisMonth); const __pkTitle = __slot.reuse ? `"${__slot.reuse.name}" kaydı bu ay için yeniden etkinleştirilir (yeni kayıt açılmaz; geçmişi aynı kayıtta birikir)` : `Bu kişi için AYNI kişi ama bağımsız ${__slot.n}. paket üye kaydı oluştur (gruba eklenebilir veya bireysel; aktif üye sayısını değiştirmez)`; return `<button class="btn secondary pl-owner-only" onclick="createSecondPackage('member','${id}','${thisMonth}');" title="${__pkTitle}">+ ${__slot.n}. Paket</button>`; })() : ''}""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.18.72">', '<meta name="app-version" content="2026.08.18.73">')
rep("const APP_VERSION = '2026.08.18.72';", "const APP_VERSION = '2026.08.18.73';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v149-2026-08-18-72';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v150-2026-08-18-73';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
