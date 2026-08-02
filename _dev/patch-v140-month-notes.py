# -*- coding: utf-8 -*-
# v140 — AY NOTLARI (Kerem 2026-08-02): Uyeler sayfasinda AYA OZEL (uyeye degil) not defteri.
# Telefon not uygulamasi gibi: ayri ayri kayit, liste gorunumu, tarih (olusturma + duzenlenme)
# gorunur, duzenle/sil. Veri settings.monthNotes[ay] icinde tasinir (holidays/taxLedger emsali —
# YENI sunucu tablosu YOK, senkron otomatik). Not metni HER ZAMAN escapeHtml ile basilir (XSS).
# Ayrica: structuredClone polyfill (eski Chromium <98 emniyeti — MatePad/eski cihaz dayanikliligi).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) HTML: uyeler sayfasina not karti ----------
rep("""    <div id="members-stats" class="grid-stats" style="margin-bottom:12px;"></div>""",
"""    <details id="month-notes-card" style="margin:0 0 12px;padding:10px 12px;background:#FFFDF2;border:1px solid #EFE3B8;border-radius:10px;">
      <summary style="cursor:pointer;font-weight:700;">🗒️ Ay Notları <span id="month-notes-sub" style="font-weight:400;color:var(--muted);margin-left:6px;"></span></summary>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin:10px 0;align-items:flex-start;">
        <textarea id="mn-text" placeholder="Bu aya özel not... (üyeye değil, aya aittir)" style="flex:1;min-width:200px;min-height:44px;"></textarea>
        <button class="btn small pl-owner-only" onclick="addMonthNote()">Ekle</button>
      </div>
      <div id="month-notes-list"></div>
    </details>
    <div id="members-stats" class="grid-stats" style="margin-bottom:12px;"></div>""")

# ---------- 2) JS: not defteri fonksiyonlari ----------
rep("""function renderMembers() {
  ensureMemberMonthSelect();""",
"""// ========== AY NOTLARI (v140) ==========
// Kerem: uyeler sayfasinda AYA OZEL not defteri — telefon not uygulamasi gibi.
// Kayitlar settings.monthNotes = { 'YYYY-MM': [{id, text, createdAt, updatedAt?}] } yapisinda.
function __mnMonth() { return (document.getElementById('member-month')||{}).value || currentMonth(); }
function monthNotesFor(ay) {
  const all = state.settings.monthNotes || {};
  return Array.isArray(all[ay]) ? all[ay] : [];
}
function addMonthNote() {
  const el = document.getElementById('mn-text');
  const text = ((el && el.value) || '').trim();
  if (!text) { alert('Not boş — önce bir şeyler yaz.'); return; }
  const ay = __mnMonth();
  state.settings.monthNotes = state.settings.monthNotes || {};
  if (!Array.isArray(state.settings.monthNotes[ay])) state.settings.monthNotes[ay] = [];
  state.settings.monthNotes[ay].push({ id: uid(), text: text, createdAt: new Date().toISOString() });
  if (el) el.value = '';
  save(); renderMonthNotes(ay);
  if (window.plToast) plToast('🗒️ Not kaydedildi — ' + ay);
}
function removeMonthNote(ay, id) {
  const list = monthNotesFor(ay);
  const n = list.find(function(x){ return x.id === id; });
  if (!n) return;
  if (!confirm('Bu not silinsin mi?\\n\\n' + String(n.text).slice(0, 120))) return;
  state.settings.monthNotes[ay] = list.filter(function(x){ return x.id !== id; });
  if (!state.settings.monthNotes[ay].length) delete state.settings.monthNotes[ay];
  save(); renderMonthNotes(ay);
}
function editMonthNote(ay, id) {
  const box = document.getElementById('mn-item-' + id);
  const n = monthNotesFor(ay).find(function(x){ return x.id === id; });
  if (!box || !n) return;
  box.innerHTML = `<textarea id="mn-edit-${id}" style="width:100%;min-height:60px;box-sizing:border-box;">${escapeHtml(n.text)}</textarea>
    <div class="row" style="gap:6px;justify-content:flex-end;margin-top:4px;">
      <button class="btn small secondary" onclick="renderMonthNotes('${ay}')">Vazgeç</button>
      <button class="btn small" onclick="saveMonthNoteEdit('${ay}','${id}')">Kaydet</button>
    </div>`;
  const ta = document.getElementById('mn-edit-' + id); if (ta) ta.focus();
}
function saveMonthNoteEdit(ay, id) {
  const ta = document.getElementById('mn-edit-' + id);
  const text = ((ta && ta.value) || '').trim();
  if (!text) { alert('Not boş bırakılamaz — silmek için Sil düğmesini kullan.'); return; }
  const n = monthNotesFor(ay).find(function(x){ return x.id === id; });
  if (!n) return;
  n.text = text; n.updatedAt = new Date().toISOString();
  save(); renderMonthNotes(ay);
  if (window.plToast) plToast('🗒️ Not güncellendi');
}
function __mnStamp(iso) {
  try { const d = new Date(iso); return fmtDate(isoDate(d)) + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
  catch(e) { return String(iso || '').slice(0, 10); }
}
function renderMonthNotes(ay) {
  const listEl = document.getElementById('month-notes-list');
  if (!listEl) return;
  ay = ay || __mnMonth();
  const list = monthNotesFor(ay).slice().sort(function(a,b){ return String(b.createdAt||'').localeCompare(String(a.createdAt||'')); });
  const sub = document.getElementById('month-notes-sub');
  if (sub) sub.textContent = ay + (list.length ? ' · ' + list.length + ' not' : ' · not yok');
  listEl.innerHTML = list.length ? list.map(function(n){
    return `<div class="mn-item" id="mn-item-${n.id}" style="background:#fff;border:1px solid #eee;border-radius:8px;padding:8px 10px;margin:6px 0;">
      <div style="white-space:pre-wrap;font-size:13.5px;">${escapeHtml(n.text)}</div>
      <div class="row" style="gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap;">
        <span style="font-size:11px;color:var(--muted);">🗓️ ${__mnStamp(n.createdAt)}${n.updatedAt ? ' · düzenlendi ' + __mnStamp(n.updatedAt) : ''}</span>
        <span style="flex:1;"></span>
        <button class="btn small secondary pl-owner-only" onclick="editMonthNote('${ay}','${n.id}')">✏️ Düzenle</button>
        <button class="btn small danger pl-owner-only" onclick="removeMonthNote('${ay}','${n.id}')">Sil</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty" style="padding:10px;">Bu ay için not yok. Yukarıdan ekleyebilirsin.</div>';
}
function renderMembers() {
  ensureMemberMonthSelect();""")

# ---------- 3) renderMembers kancasi: ay degisince notlar da degisir ----------
rep("""  const monthISO = document.getElementById('member-month').value || '';""",
"""  const monthISO = document.getElementById('member-month').value || '';
  try { renderMonthNotes(monthISO || currentMonth()); } catch(e) {} // v140""")

# ---------- 4) structuredClone polyfill (eski Chromium emniyeti) ----------
rep("""window.APP_VERSION = APP_VERSION; // debug/test için global""",
"""window.APP_VERSION = APP_VERSION; // debug/test için global
if (!window.structuredClone) window.structuredClone = function(o){ return JSON.parse(JSON.stringify(o)); }; // v140: eski Chromium (<98) emniyeti — state JSON-güvenli""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.31.62">', '<meta name="app-version" content="2026.08.02.63">')
rep("const APP_VERSION = '2026.07.31.62';", "const APP_VERSION = '2026.08.02.63';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v139-2026-07-31-62';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v140-2026-08-02-63';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
