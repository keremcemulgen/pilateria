# -*- coding: utf-8 -*-
# v184 — (Kerem 2026-09-29) "Hocalarin uye ve grup sayilarinin yaninda hangi grup ve uyeleri oldugu da gozuksun.
# Uyeler listesinde uye ve gruplarda secilen hoca yazilsin."
# 1) __instructorRoster183 grup ve bireysel LISTELERINI de dondurur (tek kaynak — sayim ile liste ayni hesaptan).
# 2) Hocalar karti: "Gruplari ve uyeleri" acik liste — grup adi (tikla → grup detayi), kadro adlari (tikla → uye detayi),
#    2. paket grubu kokunun altinda "↳ 2. paket grubu", ek paket kaydi "(2. paket)" etiketi; bireysel uyeler ayri satir.
# 3) Uyeler listesi: grup hucresinde grubun hocasi, bireysel hucresinde uyenin hocasi (masaustu tablo + mobil kart);
#    arama kutusu hoca adiyla da suzer. Hoca = grup: g.defaultInstructorId, bireysel: m.instructorId (Hocalar sayimiyla ayni).
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# ---- 1) roster: listeler ----
rep(r"""  const out = { bySize: bySize, persons: 0, groups: 0, twinGroups: 0, extraRecords: 0 };""",
r"""  const out = { bySize: bySize, persons: 0, groups: 0, twinGroups: 0, extraRecords: 0, groupList: [], individualList: [] }; // v184: listeler""")
rep(r"""    x.twin = twin;
    if (twin) { bySize[x.size].twinGroups++; out.twinGroups++; }
    else { bySize[x.size].groups++; out.groups++; accepted.push(x); }
  });""",
r"""    x.twin = twin;
    if (twin) { bySize[x.size].twinGroups++; out.twinGroups++; }
    else { bySize[x.size].groups++; out.groups++; accepted.push(x); }
    // v184: ikizin koku = kisileri kapsayan (ya da secondOfGroup ile bagli) sayilmis grup
    const rootX = twin ? (accepted.find(a => (x.g.secondOfGroup && a.g.id === x.g.secondOfGroup) || (a.g.secondOfGroup && x.g.secondOfGroup && a.g.secondOfGroup === x.g.secondOfGroup)) || accepted.find(a => [...x.persons].every(p => a.persons.has(p)))) : null;
    let nm = ''; try { nm = ay ? groupDisplayName(x.g, ay) : (x.g.name || ''); } catch(e) { nm = x.g.name || ''; }
    x.item = { gid: x.g.id, name: nm || x.g.name || 'Grup', size: x.size, twin: twin, rootGid: rootX ? rootX.g.id : '', members: [] };
    out.groupList.push(x.item);
  });""")
rep(r"""  groups.forEach(x => x.ros.forEach(mid => slots.push({ mid: mid, size: x.size, gid: x.g.id, twin: x.twin })));
  indiv.forEach(mid => slots.push({ mid: mid, size: 1, gid: '', twin: false }));""",
r"""  groups.forEach(x => x.ros.forEach(mid => slots.push({ mid: mid, size: x.size, gid: x.g.id, twin: x.twin, item: x.item })));
  indiv.forEach(mid => slots.push({ mid: mid, size: 1, gid: '', twin: false, item: null }));""")
rep(r"""  slots.forEach(sl => {
    const p = pid(sl.mid);
    if (seen.has(p)) { bySize[sl.size].extraRecords++; out.extraRecords++; return; }
    seen.add(p);""",
r"""  slots.forEach(sl => {
    const p = pid(sl.mid);
    const __mi = { mid: sl.mid, name: (mById[sl.mid] && mById[sl.mid].name) || '—', extra: seen.has(p) }; // v184
    if (sl.item) sl.item.members.push(__mi); else out.individualList.push(__mi);
    if (seen.has(p)) { bySize[sl.size].extraRecords++; out.extraRecords++; return; }
    seen.add(p);""")
# siralama: liste icinde kadro sirasi korunur (slots siralamasi klonlari sona atar) — gosterimde ada gore sirala
rep(r"""// Geriye uyum: kova basina KISI listesi (benzersiz kisi — v183)""",
r"""// v184: Hocalar karti — "Gruplari ve uyeleri" listesi (sayimla ayni kaynak)
function __instructorRosterListHtml184(r, ay) {
  if (!r || (!r.groupList.length && !r.individualList.length)) return '';
  const cmp = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'tr');
  const memLink = mi => `<a href="#" onclick="event.preventDefault();openMemberDetail('${mi.mid}','${ay || ''}')" style="color:inherit;${mi.extra ? 'opacity:.75;' : ''}">${escapeHtml(mi.name)}</a>${mi.extra ? ' <span class="badge" style="background:#f5f0e0;color:#8a8573;font-size:10px;">2. paket</span>' : ''}`;
  const real = r.groupList.filter(x => !x.twin).slice().sort((a, b) => (b.size - a.size) || cmp(a, b));
  const twinsOf = gid => r.groupList.filter(x => x.twin && x.rootGid === gid).sort(cmp);
  const grpLine = (x, twin) => `<div style="margin:${twin ? '2px 0 2px 16px' : '6px 0 2px'};font-size:12.5px;line-height:1.45;">${twin ? '↳ <span class="badge" style="background:#f5f0e0;color:#8a8573;font-size:10px;">2. paket grubu</span> ' : '👯 '}<a href="#" onclick="event.preventDefault();openGroupDetail('${x.gid}','${ay || ''}')" style="font-weight:${twin ? 500 : 700};color:var(--p2);">${escapeHtml(x.name)}</a> <span style="color:var(--muted);font-size:11px;">${x.size} kişilik · ${twin ? x.members.length + ' kayıt (aynı kişiler, ayrı sayılmaz)' : x.members.filter(m => !m.extra).length + ' üye'}</span><br><span style="color:var(--text);">${x.members.slice().sort(cmp).map(memLink).join(', ') || '—'}</span></div>`;
  const orphanTwins = r.groupList.filter(x => x.twin && !real.some(g => g.gid === x.rootGid));
  const ind = r.individualList.slice().sort(cmp);
  const nPers = r.persons;
  return `<details open class="inst-roster-184" style="margin-top:8px;"><summary style="cursor:pointer;font-size:13px;font-weight:600;">📋 Grupları ve üyeleri <span style="color:var(--muted);font-weight:400;font-size:11px;">— ${r.groups} grup · ${nPers} üye${r.twinGroups ? ' · ' + r.twinGroups + ' 2. paket grubu' : ''}</span></summary>` +
    real.map(x => grpLine(x, false) + twinsOf(x.gid).map(t => grpLine(t, true)).join('')).join('') +
    orphanTwins.map(t => grpLine(t, true)).join('') +
    (ind.length ? `<div style="margin:6px 0 2px;font-size:12.5px;line-height:1.45;">👤 <b>Bireysel</b> <span style="color:var(--muted);font-size:11px;">${ind.filter(m => !m.extra).length} üye</span><br>${ind.map(memLink).join(', ')}</div>` : '') +
    '</details>';
}
// Uyeler listesi satirinin hocasi (v184): grup → grubun hocasi, bireysel → uyenin hocasi
function __rowInstructorId184(r) {
  if (!r) return '';
  if (r.type === 'group' && r.groupId) { const g = state.groups.find(x => x && x.id === r.groupId); return (g && g.defaultInstructorId) || ''; }
  const m = state.members.find(x => x && x.id === r.memberId); return (m && m.instructorId) || '';
}
function __rowInstructorName184(r) { const id = __rowInstructorId184(r); return id ? instructorName(id) : ''; }
// Geriye uyum: kova basina KISI listesi (benzersiz kisi — v183)""")

# ---- 2) Hocalar karti: dagilimin altina liste ----
rep(r"""        }).filter(Boolean).join('') || '<div style="color:var(--muted);font-size:12px;padding:8px;">'+(monthISO ? `Bu hocaya ${monthLabel} ayında bağlı üye/grup yok.` : 'Bu hocaya bağlı aktif üye yok.')+'</div>'}
      </div>""",
r"""        }).filter(Boolean).join('') || '<div style="color:var(--muted);font-size:12px;padding:8px;">'+(monthISO ? `Bu hocaya ${monthLabel} ayında bağlı üye/grup yok.` : 'Bu hocaya bağlı aktif üye yok.')+'</div>'}
      </div>
      ${__instructorRosterListHtml184(roster183, monthISO)}""")

# ---- 3) Uyeler listesi: hoca ----
rep(r"""grp-name-title">👯 ${r.groupName}</div><div class="grp-name-sub">${subLabel}</div></div></td>`;""",
r"""grp-name-title">👯 ${r.groupName}</div><div class="grp-name-sub">${subLabel}</div>${(function(){ const __in = __rowInstructorName184(r); return __in ? `<div class="grp-name-sub" style="margin-top:2px;">🧑‍🏫 ${escapeHtml(__in)}</div>` : ''; })()}</div></td>`;""")
rep(r"""      groupNameCell = `<td style="text-align:center;color:var(--muted);font-size:12px;">Bireysel</td>`;""",
r"""      groupNameCell = `<td style="text-align:center;color:var(--muted);font-size:12px;">Bireysel${(function(){ const __in = __rowInstructorName184(r); return __in ? `<div style="font-size:11px;margin-top:2px;color:var(--p2);">🧑‍🏫 ${escapeHtml(__in)}</div>` : ''; })()}</td>`;""")
rep(r"""        <span class="mc-gname">👯 ${escapeHtml(r.groupName||'')}</span>""",
r"""        <span class="mc-gname">👯 ${escapeHtml(r.groupName||'')}</span>${(function(){ const __in = __rowInstructorName184(r); return __in ? `<small class="mc-gins184" style="flex-shrink:0;font-weight:500;opacity:.85;white-space:nowrap;margin-left:6px;">🧑‍🏫 ${escapeHtml(__in)}</small>` : ''; })()}""")
rep(r"""        <span class="mc-name">${escapeHtml(r.name||'')}${(function(){const __hm=state.members.find(x=>x.id===r.memberId);return (__hm&&__hm.health)?' 🩺':'';})()}</span>""",
r"""        <span class="mc-name">${escapeHtml(r.name||'')}${(function(){const __hm=state.members.find(x=>x.id===r.memberId);return (__hm&&__hm.health)?' 🩺':'';})()}${(function(){ if (r.type === 'group') return ''; const __in = __rowInstructorName184(r); return __in ? ` <small class="mc-ins184" style="font-weight:400;color:var(--muted);">· 🧑‍🏫 ${escapeHtml(__in)}</small>` : ''; })()}</span>""")
rep(r"""  if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q) || (r.groupName||'').toLowerCase().includes(q));""",
r"""  if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q) || (r.groupName||'').toLowerCase().includes(q) || __rowInstructorName184(r).toLowerCase().includes(q)); // v184: hoca adiyla da""")
rep(r"""placeholder="Üye ara..." oninput="renderMembers()">""", r"""placeholder="Üye, grup ya da hoca ara..." oninput="renderMembers()">""")

rep('<meta name="app-version" content="2026.09.29.106">', '<meta name="app-version" content="2026.09.29.107">')
rep("const APP_VERSION = '2026.09.29.106';", "const APP_VERSION = '2026.09.29.107';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v183-2026-09-29-106'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v184-2026-09-29-107'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
