# -*- coding: utf-8 -*-
# v131 — BAKIM TURU: guvenlik bakiyesi + v122/v123 kusurlari + olu kod
#  O-2: eski tuzsuz SHA-256 PIN, dogru girildigi ANDA PBKDF2'ye yukseltilir (eski hash birakilmaz)
#  O-3: id temizligi — bozuk id TUM referanslariyla ayni eslemeyle temizlenir (58 onclick noktasi)
#  O-4: cerceve kirici (frame-ancestors meta CSP'de gecersiz) — pilateria + recover + kurtar + index
#  O-6: __proto__/constructor/prototype id'leri ALIM noktalarinda reddedilir (prototype pollution)
#  O-7: sw.js yalniz res.ok yanitlari cache'ler + recover/kurtar ASSETS'e girer
#  v123 yan etkisi: TAKSIT odemesi "indirim" olarak kaydediliyordu (rapor Toplam Indirim sisiyordu)
#  v122 notu: markGroupPackageExtended uye-ay ikizi (uyelerin o ayki fiyati da 0'lanir, geri alinabilir)
#  olu kod: sbPickWinner kaldirildi
#  BILINCLI ERTELENEN: K-4 istemci yarisi (staff cihazinda alan kirpmak push'ta veri ezer — sunucu isi),
#  autoPullIfNeeded (JSONBIN kapilari arkasinda olu; silmek risk/getiri dengesine degmez)
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- O-4: cerceve kirici ----------
rep('<meta name="app-version" content="2026.07.30.53">',
"""<meta name="app-version" content="2026.07.30.53">
<script>/* v131 O-4: cerceve kirici — frame-ancestors meta CSP'de gecersizdir, clickjacking'e karsi */ if (window.top !== window.self) { try { window.top.location.replace(window.location.href); } catch (e) { document.documentElement.style.display = 'none'; } }</script>""")

# ---------- O-3: id temizligi ----------
rep("""function sanitizeStateText(st) {
""",
"""// v131 O-3: ID TEMIZLIGI — id'leri normalde uid() uretir (guvenli); ama id bulut/ice-aktarma/kurtarma
// yoluyla da gelebilir ve onclick="fn('${id}')" kalibinin 58 ornegi var. Bozuk id, TUM referanslariyla
// birlikte AYNI eslemeyle temizlenir — iliskiler (ders-uye, odeme-uye, grup-uye...) kopmaz.
function __pilIdOk(v) {
  return typeof v === 'string' && v.length > 0 && v.length <= 64 && /^[A-Za-z0-9_.:-]+$/.test(v) && v !== '__proto__' && v !== 'constructor' && v !== 'prototype';
}
function __pilCleanId(v) {
  const sv = String(v == null ? '' : v);
  let c = sv.replace(/[^A-Za-z0-9_.:-]/g, '_').slice(0, 56);
  let h = 0;
  for (let i = 0; i < sv.length; i++) h = ((h * 31) + sv.charCodeAt(i)) >>> 0;
  return (c || 'id') + '_' + h.toString(36);
}
function __pilSanitizeIds(st) {
  try {
    const map = {};
    const colls = ['members','groups','lessons','payments','instructors','packageTypes','campaigns','waTemplates','expenses','instructorPayouts'];
    colls.forEach(function(k) {
      (Array.isArray(st[k]) ? st[k] : []).forEach(function(r) {
        if (r && r.id != null && !__pilIdOk(String(r.id))) map[String(r.id)] = __pilCleanId(r.id);
      });
    });
    if (!Object.keys(map).length) return;
    const fix = function(v) { return (v != null && map[String(v)] !== undefined) ? map[String(v)] : v; };
    const fixArr = function(a) { return Array.isArray(a) ? a.map(fix) : a; };
    colls.forEach(function(k) {
      (Array.isArray(st[k]) ? st[k] : []).forEach(function(r) {
        if (!r) return;
        r.id = fix(r.id);
        if ('groupId' in r) r.groupId = fix(r.groupId);
        if ('memberId' in r) r.memberId = fix(r.memberId);
        if ('instructorId' in r) r.instructorId = fix(r.instructorId);
        if ('campaignId' in r) r.campaignId = fix(r.campaignId);
        if ('defaultPackageId' in r) r.defaultPackageId = fix(r.defaultPackageId);
        if ('defaultInstructorId' in r) r.defaultInstructorId = fix(r.defaultInstructorId);
        if (Array.isArray(r.memberIds)) r.memberIds = fixArr(r.memberIds);
        if (r.monthly && typeof r.monthly === 'object') { for (const ay in r.monthly) { const mm = r.monthly[ay]; if (mm && mm.packageId != null) mm.packageId = fix(mm.packageId); } }
        if (r.monthlyMembers && typeof r.monthlyMembers === 'object') { for (const ay in r.monthlyMembers) r.monthlyMembers[ay] = fixArr(r.monthlyMembers[ay]); }
      });
    });
    try { if (typeof __trace === 'function') __trace('🧹 v131: ' + Object.keys(map).length + ' bozuk id referanslariyla temizlendi'); } catch(e) {}
  } catch(e) {}
}
function sanitizeStateText(st) {
  __pilSanitizeIds(st); // v131 O-3
""")

# ---------- O-6: prototype pollution kapilari ----------
rep("""function sbPickWinner(a, b) { return (((b && b._v) || 0) >= ((a && a._v) || 0)) ? b : a; }
""",
"""// v131: sbPickWinner OLU KODDU (hic cagrilmiyordu) — kaldirildi.
// v131 O-6: __proto__/constructor/prototype anahtarlari nesne haritalarina yazilamaz (prototype pollution)
function __sbBadKey(k) { return k === '__proto__' || k === 'constructor' || k === 'prototype'; }
""")

rep("""      try { const r = await sbClient.from(t).select('id,data').order('id'); if (r && r.error) __resyncOk = false; (r.data || []).forEach(row => { all[t][row.id] = row.data; }); }
""",
"""      try { const r = await sbClient.from(t).select('id,data').order('id'); if (r && r.error) __resyncOk = false; (r.data || []).forEach(row => { if (!row || __sbBadKey(String(row.id))) return; all[t][row.id] = row.data; }); }
""")

rep("""      (r.data || []).forEach(row => { all[t][row.id] = row.data; });
""",
"""      (r.data || []).forEach(row => { if (!row || __sbBadKey(String(row.id))) return; all[t][row.id] = row.data; });
""")

rep("""        const row = payload.new && payload.new.id ? payload.new : null;
        const oldId = payload.old && payload.old.id;
""",
"""        const row = payload.new && payload.new.id ? payload.new : null;
        const oldId = payload.old && payload.old.id;
        if ((row && __sbBadKey(String(row.id))) || (oldId && __sbBadKey(String(oldId)))) return; // v131 O-6
""")

# ---------- O-2: eski PIN'i dogru giriste PBKDF2'ye yukselt ----------
rep("""  // Eski format: duz SHA-256
  const h = await pinHash(pin);
  return h === stored;
}
""",
"""  // Eski format: duz SHA-256 — v131 O-2: dogru girildigi ANDA tuzlu PBKDF2'ye YUKSELTILIR (eski hash birakilmaz)
  const h = await pinHash(pin);
  if (h !== stored) return false;
  try {
    const up = await pinHashV2(pin);
    if (typeof up === 'string' && up.startsWith('pbkdf2$')) {
      try { localStorage.setItem(PIN_HASH_KEY, up); } catch(e) {}
      if (typeof state !== 'undefined' && state && state._pinHash === stored) { state._pinHash = up; try { save(); } catch(e) {} }
    }
  } catch(e) {}
  return true;
}
""")

# ---------- v123 yan etkisi: taksit "indirim" DEGILDIR ----------
rep("""  if (isRefund) { data.refund = true; data.listPrice = 0; data.discount = 0; data.sessions = 0; } // v127
""",
"""  if (isRefund) { data.refund = true; data.listPrice = 0; data.discount = 0; data.sessions = 0; } // v127
  // v131: TAKSIT INDIRIM DEGILDIR — v110 kanonu geregi tanimli fiyat varken dusuk tutar taksittir;
  // v123 kalan-on-dolumuyla buildPaymentRecord'un (liste−tutar) farki sahte "indirim" uretiyordu (rapor sisiyordu).
  if (!isRefund && !data.campaignId) {
    const __capDsc = paymentCapCheck(memberId, groupId, data.packageMonth, 0, id || '');
    if (__capDsc.defined > 0) data.discount = 0;
  }
""")

rep("""    rec.packageMonth = packageMonth;
    state.payments.push(rec);
""",
"""    rec.packageMonth = packageMonth;
    if (!campaignId) { const __cDsc = paymentCapCheck(mid, groupId, packageMonth, 0, ''); if (__cDsc.defined > 0) rec.discount = 0; } // v131: taksit indirim degildir
    state.payments.push(rec);
""")

# ---------- v122 notu: markGroupPackageExtended uye-ay ikizi ----------
# NOT: ayni satirlar markMemberPackageExtended'da da var (orada ikiz ZATEN kurulu — setMemberMonthly cagrisi
# mevcut). Bu yuzden degisiklik GRUP fonksiyonunun segmentiyle SINIRLANIR.
_seg_a = 'async function markGroupPackageExtended'
_seg_b = 'async function markMemberPackageExtended'
_i0 = s.index(_seg_a); _i1 = s.index(_seg_b)
assert 0 < _i0 < _i1, 'segment sinirlari!'
seg = s[_i0:_i1]

def seg_rep(old, new):
    global seg
    c = seg.count(old)
    assert c == 1, 'SEGMENT ANCHOR %dx: %r' % (c, old[:80])
    seg = seg.replace(old, new)

seg_rep("""    pkg.status = 'extended';
    pkg.price = 0;
    pkg.extendedNote = note;
""",
"""    pkg.status = 'extended';
    pkg.price = 0;
    pkg.extendedNote = note;
    // v131 (v122 notu): UYE-AY IKIZI — uyelerin o ayki fiyat override'i da 0'lanir (markMemberPackageExtended
    // bunu zaten yapiyordu, grup surumu yapmiyordu); yoksa "paket uzadi (0 TL)" derken uyeden hala para istenir.
    // __extZero bayragi geri almayi guvenli kilar: yalniz bizim koydugumuz 0'lar silinir.
    try { resolveGroupMembersForMonth(g, monthISO).forEach(function(mid){ if (!mid) return; const mm = state.members.find(function(x){return x.id===mid;}); const cur = mm && mm.monthly && mm.monthly[monthISO]; if (cur && cur.totalPrice !== undefined && cur.totalPrice !== null && cur.totalPrice !== '' && !cur.__extZero) return; setMemberMonthly(mid, monthISO, { totalPrice: 0, __extZero: true }); }); } catch(e) {}
""")

seg_rep("""    const newPrice = await plPrompt('Yeni paket fiyatı (₺):', g.customTotalPrice || 0, { type: 'number' });
    if (newPrice === null) return;
    pkg.price = +newPrice || 0;
""",
"""    const newPrice = await plPrompt('Yeni paket fiyatı (₺):', g.customTotalPrice || 0, { type: 'number' });
    if (newPrice === null) return;
    pkg.price = +newPrice || 0;
    // v131: ikizin geri alinisi — yalniz __extZero isaretli 0-override'lar silinir (elle girilmis fiyatlara dokunulmaz)
    try { resolveGroupMembersForMonth(g, monthISO).forEach(function(mid){ const mm = state.members.find(function(x){return x.id===mid;}); const cur = mm && mm.monthly && mm.monthly[monthISO]; if (cur && cur.__extZero) { delete cur.totalPrice; delete cur.__extZero; } }); } catch(e) {}
""")

s = s[:_i0] + seg + s[_i1:]

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.07.30.53">', '<meta name="app-version" content="2026.07.30.54">')
rep("const APP_VERSION = '2026.07.30.53';", "const APP_VERSION = '2026.07.30.54';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

# ---------- sw.js (O-7) ----------
Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
t0 = len(t)
old = "const CACHE_NAME = 'pilateria-v130-2026-07-30-53';"
assert t.count(old) == 1, 'sw.js surum anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v131-2026-07-30-54';")
old = "  './pilateria.html',\n"
assert t.count(old) == 1, 'sw.js assets anchor!'
t = t.replace(old, "  './pilateria.html',\n  './recover.html',\n  './kurtar.html',\n")
old = """      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })"""
assert t.count(old) == 1, 'sw.js fetch anchor!'
t = t.replace(old, """      .then(res => {
        if (res && res.ok) { // v131 O-7: hata yanitlari (404/500) cache'e girmez — bozuk sayfa kalicilasamaz
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })""")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK (%+d bayt)' % (len(t) - t0))

# ---------- recover.html + kurtar.html + index.html (O-4) ----------
FB = """<script>/* v131 O-4: cerceve kirici */ if (window.top !== window.self) { try { window.top.location.replace(window.location.href); } catch (e) { document.documentElement.style.display = 'none'; } }</script>"""
for F in ('recover.html', 'kurtar.html', 'index.html'):
    r = io.open(F, encoding='utf-8').read()
    assert 'window.top !== window.self' not in r, F + ' zaten var!'
    old = '<head>'
    assert r.count(old) == 1, F + ' head anchor!'
    r = r.replace(old, '<head>\n' + FB)
    io.open(F, 'w', encoding='utf-8').write(r)
    print(F + ' OK (+%d bayt)' % len(FB))
