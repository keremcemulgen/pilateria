# -*- coding: utf-8 -*-
# v147 — Kerem (2026-08-17): "bu AYLIK bir sey degil — temmuzdan veya daha onceki aylardan
# SARKAN derslerde gozukmeli, takvimdeki gibi. Agustosta olsa temmuzda olsa fark etmez.
# Zaten temmuz dersleri bitmeden agustos paketi sorun olmaz."
# v146 listeyi PANEL AYINA gore hesapliyordu; sarkan (onceki ay paketli) birimler gorunmuyordu.
# YENI KURAL (ay-bagimsiz):
#  - Her birimin SU AN uzerinde oldugu paket = iptal-olmayan dersi bulunan EN SON paket ayi
#    (planli ders tuketime sayilmaz ama birimin hangi pakete GECTIGINI belirler — yeni ay
#    baslamissa eski ay artik konu degil).
#  - O paketin yapildi+yandi toplami: hak-1 -> "1 ders kaldi"; >= hak veya v108 erken kapanis -> "Bitti".
#  - Sarkan (icinde bulunulan aydan farkli) paket satirinda takvimdeki gibi 📦 + pkgMonthLabel.
#  - "Bitti" en fazla 1 onceki aydan gosterilir (daha eskisi = ayrilmis uye, listeyi kirletmez);
#    "1 ders kaldi" YAS SINIRSIZ (sarkan ders hala yapilmali/telafi edilmeli).
#  - Aktiflik/kadro/uyelik denetimleri birimin KENDI paket ayina gore yapilir; satir tiklaninca
#    detay o AYIN goruntusuyle acilir. Panel ay secici bu listeyi artik ETKILEMEZ.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) secim: panel ayi yerine BIRIMIN KENDI (en son) paket ayi ----------
rep("""  // v146 (Kerem): olcut YAPILDI+YANDI TOPLAMI — planli dersler olcute GIRMEZ (ne sayar ne engeller).
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
  })();""",
"""  // v147 (Kerem): AY-BAGIMSIZ — birimin SU AN uzerinde oldugu paket (en son ders yazilan ay)
  // izlenir; sarkan (onceki ay) paketler de listede, takvimdeki gibi 📦 etiketiyle.
  // Olcut v146 kanonu: YAPILDI+YANDI toplami; planli tuketime sayilmaz ama paket GECISINI belirler.
  const __lf = (function(){
    const rows = [];
    const __nowAy = currentMonth();
    const __minFin = (function(){ const p = __nowAy.split('-'); let y = +p[0], a = +p[1] - 1;
      if (!a) { y--; a = 12; } return y + '-' + String(a).padStart(2, '0'); })(); // "Bitti" yas siniri: bu ay + 1 onceki
    const __curAy = function(tip, id){ // birimin iptal-olmayan dersi bulunan EN SON paket ayi
      let mx = '';
      (state.lessons || []).forEach(function(l){
        if (!l || l.status === 'cancelled') return;
        if (tip === 'group') { if (l.groupId !== id) return; }
        else { if (l.groupId) return; if (!(l.memberIds || []).includes(id)) return; }
        const pm = l.packageMonth || String(l.date || '').slice(0, 7);
        if (pm && pm > mx) mx = pm;
      });
      return mx;
    };
    const __st = function(fin){
      if (!fin || fin.quota < 1 || fin.done < 1) return 0; // hic tuketimi olmayan listelenmez
      if (fin.done >= fin.quota || (fin.closedEarly && fin.planned === 0)) return 2; // BITTI
      if (fin.done === fin.quota - 1) return 1; // 1 DERSI KALDI (son dersi planli olsa bile)
      return 0;
    };
    state.groups.forEach(function(g){
      const ay = __curAy('group', g.id); if (!ay) return;
      if (isGroupInactiveInMonth(g, ay)) return;
      const ros = (typeof activeGroupRosterForMonth === 'function') ? activeGroupRosterForMonth(g, ay) : (g.memberIds||[]);
      if (!ros.length) return; // yetim/bos kadrolu grup listeyi kirletmesin (v143 vakasi)
      const fin = sessionsFinishState('group', g.id, ay);
      const st = __st(fin); if (!st) return;
      if (st === 2 && ay < __minFin) return; // cok eski bitmis — artik konu degil
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, ay), ay: ay, st: st, fin: fin });
    });
    state.members.forEach(function(mm){
      const ay = __curAy('member', mm.id); if (!ay) return;
      if (!isMemberEnrolledInMonth(mm.id, ay)) return;
      if (memberActiveGroupForMonth(mm.id, ay)) return; // grup birimi grup satirinda temsil edilir
      const fin = sessionsFinishState('member', mm.id, ay);
      const st = __st(fin); if (!st) return;
      if (st === 2 && ay < __minFin) return;
      rows.push({ tip:'member', id:mm.id, ad: mm.name, ay: ay, st: st, fin: fin });
    });
    rows.sort(function(a,b){ return (a.st - b.st) || String(a.ay).localeCompare(String(b.ay)) || String(a.ad).localeCompare(String(b.ad), 'tr'); }); // 1-kalanlar ustte; eski ay once (daha acil)
    return rows;
  })();""")

# ---------- 2) cizim: 📦 sarkan ay etiketi + satir kendi ayinin detayina + sayacta ay yok ----------
rep("""  if (__lfCnt) __lfCnt.textContent = '(' + __lf.filter(function(r){return r.tip==='group';}).length + ' grup, ' + __lf.filter(function(r){return r.tip==='member';}).length + ' üye · ' + m + ')';
  if (!__lf.length) lowEl.innerHTML = '<div class="empty">👍 Bu ay 1 dersi kalan ya da hakkı biten yok.</div>';
  else lowEl.innerHTML = __lf.map(function(r){
    const say = r.fin ? (r.fin.done + '/' + r.fin.quota) : ''; // yapildi+yandi / hak
    const roz = r.st === 1
      ? '<span class="badge warn">⏳ ' + say + ' — 1 ders kaldı</span>'
      : '<span class="badge ok">✅ ' + say + ' — Bitti</span>';
    const ac = r.tip === 'group' ? ("openGroupDetail('" + r.id + "','" + m + "')") : ("openMemberDetail('" + r.id + "')");
    return '<div class="row between" style="padding:7px 8px;border-bottom:1px solid var(--border);cursor:pointer;" onclick="' + ac + '" title="Detayı aç — yeni paket/ödeme oradan">'
      + '<span>' + (r.tip === 'group' ? '👯' : '👤') + ' ' + escapeHtml(r.ad) + '</span>' + roz + '</div>';
  }).join('');""",
"""  if (__lfCnt) __lfCnt.textContent = '(' + __lf.filter(function(r){return r.tip==='group';}).length + ' grup, ' + __lf.filter(function(r){return r.tip==='member';}).length + ' üye)';
  if (!__lf.length) lowEl.innerHTML = '<div class="empty">👍 Şu an 1 dersi kalan ya da hakkı biten yok.</div>';
  else lowEl.innerHTML = __lf.map(function(r){
    const say = r.fin ? (r.fin.done + '/' + r.fin.quota) : ''; // yapildi+yandi / hak
    const sarkan = (r.ay && r.ay !== currentMonth())
      ? '<span class="badge" style="background:#FFF8E1;color:#7a5b00;">📦 ' + pkgMonthLabel(r.ay) + '</span>' : ''; // takvimdeki gibi sarkan paket etiketi
    const roz = r.st === 1
      ? '<span class="badge warn">⏳ ' + say + ' — 1 ders kaldı</span>'
      : '<span class="badge ok">✅ ' + say + ' — Bitti</span>';
    const ac = r.tip === 'group' ? ("openGroupDetail('" + r.id + "','" + r.ay + "')") : ("openMemberDetail('" + r.id + "')");
    return '<div class="row between" style="padding:7px 8px;border-bottom:1px solid var(--border);cursor:pointer;" onclick="' + ac + '" title="Detayı aç — yeni paket/ödeme oradan">'
      + '<span>' + (r.tip === 'group' ? '👯' : '👤') + ' ' + escapeHtml(r.ad) + '</span>'
      + '<span style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;">' + sarkan + roz + '</span></div>';
  }).join('');""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.17.69">', '<meta name="app-version" content="2026.08.17.70">')
rep("const APP_VERSION = '2026.08.17.69';", "const APP_VERSION = '2026.08.17.70';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v146-2026-08-17-69';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v147-2026-08-17-70';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
