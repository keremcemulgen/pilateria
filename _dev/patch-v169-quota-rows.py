# -*- coding: utf-8 -*-
# v169 — Kerem (2026-09-01): "4 ders hakki verilmis uyeye toplu ders girde 8 satir aciliyor,
# sonra ders yazarken hata veriyor."
# KOK NEDEN: v43'ten beri ders hakkinin TEK KAYNAGI sessionQuotaFor (aylik hak override / paket /
# paket tipi / 8) ve v154 tavani kaydi buna gore ENGELLIYOR; ama satir/ders URETEN yerler hakki hic
# sormuyordu: toplu modal sabit 8'e dolduruyor (while length<8), otomatik ders uretimleri sabit 8 /
# paket TIPI sessions kullaniyordu. Sonuc: 4 haklik uyeye 8 satir acilir, otomatik doldur 8'ini de
# doldurur, kaydet v154'e takilir ("hak 4; listede 8") — kullanici hakli olarak "hata" gorur.
# v169 KANONU: KAC SATIR / KAC DERS = sessionQuotaFor. Ureten her yol ayni kaynagi kullanir:
#   1) openBatchDatesGroup/Member: bos satir dolgusu = max(mevcut ders sayisi, hak) (hak 0 ve hic
#      ders yoksa 1 bos satir — elle giris icin)
#   2) Toplu modalda CANLI HAK SAYACI: "hak N — listede M iptal-disi satir"; asimda kirmizi uyari
#      (KAYDEDILMEZ) — hata kaydet'e basmadan gorunur. Durum degisikliginde sayac tazelenir.
#   3) autoGenerateGroupLessons / autoGenerateMemberLessons: ders sayisi + olusan paketin sessions'i
#      = sessionQuotaFor (paket ayina gore); hak 0/negatifse hicbir sey uretmez (reason:'no-quota').
#   4) Yeni Ay Hazirligi ders ozeti: ders varken paket kaydi yoksa hak paydasi sessionQuotaFor'dan.
#   5) Sabit "8 dersinin" metni kaldirildi (hak kadar satir).
# v154 tavan denetimi ve tum hak hesaplari DEGISMEDI (zaten dogruydu).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) toplu modal dolgusu: sabit 8 → hak ----------
rep("""  __batchDatesRows = existing.map(l => ({ lessonId:l.id, date:l.date||'', time:l.time||'', last: l.isLastOfPackage === true, status: l.status||'planned' }));
  while (__batchDatesRows.length < 8) {
    __batchDatesRows.push({ lessonId:null, date:'', time: g.defaultTime || '' });
  }""",
"""  __batchDatesRows = existing.map(l => ({ lessonId:l.id, date:l.date||'', time:l.time||'', last: l.isLastOfPackage === true, status: l.status||'planned' }));
  { const __pad169 = __bdRowTarget169('group', groupId, __batchDatesTarget.packageMonth, existing.length); // v169: satir sayisi = DERS HAKKI (sabit 8 degil)
    while (__batchDatesRows.length < __pad169) __batchDatesRows.push({ lessonId:null, date:'', time: g.defaultTime || '' }); }""")

rep("""  __batchDatesRows = existing.map(l => ({ lessonId:l.id, date:l.date||'', time:l.time||'', last: l.isLastOfPackage === true, status: l.status||'planned' }));
  while (__batchDatesRows.length < 8) {
    __batchDatesRows.push({ lessonId:null, date:'', time: m.defaultTime || '' });
  }""",
"""  __batchDatesRows = existing.map(l => ({ lessonId:l.id, date:l.date||'', time:l.time||'', last: l.isLastOfPackage === true, status: l.status||'planned' }));
  { const __pad169 = __bdRowTarget169('member', memberId, month, existing.length); // v169: satir sayisi = DERS HAKKI (sabit 8 degil)
    while (__batchDatesRows.length < __pad169) __batchDatesRows.push({ lessonId:null, date:'', time: m.defaultTime || '' }); }""")

# yardimci + canli hak sayaci (openBatchDates'in hemen onune)
rep("""function openBatchDates(groupId, monthISO) {
  return openBatchDatesGroup(groupId, monthISO); // v38: grup detay ayina kilitle
}""",
"""// ===== v169 (Kerem): TOPLU GIRIS SATIR SAYISI = DERS HAKKI (v43 tek kaynak: sessionQuotaFor) =====
// 4 haklik uyeye 8 satir acilip kaydin v154 tavanina takilmasi bitti: dolgu hak kadar; mevcut dersler
// haktan COKSA hepsi gosterilir (gizleme yok); hak 0 ve hic ders yoksa elle giris icin 1 bos satir.
function __bdRowTarget169(ownerType, ownerId, pm, existingCount) {
  let q = 0;
  try { q = +sessionQuotaFor(ownerType, ownerId, pm || currentMonth()) || 0; } catch(e) { q = 0; }
  let t = Math.max(existingCount || 0, q > 0 ? q : 0);
  if (t <= 0) t = 1;
  return t;
}
// Kaydedilince GERCEKTEN ders olacak satirlar: tarih+saat dolu ve iptal degil (bos satir hak yemez)
function __bdActiveRowCount169() {
  return (__batchDatesRows || []).filter(function(r){ return r && r.date && r.time && (r.status || 'planned') !== 'cancelled'; }).length;
}
function __bdQuotaLineHtml169() {
  if (!__batchDatesTarget) return '';
  let q = 0;
  try { q = +sessionQuotaFor(__batchDatesTarget.type, __batchDatesTarget.id, __batchDatesTarget.packageMonth || currentMonth()) || 0; } catch(e) {}
  const n = __bdActiveRowCount169();
  const over = q > 0 && n > q;
  return '<div id="bd-quota" style="margin-bottom:8px;padding:6px 10px;border-radius:6px;font-size:12.5px;' +
    (over ? 'background:#FDECEA;color:#c62828;font-weight:600;' : 'background:#eef4ee;color:#41694a;') + '">' +
    '📦 ' + (__batchDatesTarget.packageMonth || '') + ' ders hakkı: <b>' + q + '</b> — listede <b>' + n + '</b> dolu (iptal-dışı) satır' +
    (over ? ' — hakkı aşan ' + (n - q) + ' satır var: bu haliyle KAYDEDİLMEZ. Fazla satırları ✕ ile sil ya da detaydaki "hak: düzenle" ile hakkı artır.' : '') +
    '</div>';
}
function __bdRefreshQuotaLine169() {
  const el = document.getElementById('bd-quota');
  if (el) el.outerHTML = __bdQuotaLineHtml169();
}
function openBatchDates(groupId, monthISO) {
  return openBatchDatesGroup(groupId, monthISO); // v38: grup detay ayina kilitle
}""")

# sayac liste ustunde + durum degisince tazelenir
rep("""function renderBatchDatesRows() {
  const wrap = document.getElementById('bd-rows');
  if (!wrap) return;
  wrap.innerHTML = __batchDatesRows.map((r,i) => `""",
"""function renderBatchDatesRows() {
  const wrap = document.getElementById('bd-rows');
  if (!wrap) return;
  wrap.innerHTML = __bdQuotaLineHtml169() + __batchDatesRows.map((r,i) => `""")

rep("""  if (field === 'date') __batchDatesRows[idx].date = bdParseDate(val); // metin -> ISO (yil otomatik)
  else if (field === 'time') __batchDatesRows[idx].time = bdParseTime(val); // "1000" -> "10:00"
  else __batchDatesRows[idx][field] = val;
  if (field === 'date') { try { renderBdMiniCal(); } catch(e){} } // v160: mini takvim canli yenilenir""",
"""  if (field === 'date') __batchDatesRows[idx].date = bdParseDate(val); // metin -> ISO (yil otomatik)
  else if (field === 'time') __batchDatesRows[idx].time = bdParseTime(val); // "1000" -> "10:00"
  else __batchDatesRows[idx][field] = val;
  if (field === 'date') { try { renderBdMiniCal(); } catch(e){} } // v160: mini takvim canli yenilenir
  try { __bdRefreshQuotaLine169(); } catch(e){} // v169: dolu/iptal satir sayisi degismis olabilir — hak sayaci canli""")

# ---------- 1b) v154 tavan sayimi: BOS satir hak yemez (yalniz yazilacak satirlar) ----------
rep("""    const __resCnt = (__batchDatesRows || []).filter(function(r){ return r && (r.status || 'planned') !== 'cancelled'; }).length;""",
"""    const __resCnt = __bdActiveRowCount169(); // v169: yalniz GERCEKTEN yazilacak (tarih+saat dolu, iptal-disi) satirlar — bos satir hak yemez""")

# ---------- 2) otomatik uretimler: sabit 8 / paket tipi → sessionQuotaFor ----------
rep("""  const pkg = g.defaultPackageId ? state.packageTypes.find(p => p.id === g.defaultPackageId) : null;
  const sessionCount = opts.sessionCount || (pkg && pkg.sessions) || 8;
  const days = g.defaultDays || [];
  const time = g.defaultTime || '';
  if (!days.length || !time) return { created: 0, skipped: 0, reason: 'no-schedule' };
  // Yerel zaman diliminde parse et (timezone kayması olmasın diye)
  const [sy, sm, sd] = (startISO || todayISO()).split('-').map(Number);
  const start = new Date(sy, sm-1, sd);
  const packageMonth = `${sy}-${String(sm).padStart(2,'0')}`;""",
"""  const pkg = g.defaultPackageId ? state.packageTypes.find(p => p.id === g.defaultPackageId) : null;
  const days = g.defaultDays || [];
  const time = g.defaultTime || '';
  if (!days.length || !time) return { created: 0, skipped: 0, reason: 'no-schedule' };
  // Yerel zaman diliminde parse et (timezone kayması olmasın diye)
  const [sy, sm, sd] = (startISO || todayISO()).split('-').map(Number);
  const start = new Date(sy, sm-1, sd);
  const packageMonth = `${sy}-${String(sm).padStart(2,'0')}`;
  // v169: DERS SAYISI TEK KAYNAK = sessionQuotaFor (aylik hak / o ay paketi / tip; sabit 8 degil)
  const sessionCount = (opts.sessionCount !== undefined && opts.sessionCount !== null && opts.sessionCount !== '') ? +opts.sessionCount : +sessionQuotaFor('group', groupId, packageMonth);
  if (!(sessionCount > 0)) return { created: 0, skipped: 0, reason: 'no-quota' };""")

rep("""  const days = opts.days || m.defaultDays || [];
  const time = opts.time || m.defaultTime || '';
  if (!days.length || !time) return { created: 0, skipped: 0, reason: 'no-schedule' };
  const sessionCount = opts.sessionCount || 8;
  const instructorId = opts.instructorId || m.instructorId || '';
  const [sy, sm, sd] = (startISO || todayISO()).split('-').map(Number);
  const start = new Date(sy, sm-1, sd);
  const packageMonth = `${sy}-${String(sm).padStart(2,'0')}`;""",
"""  const days = opts.days || m.defaultDays || [];
  const time = opts.time || m.defaultTime || '';
  if (!days.length || !time) return { created: 0, skipped: 0, reason: 'no-schedule' };
  const instructorId = opts.instructorId || m.instructorId || '';
  const [sy, sm, sd] = (startISO || todayISO()).split('-').map(Number);
  const start = new Date(sy, sm-1, sd);
  const packageMonth = `${sy}-${String(sm).padStart(2,'0')}`;
  // v169: DERS SAYISI TEK KAYNAK = sessionQuotaFor (aylik hak override / o ay paketi / tip; sabit 8 degil)
  const sessionCount = (opts.sessionCount !== undefined && opts.sessionCount !== null && opts.sessionCount !== '') ? +opts.sessionCount : +sessionQuotaFor('member', memberId, packageMonth);
  if (!(sessionCount > 0)) return { created: 0, skipped: 0, reason: 'no-quota' };""")

# ---------- 3) Yeni Ay Hazirligi ders ozeti: paket kaydi yoksa payda hak'tan ----------
rep("""  let sessions = 0;
  try { const p = u.kind === 'group' ? groupPackageForMonth(u.g, S) : memberPackageForMonth(u.m, S); sessions = (p && p.month === S && +p.sessions) || 0; } catch(e) {}
  return { done: done, missed: missed, planned: planned, sessions: sessions };""",
"""  let sessions = 0;
  try { const p = u.kind === 'group' ? groupPackageForMonth(u.g, S) : memberPackageForMonth(u.m, S); sessions = (p && p.month === S && +p.sessions) || 0; } catch(e) {}
  if (!sessions && (done || missed || planned)) { try { sessions = +sessionQuotaFor(u.kind === 'group' ? 'group' : 'member', u.id, S) || 0; } catch(e) {} } // v169: ders varken payda hak'tan
  return { done: done, missed: missed, planned: planned, sessions: sessions };""")

# ---------- 4) sabit "8 dersinin" metni ----------
rep("""      💡 Grubun 8 dersinin tarih ve saatini buradan toplu olarak gir. <b>Boş bıraktığın satır</b> oluşturulmaz/silinir. Kaydedince ana takvimde de gözükür.""",
"""      💡 Paketin derslerinin tarih ve saatini buradan toplu gir — satır sayısı birimin <b>ders hakkı</b> kadar açılır. <b>Boş bıraktığın satır</b> oluşturulmaz/silinir. Kaydedince ana takvimde de gözükür.""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.01.91">', '<meta name="app-version" content="2026.09.01.92">')
rep("const APP_VERSION = '2026.09.01.91';", "const APP_VERSION = '2026.09.01.92';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v168-2026-09-01-91';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v169-2026-09-01-92';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
