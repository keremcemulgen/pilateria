# -*- coding: utf-8 -*-
# v199 (Kerem 18.10 "olur"): vade kalemi, hesabın AÇILIŞ TARİHİNDEN ÖNCEKİ bir günle ya da hesaplar henüz açılmamışken de "ödendi"
# yapılabilir. Gider kaydı tutulur (cari ekstresi + Gelir–Gider raporu + Giderler listesi), BAKİYEYE GİRMEZ (finMovements196 açılış
# penceresi zaten dışlar). Gerekçe: Eylül geriye dönük girişi (açılış 1 Ekim). Pencerede açılış-öncesi notu (fp-pre-note) tarih/hesap
# değişince güncellenir; eski "Önce Hesaplar'dan başlangıcı gir" engeli kalkar. Kerem'in uyarısı (sarkan üye ödemesi: bakiye ödeme gününe,
# gelir paket ayına) DEĞİŞMEZ — finance-preopening-pay-test [5] bunu sabitler.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# 1) engel → bilgi
rep("""  if (!acc) { alert('Hesap seç.'); return null; }
  const a = finAccount196(acc); if (!a || !a.openingDate || date < a.openingDate) { alert('Hesabın açılış tarihi yok ya da ödeme günü açılıştan önce.'); return null; }
  __undoSnapshot('Vade ödendi: ' + d.title + ' ' + money(amount) + ' ₺');""",
"""  if (!acc) { alert('Hesap seç.'); return null; }
  const a = finAccount196(acc); if (!a) { alert('Hesap bulunamadı.'); return null; }
  const __pre199 = !a.openingDate || date < a.openingDate; // v199: açılış öncesi → kayıt tutulur, bakiyeye girmez (açılış penceresi dışı)
  __undoSnapshot('Vade ödendi: ' + d.title + ' ' + money(amount) + ' ₺');""")
rep("""  if (window.plToast) plToast('✓ ' + d.title + ' ödendi' + (kalan > 0.05 ? ' · kalan ' + money(kalan) + ' ₺ açık' : ''));
  return e;
}""",
"""  if (window.plToast) plToast('✓ ' + d.title + ' ödendi' + (kalan > 0.05 ? ' · kalan ' + money(kalan) + ' ₺ açık' : '') + (__pre199 ? ' · açılış öncesi, bakiyeye girmedi' : ''));
  return e;
}
// v199: ödeme penceresinde seçilen gün hesabın açılışından önceyse (ya da hesap açılmamışsa) not göster
function finPayPreNote199() {
  try {
    const n = document.getElementById('fp-pre-note'); if (!n) return;
    const acc = (document.getElementById('fp-acc') || {}).value || ''; const date = (document.getElementById('fp-date') || {}).value || '';
    const a = acc ? finAccount196(acc) : null;
    const pre = !a || !a.openingDate || (date && date < a.openingDate);
    n.style.display = pre ? '' : 'none';
    n.textContent = a && a.openingDate ? ('⚠️ Seçilen gün hesabın açılışından (' + fmtDate(a.openingDate) + ') önce — kayıt tutulur, cari ve raporlara girer, bakiyeye girmez.') : '⚠️ Hesap henüz açılmadı — kayıt tutulur, cari ve raporlara girer; bakiye hesap açılınca açılış tarihinden itibaren işler.';
  } catch(e) {}
}""")

# 2) pencere: engel kalkar, not + dinleyiciler
rep("""  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  if (!finActive196()) { alert('Önce 🏦 Hesaplar sekmesinden Kasa/Banka başlangıcını gir.'); return; }
  const old = document.getElementById('modal-fin-pay'); if (old) old.remove();""",
"""  if (!finCloudReady196()) { alert('Finans bulut tablosu henüz kurulmamış.'); return; }
  const old = document.getElementById('modal-fin-pay'); if (old) old.remove(); // v199: hesap açılmamışken de açılır (açılış-öncesi notu)""")
rep("""    '<div class="field"><label>Ödeme günü</label><input type="date" id="fp-date" value="' + todayISO() + '"></div>' +
    '<div class="field"><label>Hesap</label><select id="fp-acc"></select></div>' +
    '<div class="field"><label>Not</label><input id="fp-note" value=""></div>' +""",
"""    '<div class="field"><label>Ödeme günü</label><input type="date" id="fp-date" value="' + todayISO() + '" onchange="finPayPreNote199()" oninput="finPayPreNote199()"></div>' +
    '<div class="field"><label>Hesap</label><select id="fp-acc" onchange="finPayPreNote199()"></select></div>' +
    '<div class="fin-note" id="fp-pre-note" style="display:none;color:#7a4a00;"></div>' +
    '<div class="field"><label>Not</label><input id="fp-note" value=""></div>' +""")
rep("""  document.body.appendChild(mdl);
  finFillAccountSelect196(document.getElementById('fp-acc'), '', d.accountId || undefined);
}""",
"""  document.body.appendChild(mdl);
  finFillAccountSelect196(document.getElementById('fp-acc'), '', d.accountId || undefined);
  finPayPreNote199(); // v199
}""")

# 3) Vadeler uyarı metni
rep("(!finActive196() ? '<div class=\"fin-warn\">Hesaplar henüz açılmadı — ödeme tikleri hesap ister. 🏦 Hesaplar sekmesinden başlangıcı gir.</div>' : '')",
    "(!finActive196() ? '<div class=\"fin-warn\">Hesaplar henüz açılmadı — ödeme tikleri kayıt tutar ama bakiyeye girmez. 🏦 Hesaplar sekmesinden başlangıcı gir.</div>' : '')")

# sürüm
rep('<meta name="app-version" content="2026.10.18.121">', '<meta name="app-version" content="2026.10.18.122">')
rep("const APP_VERSION = '2026.10.18.121';", "const APP_VERSION = '2026.10.18.122';")
io.open(P, 'w', encoding='utf-8').write(s)
print('OK v199: %d -> %d (+%d)' % (n0, len(s), len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v198-2026-10-18-121';"
assert w.count(old) == 1, 'sw.js CACHE_NAME anchor'
w = w.replace(old, "const CACHE_NAME = 'pilateria-v199-2026-10-18-122';")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
