# PİLATERİA — Geliştirme Ortamı (yeni oturum reçetesi) · güncelleme: 2026-07-31 (v139 sonrası)

Bu klasör (`_dev/`) GitHub Pages tarafından **servis edilmez** (Jekyll `_` önekli klasörleri yok sayar). Sadece geliştirme/test içindir.

## Kaynak dosyalar (repo kökü)
- `pilateria.html` — **CANLI uygulama = tek gerçek kaynak** (SUPABASE_MODE=true). ~760 KB tek dosya (HTML+JS+CSS).
- `sw.js` — service worker (`CACHE_NAME` her sürümde değişir; ağ-öncelikli, hata yanıtı cache'e girmez).
- `index.html`, `manifest.json`, `supabase-vendor.js`, ikonlar, `preview.html`, `recover.html`, `kurtar.html`.

## Çalışma kopyaları (testte otomatik üretilir — repoya COMMIT EDİLMEZ, .gitignore'da)
- `pilateria-dev.html` = `pilateria.html` kopyası; `pilateria-dev-false.html` = `SUPABASE_MODE=false` hali.
- `preview.html` = `python3 _dev/build-preview.py` çıktısı (izole önizleme; localStorage anahtarı `pilateria_preview`).
  build-preview bütünlük sayaçları: **`</script>` == 4** (3 satır içi + 1 vendor) ve `localStorage.setItem('pilateria',`
  sayısı DİNAMİKTİR (`_cs` değişkeni) — bu ikisini değiştiren yama build-preview'i de günceller.

## Test paketi (tek komut)
```
bash _dev/run-tests.sh
```
Beklenen: **90+ dosya, 1800+ assert, 0 FAIL** (`smoke-real-data` gerçek veri ister, yoksa atlanır; kesin
sayı paketin dip satırında). Paket asla `| tail`'e körlemesine güvenilmeden, `SONUC:` satırları gerçek çıkıştan okunur.
`year-stress-test.js` = 12 ay üretim ölçeği tam veri (≈4.800 ders): performans, depolama, motorlar arası
tutarlılık değişmezleri, KDV devir zinciri, yıl dönümü zarar devri, undefined/NaN sızıntısı.

## Değişiklik yapma kuralları (ÇOK ÖNEMLİ — sürüm kanonları)
- `pilateria.html`'de **Edit tool KULLANMA** — `_dev/patch-vNNN-*.py` Python `str.replace` yaması yaz
  (çapa + `assert count`). Bütünlük: `</script>`==4, `init().catch(`==1, dosya `</html>` ile biter.
- **Failing-first:** her hata/güvenlik düzeltmesi önce YAMASIZ derlemede FAIL eden testle doğar
  (`cp pilateria.html /tmp/pre-vNNN.html` → test FAIL → yama → test 0 FAIL → tam paket).
- Sürüm ÜÇLÜSÜ birlikte: `<meta name="app-version">` + `const APP_VERSION` + `sw.js CACHE_NAME`.
- Testte SABİT "ileri tarih" YAZMA — `todayISO()/currentMonth()`'tan türet (31 Temmuz dersi: roster testi).
- alert yakalama: uygulama `alert`'i sarar (`plAlert`) — metin `window.__PL_DLG_AUTO__ = (o)=>{...o.msg...}`
  kancasıyla alınır; beforeParse alert stub'ı HİÇ çağrılmaz. `confirm` doğal kalır.
- Write ile test yazarken çift-kaçış tuzağı: `\\r\\n` ve `\\'` bozar; regex içinde `/` gerekiyorsa indexOf kullan.
- jsdom'da `crypto.subtle` yok → `Object.defineProperty(w,'crypto',{value:require('crypto').webcrypto})`.
- Para kanonu (`memberMonthlyTotalPrice`/`groupExpectedTotal`/÷8) ile ders-hakkı kanonu (`sessionQuotaFor`/…)
  AYRIDIR; ödeme ders-hakkını etkilemez. PLANLI grup dersi = o ayki kadro. Saat her yerde `normTime` "HH:MM".
  2. paket = ÜYE klonu (`secondOfMember`); klon aktif üye saymaz.
- Bordro kanonları: hakediş motoru v41 (÷8 × hoca payı; yapılan+yanan). v135: bordro saatinde HER DERS 1 SAAT
  (süreden bağımsız). v138 tam sigorta: İBAN=tamSaat×ücret kırpılmaz; fark hocanın borcu; Böl-Öde toplamı=hakediş.
- Resmi defter (v137): belge/tahsilat AYI esası; `MAAS-OTO`/`SGKFARK-OTO` işaretli kayıtlar çift sayım önler —
  bu işaretleme mantığını bozan değişiklik YASAK (testlerde kilitli).
- Yeni koleksiyon eklerken tam kontrol listesi: `claude/handoff-ek-v131.md` (SB_TABLES, merge, sbApplyOne,
  recover/kurtar, snapshot/restore SQL yeniden oluşturma).

## Sır politikası (2026-07-31 denetimi)
- Bu depo HERKESE AÇIK. Hiçbir sır/kişisel veri commit edilmez; `_dev/_docs/` gitignore'ludur ve yayınlanmaz.
- Sır taraması `security-v121-test.js` içindedir; izleme sırrı deseni depoda DEĞİL,
  `_dev/_docs/izleme-sirri.txt` (gitignore'lu) dosyasından okunur — dosya yoksa o kontrol atlanır.

## Deploy (token claude.ai projesindeki `claude/github-erisim.md`'de — repoya GÖMME, komutta maskele)
```
python3 _dev/patch-vNNN-*.py                # yama (sürüm üçlüsü dahil)
bash _dev/run-tests.sh                      # 0 FAIL şart
git add -A && git commit -m "vNNN: özet"
git push "https://keremcemulgen:<TOKEN>@github.com/keremcemulgen/pilateria.git" main   # çıktıda token sed ile maskelenir
```
Canlı doğrulama zorunlu: sürüm meta'sı yeni olana dek 25 sn arayla sorgula → `cmp` ile bayt-bayt eşitlik →
sürümün testini CANLI dosyaya karşı çalıştır.

## Tam durum & değişiklik geçmişi
claude.ai projesi dokümanları: `claude/pilateria-guncel-durum.md` (özet) ve `claude/handoff-ek-vNNN.md` serisi
(v128, v131, v134, v136, v137, v138 = son büyük değişiklikler).
