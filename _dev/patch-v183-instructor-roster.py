# -*- coding: utf-8 -*-
# v183 — HOCALAR "Uye ve Grup Dagilimi": 2. PAKETLER IKINCI KISI / IKINCI GRUP SAYILMAZ (Kerem 2026-09-29).
# Kok: instructorMemberBreakdown / instructorGroupCountForMonth her uye KAYDINI ve grup KAYDINI saydi: ayni ayin 2. paket
# klonu (secondOfMember) ikinci kisi, 2. paket grubu (secondOfGroup ya da klonlardan olusan eski ikiz) ikinci grup
# oluyordu (v59 kanonu: uye sayisi = benzersiz KISI). Ayrica g.archived / m.archived bayragi gecmis aylarda da dislaniyordu.
# TEK KAYNAK __instructorRoster183(hoca, ay): once gercek (klon olmayan) kayitlar, sonra klonlar; kisi = personIdOf;
# ikiz grup = kok grubu (secondOfGroup) ya da kisileri ayni hocanin sayilmis bir grubunun alt-kumesi olan tamami-klon grup.
# Karma grup (gercek uyeler + klon) gercek AYRI gruptur; icindeki klon kisi tekrar sayilmaz. Ek kayitlar "2. paket" notu.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

start = s.index('function instructorMemberBreakdown(instructorId, monthISO) {')
end = s.index('// v10: Bir hocanın (kümülatif veya o ay\'a ait) grup-boyutu bazında kazancı')
old_block = s[start:end]
assert old_block.count('function instructorGroupCountForMonth') == 1
new_block = r"""// ===== v183: HOCA KADRO SAYIMI — TEK KAYNAK (Kerem 2026-09-29) =====
// Kisi = benzersiz KISI (v59: 2. paket klonu ayni kisidir). Grup = benzersiz grup (ayni ayin 2. paket grubu = ayni grup).
// Siralama: once gercek (klon olmayan) kayitlar kisiyi "evine" yazar (grup ya da bireysel), klonlar sonra — kisi zaten
// sayildiysa "ek 2. paket kaydi" olur. Kova = grubun tanimli boyutu (v14). Ay verildiyse arsiv bayragi DEGIL ay kanonu.
function __instructorRoster183(instructorId, monthISO) {
  const ay = monthISO || '';
  const bySize = {}; [1,2,3,4,5].forEach(k => { bySize[k] = { groups: 0, persons: 0, twinGroups: 0, extraRecords: 0, list: [] }; });
  const out = { bySize: bySize, persons: 0, groups: 0, twinGroups: 0, extraRecords: 0 };
  const mById = {}; (state.members || []).forEach(m => { if (m) mById[m.id] = m; });
  const isClone = mid => !!(mById[mid] && mById[mid].secondOfMember);
  const pid = mid => (mById[mid] && mById[mid].secondOfMember) || mid;
  const activeM = mid => { const mm = mById[mid]; if (!mm) return false; return ay ? isMemberEnrolledInMonth(mid, ay) : !mm.archived; };
  // 1) bu hocanin o ay aktif gruplari + kadrolari
  const groups = [];
  (state.groups || []).forEach(g => {
    if (!g || g.defaultInstructorId !== instructorId) return;
    if (ay ? isGroupInactiveInMonth(g, ay) : g.archived) return;
    let ros; try { ros = ay ? activeGroupRosterForMonth(g, ay) : (g.memberIds || []).filter(Boolean).filter(activeM); } catch(e) { ros = []; }
    ros = (ros || []).filter(mid => mById[mid]);
    if (ay && !ros.length) return;
    if (!ros.length) return;
    const size = Math.max(1, Math.min(5, +g.size || ros.length || 1));
    const nClone = ros.filter(isClone).length;
    groups.push({ g: g, ros: ros, size: size, allClone: nClone === ros.length, nClone: nClone, persons: new Set(ros.map(pid)) });
  });
  // gercek gruplar once (klon orani az, kok grup, kucuk paket no)
  groups.sort((a, b) => (a.allClone - b.allClone) || (a.nClone / a.ros.length - b.nClone / b.ros.length) || ((a.g.secondOfGroup ? 1 : 0) - (b.g.secondOfGroup ? 1 : 0)) || (((+a.g.pkgNo) || 1) - ((+b.g.pkgNo) || 1)));
  const accepted = [];
  groups.forEach(x => {
    let twin = false;
    if (x.allClone) {
      twin = accepted.some(a => (x.g.secondOfGroup && a.g.id === x.g.secondOfGroup) || (a.g.secondOfGroup && x.g.secondOfGroup && a.g.secondOfGroup === x.g.secondOfGroup) || [...x.persons].every(p => a.persons.has(p)));
    }
    x.twin = twin;
    if (twin) { bySize[x.size].twinGroups++; out.twinGroups++; }
    else { bySize[x.size].groups++; out.groups++; accepted.push(x); }
  });
  // 2) bireysel kayitlar (o ay hicbir aktif grupta degil, hocasi bu hoca)
  const indiv = [];
  (state.members || []).forEach(m => {
    if (!m || m.instructorId !== instructorId) return;
    if (!activeM(m.id)) return;
    const inGroup = ay ? !!memberActiveGroupForMonth(m.id, ay) : (state.groups || []).some(g => g && !g.archived && (g.memberIds || []).includes(m.id)); // v163
    if (inGroup) return;
    indiv.push(m.id);
  });
  // 3) kisileri yaz: once gercek kayitlar (grup, sonra bireysel), sonra klonlar
  const seen = new Set();
  const slots = [];
  groups.forEach(x => x.ros.forEach(mid => slots.push({ mid: mid, size: x.size, gid: x.g.id, twin: x.twin })));
  indiv.forEach(mid => slots.push({ mid: mid, size: 1, gid: '', twin: false }));
  slots.sort((a, b) => (isClone(a.mid) ? 1 : 0) - (isClone(b.mid) ? 1 : 0)); // kararli siralama: gercek once
  slots.forEach(sl => {
    const p = pid(sl.mid);
    if (seen.has(p)) { bySize[sl.size].extraRecords++; out.extraRecords++; return; }
    seen.add(p);
    bySize[sl.size].persons++; out.persons++;
    bySize[sl.size].list.push(sl.gid ? { memberId: sl.mid, source: 'group', groupId: sl.gid, groupSize: sl.size } : { memberId: sl.mid, source: 'individual' });
  });
  return out;
}
// Geriye uyum: kova basina KISI listesi (benzersiz kisi — v183)
function instructorMemberBreakdown(instructorId, monthISO) {
  const r = __instructorRoster183(instructorId, monthISO);
  const breakdown = { 1:[], 2:[], 3:[], 4:[], 5:[] };
  [1,2,3,4,5].forEach(k => { breakdown[k] = r.bySize[k].list.slice(); });
  return breakdown;
}
// v14: Bir hocanın o aydaki grup sayısı (1 grupta birden fazla üye var ama 1 grup sayılır) — v183: 2. paket grubu ayrı grup değil
function instructorGroupCountForMonth(instructorId, monthISO) {
  const r = __instructorRoster183(instructorId, monthISO);
  const groupsBySize = { 1: r.bySize[1].persons, 2:0, 3:0, 4:0, 5:0 };
  [2,3,4,5].forEach(k => { groupsBySize[k] = r.bySize[k].groups; });
  return groupsBySize;
}
"""
s = s[:start] + new_block + s[end:]

rep(r"""    const breakdown = instructorMemberBreakdown(inst.id, monthISO);
    const groupCounts = instructorGroupCountForMonth(inst.id, monthISO);""",
r"""    const roster183 = __instructorRoster183(inst.id, monthISO); // v183: tek kaynak (benzersiz kisi / grup)
    const breakdown = { 1:[], 2:[], 3:[], 4:[], 5:[] }; [1,2,3,4,5].forEach(k => { breakdown[k] = roster183.bySize[k].list; });
    const groupCounts = { 1: roster183.bySize[1].persons, 2: roster183.bySize[2].groups, 3: roster183.bySize[3].groups, 4: roster183.bySize[4].groups, 5: roster183.bySize[5].groups };""")

rep(r"""<div style="font-size:10px;color:var(--muted);margin-top:2px;">${totalIndividualMonth} bireysel + ${totalGroupsMonth} grup</div></div>""",
r"""<div style="font-size:10px;color:var(--muted);margin-top:2px;">${totalIndividualMonth} bireysel + ${totalGroupsMonth} grup</div>${(roster183.extraRecords || roster183.twinGroups) ? `<div style="font-size:10px;color:var(--muted);margin-top:1px;" title="Aynı kişinin aynı aydaki 2./3. paket kaydı ayrı kişi, aynı grubun 2. paket grubu ayrı grup sayılmaz">+${roster183.extraRecords} 2. paket kaydı${roster183.twinGroups ? ' · ' + roster183.twinGroups + ' 2. paket grubu' : ''} (sayılmadı)</div>` : ''}</div>""")

rep(r"""          const subLine = s === 1
            ? (memberCnt > 0 ? `${memberCnt} üye` : '')
            : (groupCnt > 0 ? `${groupCnt} grup · ${memberCnt} üye` : '');""",
r"""          const __b183 = roster183.bySize[s] || {};
          const __x183 = (__b183.extraRecords || __b183.twinGroups) ? ` · +${__b183.twinGroups ? __b183.twinGroups + ' 2. paket grubu' + (__b183.extraRecords ? ', ' : '') : ''}${__b183.extraRecords ? __b183.extraRecords + ' 2. paket kaydı' : ''}` : ''; // v183: ek paketler ayri kisi/grup sayilmaz
          const subLine = s === 1
            ? (memberCnt > 0 ? `${memberCnt} üye${__x183}` : '')
            : (groupCnt > 0 ? `${groupCnt} grup · ${memberCnt} üye${__x183}` : (__x183 ? __x183.slice(3) : ''));""")

rep('<meta name="app-version" content="2026.09.28.105">', '<meta name="app-version" content="2026.09.29.106">')
rep("const APP_VERSION = '2026.09.28.105';", "const APP_VERSION = '2026.09.29.106';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v182-2026-09-28-105'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v183-2026-09-29-106'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
