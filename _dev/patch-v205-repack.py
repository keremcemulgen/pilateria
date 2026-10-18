# -*- coding: utf-8 -*-
# v205 — ESKİ YEDEKLER BİR KEZ SIKIŞTIRILIR (v204 tamamlayıcı): v204 yalnız yeni yazılan yedekleri paketliyordu; cihazlarda duran ham halka
# slotları / günlükler / pre_* / undo (Derya'nın iPhone'unda ~2M karakter) halka dönene kadar yer tutuyordu. Açılışta bir kez (bayrak
# pilateria_repack_v204) ham yedekler yerinde sıkıştırılır; CANLI 'pilateria' dokunulmaz; kazanç yoksa dokunulmaz; iz bırakır.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:120])
    s = s.replace(old, new)
rep("""function __pilBackupSet(key, str) {""",
"""function __pilRepackBackups204() { // v205: cihazda duran HAM yedek kopyalarını bir kez sıkıştır (canlı anahtar hariç) → sıkıştırılan anahtar sayısı
  try {
    if (localStorage.getItem('pilateria_repack_v204') === '1') return 0;
    const keys = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k !== 'pilateria' && /^pilateria_(pre_cloud_\\d|pre_cloud_backup|daily_|pre_pull_backup|pre_overwrite_backup|pre_resync_backup|mass_delete_backup|undo$|corrupted_BACKUP_)/.test(k)) keys.push(k); }
    let n = 0, saved = 0;
    keys.forEach(function(k){ try { const v = localStorage.getItem(k); if (!v || v.length < 4096 || __plzIsPacked(v)) return; const z = __plzCompress(v); if (z.length < v.length && __plzDecompress(z) === v) { localStorage.setItem(k, z); n++; saved += v.length - z.length; } } catch(e) {} });
    try { localStorage.setItem('pilateria_repack_v204', '1'); } catch(e) {}
    if (n) { try { __trace('🗜 Eski yedekler sıkıştırıldı: ' + n + ' anahtar, ' + Math.round(saved / 1024) + 'K karakter kazanıldı'); } catch(e) {} }
    return n;
  } catch(e) { return 0; }
}
function __pilBackupSet(key, str) {""")
rep("""__pilStoragePrune(false); // v125: acilis budamasi — bozuk-yedek 1, gunluk halka 3
__pilDailySnapshot(); // v104: gunun ilk acilisinda cihaz-ici gunluk yedek (bulut/giris beklemez)""",
"""__pilStoragePrune(false); // v125: acilis budamasi — bozuk-yedek 1, gunluk halka 3
try { __pilRepackBackups204(); } catch(e) {} // v205: eski ham yedekleri bir kez sıkıştır (iPhone'da anında yer açar)
__pilDailySnapshot(); // v104: gunun ilk acilisinda cihaz-ici gunluk yedek (bulut/giris beklemez)""")
rep('<meta name="app-version" content="2026.10.18.127">', '<meta name="app-version" content="2026.10.18.128">')
rep("const APP_VERSION = '2026.10.18.127';", "const APP_VERSION = '2026.10.18.128';")
io.open(P, 'w', encoding='utf-8').write(s)
w = io.open('sw.js', encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v204-2026-10-18-127';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v204-2026-10-18-127';", "const CACHE_NAME = 'pilateria-v205-2026-10-18-128';")
io.open('sw.js', 'w', encoding='utf-8').write(w)
print('v205 yama tamam')
