# -*- coding: utf-8 -*-
# v182 — v181 CANLI OLCUM DUZELTMESI: devam eden hak bilgisi icin KANIT + PENCERE kurali.
# Canlida (2026-09-28) Eylul icin 8 bilgiden 5'i hayalet kayittan geliyordu: Haziran/Temmuz'da paket KAYDI var ama o ay
# hic ders ve odeme yok (eski akislarin biraktigi bos kayit) → "Haziran paketinde 8 ders hakki devam ediyor (0/8)" gibi
# yaniltici bilgi. Kural: bir ayin paketi ancak o ay (a) iptal-disi dersi varsa YA DA (b) paket kaydi + odemesi varsa
# GERCEK pakettir; yalnizca kayit = hayalet, sayilmaz. PENCERE: yalniz son 2 ay (onceki ay + 1 ay tolerans — ay atlayan
# uye); daha eski paket "devam eden" sayilmaz (paket gecerliligi ~30 gun). Personel odemeyi goremez → (a) ile calisir.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep(r"""function __pkgMonthsOfUnit181(ownerType, ownerId) {
  const set = {};
  const pmOf = x => x.packageMonth || String(x.date || '').slice(0, 7);
  if (ownerType === 'group') {
    const g = (state.groups || []).find(x => x && x.id === ownerId); if (!g) return [];
    (g.packages || []).forEach(p => { if (p && p.month) set[p.month] = 1; });
    (state.lessons || []).forEach(l => { if (l && l.groupId === ownerId && l.status !== 'cancelled') { const pm = pmOf(l); if (pm) set[pm] = 1; } });
  } else {
    const m = (state.members || []).find(x => x && x.id === ownerId); if (!m) return [];
    (m.packages || []).forEach(p => { if (p && p.month) set[p.month] = 1; });
    (state.lessons || []).forEach(l => { if (l && !l.groupId && l.status !== 'cancelled' && (l.memberIds || []).includes(ownerId)) { const pm = pmOf(l); if (pm) set[pm] = 1; } });
  }
  return Object.keys(set).filter(k => /^\d{4}-\d{2}$/.test(k)).sort();
}""",
r"""// v182 KANIT KURALI: bir ayin paketi ancak o ay (a) iptal-disi dersi varsa YA DA (b) paket kaydi + odemesi varsa gercek
// pakettir; yalnizca kayit (eski akislarin biraktigi bos kayit) = HAYALET, sayilmaz (canli: Haziran "0/8 → 8 hak" yaniltmasi).
function __pkgMonthsOfUnit181(ownerType, ownerId) {
  const les = {}, rec = {}, pay = {};
  const pmOf = x => x.packageMonth || String(x.date || '').slice(0, 7);
  if (ownerType === 'group') {
    const g = (state.groups || []).find(x => x && x.id === ownerId); if (!g) return [];
    (g.packages || []).forEach(p => { if (p && p.month) rec[p.month] = 1; });
    (state.lessons || []).forEach(l => { if (l && l.groupId === ownerId && l.status !== 'cancelled') { const pm = pmOf(l); if (pm) les[pm] = 1; } });
    (state.payments || []).forEach(p => { if (p && p.groupId === ownerId) { const pm = pmOf(p); if (pm) pay[pm] = 1; } });
  } else {
    const m = (state.members || []).find(x => x && x.id === ownerId); if (!m) return [];
    (m.packages || []).forEach(p => { if (p && p.month) rec[p.month] = 1; });
    (state.lessons || []).forEach(l => { if (l && !l.groupId && l.status !== 'cancelled' && (l.memberIds || []).includes(ownerId)) { const pm = pmOf(l); if (pm) les[pm] = 1; } });
    (state.payments || []).forEach(p => { if (p && p.memberId === ownerId && !p.groupId) { const pm = pmOf(p); if (pm) pay[pm] = 1; } });
  }
  const set = {};
  Object.keys(les).forEach(k => { set[k] = 1; });
  Object.keys(rec).forEach(k => { if (pay[k]) set[k] = 1; });
  return Object.keys(set).filter(k => /^\d{4}-\d{2}$/.test(k)).sort();
}
// v182 PENCERE: yalniz son N ay (onceki ay + 1 ay tolerans — ay atlayan uye); daha eskisi "devam eden" sayilmaz
var __CARRY_LOOKBACK181 = 2;
function __carryFloor181(ay) { try { const p = String(ay).split('-').map(Number); const d = new Date(p[0], p[1] - 1 - __CARRY_LOOKBACK181, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); } catch(e) { return ''; } }""")

rep(r"""  const add = (pm, gid) => { if (!pm || !/^\d{4}-\d{2}$/.test(pm) || pm >= ay) return; const c = cands[pm] || (cands[pm] = { i: false, g: {} }); if (gid) c.g[gid] = 1; else c.i = true; };
  (m.packages || []).forEach(p => { if (p) add(p.month, ''); });
  (state.lessons || []).forEach(l => {
    if (!l || l.status === 'cancelled' || !(l.memberIds || []).includes(memberId)) return;
    if (!l.groupId) { add(pmOf(l), ''); return; }
    const g = (state.groups || []).find(x => x && x.id === l.groupId);
    if (g && rosterHas(g, pmOf(l))) add(pmOf(l), g.id); // kadro disi (misafir) ders birim degildir
  });
  (state.groups || []).forEach(g => { if (!g) return; (g.packages || []).forEach(p => { if (p && p.month && p.month < ay && rosterHas(g, p.month)) add(p.month, g.id); }); });""",
r"""  const floor = __carryFloor181(ay); // v182: pencere
  const add = (pm, gid) => { if (!pm || !/^\d{4}-\d{2}$/.test(pm) || pm >= ay || pm < floor) return; const c = cands[pm] || (cands[pm] = { i: false, g: {} }); if (gid) c.g[gid] = 1; else c.i = true; };
  // v182: yalniz KANITLI paket aylari (ders ya da kayit+odeme) — hayalet kayit birim degildir
  __pkgMonthsOfUnit181('member', memberId).forEach(pm => add(pm, ''));
  (state.lessons || []).forEach(l => {
    if (!l || l.status === 'cancelled' || !l.groupId || !(l.memberIds || []).includes(memberId)) return;
    const g = (state.groups || []).find(x => x && x.id === l.groupId);
    if (g && rosterHas(g, pmOf(l))) add(pmOf(l), g.id); // kadro disi (misafir) ders birim degildir
  });
  (state.groups || []).forEach(g => { if (!g) return; __pkgMonthsOfUnit181('group', g.id).forEach(pm => { if (pm < ay && rosterHas(g, pm)) add(pm, g.id); }); });""")

rep(r"""    const months = __pkgMonthsOfUnit181('group', ownerId).filter(k => k < ay);""",
r"""    const months = __pkgMonthsOfUnit181('group', ownerId).filter(k => k < ay && k >= __carryFloor181(ay)); // v182: kanit + pencere""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.09.28.104">', '<meta name="app-version" content="2026.09.28.105">')
rep("const APP_VERSION = '2026.09.28.104';", "const APP_VERSION = '2026.09.28.105';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v181-2026-09-28-104'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v182-2026-09-28-105'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
