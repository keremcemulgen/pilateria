# PİLATERİA — Geliştirme Ortamı Kurulumu (yeni oturum reçetesi)

Bu klasör (`_dev/`) GitHub Pages tarafından **servis edilmez** (Jekyll `_` önekli klasörleri yok sayar). Sadece geliştirme/test içindir.

## Kaynak dosyalar (repo kökü)
- `pilateria.html` — **CANLI uygulama = tek gerçek kaynak** (SUPABASE_MODE=true). ~593KB tek dosya (HTML+JS+CSS).
- `sw.js` — service worker (CACHE_NAME sürümlenir).
- `index.html`, `manifest.json`, `supabase-vendor.js`, ikonlar, `preview.html`.

## Çalışma kopyaları (testte otomatik üretilir — repoya COMMIT EDİLMEZ)
- `pilateria-dev.html` = `pilateria.html` kopyası (üzerinde çalışılır).
- `pilateria-dev-false.html` = dev'in `const SUPABASE_MODE = true;` → `false;` hali (mode-off testleri).
- `preview.html` = `python3 _dev/build-preview.py` çıktısı (izole önizleme; localStorage anahtarı `pilateria_preview`).

## Testi çalıştır (tek komut)
```
bash _dev/run-tests.sh
```
Beklenen: **46 dosya, ~963 assert, 0 FAIL** (smoke-real-data hariç — o gerçek veri ister).
Yönlendirme: varsayılan `pilateria-dev.html`; FALSE(2) `auto-sync-test`+`supabase-layer-test` → `pilateria-dev-false.html`; `preview-test` → `preview.html`; `smoke-real-data` → `/tmp/piltest/state.json` (gerçek veri; yoksa atlanır).

## Değişiklik yapma kuralları (ÇOK ÖNEMLİ)
- Büyük/Türkçe `pilateria.html`'de **Edit tool KULLANMA** — Python `str.replace` yaması yaz (anchor + `assert count`).
  Bütünlük kontrolleri: `</script>`==3, `init();`==1, dosya `</html>` ile biter.
- Akış: `pilateria.html`→`pilateria-dev.html`'de çalış → yamala → `bash _dev/run-tests.sh` (0 FAIL) →
  `preview` kontrol → dev'i `pilateria.html`'e promote → sürüm bump (meta + `APP_VERSION` + `sw.js` CACHE_NAME) → GitHub push → canlı doğrula.
- Para kanonu (`memberMonthlyTotalPrice`/`groupExpectedTotal`/÷8) ile ders-hakkı kanonu (`sessionQuotaFor`/…) AYRIDIR; ödeme ders-hakkını etkilemez.
- PLANLI grup dersi = o ayki kadro (eksik eklenir, dışı atılır). Saat her yerde `normTime` ile "HH:MM". 2.paket = ÜYE klonu (`secondOfMember`), grup klonu yok; klon aktif üye saymaz.

## Deploy (token claude.ai projesindeki `claude/github-erisim.md`'de — repoya GÖMME)
```
cp pilateria-dev.html pilateria.html    # promote
git add -A && git commit -m "vYYYY.AA.GG.XX (sw vNN): özet"
git push "https://oauth2:<TOKEN>@github.com/keremcemulgen/pilateria.git" main
```
Canlı doğrula: `https://raw.githubusercontent.com/keremcemulgen/pilateria/main/pilateria.html?cb=XX` (meta sürümü kontrol).

## Tam durum & değişiklik geçmişi
claude.ai projesi dokümanları: `claude/pilateria-guncel-durum.md` (özet + reçete) ve `claude/handoff-ek-v41.md` (v41..v52 tam döküm).
