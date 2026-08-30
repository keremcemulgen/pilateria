# -*- coding: utf-8 -*-
# v159 — Kerem (2026-08-30 gece):
# 1) "Sonraki ay uye listesinden sildigim uyeler panelde bu kisimlardan da dusmeli."
#    KOK NEDEN: removeMemberFromMonth 'ayindan itibaren' ACIK arsiv donemi + enrolled:false yazar;
#    panel pasif denetimi yalniz ICINDE BULUNULAN aya bakiyordu (v153 __nowAy) — Eylul'den
#    silinen uye Agustos'ta hala "1 Dersi Kalan / Biten" ve "Gelecek Hafta"da listeleniyordu.
#    KURAL: kisinin (klonlar dahil) referans aydan SONRAKI bir ay icin acik cikarma kaydi
#    (enrolled:false ya da o aydan baslayan arsiv donemi) varsa VE sonrasinda yeniden yazilmamissa
#    iki panel listesinden de duser (1-kaldi dahil — silinen uye takip edilmez). Gruplarda ayni:
#    gelecekten baslayan acik arsiv donemi olan grup iki listeden de duser.
# 2) "Pasif uye listesi ay bazli / genel gorunum secenekli olsun; pasife alinma tarihine gore
#    sirali, en yeni en ustte."
#    - Gorunum secici (state.settings.passiveView, kalici): Ay Bazli (mevcut) / Genel (ay filtresi
#      yok: bugun pasif olan herkes + sonraki aydan silinmisler; ay kutusu gizlenir).
#    - HER IKI gorunum passiveSinceMonth'a gore YENI->ESKI siralanir (esitlikte ada gore);
#      gezinme listesi (passiveNavListForMonth) ayni sirayi kullanir (v151 tek-kaynak kanonu).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1a) yardimcilar (__supersededGroupFin'in hemen ardina) ----------
rep("""    let newer = false;
    mos.forEach(function(mo){ if (mo > ay || (mo === ay && xNum > myNum)) newer = true; });
    return newer;
  });
}""",
"""    let newer = false;
    mos.forEach(function(mo){ if (mo > ay || (mo === ay && xNum > myNum)) newer = true; });
    return newer;
  });
}
// v159 (Kerem): SONRAKI AYDAN SILINMIS KISI — kisinin (klonlar dahil) referans aydan SONRAKI bir
// ay icin ACIK cikarma kaydi (enrolled:false ya da o aydan baslayan arsiv donemi) varsa VE
// sonrasinda yeniden yazilmamissa (daha yeni enrolled:true yok) panel takip listelerinden duser.
function __removedAfter(mid, refAy) {
  const me = (state.members || []).find(function(x){ return x && x.id === mid; });
  if (!me || !refAy) return false;
  const rootId = me.secondOfMember || me.id;
  let lastOut = '', lastIn = '';
  (state.members || []).forEach(function(x){
    if (!x || (x.secondOfMember || x.id) !== rootId) return;
    Object.keys(x.monthly || {}).forEach(function(mo){
      const e = x.monthly[mo]; if (!e) return;
      if (e.enrolled === false && mo > refAy && mo > lastOut) lastOut = mo;
      if (e.enrolled === true && mo > lastIn) lastIn = mo;
    });
    (Array.isArray(x.archivePeriods) ? x.archivePeriods : []).forEach(function(per){
      const f = String((per && per.from) || '').slice(0, 7);
      const t = (per && per.to) ? String(per.to).slice(0, 7) : null;
      if (f && f > refAy && (!t || t > f) && f > lastOut) lastOut = f;
    });
  });
  return !!lastOut && !(lastIn >= lastOut);
}
// v159: grubun referans aydan SONRA baslayan (acik ya da ileri donuk) arsiv donemi var mi?
function __groupRemovedForward(g, refAy) {
  if (!g) return false;
  const a = refAy || currentMonth();
  return (Array.isArray(g.archivePeriods) ? g.archivePeriods : []).some(function(per){
    const f = String((per && per.from) || '').slice(0, 7);
    const t = (per && per.to) ? String(per.to).slice(0, 7) : null;
    return f && f > a && (!t || t > f);
  });
}""")

# ---------- 1b) lowfin: uye satiri ----------
rep("""      if (isMemberInactiveInMonth(mm, __nowAy)) return; // v153: pasife alinan uye listeden duser""",
"""      if (isMemberInactiveInMonth(mm, __nowAy)) return; // v153: pasife alinan uye listeden duser
      if (__removedAfter(mm.id, ay)) return; // v159: sonraki aydan silinen uye takip edilmez (1-kaldi dahil)""")

# ---------- 1c) lowfin: grup satiri ----------
rep("""      if (isGroupInactiveInMonth(g, __nowAy)) return; // v153: pasife alinan grup listeden duser""",
"""      if (isGroupInactiveInMonth(g, __nowAy)) return; // v153: pasife alinan grup listeden duser
      if (__groupRemovedForward(g, __nowAy)) return; // v159: sonraki aydan silinen grup takip edilmez""")

# ---------- 1d) gelecek hafta ----------
rep("""  const groups = state.groups.filter(g => months.some(mo => !isGroupInactiveInMonth(g, mo) && __activeRosterForMonth(g, mo).length > 0) && !__gHas.has(g.id));""",
"""  const groups = state.groups.filter(g => months.some(mo => !isGroupInactiveInMonth(g, mo) && __activeRosterForMonth(g, mo).length > 0) && !__groupRemovedForward(g, months[0]) && !__gHas.has(g.id)); // v159: silinen grup listelenmez""")

rep("""  const members = state.members.filter(m => !m.archived && months.some(mo => isMemberEnrolledInMonth(m.id, mo)) && !inAnyGroupP.has(m.secondOfMember || m.id) && !__pHas.has(m.secondOfMember || m.id));""",
"""  const members = state.members.filter(m => {
    if (m.archived) return false;
    const mo0 = months.find(mo => isMemberEnrolledInMonth(m.id, mo));
    if (!mo0) return false;
    if (__removedAfter(m.id, mo0)) return false; // v159: sonraki aydan silinen uye listelenmez
    return !inAnyGroupP.has(m.secondOfMember || m.id) && !__pHas.has(m.secondOfMember || m.id);
  });""")

# ---------- 2a) passiveSinceMonth + tarih sirali nav + genel liste + secici ----------
rep("""function passiveNavListForMonth(ay) {
  const a = ay || currentMonth();
  return state.members.filter(function(m){
    if (m.joinDate && String(m.joinDate).slice(0,7) > a) return false; // henuz katilmamis = pasif degil
    return !isMemberEnrolledInMonth(m.id, a); // o ay aktif degilse = pasif
  }).sort(function(x,y){ return (x.name||'').localeCompare(y.name||'','tr'); });
}""",
"""// v159 (Kerem): PASIFE ALINMA TARIHI (ay) — siralama ve "...'dan beri" etiketi TEK KAYNAK.
// Oncelik: arsiv tarihi > ayi kapsayan donem baslangici > gelecekte baslayan (acik) donem >
// acik cikarma (enrolled:false) ayi > son aktif kaydin/dersin ERTESI ayi > goruntulenen ay.
function passiveSinceMonth(m, ay) {
  const a = ay || currentMonth();
  if (m.archived && m.archivedAt) return String(m.archivedAt).slice(0, 7);
  let cover = '';
  (Array.isArray(m.archivePeriods) ? m.archivePeriods : []).forEach(function(per){
    const f = String((per && per.from) || '').slice(0, 7);
    const t = (per && per.to) ? String(per.to).slice(0, 7) : null;
    if (f && a >= f && (!t || a < t) && f > cover) cover = f;
  });
  if (cover) return cover;
  let fut = '';
  (Array.isArray(m.archivePeriods) ? m.archivePeriods : []).forEach(function(per){
    const f = String((per && per.from) || '').slice(0, 7);
    const t = (per && per.to) ? String(per.to).slice(0, 7) : null;
    if (f && f > a && (!t || t > f) && (!fut || f < fut)) fut = f;
  });
  if (fut) return fut;
  let last = '';
  Object.keys(m.monthly || {}).forEach(function(mo){ const e = m.monthly[mo]; if (e && e.enrolled === true && mo > last) last = mo; });
  (state.lessons || []).forEach(function(l){
    if (!l || l.status === 'cancelled' || !(l.memberIds || []).includes(m.id)) return;
    const pm = l.packageMonth || String(l.date || '').slice(0, 7);
    if (pm > last) last = pm;
  });
  let out = '';
  Object.keys(m.monthly || {}).forEach(function(mo){ const e = m.monthly[mo]; if (e && e.enrolled === false && mo > last && (!out || mo < out)) out = mo; });
  if (out && out <= a) return out;
  if (last && last < a) { const p = last.split('-').map(Number); const dd = new Date(p[0], p[1], 1); return dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0'); }
  return a;
}
function __passiveDateSort(list, a) { // v159: YENI->ESKI; esitlikte ada gore — sayfa ve gezinme ayni sira (v151)
  return list.sort(function(x, y){
    const kx = passiveSinceMonth(x, a), ky = passiveSinceMonth(y, a);
    return ky.localeCompare(kx) || (x.name || '').localeCompare(y.name || '', 'tr');
  });
}
function passiveNavListForMonth(ay) {
  const a = ay || currentMonth();
  return __passiveDateSort(state.members.filter(function(m){
    if (m.joinDate && String(m.joinDate).slice(0,7) > a) return false; // henuz katilmamis = pasif degil
    return !isMemberEnrolledInMonth(m.id, a); // o ay aktif degilse = pasif
  }), a);
}
// v159: GENEL GORUNUM — ay filtresi yok: bugun pasif olan HERKES + sonraki aydan silinmisler.
function passiveListAll() {
  const cm = currentMonth();
  return __passiveDateSort(state.members.filter(function(m){
    if (m.joinDate && String(m.joinDate).slice(0,7) > cm) return false;
    if (!isMemberEnrolledInMonth(m.id, cm)) return true;
    return __removedAfter(m.id, cm); // bugun aktif ama sonraki aydan silinmis -> genelde gorunur
  }), cm);
}
function setPassiveView(v) {
  state.settings.passiveView = (v === 'all') ? 'all' : 'month';
  save();
  renderArchive();
}""")

# ---------- 2b) renderArchive: gorunum modu ----------
rep("""  const __am = document.getElementById('archive-month');
  const ay = (__am && __am.value) || currentMonth();
  if (__am && !__am.value) __am.value = ay;""",
"""  const __am = document.getElementById('archive-month');
  const __mode = (state.settings && state.settings.passiveView) === 'all' ? 'all' : 'month'; // v159
  const __bm = document.getElementById('archive-view-month'), __ba = document.getElementById('archive-view-all');
  if (__bm) __bm.className = __mode === 'month' ? 'btn small' : 'btn small secondary';
  if (__ba) __ba.className = __mode === 'all' ? 'btn small' : 'btn small secondary';
  if (__am) __am.style.display = __mode === 'all' ? 'none' : '';
  const ay = __mode === 'all' ? currentMonth() : ((__am && __am.value) || currentMonth());
  if (__am && !__am.value) __am.value = ay;""")

rep("""  let passives = passiveNavListForMonth(ay); // v151: TEK KAYNAK — pasif kayit gezinmesiyle ayni liste""",
"""  let passives = __mode === 'all' ? passiveListAll() : passiveNavListForMonth(ay); // v151 tek kaynak + v159 genel gorunum""")

rep("""    <div class="stat blue"><div class="label">${monthLabel} — Pasif Uye</div><div class="value">${passives.length}</div></div>""",
"""    <div class="stat blue"><div class="label">${__mode === 'all' ? 'Tüm Pasifler (genel)' : (monthLabel + ' — Pasif Uye')}</div><div class="value">${passives.length}</div></div>""")

rep("""    tb.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="big">💤</div>${monthLabel} ayinda pasif uye yok.</div></td></tr>`;""",
"""    tb.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="big">💤</div>${__mode === 'all' ? 'Pasif üye yok.' : (monthLabel + ' ayinda pasif uye yok.')}</div></td></tr>`;""")

# ---------- 2c) satir "...'dan beri" etiketi tek kaynaga baglanir (tablo + mobil) ----------
rep("""    let __since = ay; // v45: carry-forward pasif baslangic ayi
    if (Array.isArray(m.archivePeriods)) { for (const per of m.archivePeriods) { const __f=String((per&&per.from)||'').slice(0,7), __t=(per&&per.to)?String(per.to).slice(0,7):null; if (__f && ay>=__f && (!__t||ay<__t)) { __since=__f; break; } } }
    if (isArch && m.archivedAt) __since = String(m.archivedAt).slice(0,7);
    const __sinceLabel = (function(){ try { return parseISO(__since+'-01').toLocaleDateString('tr-TR',{month:'long',year:'numeric'}); } catch(e){ return __since; } })();
    const how = __sinceLabel + " ayından beri pasif";""",
"""    const __since = passiveSinceMonth(m, ay); // v159: siralamayla ayni tek kaynak
    const __sinceLabel = (function(){ try { return parseISO(__since+'-01').toLocaleDateString('tr-TR',{month:'long',year:'numeric'}); } catch(e){ return __since; } })();
    const how = __sinceLabel + " ayından beri pasif";""")

rep("""    let __since = ay;
    if (Array.isArray(m.archivePeriods)) { for (const per of m.archivePeriods) { const __f=String((per&&per.from)||'').slice(0,7), __t=(per&&per.to)?String(per.to).slice(0,7):null; if (__f && ay>=__f && (!__t||ay<__t)) { __since=__f; break; } } }
    if (isArch && m.archivedAt) __since = String(m.archivedAt).slice(0,7);""",
"""    const __since = passiveSinceMonth(m, ay); // v159: siralamayla ayni tek kaynak""")

# ---------- 2d) sayfa basligina gorunum secici ----------
rep("""        <label style="font-size:13px;color:var(--muted);font-weight:600;">📅 Ay:</label>
        <input type="month" id="archive-month" onchange="renderArchive()" style="max-width:170px;">""",
"""        <div class="row" style="gap:4px;">
          <button class="btn small" id="archive-view-month" onclick="setPassiveView('month')" title="Seçili ayda pasif olan üyeler">🗓️ Ay Bazlı</button>
          <button class="btn small secondary" id="archive-view-all" onclick="setPassiveView('all')" title="Ay filtresi olmadan: bugün pasif olan ve sonraki aydan silinmiş tüm üyeler — pasife alınma tarihine göre en yeni üstte">🌐 Genel</button>
        </div>
        <label style="font-size:13px;color:var(--muted);font-weight:600;">📅 Ay:</label>
        <input type="month" id="archive-month" onchange="renderArchive()" style="max-width:170px;">""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.30.81">', '<meta name="app-version" content="2026.08.30.82">')
rep("const APP_VERSION = '2026.08.30.81';", "const APP_VERSION = '2026.08.30.82';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v158-2026-08-30-81';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v159-2026-08-30-82';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
