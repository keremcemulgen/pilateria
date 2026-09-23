# -*- coding: utf-8 -*-
# v175 — Kerem (2026-09-23): "Duygu Zabitler'i pasiften çektim, grupta çıktı, hemen bireyseli seçtim,
# yine de grup gibi görünüyor."
# KOK NEDEN 1: pasiften cikarma (reactivateMemberForMonth, v58 kanonu) uyeyi ESKI 1 kisilik grubunun
#   kadrosuna geri yazar (grup kaydi hic kapanmamisti; kadro kanonu ham listeyi gelecege tasir).
# KOK NEDEN 2: v173'un "1 kisilik (bireysel) → gercekten bireysel" donusumu YALNIZ YENI grup kaydinda
#   (!id) calisiyordu. Mevcut kaydi Duzenle'de "1 kisilik (bireysel)" secip kaydetmek 1 kisilik GRUP
#   olarak kaydediyordu — secenek etiketi yalan soyluyordu.
# KOK NEDEN 3: uygulamada 1 kisilik bir grup kaydini bireysele ceviren hicbir yol yoktu (tek cikis:
#   grubu pasife al + paketi yeniden ac = dersler/odemeler kaybi).
# COZUM: TEK CEKIRDEK convertSoloGroupToIndividual175(grup, uye, ay):
#   dersler (o ay ve sonrasi, durum korunur) → uyenin bireysel dersi; odemeler → bireysel; uye paketi
#   (hak/fiyat/baslangic/durum grubun paketinden) acilir; uye kadrodan o aydan itibaren cikar (gecmis
#   aylar sabit); grup bos kalirsa o ayin paket kaydi kalkar (cift sayim yok) ve grup o aydan itibaren
#   pasif; hic ders yoksa v173 gibi grubun gun/saatinden bireysel dersler uretilir; Geri Al kapsaminda.
#   UC GIRIS: (a) pasiften cikarmada "1 kisilik grupta gorunuyor — bireysel olsun mu?" sorusu;
#   (b) grup Duzenle: mevcut kayit + 1 kisilik + tek uye (kadroda baskasi yokken) → ayni soru
#       (Vazgec = bu kayit icin bir daha sorulmaz: keepSolo175); (c) grup detayinda "Bireysele Cevir".
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:100])
    s = s.replace(old, new)

# ---------- 1) cekirdek + UI sarmali (saveGroup'un hemen onune) ----------
rep("""function saveGroup() {
  clearModalErrors('modal-group');""",
"""// ===== v175 (Kerem 2026-09-23): 1 KISILIK GRUP KAYDINI BIREYSELE CEVIR — TEK CEKIRDEK =====
// Ay'da kadrosu TAM OLARAK bu uyeden ibaret olan (aktif) grup — pasiften cikarma sorusu icin.
function __soloGroupHolding175(memberId, ay) {
  let found = null;
  (state.groups || []).forEach(function(g){
    if (found || !g || isGroupInactiveInMonth(g, ay)) return;
    const r = activeGroupRosterForMonth(g, ay);
    if (r.length === 1 && r[0] === memberId) found = g;
  });
  return found;
}
// Personel hesabinda para tasiyan bu donusum kapali (canon: personele para sorulmaz) — v58 davranisi kalir
function __soloAllowed175() { try { return !(SUPABASE_MODE && __sbRole === 'staff'); } catch(e) { return true; } }
function __soloConfirm175(g, m, ay, ctx) {
  const nm = (m && m.name) || 'Üye';
  let gn = ''; try { gn = groupDisplayName(g, ay); } catch(e) { gn = ''; }
  gn = gn || (g && g.name) || 'Grup';
  const ayL = pkgMonthLabel(ay);
  const head = ctx === 'reactivate'
    ? ('ℹ️ «' + nm + '» ' + ayL + ' ayında «' + gn + '» adlı 1 KİŞİLİK GRUP kaydında görünüyor.\\n\\n')
    : ('👤 «' + nm + '» — "1 kişilik (bireysel)" seçildi.\\n\\n');
  return head +
    '«' + nm + '» ' + ayL + ' ayından itibaren BİREYSEL olsun mu?\\n\\n' +
    '• Tamam: grup kaydı bu aydan itibaren kapanır; bu ayın (ve sonraki ayların) dersleri, ödemeleri ve paketi üyenin kendi adına geçer (Üyeler sayfasında "Bireysel" satırı). Geçmiş aylar aynen kalır.\\n' +
    '• Vazgeç: 1 kişilik GRUP olarak kalır' + (ctx === 'edit' ? ' (bu kayıt için bir daha sorulmaz)' : '') + '.';
}
function convertSoloGroupToIndividual175(gid, memberId, ay, o) {
  const g = state.groups.find(function(x){ return x && x.id === gid; });
  const m = state.members.find(function(x){ return x && x.id === memberId; });
  if (!g || !m || !ay) return null;
  o = o || {};
  __undoSnapshot('Bireysele çevir: ' + (m.name || 'Üye') + ' — ' + ay); // v165
  const res = { name: m.name || 'Üye', group: '', ay: ay, lessons: 0, laterLessons: 0, payments: 0, pkgRemoved: false, archived: false, gen: null };
  try { res.group = groupDisplayName(g, ay) || g.name || ''; } catch(e) { res.group = g.name || ''; }
  // 1) DERSLER: bu ay ve sonrasi, bu grubun bu uyeyi iceren dersleri → uyenin bireysel dersi (tarih/saat/durum korunur)
  let firstDate = '';
  (state.lessons || []).forEach(function(l){
    if (!l || l.groupId !== gid) return;
    const pm = l.packageMonth || String(l.date || '').slice(0, 7);
    if (pm < ay) return;
    if (!(l.memberIds || []).includes(memberId)) return;
    l.groupId = ''; l.memberIds = [memberId]; l.size = 1;
    l.packageOwnerType = 'member'; l.packageOwnerId = memberId;
    if (pm === ay) { res.lessons++; if (l.status !== 'cancelled' && (!firstDate || String(l.date || '') < firstDate)) firstDate = String(l.date || ''); }
    else res.laterLessons++;
  });
  // 2) ODEMELER: bu ay ve sonrasi, bu gruba yapilan bu uyenin odemeleri → bireysel odeme (tutar/tarih ayni)
  (state.payments || []).forEach(function(p){
    if (!p || p.memberId !== memberId || (p.groupId || '') !== gid) return;
    const pm = p.packageMonth || String(p.date || '').slice(0, 7);
    if (pm < ay) return;
    p.groupId = ''; res.payments++;
  });
  // 3) UYE: bu ay kayitli + aktif; gun/saat/hoca/oran grubun varsayilanindan (uyede yoksa)
  if (m.archived && typeof unarchiveMember === 'function') unarchiveMember(memberId, ay);
  try { __closeArchivePeriodAt(m, ay); } catch(e) {}
  const gpkg = (g.packages || []).find(function(p){ return p && p.month === ay; }) || null;
  const ov = getMemberMonthlyOverride(memberId, ay) || {};
  const mm = { enrolled: true };
  const pkgId = o.packageId || ov.packageId || g.defaultPackageId || '';
  if (pkgId && !ov.packageId) mm.packageId = pkgId;
  const priceIn = (o.price !== null && o.price !== undefined && o.price !== '' && !isNaN(+o.price)) ? +o.price : null;
  if (priceIn !== null) mm.totalPrice = priceIn;
  else if ((ov.totalPrice === undefined || ov.totalPrice === null || ov.totalPrice === '') && g.customTotalPrice !== undefined && g.customTotalPrice !== null && g.customTotalPrice !== '' && +g.customTotalPrice > 0) mm.totalPrice = +g.customTotalPrice;
  if (o.note) mm.note = String(o.note);
  setMemberMonthly(memberId, ay, mm);
  const days = (o.days && o.days.length) ? o.days.slice() : ((g.defaultDays || []).slice());
  const time = o.time || g.defaultTime || '';
  const insId = o.instructorId || (gpkg && gpkg.instructorId) || g.defaultInstructorId || '';
  const mr = g.memberInstructorRates ? g.memberInstructorRates[memberId] : undefined;
  const rateG = rateDefined(mr) ? +mr : ((o.rate !== null && o.rate !== undefined && o.rate !== '' && !isNaN(+o.rate)) ? +o.rate : ((gpkg && rateDefined(gpkg.instructorShareRate)) ? +gpkg.instructorShareRate : (rateDefined(g.instructorShareRate) ? +g.instructorShareRate : null)));
  if (days.length && !(m.defaultDays || []).length) m.defaultDays = days.slice();
  if (time && !m.defaultTime) m.defaultTime = time;
  if (insId && !m.instructorId) m.instructorId = insId;
  if (rateG !== null && !rateDefined(m.instructorShareRate)) m.instructorShareRate = rateG;
  // 4) UYE PAKETI: grubun bu ayki paketi (hak/fiyat/baslangic/durum) uyeye gecer
  const price = priceIn !== null ? priceIn : (+memberPriceForGroupMonth(memberId, gid, ay) || (gpkg ? +gpkg.price : 0) || +m.totalPrice || 0);
  let quota = 0; try { quota = (gpkg && +gpkg.sessions) ? +gpkg.sessions : (+sessionQuotaFor('member', memberId, ay) || 0); } catch(e) { quota = (gpkg && +gpkg.sessions) || 0; }
  const start = (gpkg && gpkg.startDate) || firstDate || ((ay === currentMonth()) ? todayISO() : (ay + '-01'));
  if (!(m.packages || []).some(function(p){ return p && p.month === ay; })) {
    const np = createMemberPackage(m, ay, start, { sessions: quota > 0 ? quota : undefined, price: price, instructorId: insId, instructorShareRate: rateG });
    if (np && gpkg) { if (gpkg.status) np.status = gpkg.status; if (gpkg.extendedNote) np.extendedNote = gpkg.extendedNote; if (+gpkg.rescheduleUsed) np.rescheduleUsed = +gpkg.rescheduleUsed; if (+gpkg.cancelUsed) np.cancelUsed = +gpkg.cancelUsed; }
  }
  // 5) KADRO: bu aydan itibaren gruptan cikar (gecmis aylar sabit) — dersler zaten tasindi, v171 pay sorusu dogmaz
  applyRosterChange(g, ay, function(mids){ const out = mids.map(function(x){ return x === memberId ? '' : x; }); while (out.length && out[out.length - 1] === '') out.pop(); return out; });
  try { __autoNameAfterRosterChange(g, ay); } catch(e) {}
  try { syncGroupLessonsToRoster(gid, ay); } catch(e) {}
  // 6) GRUP PAKETI / KAYIT: kadro bos ve odeme yoksa bu ayin paket kaydi kalkar (cift sayim yok);
  //    hicbir ayda kadro kalmadiysa grup bu aydan itibaren pasif (gecmis aylar aynen)
  const emptyNow = activeGroupRosterForMonth(g, ay, state, true).length === 0;
  if (emptyNow && gpkg && !(+groupPaidForMonth(g, ay) > 0)) { g.packages = (g.packages || []).filter(function(p){ return p !== gpkg; }); res.pkgRemoved = true; }
  const anyLater = Object.keys(g.monthlyMembers || {}).some(function(k){ return k >= ay && (g.monthlyMembers[k] || []).some(Boolean); }) || (g.memberIds || []).some(Boolean);
  if (emptyNow && !anyLater && !g.archived) {
    g.archived = true; g.archivedAt = (ay === currentMonth()) ? todayISO() : (ay + '-01');
    (state.lessons || []).forEach(function(l){ if (l && l.groupId === gid && l.status === 'planned' && String(l.date || '').slice(0, 7) >= ay) l.status = 'cancelled'; });
    res.archived = true;
  }
  // 7) HIC DERS TASINMADIYSA: grubun gun/saatinden otomatik bireysel dersler (v173 ile ayni davranis)
  if (res.lessons === 0) {
    try { res.gen = autoGenerateMemberLessons(memberId, start, { days: days, time: time, instructorId: insId, sessionCount: quota > 0 ? quota : undefined }); } catch(e) { res.gen = null; }
  }
  save();
  return res;
}
function __soloConvertMsg175(res) {
  if (!res) return '';
  let msg = '✅ «' + res.name + '» ' + pkgMonthLabel(res.ay) + ' ayından itibaren BİREYSEL (Üyeler sayfasında "Bireysel" satırı).';
  if (res.lessons) msg += '\\n📅 Bu ayın ' + res.lessons + ' dersi üyeye taşındı' + (res.laterLessons ? ' (+ sonraki aylardan ' + res.laterLessons + ')' : '') + '.';
  else if (res.gen && res.gen.created > 0) msg += '\\n📅 ' + res.gen.created + ' ders otomatik takvime eklendi' + (res.gen.skipped ? ' (' + res.gen.skipped + ' çakışma atlandı)' : '') + '.';
  else if (res.gen && res.gen.reason === 'no-schedule') msg += '\\nℹ️ Gün/saat olmadığı için ders oluşturulmadı — üye detayından "Toplu Ders Gir" ile girebilirsin.';
  if (res.payments) msg += '\\n💳 ' + res.payments + ' ödeme kaydı üyenin bireysel ödemesi oldu.';
  if (res.archived) msg += '\\nℹ️ «' + (res.group || 'Grup') + '» grup kaydı ' + pkgMonthLabel(res.ay) + ' ayından itibaren pasife alındı (geçmiş ayları aynen duruyor).';
  msg += '\\n↩️ Gerekirse "Geri Al" ile tek adımda geri alınır.';
  return msg;
}
function __afterSoloConvert175(res, memberId, ay, opts) {
  opts = opts || {};
  try { renderMembers(); renderGroups(); renderCalendar(); renderDashboard(); } catch(e) {}
  try { refreshMemberDetailIfOpen(); refreshGroupDetailIfOpen(); } catch(e) {}
  if (opts.openDetail) { try { openMemberDetail(memberId, ay); } catch(e) {} }
  alert(__soloConvertMsg175(res));
}
// Grup detayindaki "👤 Bireysele Çevir" dugmesi
function convertSoloGroupToIndividualUI175(gid, memberId, ay) {
  const g = state.groups.find(function(x){ return x && x.id === gid; });
  const m = state.members.find(function(x){ return x && x.id === memberId; });
  if (!g || !m || !__soloAllowed175()) return;
  ay = ay || currentMonth();
  if (!confirm(__soloConfirm175(g, m, ay, 'detail'))) return;
  const res = convertSoloGroupToIndividual175(gid, memberId, ay, {});
  closeModal('modal-group-detail');
  __afterSoloConvert175(res, memberId, ay, { openDetail: true });
}
function saveGroup() {
  clearModalErrors('modal-group');""")

# ---------- 2) saveGroup: MEVCUT kayitta 1 kisilik + tek uye → donusum sorusu (v173 blogunun hemen ardina) ----------
rep("""      if (__r173 && __r173.removed && __r173.removed.groups && __r173.removed.groups.length) __msg173 += '\\nℹ️ ' + __r173.removed.groups.join(', ') + ' kaydından bu ay için çıkarıldı.';
      alert(__msg173);
      return;
    }
  }
""",
"""      if (__r173 && __r173.removed && __r173.removed.groups && __r173.removed.groups.length) __msg173 += '\\nℹ️ ' + __r173.removed.groups.join(', ') + ' kaydından bu ay için çıkarıldı.';
      alert(__msg173);
      return;
    }
  }
  // ===== v175: MEVCUT kayitta "1 kisilik (bireysel)" + tek uye (kadroda baskasi yok) → gercekten bireysele CEVIR =====
  // (Kerem: pasiften cikan uye eski 1 kisilik grubuna donuyordu; Duzenle'de "bireysel" secince kayit GRUP kaliyordu.)
  if (id && +size === 1 && memberIds.length === 1) {
    const __gS = state.groups.find(function(x){ return x && x.id === id; });
    const __ayS = (typeof window.__groupEditCtxMonth === 'string' && window.__groupEditCtxMonth) ? window.__groupEditCtxMonth : __groupOpsCtxMonth();
    const __rosterS = __gS ? activeGroupRosterForMonth(__gS, __ayS) : ['?'];
    if (__gS && !__gS.keepSolo175 && __soloAllowed175() && __rosterS.every(function(x){ return x === memberIds[0]; })) {
      const __mS = state.members.find(function(x){ return x && x.id === memberIds[0]; });
      if (__mS) {
        if (confirm(__soloConfirm175(__gS, __mS, __ayS, 'edit'))) {
          const __rS = convertSoloGroupToIndividual175(id, memberIds[0], __ayS, {
            packageId: defaultPackageId, price: (customTotalRaw === '' ? null : customTotalPrice),
            days: defaultDays, time: defaultTime, instructorId: defaultInstructorId, rate: groupRate,
            note: ((document.getElementById('mg-note') || {}).value || '').trim()
          });
          closeModal('modal-group');
          if (__modalStack.indexOf('modal-group-detail') >= 0) closeModal('modal-group-detail'); // grup artik bos/pasif — uye detayina gec
          __afterSoloConvert175(__rS, memberIds[0], __ayS, { openDetail: true });
          return;
        }
        __gS.keepSolo175 = true; // Vazgec: bu kayit bilerek 1 kisilik GRUP — bir daha sorulmaz (normal kayit devam eder)
      }
    }
  }
""")

# ---------- 3) pasiften cikarma (YALNIZ dugmeden): 1 kisilik grup kadrosuna donuyorsa sor ----------
# Programatik cagrilar (paket/grup uyandirma, ikiz klon) DOKUNULMAZ — soru yalniz kullanicinin "Aktive Et" dugmesinde.
rep("""// v10: Pasif üyeyi tek tıkla aktive et
function reactivateMember(id) {""",
"""// v175 (Kerem): "Aktive Et" DUGMESI — pasiften cikan uye ESKI 1 KISILIK grubunun kadrosuna donuyorsa sor:
// Tamam → grup kaydi o aydan itibaren kapanir, uye bireysel; Vazgec → v58 davranisi (grupta kalir).
function reactivateMemberForMonthUI175(id, month) {
  reactivateMemberForMonth(id, month);
  const m = state.members.find(function(x){ return x && x.id === id; });
  if (!m || !month) return;
  let solo = null; try { solo = __soloGroupHolding175(id, month); } catch(e) { solo = null; }
  if (!solo || solo.keepSolo175 || !__soloAllowed175()) return;
  if (!confirm(__soloConfirm175(solo, m, month, 'reactivate'))) return;
  const res = convertSoloGroupToIndividual175(solo.id, id, month, {});
  if (typeof renderArchive === 'function') renderArchive();
  __afterSoloConvert175(res, id, month, {});
}
// v10: Pasif üyeyi tek tıkla aktive et
function reactivateMember(id) {""")
rep("""onclick="reactivateMemberForMonth('${m.id}','${ay}')\"""", """onclick="reactivateMemberForMonthUI175('${m.id}','${ay}')\"""")
rep("""onclick="reactivateMemberForMonth(\\'' + m.id + '\\',\\'' + ay + '\\')\"""", """onclick="reactivateMemberForMonthUI175(\\'' + m.id + '\\',\\'' + ay + '\\')\"""")
rep("""onclick="reactivateMemberForMonth('${id}', """, """onclick="reactivateMemberForMonthUI175('${id}', """)

# ---------- 4) grup detayi: 1 kisilik kadroda "Bireysele Cevir" dugmesi ----------
rep("""      <button class="btn secondary" onclick="openGroupModal('${id}')" title="Grubu düzenle — grup detayı arka planda açık kalır">Düzenle</button>
""",
"""      <button class="btn secondary" onclick="openGroupModal('${id}')" title="Grubu düzenle — grup detayı arka planda açık kalır">Düzenle</button>
      ${(() => { try { const __ayB = monthISO || currentMonth(); const __rB = g.archived ? [] : activeGroupRosterForMonth(g, __ayB); if (__rB.length === 1) return `<button class="btn secondary pl-owner-only" onclick="convertSoloGroupToIndividualUI175('${id}','${__rB[0]}','${__ayB}')" title="Bu 1 kişilik grup kaydını bu aydan itibaren BİREYSEL birime çevir (dersler, ödemeler ve paket üyeye taşınır; geçmiş aylar aynen kalır)">👤 Bireysele Çevir</button>`; } catch(e) {} return ''; })()}
""")

# ---------- 5) surum ----------
rep('<meta name="app-version" content="2026.09.21.97">', '<meta name="app-version" content="2026.09.23.98">')
rep("const APP_VERSION = '2026.09.21.97';", "const APP_VERSION = '2026.09.23.98';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v174-2026-09-21-97'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v175-2026-09-23-98'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
