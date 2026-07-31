# PİLATERİA — Stüdyo Yönetim Uygulaması

Pilates stüdyoları için **tek dosyalık, çevrimdışı çalışabilen (PWA), bulut senkronlu** yönetim uygulaması.
Üye/grup/ders takvimi, paket ve ödeme takibi, hoca hakediş + bordro (İBAN/nakit/SGK, tam sigorta modu),
gider defteri, resmi defter (KDV devri, matrah, kâr/zarar), raporlar ve CSV dışa aktarım.

**Canlı:** https://keremcemulgen.github.io/pilateria/

## Mimari

| Dosya | Görev |
|---|---|
| `pilateria.html` | **Uygulamanın tamamı** — HTML + CSS + JS tek dosyada (~760 KB). Tek gerçek kaynak. |
| `sw.js` | Service worker — çevrimdışı açılış; `CACHE_NAME` her sürümde değişir (ağ-öncelikli). |
| `index.html` | Giriş/yönlendirme kabuğu. `manifest.json` + `icon-*.png` PWA kurulumu içindir. |
| `supabase-vendor.js` | Supabase istemci kütüphanesi (yerel kopya — CDN bağımlılığı yok). |
| `recover.html`, `kurtar.html` | Bağımsız veri kurtarma araçları (uygulama açılmasa da çalışır). |
| `preview.html` | İzole önizleme derlemesi (`_dev/build-preview.py` üretir; ayrı localStorage anahtarı). |
| `_dev/` | Geliştirme alanı — GitHub Pages **yayınlamaz** (`_` öneki). Yama betikleri, test paketi, SQL kurulumları. |

- **Veri modeli:** tek `state` nesnesi → localStorage + Supabase (tablo başına `{id, data}` JSON satırları, son-yazan-kazanır + kayıt bazlı birleştirme, silme mezar taşları, saatlik anlık görüntü + gecelik yedek).
- **Sürümleme:** üç nokta birlikte güncellenir — `<meta name="app-version">`, `APP_VERSION` sabiti, `sw.js CACHE_NAME`.

## Geliştirme

```bash
bash _dev/run-tests.sh      # tam test paketi (jsdom) — 0 FAIL beklenir
```

Kurallar (ayrıntı: `_dev/SETUP.md`):

1. `pilateria.html` **elle düzenlenmez** — `_dev/patch-vNNN-*.py` Python yama betiği yazılır
   (çapa + `assert count`; yama izlenebilir ve tekrarlanabilir kalır).
2. Her hata/güvenlik düzeltmesi, **önce yamasız derlemede FAIL eden** bir regresyon testiyle gelir.
3. Yayın öncesi tam paket 0 FAIL; yayın sonrası canlı dosya bayt-bayt doğrulanır.
4. Testler tarihleri **çalışma anında** türetir (sabit "ileri tarih" yazılmaz).

## Güvenlik

- Bu depo herkese açıktır: **hiçbir gizli anahtar, kişisel veri veya iç durum dokümanı içermez**
  (`_dev/_docs/` gitignore'ludur; sır taraması test paketinin parçasıdır — `security-v121-test.js`).
- İstemcide yalnız Supabase *publishable* anahtarı bulunur; yazma izinleri satır düzeyi güvenlik (RLS) ile sınırlıdır.
