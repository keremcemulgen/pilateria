# -*- coding: utf-8 -*-
# v141 — TOPLU DERS CAKISMA DETAYI (Kerem 2026-08-02):
# Toplu giriste bos-makine / hoca cakismasi uyarisi artik HANGI DERSLE cakisildigini gosterir ve
# cakisan TAKVIM dersi oradan DUZENLENEBILIR (standart ders editoru — kaydedince takvim ve ilgili
# uye/grup toplu listeleri zaten state'ten turedigi icin OTOMATIK gunceller). Listedeki baska bir
# satirla cakisma ise "#N satiri" diye isaretlenir (o satir toplu listede duzeltilir).
# "🔁 Tekrar Kaydet" ayni yerden dogrulamayi yeniden calistirir. Kayit yazma mantigi DEGISMEDI —
# sorun varken hicbir sey yazilmaz (v18 kanonu aynen).
# AYRICA (2026-08-02 denetim bulgusu): uye DETAYINDAKI "Aktive Et" bare reactivateMember cagiriyordu —
# ROSTER_START_MONTH (2026-08) doneminde enrolled yazmadigi icin uye aktive edilince listede
# GORUNMUYORDU. Artik kanonik reactivateMemberForMonth(gorunum ayi) cagrilir (arsiv sayfasiyla ayni yol).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) cakisma toplama + modal (alert yerine) ----------
rep("""    const __problems = [];
    for (let i = 0; i < __rows.length; i++) {
      const r = __rows[i];
      const sMin = timeToMinutes(r.time), eMin = sMin + __dur;
      const peers = __fixed.concat(__rows.filter((x,j) => j !== i).map(x => ({ date:x.date, time:x.time, durationMin:__dur, memberIds:__mids, instructorId:__inst, status:'planned' })));
      const peak = peakUsageIn(peers, r.date, sMin, eMin);
      if (peak + __mids.length > getReformers()) {
        __problems.push(`#${r.__no} — ${fmtDate(r.date)} ${r.time}: en fazla ${getReformers()-peak} makine boş, ${__mids.length} gerekiyor`);
        continue;
      }
      if (__inst) {
        const busy = peers.find(l => l.date === r.date && (l.instructorId||'') === __inst && timeToMinutes(l.time) < eMin && sMin < timeToMinutes(l.time) + (+l.durationMin || __dur));
        if (busy) __problems.push(`#${r.__no} — ${fmtDate(r.date)} ${r.time}: ${instructorName(__inst)} aynı anda başka derste`);
      }
    }
    if (__problems.length) {
      alert(`⛔ Hiçbir şey kaydedilmedi — ${__problems.length} satır 45 dk / ${getReformers()} makine kuralına takılıyor:\\n\\n${__problems.join('\\n')}\\n\\nBu satırların tarih/saatini değiştirip tekrar kaydet.`);
      return;
    }""",
"""    const __problems = [];
    const __confDetails = []; // v141: {baslik, tip, blockers:[{id?, simNo?, label}]}
    for (let i = 0; i < __rows.length; i++) {
      const r = __rows[i];
      const sMin = timeToMinutes(r.time), eMin = sMin + __dur;
      const peers = __fixed.concat(__rows.filter((x,j) => j !== i).map(x => ({ date:x.date, time:x.time, durationMin:__dur, memberIds:__mids, instructorId:__inst, status:'planned', __sim: x.__no })));
      const __overlaps = function(){ return peers.filter(function(l){ return l.date === r.date && timeToMinutes(l.time) < eMin && sMin < timeToMinutes(l.time) + (+l.durationMin || __dur); }); };
      const peak = peakUsageIn(peers, r.date, sMin, eMin);
      if (peak + __mids.length > getReformers()) {
        __problems.push(`#${r.__no} — ${fmtDate(r.date)} ${r.time}: en fazla ${getReformers()-peak} makine boş, ${__mids.length} gerekiyor`);
        __confDetails.push({ baslik: `#${r.__no} — ${fmtDate(r.date)} ${r.time}`, tip: `⛔ makine: en fazla ${getReformers()-peak} boş, ${__mids.length} gerekiyor`, blockers: __overlaps().map(__confBlockerInfo) });
        continue;
      }
      if (__inst) {
        const busy = peers.find(l => l.date === r.date && (l.instructorId||'') === __inst && timeToMinutes(l.time) < eMin && sMin < timeToMinutes(l.time) + (+l.durationMin || __dur));
        if (busy) {
          __problems.push(`#${r.__no} — ${fmtDate(r.date)} ${r.time}: ${instructorName(__inst)} aynı anda başka derste`);
          __confDetails.push({ baslik: `#${r.__no} — ${fmtDate(r.date)} ${r.time}`, tip: `⛔ hoca: ${escapeHtml(instructorName(__inst))} aynı anda başka derste`, blockers: [__confBlockerInfo(busy)] });
        }
      }
    }
    if (__problems.length) {
      __showBatchConflicts(__problems.length, __confDetails);
      return;
    }""")

# ---------- 2) yardimci fonksiyonlar (saveBatchDates oncesine) ----------
rep("""function saveBatchDates() {
  if (!__batchDatesTarget) return;""",
"""// ===== v141: CAKISMA DETAYI — hangi dersle cakisiyor, oradan duzenle =====
function __confBlockerInfo(l) {
  if (l.__sim) return { simNo: l.__sim, label: 'bu listedeki #' + l.__sim + ' satırı (yukarıda düzelt)' };
  const ay = l.packageMonth || String(l.date || '').slice(0, 7);
  const kim = l.groupId
    ? ('👯 ' + (groupNameForMonth(l.groupId, ay) || 'Grup'))
    : ('👤 ' + ((l.memberIds||[]).map(memberName).filter(Boolean).join(', ') || 'Boş ders'));
  const kisi = (l.memberIds||[]).filter(Boolean).length;
  const hoca = l.instructorId ? instructorName(l.instructorId) : '';
  return { id: l.id, label: `${fmtDate(l.date)} ${l.time} · ${kim} · ${kisi} kişi${hoca ? ' · ' + escapeHtml(hoca) : ''}` };
}
function __showBatchConflicts(adet, details) {
  const old = document.getElementById('modal-batch-conflicts'); if (old) old.remove();
  const mdl = document.createElement('div');
  mdl.id = 'modal-batch-conflicts'; mdl.className = 'modal-bg open'; mdl.style.zIndex = '10001';
  const rows = details.map(function(dd){
    const bl = (dd.blockers && dd.blockers.length ? dd.blockers : [{ label: '(çakışan ders bulunamadı — kapasite başka saat dilimlerinden doluyor olabilir)' }]).map(function(b){
      return `<div class="row" style="gap:8px;align-items:center;margin:3px 0 3px 12px;font-size:12.5px;flex-wrap:wrap;">
        <span>↳ ${b.simNo ? b.label : escapeHtml(b.label || '')}</span>
        ${b.id ? `<button class="btn small secondary" onclick="__editConflictLesson('${b.id}')" title="Çakışan dersin gününü/saatini değiştir — kaydedince takvim ve toplu listeler otomatik güncellenir">✏️ Düzenle</button>` : ''}
      </div>`;
    }).join('');
    return `<div style="border:1px solid #F0DCC8;border-radius:8px;padding:8px 10px;margin:6px 0;background:#FFF8F2;">
      <div style="font-weight:700;font-size:13px;">${dd.baslik}</div>
      <div style="font-size:12.5px;color:#8a4b00;margin:2px 0 4px;">${dd.tip}</div>
      ${bl}
    </div>`;
  }).join('');
  mdl.innerHTML = `<div class="modal" style="max-width:560px;">
    <h3>⛔ ${adet} satır kurala takıldı — hiçbir şey kaydedilmedi</h3>
    <div style="font-size:12px;color:var(--muted);margin:4px 0 8px;">Çakışan takvim dersini ✏️ Düzenle ile açıp gün/saatini değiştirebilirsin — kaydedince takvim ve ilgili üye/grup toplu listeleri otomatik güncellenir. Sonra 🔁 Tekrar Kaydet'e bas. "Bu listedeki #N satırı" diyorsa çakışma kendi listendedir, yukarıda o satırı düzelt.</div>
    <div style="max-height:50vh;overflow:auto;">${rows}</div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:10px;">
      <button class="btn secondary" onclick="document.getElementById('modal-batch-conflicts').remove()">Kapat</button>
      <button class="btn" onclick="document.getElementById('modal-batch-conflicts').remove(); saveBatchDates();">🔁 Tekrar Kaydet</button>
    </div></div>`;
  document.body.appendChild(mdl);
}
function __editConflictLesson(id) {
  const mdl = document.getElementById('modal-batch-conflicts'); if (mdl) mdl.remove();
  openLessonModal(id); // standart ders editoru: kaydedince takvim + tum listeler yeniden cizilir
}
function saveBatchDates() {
  if (!__batchDatesTarget) return;""")

# ---------- 3) denetim bulgusu: uye detayindaki Aktive Et roster-doneminde kadroya da yazsin ----------
rep("""? `<button class="btn ok" onclick="reactivateMember('${id}');">↩️ Aktive Et</button>`""",
"""? `<button class="btn ok" onclick="reactivateMemberForMonth('${id}', (document.getElementById('member-month')||{}).value || currentMonth())" title="Görünen ayın kadrosuna da yazar (v58 kanonu)">↩️ Aktive Et</button>`""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.02.63">', '<meta name="app-version" content="2026.08.02.64">')
rep("const APP_VERSION = '2026.08.02.63';", "const APP_VERSION = '2026.08.02.64';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v140-2026-08-02-63';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v141-2026-08-02-64';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
