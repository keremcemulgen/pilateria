# -*- coding: utf-8 -*-
# v132 — TELEFONDA GOOGLE TAKVIM DUZENI (Kerem 3 ekran goruntusuyle istedi; kararlar:
# Ay = noktali mini izgara + SECILI GUNUN listesi · kart rengi Pilateria --acc, Google geometrisi)
# MASAUSTU AYNEN KALIR: yeni siniflar yalniz __calMobile() dallarinda uretilir;
# hafta gorunumu mobilde CSS-only sadelesir (paket/uye satirlari gizli, saat kalir).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) CSS ----------
rep("""<style id="pl-print-css">""",
"""<style id="pl-cal-mobile-css">
/* v132: telefonda Google Takvim duzeni — masaustu etkilenmez (siniflar yalniz mobil JS dallarinda uretilir) */
.pcal-wrap { display:flex; flex-direction:column; gap:10px; }
.pcal-dows { display:grid; grid-template-columns:repeat(7,1fr); text-align:center; font-size:11px; color:var(--muted); font-weight:700; letter-spacing:.5px; margin-bottom:2px; }
.pcal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
.pcal-cell { appearance:none; background:none; border:none; border-radius:10px; padding:4px 0 3px; display:flex; flex-direction:column; align-items:center; gap:1px; cursor:pointer; font:inherit; color:var(--text); }
.pcal-cell.out { opacity:.32; }
.pcal-cell .pcal-num { width:30px; height:30px; line-height:30px; text-align:center; border-radius:50%; font-size:14.5px; }
.pcal-cell.today .pcal-num { box-shadow:inset 0 0 0 1.6px var(--acc); color:var(--acc); font-weight:700; }
.pcal-cell.sel .pcal-num { background:var(--acc); color:var(--acc-contrast,#fff); font-weight:700; box-shadow:none; }
.pcal-cell.hol .pcal-num { color:#c62828; }
.pcal-dots { min-height:10px; font-size:9px; letter-spacing:1px; color:var(--acc); line-height:1; }
.pcal-dots i { font-style:normal; vertical-align:top; }
.pcal-daylbl { font-size:12px; font-weight:800; color:var(--muted); letter-spacing:.5px; margin:4px 2px 2px; text-transform:uppercase; }
.pcal-card { background:var(--acc); color:var(--acc-contrast,#fff); border-radius:12px; padding:10px 14px; margin:6px 0; cursor:pointer; }
.pcal-card .pcal-c1 { font-size:14.5px; font-weight:600; line-height:1.35; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.pcal-card .pcal-c2 { font-size:12px; opacity:.85; margin-top:2px; }
.pcal-card.pcst-completed { background:var(--acc-strong,#0a5f52); }
.pcal-card.pcst-missed { background:var(--bad,#C4634F); color:#fff; }
.pcal-card.pcst-cancelled { background:#9aa1a6; color:#14181b; }
.pcal-card.pcst-cancelled .pcal-c1 { text-decoration:line-through; }
.pcal-empty { padding:14px 4px; color:var(--muted); font-size:13.5px; display:flex; align-items:center; gap:10px; }
@media (max-width:768px) {
  /* hafta gorunumu: Google gibi sade bloklar — saat buyur, paket/uye/hoca satirlari gizlenir */
  .cal-lesson .l-top, .cal-lesson .l-members, .cal-lesson .l-inst { display:none; }
  .cal-lesson .l-time { font-size:12px; font-weight:700; }
}
</style>
<style id="pl-print-css">""")

# ---------- 2) JS: mobil ay/gun cizicileri + gun gorunumu kancasi ----------
rep("""function renderCalendarDay() {
  const d = new Date(calAnchor);
""",
"""// ===== v132: TELEFONDA GOOGLE TAKVIM DUZENI =====
// Kerem'in karari: Ay = noktali mini izgara + altta SECILI GUNUN kart listesi; kartlar Pilateria yesili.
// __forceCalMobile test kancasidir; gercek karar matchMedia(max-width:768px).
function __calMobile() {
  try {
    if (typeof window.__forceCalMobile !== 'undefined') return !!window.__forceCalMobile;
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  } catch(e) { return false; }
}
let __calSelDay = null; // 'YYYY-MM-DD' — mobil ay gorunumunde secili gun
function pcalSelectDay(iso) {
  __calSelDay = iso;
  try { calAnchor = parseISO(iso); } catch(e) {}
  renderCalendarMonth();
}
function __pcalLessonCard(l) {
  const st = l.status || 'planned';
  const cancelled = st === 'cancelled';
  const ay = l.packageMonth || String(l.date || '').slice(0,7);
  const kisiler = l.groupId
    ? (function(){ const ns = (l.memberIds||[]).map(memberName).filter(Boolean); return ns.length ? ns.join('+') : (groupNameForMonth(l.groupId, ay) || 'Grup'); })()
    : ((l.memberIds||[]).map(memberName).filter(Boolean).join('+') || '(boş)');
  const hoca = l.instructorId ? instructorName(l.instructorId) : '';
  const bit = (function(){ try { const m0 = timeToMinutes(l.time) + (+l.durationMin || +state.settings.lessonDuration || 60); return String(Math.floor(m0/60)).padStart(2,'0') + ':' + String(m0%60).padStart(2,'0'); } catch(e) { return ''; } })();
  const dolu = (l.memberIds||[]).filter(Boolean).length;
  return `<div class="pcal-card pcst-${st}" onclick="openLessonModal('${l.id}')">
    <div class="pcal-c1">${l.time} (${escapeHtml(kisiler)})${hoca ? `(${escapeHtml(hoca)}+)` : ''}${cancelled ? ' iptal' : ''}</div>
    <div class="pcal-c2">${l.time}${bit ? '–' + bit : ''} · ${dolu}/${l.size || state.settings.reformers} · ${(LESSON_STATUS[st]||{}).label || ''}</div>
  </div>`;
}
function __pcalAgendaHtml(dayISO) {
  const d = parseISO(dayISO);
  const ls = state.lessons.filter(l => l.date === dayISO).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const hol = (typeof isHoliday === 'function') && isHoliday(dayISO);
  const lbl = `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${d.toLocaleDateString('tr-TR',{month:'long'})}`;
  return `<div class="pcal-daylbl">${lbl}${hol ? ` <span style="color:#c62828;">· KAPALI${holidayName(dayISO) ? ' — ' + escapeHtml(holidayName(dayISO)) : ''}</span>` : ''}</div>`
    + (ls.length ? ls.map(__pcalLessonCard).join('')
                 : `<div class="pcal-empty">Bu gün ders yok. <button class="btn small" onclick="openLessonModal(null,'${dayISO}','10:00')">+ Ders Ekle</button></div>`);
}
function renderCalMonthMobile() {
  const d = new Date(calAnchor);
  const y = d.getFullYear(), m = d.getMonth();
  document.getElementById('week-label').textContent = d.toLocaleDateString('tr-TR', { month:'long', year:'numeric' });
  const first = new Date(y, m, 1);
  const firstDow = first.getDay()===0 ? 6 : first.getDay()-1;
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const todayIso = todayISO();
  const ayKey = y + '-' + String(m+1).padStart(2,'0');
  if (!__calSelDay || String(__calSelDay).slice(0,7) !== ayKey) {
    __calSelDay = (todayIso.slice(0,7) === ayKey) ? todayIso : isoDate(first);
  }
  const cal = document.getElementById('calendar');
  cal.className = 'calendar pcal-host';
  const dows = ['P','S','Ç','P','C','C','P'];
  let grid = '<div class="pcal-dows">' + dows.map(x=>`<span>${x}</span>`).join('') + '</div><div class="pcal-grid">';
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  for (let c = 0; c < totalCells; c++) {
    const dn = c - firstDow + 1;
    const dd = new Date(y, m, dn);
    const dISO = isoDate(dd);
    const inMonth = dn >= 1 && dn <= daysInMonth;
    const n = state.lessons.filter(l => l.date === dISO && l.status !== 'cancelled').length;
    const dots = '<span class="pcal-dots">' + (n ? ('•'.repeat(Math.min(n,3)) + (n > 3 ? '<i>+</i>' : '')) : '') + '</span>';
    const cls = 'pcal-cell' + (inMonth ? '' : ' out') + (dISO === todayIso ? ' today' : '') + (dISO === __calSelDay ? ' sel' : '') + ((typeof isHoliday === 'function' && isHoliday(dISO)) ? ' hol' : '');
    grid += `<button class="${cls}" onclick="pcalSelectDay('${dISO}')"><span class="pcal-num">${dd.getDate()}</span>${dots}</button>`;
  }
  grid += '</div>';
  cal.innerHTML = `<div class="pcal-wrap">${grid}<div class="pcal-agenda" id="pcal-agenda">${__pcalAgendaHtml(__calSelDay)}</div></div>`;
}
function renderCalDayMobile() {
  const d = new Date(calAnchor);
  document.getElementById('week-label').textContent = `${DAYS_LONG[d.getDay()]}, ${fmtDate(d)}`;
  const cal = document.getElementById('calendar');
  cal.className = 'calendar pcal-host';
  cal.innerHTML = `<div class="pcal-wrap"><div class="pcal-agenda">${__pcalAgendaHtml(isoDate(d))}</div></div>`;
}
function renderCalendarDay() {
  if (__calMobile()) return renderCalDayMobile(); // v132
  const d = new Date(calAnchor);
""")

# ---------- 3) ay gorunumu kancasi ----------
rep("""function renderCalendarMonth() {
  const d = new Date(calAnchor);
""",
"""function renderCalendarMonth() {
  if (__calMobile()) return renderCalMonthMobile(); // v132
  const d = new Date(calAnchor);
""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.30.54">', '<meta name="app-version" content="2026.07.30.55">')
rep("const APP_VERSION = '2026.07.30.54';", "const APP_VERSION = '2026.07.30.55';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v131-2026-07-30-54';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v132-2026-07-30-55';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
