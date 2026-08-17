# -*- coding: utf-8 -*-
# v145 — Kerem (2026-08-17): Panelde "1 dersi kalan VEYA dersleri biten" listesi — bireysel uye VE
# gruplar birlikte, durum AYNI SATIRIN SAGINDA rozet olarak, "Gelecek Hafta Ders Girilmemis"
# bolumunun satir kalibiyla; satira dokununca detay acilir (v143 kalibi).
# Eski "Paketi Bitmek Uzere Olanlar" (yalniz uye, kalan 1-2, telefon kolonlu tablo) bu yeni
# bolumle DEGISTIRILIR; ust karttaki sayac da ayni kumeden beslenir (tek gercek).
# Kurallar: panel AYINA gore; kota kanonu sessionsRemainingFor (v43); yetim/bos kadrolu grup
# LISTEYE GIRMEZ (v143 vakasi); grup uyesinin bireysel satiri cikmaz (grup birimi grup satirinda);
# kalan==1 -> "1 ders kaldi" · kalan<=0 & gercekten bitti -> "Bitti" · kalan<=0 & planli var -> "0 kaldi (planli)".
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) stat kutusu etiketi ----------
rep("""<div class="stat bad"><div class="label">Bitmek Üzere (≤2 ders)</div><div class="value" id="s-low">0</div></div>""",
"""<div class="stat bad"><div class="label">1 Kalan / Biten</div><div class="value" id="s-low">0</div></div>""")

# ---------- 2) kart basligi ----------
rep("""    <h2>Paketi Bitmek Üzere Olanlar</h2>""",
"""    <h2>⏳ 1 Dersi Kalan / Biten <small id="lowfin-count" style="font-weight:400;font-size:12px;color:var(--muted);"></small></h2>""")

# ---------- 3) hesap: uye+grup, panel ayina gore ----------
rep("""  const low = state.members.filter(m=>{ const r=memberRemaining(m.id); return r>0 && r<=2; });
  document.getElementById('s-low').textContent = low.length;""",
"""  // v145: 1 dersi kalan / hakki biten BIRIMLER (bireysel uye + grup) — panel ayina gore, kota kanonu v43
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
  })();
  document.getElementById('s-low').textContent = __lf.length;""")

# ---------- 4) liste cizimi (nwm satir kalibi; sagda rozet; satir -> detay) ----------
rep("""  const lowEl = document.getElementById('low-members');
  if (!low.length) lowEl.innerHTML = '<div class="empty">Herkesin paketinde yeterli ders var. 👍</div>';
  else lowEl.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Üye</th><th>Telefon</th><th>Kalan</th><th></th></tr></thead><tbody>' +
    low.map(m=>`<tr>
      <td>${m.name}</td><td>${m.phone||'—'}</td>
      <td><span class="badge warn">${memberRemaining(m.id)} ders</span></td>
      <td><button class="btn small" onclick="openPaymentModal('${m.id}')">+ Yeni Paket</button></td>
    </tr>`).join('') + '</tbody></table></div>';
}""",
"""  const lowEl = document.getElementById('low-members');
  const __lfCnt = document.getElementById('lowfin-count');
  if (__lfCnt) __lfCnt.textContent = '(' + __lf.filter(function(r){return r.tip==='group';}).length + ' grup, ' + __lf.filter(function(r){return r.tip==='member';}).length + ' üye · ' + m + ')';
  if (!__lf.length) lowEl.innerHTML = '<div class="empty">👍 Bu ay 1 dersi kalan ya da hakkı biten yok.</div>';
  else lowEl.innerHTML = __lf.map(function(r){
    const roz = r.kalan === 1
      ? '<span class="badge warn">⏳ 1 ders kaldı</span>'
      : ((r.fin && r.fin.trulyFinished)
        ? '<span class="badge ok">✅ Bitti</span>'
        : '<span class="badge" style="background:#FFF3E0;color:#8a4b00;">🗓️ 0 kaldı — son dersler planlı</span>');
    const ac = r.tip === 'group' ? ("openGroupDetail('" + r.id + "','" + m + "')") : ("openMemberDetail('" + r.id + "')");
    return '<div class="row between" style="padding:7px 8px;border-bottom:1px solid var(--border);cursor:pointer;" onclick="' + ac + '" title="Detayı aç — yeni paket/ödeme oradan">'
      + '<span>' + (r.tip === 'group' ? '👯' : '👤') + ' ' + escapeHtml(r.ad) + '</span>' + roz + '</div>';
  }).join('');
}""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.16.67">', '<meta name="app-version" content="2026.08.17.68">')
rep("const APP_VERSION = '2026.08.16.67';", "const APP_VERSION = '2026.08.17.68';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v144-2026-08-16-67';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v145-2026-08-17-68';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
