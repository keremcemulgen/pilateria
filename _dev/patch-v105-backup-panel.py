#!/usr/bin/env python3
# v105 (Kerem): Ayarlar'a "🛡️ Yedekler & Kurtarma" paneli — kurtarma GORUNUR ve GUNLUK kullanimda.
# recover.html AYNEN KALIR (cankurtaran sandali gemiye kaynak yapilmaz): uygulama acilmazsa tek kapi o.
# Panel: cihaz yedek durumu (gunluk halka + acilis oncesi + ikinci bulut) + bulut gece yedekleri listesi
# + "Bu gune don (birlestir)" (yonetici dogrulamali, upsert SILME YOK, PIN korunur) + "Simdi yedek al" (rpc)
# + Acil Kurtarma Ekrani linki.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# 1) HTML: Veri Yonetimi kartinin ardina yeni kart
rep(
    "    <div class=\"note-block\">\n"
    "      Veriler bu tarayıcıda saklanır. Farklı cihaz veya tarayıcı temizliğinde kaybolmaması için ara sıra <b>Yedek İndir</b> ile JSON dosyası al, bulut depolama (iCloud/Drive) veya e-posta ile kendine gönder.\n"
    "    </div>\n"
    "  </div>\n"
    "</section>",
    "    <div class=\"note-block\">\n"
    "      Veriler bu tarayıcıda saklanır. Farklı cihaz veya tarayıcı temizliğinde kaybolmaması için ara sıra <b>Yedek İndir</b> ile JSON dosyası al, bulut depolama (iCloud/Drive) veya e-posta ile kendine gönder.\n"
    "    </div>\n"
    "  </div>\n"
    "\n"
    "  <div class=\"card\" id=\"backup-panel-card\">\n"
    "    <h2>🛡️ Yedekler &amp; Kurtarma</h2>\n"
    "    <div id=\"backup-status\" style=\"font-size:13px;line-height:1.9;\">Durum yükleniyor…</div>\n"
    "    <div class=\"row\" style=\"margin-top:10px;flex-wrap:wrap;gap:8px;\">\n"
    "      <button class=\"btn secondary\" onclick=\"refreshBackupPanel()\">🔄 Durumu Yenile</button>\n"
    "      <button class=\"btn\" id=\"backup-now-btn\" onclick=\"takeCloudBackupNow()\">📸 Şimdi Bulut Yedeği Al</button>\n"
    "      <a class=\"btn secondary\" href=\"recover.html\" target=\"_blank\" rel=\"noopener\">🛟 Acil Kurtarma Ekranı</a>\n"
    "    </div>\n"
    "    <div id=\"backup-cloud-list\" style=\"margin-top:10px;\"></div>\n"
    "    <div class=\"note-block\">\n"
    "      Gece 00:00'da bulut yedeği OTOMATİK alınır (son 30 gün + ay başları 400 güne kadar). Her cihazda ayrıca son 5 günün yerel yedeği ve günde 1 kez ikinci bulut (JSONBin) kopyası tutulur. Uygulama hiç açılamazsa acil ekran: <b>keremcemulgen.github.io/pilateria/recover.html</b>\n"
    "    </div>\n"
    "  </div>\n"
    "</section>",
    1, "backup-panel-html")

# 2) JS fonksiyonlari — __pilOffsiteDaily ile sbLoadAll arasina
rep(
    "  } catch(e) { try { __trace('🛰️ İkinci bulut yedeği hata: ' + (e && (e.message || e))); } catch(_) {} }\n"
    "}\n"
    "async function sbLoadAll() {",
    "  } catch(e) { try { __trace('🛰️ İkinci bulut yedeği hata: ' + (e && (e.message || e))); } catch(_) {} }\n"
    "}\n"
    "// ===== v105 YEDEK PANELI (Ayarlar > Yedekler & Kurtarma) =====\n"
    "async function refreshBackupPanel() {\n"
    "  const stEl = document.getElementById('backup-status');\n"
    "  if (!stEl) return;\n"
    "  const esc = (typeof escapeHtml === 'function') ? escapeHtml : function(x) { return String(x == null ? '' : x); };\n"
    "  const ring = [];\n"
    "  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('pilateria_daily_') === 0) ring.push(k.slice(-10)); } } catch(e) {}\n"
    "  ring.sort();\n"
    "  let offsite = '—'; try { offsite = localStorage.getItem('pilateria_offsite_day') || '—'; } catch(e) {}\n"
    "  let preCloud = '—'; try { const r = localStorage.getItem('pilateria_pre_cloud_backup'); if (r) preCloud = String(JSON.parse(r).at || '').slice(0, 16).replace('T', ' '); } catch(e) {}\n"
    "  const rows = [\n"
    "    '📱 Bu cihazdaki günlük yedekler: <b>' + (ring.length ? ring.map(esc).join(', ') : 'henüz yok') + '</b>',\n"
    "    '⤵️ Son açılış-öncesi yedeği: <b>' + esc(preCloud) + '</b>',\n"
    "    '🛰️ İkinci bulut (JSONBin) son gönderim: <b>' + esc(offsite) + '</b>'\n"
    "  ];\n"
    "  const listEl = document.getElementById('backup-cloud-list');\n"
    "  const nowBtn = document.getElementById('backup-now-btn');\n"
    "  if (nowBtn) { nowBtn.disabled = (__sbRole !== 'owner'); nowBtn.title = (__sbRole !== 'owner') ? 'Yalnız sahip hesabı' : ''; }\n"
    "  if (!sbClient || !__sbSession) {\n"
    "    rows.push('🌩️ Bulut gece yedekleri: <i>görmek için giriş yap</i>');\n"
    "    stEl.innerHTML = rows.join('<br>');\n"
    "    if (listEl) listEl.innerHTML = '';\n"
    "    return;\n"
    "  }\n"
    "  stEl.innerHTML = rows.join('<br>') + '<br>🌩️ Bulut gece yedekleri yükleniyor…';\n"
    "  try {\n"
    "    const r = await sbClient.from('daily_backups').select('id,created_at').order('id', { ascending: false }).limit(10);\n"
    "    if (r && r.error) throw new Error(r.error.message || 'okuma hatası');\n"
    "    const list = (r && r.data) || [];\n"
    "    rows.push('🌩️ Son bulut gece yedeği: <b>' + (list.length ? (esc(list[0].id) + ' (' + esc(String(list[0].created_at || '').slice(11, 16)) + ')') : 'henüz yok') + '</b> — kayıtlı gün: ' + list.length);\n"
    "    stEl.innerHTML = rows.join('<br>');\n"
    "    if (listEl) {\n"
    "      const owner = (__sbRole === 'owner');\n"
    "      listEl.innerHTML = list.length ? ('<div class=\"table-wrap\"><table><thead><tr><th>Bulut Yedeği</th><th>Saat</th>' + (owner ? '<th>İşlem</th>' : '') + '</tr></thead><tbody>' +\n"
    "        list.map(function(b) { return '<tr><td>' + esc(b.id) + '</td><td>' + esc(String(b.created_at || '').slice(11, 16)) + '</td>' + (owner ? ('<td><button class=\"btn small secondary\" onclick=\"restoreDailyBackup(&quot;' + esc(b.id) + '&quot;)\">Bu güne dön (birleştir)</button></td>') : '') + '</tr>'; }).join('') +\n"
    "        '</tbody></table></div>') : '';\n"
    "    }\n"
    "  } catch(e) {\n"
    "    rows.push('🌩️ Bulut gece yedekleri okunamadı: ' + esc(e && (e.message || e)));\n"
    "    stEl.innerHTML = rows.join('<br>');\n"
    "    if (listEl) listEl.innerHTML = '';\n"
    "  }\n"
    "}\n"
    "async function takeCloudBackupNow() {\n"
    "  if (__sbRole !== 'owner') { alert('Bu işlem yalnız sahip hesabıyla yapılır.'); return; }\n"
    "  if (!sbClient) { alert('Bulut bağlantısı yok.'); return; }\n"
    "  try {\n"
    "    const r = await sbClient.rpc('pilateria_take_backup');\n"
    "    if (r && r.error) throw new Error(r.error.message || 'rpc hatası');\n"
    "    if (window.plToast) plToast('✓ Bulut yedeği alındı: ' + ((r && r.data) || ''));\n"
    "    __trace('📸 ELLE bulut yedeği alındı: ' + ((r && r.data) || ''));\n"
    "  } catch(e) { alert('Yedek alınamadı: ' + (e && (e.message || e))); }\n"
    "  try { refreshBackupPanel(); } catch(e) {}\n"
    "}\n"
    "function restoreDailyBackup(day) {\n"
    "  requireAdminVerify('Bulut yedeğinden geri dön (' + day + ')', function() { __restoreDailyBackupNow(day); });\n"
    "}\n"
    "async function __restoreDailyBackupNow(day) {\n"
    "  if (__sbRole !== 'owner') { alert('Bu işlem yalnız sahip hesabıyla yapılır.'); return; }\n"
    "  try {\n"
    "    const r = await sbClient.from('daily_backups').select('snapshot').eq('id', day).single();\n"
    "    if (r && r.error) throw new Error(r.error.message || 'yedek okunamadı');\n"
    "    const snap = (r && r.data && r.data.snapshot) || null;\n"
    "    if (!snap) throw new Error('yedek boş');\n"
    "    const cnt = function(t) { return (snap[t] || []).length; };\n"
    "    const ok = await plConfirm('“' + day + '” bulut yedeği:\\n' + cnt('members') + ' üye / ' + cnt('groups') + ' grup / ' + cnt('lessons') + ' ders / ' + cnt('payments') + ' ödeme\\n\\nBu yedek MEVCUT verilerle BİRLEŞTİRİLEREK geri yüklenecek (aynı kayıtlar o günkü haline döner, hiçbir kayıt SİLİNMEZ). Devam edilsin mi?', 'Evet, geri yükle');\n"
    "    if (!ok) return;\n"
    "    try { (snap.settings || []).forEach(function(row) { if (row && row.id === 'singleton' && row.data) row.data._pinHash = state._pinHash; }); } catch(e) {} // PIN korunur\n"
    "    let n = 0;\n"
    "    for (const t of SB_TABLES) {\n"
    "      const arr = (snap[t] || []).filter(function(x) { return x && x.id != null; });\n"
    "      for (let i = 0; i < arr.length; i += 100) {\n"
    "        const part = arr.slice(i, i + 100);\n"
    "        const rr = await sbClient.from(t).upsert(part);\n"
    "        if (rr && rr.error) throw new Error(t + ': ' + (rr.error.message || '?'));\n"
    "        n += part.length;\n"
    "      }\n"
    "    }\n"
    "    if (window.plToast) plToast('✓ ' + n + ' kayıt geri yüklendi — eşitleniyor…');\n"
    "    __trace('YEDEKTEN DÖNÜŞ: ' + day + ' → ' + n + ' kayıt upsert (silme yok)');\n"
    "    setTimeout(function() { try { sbResync('backup-restore'); } catch(e) {} }, 1200);\n"
    "  } catch(e) { alert('Geri yükleme hatası: ' + (e && (e.message || e))); }\n"
    "}\n"
    "async function sbLoadAll() {",
    1, "backup-panel-js")

# 3) renderSettings acilinca paneli tazele
rep(
    "function renderSettings() {\n"
    "  const s = state.settings;",
    "function renderSettings() {\n"
    "  try { refreshBackupPanel(); } catch(e) {} // v105: yedek paneli durumu\n"
    "  const s = state.settings;",
    1, "renderSettings-hook")

# 4) Surum
rep("2026.07.21.27", "2026.07.21.28", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v105 uygulandi. fark=%d bayt" % (len(s)-len(o)))
