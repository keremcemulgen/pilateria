# -*- coding: utf-8 -*-
# v160 — Kerem (2026-08-31): "toplu ders gir sayfalarinda takvim gorunumundeki gibi sagda kutu
# olarak aylik takvim ciksin, toplu ders girerken aylari gorebilelim."
# TASARIM:
#  - modal-batch-dates: satirlarin SAGINDA #bd-minical kutusu (dar ekranda alta iner).
#    Acilista hedef paket ayini gosterir; ‹ › ile ay degistirilir (sarkan tarihler icin).
#  - Isaretler: YESIL = bu listede secili tarih (title'da satir numaralari), MAVI = birimin o gun
#    MEVCUT (iptal-disi) dersi, cerceve = bugun; birimin varsayilan gunlerinin sutun basligi koyu.
#  - Gune dokununca ILK BOS satira yazilir (saat bossa varsayilan saat); bos yoksa yeni satir.
#    Elle tarih yazinca da (batchDatesUpdate) isaret canli yenilenir.
#  - Hem grup hem bireysel toplu modal ayni kutuyu kullanir (ayni modal).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) modal HTML: satirlar + sag mini takvim ----------
rep("""<div class="modal-bg" id="modal-batch-dates">
  <div class="modal" style="max-width:680px;">""",
"""<div class="modal-bg" id="modal-batch-dates">
  <div class="modal" style="max-width:960px;">""")

rep("""    <div id="bd-rows" style="max-height:50vh;overflow:auto;"></div>""",
"""    <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;">
      <div id="bd-rows" style="max-height:50vh;overflow:auto;flex:1;min-width:300px;"></div>
      <div id="bd-minical" style="width:256px;flex:0 0 auto;"></div>
    </div>""")

# ---------- 2) modal acilislarinda takvim ayi hedef pakete kilitlenir ----------
rep("""  __batchDatesTarget = { type: 'group', id: groupId, packageMonth: monthISO || (g.packageStartDate ? g.packageStartDate.slice(0,7) : currentMonth()) };""",
"""  __batchDatesTarget = { type: 'group', id: groupId, packageMonth: monthISO || (g.packageStartDate ? g.packageStartDate.slice(0,7) : currentMonth()) };
  __bdCalMonth = __batchDatesTarget.packageMonth; // v160: mini takvim hedef ayda acilir""")

rep("""  __batchDatesTarget = { type: 'member', id: memberId, packageMonth: month };""",
"""  __batchDatesTarget = { type: 'member', id: memberId, packageMonth: month };
  __bdCalMonth = month; // v160: mini takvim hedef ayda acilir""")

# ---------- 3) satir listesi her cizildiginde takvim de yenilenir ----------
rep("""⭐ son: işaretlediğin ders takvimde "SON DERS" rozeti alır; işaretlemezsen paketin tüm dersleri girilince son derse otomatik gelir.</div>';
}""",
"""⭐ son: işaretlediğin ders takvimde "SON DERS" rozeti alır; işaretlemezsen paketin tüm dersleri girilince son derse otomatik gelir.</div>';
  try { renderBdMiniCal(); } catch(e){} // v160
}""")

# ---------- 4) elle tarih yazinca isaret canli yenilenir ----------
rep("""  if (field === 'date') __batchDatesRows[idx].date = bdParseDate(val); // metin -> ISO (yil otomatik)
  else if (field === 'time') __batchDatesRows[idx].time = bdParseTime(val); // "1000" -> "10:00"
  else __batchDatesRows[idx][field] = val;
}""",
"""  if (field === 'date') __batchDatesRows[idx].date = bdParseDate(val); // metin -> ISO (yil otomatik)
  else if (field === 'time') __batchDatesRows[idx].time = bdParseTime(val); // "1000" -> "10:00"
  else __batchDatesRows[idx][field] = val;
  if (field === 'date') { try { renderBdMiniCal(); } catch(e){} } // v160: mini takvim canli yenilenir
}""")

# ---------- 5) mini takvim motoru ----------
rep("""function batchDatesRemoveRow(idx) {
  __batchDatesRows.splice(idx,1);
  renderBatchDatesRows();
}""",
"""function batchDatesRemoveRow(idx) {
  __batchDatesRows.splice(idx,1);
  renderBatchDatesRows();
}
// v160 (Kerem): TOPLU DERS GIR MINI TAKVIMI — sagda kutu halinde aylik takvim; toplu girerken
// aylar gorulur. YESIL = listede secili tarih, MAVI = birimin o gun MEVCUT dersi, cerceve = bugun.
// ‹ › ay degistirir; gune dokununca ILK BOS satira yazilir (bos yoksa yeni satir acilir).
let __bdCalMonth = '';
function bdCalShift(dd) {
  const p = (__bdCalMonth || currentMonth()).split('-').map(Number);
  const dt = new Date(p[0], p[1] - 1 + dd, 1);
  __bdCalMonth = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  renderBdMiniCal();
}
function __bdUnitDefaults() {
  let days = [], time = '';
  if (__batchDatesTarget && __batchDatesTarget.type === 'group') {
    const g = state.groups.find(function(x){ return x.id === __batchDatesTarget.id; });
    if (g) { days = g.defaultDays || []; time = g.defaultTime || ''; }
  } else if (__batchDatesTarget) {
    const m = state.members.find(function(x){ return x.id === __batchDatesTarget.id; });
    if (m) { days = m.defaultDays || []; time = m.defaultTime || ''; }
  }
  return { days: days, time: time };
}
function bdCalPick(iso) {
  if (!__batchDatesTarget || !iso) return;
  const def = __bdUnitDefaults();
  let r = __batchDatesRows.find(function(x){ return x && !x.date; });
  if (!r) { r = { lessonId: null, date: '', time: def.time || '', status: 'planned' }; __batchDatesRows.push(r); }
  r.date = iso;
  if (!r.time) r.time = def.time || '';
  renderBatchDatesRows();
}
function renderBdMiniCal() {
  const el = document.getElementById('bd-minical');
  if (!el) return;
  if (!__batchDatesTarget) { el.innerHTML = ''; return; }
  const mo = __bdCalMonth || (__batchDatesTarget.packageMonth || currentMonth());
  const py = +mo.slice(0, 4), pmo = +mo.slice(5, 7);
  const gunSay = new Date(py, pmo, 0).getDate();
  const kayma = (new Date(py, pmo - 1, 1).getDay() + 6) % 7; // Pazartesi baslangicli
  const bugun = todayISO();
  const secili = {};
  __batchDatesRows.forEach(function(r, i){ if (r && r.date) (secili[r.date] = secili[r.date] || []).push(i + 1); });
  const mevcut = new Set();
  (state.lessons || []).forEach(function(l){
    if (!l || l.status === 'cancelled' || !l.date || String(l.date).slice(0, 7) !== mo) return;
    if (__batchDatesTarget.type === 'group') { if (l.groupId === __batchDatesTarget.id) mevcut.add(l.date); }
    else { if (!l.groupId && (l.memberIds || []).includes(__batchDatesTarget.id)) mevcut.add(l.date); }
  });
  const def = __bdUnitDefaults();
  const defSet = {}; (def.days || []).forEach(function(x){ defSet[x] = true; });
  const ayAdi = (function(){ try { return parseISO(mo + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }); } catch(e){ return mo; } })();
  const H = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'], DOWS = [1,2,3,4,5,6,0];
  let html = '<div style="border:1px solid var(--border,#e5d9c9);border-radius:10px;padding:10px;background:#fff;">'
    + '<div class="row between" style="align-items:center;margin-bottom:6px;">'
    + '<button class="btn small secondary" onclick="bdCalShift(-1)" title="Önceki ay">‹</button>'
    + '<b id="bd-cal-title" style="font-size:13px;">' + ayAdi + '</b>'
    + '<button class="btn small secondary" onclick="bdCalShift(1)" title="Sonraki ay">›</button></div>'
    + '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">'
    + H.map(function(h, i){ return '<div style="text-align:center;font-size:10.5px;color:var(--muted);padding:2px 0;' + (defSet[DOWS[i]] ? 'font-weight:800;color:#2E7D32;' : '') + '"' + (defSet[DOWS[i]] ? ' title="Varsayılan ders günü"' : '') + '>' + h + '</div>'; }).join('');
  for (let b = 0; b < kayma; b++) html += '<div></div>';
  for (let g = 1; g <= gunSay; g++) {
    const iso = mo + '-' + String(g).padStart(2, '0');
    const sel = secili[iso], has = mevcut.has(iso);
    let st = 'text-align:center;padding:4px 0;border-radius:6px;font-size:12px;cursor:pointer;border:1px solid transparent;user-select:none;';
    let tt = 'Dokun → ilk boş satıra yazılır';
    if (has) { st += 'background:#E3F2FD;color:#1565C0;'; tt = 'Bu gün mevcut ders var'; }
    if (sel) { st += 'background:#2E7D32;color:#fff;font-weight:700;'; tt = 'Bu listede: #' + sel.join(', #'); }
    if (iso === bugun) st += 'border-color:var(--acc,#c77b3a);';
    html += '<div class="bd-cal-day' + (sel ? ' bd-sel' : '') + (has ? ' bd-has' : '') + '" data-iso="' + iso + '" onclick="bdCalPick(\\'' + iso + '\\')" style="' + st + '" title="' + tt + '">' + g + '</div>';
  }
  html += '</div><div style="font-size:10.5px;color:var(--muted);margin-top:6px;line-height:1.5;">'
    + '<span style="display:inline-block;width:10px;height:10px;background:#2E7D32;border-radius:3px;"></span> listedeki tarih · '
    + '<span style="display:inline-block;width:10px;height:10px;background:#E3F2FD;border-radius:3px;"></span> mevcut ders · güne dokun → ilk boş satıra yazılır</div></div>';
  el.innerHTML = html;
}""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.30.82">', '<meta name="app-version" content="2026.08.31.83">')
rep("const APP_VERSION = '2026.08.30.82';", "const APP_VERSION = '2026.08.31.83';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v159-2026-08-30-82';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v160-2026-08-31-83';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
