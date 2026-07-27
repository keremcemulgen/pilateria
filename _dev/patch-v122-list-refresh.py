#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v122 — KAYBOLAN TAZELEME (uye listesi bulut verisiyle guncellenmiyor)

KOK NEDEN
  sbResync() bulut state'ini uyguladiktan sonra ekrani su satirla tazeliyordu:
      if (!(__uiBusyForPull && __uiBusyForPull())) __refreshUIInPlace();
  Kullanici o anda bir modal acmissa (veya bir input odaktaysa) tazeleme
  SESSIZCE DUSUYOR; tekrar denenmiyor, modal kapaninca da uygulanmiyordu.
  Cihaz artik bulutla ayni oldugu icin yeni realtime olayi da gelmez ->
  liste DOM'u KALICI olarak bayat kalir: uye detayi 8.500 gosterirken
  arkadaki Uyeler listesi 8.000 yazmaya devam eder.
  (sbResync 'after-push' ile her ~7 sn, ayrica 'nabiz'/'visible'/'online'
   ile calisir; modal acma penceresi buyuk.)

DUZELTME
  1) __refreshUIWhenIdle() + __flushPendingUIRefresh() eklendi:
     mesgulse ERTELE (kullaniciyi bozma) ama BAYRAKLA ve 1200 ms'de bir
     tekrar dene; modal kapaninca aninda uygula.
  2) sbResync artik dusuren satir yerine __refreshUIWhenIdle() cagiriyor.
  3) closeModal() son modali kapatirken ertelenmis tazelemeyi flush ediyor.
  4) __refreshUIInPlace aktif sayfayi .page.active'ten cozuyor
     (groups sayfasinin .tab'i YOK -> eskiden dashboard'a dusup yanlis
      sayfayi tazeliyordu). .tab.active eski davranis olarak yedekte.
  5) renderMembers bos-ay dalinde #members-cards da temizleniyor
     (mobilde bayat kartlar ekranda kaliyordu).

Regresyon: _dev/tests/sync-refresh-lost-test.js  (yamasiz surumde 12 FAIL)
"""
import io, sys

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
orig_len = len(s)

def rep(old, new, n=1, tag=''):
    c = s.count(old)
    assert c == n, 'ANCHOR[%s] beklenen %d, bulunan %d' % (tag, n, c)
    return s.replace(old, new, n)

# ---------------------------------------------------------------- 1) YARDIMCILAR
A1 = """  requestAnimationFrame(() => {
    try { window.scrollTo(0, sy); } catch(e){}
    scrolled.forEach(([el, t, l]) => { try { el.scrollTop = t; el.scrollLeft = l; } catch(e){} });
  });
}
const CONFLICT_BACKUP_KEY = 'pilateria_conflict_backup';"""

B1 = """  requestAnimationFrame(() => {
    try { window.scrollTo(0, sy); } catch(e){}
    scrolled.forEach(([el, t, l]) => { try { el.scrollTop = t; el.scrollLeft = l; } catch(e){} });
  });
}
// v122 KOK FIX: ERTELENEN TAZELEME KAYBOLMAZ.
// Eskiden bulut verisi uygulandigi anda kullanici mesgulse (modal acik / input odakta)
// tazeleme sessizce ATILIYORDU; tekrar denenmedigi icin liste DOM'u KALICI bayat kalirdi
// (uye detayi 8.500, arkadaki liste 8.000). Artik: ertele + bayrakla + tekrar dene,
// modal kapaninca aninda uygula. Yazma sirasinda kullanici HALA bozulmaz.
var __pendingUIRefresh = false;
var __pendingUIRefreshTimer = null;
const PENDING_UI_REFRESH_RETRY_MS = 1200;
function __refreshUIWhenIdle() {
  try {
    if (__uiBusyForPull && __uiBusyForPull()) {
      __pendingUIRefresh = true;
      clearTimeout(__pendingUIRefreshTimer);
      __pendingUIRefreshTimer = setTimeout(__refreshUIWhenIdle, PENDING_UI_REFRESH_RETRY_MS);
      return;
    }
    const wasDeferred = __pendingUIRefresh;
    __pendingUIRefresh = false;
    clearTimeout(__pendingUIRefreshTimer); __pendingUIRefreshTimer = null;
    __refreshUIInPlace();
    // Sadece GERCEKTEN ertelenmis bir tazeleme uygulandiginda haber ver (nabiz spam'i yok)
    if (wasDeferred && window.plToast) { try { plToast('☁️ Güncellendi'); } catch(e){} }
  } catch(e) { console.error('[sb] refreshWhenIdle', e); }
}
function __flushPendingUIRefresh() {
  if (!__pendingUIRefresh) return;
  if (__uiBusyForPull && __uiBusyForPull()) return; // hala mesgul — zamanlayici halleder
  __refreshUIWhenIdle();
}
const CONFLICT_BACKUP_KEY = 'pilateria_conflict_backup';"""
s = rep(A1, B1, 1, '1-helpers')

# --------------------------------------------------- 2) sbResync artik DUSURMUYOR
A2 = """    sbSnapshotShadow(sbStateToRows());
    if (!(__uiBusyForPull && __uiBusyForPull())) __refreshUIInPlace();"""
B2 = """    sbSnapshotShadow(sbStateToRows());
    __refreshUIWhenIdle(); // v122: mesgulse ERTELENIR ama KAYBOLMAZ (eskiden sessizce atiliyordu)"""
s = rep(A2, B2, 1, '2-sbResync')

# ------------------------------------------- 3) closeModal ertelenmisi FLUSH eder
A3 = """  if (!__modalSuppressPopstate) {
    try {
      if (history.state && history.state.pilateriaModal) {
        __modalSuppressPopstate = true;
        history.back();
        // popstate event microtask'tan sonra çalışır — bir sonraki tick'te resetle
        setTimeout(() => { __modalSuppressPopstate = false; }, 0);
      }
    } catch(e) { __modalSuppressPopstate = false; }
  }
}"""
B3 = """  if (!__modalSuppressPopstate) {
    try {
      if (history.state && history.state.pilateriaModal) {
        __modalSuppressPopstate = true;
        history.back();
        // popstate event microtask'tan sonra çalışır — bir sonraki tick'te resetle
        setTimeout(() => { __modalSuppressPopstate = false; }, 0);
      }
    } catch(e) { __modalSuppressPopstate = false; }
  }
  // v122: modal ACIKKEN gelen bulut verisinin ERTELENEN tazelemesi burada uygulanir.
  // (Aksi halde liste bayat kalirdi: detayda yeni fiyat, listede eski fiyat.)
  if (__modalStack.length === 0) { try { __flushPendingUIRefresh(); } catch(e){} }
}"""
s = rep(A3, B3, 1, '3-closeModal')

# ---------------------------------- 4) aktif sayfa TEK KAYNAK = .page.active
A4 = """  const active = (document.querySelector('.tab.active') || {}).dataset ? document.querySelector('.tab.active').dataset.page : 'dashboard';"""
B4 = """  // v122: aktif sayfanin TEK KAYNAGI .page.active — 'groups' sayfasinin ust sekmesi (.tab) YOK,
  // bu yuzden eskiden .tab.active null kalip 'dashboard'a dusuyor ve YANLIS sayfa tazeleniyordu.
  const __pgEl = document.querySelector('.page.active');
  const active = (__pgEl && __pgEl.id && __pgEl.id.indexOf('page-') === 0)
    ? __pgEl.id.slice(5)
    : (((document.querySelector('.tab.active') || {}).dataset) ? document.querySelector('.tab.active').dataset.page : 'dashboard');"""
s = rep(A4, B4, 1, '4-activePage')

# ------------------------------- 5) bos ay: mobil kartlar da temizlenir
A5 = """    tb.innerHTML = `<tr><td colspan="12"><div class="empty"><div class="big">\U0001f937‍♀️</div>Bu dönemde kayıt yok.</div></td></tr>`;
    return;"""
B5 = """    tb.innerHTML = `<tr><td colspan="12"><div class="empty"><div class="big">\U0001f937‍♀️</div>Bu dönemde kayıt yok.</div></td></tr>`;
    // v122: mobil kart listesi de temizlenmeli — yoksa onceki ayin kartlari ekranda BAYAT kalirdi
    { const __wc = document.getElementById('members-cards');
      if (__wc) __wc.innerHTML = '<div class="empty" style="padding:24px;">Bu dönemde kayıt yok.</div>'; }
    return;"""
s = rep(A5, B5, 1, '5-emptyCards')

io.open(P, 'w', encoding='utf-8').write(s)
print('OK patch-v122 uygulandi: %d -> %d bayt (+%d)' % (orig_len, len(s), len(s) - orig_len))
