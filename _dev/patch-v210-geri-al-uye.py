# -*- coding: utf-8 -*-
# v210 — GERİ AL: ÜYE EKLE / SİL (Kerem 20.10): "Geri al yaptım ama geri aldığım güncelleme olduğu gibi duruyor uygulamada" —
# "Üye ekledim sonra geri al dedim üye olduğu yerde kaldı, üye sildim geri al dedim üye silinmiş kaldı".
# KÖK NEDENLER (undo-member-sync-test yamasız build'de 24 FAIL ile birebir canlandırır):
#  R1 saveMember (yeni üye / düzenle) ve addMemberToMonth (aya ekle) Geri Al yedeği almıyordu → düğme ESKİ bir işlemi
#     gösteriyordu; basınca o eski işlemden beri yapılan başka değişiklikler de geri sarılıyor, eklenen üye ise kalıyordu.
#  R2 Bölünmüş kayıt (üye = members + member_finance; grup; hoca): Geri Al'da tek yarının (ör. başka cihazın değiştirdiği fiyat)
#     korunması ÜYENİN TAMAMINI şimdiki haliyle geri yazıyordu → pasife alınan üye pasif kalıyordu. Realtime'da da gelen yarı,
#     diğer yarıyı BAYAT gölgeden alıyordu → yoldaki (gönderilmekte olan) yerel fiyat değişikliği bulutta kaybolabiliyordu.
#  R3 Kendi gönderimimizin yankısı: sunucu jsonb'nin anahtar SIRASINI değiştirdiği için metin eşitliği tutmuyor, yankı "uzaktan
#     değişiklik" sanılıp yeniden uygulanıyordu → Geri Al bunu "başka cihazdan geldi" diye KORUYOR (yeni üye kalıyordu) ve erken
#     gelen yankı daha yeni yerel düzenlemeyi geri sarabiliyordu. Ayrıca realtime kaydı uygulanırken kaydedilmemiş BAŞKA yerel
#     değişiklikler de "başka cihaz" damgası alıyordu.
# ÇÖZÜM:
#  (1) saveMember: 'Yeni üye: AD' / 'Üye düzenle: AD' yedeği; addMemberToMonth: 'Aya ekle: AD — AY' yedeği.
#  (2) sbApplyOne: gelen yarı kaynaktan, DİĞER yarı YEREL kayıttan (yerel kayıt yoksa eskisi gibi kaynaktan/gölgeden).
#      Geri Al'ın korunan kaydı bu yolla YARI-YARI uygulanır.
#  (3) Realtime: içerik (anahtar sırasından bağımsız) gölgeyle ya da o an gönderilmekte olanla aynıysa → kendi yankımız, uygulanmaz.
#      Kendi silme yankımız (bu cihazın sildiği kayıt) uygulanmaz → Geri Al'la geri gelen kayıt geç gelen eski silme yankısıyla silinmez.
#  (4) Geri Al izleme: realtime uygulamasında yalnız UYGULANAN kaydın anahtarları "başka cihaz" damgası alır.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:160])
    s = s.replace(old, new)

# ── 0) sürüm
rep('<meta name="app-version" content="2026.10.20.132">', '<meta name="app-version" content="2026.10.21.133">')
rep("const APP_VERSION = '2026.10.20.132';", "const APP_VERSION = '2026.10.21.133';")

# ── 1) R1: yeni üye / düzenle yedeği (ilk state değişikliğinden HEMEN önce; doğrulama dönüşlerinden sonra)
rep("""  if (__ctxM && __prevM) {
    // v176 (F22): varsayilan paket degisiyorsa GECMIS (dersi/odemesi/kaydi olan) aylar eski paketiyle dondurulur —""",
    """  __undoSnapshot((__prevM ? 'Üye düzenle: ' : 'Yeni üye: ') + name); // v210 (Kerem): ekleme/düzenleme de Geri Al ile geri alınır
  if (__ctxM && __prevM) {
    // v176 (F22): varsayilan paket degisiyorsa GECMIS (dersi/odemesi/kaydi olan) aylar eski paketiyle dondurulur —""")
rep("""function addMemberToMonth(memberId, monthISO) {
  setMemberMonthly(memberId, monthISO, { enrolled: true });""",
    """function addMemberToMonth(memberId, monthISO) {
  { const __am210 = state.members.find(x => x.id === memberId); __undoSnapshot('Aya ekle: ' + ((__am210 && __am210.name) || 'Üye') + ' — ' + monthISO); } // v210
  setMemberMonthly(memberId, monthISO, { enrolled: true });""")

# ── 1b) R1: boş slota üye ekleme (gruba ekle) yedeği — taşınmaysa v177 'Taşınma' yedeği zaten alınır; yeni üyede saveMember'ınki
rep("""function __undoSnapshotIfMove177(memberId, keepGroupId, ay) {
  try {
    const m = state.members.find(x => x && x.id === memberId); if (!m || !ay) return;""",
    """function __moveLabel210(memberId, keepGroupId, ay) { // v210: v177 taşınma kararı + Geri Al etiketi ('' = taşınma değil)
  try {
    const m = state.members.find(x => x && x.id === memberId); if (!m || !ay) return '';""")
rep("""    if (!from.length && !soloTrace) return;
    const keepG = keepGroupId ? state.groups.find(x => x && x.id === keepGroupId) : null;
    __undoSnapshot('Taşınma: ' + """,
    """    if (!from.length && !soloTrace) return '';
    const keepG = keepGroupId ? state.groups.find(x => x && x.id === keepGroupId) : null;
    return ('Taşınma: ' + """)
rep("""  } catch(e) {}
}
// v179 (U4): SARKAN PAKET""",
    """  } catch(e) {}
  return '';
}
function __undoSnapshotIfMove177(memberId, keepGroupId, ay) { try { const l = __moveLabel210(memberId, keepGroupId, ay); if (l) __undoSnapshot(l); } catch(e) {} }
// v179 (U4): SARKAN PAKET""")
rep("""function assignMemberToSlot(memberId, groupId, slotIndex) {
  const g = state.groups.find(x=>x.id===groupId);
  if (!g) return;
  const __ctxAy = __groupOpsCtxMonth(); // v34: ekleme, ISLEM YAPILAN SAYFANIN AYINA yapilir
  if (resolveGroupMembersForMonth(g, __ctxAy).includes(memberId) && isMemberEnrolledInMonth(memberId, __ctxAy)) { alert('Bu üye zaten bu grupta.'); return; }""",
    """function assignMemberToSlot(memberId, groupId, slotIndex, __opts210) {
  const g = state.groups.find(x=>x.id===groupId);
  if (!g) return;
  const __ctxAy = __groupOpsCtxMonth(); // v34: ekleme, ISLEM YAPILAN SAYFANIN AYINA yapilir
  if (resolveGroupMembersForMonth(g, __ctxAy).includes(memberId) && isMemberEnrolledInMonth(memberId, __ctxAy)) { alert('Bu üye zaten bu grupta.'); return; }
  if (!(__opts210 && __opts210.noUndo)) { try { if (!__moveLabel210(memberId, groupId, __ctxAy)) { const __m210 = state.members.find(x => x && x.id === memberId); __undoSnapshot('Gruba ekle: ' + ((__m210 && __m210.name) || 'Üye') + ' → «' + (groupDisplayName(g, __ctxAy) || g.name || 'Grup') + '»'); } } catch(e) {} } // v210 (taşınmada v177 'Taşınma' yedeği alınır)""")
rep("""      if (g) { try { assignMemberToSlot(data.id, g.id, __slot.slotIndex); } catch(e) { console.error('assignMemberToSlot', e); } }""",
    """      if (g) { try { assignMemberToSlot(data.id, g.id, __slot.slotIndex, { noUndo: true }); } catch(e) { console.error('assignMemberToSlot', e); } } // v210: 'Yeni üye' yedeği bu adımı da kapsar""")

# ── 1c) İşlemin ARDINDAN sorulan soru (pay kaydı / kalan derse göre ücret / Pasif mi / sarkan pakete girsin mi) o işlemin
#        Geri Al adımına katılır: "üyeyi sil → pay sorusuna cevap → Geri Al" üyeyi geri getirir (eskiden yalnız payı kaldırıyordu).
rep("""    __partialOfferQueue.push({ kind: 'leave', gid: g.id, mid: memberId, ay: ay });""",
    """    __partialOfferQueue.push({ kind: 'leave', gid: g.id, mid: memberId, ay: ay, psnap: __undoFlowSnap210() });""")
rep("""    __partialOfferQueue.push({ kind: 'leaveunit186', gid: g.id, mid: memberId, ay: ay });""",
    """    __partialOfferQueue.push({ kind: 'leaveunit186', gid: g.id, mid: memberId, ay: ay, psnap: __undoFlowSnap210() });""")
rep("""    __partialOfferQueue.push({ kind: 'join', gid: g.id, mid: memberId, ay: ay });""",
    """    __partialOfferQueue.push({ kind: 'join', gid: g.id, mid: memberId, ay: ay, psnap: __undoFlowSnap210() });""")
rep("""    __partialOfferQueue.push({ kind: 'spilljoin195', gid: g.id, mid: mid, ay: ctxAy, S: S });""",
    """    __partialOfferQueue.push({ kind: 'spilljoin195', gid: g.id, mid: mid, ay: ctxAy, S: S, psnap: __undoFlowSnap210() });""")
rep("""        __undoSnapshot(__lblS + ' paketine katıl: ' + m.name);""", """        __undoFollow210(it, __lblS + ' paketine katıl: ' + m.name);""")
rep("""        __undoSnapshot('Pasife al: ' + m.name + ' — ' + it.ay);""", """        __undoFollow210(it, 'Pasife al: ' + m.name + ' — ' + it.ay);""")
rep("""          __undoSnapshot('Pay kaydı: ' + m.name + ' — ' + it.ay);
          setPartialShare(g.id, it.mid, it.ay, taken, undefined, '');""",
    """          __undoFollow210(it, 'Pay kaydı: ' + m.name + ' — ' + it.ay);
          setPartialShare(g.id, it.mid, it.ay, taken, undefined, '');""")
rep("""        __undoSnapshot('Pay kaydı: ' + m.name + ' — ' + it.ay); // yanlis "Evet" → Geri Al yalniz payi kaldirir""",
    """        __undoFollow210(it, 'Pay kaydı: ' + m.name + ' — ' + it.ay); // v210: Geri Al islemin TAMAMINI (ayrilma + pay) geri alir""")
rep("""          __undoSnapshot('Ders hakkı: ' + m.name + ' — ' + it.ay);""", """          __undoFollow210(it, 'Ders hakkı: ' + m.name + ' — ' + it.ay);""")
rep("""        __undoSnapshot('Orantılı ücret: ' + m.name + ' — ' + it.ay);""", """        __undoFollow210(it, 'Orantılı ücret: ' + m.name + ' — ' + it.ay);""")

# ── 2) R3/(4): Geri Al izleme — realtime uygulamasında yalnız uygulanan kaydın anahtarları damgalanır
rep("""      var ext = !!(window.__pilSuppressDirty || (typeof __sbApplying !== 'undefined' && __sbApplying));
      if (ext) {
        var now = Date.now(), n = 0, k;
        for (k in cur) if (__undoPrevRows[k] !== cur[k]) { __undoExt[k] = now; n++; }
        for (k in __undoPrevRows) if (!(k in cur)) { __undoExt[k] = now; n++; }""",
    """      var ext = !!(window.__pilSuppressDirty || (typeof __sbApplying !== 'undefined' && __sbApplying));
      if (ext) {
        var now = Date.now(), n = 0, k, sc = window.__undoScope210 || null; // v210: realtime yalniz UYGULANAN kaydi damgalar (kaydedilmemis yerel degisiklik 'dis' sayilmaz)
        for (k in cur) if (__undoPrevRows[k] !== cur[k] && (!sc || sc[k])) { __undoExt[k] = now; n++; }
        for (k in __undoPrevRows) if (!(k in cur) && (!sc || sc[k])) { __undoExt[k] = now; n++; }""")
rep("""function __undoSnapshot(label) {
  try {
    if (!__undoStack.length) { __undoExt = {}; __undoPrevRows = null; }""",
    """// v210: islemin hemen ardindan (dialog cevabiyla) gelen degisiklik, o islemin Geri Al adimina katilir.
// Soru kuyruga alinirken ust yedek o an (ayni islemde) alinmissa kimligi saklanir; cevap geldiginde yigin ustu hala o yedekse
// yeni yedek ACILMAZ (etiket genisler) — boylece tek Geri Al islemin tamamini geri alir.
function __undoFlowSnap210() { try { var s = __undoStack[__undoStack.length - 1]; return (s && (Date.now() - (+s.ms || 0)) < 3000) ? s.ms : 0; } catch(e) { return 0; } }
function __undoFollow210(it, label) {
  try {
    var s = __undoStack[__undoStack.length - 1];
    if (it && it.psnap && s && s.ms === it.psnap) {
      var L = String(s.label || 'İşlem'), add = String(label || '');
      if (add && L.indexOf(add) === -1 && L.length < 160) s.label = L + ' + ' + add;
      try { __pilBackupSet(__UNDO_LS, JSON.stringify(s)); } catch(e) {}
      renderUndoBtn();
      return;
    }
  } catch(e) {}
  __undoSnapshot(label);
}
// v210: realtime'da uygulanan kaydin Geri Al anahtarlari (bolunmus kayitta iki yarisi)
function __undoScopeFor210(t, id) {
  var P = { members: 'member_finance', member_finance: 'members', groups: 'group_finance', group_finance: 'groups', instructors: 'instructor_finance', instructor_finance: 'instructors' };
  var o = {}; o[t + '/' + id] = 1; if (P[t]) o[P[t] + '/' + id] = 1; return o;
}
function __undoSnapshot(label) {
  try {
    if (!__undoStack.length) { __undoExt = {}; __undoPrevRows = null; }""")

# ── 3) R2: sbApplyOne — diğer yarı YEREL kayıttan
rep("""  if (t === 'members' || t === 'member_finance') {
    state.members = state.members || [];
    const b = S('members'); const nu = b ? sbMergeMember(b, S('member_finance')) : null;
    const prev = state.members.find(x=>String(x.id)===String(id));""",
    """  // v210 BÖLÜNMÜŞ KAYIT (temel + finans yarısı): GELEN yarı kaynaktan (gölge / Geri Al'da korunan hal), DİĞER yarı YEREL
  // kayıttan — gölgedeki diğer yarı bayat olabilir (o yarının gönderimi yolda / Geri Al'da o yarı geri alındı). Yerel kayıt
  // yoksa (uzaktan yeni kayıt) diğer yarı eskisi gibi kaynaktan/gölgeden gelir.
  const __pair210 = (arr, bt, ft, split, merge) => {
    const loc = (arr || []).find(x => String(x && x.id) === String(id));
    const sp = loc ? split(loc) : null;
    const b = (t === bt || !sp) ? S(bt) : sp.base;
    return b ? merge(b, (t === ft || !sp) ? S(ft) : sp.fin) : null;
  };
  if (t === 'members' || t === 'member_finance') {
    state.members = state.members || [];
    const nu = __pair210(state.members, 'members', 'member_finance', sbSplitMember, sbMergeMember);
    const prev = state.members.find(x=>String(x.id)===String(id));""")
rep("""  else if (t === 'groups' || t === 'group_finance') { state.groups = state.groups || []; const b = S('groups'); upsert(state.groups, b ? sbMergeGroup(b, S('group_finance')) : null); }
  else if (t === 'instructors' || t === 'instructor_finance') { state.instructors = state.instructors || []; const b = S('instructors'); upsert(state.instructors, b ? sbMergeInstructor(b, S('instructor_finance')) : null); }""",
    """  else if (t === 'groups' || t === 'group_finance') { state.groups = state.groups || []; upsert(state.groups, __pair210(state.groups, 'groups', 'group_finance', sbSplitGroup, sbMergeGroup)); }
  else if (t === 'instructors' || t === 'instructor_finance') { state.instructors = state.instructors || []; upsert(state.instructors, __pair210(state.instructors, 'instructors', 'instructor_finance', sbSplitInstructor, sbMergeInstructor)); }""")

# ── 4) R3: kendi yankımızı tanı (realtime) — yardımcılar sbApplyOne'un hemen önüne
rep("""function sbApplyOne(t, id, __src) {
  if (!state || id == null) return;""",
    """// v210 KENDİ YANKIMIZ: sunucu jsonb'nin anahtar SIRASINI değiştirir → gölgeyle METİN eşitliği tutmaz. İçerik (sırasız) gölgeyle
// ya da o an GÖNDERİLMEKTE olanla aynıysa olay bizim yazımımızın yankısıdır: yeniden uygulanmaz (daha yeni yerel düzenleme
// geri sarılmaz, Geri Al onu "başka cihaz" sanmaz). Bu cihazın sildiği kaydın silme yankısı da uygulanmaz.
var __sbInflight210 = {};   // tablo → { id → sırasız içerik } (upsert yolda)
var __sbOwnDel210 = {};     // tablo → { id → ms } (bu cihazın sildiği; yankısı bekleniyor)
function __sbCanon210(v) { try { return __undoStable(v); } catch(e) { try { return JSON.stringify(v); } catch(_) { return ''; } } }
function __sbIsOwnEcho210(t, id, meta) {
  try {
    const c = __sbCanon210(meta);
    const inf = __sbInflight210[t] && __sbInflight210[t][id];
    if (inf !== undefined && inf === c) return true;
    const sh = __sbShadow[t] && __sbShadow[t][id];
    if (sh != null && __sbCanon210(JSON.parse(sh)) === c) return true;
  } catch(e) {}
  return false;
}
function __sbIsOwnDelete210(t, id) {
  try {
    const m = __sbOwnDel210[t]; const ts = m && m[id];
    if (!ts) return false;
    delete m[id];
    return (Date.now() - ts) < 120000;
  } catch(e) { return false; }
}
function sbApplyOne(t, id, __src) {
  if (!state || id == null) return;""")
rep("""          if (oldId) { delete __sbShadow[t][oldId]; delete __sbVer[t][oldId]; __applyId = oldId; }""",
    """          if (oldId && __sbIsOwnDelete210(t, oldId)) return; // v210: kendi silme yankımız (gölgeyi gönderim düzenler)
          if (oldId) { delete __sbShadow[t][oldId]; delete __sbVer[t][oldId]; __applyId = oldId; }""")
rep("""          if (__sbShadow[t][row.id] === j) { if (__inV > __knownV) __sbVer[t][row.id] = __inV; return; } // echo/yansıma""",
    """          if (__sbShadow[t][row.id] === j) { if (__inV > __knownV) __sbVer[t][row.id] = __inV; return; } // echo/yansıma
          if (__sbIsOwnEcho210(t, row.id, __meta)) { if (__inV > __knownV) __sbVer[t][row.id] = __inV; return; } // v210: kendi yankımız (anahtar sırası farklı)""")
rep("""        __sbApplying = true; window.__pilSuppressDirty = true;
        try { sbApplyOne(t, __applyId); save(); } catch(e) { console.error('[sb] applyOne', e); }
        window.__pilSuppressDirty = false; __sbApplying = false;""",
    """        __sbApplying = true; window.__pilSuppressDirty = true; window.__undoScope210 = __undoScopeFor210(t, __applyId); // v210
        try { sbApplyOne(t, __applyId); save(); } catch(e) { console.error('[sb] applyOne', e); }
        window.__undoScope210 = null; window.__pilSuppressDirty = false; __sbApplying = false;""")

# ── 5) R3: gönderim — yoldaki içerik ve bu cihazın silmeleri işaretlenir
rep("""    try {
      if (ups.length) { const r = await sbClient.from(t).upsert(ups);""",
    """    const __inf210 = {}; // v210: yoldaki upsert içeriği (kendi yankımızı tanımak için)
    try { __sbInflight210[t] = __sbInflight210[t] || {}; ups.forEach(u => { const c = __sbCanon210(rows[t][u.id]); __inf210[u.id] = c; __sbInflight210[t][u.id] = c; }); if (dels.length) { __sbOwnDel210[t] = __sbOwnDel210[t] || {}; const __nw = Date.now(); dels.forEach(id => { __sbOwnDel210[t][id] = __nw; }); } } catch(e) {}
    try {
      if (ups.length) { const r = await sbClient.from(t).upsert(ups);""")
rep("""      dels.forEach(id => { delete __sbShadow[t][id]; if (__sbVer[t]) delete __sbVer[t][id]; });
    } catch(e) { okAll = false; console.error('[sb] push', t, e); }""",
    """      dels.forEach(id => { delete __sbShadow[t][id]; if (__sbVer[t]) delete __sbVer[t][id]; });
    } catch(e) { okAll = false; console.error('[sb] push', t, e); }
    finally { try { for (const __id in __inf210) { if (__sbInflight210[t] && __sbInflight210[t][__id] === __inf210[__id]) delete __sbInflight210[t][__id]; } } catch(e) {} } // v210""")
# yeni kanal: önceki kanaldan beklenen silme yankıları artık gelmez — bekleyen işaretler düşer (gerçek uzaktan silme atlanmasın)
rep("""    __sbChannel = sbClient.channel('pilateria-rt');""",
    """    __sbOwnDel210 = {}; // v210
    __sbChannel = sbClient.channel('pilateria-rt');""")

io.open(P, 'w', encoding='utf-8').write(s)

W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v209-2026-10-20-132';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v209-2026-10-20-132';", "const CACHE_NAME = 'pilateria-v210-2026-10-21-133';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v210 OK')
