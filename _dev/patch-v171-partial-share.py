# -*- coding: utf-8 -*-
# v171 — Kerem (2026-09-15, onayli tasarim): "AYRILAN UYE PAYI" — odeme/ders hakki GRUBA BAGLANIR.
# SORUN: Uye ay ortasinda bir gruptan ayrilip (baska gruba gecti / grup penceresinden cikarildi /
# aydan cikarildi) o grupta aldigi 2 dersin ucreti hicbir yerde "o grupta" gorunmuyordu: kadroda
# olmadigi icin grup satiri yok, ucret/hak girilemiyor; TAM TARAMA bulgulari:
#  F1 (mevcut HATA): groupPaidForMonth ayrilanin odemesini grubun ODENEN'ine sayiyor, groupExpectedTotal
#     ise BEKLENEN'e katmiyor → grubun kalani dusuk cikar (baskasinin borcu kapanmis gibi).
#  F2: odeme penceresi grup secilince yalniz g.memberIds (ham temel kadro) listeliyordu — ne ay kadrosu
#     ne ayrilan uye.  F3: saveGroupPaymentAll yalniz kadroya oder (ayrilan ayrica odenir — belgelendi).
#  F4: uye bakiyesi/WhatsApp hatirlatmasi ayrilanin o gruptaki borcunu gormuyordu.
#  F5: ayrilma anlarinda hicbir kanca yoktu (3 yol).  F6: ay ortasinda bos slota katilana orantili
#     ucret onerisi yoktu.  F7: ayni ay gruba geri donen uyede pay + kadro fiyati CIFT sayilirdi.
#  F8: para alani senkronda group_finance'e ayrilmali (personel gormesin).  F9: Uyeler tablosu rowspan.
#  F10: uye sayaci ayrilan satirini saymamali.  F11: orantili (prorata) fiyat sonraki aya KOPYALANMAMALI
#     (Yeni Ay Hazirligi / listeyi onceki aydan cek).
#  F12 (2. tarama, mevcut HATA): hoca hakedis tabani (perLessonPriceForLesson, v54) yalniz O AYKI KADROYU
#     sayar → ayrilan uyenin katildigi yapilmis dersler hocaya YARIM (B'nin payi) sayiliyordu.
#  F13 (2. tarama): odeme penceresi grup kilidi (memberGroupShare/applyLockedShare) ayrilan uyeye TAM aylik
#     fiyati (8.500) kilitliyordu; kapak 2.125 oldugu icin kayit imkansizdi. Ders sayisi alani da 8 idi.
#  F14 (2. tarama): tik / odeme kaydi "odeme alan uye aya girer" (v23) kuralini pay odemesine de uyguluyor,
#     aydan cikmis uyeye enrolled:true yaziyordu (arsiv donemi baskin oldugu icin gorunur etkisi yoktu ama
#     tutarsiz durum). Pay odemesi uyeyi aya GERI SOKMAZ; odeme kaydinin ders sayisi payin dersidir.
#  F15 (2. tarama): katilan uyeye orantili UCRET verilirken DERS HAKKI 8 kaliyordu → hoca tabaninda kisi payi
#     6.375/8 cikiyordu. Katilma teklifi ucret + hak (sessionsOverride=kalan) birlikte yazar (hak ay-bazli,
#     sonraki aya zaten kopyalanmaz).
#  F16 (2. tarama): PERSONEL hesabi fiyat goremez (finans tablolari yuklenmez) ama kadro degistirebilir →
#     para soran teklif personele sorulmaz: ayrilan icin pay YALNIZ ders sayisiyla kaydedilir (ucretini
#     yonetici girer, "—" gorunur), katilan icin yalniz DERS HAKKI sorulur. Fiyatsiz pay senkronda 0'a
#     donusmez (sbSplitGroup undefined'i atlar).
#  F17 (2. tarama): kalici uye silme (permanentDeleteMember) odeme/ders/kadro temizler ama payi temizlemiyordu
#     → silinmis uyenin payi grup toplaminda hayalet kalirdi. Artik paylar da silinir.
# v171 MODELI: g.monthlyPartials[ay] = [{memberId, sessions, price, note, at}] — o ay o grupta kadro
# DISI kalmis ama ders almis uyenin payi. Kadro/ders/takvim/hoca hakedisi DEGISMEZ.
#  • Ayrilma kancalari (tasima, grup penceresi cikarma, aydan cikar): o ay o grupta yapildi+yandi ders
#    varsa TEK SORU (plPrompt, onerilen tutar = uyenin ay fiyati × alinan/hak, liraya yuvarli);
#    Vazgec/gecersiz = kayit yok. Sync akislari bozulmasin diye teklif ERTELENIR (setTimeout 0).
#  • Katilma kancasi (bos slot / grup penceresi ekleme): grubun o ay paketinde ders yapilmissa
#    "kalan N ders → ucreti X olsun mu?" (aylik fiyat override + __prorata bayragi; sonraki aya kopyalanmaz).
#  • applyRosterChange: kadroya (geri) giren uyenin ayni ay payi silinir (F7).
#  • memberPriceForGroupMonth(uye, grup, ay) = pay varsa pay fiyati, yoksa aylik fiyat — tik, kapak
#    (paymentCapCheck), odeme penceresi fiyat kilidi/bakiye seridi bunu kullanir.
#  • groupExpectedTotal paylari katar (F1); memberBalanceForMonth odenmemis paylari ekler (F4).
#  • Yuzeyler: Uyeler tablosu + mobil kart (grubun altinda "ayrildi · N ders" satiri), grup detayi
#    "Bu ay ayrilanlar" bolumu (odeme al / tik / duzenle / sil), odeme penceresi listesi (F2).
#  • Senkron: sbSplitGroup/sbMergeGroup pay fiyatini group_finance'e ayirir (F8).
#  • Geri Al: tasima/cikarma yedegi payi da kapsar; elle duzenle/sil kendi yedegini alir.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:100])
    s = s.replace(old, new)

# ---------- 1) MOTOR (removeMemberFromOtherContexts'in hemen onune; v166/v167 yardimcilarinin ardina) ----------
rep("""function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };""",
"""// ===== v171 (Kerem): AYRILAN UYE PAYI — odeme/ders hakki GRUBA baglanir =====
// g.monthlyPartials[ay] = [{memberId, sessions, price, note, at}]: o ay o grupta KADRO DISI kalmis ama
// ders almis uyenin payi. Kadro, dersler, takvim, hoca hakedisi DEGISMEZ; yalniz PARA ve gorunum.
function __partialsOf(g, ay) { return (g && ay && g.monthlyPartials && Array.isArray(g.monthlyPartials[ay])) ? g.monthlyPartials[ay].filter(Boolean) : []; }
function partialShareFor(groupId, memberId, ay) {
  const g = state.groups.find(function(x){ return x && x.id === groupId; });
  return __partialsOf(g, ay).find(function(p){ return p.memberId === memberId; }) || null;
}
// O grupta o ay ALDIGI ders sayisi (yapildi + yandi; planli/iptal sayilmaz)
function __lessonsTakenInGroup(memberId, groupId, ay) {
  return (state.lessons || []).filter(function(l){
    if (!l || l.groupId !== groupId) return false;
    if (l.status !== 'completed' && l.status !== 'missed') return false;
    if (!(l.memberIds || []).includes(memberId)) return false;
    return (l.packageMonth || String(l.date || '').slice(0, 7)) === ay;
  }).length;
}
// Grubun o ay paketinde TOPLAM alinan ders (yapildi+yandi) — katilan uyenin kalan payi icin
function __groupLessonsTaken(groupId, ay) {
  return (state.lessons || []).filter(function(l){
    if (!l || l.groupId !== groupId) return false;
    if (l.status !== 'completed' && l.status !== 'missed') return false;
    return (l.packageMonth || String(l.date || '').slice(0, 7)) === ay;
  }).length;
}
function __roundTL(v) { return Math.round((+v || 0) * 100) / 100; }
// Orantili oneri: uyenin o ayki fiyati × ders / hak (en yakin liraya)
function __prorataSuggest(memberId, groupId, ay, sessions) {
  const base = +memberMonthlyTotalPrice(memberId, ay) || 0;
  const q = +sessionQuotaFor('group', groupId, ay) || 0;
  if (!(base > 0) || !(q > 0) || !(sessions > 0)) return 0;
  return Math.round(base * sessions / q);
}
function setPartialShare(groupId, memberId, ay, sessions, price, note) {
  const g = state.groups.find(function(x){ return x && x.id === groupId; });
  if (!g || !memberId || !ay) return null;
  if (!g.monthlyPartials) g.monthlyPartials = {};
  if (!Array.isArray(g.monthlyPartials[ay])) g.monthlyPartials[ay] = [];
  let rec = g.monthlyPartials[ay].find(function(p){ return p && p.memberId === memberId; });
  if (!rec) { rec = { memberId: memberId, at: todayISO() }; g.monthlyPartials[ay].push(rec); }
  rec.sessions = Math.max(0, Math.round(+sessions || 0));
  if (price === undefined || price === null || price === '') delete rec.price; // F16: fiyatsiz pay (personel kaydi) — yonetici girer
  else rec.price = Math.max(0, __roundTL(price));
  if (note !== undefined) rec.note = String(note || '');
  return rec;
}
function removePartialShare(groupId, memberId, ay) {
  const g = state.groups.find(function(x){ return x && x.id === groupId; });
  if (!g || !g.monthlyPartials || !Array.isArray(g.monthlyPartials[ay])) return false;
  const n = g.monthlyPartials[ay].length;
  g.monthlyPartials[ay] = g.monthlyPartials[ay].filter(function(p){ return p && p.memberId !== memberId; });
  if (!g.monthlyPartials[ay].length) delete g.monthlyPartials[ay];
  if (!Object.keys(g.monthlyPartials).length) delete g.monthlyPartials;
  return n !== (g.monthlyPartials && g.monthlyPartials[ay] ? g.monthlyPartials[ay].length : 0);
}
// TEK KAYNAK: uyenin BU GRUPTA bu ayki ucreti — pay varsa payin fiyati, yoksa aylik fiyati
function memberPriceForGroupMonth(memberId, groupId, ay) {
  if (groupId && ay) { const ps = partialShareFor(groupId, memberId, ay); if (ps) return +ps.price || 0; }
  return +memberMonthlyTotalPrice(memberId, ay) || 0;
}
// Uyenin o ay ODENMEMIS pay borclari (tum gruplar) — uye bakiyesi/WhatsApp hatirlatmasi icin
function memberPartialDebtForMonth(memberId, ay) {
  let sum = 0;
  (state.groups || []).forEach(function(g){
    __partialsOf(g, ay).forEach(function(p){
      if (p.memberId !== memberId) return;
      const paid = memberPaidTowardsMonth(memberId, g.id, ay);
      sum += Math.max(0, __roundTL((+p.price || 0) - paid));
    });
  });
  return __roundTL(sum);
}
// --- ERTELENMIS TEKLIFLER: ayrilma/katilma akislari senkron; soru (plPrompt) akis bitince sorulur ---
var __partialOfferQueue = [];
var __partialOfferBusy = false;
function __queuePartialOffer(g, memberId, ay) {
  try {
    if (!g || !memberId || !ay) return;
    if (partialShareFor(g.id, memberId, ay)) return;
    if (!__lessonsTakenInGroup(memberId, g.id, ay)) return;
    if (__partialOfferQueue.some(function(q){ return q.kind === 'leave' && q.gid === g.id && q.mid === memberId && q.ay === ay; })) return;
    __partialOfferQueue.push({ kind: 'leave', gid: g.id, mid: memberId, ay: ay });
    clearTimeout(__partialOfferQueue._t); __partialOfferQueue._t = setTimeout(__runPartialOffers, 0);
  } catch(e) {}
}
function __queueJoinOffer(g, memberId, ay) {
  try {
    if (!g || !memberId || !ay) return;
    if (!__groupLessonsTaken(g.id, ay)) return;                               // paket henuz baslamadi → tam ucret
    const ov = getMemberMonthlyOverride(memberId, ay) || {};
    if (ov.totalPrice !== undefined && ov.totalPrice !== null && ov.totalPrice !== '') return; // bu aya ozel fiyat zaten var
    if (__partialOfferQueue.some(function(q){ return q.kind === 'join' && q.gid === g.id && q.mid === memberId && q.ay === ay; })) return;
    __partialOfferQueue.push({ kind: 'join', gid: g.id, mid: memberId, ay: ay });
    clearTimeout(__partialOfferQueue._t); __partialOfferQueue._t = setTimeout(__runPartialOffers, 0);
  } catch(e) {}
}
function __parseTL(ans) {
  if (ans === null || ans === undefined) return null;
  const v = parseFloat(String(ans).trim().replace(/\\s/g, '').replace(',', '.'));
  if (!isFinite(v) || v < 0) return null;
  return __roundTL(v);
}
async function __runPartialOffers() {
  if (__partialOfferBusy) return;
  __partialOfferBusy = true;
  try {
    let changed = false;
    while (__partialOfferQueue.length) {
      const it = __partialOfferQueue.shift();
      const g = state.groups.find(function(x){ return x && x.id === it.gid; });
      const m = state.members.find(function(x){ return x && x.id === it.mid; });
      if (!g || !m) continue;
      const gName = groupDisplayName(g, it.ay) || g.name || 'Grup';
      const q = +sessionQuotaFor('group', g.id, it.ay) || 0;
      const __staff = !!(typeof SUPABASE_MODE !== 'undefined' && SUPABASE_MODE && typeof __sbRole !== 'undefined' && __sbRole === 'staff'); // F16
      if (it.kind === 'leave') {
        if (partialShareFor(g.id, it.mid, it.ay)) continue;
        if (activeGroupRosterForMonth(g, it.ay).includes(it.mid)) continue; // geri eklendi — pay yok
        const taken = __lessonsTakenInGroup(it.mid, g.id, it.ay);
        if (!taken) continue;
        if (__staff) { // F16: personel para gormez — pay yalniz ders sayisiyla kaydedilir, ucretini yonetici girer
          const okS = await plConfirm(m.name + ' ' + pkgMonthLabel(it.ay) + ' ayında «' + gName + '» grubunda ' + taken + ' ders aldı.\\n\\nBu dersler grupta payı olarak kaydedilsin mi? (Ücretini yönetici girer)', 'Evet, kaydet');
          if (!okS) continue;
          __undoSnapshot('Pay kaydı: ' + m.name + ' — ' + it.ay);
          setPartialShare(g.id, it.mid, it.ay, taken, undefined, '');
          changed = true;
          if (typeof plToast === 'function') { try { plToast('📎 ' + m.name + ' — «' + gName + '» payı: ' + taken + ' ders (ücret: yönetici)'); } catch(e) {} }
          continue;
        }
        const base = +memberMonthlyTotalPrice(it.mid, it.ay) || 0;
        const sug = __prorataSuggest(it.mid, g.id, it.ay, taken);
        const ans = await plPrompt(
          m.name + ' ' + pkgMonthLabel(it.ay) + ' ayında «' + gName + '» grubunda ' + taken + ' ders aldı.\\n\\n' +
          'Grupta payı olarak kaydedilsin mi? Ücret (₺) — değiştirebilirsin:\\n' +
          (base > 0 && q > 0 ? '(' + money(base) + ' × ' + taken + '/' + q + ' = ' + money(sug) + ')' : '(üyenin bu ay tanımlı fiyatı yok — tutarı gir)') +
          '\\n\\nVazgeç = kayıt açılmaz', String(sug), { type: 'number', placeholder: '₺' });
        const price = __parseTL(ans);
        if (price === null) continue;
        __undoSnapshot('Pay kaydı: ' + m.name + ' — ' + it.ay); // yanlis "Evet" → Geri Al yalniz payi kaldirir
        setPartialShare(g.id, it.mid, it.ay, taken, price, '');
        changed = true;
        if (typeof plToast === 'function') { try { plToast('📎 ' + m.name + ' — «' + gName + '» payı: ' + taken + ' ders · ' + money(price) + ' ₺'); } catch(e) {} }
      } else if (it.kind === 'join') {
        if (!activeGroupRosterForMonth(g, it.ay).includes(it.mid)) continue;
        const ov = getMemberMonthlyOverride(it.mid, it.ay) || {};
        if (ov.totalPrice !== undefined && ov.totalPrice !== null && ov.totalPrice !== '') continue;
        const takenG = __groupLessonsTaken(g.id, it.ay);
        if (!takenG || !(q > 0)) continue;
        const kalan = Math.max(0, q - takenG);
        if (__staff) { // F16: personel yalniz DERS HAKKINI ayarlar, ucreti yonetici belirler
          if (memberSessionsOverride(it.mid, it.ay) !== null) continue;
          const okS = await plConfirm('«' + gName + '» ' + pkgMonthLabel(it.ay) + ' paketinde ' + takenG + ' ders yapıldı, ' + kalan + ' ders kaldı.\\n\\n' + m.name + ' için bu ayın ders hakkı ' + kalan + ' olsun mu? (Ücreti yönetici belirler)', 'Evet');
          if (!okS) continue;
          __undoSnapshot('Ders hakkı: ' + m.name + ' — ' + it.ay);
          setMemberMonthly(it.mid, it.ay, { sessionsOverride: kalan });
          changed = true;
          continue;
        }
        const base = +memberMonthlyTotalPrice(it.mid, it.ay) || 0;
        const sug = base > 0 ? Math.round(base * kalan / q) : 0;
        const ans = await plPrompt(
          '«' + gName + '» ' + pkgMonthLabel(it.ay) + ' paketinde ' + takenG + ' ders yapıldı, ' + kalan + ' ders kaldı.\\n\\n' +
          m.name + ' için bu ayın ücreti ve ders hakkı kalan derse göre olsun mu? (ders hakkı: ' + kalan + ')\\nÜcret (₺) — değiştirebilirsin:\\n' +
          (base > 0 ? '(' + money(base) + ' × ' + kalan + '/' + q + ' = ' + money(sug) + ')' : '(üyenin tanımlı fiyatı yok — tutarı gir)') +
          '\\n\\nVazgeç = fiyat ve hak değişmez (tam ücret, tam hak)', String(sug), { type: 'number', placeholder: '₺' });
        const price = __parseTL(ans);
        if (price === null) continue;
        __undoSnapshot('Orantılı ücret: ' + m.name + ' — ' + it.ay);
        setMemberMonthly(it.mid, it.ay, { totalPrice: price, __prorata: true, sessionsOverride: kalan }); // F15: ucret + DERS HAKKI kalan derse gore; fiyat sonraki aya KOPYALANMAZ (hak zaten ay-bazli)
        changed = true;
        if (typeof plToast === 'function') { try { plToast('💰 ' + m.name + ' ' + pkgMonthLabel(it.ay) + ' ücreti: ' + money(price) + ' ₺ · ders hakkı ' + kalan); } catch(e) {} }
      }
    }
    if (changed) { save(); try { __refreshUIInPlace(); } catch(e) {} try { refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {} }
  } finally { __partialOfferBusy = false; }
}
// --- elle yonetim (grup detayi / Uyeler satiri) ---
async function editPartialShare(groupId, memberId, ay) {
  const ps = partialShareFor(groupId, memberId, ay); if (!ps) return;
  const m = state.members.find(function(x){ return x.id === memberId; }); if (!m) return;
  const a1 = await plPrompt(m.name + ' — ' + pkgMonthLabel(ay) + ' payı: ÜCRET (₺)', String(ps.price || 0), { type: 'number' });
  const price = __parseTL(a1); if (price === null) return;
  const a2 = await plPrompt(m.name + ' — ' + pkgMonthLabel(ay) + ' payı: DERS SAYISI', String(ps.sessions || 0), { type: 'number' });
  const sess = a2 === null ? null : Math.max(0, Math.round(+a2 || 0));
  if (sess === null) return;
  __undoSnapshot('Pay düzenle: ' + m.name + ' — ' + ay);
  setPartialShare(groupId, memberId, ay, sess, price);
  save(); try { __refreshUIInPlace(); refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {}
}
function deletePartialShare(groupId, memberId, ay) {
  const ps = partialShareFor(groupId, memberId, ay); if (!ps) return;
  const m = state.members.find(function(x){ return x.id === memberId; });
  const paid = memberPaidTowardsMonth(memberId, groupId, ay);
  if (!confirm('"' + ((m && m.name) || 'Üye') + '" için ' + pkgMonthLabel(ay) + ' payı (' + ps.sessions + ' ders · ' + money(ps.price) + ' ₺) silinecek.' + (paid > 0 ? '\\n\\n⚠️ Bu gruba ' + money(paid) + ' ₺ ödemesi var — ödeme kaydı SİLİNMEZ, yalnız pay kaydı kalkar.' : '') + '\\n\\nDevam?')) return;
  __undoSnapshot('Pay sil: ' + ((m && m.name) || 'Üye') + ' — ' + ay);
  removePartialShare(groupId, memberId, ay);
  save(); try { __refreshUIInPlace(); refreshGroupDetailIfOpen(); refreshMemberDetailIfOpen(); } catch(e) {}
}
// Grup detayi: "Bu ay ayrilanlar" bolumu
function __partialSectionHtml171(g, monthISO) {
  const ay = monthISO || currentMonth();
  const list = __partialsOf(g, ay);
  if (!list.length) return '';
  const rows = list.map(function(p){
    const m = state.members.find(function(x){ return x.id === p.memberId; });
    const nm = m ? m.name : p.memberId;
    const paid = memberPaidTowardsMonth(p.memberId, g.id, ay);
    const kalan = Math.max(0, __roundTL((+p.price || 0) - paid));
    const full = (+p.price > 0) ? (paid >= (+p.price) - 0.005) : paid > 0;
    const part = !full && paid > 0;
    const noPrice = (p.price === undefined || p.price === null);
    const tickLabel = full ? '✅ Ödendi' : (part ? ('🟡 Kısmi ' + money(paid) + '/' + money(p.price)) : '⬜ Ödeme al');
    const tickStyle = full ? 'background:#E8F5E9;color:#2E7D32;border:1px solid #2E7D32;' : (part ? 'background:#FFF8E1;color:#b8860b;border:1px solid #e0c060;' : 'background:#FFF8E1;color:#8a7b20;border:1px dashed #c9b85f;');
    return '<tr style="background:' + (full ? '#f5fbf5' : '#fffdf5') + ';">' +
      '<td><b>' + escapeHtml(nm) + '</b> <span class="badge" style="background:#f5f0e0;color:#8a8573;">ayrıldı</span></td>' +
      '<td>' + (p.sessions || 0) + ' ders</td>' +
      '<td>' + (noPrice ? '<span style="color:#c62828;">— <small>ücret gir (✏️)</small></span>' : ('<b>' + money(p.price || 0) + ' ₺</b>')) + (kalan > 0 && paid > 0 ? '<br><span style="font-size:11px;color:#c62828;">Kalan ' + money(kalan) + ' ₺</span>' : '') + '</td>' +
      '<td><button class="btn small pl-owner-only" style="' + tickStyle + 'padding:4px 10px;font-weight:600;" onclick="togglePaidTick(\\'' + p.memberId + '\\',\\'' + g.id + '\\',event,\\'' + ay + '\\')">' + tickLabel + '</button> ' +
      '<button class="btn small pl-owner-only" onclick="openPaymentModal(\\'' + p.memberId + '\\',null,\\'' + g.id + '\\',\\'' + ay + '\\')" title="Bu gruba ödeme al">+ ₺</button></td>' +
      '<td><button class="btn small secondary pl-owner-only" onclick="editPartialShare(\\'' + g.id + '\\',\\'' + p.memberId + '\\',\\'' + ay + '\\')" title="Payın ücretini/ders sayısını düzenle">✏️</button> ' +
      '<button class="btn small secondary pl-owner-only" onclick="deletePartialShare(\\'' + g.id + '\\',\\'' + p.memberId + '\\',\\'' + ay + '\\')" title="Pay kaydını sil">✕</button> ' +
      '<button class="btn small secondary" onclick="event.stopPropagation();openMemberDetail(\\'' + p.memberId + '\\')">Detay</button></td></tr>';
  }).join('');
  return '<h3 style="margin-top:14px;">Bu ay ayrılanlar <small style="font-weight:normal;color:var(--muted);font-size:12px;">— ay içinde gruptan ayrılıp bu grupta ders almış üyelerin payı; grubun beklenen gelirine dahildir, ödemesi bu gruba yazılır.</small></h3>' +
    '<div class="table-wrap"><table><thead><tr><th>Ad</th><th>Aldığı Ders</th><th>Payı</th><th>Ödeme</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}
function removeMemberFromOtherContexts(memberId, keepGroupId, ctxAy) {
  const removed = { groups: [], individualLessons: 0 };""")

# ---------- 2) KANCALAR ----------
# 2a) baska gruba tasima
rep("""      removed.groups.push(__lbl162);""",
"""      __queuePartialOffer(g, memberId, __ay); // v171: eski grupta aldigi dersler varsa payi sorulur
      removed.groups.push(__lbl162);""")
# 2b) grup penceresi: cikarilan → pay teklifi; eklenen → kalan-derse-gore ucret teklifi
rep("""        __autoNameAfterRosterChange(__pg0, __gAy);
      }
    } }""",
"""        __removed.forEach(rid => __queuePartialOffer(__pg0, rid, __gAy)); // v171
        __added.forEach(aid => __queueJoinOffer(__pg0, aid, __gAy));        // v171
        __autoNameAfterRosterChange(__pg0, __gAy);
      }
    } }""")
# 2c) aydan cikar (kabuk; cekirdek sessiz kalir)
rep("""  __removeMemberFromMonthCore(memberId, monthISO); // v167: cekirdek (onaysiz) — Yeni Ay Hazirligi da kullanir""",
"""  { const __g171 = memberActiveGroupForMonth(memberId, monthISO); if (__g171) __queuePartialOffer(__g171, memberId, monthISO); } // v171
  __removeMemberFromMonthCore(memberId, monthISO); // v167: cekirdek (onaysiz) — Yeni Ay Hazirligi da kullanir""")
# 2d) bos slota katilma
rep("""  { if (!g.memberJoinDates) g.memberJoinDates = {};
    g.memberJoinDates[memberId] = (__ctxAy === currentMonth()) ? todayISO() : (__ctxAy + '-01'); }""",
"""  { if (!g.memberJoinDates) g.memberJoinDates = {};
    g.memberJoinDates[memberId] = (__ctxAy === currentMonth()) ? todayISO() : (__ctxAy + '-01'); }
  __queueJoinOffer(g, memberId, __ctxAy); // v171: paket baslamissa kalan derse gore ucret onerisi""")
# 2e) kadroya (geri) giren uyenin ayni ay payi silinir (cift sayim yok)
rep("""  g.memberIds = mutateFn((g.memberIds||[]).slice());
  Object.keys(g.monthlyMembers).forEach(k => {
    if (k >= ay) g.monthlyMembers[k] = mutateFn((g.monthlyMembers[k]||[]).slice());
  });
}""",
"""  g.memberIds = mutateFn((g.memberIds||[]).slice());
  Object.keys(g.monthlyMembers).forEach(k => {
    if (k >= ay) g.monthlyMembers[k] = mutateFn((g.monthlyMembers[k]||[]).slice());
  });
  // v171: kadroya (geri) giren uyenin o ayki "ayrilan payi" duser — pay + kadro fiyati CIFT sayilmaz
  try { const __r171 = (resolveGroupMembersForMonth(g, ay) || []).filter(Boolean); __partialsOf(g, ay).forEach(function(p){ if (__r171.includes(p.memberId)) removePartialShare(g.id, p.memberId, ay); }); } catch(e) {}
}""")

# ---------- 3) PARA MOTORU ----------
rep("""  const memberSum = mids.reduce((s,mid)=> s + memberMonthlyTotalPrice(mid, ay||''), 0);""",
"""  const memberSum = mids.reduce((s,mid)=> s + memberMonthlyTotalPrice(mid, ay||''), 0)
    + (ay ? __partialsOf(g, ay).reduce(function(s2, p){ return s2 + (+p.price || 0); }, 0) : 0); // v171: ayrilan paylari grubun BEKLENEN'ine dahil (F1)""")
rep("""  const defined = +memberMonthlyTotalPrice(memberId, monthISO) || 0;""",
"""  const defined = +memberPriceForGroupMonth(memberId, groupId, monthISO) || 0; // v171: pay varsa payin fiyati""")
rep("""  const __defPrice = +memberMonthlyTotalPrice(memberId, ay) || 0;""",
"""  const __defPrice = +memberPriceForGroupMonth(memberId, groupId || '', ay) || 0; // v171""")
rep("""    let amount = memberMonthlyTotalPrice(memberId, ay) || null;""",
"""    let amount = memberPriceForGroupMonth(memberId, groupId || '', ay) || null; // v171""")
rep("""function memberBalanceForMonth(memberId, monthISO) {
  const ay = monthISO || currentMonth();
  const defined = +memberMonthlyTotalPrice(memberId, ay) || 0;
  if (defined <= 0) return 0;
  const g = memberActiveGroupForMonth(memberId, ay);
  const paid = memberPaidTowardsMonth(memberId, g ? g.id : '', ay);
  return Math.max(0, Math.round((defined - paid) * 100) / 100);
}""",
"""function memberBalanceForMonth(memberId, monthISO) {
  const ay = monthISO || currentMonth();
  const __pd = memberPartialDebtForMonth(memberId, ay); // v171: ayrildigi gruplardaki odenmemis paylar da borcudur (F4)
  const defined = +memberMonthlyTotalPrice(memberId, ay) || 0;
  if (defined <= 0) return __pd;
  const g = memberActiveGroupForMonth(memberId, ay);
  const paid = memberPaidTowardsMonth(memberId, g ? g.id : '', ay);
  return Math.max(0, Math.round((defined - paid) * 100) / 100) + __pd;
}""")

# ---------- 4) ODEME PENCERESI LISTESI (F2) ----------
rep("""  if (__payG) {
    const __pset = new Set((__payG.memberIds||[]).filter(Boolean));
    __payMembers = __payMembers.filter(m => __pset.has(m.id) || (memberId && m.id === memberId));""",
"""  if (__payG) {
    const __pset = new Set((__payG.memberIds||[]).filter(Boolean));
    { const __ayL = pkgMonthCtx || currentMonth(); // v171: o AYIN kadrosu + o ay ayrilan (payli) uyeler de listede (F2)
      try { activeGroupRosterForMonth(__payG, __ayL).forEach(function(x){ __pset.add(x); }); } catch(e) {}
      __partialsOf(__payG, __ayL).forEach(function(p){ __pset.add(p.memberId); }); }
    __payMembers = __payMembers.filter(m => __pset.has(m.id) || (memberId && m.id === memberId));""")

# ---------- 5) UYELER SATIRLARI (buildMemberRows) ----------
rep("""    const __gDispName = groupDisplayName(g, monthISO || ''); // v41: ay bazli grup adi
    const validMemberIds = slotIds.filter(x => x); // raporlama için
    // Eğer ay filtresinden sonra hiç üye kalmadıysa grubu listede hiç gösterme
    if (monthISO && validMemberIds.length === 0 && !gPayments.length) return;
    const slotCount = slotIds.length;
    const memberCount = slotCount;""",
"""    const __gDispName = groupDisplayName(g, monthISO || ''); // v41: ay bazli grup adi
    const validMemberIds = slotIds.filter(x => x); // raporlama için
    const __partials171 = monthISO ? __partialsOf(g, monthISO).filter(p => state.members.some(x => x.id === p.memberId)) : []; // v171: ayrilan paylari
    // Eğer ay filtresinden sonra hiç üye kalmadıysa grubu listede hiç gösterme
    if (monthISO && validMemberIds.length === 0 && !gPayments.length && !__partials171.length) return;
    const slotCount = slotIds.length;
    const memberCount = slotCount; // 'N/M dolu' paydasi = slot sayisi (degismedi)
    const __rowSpan171 = slotCount + __partials171.length; // v171: rowspan ayrilan satirlarini da kapsar (F9) — 'dolu' paydasina KARISMAZ""")
# rowspan ayri alan: her satira groupRowSpan (bos slot + uye + pay satirlari)
rep("""          isFirstInGroup,
          groupMemberCount: memberCount,
        groupFilledCount: validMemberIds.length, // v36: 'N/M dolu' = o ayin ENROLLED uye sayisi (roster degil)""",
"""          isFirstInGroup,
          groupMemberCount: memberCount,
          groupRowSpan: __rowSpan171, // v171
        groupFilledCount: validMemberIds.length, // v36: 'N/M dolu' = o ayin ENROLLED uye sayisi (roster degil)""")
rep("""        isFirstInGroup,
        groupMemberCount: memberCount,
        groupFilledCount: validMemberIds.length, // v36: 'N/M dolu' = o ayin ENROLLED uye sayisi (roster degil)""",
"""        isFirstInGroup,
        groupMemberCount: memberCount,
        groupRowSpan: __rowSpan171, // v171
        groupFilledCount: validMemberIds.length, // v36: 'N/M dolu' = o ayin ENROLLED uye sayisi (roster degil)""")
rep("""        const rs = r.groupMemberCount || 1;""", """        const rs = r.groupRowSpan || r.groupMemberCount || 1; // v171: pay satirlari rowspan'a dahil""", 2)
rep("""      isFirstInGroup = false;
    }
  });
  return rows;
}""",
"""      isFirstInGroup = false;
    }
    // v171: AYRILAN UYE PAYI satirlari — kadro disi ama bu ay bu grupta ders almis; grubun toplamina dahil
    __partials171.forEach(p => {
      const m = state.members.find(x => x.id === p.memberId); if (!m) return;
      const pPays = state.payments.filter(pp => pp.memberId === p.memberId && pp.groupId === g.id && ((pp.packageMonth || (pp.date ? String(pp.date).slice(0,7) : '')) === monthISO));
      const latestPay = pPays.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
      const paid = pPays.reduce((a,b)=>a+(+b.amount||0),0);
      rows.push({
        memberId: m.id, name: m.name,
        groupId: g.id, groupName: __gDispName,
        isFirstInGroup,
        groupMemberCount: memberCount,
        groupRowSpan: __rowSpan171,
        groupFilledCount: validMemberIds.length,
        pkgStart: '', pkgEnd: '',
        payDate: latestPay ? latestPay.date : '',
        ownPrice: +p.price || 0,
        totalPrice: isFirstInGroup ? totalPrice : '',
        paid,
        groupPaid: isFirstInGroup ? groupPaidTotal : '',
        groupFullyPaid: groupRemaining === 0 && groupPaidTotal > 0,
        remaining: isFirstInGroup ? groupRemaining : '',
        note: 'ayrıldı · ' + (p.sessions || 0) + ' ders' + (p.note ? ' · ' + p.note : ''),
        method: latestPay ? (latestPay.method||'') : '',
        type: 'group',
        isPartial: true,
        partialSessions: p.sessions || 0,
        slotIndex: -1
      });
      isFirstInGroup = false;
    });
  });
  return rows;
}""")
# uye sayaci: ayrilan satiri sayilmaz (F10)
rep("""    if (r.memberId) __uniqMemberIds.add(personIdOf(r.memberId)); // v59: klon ayni KISI — cift sayilmaz""",
"""    if (r.memberId && !r.isPartial) __uniqMemberIds.add(personIdOf(r.memberId)); // v59: klon ayni KISI — cift sayilmaz · v171: ayrilan payi sayilmaz (F10)""")

# ---------- 6) MASAUSTU SATIR (Uyeler tablosu) ----------
rep("""    // Aylık paket başlangıç tarihi düzenleme — ay seçiliyse hücre tıklanabilir
    const pkgStartLabel = r.pkgStart ? fmtDate(r.pkgStart) : '—';""",
"""    // v171: AYRILAN UYE PAYI satiri — kadro disi; fiyat/odeme bu gruba, aydan-cikar/duzenle yok
    if (r.isPartial) {
      const __own = +r.ownPrice || 0, __pd = +r.paid || 0;
      return `<tr class="${rowClass}" onclick="openMemberDetail('${r.memberId}')" style="cursor:pointer;background:#fbf8f1;">
        <td>${idx+1}</td>
        ${groupNameCell}
        <td><b>${escapeHtml(r.name)}</b> <span class="badge" style="background:#f5f0e0;color:#8a8573;">ayrıldı · ${r.partialSessions} ders</span>${__own > 0 ? ' <small style="color:var(--muted);white-space:nowrap;">· ' + money(__own) + ' ₺</small>' : ''}</td>
        <td>—</td>
        <td>—</td>
        <td>${r.payDate ? fmtDate(r.payDate) : '—'}</td>
        ${totalCell}
        ${paidCell}
        ${remainingCell}
        <td style="font-size:11px;max-width:180px;">${escapeHtml(r.note||'')}</td>
        <td>${r.method?`<span class="badge ${r.method==='IBAN'?'blue':''}">${r.method}</span>`:'—'}</td>
        <td onclick="event.stopPropagation()">
          <button class="btn small pl-owner-only" onclick="togglePaidTick('${r.memberId}','${r.groupId}',event,'${monthISO||''}')" title="${__pd>0?'Ödemeyi kaldır':'Pay tutarıyla hızlı ödeme kaydı yarat'}" style="${__pd>0?'background:#E8F5E9;color:#2E7D32;border:1px solid #2E7D32;':'background:#FFF8E1;color:#8a7b20;border:1px dashed #c9b85f;'}font-weight:600;">${__pd>0?'✅':'⬜'}</button>
          <button class="btn small pl-owner-only" onclick="openPaymentModal('${r.memberId}',null,'${r.groupId}','${monthISO||''}')" title="Bu gruba ödeme al">+ ₺</button>
          <button class="btn small secondary pl-owner-only" onclick="editPartialShare('${r.groupId}','${r.memberId}','${monthISO||''}')" title="Payın ücretini/ders sayısını düzenle">✏️</button>
          <button class="btn small secondary pl-owner-only" onclick="deletePartialShare('${r.groupId}','${r.memberId}','${monthISO||''}')" title="Pay kaydını sil">✕</button>
        </td>
      </tr>`;
    }
    // Aylık paket başlangıç tarihi düzenleme — ay seçiliyse hücre tıklanabilir
    const pkgStartLabel = r.pkgStart ? fmtDate(r.pkgStart) : '—';""")

# ---------- 7) MOBIL KART ----------
rep("""    if (!r.memberId) {
      html += `<button class="mc-card mc-empty" onclick="fillEmptySlot('${r.groupId}',${r.slotIndex})">+ BOŞ SLOT — üye eklemek için dokun</button>`;
      return;
    }""",
"""    if (!r.memberId) {
      html += `<button class="mc-card mc-empty" onclick="fillEmptySlot('${r.groupId}',${r.slotIndex})">+ BOŞ SLOT — üye eklemek için dokun</button>`;
      return;
    }
    if (r.isPartial) { // v171: ayrilan uye payi karti
      const __pd = +r.paid || 0, __fee = +r.ownPrice || 0, __kal = Math.max(0, __fee - __pd);
      const __ok = __fee > 0 ? (__pd >= __fee - 0.005) : __pd > 0;
      html += `<div class="mc-card mc-in-group" onclick="openMemberDetail('${r.memberId}')" style="background:#fbf8f1;">
        <div class="mc-top"><span class="mc-name">${escapeHtml(r.name||'')} <span class="badge" style="background:#f5f0e0;color:#8a8573;">ayrıldı · ${r.partialSessions} ders</span></span><span class="mc-status ${__ok?'ok':'due'}">${__ok?'✅ Ödendi':(__pd>0?('🟡 Kısmi '+money(__pd)+'/'+money(__fee)):'⏳ Bekliyor')}</span></div>
        <div class="mc-mid"><span>Payı <b>${money(__fee)} ₺</b></span><span>Ödenen <b>${money(__pd)} ₺</b></span><span>Kalan <b class="${__kal>0?'mc-due':''}">${money(__kal)} ₺</b></span></div>
        <div class="mc-actions" onclick="event.stopPropagation()">
          <button class="btn small pl-owner-only" onclick="openPaymentModal('${r.memberId}',null,'${r.groupId}','${monthISO||''}')">+ ₺ Ödeme</button>
          <button class="btn small pl-owner-only" onclick="togglePaidTick('${r.memberId}','${r.groupId}',event,'${monthISO||''}')">${__pd>0?'✅':'⬜'} Tik</button>
          <button class="btn small secondary pl-owner-only" onclick="editPartialShare('${r.groupId}','${r.memberId}','${monthISO||''}')">✏️ Pay</button>
          <button class="btn small secondary pl-owner-only" onclick="deletePartialShare('${r.groupId}','${r.memberId}','${monthISO||''}')">✕</button>
        </div></div>`;
      return;
    }""")

# ---------- 8) GRUP DETAYI BOLUMU ----------
rep("""      <tbody>${memberRows}</tbody>
    </table></div>
    <details open style="margin-top:12px;"><summary>Grup Ödemeleri (${groupPayments.length})</summary>""",
"""      <tbody>${memberRows}</tbody>
    </table></div>
    ${__partialSectionHtml171(g, monthISO)}
    <details open style="margin-top:12px;"><summary>Grup Ödemeleri (${groupPayments.length})</summary>""")

# ---------- 9) PRORATA FIYAT SONRAKI AYA KOPYALANMAZ (F11) ----------
rep("""    if (ov && ov.totalPrice !== undefined && ov.totalPrice !== null && ov.totalPrice !== '' && +ov.totalPrice > 0) rec.totalPrice = +ov.totalPrice;""",
"""    if (ov && ov.totalPrice !== undefined && ov.totalPrice !== null && ov.totalPrice !== '' && +ov.totalPrice > 0 && !ov.__prorata) rec.totalPrice = +ov.totalPrice; // v171: kalan-derse-gore ucret tek aylik""")
rep("""  if (ov && ov.totalPrice !== undefined && ov.totalPrice !== null && ov.totalPrice !== '' && +ov.totalPrice > 0 && !ov.__extZero && !curHas) rec.totalPrice = +ov.totalPrice; // S fiyati devam (uzama 0'i kopyalanmaz)""",
"""  if (ov && ov.totalPrice !== undefined && ov.totalPrice !== null && ov.totalPrice !== '' && +ov.totalPrice > 0 && !ov.__extZero && !ov.__prorata && !curHas) rec.totalPrice = +ov.totalPrice; // S fiyati devam (uzama 0'i ve v171 orantili ucret kopyalanmaz)""")
# uye penceresinden elle fiyat girilirse bayrak kalkar
rep("""    if (totalPrice !== null) __mm.totalPrice = totalPrice;""",
"""    if (totalPrice !== null) { __mm.totalPrice = totalPrice; __mm.__prorata = false; } // v171: elle girilen fiyat kalici (bayrak kalkar)""")

# ---------- 10) SENKRON: pay fiyati group_finance'e (F8) ----------
rep("""function sbSplitGroup(g) {
  const base = JSON.parse(JSON.stringify(g || {}));
  const fin = { customTotalPrice: base.customTotalPrice, packages: base.packages || [] };
  delete base.customTotalPrice; delete base.packages;
  return { base: base, fin: fin };
}
function sbMergeGroup(base, fin) {
  const g = JSON.parse(JSON.stringify(base || {}));
  if (fin) {
    if (fin.customTotalPrice !== undefined) g.customTotalPrice = fin.customTotalPrice;
    g.packages = fin.packages || [];
  } else { g.packages = g.packages || []; }
  return g;
}""",
"""function sbSplitGroup(g) {
  const base = JSON.parse(JSON.stringify(g || {}));
  const fin = { customTotalPrice: base.customTotalPrice, packages: base.packages || [] };
  delete base.customTotalPrice; delete base.packages;
  // v171: ayrilan uye payinin FIYATI finans tablosuna (personel gormez); ders sayisi/not temelde kalir
  if (base.monthlyPartials && typeof base.monthlyPartials === 'object') {
    const fp = {};
    for (const ay in base.monthlyPartials) {
      const arr = Array.isArray(base.monthlyPartials[ay]) ? base.monthlyPartials[ay] : [];
      arr.forEach(function(p){ if (!p || !p.memberId) return; if (p.price !== undefined && p.price !== null) { if (!fp[ay]) fp[ay] = {}; fp[ay][p.memberId] = p.price; } delete p.price; }); // F16: fiyatsiz pay fiyatsiz kalir
    }
    if (Object.keys(fp).length) fin.partialPrices = fp;
  }
  return { base: base, fin: fin };
}
function sbMergeGroup(base, fin) {
  const g = JSON.parse(JSON.stringify(base || {}));
  if (fin) {
    if (fin.customTotalPrice !== undefined) g.customTotalPrice = fin.customTotalPrice;
    g.packages = fin.packages || [];
    if (fin.partialPrices && g.monthlyPartials) { // v171
      for (const ay in fin.partialPrices) {
        const arr = Array.isArray(g.monthlyPartials[ay]) ? g.monthlyPartials[ay] : [];
        arr.forEach(function(p){ if (p && p.memberId && fin.partialPrices[ay] && fin.partialPrices[ay][p.memberId] !== undefined) p.price = fin.partialPrices[ay][p.memberId]; });
      }
    }
  } else { g.packages = g.packages || []; }
  return g;
}""")


# ---------- 12) HOCA HAKEDIS TABANI: ayrilanin payi sayilir (F12) ----------
rep("""        let __sum = 0, __n = 0;
        (l.memberIds || []).forEach(mid => { if (__roster.has(mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth); __n++; } });
        if (__n > 0) return __sum;""",
"""        // v171 (F12): o ay gruptan AYRILMIS ama PAYI olan uye (kadro disi) de tabana girer — payi/ders sayisi
        // (2.125/2 = 1.062,5). Kadro disi SIZAN uye (payi yok) yine sayilmaz (v49 emniyeti korunur).
        const __partial171 = {}; try { __partialsOf(g, l.packageMonth).forEach(function(p){ __partial171[p.memberId] = p; }); } catch(e) {}
        let __sum = 0, __n = 0;
        (l.memberIds || []).forEach(mid => {
          if (__roster.has(mid)) { __sum += memberPerLessonPrice(mid, l.packageMonth); __n++; }
          else if (__partial171[mid]) { const __p = __partial171[mid]; __sum += (+__p.sessions > 0 ? (+__p.price || 0) / +__p.sessions : memberPerLessonPrice(mid, l.packageMonth)); __n++; }
        });
        if (__n > 0) return __sum;""")

# ---------- 13) ODEME PENCERESI GRUP KILIDI: ayrilanin payi (F13) ----------
rep("""function memberGroupShare(memberId, groupId, monthISO) {
  const own = memberMonthlyTotalPrice(memberId, monthISO);""",
"""function memberGroupShare(memberId, groupId, monthISO) {
  { const __ps171 = groupId ? partialShareFor(groupId, memberId, monthISO) : null; if (__ps171) return +__ps171.price || 0; } // v171 (F13): ayrilan uyenin payi
  const own = memberMonthlyTotalPrice(memberId, monthISO);""")
rep("""  if (share) { listEl.value = share; amountEl.value = share; }
  // v123: taksit — onceki odeme varsa KALANA kilitle (ikinci taksit tek dokunus)""",
"""  if (share) { listEl.value = share; amountEl.value = share; }
  const __ps171 = partialShareFor(gid, mid, month); // v171 (F13): ayrilan uyenin payi — ders sayisi alani da payin dersi
  if (__ps171) { const __se171 = document.getElementById('mp-sessions'); if (__se171) __se171.value = +__ps171.sessions || 0; }
  // v123: taksit — onceki odeme varsa KALANA kilitle (ikinci taksit tek dokunus)""")
rep("""  if (info && g) info.textContent = `👯 ${groupDisplayName(g, (document.getElementById('mp-pkg-month')||{}).value || currentMonth())} üyesi — ${(__capL.defined > 0 && __capL.paid > 0 && __capL.kalan > 0.005) ? `tutar KALAN bakiyeye kilitli (${money(__capL.kalan)} ₺ — taksit tamamlama)` : `tutar grubun kişi başı payına kilitli (${money(share)} ₺)`}. Farklı tutar için "✏️ Farklı tutar gir" işaretle.`;""",
"""  if (info && g) info.textContent = __ps171
    ? `📎 ${groupDisplayName(g, (document.getElementById('mp-pkg-month')||{}).value || currentMonth())} — bu ay gruptan ayrılan üye; ${+__ps171.sessions || 0} ders payı. ${(__capL.defined > 0 && __capL.paid > 0 && __capL.kalan > 0.005) ? `Tutar KALAN bakiyeye kilitli (${money(__capL.kalan)} ₺ — taksit tamamlama)` : `Tutar payına kilitli (${money(share)} ₺)`}. Farklı tutar için "✏️ Farklı tutar gir" işaretle.`
    : `👯 ${groupDisplayName(g, (document.getElementById('mp-pkg-month')||{}).value || currentMonth())} üyesi — ${(__capL.defined > 0 && __capL.paid > 0 && __capL.kalan > 0.005) ? `tutar KALAN bakiyeye kilitli (${money(__capL.kalan)} ₺ — taksit tamamlama)` : `tutar grubun kişi başı payına kilitli (${money(share)} ₺)`}. Farklı tutar için "✏️ Farklı tutar gir" işaretle.`;""")

# ---------- 14) TIK / ODEME KAYDI: pay odemesi uyeyi aya geri sokmaz, ders sayisi payin dersi (F14) ----------
rep("""  const __defPrice = +memberPriceForGroupMonth(memberId, groupId || '', ay) || 0; // v171""",
"""  const __defPrice = +memberPriceForGroupMonth(memberId, groupId || '', ay) || 0; // v171
  const __psT171 = isGroup ? partialShareFor(groupId, memberId, ay) : null; // v171 (F14): ayrilan uyenin payi""")
rep("""    const __rec2 = buildPaymentRecord('', memberId, groupId||'', todayISO(), __pk0, +__pk0.sessions||8, __kal, __kal, 'Nakit', '', '', 'Tik ile kalan tahsil', false);""",
"""    const __rec2 = buildPaymentRecord('', memberId, groupId||'', todayISO(), __pk0, (__psT171 ? (+__psT171.sessions || 0) : (+__pk0.sessions||8)), __kal, __kal, 'Nakit', '', '', 'Tik ile kalan tahsil' + (__psT171 ? ' (ayrılan üye payı)' : ''), false);""")
rep("""    const sessions = +pkgObj.sessions || 8;
    const rec = buildPaymentRecord('', memberId, groupId||'', today, pkgObj, sessions, amount, amount, 'Nakit', '', '', 'Tik ile kaydedildi', false);
    rec.autoTick = true; // sonradan kaldırılabilsin diye işaretle
    rec.packageMonth = ay; // v26: tik odemesi GORUNTULENEN AYA yazilir
    if (ay >= ROSTER_START_MONTH) setMemberMonthly(memberId, ay, { enrolled: true });""",
"""    const sessions = __psT171 ? (+__psT171.sessions || 0) : (+pkgObj.sessions || 8); // v171 (F14): pay odemesinin ders sayisi payin dersi
    const rec = buildPaymentRecord('', memberId, groupId||'', today, pkgObj, sessions, amount, amount, 'Nakit', '', '', 'Tik ile kaydedildi' + (__psT171 ? ' (ayrılan üye payı)' : ''), false);
    rec.autoTick = true; // sonradan kaldırılabilsin diye işaretle
    rec.packageMonth = ay; // v26: tik odemesi GORUNTULENEN AYA yazilir
    if (ay >= ROSTER_START_MONTH && !__psT171) setMemberMonthly(memberId, ay, { enrolled: true }); // v171 (F14): pay odemesi uyeyi aya GERI SOKMAZ""")
rep("""  if (!isRefund) if (memberId && (data.packageMonth >= ROSTER_START_MONTH || ((state.members.find(x=>x.id===memberId)||{}).secondOfMember))) setMemberMonthly(memberId, data.packageMonth, { enrolled: true }); // v58: klon, odeme aldigi ayda da aktif olur""",
"""  const __isPartialPay171 = !!(groupId && partialShareFor(groupId, memberId, data.packageMonth)); // v171 (F14): ayrilan uyenin pay odemesi uyeyi aya GERI SOKMAZ
  if (!isRefund && !__isPartialPay171) if (memberId && (data.packageMonth >= ROSTER_START_MONTH || ((state.members.find(x=>x.id===memberId)||{}).secondOfMember))) setMemberMonthly(memberId, data.packageMonth, { enrolled: true }); // v58: klon, odeme aldigi ayda da aktif olur""")


# ---------- 15) KALICI UYE SILME: paylar da silinir (F17) ----------
rep("""    g.memberIds = g.memberIds.map(mid => mid === id ? '' : mid);
    while (g.memberIds.length > 0 && g.memberIds[g.memberIds.length-1] === '') g.memberIds.pop();
    if (g.memberInstructorRates) delete g.memberInstructorRates[id];
  });""",
"""    g.memberIds = g.memberIds.map(mid => mid === id ? '' : mid);
    while (g.memberIds.length > 0 && g.memberIds[g.memberIds.length-1] === '') g.memberIds.pop();
    if (g.memberInstructorRates) delete g.memberInstructorRates[id];
    if (g.monthlyPartials) for (const __ay in g.monthlyPartials) removePartialShare(g.id, id, __ay); // v171 (F17): payi da silinir
  });""")
# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.09.01.93">', '<meta name="app-version" content="2026.09.15.94">')
rep("const APP_VERSION = '2026.09.01.93';", "const APP_VERSION = '2026.09.15.94';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v170-2026-09-01-93';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v171-2026-09-15-94';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
