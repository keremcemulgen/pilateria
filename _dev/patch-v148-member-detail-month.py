# -*- coding: utf-8 -*-
# v148 — Kerem (2026-08-17): "paketlerin listede 8/8 yanında yazmasına rağmen böyle içleri boş
# çıkıyor üye sayfalarının."
# KOK NEDEN: openMemberDetail(id) AY PARAMETRESI ALMIYOR — ay baglamini (ctxAy) Uyeler sayfasi
# secicisinden (member-month), o da yoksa BUGUNUN ayindan aliyor (v25). Panel "1 Dersi Kalan /
# Biten" satiri 📦 Temmuz paketini bulup gosterse de satir tiklaninca detay 2026-08 goruntusuyle
# aciliyor -> dersler/odemeler Temmuz'da oldugu icin "ici bos" gorunuyor. (Grup satirlarinda sorun
# yok: openGroupDetail(id, monthISO) zaten ay aliyor ve v147 r.ay iletiyordu.)
# COZUM (kalici):
#  1) openMemberDetail(id, monthISO) — istege bagli ay parametresi. Verilirse detay O AYIN
#     goruntusuyle acilir ve currentMemberDetailMonth'ta saklanir.
#  2) Ayni uyenin ACIK detayi yenilenirken (refreshMemberDetailIfOpen — odeme/ders kaydi sonrasi
#     cross-modal yenileme) saklanan ay KORUNUR; baska uyeye gecis / yeni acilis varsayilana doner
#     (Uyeler sayfasi secimi, yoksa bugunun ayi) — eski davranis aynen.
#  3) Panel satiri artik uye icin de r.ay iletir (gruplarla ayni sozlesme).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) durum: saklanan ay ----------
rep("""let currentMemberDetailId = null;""",
"""let currentMemberDetailId = null;
let currentMemberDetailMonth = null; // v148: acik uye detayinin ay baglami (panel sarkan-paket satirindan gelir; yenilemede korunur)""")

# ---------- 2) openMemberDetail imzasi + ctxAy cozumu ----------
rep("""function openMemberDetail(id) {
  // v16 BUG#4 fix: boş id ile çağrılırsa (örn navigation'da prev=null) hiçbir şey yapma
  if (!id) return;
  const m = state.members.find(x=>x.id===id);
  if (!m) return;
  currentMemberDetailId = id;
  // v25: DETAY AY BAGLAMI — Uyeler sayfasindaki secili ay (yoksa icinde bulunulan ay)
  const ctxAy = ((document.getElementById('member-month')||{}).value || '') || currentMonth();""",
"""function openMemberDetail(id, monthISO) {
  // v16 BUG#4 fix: boş id ile çağrılırsa (örn navigation'da prev=null) hiçbir şey yapma
  if (!id) return;
  const m = state.members.find(x=>x.id===id);
  if (!m) return;
  // v148: AY BAGLAMI — acik parametre > ayni uyenin acik detayinin sakli ayi (yenileme) > v25 varsayilani
  // (Uyeler sayfasi secimi, yoksa bugunun ayi). Boylece panel sarkan-paket satiri KENDI ayinda acilir,
  // odeme/ders kaydi sonrasi yenileme ayi EZMEZ, baska uyeye geciste ay TASINMAZ.
  const __sameOpen = (id === currentMemberDetailId) && document.getElementById('modal-member-detail').classList.contains('open');
  if (monthISO) currentMemberDetailMonth = monthISO;
  else if (!__sameOpen) currentMemberDetailMonth = null;
  currentMemberDetailId = id;
  const ctxAy = currentMemberDetailMonth || ((document.getElementById('member-month')||{}).value || '') || currentMonth();""")

# ---------- 3) panel satiri uye icin de ay iletir ----------
rep("""    const ac = r.tip === 'group' ? ("openGroupDetail('" + r.id + "','" + r.ay + "')") : ("openMemberDetail('" + r.id + "')");""",
"""    const ac = r.tip === 'group' ? ("openGroupDetail('" + r.id + "','" + r.ay + "')") : ("openMemberDetail('" + r.id + "','" + r.ay + "')"); // v148: uye detayi da paketin AYINDA acilir""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.17.70">', '<meta name="app-version" content="2026.08.17.71">')
rep("const APP_VERSION = '2026.08.17.70';", "const APP_VERSION = '2026.08.17.71';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v147-2026-08-17-70';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v148-2026-08-17-71';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
