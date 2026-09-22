# -*- coding: utf-8 -*-
# v174 — Kerem (2026-09-21): "Grup ve bireysel üye sayfalarının içinde bir sayfa daha açtığımda o
# sayfayı kaydederken veya kapatırken ana Üyeler sayfasına dönüyor — bunu çözmemiş miydik?"
# KOK NEDEN (gercek Chromium'da olculdu, 20/20): v16/v17 cozumu, closeModal()'in history.back()
# cagrisindan dogan popstate'i __modalSuppressPopstate bayragiyla yutuyordu; bayrak setTimeout(0)
# ile sifirlaniyordu. Guncel Chrome'da popstate, history.back()'ten sonra AYRI bir gorev olarak
# geliyor ve 0 ms zamanlayicisindan SONRA isleniyor ("timer-reset → popstate(flag=false)": 20/20).
# Bayrak coktan kapanmis oldugundan popstate "kullanici geri bast" sanilip yigindaki BIR SONRAKI
# pencereyi — alttaki grup/uye detayini — da kapatiyordu → kullanici ana sayfaya dusuyordu.
# (Eskiden popstate zamanlayicidan once geliyordu; tarayici guncellemesiyle sira degisti ve eski
# cozum sessizce kirildi.) Kaydet/Iptal/✕/Esc/arka plan tiklamasi — hepsi ayni yoldan geciyordu.
# AYNI KOKTEN IKINCI BELIRTI (Kerem): "Yeni Grup → + Yeni Uye → uye bireysel geliyor" — uye kaydedilince
# grup penceresi bu yuzden kapaniyor, grup hic kaydedilmiyor, yeni uye grupsuz (= bireysel) kaliyor.
# UCUNCU, BAGIMSIZ KOK NEDEN (tam taramada bulundu): Uyeler "+ BOS (tikla uye ekle)" → "+ Yeni Uye
# Olustur ve Ekle" akisi yeni uyeyi HAM g.memberIds'e yaziyordu (v163 oncesi kalinti). Grubun o ay
# icin kadro anlik goruntusu (monthlyMembers[ay] — applyRosterChange rutin yazar) varsa
# resolveGroupMembersForMonth onu okur, ham listeyi degil → yeni uye o ayin kadrosunda YOK, Uyeler'de
# "Bireysel" satiri olarak gorunur; katilim tarihi/ders senkronu/v171 teklifi de calismaz. Artik
# kanonik yol: assignMemberToSlot(yeniUye, grup, slot) — kadro, katilim tarihi, dersler, teklif.
# COZUM (ZAMANLAYICISIZ, DURUM-TABANLI): popstate artik "en ustu kapat" demiyor; olayin getirdigi
# history.state'e (hangi pencere ustte olmali) gore yigini UZLASTIRIYOR:
#   • hedef pencere zaten yiginin tepesindeyse → hicbir sey kapatma (bizim history.back()'imiz);
#   • hedef yiginda ama altta → ustundekileri kapat (gercek geri tusu / ← dugmesi);
#   • hedef yok (ana sayfa durumu) → hepsini kapat; hedef yiginda yok (bayat kayit) → dokunma.
# closeModal() yalniz mevcut history kaydi KENDISINE aitse geri gider (baska pencerenin kaydini
# geri sarmaz). Bayrak ve zamanlayici tamamen kalkti — siralama artik onemsiz.
# EK-2 (tam tarama, gercek Chromium): "kapat + hemen ac" akislari — takvimde ayni saatte 2 ders → secici →
# ders penceresi; "Yeni Grup" → ayni kadroyla grup zaten var → o grubun detayi. closeModal'in geri gitmesi
# ASENKRON islendigi icin sonradan acilan pencerenin history kaydi siliniyor ve yankida (state=null)
# yeni pencere de kapaniyordu (v173'te de bozuktu). Cozum: bekleyen geri SAYACI — yanki geldiginde hicbir
# pencere kapatilmaz, yigindaki kayitsiz pencerelerin kaydi yeniden yazilir (zamanlayici yok, sira onemsiz).
# EK (tam tarama, gercek Chromium 4/6 HATA): ✕'e CIFT dokunma iki history.back() uretip alttaki detayi da
# kapatiyordu → closeModal yalniz pencere gercekten yigindaysa (ilk cagri) geri gider; ikinci cagri no-op.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:100])
    s = s.replace(old, new)

# ---------- 0) v16 bayragi yerine: bekleyen (yankisi gelmemis) history.back() SAYACI ----------
rep("let __modalSuppressPopstate = false; // closeModal'dan history.back() çağrıldığında popstate handler ikinci kez kapatmasın",
    "let __modalPendingBacks = 0; // v174: closeModal'in kuyruga koydugu, popstate YANKISI henuz gelmemis history.back() sayisi (zamanlayici degil, sayac)\nlet __modalPendingBacksAt = 0; // v174: son bekleyen geri'nin zamani — yanki hic gelmezse (bfcache/istisnai) sayac 3 sn sonra kendini sifirlar")

# ---------- 1) closeModal: zamanlayicili bayrak yerine "kayit bana aitse geri git" ----------
rep("""  // v16 BUG#2 fix: history.back() öncesi suppress flag set et ki popstate handler
  // ikinci kez modalı pop etmesin (alt modalı kapatırdı).
  if (!__modalSuppressPopstate) {
    try {
      if (history.state && history.state.pilateriaModal) {
        __modalSuppressPopstate = true;
        history.back();
        // popstate event microtask'tan sonra çalışır — bir sonraki tick'te resetle
        setTimeout(() => { __modalSuppressPopstate = false; }, 0);
      }
    } catch(e) { __modalSuppressPopstate = false; }
  }""",
"""  // v174 KOK FIX: history.back() YALNIZ mevcut history kaydi BU pencereye aitse — baska pencerenin
  // kaydini geri sarmaz. Dogan popstate'i yutmak icin bayrak/zamanlayici YOK: popstate isleyicisi
  // olayin getirdigi duruma bakip yigini uzlastirir (hedef zaten tepedeyse hicbir sey kapatmaz).
  // (Eski v16/v17 cozumu setTimeout(0) ile bayrak sifirliyordu; guncel Chrome'da popstate
  // zamanlayicidan SONRA geldigi icin alttaki detay da kapaniyor, kullanici ana sayfaya dusuyordu.)
  // CIFT KAPATMA KORUMASI (mobilde ✕'e cift dokunma / cift cagri): pencere zaten yigindan cikmissa
  // (idx < 0) IKINCI kez geri gitme — iki geri, alttaki detayi da kapatip ana sayfaya dusururdu.
  try {
    if (idx >= 0 && history.state && history.state.pilateriaModal === id) { __modalPendingBacks++; __modalPendingBacksAt = Date.now(); history.back(); }
  } catch(e) {}""")

# ---------- 2) popstate: durum-tabanli uzlastirma ----------
rep("""window.addEventListener('popstate', (e) => {
  // Eğer closeModal tarafından programatik tetiklendiyse, modal stack'i pop ETME (zaten yapıldı)
  if (__modalSuppressPopstate) return;
  if (__modalStack.length === 0) return;
  const top = __modalStack.pop();
  const el = document.getElementById(top);
  if (el) {
    el.classList.remove('open');
    el.style.zIndex = '';
  }
  if (__modalStack.length === 0) { document.body.classList.remove('pl-modal-open'); try { window.scrollTo(0, __pageScrollY); } catch(e) {} } // v144: kullanici biraktigi yere doner
  __modalUpdateBackButtons();
});""",
"""// v174 KOK FIX — DURUM-TABANLI UZLASTIRMA (zamanlamadan bagimsiz): olay, gelinen history kaydinin
// hangi pencereyi tepede istedigini soyler (e.state.pilateriaModal; yoksa ana sayfa).
//   hedef zaten tepede        → bizim closeModal→history.back()'imiz: HICBIR SEY KAPATMA
//   hedef yiginda, daha altta → gercek geri tusu / ← dugmesi: hedefin USTUNDEKILERI kapat
//   hedef yok (ana sayfa)     → tum pencereleri kapat
//   hedef yiginda yok (bayat) → dokunma (yanlislikla canli bir pencereyi kapatmasin)
window.addEventListener('popstate', (e) => {
  const target = (e && e.state && e.state.pilateriaModal) || null;
  // v174: closeModal'in KENDI history.back() yankisi (sayacla; zamanlayici yok) → hicbir pencere kapatilmaz.
  // Geri gitme ASENKRON islendigi icin bu arada acilan yeni pencerelerin kaydi (ornek: takvim ders
  // secici → ders penceresi; "Yeni Grup" → ayni kadro var → grup detayi) bekleyen geri tarafindan
  // silinmis olur → yigin dogru, history eksik: yigindaki pencerelerin kaydi yeniden yazilir.
  if (__modalPendingBacks > 0 && (Date.now() - __modalPendingBacksAt) > 3000) __modalPendingBacks = 0; // emniyet supabi: yankisi gelmeyen geri sayaci kilitlemesin
  if (__modalPendingBacks > 0) {
    __modalPendingBacks--;
    const si = target ? __modalStack.indexOf(target) : -1;
    for (let i = si + 1; i < __modalStack.length; i++) {
      try { history.pushState({ pilateriaModal: __modalStack[i], stackLen: i + 1 }, '', '#m=' + __modalStack[i]); } catch(_) {}
    }
    return;
  }
  if (__modalStack.length === 0) return;
  if (target) {
    const ti = __modalStack.indexOf(target);
    if (ti < 0) return;                          // bayat kayit — canli pencerelere dokunma
    if (ti === __modalStack.length - 1) return;   // zaten tepede — programatik geri, kapatacak bir sey yok
  }
  while (__modalStack.length && __modalStack[__modalStack.length - 1] !== target) {
    const top = __modalStack.pop();
    const el = document.getElementById(top);
    if (el) {
      el.classList.remove('open');
      el.style.zIndex = '';
    }
    if (top === 'modal-member') { try { _pendingGroupModalAdd = null; _pendingEmptySlot = null; } catch(_) {} } // closeModal ile ayni temizlik
  }
  if (__modalStack.length === 0) { document.body.classList.remove('pl-modal-open'); try { window.scrollTo(0, __pageScrollY); } catch(e) {} } // v144: kullanici biraktigi yere doner
  __modalUpdateBackButtons();
  if (__modalStack.length === 0) { try { __flushPendingUIRefresh(); } catch(e){} } // v122 ile ayni: bekleyen tazeleme
});
// v174: geri-ileri onbelleginden (bfcache) donuste bekleyen yanki sayaci sifirlanir (eski yanki gelmez)
window.addEventListener('pageshow', (e) => { if (e && e.persisted) __modalPendingBacks = 0; });""")


# ---------- 3) BOS SLOTA YENI UYE: ham memberIds yerine kanonik assignMemberToSlot ----------
rep("""    // Eğer "boş slot doldurma" akışı aktifse: yeni üyeyi hedef grubun slotuna yerleştir
    if (_pendingEmptySlot) {
      const g = state.groups.find(x=>x.id===_pendingEmptySlot.groupId);
      if (g) {
        const mids = (g.memberIds||[]).slice();
        // slotIndex'e kadar genişlet, sonra yerleştir; sonra boş stringleri temizle
        while (mids.length <= _pendingEmptySlot.slotIndex) mids.push('');
        mids[_pendingEmptySlot.slotIndex] = data.id;
        g.memberIds = mids.filter(x => x !== '');
      }
      _pendingEmptySlot = null;
    }""",
"""    // Eğer "boş slot doldurma" akışı aktifse: yeni üyeyi hedef grubun slotuna yerleştir
    // v174 KOK FIX: ham g.memberIds yazimi, o ayin kadro anlik goruntusu (monthlyMembers[ay]) varken
    // gorunmuyordu (uye "Bireysel" kaliyordu). Kanonik yol: assignMemberToSlot — ay kadrosu, katilim
    // tarihi, ders senkronu, v171 teklifi ve digerlerinden cikarma tek yerden.
    if (_pendingEmptySlot) {
      const __slot = _pendingEmptySlot; _pendingEmptySlot = null;
      const g = state.groups.find(x=>x.id===__slot.groupId);
      if (g) { try { assignMemberToSlot(data.id, g.id, __slot.slotIndex); } catch(e) { console.error('assignMemberToSlot', e); } }
    }""")
# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.20.96">', '<meta name="app-version" content="2026.09.21.97">')
rep("const APP_VERSION = '2026.09.20.96';", "const APP_VERSION = '2026.09.21.97';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v173-2026-09-20-96';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v174-2026-09-21-97';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
