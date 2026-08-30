# -*- coding: utf-8 -*-
# v161 — Kerem (2026-08-31, ekran goruntusuyle v160 duzeltmesi):
# "HATA: mini takvime tikladikca ders ekliyor — boyle bir ozellige gerek yok KESINLIKLE.
#  Mevcut dersleri mavi gostermiyor; yapildi dersleri yesil gostermesi dogru; renklendirmeler
#  takvim sayfasiyla ayni olabilir. Bu takvimin tek amaci derslere BAKMAK. Ayrica grup/bireysel
#  icin makine sayisi ve hoca ozelinde ders girilebilir tarihler de takvimdeki gibi gosterilsin."
# KURALLAR:
#  1) SALT BAKIS: gun hucresinde onclick YOK; bdCalPick KALDIRILDI ("gune dokun" ipucu dahil).
#  2) RENK DILI = ANA TAKVIM (LESSON_STATUS): yesil=yapildi, mavi=planli, kirmizi=yandi,
#     gri-cizgili=iptal. Gunun rengi yapildi > yandi > planli > iptal onceligiyle; title'da dokum.
#     Bu listedeki satirlarin gunleri ic cerceve (bd-sel) + satir numaralari; birimin satirlarda
#     olmayan ayni-takvim-ayi dersleri de durum rengiyle gorunur (baska paket ayindan sarkanlar).
#  3) GIRILEBILIRLIK: dersi olmayan gunlerde, ayin saat doluluguna (makine sayisi, iptal-disi
#     kisi toplami) + birimin hocasinin o saatteki mesguliyetine gore EN AZ BIR uygun saat varsa
#     bd-free, yoksa bd-full (tarali, "uygun saat yok"). Grup ihtiyaci = hedef ay aktif kadrosu.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- v160 blogu bastan yazilir (bdCalPick dahil tamami) ----------
START = "// v160 (Kerem): TOPLU DERS GIR MINI TAKVIMI"
ENDM = "  el.innerHTML = html;\n}"
assert s.count(START) == 1, 'baslangic ankraji!'
i0 = s.index(START)
i1 = s.index(ENDM, i0)
assert i1 > i0 and i1 - i0 < 9000, 'blok siniri beklenmedik'
old_block = s[i0:i1 + len(ENDM)]
assert 'bdCalPick' in old_block and 'renderBdMiniCal' in old_block, 'blok icerigi beklenmedik'

NEW = """// v161 (Kerem, v160 duzeltmesi): MINI TAKVIM SALT BAKISTIR — tiklayinca ders EKLENMEZ (kaldirildi).
// Renk dili ana takvimle AYNI (LESSON_STATUS): yesil=yapildi, mavi=planli, kirmizi=yandi,
// gri-cizgili=iptal; ic cerceve = bu listedeki satir; tarali = o gun DERS GIRILEBILIR SAAT YOK
// (makine sayisi + birimin hocasi tum saatlerde dolu) — ders yazarken yardimci.
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
function __bdUnitNeed() { // kac makine gerekli + birimin hocasi
  if (!__batchDatesTarget) return { need: 1, inst: '' };
  if (__batchDatesTarget.type === 'group') {
    const g = state.groups.find(function(x){ return x.id === __batchDatesTarget.id; });
    const ros = g ? (activeGroupRosterForMonth(g, __batchDatesTarget.packageMonth || currentMonth()) || []) : [];
    return { need: ros.length || (g && g.size) || 1, inst: (g && g.defaultInstructorId) || '' };
  }
  const m = state.members.find(function(x){ return x.id === __batchDatesTarget.id; });
  return { need: 1, inst: (m && m.instructorId) || '' };
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
  // bu listedeki satirlar: gun -> durumlar + satir numaralari
  const satir = {}; const satirLid = new Set();
  __batchDatesRows.forEach(function(r, i){
    if (!r) return;
    if (r.lessonId) satirLid.add(r.lessonId);
    if (!r.date) return;
    const o = satir[r.date] = satir[r.date] || { st: [], no: [] };
    o.st.push(r.status || 'planned'); o.no.push(i + 1);
  });
  // ayin dersleri TEK GECIS: birimin satir-disi dersleri (durum) + saat doluluk + hoca doluluk
  const digerst = {}; const kap = {}; const hocaDolu = {};
  (state.lessons || []).forEach(function(l){
    if (!l || !l.date || String(l.date).slice(0, 7) !== mo) return;
    if (l.status !== 'cancelled') {
      const k = l.date + '|' + (l.time || '');
      kap[k] = (kap[k] || 0) + ((l.memberIds || []).length || 1);
      if (l.instructorId) hocaDolu[k + '|' + l.instructorId] = true;
    }
    const bizim = __batchDatesTarget.type === 'group'
      ? (l.groupId === __batchDatesTarget.id)
      : (!l.groupId && (l.memberIds || []).includes(__batchDatesTarget.id));
    if (bizim && !satirLid.has(l.id)) (digerst[l.date] = digerst[l.date] || []).push(l.status || 'planned');
  });
  const nd = __bdUnitNeed();
  const RF = getReformers();
  const slots = hourSlots();
  const uygunGun = {};
  for (let gg = 1; gg <= gunSay; gg++) {
    const iso = mo + '-' + String(gg).padStart(2, '0');
    for (let si = 0; si < slots.length; si++) {
      const k = iso + '|' + slots[si];
      if ((kap[k] || 0) + nd.need > RF) continue;
      if (nd.inst && hocaDolu[k + '|' + nd.inst]) continue;
      uygunGun[iso] = true; break;
    }
  }
  const def = __bdUnitDefaults();
  const defSet = {}; (def.days || []).forEach(function(x){ defSet[x] = true; });
  const ayAdi = (function(){ try { return parseISO(mo + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }); } catch(e){ return mo; } })();
  const H = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'], DOWS = [1,2,3,4,5,6,0];
  const RENK = {
    planned:   { bg:'#e3f2fd', fg:'#1565C0', ad:'planlı' },
    completed: { bg:'#e8f0e0', fg:'#33691E', ad:'yapıldı' },
    missed:    { bg:'#ffebee', fg:'#C4634F', ad:'yandı' },
    cancelled: { bg:'transparent', fg:'var(--muted)', ad:'iptal' }
  };
  const secim = function(stz){ // gunun rengi: yapildi > yandi > planli > iptal
    if (stz.indexOf('completed') !== -1) return 'completed';
    if (stz.indexOf('missed') !== -1) return 'missed';
    if (stz.indexOf('planned') !== -1) return 'planned';
    return 'cancelled';
  };
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
    const sr = satir[iso]; const dg = digerst[iso] || [];
    const stz = (sr ? sr.st : []).concat(dg);
    let st = 'text-align:center;padding:4px 0;border-radius:6px;font-size:12px;border:1px solid transparent;user-select:none;';
    let cls = 'bd-cal-day', tt = '';
    if (stz.length) {
      const s1 = secim(stz);
      const rk = RENK[s1];
      st += 'background:' + rk.bg + ';color:' + rk.fg + ';font-weight:700;';
      if (s1 === 'cancelled') st += 'text-decoration:line-through;border:1px dashed var(--border,#ccc);';
      cls += ' bd-' + s1;
      const say = {}; stz.forEach(function(x){ say[x] = (say[x] || 0) + 1; });
      tt = Object.keys(say).map(function(x){ return say[x] + ' ' + (RENK[x] ? RENK[x].ad : x); }).join(' · ');
      if (sr) { st += 'box-shadow:inset 0 0 0 1.5px ' + rk.fg + ';'; cls += ' bd-sel'; tt += ' — bu listede: #' + sr.no.join(', #'); }
    } else if (!uygunGun[iso]) {
      st += 'background:repeating-linear-gradient(45deg,#f3efe4,#f3efe4 3px,#e9e2cf 3px,#e9e2cf 6px);color:#9a8f78;';
      cls += ' bd-full';
      tt = 'Uygun saat yok — makine/hoca dolu';
    } else { cls += ' bd-free'; tt = 'Ders girilebilir gün'; }
    if (iso === bugun) st += 'border-color:var(--acc,#c77b3a);';
    html += '<div class="' + cls + '" data-iso="' + iso + '" style="' + st + '" title="' + tt + '">' + g + '</div>';
  }
  html += '</div><div style="font-size:10.5px;color:var(--muted);margin-top:6px;line-height:1.6;">'
    + '<span style="display:inline-block;width:10px;height:10px;background:#e8f0e0;border:1px solid #33691E;border-radius:3px;"></span> yapıldı · '
    + '<span style="display:inline-block;width:10px;height:10px;background:#e3f2fd;border:1px solid #1565C0;border-radius:3px;"></span> planlı · '
    + '<span style="display:inline-block;width:10px;height:10px;background:#ffebee;border:1px solid #C4634F;border-radius:3px;"></span> yandı · '
    + '<span style="display:inline-block;width:10px;height:10px;background:repeating-linear-gradient(45deg,#f3efe4,#f3efe4 3px,#e9e2cf 3px,#e9e2cf 6px);border-radius:3px;"></span> uygun saat yok · iç çerçeve: bu listedeki satır</div></div>';
  el.innerHTML = html;
}"""

s = s[:i0] + NEW + s[i1 + len(ENDM):]

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.31.83">', '<meta name="app-version" content="2026.08.31.84">')
rep("const APP_VERSION = '2026.08.31.83';", "const APP_VERSION = '2026.08.31.84';")

assert 'bdCalPick' not in s, 'bdCalPick tamamen kalkmali!'
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v160-2026-08-31-83';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v161-2026-08-31-84';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
