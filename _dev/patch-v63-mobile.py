#!/usr/bin/env python3
# v63 (Kerem, telefon ekran tasmalari — 3 ekran gorseli):
# 1) GENIS TABLO TASMASI (Odeme Yontemi Kirilimi + Hoca Performansi): KOK = .table-wrap:has(sticky-head)
#    kurali overflow-x:visible yapiyor (sticky calissin diye). Mobilde sticky ZATEN kapali (position:static)
#    ama :has kurali overflow:visible birakip geniş tabloyu EKRANA tasitiyor. FIX: mobilde overflow-x:auto (KAYDIR).
# 2) FAB (+) icerigin ustune biniyor (Duzenle/son satir gizli): FAB bottom:86px+54h -> ~140px. main padding-bottom
#    78px -> icerik FAB altinda kaliyor. FIX: padding-bottom 78 -> 150 (FAB tepesini gecsin).
# 3) "undefined kisilik": p.size tanimsiz eski/grup odemelerinde "· undefined kisilik" yaziyordu. FIX: guard.
# 4) Odeme karti UZUN GRUP ADI sag kenardan tasiyor: card-title + icindeki <small> acikca wrap.
# 5) Filtre dropdown'lari kirpik ("Temmɪ", "Tum uyeɭ"): dar toolbar. FIX: mobilde toolbar sarilir,
#    kontroller okunur genislige gelir (buton tam satir, ay+uye 50/50).
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# 1) Mobilde genis tablo -> yatay kaydir (sticky :has kuralini ez)
rep(
    "    thead.sticky-thead th, table.sticky-head thead th { position:static !important; top:auto !important; box-shadow:none !important; }\n",
    "    thead.sticky-thead th, table.sticky-head thead th { position:static !important; top:auto !important; box-shadow:none !important; }\n"
    "    /* v63: mobilde sticky KAPALI; :has() overflow:visible geniş tabloyu ekrana tasitiyordu -> yatay KAYDIR */\n"
    "    .table-wrap:has(table.sticky-head), .table-wrap:has(thead.sticky-thead) { overflow-x:auto !important; overflow-y:visible !important; -webkit-overflow-scrolling:touch; }\n"
    "    .card { overflow-x:hidden; } /* kart icerigi ekrani tasmasin (tablolar kendi .table-wrap'inda kaydirilir) */\n",
    1, "mobile-table-scroll")

# 2) FAB icerigi ortmesin: alt bosluk FAB tepesini gecsin
rep(
    "    main { padding-bottom: calc(78px + env(safe-area-inset-bottom, 0px)) !important; }",
    "    main { padding-bottom: calc(150px + env(safe-area-inset-bottom, 0px)) !important; } /* v63: FAB(+) + alt bar icin — son satir/buton FAB altinda kalmasin */",
    1, "main-padding-fab")

# 3) undefined kisilik guard
rep(
    "      <td data-label=\"Paket\">${p.pkgName}<br><small style=\"color:var(--muted)\">${p.sessions} ders · ${p.size} kişilik</small></td>",
    "      <td data-label=\"Paket\">${escapeHtml(p.pkgName||'')}<br><small style=\"color:var(--muted)\">${(p.sessions!==undefined&&p.sessions!==null&&p.sessions!=='')?p.sessions+' ders':''}${(p.size!==undefined&&p.size!==null&&p.size!=='')?(p.sessions?' · ':'')+p.size+' kişilik':''}</small></td>",
    1, "undefined-kisilik")

# 4) + 5) Yeni mobil kurallar — resp-cards blogunun kapanisindan (son satir) hemen sonra ekle.
anchor_css = "    .table-wrap:has(table.resp-cards) { overflow-x:hidden; }\n  }\n"
add_css = (
    "    .table-wrap:has(table.resp-cards) { overflow-x:hidden; }\n"
    "    /* v63: odeme/uye kartinda UZUN GRUP ADI + alt yazilar sag kenardan tasmasin — zorla sar */\n"
    "    table.resp-cards td.card-title, table.resp-cards td.card-title * { white-space:normal !important; overflow-wrap:anywhere; word-break:break-word; }\n"
    "    table.resp-cards td small { display:inline-block; max-width:100%; overflow-wrap:anywhere; word-break:break-word; }\n"
    "  }\n"
    "  /* v63: dar ekranda TOOLBAR (filtre/buton) kirpilmasin — sarilsin, kontroller okunur genislige gelsin */\n"
    "  @media (max-width:560px){\n"
    "    .toolbar { flex-wrap:wrap; gap:8px; }\n"
    "    .toolbar > button { flex:1 1 100%; }\n"
    "    .toolbar > input, .toolbar > select { flex:1 1 46%; min-width:0; max-width:100%; font-size:14px; }\n"
    "  }\n"
)
rep(anchor_css, add_css, 1, "resp-card-wrap-and-toolbar")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v63 mobil tasma yamasi uygulandi. fark=%d bayt" % (len(s)-len(o)))
