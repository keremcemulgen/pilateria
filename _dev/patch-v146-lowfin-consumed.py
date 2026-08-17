# -*- coding: utf-8 -*-
# v146 — Kerem duzeltmesi (2026-08-17): panel "1 Dersi Kalan / Biten" OLCUTU yanlisti.
# "Dersi planlanmis olsun ya da olmasin, 8 ders hakki olan grup veya bireysel uyelerin
#  YAPILDI ve YANDI toplami 7/8 veya 8/8 oldugunda bu tabloda gozukmeli."
# v145 kalan-yazim-hakki (sessionsRemainingFor: planli dersler de hak dusurur) uzerinden
# secim yapiyordu; DOGRUSU tuketim (fin.done = yapildi+yandi; sessionsFinishState'te
# planned disindaki iptal-olmayanlar) uzerinden:
#   done === hak-1  -> "1 dersi kaldi" (son dersi planli olsa bile listede)
#   done >= hak     -> "Bitti"
#   v108 erken kapanis (son ders isaretli + planli yok) -> "Bitti" (paket fiilen bitti)
#   hic tuketimi olmayan birim listelenmez.
# Rozet artik sayiyi da soyler: "⏳ 7/8 — 1 ders kaldı" / "✅ 8/8 — Bitti".
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) secim: kalan-hak yerine TUKETIM (yapildi+yandi) ----------
rep("""  // v145: 1 dersi kalan / hakki biten BIRIMLER (bireysel uye + grup) — panel ayina gore, kota kanonu v43
  const __lf = (function(){
    const rows = [];
    state.groups.forEach(function(g){
      if (isGroupInactiveInMonth(g, m)) return;
      const ros = (typeof activeGroupRosterForMonth === 'function') ? activeGroupRosterForMonth(g, m) : (g.memberIds||[]);
      if (!ros.length) return; // yetim/bos kadrolu grup listeyi kirletmesin (v143 vakasi)
      const kalan = sessionsRemainingFor('group', g.id, m);
      if (kalan > 1) return;
      const fin = sessionsFinishState('group', g.id, m);
      if (kalan <= 0 && (fin.done + fin.planned) <= 0) return; // hic ders yazilmamis birime 'bitti' denmez
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, m), kalan: kalan, fin: fin });
    });
    state.members.forEach(function(mm){
      if (!isMemberEnrolledInMonth(mm.id, m)) return;
      if (memberActiveGroupForMonth(mm.id, m)) return; // grup birimi grup satirinda temsil edilir
      const kalan = sessionsRemainingFor('member', mm.id, m);
      if (kalan > 1) return;
      const fin = sessionsFinishState('member', mm.id, m);
      if (kalan <= 0 && (fin.done + fin.planned) <= 0) return;
      rows.push({ tip:'member', id:mm.id, ad: mm.name, kalan: kalan, fin: fin });
    });
    rows.sort(function(a,b){ return (b.kalan - a.kalan) || String(a.ad).localeCompare(String(b.ad), 'tr'); }); // 1-kalanlar ustte
    return rows;
  })();""",
"""  // v146 (Kerem): olcut YAPILDI+YANDI TOPLAMI — planli dersler olcute GIRMEZ (ne sayar ne engeller).
  // done === hak-1 -> son dersine geldi; done >= hak (veya v108 erken kapanis) -> bitti.
  const __lf = (function(){
    const rows = [];
    const __st = function(fin){
      if (!fin || fin.quota < 1 || fin.done < 1) return 0; // hic tuketimi olmayan listelenmez
      if (fin.done >= fin.quota || (fin.closedEarly && fin.planned === 0)) return 2; // BITTI
      if (fin.done === fin.quota - 1) return 1; // 1 DERSI KALDI (son dersi planli olsa bile)
      return 0;
    };
    state.groups.forEach(function(g){
      if (isGroupInactiveInMonth(g, m)) return;
      const ros = (typeof activeGroupRosterForMonth === 'function') ? activeGroupRosterForMonth(g, m) : (g.memberIds||[]);
      if (!ros.length) return; // yetim/bos kadrolu grup listeyi kirletmesin (v143 vakasi)
      const fin = sessionsFinishState('group', g.id, m);
      const st = __st(fin); if (!st) return;
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, m), st: st, fin: fin });
    });
    state.members.forEach(function(mm){
      if (!isMemberEnrolledInMonth(mm.id, m)) return;
      if (memberActiveGroupForMonth(mm.id, m)) return; // grup birimi grup satirinda temsil edilir
      const fin = sessionsFinishState('member', mm.id, m);
      const st = __st(fin); if (!st) return;
      rows.push({ tip:'member', id:mm.id, ad: mm.name, st: st, fin: fin });
    });
    rows.sort(function(a,b){ return (a.st - b.st) || String(a.ad).localeCompare(String(b.ad), 'tr'); }); // 1-kalanlar ustte, sonra bitenler
    return rows;
  })();""")

# ---------- 2) rozet: sayi + durum (uc-durum kalkti, iki durum var) ----------
rep("""    const roz = r.kalan === 1
      ? '<span class="badge warn">⏳ 1 ders kaldı</span>'
      : ((r.fin && r.fin.trulyFinished)
        ? '<span class="badge ok">✅ Bitti</span>'
        : '<span class="badge" style="background:#FFF3E0;color:#8a4b00;">🗓️ 0 kaldı — son dersler planlı</span>');""",
"""    const say = r.fin ? (r.fin.done + '/' + r.fin.quota) : ''; // yapildi+yandi / hak
    const roz = r.st === 1
      ? '<span class="badge warn">⏳ ' + say + ' — 1 ders kaldı</span>'
      : '<span class="badge ok">✅ ' + say + ' — Bitti</span>';""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.17.68">', '<meta name="app-version" content="2026.08.17.69">')
rep("const APP_VERSION = '2026.08.17.68';", "const APP_VERSION = '2026.08.17.69';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v145-2026-08-17-68';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v146-2026-08-17-69';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
