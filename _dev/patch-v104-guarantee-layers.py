#!/usr/bin/env python3
# v104 (Kerem: "bir daha HICBIR sebepten veri kaybi olmasin — en garanti cozumu uygula"):
# 1) PUSH SILME SIGORTASI: sbDiffPush tek seferde coklu silme (bozuk/bosalmis state) gonderemez.
#    Sigorta atarsa: ani yedek (pilateria_mass_delete_backup) + silmeler ENGELLENIR + 5sn'de sunucudan tazele.
#    Kacis kapisi: window.__pilAllowMassDelete = Date.now() (5 dk gecerli; ileride bilincli toplu silme icin).
# 2) REALTIME SILME SIGORTASI: 10 sn icinde >12 DELETE olayi = baska cihaz bulutu bosaltiyor.
#    Sigorta atinca: ani yedek + sonraki TUM silmeler bu cihaza UYGULANMAZ (veri korunur) + uyari.
# 3) CIHAZ GUNLUK YEDEK HALKASI: gunun ilk acilisinda localStorage 'pilateria_daily_YYYY-MM-DD' (son 5 gun, kota korumali).
# 4) IKINCI BULUT: sbLoadAll basarili + owner + gunde 1 kez → tam state JSONBin'e PUT (Supabase'ten BAGIMSIZ saglayici).
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---- 1a) PUSH SIGORTASI: on-analiz (sbDiffPush basina) ----
rep(
    "  const rows = sbStateToRows();\n"
    "  let okAll = true; const __pushedSummary = []; const __pushErrors = [];\n",
    "  const rows = sbStateToRows();\n"
    "  let okAll = true; const __pushedSummary = []; const __pushErrors = [];\n"
    "  // v104 SILME SIGORTASI (push): tek seferde cok kayit silme girisimi = bozuk/bosalmis state suphesi.\n"
    "  // Engelle + ani yedek + 5sn sonra sunucudan tazele (yerel iyilesir). Kacis: window.__pilAllowMassDelete (5 dk).\n"
    "  let __delTotal = 0, __shadowTotal = 0; const __wipeTables = [];\n"
    "  for (const t of SB_TABLES) {\n"
    "    const __sh = __sbShadow[t] || {}; let __shN = 0, __dN = 0;\n"
    "    for (const id in __sh) { __shN++; if (!(id in rows[t])) __dN++; }\n"
    "    __shadowTotal += __shN; __delTotal += __dN;\n"
    "    if (__shN > 10 && __dN === __shN) __wipeTables.push(t);\n"
    "  }\n"
    "  const __resetOk = window.__pilAllowMassDelete && (Date.now() - window.__pilAllowMassDelete) < 300000;\n"
    "  const __massDelete = !__resetOk && ((__delTotal > 15 && __delTotal > __shadowTotal * 0.3) || __wipeTables.length > 0);\n"
    "  if (__massDelete) {\n"
    "    try { const __cur = localStorage.getItem('pilateria'); if (__cur) localStorage.setItem('pilateria_mass_delete_backup', JSON.stringify({ at: new Date().toISOString(), state: __cur })); } catch(e) {}\n"
    "    __trace('⛔ SİLME SİGORTASI (push): ' + __delTotal + ' kayıt silme girişimi ENGELLENDİ' + (__wipeTables.length ? ' (tablo boşaltma: ' + __wipeTables.join(',') + ')' : '') + ' — bulut KORUNDU, yerel sunucudan tazelenecek');\n"
    "    try { if (window.plToast) plToast('⛔ Toplu silme engellendi — bulut verileri KORUNDU'); } catch(e) {}\n"
    "  }\n",
    1, "push-fuse-preanalysis")

# ---- 1b) PUSH SIGORTASI: silme listesini engelle ----
rep(
    "    for (const id in (__sbShadow[t] || {})) if (!(id in rows[t])) dels.push(id);\n",
    "    if (!__massDelete) { for (const id in (__sbShadow[t] || {})) if (!(id in rows[t])) dels.push(id); } // v104: sigorta attiysa SILME gonderme\n",
    1, "push-fuse-block-dels")

# ---- 1c) PUSH SIGORTASI: iyilesme (sunucudan tazele) ----
rep(
    "  if (__pushedSummary.length) __trace((okAll?",
    "  if (__massDelete) { try { localStorage.removeItem(DIRTY_KEY); } catch(e) {} clearTimeout(sbDiffPush._healT); sbDiffPush._healT = setTimeout(function() { try { sbResync('mass-delete-guard'); } catch(e) {} }, 5000); } // v104: yerel bozulmus olabilir -> buluttan iyiles\n"
    "  if (__pushedSummary.length) __trace((okAll?",
    1, "push-fuse-heal")

# ---- 2) REALTIME SILME SIGORTASI ----
rep(
    "        if (payload.eventType === 'DELETE') {\n"
    "          if (oldId) { delete __sbShadow[t][oldId]; delete __sbVer[t][oldId]; __applyId = oldId; }\n"
    "        } else if (row) {",
    "        if (payload.eventType === 'DELETE') {\n"
    "          // v104 REALTIME SILME SIGORTASI: 10sn'de >12 DELETE = baska cihaz bulutu bosaltiyor olabilir.\n"
    "          // Sigorta atinca: ani yedek + sonraki TUM silmeler bu cihaza UYGULANMAZ (veri korunur).\n"
    "          if (window.__rtDelTripped) return;\n"
    "          const __dnow = Date.now();\n"
    "          window.__rtDelWin = (window.__rtDelWin || []).filter(function(ts) { return __dnow - ts < 10000; });\n"
    "          window.__rtDelWin.push(__dnow);\n"
    "          if (window.__rtDelWin.length > 12) {\n"
    "            window.__rtDelTripped = true;\n"
    "            try { const __cur = localStorage.getItem('pilateria'); if (__cur) localStorage.setItem('pilateria_mass_delete_backup', JSON.stringify({ at: new Date().toISOString(), state: __cur })); } catch(e) {}\n"
    "            __trace('⛔ REALTIME SİLME SİGORTASI ATTI: buluttan toplu silme algılandı — bu cihazdaki veriler KORUNDU (recover.html ile geri yüklenebilir)');\n"
    "            try { if (window.plToast) plToast('⛔ Toplu silme algılandı — bu cihazdaki veriler KORUNDU!'); } catch(e) {}\n"
    "            try { setCloudDot && setCloudDot('offline'); } catch(e) {}\n"
    "            return;\n"
    "          }\n"
    "          if (oldId) { delete __sbShadow[t][oldId]; delete __sbVer[t][oldId]; __applyId = oldId; }\n"
    "        } else if (row) {",
    1, "rt-fuse")

# ---- 3+4) Yardimcilar (sbLoadAll'dan once) ----
rep(
    "async function sbLoadAll() {",
    "// ===== v104 GARANTI KATMANLARI (Kerem): cihaz gunluk yedek halkasi + ikinci bulut (JSONBin) =====\n"
    "function __pilDailySnapshot() {\n"
    "  try {\n"
    "    const day = new Date().toISOString().slice(0, 10);\n"
    "    const key = 'pilateria_daily_' + day;\n"
    "    if (localStorage.getItem(key)) return;\n"
    "    const cur = localStorage.getItem('pilateria');\n"
    "    if (!cur) return;\n"
    "    try { const st = JSON.parse(cur); if (!(((st.members || []).length) || ((st.payments || []).length))) return; } catch(e) { return; } // bos hali gunluk yedege yazma\n"
    "    const mine = [];\n"
    "    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('pilateria_daily_') === 0) mine.push(k); }\n"
    "    mine.sort();\n"
    "    while (mine.length >= 5) localStorage.removeItem(mine.shift()); // en fazla 5 gun\n"
    "    try { localStorage.setItem(key, cur); }\n"
    "    catch(e) { while (mine.length) localStorage.removeItem(mine.shift()); try { localStorage.setItem(key, cur); } catch(e2) {} } // kota korumasi\n"
    "    try { __trace('📅 Cihaz günlük yedeği alındı: ' + day); } catch(e) {}\n"
    "  } catch(e) {}\n"
    "}\n"
    "async function __pilOffsiteDaily() {\n"
    "  try {\n"
    "    if (__sbRole !== 'owner') return;\n"
    "    if (typeof syncCfg === 'undefined' || !syncCfg || !syncCfg.bin || !syncCfg.key) return;\n"
    "    const day = new Date().toISOString().slice(0, 10);\n"
    "    if (localStorage.getItem('pilateria_offsite_day') === day) return;\n"
    "    if (!((state.members || []).length)) return; // bos hali ikinci buluta yazma\n"
    "    const body = JSON.stringify(Object.assign({}, state, { _updatedAt: new Date().toISOString(), _offsiteDaily: day }));\n"
    "    const r = await fetch('https://api.jsonbin.io/v3/b/' + syncCfg.bin, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': syncCfg.key }, body: body });\n"
    "    if (r.ok) { localStorage.setItem('pilateria_offsite_day', day); __trace('🛰️ İkinci bulut (JSONBin) günlük yedeği: ' + day); }\n"
    "    else { __trace('🛰️ İkinci bulut yedeği başarısız: HTTP ' + r.status); }\n"
    "  } catch(e) { try { __trace('🛰️ İkinci bulut yedeği hata: ' + (e && (e.message || e))); } catch(_) {} }\n"
    "}\n"
    "async function sbLoadAll() {",
    1, "v104-helpers")

# ---- 3b) Acilista gunluk yedek ----
rep(
    "init();",
    "__pilDailySnapshot(); // v104: gunun ilk acilisinda cihaz-ici gunluk yedek (bulut/giris beklemez)\n"
    "init();",
    1, "daily-snapshot-hook")

# ---- 4b) sbLoadAll basari sonunda ikinci bulut ----
rep(
    "  __refreshUIInPlace();\n"
    "  sbSubscribeAll();\n"
    "  setCloudDot && setCloudDot('ok');\n"
    "}",
    "  __refreshUIInPlace();\n"
    "  sbSubscribeAll();\n"
    "  setCloudDot && setCloudDot('ok');\n"
    "  try { __pilOffsiteDaily(); } catch(e) {} // v104: gunde 1 kez ikinci buluta (JSONBin) tam yedek\n"
    "}",
    1, "offsite-hook")

# ---- Surum ----
rep("2026.07.21.26", "2026.07.21.27", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v104 uygulandi. fark=%d bayt" % (len(s)-len(o)))
