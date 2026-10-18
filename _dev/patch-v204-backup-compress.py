# -*- coding: utf-8 -*-
# v204 — YEDEK KOPYALARI SIKIŞTIRILIR (Kerem 18.10 "Küçültmeyi yap"). v203 kök neden: localStorage'daki tam durum kopyaları (halka 5 slot,
# eski tek slot, günlük ×3, pre_pull/pre_overwrite/mass_delete/undo) WebKit 5 MB kotasını aşıyordu; bütçe mekanizması sayıyı azaltıyordu.
# Kalıcı çözüm: yedek kopyaları PLZ (LZ77, 15 bit/karakter UTF-16 güvenli, eşzamanlı, bağımlılık yok) ile sıkıştırılır — Kerem'in canlı
# durumu 707.732 → 37.803 karakter (%5,3; 81 ms). CANLI 'pilateria' anahtarı SIKIŞTIRILMAZ (açılış eşzamanlı okur; tek kopya). Okuyucular
# (undo, halka tekrar denetimi, tazeleme-öncesi karşılaştırma, çekme-öncesi geri yükleme, yedek paneli, recover.html, kurtar.html) işaretli
# değeri çözer; işaretsiz eski yedekler aynen okunur (geri uyum). Bütçe (v203) sıkıştırılmış boyutla çalışır.
import io
CODEC = io.open('_dev/plz-codec-v204.js', encoding='utf-8').read().rstrip('\n') + '\n'
HELPERS = CODEC + """function __pilBackupSet(key, str) { // v204: yedek değerini sıkıştırıp yazar (bütçe v203: önce yer aç) → yazılan uzunluk
  const z = __plzCompress(String(str == null ? '' : str));
  try { const cur = (localStorage.getItem(key) || '').length; __pilLsMakeRoom203(Math.max(0, z.length - cur) + 16, key); } catch(e) {}
  localStorage.setItem(key, z); return z.length;
}
function __pilBackupGet(key) { // v204: işaretliyse çözer; işaretsiz (eski) yedek aynen; bozuksa null
  let v = null; try { v = localStorage.getItem(key); } catch(e) { return null; }
  if (v == null) return null;
  try { return __plzDecompress(v); } catch(e) { try { __trace('⚠️ Yedek çözülemedi (' + key + '): ' + (e && e.message)); } catch(_) {} return null; }
}
"""
def rep_in(s, old, new, cnt=1, label=''):
    c = s.count(old)
    assert c == cnt, 'ANCHOR %s %dx (beklenen %d): %r' % (label, c, cnt, old[:120])
    return s.replace(old, new)

# ─────────── pilateria.html ───────────
P = 'pilateria.html'; s = io.open(P, encoding='utf-8').read()
s = rep_in(s, "// ═══════ v203 YEREL DEPO BÜTÇESİ ═══════\n", HELPERS + "// ═══════ v203 YEREL DEPO BÜTÇESİ ═══════\n", 1, 'helpers')
# halka: paketli yaz; tekrar denetimi çözerek
s = rep_in(s, """    try { const last = localStorage.getItem('pilateria_pre_cloud_' + (ix || 5)); if (last && JSON.parse(last).h === h) return; } catch(e) {}
    const next = (ix % 5) + 1;
    const pack = JSON.stringify({ at: new Date().toISOString(), h: h, state: raw });
    let ok = false;
    try { const __cur = (localStorage.getItem('pilateria_pre_cloud_' + next) || '').length; __pilLsMakeRoom203(Math.max(0, pack.length - __cur) + 64, 'pilateria_pre_cloud_' + next); } catch(e) {} // v203: bütçe""",
"""    try { const last = __pilBackupGet('pilateria_pre_cloud_' + (ix || 5)); if (last && JSON.parse(last).h === h) return; } catch(e) {} // v204: paketli slot çözülür
    const next = (ix % 5) + 1;
    const pack = __plzCompress(JSON.stringify({ at: new Date().toISOString(), h: h, state: raw })); // v204: SIKIŞTIRILMIŞ (≈%5)
    let ok = false;
    try { const __cur = (localStorage.getItem('pilateria_pre_cloud_' + next) || '').length; __pilLsMakeRoom203(Math.max(0, pack.length - __cur) + 64, 'pilateria_pre_cloud_' + next); } catch(e) {} // v203: bütçe""", 1, 'ring')
# günlük yedek: paketli
s = rep_in(s, """    if (!__pilLsMakeRoom203(cur.length + key.length, key)) { try { __trace('📅 Cihaz günlük yedeği ATLANDI (yerel depo bütçesi)'); } catch(e) {} return; } // v203
    try { localStorage.setItem(key, cur); }
    catch(e) { while (mine.length) localStorage.removeItem(mine.shift()); try { localStorage.setItem(key, cur); } catch(e2) {} } // kota korumasi""",
"""    const curZ = __plzCompress(cur); // v204: günlük yedek sıkıştırılmış
    if (!__pilLsMakeRoom203(curZ.length + key.length, key)) { try { __trace('📅 Cihaz günlük yedeği ATLANDI (yerel depo bütçesi)'); } catch(e) {} return; } // v203
    try { localStorage.setItem(key, curZ); }
    catch(e) { while (mine.length) localStorage.removeItem(mine.shift()); try { localStorage.setItem(key, curZ); } catch(e2) {} } // kota korumasi""", 1, 'daily')
# pre_pull
s = rep_in(s, """      if (__cur) { const __pk = JSON.stringify({ at: new Date().toISOString(), state: __cur }); __pilLsMakeRoom203(__pk.length, 'pilateria_pre_pull_backup'); localStorage.setItem('pilateria_pre_pull_backup', __pk); } // v203: bütçe""",
"""      if (__cur) __pilBackupSet('pilateria_pre_pull_backup', JSON.stringify({ at: new Date().toISOString(), state: __cur })); // v203 bütçe · v204 sıkıştırılmış""", 1, 'prepull')
# pre_overwrite: okuma çözerek, yazım paketli
s = rep_in(s, """        try { const __p = localStorage.getItem('pilateria_pre_overwrite_backup'); if (__p) __old = __tot(JSON.parse(__p)); } catch(e) {}""",
"""        try { const __p = __pilBackupGet('pilateria_pre_overwrite_backup'); if (__p) __old = __tot(JSON.parse(__p)); } catch(e) {} // v204""", 1, 'preow-read')
s = rep_in(s, """          try { __pilLsMakeRoom203(__cur.length, 'pilateria_pre_overwrite_backup'); } catch(e) {} // v203: bütçe
          for (;;) {
            try { localStorage.setItem('pilateria_pre_overwrite_backup', __cur); __ok = true; break; }""",
"""          const __curZ = __plzCompress(__cur); // v204
          try { __pilLsMakeRoom203(__curZ.length, 'pilateria_pre_overwrite_backup'); } catch(e) {} // v203: bütçe
          for (;;) {
            try { localStorage.setItem('pilateria_pre_overwrite_backup', __curZ); __ok = true; break; }""", 1, 'preow-write')
# mass_delete ×2
s = rep_in(s, """if (__cur) { const __pk = JSON.stringify({ at: new Date().toISOString(), state: __cur }); __pilLsMakeRoom203(__pk.length, 'pilateria_mass_delete_backup'); localStorage.setItem('pilateria_mass_delete_backup', __pk); } } catch(e) {} // v203: bütçe""",
"""if (__cur) __pilBackupSet('pilateria_mass_delete_backup', JSON.stringify({ at: new Date().toISOString(), state: __cur })); } catch(e) {} // v203 bütçe · v204 sıkıştırılmış""", 2, 'massdel')
# undo: paketli yaz / çözerek oku
s = rep_in(s, """    try { localStorage.setItem(__UNDO_LS, JSON.stringify(snap)); } catch(e) { try { localStorage.removeItem(__UNDO_LS); } catch(_) {} } // kota: bayat yedek kalmasin""",
"""    try { __pilBackupSet(__UNDO_LS, JSON.stringify(snap)); } catch(e) { try { localStorage.removeItem(__UNDO_LS); } catch(_) {} } // kota: bayat yedek kalmasin · v204: sıkıştırılmış""", 1, 'undo-write')
s = rep_in(s, """    var raw = localStorage.getItem(__UNDO_LS); if (!raw) return;""",
"""    var raw = __pilBackupGet(__UNDO_LS); if (!raw) return; // v204: paketli çözülür""", 1, 'undo-read')
# bozuk yedek
s = rep_in(s, """      localStorage.setItem('pilateria_corrupted_BACKUP_' + Date.now(), raw.substring(0, 100000));""",
"""      localStorage.setItem('pilateria_corrupted_BACKUP_' + Date.now(), __plzCompress(raw.substring(0, 100000))); // v204""", 1, 'corrupt')
# yedek paneli + çekme-öncesi geri yükleme
s = rep_in(s, """  let preCloud = '—'; try { const r = localStorage.getItem('pilateria_pre_cloud_backup'); if (r) preCloud = String(JSON.parse(r).at || '').slice(0, 16).replace('T', ' '); } catch(e) {}""",
"""  let preCloud = '—'; try { const r = __pilBackupGet('pilateria_pre_cloud_backup'); if (r) preCloud = String(JSON.parse(r).at || '').slice(0, 16).replace('T', ' '); } catch(e) {} // v204""", 1, 'panel')
s = rep_in(s, """  try { raw = localStorage.getItem('pilateria_pre_pull_backup'); } catch(e){}
  if (!raw) { alert('Kayıtlı "çekme öncesi" yedeği yok.'); return; }""",
"""  try { raw = __pilBackupGet('pilateria_pre_pull_backup'); } catch(e){} // v204
  if (!raw) { alert('Kayıtlı "çekme öncesi" yedeği yok.'); return; }""", 1, 'restore-prepull')
s = rep_in(s, '<meta name="app-version" content="2026.10.18.126">', '<meta name="app-version" content="2026.10.18.127">', 1, 'ver1')
s = rep_in(s, "const APP_VERSION = '2026.10.18.126';", "const APP_VERSION = '2026.10.18.127';", 1, 'ver2')
io.open(P, 'w', encoding='utf-8').write(s)

# ─────────── sw.js ───────────
w = io.open('sw.js', encoding='utf-8').read()
w = rep_in(w, "const CACHE_NAME = 'pilateria-v203-2026-10-18-126';", "const CACHE_NAME = 'pilateria-v204-2026-10-18-127';", 1, 'sw')
io.open('sw.js', 'w', encoding='utf-8').write(w)

# ─────────── recover.html / kurtar.html: çözücü + parseState ───────────
for page in ['recover.html', 'kurtar.html']:
    h = io.open(page, encoding='utf-8').read()
    h = rep_in(h, """function parseState(raw){
  if(!raw) return null; let o; try{o=JSON.parse(raw);}catch(e){return null;}""",
"""function parseState(raw){
  if(!raw) return null; try{ raw=__plzDecompress(raw); }catch(e){ return null; } // v204: sıkıştırılmış yedek (PLZ1:) çözülür
  let o; try{o=JSON.parse(raw);}catch(e){return null;}""", 1, page + '-parse')
    h = rep_in(h, """<script src="supabase-vendor.js"></script>
<script>
""", """<script src="supabase-vendor.js"></script>
<script>
""" + CODEC, 1, page + '-codec')
    io.open(page, 'w', encoding='utf-8').write(h)
print('v204 yama tamam')
