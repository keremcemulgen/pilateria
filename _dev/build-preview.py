#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pilateria-dev.html → preview.html üretir.
Önizleme: ayrı localStorage anahtarı, bulut TAMAMEN kapalı, üstte önizleme bandı.
Kullanım: python3 build-preview.py"""
import re, sys

src = open('pilateria-dev.html', encoding='utf-8').read()
h = src

def rep(old, new, label, count=1):
    global h
    c = h.count(old)
    assert c == count, f'{label}: beklenen {count}, bulunan {c}'
    h = h.replace(old, new)
    print(f'OK {label}')

# 1) Depolama anahtarları — gerçek uygulamadan tamamen izole
rep("localStorage.getItem('pilateria')", "localStorage.getItem('pilateria_preview')", 'anahtar get', count=2)
rep("localStorage.setItem('pilateria',", "localStorage.setItem('pilateria_preview',", 'anahtar set', count=2)
rep("localStorage.removeItem('pilateria')", "localStorage.removeItem('pilateria_preview')", 'anahtar remove')
rep("const DIRTY_KEY = 'pilateria_dirty';", "const DIRTY_KEY = 'pilateria_preview_dirty';", 'dirty key')
rep("const CONFLICT_BACKUP_KEY = 'pilateria_conflict_backup';", "const CONFLICT_BACKUP_KEY = 'pilateria_preview_conflict';", 'conflict key')

# 2) İlk açılışta gerçek yerel veriden kopya al (salt-okunur kaynak)
rep('function load() {', '''function load() {
  try {
    if (!localStorage.getItem('pilateria_preview')) {
      const __real = localStorage.getItem('pilateria');
      if (__real) localStorage.setItem('pilateria_preview', __real);
    }
  } catch(e){}''', 'ilk kopya')

# 3) Bulut TAMAMEN kapalı
rep('function syncConfigured() { if (SUPABASE_MODE) return false; return !!(syncCfg.enabled && syncCfg.key && syncCfg.bin); }',
    'function syncConfigured() { return false; /* ÖNİZLEME: JSONBin kapalı (Supabase moduna geçildi) */ }', 'syncConfigured off')
rep('''async function pushToCloud(silent) {''',
'''async function pushToCloud(silent) {
  renderSyncStatus('🧪 Önizleme modunda bulut kapalıdır — hiçbir veri gönderilmez.', 'warn');
  if (true) return false;''', 'push off')
rep('''async function pullFromCloud(silent) {''',
'''async function pullFromCloud(silent) {
  renderSyncStatus('🧪 Önizleme modunda bulut kapalıdır — hiçbir veri çekilmez.', 'warn');
  if (true) return false;''', 'pull off')

# 3.5) SUPABASE MODU: önizlemede AÇIK (dev FAZ 2 sonrası zaten true olabilir — idempotent)
if 'const SUPABASE_MODE = false;' in h:
    rep('const SUPABASE_MODE = false;', 'const SUPABASE_MODE = true;', 'supabase modu AÇIK')
else:
    assert 'const SUPABASE_MODE = true;' in h, 'SUPABASE_MODE satırı bulunamadı'
    print('OK supabase modu zaten AÇIK (dev true)')

# 4) Önizleme bandı + başlık
rep('<title>Pilateria - Stüdyo Yönetim</title>', '<title>🧪 ÖNİZLEME — Pilateria</title>', 'title')
band = '''<div id="preview-band" style="position:sticky;top:0;z-index:1000000;background:#6d28d9;color:#fff;padding:8px 12px;text-align:center;font-size:12.5px;font-weight:600;">🧪 ÖNİZLEME — YENİ SİSTEM TESTİ (e-posta girişli, anlık senkron). Bu kopya yeni bulut veritabanına bağlanır; eski uygulama ve verisi etkilenmez. <a href="pilateria.html" style="color:#fde68a;">Gerçek uygulama →</a></div>
'''
i = h.find('<body')
i = h.find('>', i) + 1
h = h[:i] + '\n' + band + h[i:]
print('OK band')

# 5) Sürüm etiketi + SW kaydı önizlemede kapalı (gerçek uygulamanın SW'siyle çakışmasın)
m = re.search(r'content="(\d{4}\.\d{2}\.\d{2}\.\d{2})"', h)
ver = m.group(1)
h = h.replace(f'content="{ver}"', f'content="{ver}-onizleme"')
h = h.replace(f"APP_VERSION = '{ver}'", f"APP_VERSION = '{ver}-onizleme'")
rep("navigator.serviceWorker.register('sw.js')", "Promise.resolve() // ÖNİZLEME: SW kaydı yok — .register('sw.js')", 'sw off')

# Bütünlük
assert h.count('</script>') == 3 and 'init();' in h and h.rstrip().endswith('</html>')  # 2 inline + 1 vendor
assert "localStorage.setItem('pilateria'," not in h
open('preview.html', 'w', encoding='utf-8').write(h)
print('preview.html uretildi:', len(h), 'karakter, surum', ver + '-onizleme')
