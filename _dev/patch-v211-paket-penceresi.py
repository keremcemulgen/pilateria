# -*- coding: utf-8 -*-
# v211 — PAKET PENCERESİ (Kerem 21.10): "Üyeler kısmında paket başlangıç tarihleri yanlış gözüküyor; her ay yazılan ilk ders tarihi (girildiğinde)
# paket başlangıcında öyle yazmalı; aynı şekilde bitiş tarihi de son ders tarihi (yanan + yapılan = 8 ders olduğunda)." + "Bu şekilde yeni ayda ilk
# dersi yazılmamış üye veya grup olduğunda Üyeler sayfasından kolayca anlayabilmiş olacağım."
# KERem KARARLARI (AskUserQuestion): bitiş "paket bitince" (yapılan + yanan = hak → o dersin tarihi); "30 gün kuralı öncelikli kalacak ancak son
# ders girildiğinde 30'dan az veya fazla olursa o son dersin tarihi yazılacak"; elle düzeltme "ileri tarihli veya geri tarihli olabilir, elle
# düzeltilebilir olacak ancak öncelik otomatik olarak ilk ders yazıldığında oraya gelecek".
# KÖK (ölçüldü — pkg-window-test yamasız v210'da 31 FAIL): bireysel başlangıç `memberMonthlyPackageStart` takvim ayındaki İLK dersi İPTAL dahil
# alıyordu (02.10 iptal dersi başlangıç oluyordu), ders yoksa ÖDEME tarihini; bireysel bitiş hiç yoktu. Grup başlangıcı önce PAKET KAYDININ
# tarihini alıyordu (ödemede/oluşturmada otomatik yazılır, çoğu "ayın 1'i") → dersi hiç girilmemiş grup bile 01.10 görünüyordu; bitiş her zaman
# başlangıç + 29 gündü (8. ders yapılsa da). Grup detayı kutusu ve ders penceresi de aynı eski (paket kaydı / eski grup tarihi) kaynaktan.
# ÇÖZÜM: tek kaynak `pkgWindow211(tip, id, ay, üye)`:
#  • Başlangıç = paketin İLK DERSİ (iptal hariç; planlı/yapıldı/yandı). Elle düzeltme (`packageStartDate` + yapıldığı andaki ilk ders
#    `packageStartBasis`; grup: paket kaydında `startManual/startBasis`) ilk ders o andan beri aynıysa gösterilir; ilk ders yazılınca/değişince
#    başlangıç KENDİLİĞİNDEN ilk derse geçer. Eski (işaretsiz) elle tarih yalnız paketin dersi yokken. Paket kaydının otomatik tarihi ve ödeme
#    tarihi başlangıç SAYILMAZ → dersi girilmemiş birim "—" (tabloda kırmızı, telefonda "📅 İlk ders girilmedi"). AMA önceki ayın paketi
#    bu aya PLANLI dersle sarkıyorsa (canlı veride Ekim'in "—"lerinin çoğu: Eylül paketi 27.10'a kadar sürüyor) "⏳ Eylül paketi sürüyor"
#    (soluk; eksik sayılmaz) → kırmızı "—" yalnız gerçekten ilk dersi yazılmamış birimde kalır.
#  • Bitiş = paket bittiyse (yapıldı + yandı ≥ hak → hak'ıncı dersin tarihi; ⭐ elle son ders ve planlı kalmadıysa son dersin tarihi) — 30 günden
#    kısa ya da uzun olsa da; sürüyorsa 30 GÜN KURALI (başlangıç + paket süresi − 1, soluk); başlangıç yoksa "—".
#  • Grup üyeleri grubun penceresini paylaşır (v109); üyenin kendi elle düzeltmesi önce gelir.
#  Yüzeyler: Üyeler tablosu (başlangıç hücresi tıklanınca elle düzeltme — artık grup satırında grubun ilk dersine göre; bitişte ✓ = paket bitti),
#  telefon kartları (📅 satırı — önceden tarih hiç yoktu), grup detayı kutusu ("N/8 ders · X gün kaldı" / "✅ paket bitti" / "ilk ders henüz
#  girilmedi"), ders penceresi (dersin paket ayının penceresi; eski tek grup tarihi değil). Ödeme penceresinde elle yazılan başlangıç = elle düzeltme.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:160])
    s = s.replace(old, new)

# ── 0) sürüm
rep('<meta name="app-version" content="2026.10.21.133">', '<meta name="app-version" content="2026.10.21.134">')
rep("const APP_VERSION = '2026.10.21.133';", "const APP_VERSION = '2026.10.21.134';")

# ── 1) CSS (telefon kartı tarih satırı)
rep("""    .mc-due { color:var(--bad, #d24a47) !important; }""",
    """    .mc-due { color:var(--bad, #d24a47) !important; }
    .mc-dates { font-size:12px; color:var(--muted, #697077); margin-top:5px; } /* v211 */
    .mc-gwin { font-size:12px; color:var(--muted, #697077); margin:-2px 2px 6px 12px; } /* v211 */
    .mc-dates.mc-nolesson, .mc-gwin.mc-nolesson { color:var(--bad, #d24a47); font-weight:700; } /* v211 */""")

# ── 2) TEK KAYNAK
rep("""// Üyenin o ay için paket başlangıç tarihi
function memberMonthlyPackageStart(memberId, monthISO) {""",
    r"""// ===== v211 (Kerem 21.10): PAKET PENCERESİ — TEK KAYNAK (Üyeler tablosu, telefon kartları, grup detayı, ders penceresi) =====
// Başlangıç = paketin İLK DERSİ (iptal hariç). Elle düzeltme (ileri/geri tarih) yapıldığı andaki ilk ders hâlâ aynıysa gösterilir; ilk ders
// yazılınca ya da değişince başlangıç kendiliğinden ilk derse geçer. Eski işaretsiz elle tarih yalnız ders yokken. Ders yoksa '' (Üyeler'de "—").
// Bitiş = paket BİTTİYSE (yapıldı + yandı ≥ hak, ya da ⭐ son ders + planlı kalmadı) o son dersin tarihi; sürüyorsa 30 gün kuralı.
function __pkgLessons211(ownerType, ownerId, ay) {
  const key = function(l){ return String(l.date || '') + 'T' + String(l.time || '') + '|' + String(l.id || ''); };
  return (state.lessons || []).filter(function(l){
    if (!l || l.status === 'cancelled' || !l.date) return false;
    if ((l.packageMonth || String(l.date || '').slice(0, 7)) !== ay) return false;
    return ownerType === 'group' ? l.groupId === ownerId : (!l.groupId && (l.memberIds || []).includes(ownerId));
  }).sort(function(a, b){ const ka = key(a), kb = key(b); return ka < kb ? -1 : (ka > kb ? 1 : 0); });
}
function __pkgManualPick211(date, basis, first) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return '';
  if (basis === undefined || basis === null) return first ? '' : String(date); // eski (v211 öncesi) elle tarih: ilk ders yazıldıysa ilk ders öncelikli
  return String(basis) === String(first || '') ? String(date) : '';           // düzeltmeden sonra ilk ders değişmediyse elle tarih
}
function pkgWindow211(ownerType, ownerId, ay, memberId) {
  const w = { start: '', end: '', startSrc: '', endSrc: '', first: '', quota: 0, done: 0, planned: 0, finished: false, prevPm: '', prevLast: '' };
  if (!ownerId || !ay) return w;
  try {
    const ls = __pkgLessons211(ownerType, ownerId, ay);
    w.first = ls.length ? ls[0].date : '';
    let man = '';
    const mid = memberId || (ownerType === 'member' ? ownerId : '');
    if (mid) { const ov = getMemberMonthlyOverride(mid, ay) || {}; man = __pkgManualPick211(ov.packageStartDate, ov.packageStartBasis, w.first); }
    if (!man && ownerType === 'group') {
      const g = (state.groups || []).find(function(x){ return x && x.id === ownerId; });
      const pk = g && (g.packages || []).find(function(p){ return p && p.month === ay; });
      if (pk && pk.startManual) man = __pkgManualPick211(pk.startDate, pk.startBasis, w.first);
    }
    w.start = man || w.first; w.startSrc = man ? 'manual' : (w.first ? 'lesson' : '');
    const quota = +sessionQuotaFor(ownerType, ownerId, ay) || 0; w.quota = quota;
    const doneLs = ls.filter(function(l){ return l.status !== 'planned'; }); // yapıldı + yandı (sessionsFinishState ile aynı sayım)
    w.done = doneLs.length; w.planned = ls.length - doneLs.length;
    let fin = '';
    if (quota > 0 && doneLs.length >= quota) fin = doneLs[quota - 1].date;
    else if (doneLs.length && w.planned === 0 && __pkgClosedEarlyLesson(ownerType, ownerId, ay)) fin = doneLs[doneLs.length - 1].date; // v108 ⭐ erken kapandı
    if (fin) { w.finished = true; w.end = fin; w.endSrc = 'done'; }
    else if (w.start) { const days = +((state.settings || {}).groupPackageDays) || 30; w.end = addDaysISO(w.start, days - 1); w.endSrc = '30gun'; }
    if (!w.start) { // önceki ayın paketi bu aya PLANLI dersle sarkıyor mu → "⏳ Eylül paketi sürüyor" (eksik değil; kırmızı "—" yalnız gerçek eksik)
      let pp = '';
      (state.lessons || []).forEach(function(l){
        if (!l || l.status !== 'planned' || !l.date || String(l.date) < ay + '-01') return;
        const pm = l.packageMonth || String(l.date).slice(0, 7);
        if (!(pm < ay) || pm <= pp) return;
        if (ownerType === 'group' ? l.groupId === ownerId : (!l.groupId && (l.memberIds || []).includes(ownerId))) pp = pm;
      });
      if (pp) { w.prevPm = pp; __pkgLessons211(ownerType, ownerId, pp).forEach(function(l){ if (String(l.date) > w.prevLast) w.prevLast = String(l.date); }); }
    }
  } catch(e) {}
  return w;
}
// Elle düzeltme yazımı (Üyeler hücresi / ödeme penceresi / grup detayı): o anki ilk ders saklanır
function __pkgMarkManual211(ownerType, ownerId, ay, date, memberId) {
  if (!ownerId || !ay || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return false;
  const first = (__pkgLessons211(ownerType, ownerId, ay)[0] || {}).date || '';
  if (ownerType === 'group') {
    const g = (state.groups || []).find(function(x){ return x && x.id === ownerId; });
    const pk = g && (g.packages || []).find(function(p){ return p && p.month === ay; });
    if (!pk) return false;
    pk.startDate = String(date); pk.startManual = true; pk.startBasis = first; pk.startAt = Date.now();
    return true;
  }
  setMemberMonthly(memberId || ownerId, ay, { packageStartDate: String(date), packageStartBasis: first, packageStartAt: Date.now() });
  return true;
}
// Üyeler tablosu bitiş hücresi: ✓ = paket bitti (son dersin tarihi); soluk = 30 gün kuralı (sürüyor)
function __pkgEndCell211(r, monthISO) {
  if (!r || !r.pkgEnd) return '<td>—</td>';
  if (!monthISO) return '<td>' + fmtDate(r.pkgEnd) + '</td>';
  if (r.pkgDone211) return '<td title="Paket bitti — yapılan + yanan dersler hakkı doldurdu; son dersin tarihi"><b>' + fmtDate(r.pkgEnd) + '</b> <span style="color:var(--ok);">✓</span></td>';
  return '<td style="color:#8a8573;" title="30 gün kuralı — paket bitince (yapılan + yanan = hak) son dersin tarihi yazılır">' + fmtDate(r.pkgEnd) + '</td>';
}
// Telefon kartı / grup başlığı tarih satırı
function __mcDates211(w, cls) {
  if (!w) return '';
  if (!w.start && w.prevPm) return '<div class="' + cls + ' mc-prevrun">⏳ ' + (pkgMonthLabel(w.prevPm) || w.prevPm) + ' paketi sürüyor' + (w.prevLast ? ' (son ders ' + fmtDate(w.prevLast) + ')' : '') + '</div>';
  if (!w.start) return '<div class="' + cls + ' mc-nolesson">📅 İlk ders girilmedi</div>';
  return '<div class="' + cls + '">📅 ' + fmtDate(w.start) + ' – ' + (w.end ? fmtDate(w.end) + (w.finished ? ' ✓' : '') : '—') + (w.startSrc === 'manual' ? ' ✎' : '') + '</div>';
}
// Üyenin o ay için paket başlangıç tarihi
function memberMonthlyPackageStart(memberId, monthISO) {""")

# ── 3) Üyeler satırları
rep("""    // Aylık paket başlangıç tarihi: override → o ayın ilk ders/ödeme tarihi → joinDate (sadece ay seçili değilse)
    const pkgStart = monthISO
      ? memberMonthlyPackageStart(m.id, monthISO)
      : (latestPay ? latestPay.date : (m.joinDate||''));
    rows.push({
      memberId: m.id, name: m.name,
      groupId: '', groupName: '',
      isFirstInGroup: false,
      groupMemberCount: 0,
      pkgStart: pkgStart,
      pkgEnd: '',""",
    """    // v211 (Kerem): paket penceresi TEK KAYNAK — başlangıç ilk ders (ders yoksa '—'), bitiş 30 gün kuralı / paket bitince son ders
    const __w211 = monthISO ? pkgWindow211('member', m.id, monthISO, m.id) : null;
    const pkgStart = monthISO
      ? __w211.start
      : (latestPay ? latestPay.date : (m.joinDate||''));
    rows.push({
      memberId: m.id, name: m.name,
      groupId: '', groupName: '',
      isFirstInGroup: false,
      groupMemberCount: 0,
      pkgStart: pkgStart,
      pkgEnd: __w211 ? __w211.end : '',
      pkgDone211: !!(__w211 && __w211.finished), pkgManual211: !!(__w211 && __w211.startSrc === 'manual'), pkgWin211: __w211,""")
rep("""      // v109 (Kerem): GRUP uyesinin paket penceresi = GRUBUN penceresi — TUM uyelerde AYNI tarih.
      // Oncelik: uyenin ELLE override'i -> grubun o ay paket baslangici -> grubun o ayin (pm) ilk dersi -> uyenin odemesi.
      const __ovStart = monthISO ? (((getMemberMonthlyOverride(mid, monthISO)) || {}).packageStartDate || '') : '';
      const __gPkgStart = monthISO ? (((((g.packages || []).find(pp => pp && pp.month === monthISO))) || {}).startDate || '') : '';
      const __gFirstLesson = monthISO ? (((state.lessons.filter(l => l && l.groupId === g.id && l.status !== 'cancelled' && ((l.packageMonth || String(l.date || '').slice(0, 7)) === monthISO) && l.date).sort((a, b) => a.date.localeCompare(b.date))[0]) || {}).date || '') : '';
      const memberStart = monthISO
        ? (__ovStart || __gPkgStart || __gFirstLesson || (latestPay ? latestPay.date : ''))
        : (m.joinDate || g.packageStartDate || (latestPay ? latestPay.date : ''));
      const pkgDays = state.settings.groupPackageDays || 30;
      const memberEnd = memberStart ? addDaysISO(memberStart, pkgDays-1) : '';""",
    """      // v109 (Kerem): GRUP uyesinin paket penceresi = GRUBUN penceresi — TUM uyelerde AYNI tarih.
      // v211 (Kerem): tek kaynak pkgWindow211 — uyenin elle duzeltmesi > grubun elle duzeltmesi > grubun o ayin ILK DERSI; ders yoksa '—'
      // (paket kaydinin otomatik tarihi / odeme tarihi baslangic SAYILMAZ); bitis 30 gun kurali, paket bitince son dersin tarihi.
      const __w211 = monthISO ? pkgWindow211('group', g.id, monthISO, mid) : null;
      const pkgDays = state.settings.groupPackageDays || 30;
      const memberStart = monthISO
        ? __w211.start
        : (m.joinDate || g.packageStartDate || (latestPay ? latestPay.date : ''));
      const memberEnd = monthISO ? __w211.end : (memberStart ? addDaysISO(memberStart, pkgDays-1) : '');""")
rep("""        pkgStart: memberStart,
        pkgEnd: memberEnd,""",
    """        pkgStart: memberStart,
        pkgEnd: memberEnd,
        pkgDone211: !!(__w211 && __w211.finished), pkgManual211: !!(__w211 && __w211.startSrc === 'manual'), pkgWin211: __w211,""")

# ── 4) Üyeler tablosu hücreleri
rep("""    // Aylık paket başlangıç tarihi düzenleme — ay seçiliyse hücre tıklanabilir
    const pkgStartLabel = r.pkgStart ? fmtDate(r.pkgStart) : '—';
    const pkgStartCell = monthISO
      ? `<td onclick="event.stopPropagation();editMonthlyPackageStart('${r.memberId}','${monthISO}')" style="cursor:pointer;text-decoration:underline dotted;color:#2e7d32;" title="Tıkla — bu ay için paket başlangıç tarihini düzenle">${pkgStartLabel}</td>`
      : `<td>${pkgStartLabel}</td>`;""",
    """    // Aylık paket başlangıç tarihi düzenleme — ay seçiliyse hücre tıklanabilir
    // v211: başlangıç = ilk ders; ders yoksa KIRMIZI "—" (yeni ayda ilk dersi yazılmamış birim hemen görünür); ✎ = elle düzeltilmiş;
    //       önceki ayın paketi bu aya planlı dersle sarkıyorsa soluk "⏳ Eylül paketi sürüyor" (eksik değil)
    const __prev211 = (!r.pkgStart && monthISO && r.pkgWin211 && r.pkgWin211.prevPm) ? r.pkgWin211 : null;
    const pkgStartLabel = r.pkgStart
      ? fmtDate(r.pkgStart) + (r.pkgManual211 ? ' <small title="Elle düzeltilmiş başlangıç — ilk ders yazılınca ya da değişince ilk derse geçer">✎</small>' : '')
      : (monthISO ? (__prev211 ? '<span class="pkg-prevrun" style="color:#8a8573;font-size:12px;">⏳ ' + (pkgMonthLabel(__prev211.prevPm) || __prev211.prevPm) + ' paketi sürüyor</span>' : '<span class="pkg-nolesson" style="color:#c62828;font-weight:700;">—</span>') : '—');
    const __startTitle211 = r.pkgStart ? (r.pkgManual211 ? 'Elle düzeltilmiş başlangıç' : 'İlk dersin tarihi')
      : (__prev211 ? ((pkgMonthLabel(__prev211.prevPm) || __prev211.prevPm) + ' paketi sürüyor' + (__prev211.prevLast ? ' (son ders ' + fmtDate(__prev211.prevLast) + ')' : '') + '; bu ayın paketi ilk dersi yazılınca başlar') : 'Bu ayın paketine henüz ders girilmedi');
    const pkgStartCell = monthISO
      ? `<td onclick="event.stopPropagation();editMonthlyPackageStart('${r.memberId}','${monthISO}','${r.groupId||''}')" style="cursor:pointer;text-decoration:underline dotted;color:#2e7d32;" title="${__startTitle211} — tıkla: bu ay için başlangıcı elle düzelt">${pkgStartLabel}</td>`
      : `<td>${pkgStartLabel}</td>`;""")
rep("""      ${pkgStartCell}
      <td>${r.pkgEnd ? fmtDate(r.pkgEnd) : '—'}</td>""",
    """      ${pkgStartCell}
      ${__pkgEndCell211(r, monthISO)}""")

# ── 5) Telefon kartları
rep("""        <span class="mc-gsum ${gRem>0?'due':'ok'}">${gRem>0 ? 'Kalan ' + money(gRem) + ' ₺' : (r.groupFullyPaid ? '✅ Ödendi' : '')}</span>
      </div>`;""",
    """        <span class="mc-gsum ${gRem>0?'due':'ok'}">${gRem>0 ? 'Kalan ' + money(gRem) + ' ₺' : (r.groupFullyPaid ? '✅ Ödendi' : '')}</span>
      </div>` + (monthISO ? __mcDates211(pkgWindow211('group', r.groupId, monthISO), 'mc-gwin') : ''); // v211: grubun paket penceresi""")
rep("""      <div class="mc-mid">
        <span>Ücret <b>${money(fee)} ₺</b></span>
        <span>Ödenen <b>${money(paid)} ₺</b></span>
        <span>Kalan <b class="${__kalanTL>0?'mc-due':''}">${money(__kalanTL)} ₺</b></span>
      </div>""",
    """      <div class="mc-mid">
        <span>Ücret <b>${money(fee)} ₺</b></span>
        <span>Ödenen <b>${money(paid)} ₺</b></span>
        <span>Kalan <b class="${__kalanTL>0?'mc-due':''}">${money(__kalanTL)} ₺</b></span>
      </div>${(monthISO && (r.type !== 'group' || r.pkgManual211)) ? __mcDates211(r.pkgWin211, 'mc-dates') : ''}""")

# ── 6) Üyeler hücresinden elle düzeltme: o anki ilk ders saklanır; boş = elle tarih silinir
rep("""async function editMonthlyPackageStart(memberId, monthISO) {
  const m = state.members.find(x=>x.id===memberId);
  if (!m) return;
  const cur = memberMonthlyPackageStart(memberId, monthISO) || '';""",
    """async function editMonthlyPackageStart(memberId, monthISO, groupId) {
  const m = state.members.find(x=>x.id===memberId);
  if (!m) return;
  // v211: satırın birimi (grup satırı → grubun penceresi; bireysel → üyenin) — gösterilen başlangıçla aynı kaynak
  const __gid211 = (groupId === undefined || groupId === null) ? (function(){ try { const gg = memberActiveGroupForMonth(memberId, monthISO); return gg ? gg.id : ''; } catch(e) { return ''; } })() : String(groupId || '');
  const __w211 = __gid211 ? pkgWindow211('group', __gid211, monthISO, memberId) : pkgWindow211('member', memberId, monthISO, memberId);
  const cur = __w211.start || '';""")
rep("""    `"${m.name}" — ${monthLabel} paket başlangıç tarihi (YYYY-AA-GG):\\n\\n` +
    (cur ? `Mevcut: ${cur}\\n` : '(şu an boş)\\n') +
    `\\n• Boş bırakıp Tamam → o ay özel tarih silinir (otomatik türetmeye döner)\\n` +
    `• Tarih gir → bu ay için manuel tarih (örn. 2026-05-08)`,""",
    """    `"${m.name}" — ${monthLabel} paket başlangıç tarihi (YYYY-AA-GG):\\n\\n` +
    (__w211.first ? `İlk ders: ${fmtDate(__w211.first)}\\n` : 'Bu ayın paketine henüz ders girilmedi.\\n') +
    (__w211.startSrc === 'manual' ? `Şu an elle düzeltilmiş: ${fmtDate(__w211.start)}\\n` : '') +
    `\\n• Tarih gir → bu ay için elle başlangıç (ileri ya da geri tarih olabilir). İlk ders sonradan yazılır ya da değişirse başlangıç kendiliğinden ilk derse geçer.\\n` +
    `• Boş bırakıp Tamam → elle tarih silinir (ilk dersin tarihi gösterilir)`,""")
rep("""  if (trimmed === '') {
    // Override'ı sil
    if (m.monthly && m.monthly[monthISO]) {
      delete m.monthly[monthISO].packageStartDate;""",
    """  if (trimmed === '') {
    // Override'ı sil
    if (m.monthly && m.monthly[monthISO]) {
      if (m.monthly[monthISO].packageStartDate) __undoSnapshot('Paket başlangıcı: ' + (m.name || 'Üye') + ' — ' + monthISO); // v211
      delete m.monthly[monthISO].packageStartDate;
      delete m.monthly[monthISO].packageStartBasis; delete m.monthly[monthISO].packageStartAt; // v211""")
rep("""    if (!trimmed.startsWith(monthISO)) {
      if (!(await plConfirm(`Girdiğin tarih (${trimmed}) seçili ay (${monthISO}) içinde değil. Yine de kaydedeyim mi?`))) return;
    }
    setMemberMonthly(memberId, monthISO, { packageStartDate: trimmed });""",
    """    if (!trimmed.startsWith(monthISO)) {
      if (!(await plConfirm(`Girdiğin tarih (${trimmed}) seçili ay (${monthISO}) içinde değil. Yine de kaydedeyim mi?`))) return;
    }
    __undoSnapshot('Paket başlangıcı: ' + (m.name || 'Üye') + ' — ' + monthISO); // v211
    setMemberMonthly(memberId, monthISO, { packageStartDate: trimmed, packageStartBasis: __w211.first || '', packageStartAt: Date.now() }); // v211: o anki ilk ders""")

# ── 7) Grup detayı: elle düzeltme işaretli; boş = elle tarih silinir
rep("""  const cur = pk.startDate || (monthISO + '-01');
  const ans = await plPrompt(`${monthISO} paketinin başlangıç tarihi (YYYY-AA-GG):\\n(Sadece bu ayın paketi değişir; diğer aylar etkilenmez.)`, cur, { placeholder: 'YYYY-AA-GG' });
  if (ans === null) return;
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(ans.trim())) { alert('Geçersiz tarih. Örn: ' + monthISO + '-05'); return; }
  pk.startDate = ans.trim();""",
    """  const __w211 = pkgWindow211('group', groupId, monthISO); // v211: gösterilen başlangıç tek kaynaktan
  const cur = __w211.start || pk.startDate || (monthISO + '-01');
  const ans = await plPrompt(`${monthISO} paketinin başlangıç tarihi (YYYY-AA-GG):\\n(Sadece bu ayın paketi değişir; diğer aylar etkilenmez.)\\n\\n` + (__w211.first ? 'İlk ders: ' + fmtDate(__w211.first) : 'Bu ayın paketine henüz ders girilmedi.') + '\\nElle tarih (ileri/geri olabilir) — ilk ders sonradan yazılır ya da değişirse başlangıç kendiliğinden ilk derse geçer.\\nBoş bırakıp Tamam → elle tarih silinir.', cur, { placeholder: 'YYYY-AA-GG' });
  if (ans === null) return;
  if (String(ans).trim() === '') { __undoSnapshot('Grup paket başlangıcı: ' + (groupDisplayName(g, monthISO) || g.name || 'Grup') + ' — ' + monthISO); delete pk.startManual; delete pk.startBasis; delete pk.startAt; save(); refreshGroupDetailIfOpen(); renderMembers(); renderDashboard(); return; } // v211
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(ans.trim())) { alert('Geçersiz tarih. Örn: ' + monthISO + '-05'); return; }
  __undoSnapshot('Grup paket başlangıcı: ' + (groupDisplayName(g, monthISO) || g.name || 'Grup') + ' — ' + monthISO); // v211
  __pkgMarkManual211('group', groupId, monthISO, ans.trim()); // v211: o anki ilk ders saklanır""")

# ── 8) Grup detayı kutusu: tek kaynak
rep("""  const __days = state.settings.groupPackageDays || 30;
  const __mpStart = __mp && __mp.startDate ? __mp.startDate : '';
  const pkgEnd = __mpStart ? addDaysISO(__mpStart, __days-1) : (monthISO ? null : groupPackageEnd(g));
  const pkgActive = __mpStart ? (todayISO() <= pkgEnd) : (monthISO ? false : groupPackageActive(g));
  const pkgLeft = (__mpStart && pkgEnd) ? Math.max(0, Math.round((parseISO(pkgEnd) - parseISO(todayISO()))/86400000)) : (monthISO ? 0 : groupPackageDaysLeft(g));
  const __pkgStartShown = monthISO ? __mpStart : g.packageStartDate;
  const pkgBox = __pkgStartShown
    ? `<div style="padding:8px 12px;background:${pkgActive?'#e8f0e0':'#ffebee'};border-radius:6px;margin:8px 0;font-size:13px;">
         📦 <b>${monthISO ? monthISO + ' Paketi:' : 'Paket:'}</b> ${fmtDate(__pkgStartShown)} – ${pkgEnd ? fmtDate(pkgEnd) : '—'}
         ${pkgActive ? `· <span style="color:var(--ok)"><b>${pkgLeft} gün kaldı</b></span>` : (monthISO && pkgEnd && todayISO() > pkgEnd ? `· <span style="color:var(--bad)"><b>süresi doldu</b></span>` : '')}
         <br>🔄 Saat değişikliği: <b>${rUsed}/${rLimit}</b> &nbsp;·&nbsp; 🚫 İptal: <b>${cUsed}/${cLimit}</b>
         ${monthISO ? `<br><button class="btn small secondary" style="margin-top:6px" onclick="editGroupPkgStart('${id}','${monthISO}')">📆 ${monthISO} Paket Başlangıcını Düzenle</button>` : `<br><button class="btn small secondary" style="margin-top:6px" onclick="resetGroupPackage('${id}')">📆 Paketi Yenile (rights sıfırla)</button>`}
       </div>`
    : `<div style="padding:8px 12px;background:#fff3e0;border-radius:6px;margin:8px 0;font-size:13px;">
         ⚠️ <b>${monthISO ? monthISO + ' ayı için paket kaydı yok.' : 'Paket başlangıç tarihi yok.'}</b> ${monthISO ? 'Bu aya ödeme alındığında otomatik oluşur (başlangıç: elle girilen > ilk ders > ayın 1\\'i).' : 'Gruba ilk ödeme alındığında otomatik atanır, ya da manuel başlat:'}
         ${monthISO ? '' : `<button class="btn small" style="margin-left:8px" onclick="startGroupPackage('${id}')">▶️ Paketi Bugün Başlat</button>`}
       </div>`;""",
    """  const __days = state.settings.groupPackageDays || 30;
  // v211 (Kerem): AYIN paket penceresi tek kaynaktan — başlangıç ilk ders (elle düzeltme), bitiş 30 gün kuralı / paket bitince son ders
  const __w211 = monthISO ? pkgWindow211('group', id, monthISO) : null;
  const __mpStart = __w211 ? __w211.start : '';
  const pkgEnd = __w211 ? (__w211.end || null) : groupPackageEnd(g);
  const pkgActive = __w211 ? !!(__w211.start && !__w211.finished && __w211.end && todayISO() <= __w211.end) : groupPackageActive(g);
  const pkgLeft = (__w211 && pkgActive) ? Math.max(0, Math.round((parseISO(__w211.end) - parseISO(todayISO()))/86400000)) : (monthISO ? 0 : groupPackageDaysLeft(g));
  const __pkgStartShown = monthISO ? __mpStart : g.packageStartDate;
  const __pkLbl211 = monthISO ? (pkgMonthLabel(monthISO) || monthISO) : '';
  const __pkStatus211 = __w211
    ? (__w211.finished
        ? `· <span style="color:var(--ok)"><b>✅ paket bitti (${__w211.done}/${__w211.quota} ders)</b></span>`
        : `· ${__w211.done}/${__w211.quota} ders` + (pkgActive ? ` · <span style="color:var(--ok)"><b>${pkgLeft} gün kaldı</b></span>` : ((pkgEnd && todayISO() > pkgEnd) ? ` · <span style="color:var(--bad)"><b>süresi doldu</b></span>` : '')))
    : (pkgActive ? `· <span style="color:var(--ok)"><b>${pkgLeft} gün kaldı</b></span>` : '');
  const __pkEditBtn211 = monthISO ? (__mp ? `<br><button class="btn small secondary" style="margin-top:6px" onclick="editGroupPkgStart('${id}','${monthISO}')">📆 ${monthISO} Paket Başlangıcını Düzenle</button>` : '') : `<br><button class="btn small secondary" style="margin-top:6px" onclick="resetGroupPackage('${id}')">📆 Paketi Yenile (rights sıfırla)</button>`;
  const pkgBox = __pkgStartShown
    ? `<div style="padding:8px 12px;background:${(__w211 && __w211.finished) ? '#eef3f7' : (pkgActive?'#e8f0e0':'#ffebee')};border-radius:6px;margin:8px 0;font-size:13px;">
         📦 <b>${monthISO ? __pkLbl211 + ' Paketi:' : 'Paket:'}</b> ${fmtDate(__pkgStartShown)} – ${pkgEnd ? fmtDate(pkgEnd) : '—'}
         ${__pkStatus211}
         ${(__w211 && __w211.startSrc === 'manual') ? '<br><small style="color:var(--muted)">✎ başlangıç elle düzeltildi — ilk ders yazılınca ya da değişince ilk derse geçer</small>' : ''}
         <br>🔄 Saat değişikliği: <b>${rUsed}/${rLimit}</b> &nbsp;·&nbsp; 🚫 İptal: <b>${cUsed}/${cLimit}</b>
         ${__pkEditBtn211}
       </div>`
    : (monthISO
      ? `<div style="padding:8px 12px;background:${(__w211 && __w211.prevPm) ? '#f4f1e8' : '#fff3e0'};border-radius:6px;margin:8px 0;font-size:13px;">
         📦 <b>${__pkLbl211} Paketi:</b> ${(__w211 && __w211.prevPm)
           ? `<span style="font-weight:600;">⏳ ${pkgMonthLabel(__w211.prevPm) || __w211.prevPm} paketi sürüyor${__w211.prevLast ? ' (son ders ' + fmtDate(__w211.prevLast) + ')' : ''}</span> — ${__pkLbl211} paketi ilk dersiyle başlar.`
           : `<span style="color:var(--bad);font-weight:700;">ilk ders henüz girilmedi</span> — başlangıç ilk dersin tarihi olur.`}
         <br>🔄 Saat değişikliği: <b>${rUsed}/${rLimit}</b> &nbsp;·&nbsp; 🚫 İptal: <b>${cUsed}/${cLimit}</b>
         ${__pkEditBtn211}
       </div>`
      : `<div style="padding:8px 12px;background:#fff3e0;border-radius:6px;margin:8px 0;font-size:13px;">
         ⚠️ <b>Paket başlangıç tarihi yok.</b> Gruba ilk ödeme alındığında otomatik atanır, ya da manuel başlat:
         <button class="btn small" style="margin-left:8px" onclick="startGroupPackage('${id}')">▶️ Paketi Bugün Başlat</button>
       </div>`);""")

# ── 9) Ders penceresi: dersin paket ayının penceresi (eski tek grup tarihi değil)
rep("""        const pkgInfo = g.packageStartDate
          ? `📦 Paket: ${fmtDate(g.packageStartDate)} – ${fmtDate(groupPackageEnd(g))} (${groupPackageDaysLeft(g)} gün kaldı)`
          : `📦 Paket başlangıç tarihi yok (ilk ödemede otomatik atanır).`;""",
    """        const __pmL211 = __plLessonMonth(l); const __wl211 = __pmL211 ? pkgWindow211('group', g.id, __pmL211) : null; // v211: dersin paket ayının penceresi
        const pkgInfo = (__wl211 && __wl211.start)
          ? `📦 ${pkgMonthLabel(__pmL211)} paketi: ${fmtDate(__wl211.start)} – ${__wl211.end ? fmtDate(__wl211.end) : '—'}` + (__wl211.finished ? ` (✅ bitti, ${__wl211.done}/${__wl211.quota} ders)` : ` (${__wl211.done}/${__wl211.quota} ders` + ((__wl211.end && todayISO() <= __wl211.end) ? `, ${Math.max(0, Math.round((parseISO(__wl211.end) - parseISO(todayISO()))/86400000))} gün kaldı)` : ', 30 günlük süre doldu)'))
          : `📦 ${__pmL211 ? pkgMonthLabel(__pmL211) + ' paketine' : 'Pakete'} henüz ders girilmedi.`;""")

# ── 10) Ödeme penceresinde elle yazılan başlangıç = elle düzeltme (tek üye + toplu)
rep("""      if (mm && !(mm.packages||[]).find(p => p.month === data.packageMonth)) {
        createMemberPackage(mm, data.packageMonth, __pkgStart, { sessions, price: amount });
      }
    }
  }""",
    """      if (mm && !(mm.packages||[]).find(p => p.month === data.packageMonth)) {
        createMemberPackage(mm, data.packageMonth, __pkgStart, { sessions, price: amount });
      }
    }
  }
  try { const __typed211 = ((document.getElementById('mp-pkg-start') || {}).value || '').trim(); if (__typed211 && !id && !isRefund) __pkgMarkManual211(groupId ? 'group' : 'member', groupId || memberId, data.packageMonth, __typed211, memberId); } catch(e) {} // v211""")
rep("""  if (!(g.packages||[]).find(p => p.month === packageMonth)) {
    createGroupPackage(g, packageMonth, __pkgStartAll, { sessions: __groupPkgSessions172(document.getElementById('mp-member').value, groupId, packageMonth, sessions) }); // v172: uyeye ozel hak grubun paketine karismaz
  }""",
    """  if (!(g.packages||[]).find(p => p.month === packageMonth)) {
    createGroupPackage(g, packageMonth, __pkgStartAll, { sessions: __groupPkgSessions172(document.getElementById('mp-member').value, groupId, packageMonth, sessions) }); // v172: uyeye ozel hak grubun paketine karismaz
  }
  try { const __typedA211 = ((document.getElementById('mp-pkg-start') || {}).value || '').trim(); if (__typedA211) __pkgMarkManual211('group', groupId, packageMonth, __typedA211); } catch(e) {} // v211""")
rep("""<label>Paket Başlangıç Tarihi <small style="color:var(--muted);font-weight:400;">— opsiyonel; boşsa ilk ders / ayın 1'i</small></label>""",
    """<label>Paket Başlangıç Tarihi <small style="color:var(--muted);font-weight:400;">— opsiyonel; boşsa ilk dersin tarihi (ilk ders yazılınca ona geçer)</small></label>""")

# ── 11) ÖDEME GECİKMESİ (Kerem 21.10: "Ödeme gecikmesi de buna göre düzenlenmeli"): vade = PAKET BAŞLANGICI (pkgWindow211) —
#        ilk ders; elle düzeltildiyse elle tarih (ileri tarih → vade ileri; geri tarih → gecikme o günden). Ders yok + elle tarih yok → vade yok.
rep("""  // Vadesi gelmis + borclu aylari sec (fiyat tanimsizsa BORC UYDURULMAZ)""",
    """  // v211 (Kerem 21.10): VADE = PAKET BAŞLANGICI (pkgWindow211 — Üyeler sayfasıyla aynı kaynak): ilk ders; elle düzeltildiyse elle tarih.
  // Dersi olmayan ayda yalnız elle başlangıç varsa o ay da vadelidir (elle "paket başladı" demek). Elle tarih yoksa davranış eskisiyle aynı.
  function __ovStarts211(ownerType, ownerId, map, extraMonths) {
    const out = {};
    Object.keys(map).concat(extraMonths || []).forEach(ay => {
      if (!ay || out[ay]) return;
      let st = map[ay] || '';
      try { const w = pkgWindow211(ownerType, ownerId, ay); if (w.start) st = w.start; } catch(e) {}
      if (st) out[ay] = st;
    });
    return out;
  }
  // Vadesi gelmis + borclu aylari sec (fiyat tanimsizsa BORC UYDURULMAZ)""")
rep("""    const gLessons = __gLes.get(g.id) || [];
    if (!gLessons.length) return;
    const rows = __ovRows(__ovMonths(gLessons),""",
    """    const gLessons = __gLes.get(g.id) || [];
    const __gMan211 = (g.packages || []).filter(p => p && p.startManual && p.month).map(p => p.month); // v211: elle başlangıç
    if (!gLessons.length && !__gMan211.length) return;
    const rows = __ovRows(__ovStarts211('group', g.id, __ovMonths(gLessons), __gMan211),""")
rep("""    const mLessons = __mLes.get(m.id) || [];
    if (!mLessons.length) return;
    const rows = __ovRows(__ovMonths(mLessons),""",
    """    const mLessons = __mLes.get(m.id) || [];
    const __mMan211 = Object.keys(m.monthly || {}).filter(ay => m.monthly[ay] && m.monthly[ay].packageStartDate); // v211: elle başlangıç
    if (!mLessons.length && !__mMan211.length) return;
    const rows = __ovRows(__ovStarts211('member', m.id, __ovMonths(mLessons), __mMan211),""")
rep("""<th>Üye / Grup</th><th>İlk Ders</th><th>Beklenen</th>""",
    """<th>Üye / Grup</th><th title="Ödeme vadesi = paket başlangıcı (ilk ders; elle düzeltildiyse o tarih)">Paket Başlangıcı</th><th>Beklenen</th>""")

io.open(P, 'w', encoding='utf-8').write(s)

W = 'sw.js'
w = io.open(W, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v210-2026-10-21-133';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v210-2026-10-21-133';", "const CACHE_NAME = 'pilateria-v211-2026-10-21-134';")
io.open(W, 'w', encoding='utf-8').write(w)
print('v211 OK')
