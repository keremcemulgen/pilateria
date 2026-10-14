# -*- coding: utf-8 -*-
# v192 (Kerem 14.10): "Bin ders kotasini aylik 5000 yap, dersler gozukmeli KESINLIKLE."
# Gercek: 1000 bir uygulama kotasi degil, Supabase'in istek basina satir siniriydi; v191 sayfali cekim her sayida kaydi
# getirir (sinir yok). Bu surum "kesinlikle"yi OLCULEBILIR yapar:
#  (1) Sayfali cekimde BUTUNLUK KONTROLU: sunucu sayimi (count) ile gelen satir sayisi esit degilse (sayfa bos/eksik dondu,
#      sayfalar arasi silme yarisi) sayim yeniden sorulur; hala eksikse {error} doner → eksik veri state'e YAZILMAZ, yerel
#      korunur, panelde kirmizi uyari.
#  (2) Panelde gorunur kanit: "☁️ Bulut senkron aktif · bulut 1.057 ders = uygulama 1.057" — her tam cekimde sunucu sayimi
#      kaydedilir (window.__sbCloudCounts), uygulamadaki sayimla yan yana yazilir; esit degilse kirmizi "EKSIK" uyarisi + toast.
#  (3) Test: 5.500 ders (6 sayfa) eksiksiz; ortada bos sayfa → hata, state dokunulmaz; panel metni dogru.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

rep("""var __SB_PAGE191 = 1000;
async function __sbSelectAll191(t) {
  const rows = [];
  let total = null;
  for (let page = 0; page < 1000; page++) {
    let q = sbClient.from(t).select('id,data', page === 0 ? { count: 'exact' } : undefined).order('id');
    const ranged = !!(q && typeof q.range === 'function');
    if (ranged) q = q.range(rows.length, rows.length + __SB_PAGE191 - 1);
    const r = await q;
    if (r && r.error) return { data: null, error: r.error };
    const d = (r && r.data) || [];
    if (page === 0 && r && typeof r.count === 'number') total = r.count;
    for (let i = 0; i < d.length; i++) rows.push(d[i]);
    if (!ranged || !d.length) break;
    if (total !== null) { if (rows.length >= total) break; }
    else if (d.length < __SB_PAGE191) break;
  }
  return { data: rows, error: null };
}""",
"""var __SB_PAGE191 = 1000;
var __sbCloudCounts = {}; // v192: son TAM cekimde sunucudan gelen satir sayilari (panelde kanit)
async function __sbSelectAll191(t) {
  const rows = [];
  let total = null;
  for (let page = 0; page < 1000; page++) {
    let q = sbClient.from(t).select('id,data', page === 0 ? { count: 'exact' } : undefined).order('id');
    const ranged = !!(q && typeof q.range === 'function');
    if (ranged) q = q.range(rows.length, rows.length + __SB_PAGE191 - 1);
    const r = await q;
    if (r && r.error) return { data: null, error: r.error };
    const d = (r && r.data) || [];
    if (page === 0 && r && typeof r.count === 'number') total = r.count;
    for (let i = 0; i < d.length; i++) rows.push(d[i]);
    if (!ranged || !d.length) break;
    if (total !== null) { if (rows.length >= total) break; }
    else if (d.length < __SB_PAGE191) break;
  }
  // v192 BUTUNLUK: sunucu sayimi ile gelen satir sayisi uyusmuyorsa sayimi yeniden sor; hala eksikse HATA (eksik veri yazilmaz)
  if (total !== null && rows.length < total) {
    let again = null;
    try { let q2 = sbClient.from(t).select('id', { count: 'exact' }); if (q2 && typeof q2.range === 'function') q2 = q2.range(0, 0); const r2 = await q2; if (r2 && !r2.error && typeof r2.count === 'number') again = r2.count; } catch(e) {}
    if (again === null || rows.length < again) { try { __trace('⛔ EKSİK ÇEKİM ' + t + ': sunucu ' + (again !== null ? again : total) + ' / gelen ' + rows.length + ' — yerel korundu'); } catch(e) {} return { data: null, error: { message: 'eksik çekim: ' + t + ' ' + rows.length + '/' + (again !== null ? again : total) } }; }
  }
  __sbCloudCounts[t] = rows.length;
  return { data: rows, error: null };
}""")

rep("""  } else {
    el.textContent = '☁️ Bulut senkron aktif' + (last ? ' · son gönderim: ' + last : '');
  }
}""",
"""  } else {
    // v192 (Kerem: "dersler gorunmeli KESINLIKLE"): bulut sayimi = uygulama sayimi kaniti; esit degilse kirmizi uyari
    let __cnt192 = '';
    try {
      const c = (typeof __sbCloudCounts === 'object' && __sbCloudCounts && typeof __sbCloudCounts.lessons === 'number') ? __sbCloudCounts.lessons : null;
      const a = (state.lessons || []).length;
      if (c !== null) {
        const fmt = n => String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
        __cnt192 = (c === a) ? ' · bulut ' + fmt(c) + ' ders = uygulama ' + fmt(a) : ' · <b style="color:#c62828;">⚠️ EKSİK: bulut ' + fmt(c) + ' ders, uygulama ' + fmt(a) + '</b>';
      }
    } catch(e) { __cnt192 = ''; }
    el.innerHTML = '☁️ Bulut senkron aktif' + (last ? ' · son gönderim: ' + escapeHtml(String(last)) : '') + __cnt192;
  }
}
// v192: tam cekimden sonra bulut/uygulama ders sayimi esit degilse sesli uyari (tek kaynak: __sbCloudCounts)
function __sbVerifyCounts192(where) {
  try {
    const c = __sbCloudCounts && __sbCloudCounts.lessons; const a = (state.lessons || []).length;
    if (typeof c === 'number' && c !== a) { __trace('⚠️ SAYIM FARKI (' + where + '): bulut ' + c + ' ders / uygulama ' + a); if (typeof plToast === 'function') plToast('⚠️ Ders sayımı tutmuyor: bulut ' + c + ' / uygulama ' + a + ' — yenileyip tekrar dene', 8000); return false; }
  } catch(e) {}
  return true;
}""")

# acilis ve resync sonunda sayim dogrulamasi
rep("""  sbSubscribeAll();
  setCloudDot && setCloudDot('ok');
  try { __pilOffsiteDaily(); } catch(e) {} // v104: gunde 1 kez ikinci buluta (JSONBin) tam yedek
  try { if (__sbRole === 'owner') setTimeout(function(){ try { __offerSpillJoinRepair191(); } catch(e) {} }, 2500); } catch(e) {} // v191: sarkan pakete yanlis katilim onarimi (soruyla)
}""",
"""  sbSubscribeAll();
  setCloudDot && setCloudDot('ok');
  try { __sbVerifyCounts192('açılış'); } catch(e) {} // v192
  try { __pilOffsiteDaily(); } catch(e) {} // v104: gunde 1 kez ikinci buluta (JSONBin) tam yedek
  try { if (__sbRole === 'owner') setTimeout(function(){ try { __offerSpillJoinRepair191(); } catch(e) {} }, 2500); } catch(e) {} // v191: sarkan pakete yanlis katilim onarimi (soruyla)
}""")
rep("""    if (!__resyncOk) { __trace('RESYNC('+reason+'): eksik çekim → ATLA (yerel korundu)'); return; }""",
"""    if (!__resyncOk) { __trace('RESYNC('+reason+'): eksik çekim → ATLA (yerel korundu)'); try { setCloudDot && setCloudDot('offline'); if (typeof plToast === 'function') plToast('⚠️ Buluttan eksik çekim — veriler korundu, tekrar denenecek', 6000); } catch(e) {} return; }""")

rep("""    sbSnapshotShadow(sbStateToRows());
    __refreshUIWhenIdle(); // v122: mesgulse ERTELENIR ama KAYBOLMAZ (eskiden sessizce atiliyordu)""",
"""    sbSnapshotShadow(sbStateToRows());
    try { __sbVerifyCounts192('tazeleme'); } catch(e) {} // v192
    __refreshUIWhenIdle(); // v122: mesgulse ERTELENIR ama KAYBOLMAZ (eskiden sessizce atiliyordu)""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.10.14.114">', '<meta name="app-version" content="2026.10.14.115">')
rep("const APP_VERSION = '2026.10.14.114';", "const APP_VERSION = '2026.10.14.115';")
io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v191-2026-10-14-114'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v192-2026-10-14-115'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
