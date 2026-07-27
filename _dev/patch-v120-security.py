#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PİLATERİA v120 — GÜVENLİK SERTLEŞTİRME
Kapanan acikllar (24 Tem 2026 guvenlik denetimi):
  K-2a  Stored XSS — "Bugunun Mesajlari" kopyala butonu: onclick icindeki JS string'inden kacis
  K-2b  Stored XSS — grup WhatsApp linki: javascript: protokolu + oznitelik kacisi
  K-2c  waGroupLink sanitizeStateText kapsamina alindi
  K-3   "Yonetici dogrulama" kapisi ROL denetlemiyordu (her personel geciyordu)
  Y-2   Acilis kimlik yarisi: sbAuthGate() await edilmiyordu, panel perde arkasinda boyaniyordu
  D-1   Dis baglantilarda rel="noopener noreferrer"

Kullanim:  python3 _dev/patch-v120-security.py
Kural: pilateria.html YALNIZ bu yolla duzenlenir — capa + assert count.
"""
import io, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'pilateria.html')

with io.open(SRC, encoding='utf-8') as f:
    s = f.read()
orig_len = len(s)
applied = []

def patch(label, old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, 'CAPA HATASI [%s]: beklenen %d, bulunan %d' % (label, count, n)
    s = s.replace(old, new)
    applied.append('%s  (x%d)' % (label, count))

# --------------------------------------------------------------------------
# 0) safeUrl() — protokol beyaz listesi (escapeHtml'in hemen ardina)
# --------------------------------------------------------------------------
patch('0/safeUrl helper',
"""    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
""",
"""    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
// v120 GUVENLIK (K-2b): kullanici/bulut kaynakli bir URL href'e konmadan ONCE buradan gecer.
// javascript:, data:, vbscript: gibi KOD CALISTIRAN semalar elenir; yalniz http(s) gecer.
// NOT: donen deger HALA escapeHtml() ile oznitelik baglamina yazilmalidir (cift savunma).
function safeUrl(u) {
  if (typeof u !== 'string') return '';
  const t = u.trim();
  if (!t) return '';
  if (/[\\u0000-\\u001F\\u007F]/.test(t)) return '';   // gizli satir sonu/kontrol karakteri kacamagi
  if (!/^https?:\\/\\//i.test(t)) return '';            // beyaz liste: SADECE http/https
  return t;
}
""")

# --------------------------------------------------------------------------
# 1) Y-2 — kimlik perdesi acikken govde GERCEKTEN gizlensin (sadece z-index degil)
# --------------------------------------------------------------------------
patch('1/authlock CSS',
""".note-block { border-radius:10px; }
</style>""",
""".note-block { border-radius:10px; }
/* v120 GUVENLIK (Y-2): kimlik ekrani acikken panel PERDE ARKASINDA boyanmasin.
   Onceden overlay yalniz z-index:9999 idi; veriler DOM'da cizilmis halde duruyordu. */
body.pl-authlock > *:not(#sb-auth-overlay) { visibility:hidden !important; }
</style>""")

patch('1/sbShowAuth lock',
"""  const ov = document.getElementById('sb-auth-overlay');
  if (!ov) return;
  ov.style.display = 'flex';""",
"""  const ov = document.getElementById('sb-auth-overlay');
  if (!ov) return;
  ov.style.display = 'flex';
  try { document.body.classList.add('pl-authlock'); } catch(e) {}   // v120 Y-2""")

patch('1/sbHideAuth unlock',
"""function sbHideAuth() { const ov = document.getElementById('sb-auth-overlay'); if (ov) ov.style.display = 'none'; }""",
"""function sbHideAuth() { const ov = document.getElementById('sb-auth-overlay'); if (ov) ov.style.display = 'none'; try { document.body.classList.remove('pl-authlock'); } catch(e) {} }""")

# --------------------------------------------------------------------------
# 2) K-2b — grup WhatsApp linki
# --------------------------------------------------------------------------
patch('2/waGroupLink href',
"""    const waLink = group.waGroupLink || '';
    const linkBtn = waLink
      ? `<a href="${waLink}" target="_blank" class="btn small" style="background:#25D366;border-color:#25D366;color:#fff;text-decoration:none;">\U0001F517 WhatsApp Grubunu Aç</a>`""",
"""    // v120 GUVENLIK (K-2b): waGroupLink sanitize edilmiyordu; javascript:alert(1) ve
    // `"><img onerror=...` yuku panelde HER ACILISTA calisiyordu. Artik protokol beyaz
    // listesinden geciyor ve oznitelik baglaminda escapeHtml ile yaziliyor.
    const waLink = safeUrl(group.waGroupLink);
    const linkBtn = waLink
      ? `<a href="${escapeHtml(waLink)}" target="_blank" rel="noopener noreferrer" class="btn small" style="background:#25D366;border-color:#25D366;color:#fff;text-decoration:none;">\U0001F517 WhatsApp Grubunu Aç</a>`""")

# --------------------------------------------------------------------------
# 3) K-2a — kopyala butonu: mesaj artik VERI (data-msg), kod degil
# --------------------------------------------------------------------------
patch('3/copy button data-msg',
"""        <button class="btn small" onclick="copyTodayMessage(this, ${JSON.stringify(msg).replace(/"/g,'&quot;')})" title="Mesajı panoya kopyala">\U0001F4CB Kopyala</button>""",
"""        <button class="btn small" onclick="copyTodayMessage(this)" data-msg="${escapeHtml(msg)}" title="Mesajı panoya kopyala">\U0001F4CB Kopyala</button>""",
count=2)

patch('3/copyTodayMessage reader',
"""function copyTodayMessage(btn, msg) {
  const done = () => {""",
"""function copyTodayMessage(btn, msg) {
  // v120 GUVENLIK (K-2a): mesaj eskiden onclick icine JS string'i olarak gomuluyordu.
  // HTML ozniteligi ONCE entity-cozulur SONRA JS olarak calisir; JSON.stringify(...).replace(/"/g,'&quot;')
  // '&' karakterini kacirmadigi icin uye adindaki `&quot;` gercek tirnaga donusup string'i kiriyordu.
  // Artik mesaj data-msg ozniteliginde VERI olarak tasiniyor — kod baglamina hic girmiyor.
  if (msg === undefined || msg === null) msg = btn.getAttribute('data-msg') || '';
  const done = () => {""")

# --------------------------------------------------------------------------
# 4) K-2c — sanitizer alan listesi
# --------------------------------------------------------------------------
patch('4/sanitize waGroupLink',
"""    groups: ['name','note'],""",
"""    groups: ['name','note','waGroupLink'],""")

# --------------------------------------------------------------------------
# 5) K-3 — yonetici kapisi: ROL denetimi
# --------------------------------------------------------------------------
patch('5/confirmAdminVerify role check',
"""  if (msg) msg.textContent = 'Doğrulanıyor...';
  try {
    const { error } = await sbClient.auth.signInWithPassword({ email: email, password: pass });
    if (error) { if (msg) msg.textContent = 'E-posta veya şifre hatalı.'; return; }
    try { const { data } = await sbClient.auth.getSession(); if (data && data.session) __sbSession = data.session; } catch(_) {}
  } catch(e2) { if (msg) msg.textContent = 'Doğrulama başarısız — bağlantıyı kontrol et.'; return; }
  closeModal('modal-admin-verify');
  const cb = __advCb; __advCb = null; if (cb) cb();""",
"""  if (msg) msg.textContent = 'Doğrulanıyor...';
  // v120 GUVENLIK (K-3): bu kapi "yonetici" kapisi olarak sunuluyordu ama YALNIZ PAROLA
  // dogruluyordu. Gecerli parolasi olan HER personel; Yedek Indir (TC kimlik, adres, saglik
  // notu), Veri Yukle ve Tumunu Sifirla kapilarindan geciyordu. Artik iki kapi var:
  //   (1) girilen e-posta ACIK OTURUMUN e-postasi olmali -> hesap degistirerek atlatilamaz,
  //   (2) profiles.role SUNUCUDAN taze okunur; 'owner' degilse kapi ACILMAZ, modal KAPANMAZ.
  try {
    const { data: __cur } = await sbClient.auth.getSession();
    const __curEmail = ((__cur && __cur.session && __cur.session.user && __cur.session.user.email) || '').trim();
    if (__curEmail && email.toLowerCase() !== __curEmail.toLowerCase()) {
      if (msg) msg.textContent = 'Bu ekranda yalnız açık oturumun e-postası kullanılabilir.';
      return;
    }
  } catch(_) {}
  try {
    const { error } = await sbClient.auth.signInWithPassword({ email: email, password: pass });
    if (error) { if (msg) msg.textContent = 'E-posta veya şifre hatalı.'; return; }
    try { const { data } = await sbClient.auth.getSession(); if (data && data.session) __sbSession = data.session; } catch(_) {}
  } catch(e2) { if (msg) msg.textContent = 'Doğrulama başarısız — bağlantıyı kontrol et.'; return; }
  // ROL KAPISI — __sbRole degiskenine GUVENILMEZ, sunucudan taze okunur.
  let __role = null;
  try {
    const { data: __s2 } = await sbClient.auth.getSession();
    const __uid = __s2 && __s2.session && __s2.session.user && __s2.session.user.id;
    if (!__uid) throw new Error('oturum yok');
    const __pr = await sbClient.from('profiles').select('role').eq('id', __uid).single();
    __role = (__pr && __pr.data && __pr.data.role) || null;
  } catch(e3) { __role = null; }
  if (__role !== 'owner') {
    if (msg) msg.textContent = (__role === null)
      ? 'Yetki okunamadı — bağlantıyı kontrol et. İşlem AÇILMADI.'
      : 'Bu işlem yalnız SAHİP hesabına açıktır. (Bu hesap: personel)';
    __advCb = null;   // bekleyen tehlikeli islemi dusur
    return;           // modal ACIK kalir, kullanici geri bildirimi gorur
  }
  closeModal('modal-admin-verify');
  const cb = __advCb; __advCb = null; if (cb) cb();""")

# --------------------------------------------------------------------------
# 6) Y-2 — init() async + await sbAuthGate()
# --------------------------------------------------------------------------
patch('6/init async', """function init() {""", """async function init() {""")

patch('6/await sbAuthGate',
"""  if (SUPABASE_MODE) { sbAuthGate(); } else { lockIfNeeded(); }""",
"""  // v120 GUVENLIK (Y-2): sbAuthGate() await EDILMIYORDU. Panel, kimlik/rol daha
  // belli degilken boyaniyordu; personel hesabinda sahibe-ozel alanlar bir an gorunebiliyordu.
  // sbAuthGate her iki dalda da (oturum var / yok) hizlica cozulur — akis kilitlenmez.
  if (SUPABASE_MODE) { await sbAuthGate(); } else { lockIfNeeded(); }""")

# --------------------------------------------------------------------------
# 7) D-1 — bireysel WhatsApp baglantisi
# --------------------------------------------------------------------------
patch('7/individual wa rel',
'      ? `<a href="${buildWaLink(phone, msg)}" target="_blank" class="btn small"',
'      ? `<a href="${buildWaLink(phone, msg)}" target="_blank" rel="noopener noreferrer" class="btn small"')

# --------------------------------------------------------------------------
# 8) init() artik async — cagri yerinde hatayi yut, sessiz unhandled-rejection olmasin
# --------------------------------------------------------------------------
patch('8/init call catch',
"""__pilDailySnapshot(); // v104: gunun ilk acilisinda cihaz-ici gunluk yedek (bulut/giris beklemez)
init();""",
"""__pilDailySnapshot(); // v104: gunun ilk acilisinda cihaz-ici gunluk yedek (bulut/giris beklemez)
init().catch(function(e){ console.error('[init] acilis hatasi', e); });   // v120 Y-2: init artik async""")

# --------------------------------------------------------------------------
# Yaz
# --------------------------------------------------------------------------
with io.open(SRC, 'w', encoding='utf-8') as f:
    f.write(s)

print('v120 GUVENLIK YAMASI UYGULANDI')
for a in applied:
    print('  + ' + a)
print('  boyut: %d -> %d  (+%d bayt)' % (orig_len, len(s), len(s) - orig_len))
