# -*- coding: utf-8 -*-
# v189 (Kerem 04.10): "Yapildi olan dersleri tekrar bastan guncellemesin program, ben degistirmedikce toplu ders gir butonunda.
# Elle degistirdigim (hoca vb.) yerler tekrar guncellenmesin."
# CANLI KOK SEBEP: BAN*** BAS*** Eylul paketinin 28.09 17:00 dersi elle GIZ*** KAS***'a verilmis (uyenin hocasi DER*** OZT***).
# saveBatchDates on-kontrolu (v18) listedeki MEVCUT TUM dersleri (yapilmislar dahil) takvimden cikarip uyenin/grubun VARSAYILAN
# hocasi + varsayilan kadro + ayar suresiyle YENIDEN simule ediyordu → DERYA 28.09 16:45'te baska derste → "ayni anda baska
# derste" → 8. ders hic kaydedilemiyordu. (Kayit asamasi hoca/kadroya dokunmuyordu; engel yalniz bu yanlis simulasyondu.)
# KURAL: tarihi/saati DEGISMEYEN (ve iptal/yanan'dan geri acilmayan) mevcut ders OLDUGU GIBI sabit — kontrol edilmez, takvimde
# kendi hocasi/kadrosu/suresiyle yer kaplar; DEGISEN mevcut ders KENDI hocasi/kadrosu/suresiyle kontrol edilir; varsayilan
# hoca/kadro yalniz YENI satirlara uygulanir.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep("""    const __moved = new Set(idsToRemove);
    __batchDatesRows.forEach(r => { if (r.lessonId) __moved.add(r.lessonId); });
    const __fixed = state.lessons.filter(l => l.status !== 'cancelled' && l.status !== 'missed' && !__moved.has(l.id));
    const __rows = __batchDatesRows.map((r,i) => ({...r, __no: i+1})).filter(r => r.date && r.time && r.status !== 'cancelled' && r.status !== 'missed'); // v48: iptal/yanan makine isgal etmez""",
"""    const __moved = new Set(idsToRemove);
    // v189 (Kerem): tarihi/saati DEGISMEYEN mevcut ders OLDUGU GIBI sabit — yeniden simule edilmez (elle verilen hoca/kadro korunur)
    const __off189 = st => st === 'cancelled' || st === 'missed';
    const __untouched189 = r => { if (!r || !r.lessonId) return false; const L = state.lessons.find(x => x.id === r.lessonId); if (!L) return false; return L.date === r.date && L.time === r.time && !(__off189(L.status) && !__off189(r.status || 'planned')); };
    __batchDatesRows.forEach(r => { if (r.lessonId && !__untouched189(r)) __moved.add(r.lessonId); });
    const __fixed = state.lessons.filter(l => l.status !== 'cancelled' && l.status !== 'missed' && !__moved.has(l.id));
    const __rows = __batchDatesRows.map((r,i) => {
      const L = r.lessonId ? state.lessons.find(x => x.id === r.lessonId) : null; // v189: degisen mevcut ders KENDI hocasi/kadrosu/suresiyle
      return {...r, __no: i+1, __ins: L ? (L.instructorId || '') : __inst, __m: L ? ((L.memberIds || []).filter(Boolean)) : __mids, __d: (L && +L.durationMin) || __dur };
    }).filter(r => r.date && r.time && r.status !== 'cancelled' && r.status !== 'missed' && !__untouched189(r)); // v48: iptal/yanan makine isgal etmez · v189: dokunulmayan mevcut ders kontrol edilmez""")

rep("""      const r = __rows[i];
      const sMin = timeToMinutes(r.time), eMin = sMin + __dur;
      const peers = __fixed.concat(__rows.filter((x,j) => j !== i).map(x => ({ date:x.date, time:x.time, durationMin:__dur, memberIds:__mids, instructorId:__inst, status:'planned', __sim: x.__no })));""",
"""      const r = __rows[i];
      const sMin = timeToMinutes(r.time), eMin = sMin + r.__d;
      const peers = __fixed.concat(__rows.filter((x,j) => j !== i).map(x => ({ date:x.date, time:x.time, durationMin:x.__d, memberIds:x.__m, instructorId:x.__ins, status:'planned', __sim: x.__no })));""")

rep("""      if (peak + __mids.length > getReformers()) {
        __problems.push(`#${r.__no} — ${fmtDate(r.date)} ${r.time}: en fazla ${getReformers()-peak} makine boş, ${__mids.length} gerekiyor`);
        __confDetails.push({ baslik: `#${r.__no} — ${fmtDate(r.date)} ${r.time}`, tip: `⛔ makine: en fazla ${getReformers()-peak} boş, ${__mids.length} gerekiyor`, blockers: __overlaps().map(__confBlockerInfo) });
        continue;
      }
      if (__inst) {
        const busy = peers.find(l => l.date === r.date && (l.instructorId||'') === __inst && timeToMinutes(l.time) < eMin && sMin < timeToMinutes(l.time) + (+l.durationMin || __dur));
        if (busy) {
          __problems.push(`#${r.__no} — ${fmtDate(r.date)} ${r.time}: ${instructorName(__inst)} aynı anda başka derste`);
          __confDetails.push({ baslik: `#${r.__no} — ${fmtDate(r.date)} ${r.time}`, tip: `⛔ hoca: ${escapeHtml(instructorName(__inst))} aynı anda başka derste`, blockers: [__confBlockerInfo(busy)] });""",
"""      if (peak + r.__m.length > getReformers()) {
        __problems.push(`#${r.__no} — ${fmtDate(r.date)} ${r.time}: en fazla ${getReformers()-peak} makine boş, ${r.__m.length} gerekiyor`);
        __confDetails.push({ baslik: `#${r.__no} — ${fmtDate(r.date)} ${r.time}`, tip: `⛔ makine: en fazla ${getReformers()-peak} boş, ${r.__m.length} gerekiyor`, blockers: __overlaps().map(__confBlockerInfo) });
        continue;
      }
      if (r.__ins) { // v189: satirin KENDI hocasi (mevcut derste elle verilen hoca; yeni satirda varsayilan)
        const busy = peers.find(l => l.date === r.date && (l.instructorId||'') === r.__ins && timeToMinutes(l.time) < eMin && sMin < timeToMinutes(l.time) + (+l.durationMin || __dur));
        if (busy) {
          __problems.push(`#${r.__no} — ${fmtDate(r.date)} ${r.time}: ${instructorName(r.__ins)} aynı anda başka derste`);
          __confDetails.push({ baslik: `#${r.__no} — ${fmtDate(r.date)} ${r.time}`, tip: `⛔ hoca: ${escapeHtml(instructorName(r.__ins))} aynı anda başka derste`, blockers: [__confBlockerInfo(busy)] });""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.10.04.111">', '<meta name="app-version" content="2026.10.04.112">')
rep("const APP_VERSION = '2026.10.04.111';", "const APP_VERSION = '2026.10.04.112';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v188-2026-10-04-111'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v189-2026-10-04-112'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
