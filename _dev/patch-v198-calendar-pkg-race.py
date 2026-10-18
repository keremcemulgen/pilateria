# -*- coding: utf-8 -*-
# v198 (Kerem 18.10) — üç iş, tek sürüm:
# (A) TAKVİM PAKET BİLGİSİ: "takvimde üye derslerinde hangi grup veya bireysel ders ise hocasının altına o paketin hangi ayın paketi
#     ve kaçıncı dersi olduğu gözüksün". __lessonPkgInfo198(l) → {pm, ord, quota, short:'📦 Ekim · 3/8', long:'Ekim paketi · 3. ders / 8'}.
#     Eş-ders kümesi sessionsFinishState/isLastLessonOfPackage ile AYNI kural (grup: groupId + paket ayı; bireysel: ilk üye, grupsuz;
#     iptal sayılmaz); sıra = tarih+saat(+id) sırası. Masaüstü gcal kutusu: hoca satırının (gev-l2) altına gev-l3 (kompakt kutuda yok,
#     ipucu/title her zaman); telefon/tablet gündem kartı: pcal-c2 altına pcal-c3; ay görünümü çipi: title ipucu.
# (B) TAZELEME YARIŞI (18.10 canlı gözlem): sbResync kilitlere ÇEKİMDEN ÖNCE bakıyordu; 1–2 sn süren çekim sırasında yapılan yerel
#     kayıt `state = __incoming` ile yerelden düşüyordu (bulut gönderimi mikro-görev olduğu için buluta gitmişti; realtime yansımasıyla
#     geri geldi). Çekim bitince kirli / süren gönderim / yeni biten gönderim varsa ÜZERİNE YAZMA; 'after-push' ile ertele.
# (C) HOCA DÜZENLEME ALAN KAYBI: saveInstructor kaydı baştan kuruyordu → v138 sgkTam (ay bazlı tam sigorta) ve bilinmeyen alanlar
#     silinirdi (canlı: ESR*** kaydında sgkTam var). Mevcut kayıt korunur; "Ortak" kutusu kaldırılınca partner alanı kalkar.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# ---------- (A) CSS ----------
rep(""".gcal-ev .gev-l2 { font-size:10.5px; opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
""",
""".gcal-ev .gev-l2 { font-size:10.5px; opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.gcal-ev .gev-l3 { font-size:10px; opacity:.9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.25; } /* v198: paket ayı · kaçıncı ders (hocanın altı) */
.gcal-ev:has(.gev-l3) { line-height:1.25; } /* v198: üç satır 45 dk kutusuna sığsın */
""")
rep(".gst-planned .gev-time, .gst-planned .gev-l2, .gst-planned .gev-cnt { color:#000000; }",
    ".gst-planned .gev-time, .gst-planned .gev-l2, .gst-planned .gev-l3, .gst-planned .gev-cnt { color:#000000; }")
rep(".gst-missed .gev-time, .gst-missed .gev-l2, .gst-missed .gev-cnt { color:#000000; }",
    ".gst-missed .gev-time, .gst-missed .gev-l2, .gst-missed .gev-l3, .gst-missed .gev-cnt { color:#000000; }")
rep("  .gcal-ev .gev-l2 { display:none; }\n",
    "  .gcal-ev .gev-l2 { display:none; }\n  .gcal-ev .gev-l3 { display:none; } /* v198: telefonda hafta kutusu dar; bilgi gündem kartında */\n")
rep(".pcal-card .pcal-c2 { font-size:12px; opacity:.85; margin-top:2px; }",
    ".pcal-card .pcal-c2 { font-size:12px; opacity:.85; margin-top:2px; }\n.pcal-card .pcal-c3 { font-size:12px; opacity:.9; margin-top:2px; } /* v198: paket ayı · kaçıncı ders */")

# ---------- (A) yardımcı ----------
rep("""// v18: Paket ayi etiketi — 'Haziran' (farkli yilsa 'Haziran 2027')
function pkgMonthLabel(pm) {""",
"""// v198 (Kerem 18.10): takvimde dersin PAKET AYI + KAÇINCI DERS olduğu — hocanın altında. Eş-ders kümesi
// sessionsFinishState / isLastLessonOfPackage ile AYNI kural: grup → groupId + paket ayı; bireysel → ilk üye, grupsuz; iptal sayılmaz.
// Sıra = tarih + saat (+ id) sırası; hak = sessionQuotaFor (0 ise yalnız sıra). İptal derste sıra yok ("iptal").
function __lessonPkgInfo198(l) {
  try {
    if (!l) return null;
    const pm = __plLessonMonth(l); if (!pm) return null;
    let ownerType, ownerId;
    if (l.groupId) { ownerType = 'group'; ownerId = l.groupId; }
    else { ownerId = (l.memberIds || [])[0]; if (!ownerId) return null; ownerType = 'member'; }
    const peers = (state.lessons || []).filter(function(x){
      if (!x || x.status === 'cancelled') return false;
      if (__plLessonMonth(x) !== pm) return false;
      return ownerType === 'group' ? x.groupId === ownerId : (!x.groupId && (x.memberIds || []).includes(ownerId));
    });
    const key = function(x){ return String(x.date || '') + 'T' + String(x.time || '') + '|' + String(x.id || ''); };
    peers.sort(function(a, b){ const ka = key(a), kb = key(b); return ka < kb ? -1 : (ka > kb ? 1 : 0); });
    const q = +sessionQuotaFor(ownerType, ownerId, pm) || 0;
    const cancelled = l.status === 'cancelled';
    const idx = cancelled ? -1 : peers.findIndex(function(x){ return x.id === l.id; });
    const ord = idx >= 0 ? idx + 1 : 0;
    const ml = pkgMonthLabel(pm);
    const short = '📦 ' + ml + (ord ? ' · ' + ord + (q > 0 ? '/' + q : '. ders') : (cancelled ? ' · iptal' : ''));
    const long = ml + ' paketi' + (ord ? ' · ' + ord + '. ders' + (q > 0 ? ' / ' + q : '') : (cancelled ? ' · iptal (hak kullanılmaz)' : ''));
    return { pm: pm, ord: ord, quota: q, total: peers.length, short: short, long: long, ownerType: ownerType, ownerId: ownerId };
  } catch(e) { return null; }
}
// v18: Paket ayi etiketi — 'Haziran' (farkli yilsa 'Haziran 2027')
function pkgMonthLabel(pm) {""")

# ---------- (A) masaüstü gcal kutusu ----------
rep("""  const compact = hPx < 40;
  const line2 = compact ? '' : `<div class="gev-l2">${escapeHtml(inst)}${inst?' · ':''}${cnt}${pmBadge}</div>`;
  const title = `${l.time} ${label}${inst ? ' — ' + inst : ''} (${cnt})`;""",
"""  const compact = hPx < 40;
  const __pk198 = (typeof __lessonPkgInfo198 === 'function') ? __lessonPkgInfo198(l) : null; // v198: paket ayı · kaçıncı ders
  const line3 = (!compact && __pk198) ? `<div class="gev-l3">${escapeHtml(__pk198.short)}</div>` : '';
  const line2 = compact ? '' : `<div class="gev-l2">${escapeHtml(inst)}${inst?' · ':''}${cnt}${line3 ? '' : pmBadge}</div>`; // v198: paket ayı 3. satırda; sarkan rozeti orada tekrar etmez
  const title = `${l.time} ${label}${inst ? ' — ' + inst : ''} (${cnt})${__pk198 ? ' · ' + __pk198.long : ''}`;""")
rep("""    ${line2}
  </div>`;
}
function renderGcalRange(startDate, nDays) {""",
"""    ${line2}${line3}
  </div>`;
}
function renderGcalRange(startDate, nDays) {""")

# ---------- (A) telefon/tablet gündem kartı ----------
rep("""    <div class="pcal-c2">${l.time}${bit ? '–' + bit : ''} · ${dolu}/${l.size || state.settings.reformers}${hoca ? ' · ' + escapeHtml(hoca) : ''} · ${(LESSON_STATUS[st]||{}).label || ''}</div>
  </div>`;
}""",
"""    <div class="pcal-c2">${l.time}${bit ? '–' + bit : ''} · ${dolu}/${l.size || state.settings.reformers}${hoca ? ' · ' + escapeHtml(hoca) : ''} · ${(LESSON_STATUS[st]||{}).label || ''}</div>
    ${(function(){ const i = (typeof __lessonPkgInfo198 === 'function') ? __lessonPkgInfo198(l) : null; return i ? '<div class="pcal-c3">📦 ' + escapeHtml(i.long) + '</div>' : ''; })()}
  </div>`;
}""")

# ---------- (A) ay görünümü çipi: ipucu ----------
rep("""      return `<div class="gm-chip gst-${st}" onclick="event.stopPropagation();openLessonModal('${l.id}')" title="${l.time} ${escapeHtml(label)}"><span class="gmc-time">${l.time}</span> ${escapeHtml(label)}${__star170}</div>`;""",
"""      const __pkT198 = (typeof __lessonPkgInfo198 === 'function') ? __lessonPkgInfo198(l) : null; // v198: ipucu
      return `<div class="gm-chip gst-${st}" onclick="event.stopPropagation();openLessonModal('${l.id}')" title="${l.time} ${escapeHtml(label)}${__pkT198 ? ' · ' + escapeHtml(__pkT198.short) : ''}"><span class="gmc-time">${l.time}</span> ${escapeHtml(label)}${__star170}</div>`;""")

# ---------- (B) tazeleme yarışı ----------
rep("""    if (!__resyncOk) { __trace('RESYNC('+reason+'): eksik çekim → ATLA (yerel korundu)'); try { setCloudDot && setCloudDot('offline'); if (typeof plToast === 'function') plToast('⚠️ Buluttan eksik çekim — veriler korundu, tekrar denenecek', 6000); } catch(e) {} return; }
    __trace('RESYNC('+reason+'): TAM TAZELE (sunucudan tüm veri)');""",
"""    if (!__resyncOk) { __trace('RESYNC('+reason+'): eksik çekim → ATLA (yerel korundu)'); try { setCloudDot && setCloudDot('offline'); if (typeof plToast === 'function') plToast('⚠️ Buluttan eksik çekim — veriler korundu, tekrar denenecek', 6000); } catch(e) {} return; }
    // v198 YARIŞ KORUMASI (18.10 canlı gözlem): kilitler çekimden ÖNCE bakılıyordu; 1–2 sn süren çekim sırasında yapılan yerel kayıt,
    // süren ya da yeni biten gönderim varsa bayat bulut hâli state'i EZMEZ — tazeleme 'after-push' ile ertelenir (yerel buluta gider, sonra hizalanır).
    if ((typeof isDirty === 'function' && isDirty()) || __sbPushInFlight || (__sbLastPushAt && (Date.now() - __sbLastPushAt) < 6000)) {
      __trace('RESYNC('+reason+'): çekim sırasında yerel değişiklik/gönderim → üzerine yazma YOK, tazeleme ertelendi');
      clearTimeout(sbResync._afterPush); sbResync._afterPush = setTimeout(function(){ try { sbResync('after-push'); } catch(e){} }, (window.__sbAfterPushMs || 7000));
      return;
    }
    __trace('RESYNC('+reason+'): TAM TAZELE (sunucudan tüm veri)');""")

# ---------- (C) hoca düzenleme alan kaybı ----------
rep("""  const data = { id: id||uid(), name, phone, note: document.getElementById('mi-note').value.trim(), shareRate };
  { const __pe = document.getElementById('mi-partner'); if (__pe && __pe.checked) data.partner = true; } // v196 ADIM 2
  if (id) { const i = state.instructors.findIndex(x=>x.id===id); state.instructors[i] = data; }""",
"""  const __prev198 = id ? (state.instructors.find(x=>x.id===id) || null) : null; // v198: mevcut kayıt KORUNUR (sgkTam vb. silinmez)
  const data = Object.assign({}, __prev198 || {}, { id: id||uid(), name, phone, note: document.getElementById('mi-note').value.trim(), shareRate });
  { const __pe = document.getElementById('mi-partner'); if (__pe && __pe.checked) data.partner = true; else delete data.partner; } // v196 ADIM 2 · v198: kutu kalkınca alan da kalkar
  if (id) { const i = state.instructors.findIndex(x=>x.id===id); if (i >= 0) state.instructors[i] = data; else state.instructors.push(data); }""")

# ---------- sürüm ----------
rep('<meta name="app-version" content="2026.10.18.120">', '<meta name="app-version" content="2026.10.18.121">')
rep("const APP_VERSION = '2026.10.18.120';", "const APP_VERSION = '2026.10.18.121';")
io.open(P, 'w', encoding='utf-8').write(s)
print('OK v198: %d -> %d (+%d)' % (n0, len(s), len(s) - n0))

SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v197-2026-10-18-120';"
assert w.count(old) == 1, 'sw.js CACHE_NAME anchor'
w = w.replace(old, "const CACHE_NAME = 'pilateria-v198-2026-10-18-121';")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
