# -*- coding: utf-8 -*-
# v126 — HIZLI KAZANIMLAR (7 madde):
#  11) Kapali gun (tatil): ayarlar listesi + takvim rozeti + doluluk dusumu + ders eklerken onay
#  12) Saglik notu rozetleri: grup detayi + mobil uye karti (🩺)
#  13) Dogum gunu: uye formu alani + uye detayi + panelde "bu hafta" seridi
#  14) Toplu WhatsApp'a uye listesinden giris
#  15) Maas odemesinde esneklik: tutar/tarih/yontem/not, ayni aya coklu kayit (avans/taksit), asim onayi
#  16) Kampanyaya baslangic/bitis + kullanim limiti
#  19) Onaysiz silmelere onay: removePkg + saveBatchDates (listeden cikarilan dersler)
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ============ 11) KAPALI GUN ============
# 11a. Ayarlar HTML — kampanya kartinin ustune ayri kart
rep("""    <h2>Kampanyalar / İndirimler</h2>
""",
"""    <h2>📅 Kapalı Günler (tatil)</h2>
    <div id="holidays-list"></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin:8px 0;">
      <input type="date" id="hol-date"><input id="hol-name" placeholder="örn. Cumhuriyet Bayramı" style="flex:1;min-width:160px;">
      <button class="btn small" onclick="addHoliday()">Ekle</button>
    </div>
    <div class="muted" style="font-size:12px;margin-bottom:16px;">Kapalı günde ders eklemeye çalışırsan uyarılırsın; aylık doluluk hesabı o günü kapasiteden düşer.</div>
    <h2>Kampanyalar / İndirimler</h2>
""")

# 11b. JS: isHoliday/holidayName/renderHolidaysSettings/addHoliday/removeHoliday — monthOccupancy'nin onune
rep("""function monthOccupancy(monthISO) {
""",
"""// v126: KAPALI GUNLER (tatil) — state.settings.holidays: [{date:'YYYY-MM-DD', name}]
// settings singleton'i ile buluta senkron olur (dusuk yazim sikligi, LWW kabul edilebilir).
function isHoliday(dateISO) { return !!((state.settings.holidays||[]).find(h => h && h.date === dateISO)); }
function holidayName(dateISO) { const h = (state.settings.holidays||[]).find(x => x && x.date === dateISO); return h ? (h.name || 'Kapalı') : ''; }
function renderHolidaysSettings() {
  const el = document.getElementById('holidays-list'); if (!el) return;
  const hs = (state.settings.holidays||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  el.innerHTML = hs.length ? hs.map(h => `<div class="row" style="gap:8px;margin:3px 0;align-items:center;"><span>📅 ${fmtDate(h.date)} — <b>${escapeHtml(h.name||'Kapalı')}</b></span><button class="btn small secondary" onclick="removeHoliday('${h.date}')">Sil</button></div>`).join('') : '<div class="muted" style="font-size:12px;">Tanımlı kapalı gün yok.</div>';
}
function addHoliday() {
  const d = (document.getElementById('hol-date')||{}).value;
  const n = ((document.getElementById('hol-name')||{}).value||'').trim();
  if (!d) { alert('Önce tarih seç.'); return; }
  state.settings.holidays = state.settings.holidays || [];
  if (state.settings.holidays.find(h => h && h.date === d)) { alert('Bu gün zaten kapalı listede.'); return; }
  state.settings.holidays.push({ date: d, name: n || 'Kapalı' });
  save(); renderHolidaysSettings(); try { renderCalendar(); } catch(e) {}
  if (window.plToast) plToast('📅 Kapalı gün eklendi: ' + fmtDate(d));
}
function removeHoliday(d) {
  if (!confirm(fmtDate(d) + ' kapalı günü listeden çıkarılsın mı?')) return;
  state.settings.holidays = (state.settings.holidays||[]).filter(h => !(h && h.date === d));
  save(); renderHolidaysSettings(); try { renderCalendar(); } catch(e) {}
}
function monthOccupancy(monthISO) {
""")

# 11c. renderSettings kapali gun listesini de cizsin
rep("""  renderPackageTypesSettings();
  renderWaTemplatesSettings();
""",
"""  renderPackageTypesSettings();
  renderWaTemplatesSettings();
  try { renderHolidaysSettings(); } catch(e) {}
""")

# 11d. doluluk: kapali gun kapasiteden duser
rep("""  const capacity = workingDays * hoursPerDay * reformers;
""",
"""  // v126: kapali gunler (is gunune denk gelenler) kapasite sayilmaz
  const __hols = (state.settings.holidays||[]).filter(h => h && String(h.date||'').slice(0,7) === monthISO && workDays.includes(parseISO(h.date).getDay())).length;
  workingDays = Math.max(0, workingDays - __hols);
  const capacity = workingDays * hoursPerDay * reformers;
""")

# 11e. saveLesson: kapali gunde onay
rep("""  if (errs) { w.textContent = 'Zorunlu alanlar eksik. Kırmızı işaretli alanları kontrol et.'; return; }
""",
"""  if (errs) { w.textContent = 'Zorunlu alanlar eksik. Kırmızı işaretli alanları kontrol et.'; return; }
  if (typeof isHoliday === 'function' && isHoliday(date)) {
    if (!confirm('⚠️ ' + fmtDate(date) + ' KAPALI GÜN' + (holidayName(date) ? ' (' + holidayName(date) + ')' : '') + '. Yine de ders eklensin mi?')) return;
  }
""")

# 11f. ay takviminde KAPALI rozeti
rep("""    html2 += `<div class="gm-cell${inMonth?'':' out'}${isToday?' today':''}" onclick="calAnchor=parseISO('${dISO}');setCalView('day')">
      <div class="gm-num"><span>${dd.getDate()}</span></div>
      ${chips}${more}
    </div>`;
""",
"""    const __hol = (typeof isHoliday === 'function') && isHoliday(dISO); // v126
    html2 += `<div class="gm-cell${inMonth?'':' out'}${isToday?' today':''}" onclick="calAnchor=parseISO('${dISO}');setCalView('day')"${__hol?` style="background:#FDECEA;"`:''}>
      <div class="gm-num"><span>${dd.getDate()}</span>${__hol?`<span style="font-size:8.5px;color:#c62828;font-weight:700;" title="${escapeHtml(holidayName(dISO))}">KAPALI</span>`:''}</div>
      ${chips}${more}
    </div>`;
""")

# ============ 12) SAGLIK ROZETLERI ============
rep("""      <td><b>${m.name}</b></td>
      <td>${m.phone||'—'}</td>
""",
"""      <td><b>${m.name}</b>${m.health?` <span title="${escapeHtml(m.health)}" style="cursor:help;">🩺</span>`:''}</td>
      <td>${m.phone||'—'}</td>
""")

rep("""        <span class="mc-name">${escapeHtml(r.name||'')}</span>
""",
"""        <span class="mc-name">${escapeHtml(r.name||'')}${(function(){const __hm=state.members.find(x=>x.id===r.memberId);return (__hm&&__hm.health)?' 🩺':'';})()}</span>
""")

# ============ 13) DOGUM GUNU ============
rep("""      <div class="field"><label>Kayıt Tarihi</label><input type="date" id="mm-join"></div>
""",
"""      <div class="field"><label>Kayıt Tarihi</label><input type="date" id="mm-join"></div>
      <div class="field"><label>Doğum Günü 🎂</label><input type="date" id="mm-birthday"></div>
""")

rep("""const m = isEdit ? state.members.find(x=>x.id===id) : { id:'', name:'', phone:'', tcno:'', adres:'', joinDate:todayISO(), instructorId:'', health:'', note:'', instructorShareRate: null, totalPrice: '' };""",
"""const m = isEdit ? state.members.find(x=>x.id===id) : { id:'', name:'', phone:'', tcno:'', adres:'', birthday:'', joinDate:todayISO(), instructorId:'', health:'', note:'', instructorShareRate: null, totalPrice: '' };""")

rep("""  document.getElementById('mm-join').value = m.joinDate || todayISO();
  document.getElementById('mm-health').value = m.health || '';
""",
"""  document.getElementById('mm-join').value = m.joinDate || todayISO();
  const __bdEl = document.getElementById('mm-birthday'); if (__bdEl) __bdEl.value = m.birthday || ''; // v126
  document.getElementById('mm-health').value = m.health || '';
""")

rep("""    adres: document.getElementById('mm-adres').value.trim(),
    joinDate: joinDate || todayISO(),
""",
"""    adres: document.getElementById('mm-adres').value.trim(),
    birthday: (document.getElementById('mm-birthday')||{}).value || '',
    joinDate: joinDate || todayISO(),
""")

rep("""      <span><b>Kayıt:</b> ${m.joinDate?fmtDate(m.joinDate):'—'}</span>
""",
"""      <span><b>Kayıt:</b> ${m.joinDate?fmtDate(m.joinDate):'—'}</span>
      ${m.birthday?`<span><b>🎂 Doğum:</b> ${fmtDate(m.birthday)}</span>`:''}
""")

rep("""    <div id="dash-sync-status" style="margin-top:8px;font-size:12px;color:var(--muted);"></div>
""",
"""    <div id="dash-sync-status" style="margin-top:8px;font-size:12px;color:var(--muted);"></div>
    <div id="dash-birthdays" style="display:none;margin-top:6px;font-size:12.5px;"></div>
""")

rep("""function renderNextWeekMissing(){
""",
"""// v126: onumuzdeki 7 gunde dogum gunu olan aktif uyeler
function __renderBirthdays() {
  const el = document.getElementById('dash-birthdays');
  if (!el) return;
  const t = todayISO();
  const parts = t.split('-').map(Number);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(parts[0], parts[1] - 1, parts[2] + i);
    days.push({ i, md: String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'),
                label: i === 0 ? 'BUGÜN 🎉' : (d.getDate() + ' ' + d.toLocaleDateString('tr-TR', { month: 'long' })) });
  }
  const list = [];
  (state.members||[]).forEach(m => {
    if (!m || m.archived || !m.birthday) return;
    const md = String(m.birthday).slice(5, 10);
    const hit = days.find(x => x.md === md);
    if (hit) list.push({ name: m.name, i: hit.i, label: hit.label });
  });
  if (!list.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'block';
  el.innerHTML = '🎂 <b>Doğum günü:</b> ' + list.sort((a,b)=>a.i-b.i).map(x => `${escapeHtml(x.name)} (${x.label})`).join(' · ');
}
function renderNextWeekMissing(){
""")

rep("""  try { renderNextWeekMissing(); } catch(e){}
""",
"""  try { renderNextWeekMissing(); } catch(e){}
  try { __renderBirthdays(); } catch(e){}
""")

# ============ 14) TOPLU WHATSAPP GIRISI ============
rep("""      <button class="btn secondary" id="month-add-btn" style="display:none;" onclick="openMonthAddPicker((document.getElementById('member-month')||{}).value||'')" title="Seçili aya üye ekle (yalnız o ay etkilenir)">🗓️+ Aya Üye Ekle</button>
""",
"""      <button class="btn secondary" id="month-add-btn" style="display:none;" onclick="openMonthAddPicker((document.getElementById('member-month')||{}).value||'')" title="Seçili aya üye ekle (yalnız o ay etkilenir)">🗓️+ Aya Üye Ekle</button>
      <button class="btn secondary pl-owner-only" onclick="openWaBulkFromMembers()" title="Görünen aydaki tüm aktif üyelere WhatsApp mesajı hazırla">💬 Toplu WhatsApp</button>
""")

rep("""function openWaBulkModal(memberIds, templateId) {
""",
"""// v126: toplu WhatsApp'a genel giris — ekran yazilmisti ama yalniz "geciken odemeler"den acilabiliyordu
function openWaBulkFromMembers() {
  const ay = (document.getElementById('member-month')||{}).value || currentMonth();
  const ids = (state.members||[]).filter(m => m && !m.archived && isMemberEnrolledInMonth(m.id, ay)).map(m => m.id);
  if (!ids.length) { alert('Bu ay için aktif üye yok.'); return; }
  openWaBulkModal(ids, 'wa-reminder');
}
function openWaBulkModal(memberIds, templateId) {
""")

# ============ 15) MAAS ESNEKLIGI ============
rep("""    const payout = (state.instructorPayouts||[]).find(p => p.instructorId===inst.id && p.year===y && p.month===mo);
    const paidBadge = payout
      ? `<span class="badge ok">✓ Ödendi · ${fmtDate(payout.paidDate)}</span>`
      : `<span class="badge warn">Ödenmedi</span>`;
    const actionBtn = payout
      ? `<button class="btn small secondary" onclick="undoPayInstructor('${payout.id}')">Geri Al</button>`
      : `<button class="btn small ok" onclick="payInstructor('${inst.id}','${m}',${total})" ${total<=0?'disabled':''}>${total>0?'💸 Öde':'—'}</button>`;
""",
"""    const payouts = (state.instructorPayouts||[]).filter(p => p.instructorId===inst.id && p.year===y && p.month===mo); // v126: ayni aya coklu odeme (avans/taksit)
    const paidSum = payouts.reduce((a,p)=>a+(+p.amount||0),0);
    const fullyPaid = total > 0 ? (paidSum >= total - 0.005) : payouts.length > 0;
    const paidBadge = fullyPaid
      ? `<span class="badge ok">✓ Ödendi · ${fmtDate((payouts[payouts.length-1]||{}).paidDate || todayISO())}</span>`
      : (paidSum > 0
        ? `<span class="badge" style="background:#FFF8E1;color:#8a6d00;">🟡 Kısmi ${money(paidSum)}/${money(total)}</span>`
        : `<span class="badge warn">Ödenmedi</span>`);
    const actionBtn = fullyPaid
      ? `<button class="btn small secondary" onclick="undoPayInstructorMonth('${inst.id}','${m}')">Geri Al</button>`
      : `<button class="btn small ok" onclick="payInstructor('${inst.id}','${m}',${total})" ${total<=0?'disabled':''}>${total>0?(paidSum>0?'💸 Kalanı Öde':'💸 Öde'):'—'}</button>`;
""")

rep("""function payInstructor(instructorId, yyyymm, amount) {
  amount = +amount || 0;
  if (amount <= 0) { alert('Ödenecek tutar yok.'); return; }
  const inst = state.instructors.find(i=>i.id===instructorId);
  if (!confirm(`${inst ? inst.name : 'Hoca'} — ${yyyymm} ayı için ${money(amount)} ₺ maaş ödemesi kaydedilecek. Onaylıyor musun?`)) return;
  const [y, mo] = yyyymm.split('-').map(Number);
  // guard against double-pay
  const existing = (state.instructorPayouts||[]).find(p => p.instructorId===instructorId && p.year===y && p.month===mo);
  if (existing) { alert('Bu ay için zaten ödeme kaydı var.'); return; }
  if (!Array.isArray(state.instructorPayouts)) state.instructorPayouts = [];
  state.instructorPayouts.push({
    id: uid(), instructorId, year:y, month:mo, amount: Math.round(amount*100)/100,
    paidDate: todayISO(), note: ''
  });
  save();
  renderSalaries();
}
""",
"""// v126: MAAS ESNEKLIGI — tutar/tarih/yontem/not duzenlenebilir; ayni aya coklu kayit (avans/taksit); asim ONAYLA gecer.
// v41 kanonu DEGISMEZ: hakedis hesabi ayni; burasi yalniz ODEME KAYDI esnekligi.
function payInstructor(instructorId, yyyymm, amount) {
  amount = +amount || 0;
  const inst = state.instructors.find(i=>i.id===instructorId);
  const [y, mo] = yyyymm.split('-').map(Number);
  const paidSoFar = (state.instructorPayouts||[]).filter(p => p.instructorId===instructorId && p.year===y && p.month===mo).reduce((a,p)=>a+(+p.amount||0),0);
  const kalan = Math.max(0, Math.round((amount - paidSoFar) * 100) / 100);
  const old = document.getElementById('modal-inst-pay'); if (old) old.remove();
  const mdl = document.createElement('div');
  mdl.id = 'modal-inst-pay'; mdl.className = 'modal-bg open';
  mdl.innerHTML = `<div class="modal" style="max-width:420px;">
    <h3>💸 ${escapeHtml(inst ? inst.name : 'Hoca')} — ${yyyymm} maaş ödemesi</h3>
    <div style="font-size:13px;margin:6px 0;padding:8px 10px;background:#F1F8FF;border-radius:8px;">Hakediş: <b>${money(amount)} ₺</b> · Ödenen: <b>${money(paidSoFar)} ₺</b> · Kalan: <b>${money(kalan)} ₺</b></div>
    <div class="field"><label>Tutar (₺) — avans/taksit için azaltabilirsin</label><input type="number" id="ip-amount" value="${kalan || amount}"></div>
    <div class="field"><label>Ödeme Tarihi</label><input type="date" id="ip-date" value="${todayISO()}"></div>
    <div class="field"><label>Yöntem</label><select id="ip-method"><option>Nakit</option><option>IBAN</option><option>Kredi Kartı</option></select></div>
    <div class="field"><label>Not (örn. avans)</label><input id="ip-note"></div>
    <div class="row" style="justify-content:flex-end;gap:8px;">
      <button class="btn secondary" onclick="document.getElementById('modal-inst-pay').remove()">Vazgeç</button>
      <button class="btn" onclick="confirmPayInstructor('${instructorId}','${yyyymm}')">Kaydet</button>
    </div></div>`;
  document.body.appendChild(mdl);
}
function confirmPayInstructor(instructorId, yyyymm) {
  const amt = +((document.getElementById('ip-amount')||{}).value) || 0;
  if (amt <= 0) { alert('Tutar girilmedi.'); return; }
  const [y, mo] = yyyymm.split('-').map(Number);
  const hak = (instructorEarningsForMonth(instructorId, yyyymm) || {}).total || 0;
  const paidSoFar = (state.instructorPayouts||[]).filter(p => p.instructorId===instructorId && p.year===y && p.month===mo).reduce((a,p)=>a+(+p.amount||0),0);
  if (paidSoFar + amt > hak + 0.005) {
    if (!confirm(`⚠️ Bu kayıtla ${yyyymm} toplam ödemesi ${money(paidSoFar + amt)} ₺ olacak — hakedişi (${money(hak)} ₺) aşıyor. Yine de kaydedilsin mi?`)) return;
  }
  if (!Array.isArray(state.instructorPayouts)) state.instructorPayouts = [];
  state.instructorPayouts.push({
    id: uid(), instructorId, year: y, month: mo, amount: Math.round(amt * 100) / 100,
    paidDate: (document.getElementById('ip-date')||{}).value || todayISO(),
    method: (document.getElementById('ip-method')||{}).value || 'Nakit',
    note: ((document.getElementById('ip-note')||{}).value || '').trim()
  });
  const mdl = document.getElementById('modal-inst-pay'); if (mdl) mdl.remove();
  save(); renderSalaries();
  if (window.plToast) plToast('💸 Maaş ödemesi kaydedildi');
}
function undoPayInstructorMonth(instructorId, yyyymm) {
  const [y, mo] = yyyymm.split('-').map(Number);
  const list = (state.instructorPayouts||[]).filter(p => p.instructorId===instructorId && p.year===y && p.month===mo);
  if (!list.length) return;
  const tot = list.reduce((a,p)=>a+(+p.amount||0),0);
  if (!confirm(`${yyyymm} ayına ait ${list.length} maaş ödemesi kaydı (toplam ${money(tot)} ₺) silinecek. Emin misin?`)) return;
  state.instructorPayouts = (state.instructorPayouts||[]).filter(p => !(p.instructorId===instructorId && p.year===y && p.month===mo));
  save(); renderSalaries();
}
""")

# ============ 16) KAMPANYA TARIH + LIMIT ============
rep("""      <input value="${c.note||''}" data-cidx="${idx}" data-cfield="note" style="flex:1;min-width:120px" placeholder="Not (ops.)">
""",
"""      <input type="date" value="${c.start||''}" data-cidx="${idx}" data-cfield="start" style="width:135px" title="Başlangıç (boş = süresiz)">
      <input type="date" value="${c.end||''}" data-cidx="${idx}" data-cfield="end" style="width:135px" title="Bitiş (boş = süresiz)">
      <input type="number" value="${c.limit||''}" data-cidx="${idx}" data-cfield="limit" style="width:85px" placeholder="Limit" title="Kullanım limiti (boş = sınırsız)">
      <input value="${c.note||''}" data-cidx="${idx}" data-cfield="note" style="flex:1;min-width:120px" placeholder="Not (ops.)">
""")

rep("""function applyCampaign() {
""",
"""// v126: kampanya tarih araligi + kullanim limiti
function campaignUsable(c, dateISO) {
  if (!c || !c.active) return false;
  const d = dateISO || todayISO();
  if (c.start && d < c.start) return false;
  if (c.end && d > c.end) return false;
  if (+c.limit > 0) {
    const used = (state.payments||[]).filter(p => p && p.campaignId === c.id).length;
    if (used >= +c.limit) return false;
  }
  return true;
}
function applyCampaign() {
""")

rep("""  const activeCamps = (state.campaigns||[]).filter(c=>c.active);
""",
"""  const activeCamps = (state.campaigns||[]).filter(c => campaignUsable(c, todayISO())); // v126: tarih+limit suzgeci
""")

# ============ 19) ONAYLAR ============
rep("""function removePkg(idx) {
  state.packageTypes.splice(idx,1);
  renderPackageTypesSettings();
}
""",
"""function removePkg(idx) {
  const p = state.packageTypes[idx];
  if (!confirm(`"${(p && p.name) || 'Paket'}" paket tipi listeden silinecek. Mevcut ödemeler ve üyeler etkilenmez. Emin misin?`)) return; // v126
  state.packageTypes.splice(idx,1);
  renderPackageTypesSettings();
}
""")

rep("""  const modalLessonIds = new Set(__batchDatesRows.filter(r => r.lessonId).map(r => r.lessonId));
  const idsToRemove = existingPkgLessons.filter(l => !modalLessonIds.has(l.id)).map(l => l.id);
""",
"""  const modalLessonIds = new Set(__batchDatesRows.filter(r => r.lessonId).map(r => r.lessonId));
  const idsToRemove = existingPkgLessons.filter(l => !modalLessonIds.has(l.id)).map(l => l.id);
  // v126: SESSIZ SILME OLMASIN — listeden cikarilan dersler icin acik onay
  if (idsToRemove.length) {
    const __delInfo = idsToRemove.map(iid => { const L = state.lessons.find(x => x.id === iid); return L ? (fmtDate(L.date) + ' ' + (L.time || '')) : iid; });
    if (!confirm('⚠️ ' + idsToRemove.length + ' ders takvimden SİLİNECEK (listeden çıkardıkların):\\n\\n  • ' + __delInfo.join('\\n  • ') + '\\n\\nDevam edilsin mi?')) return;
  }
""")

# ============ SURUM ============
rep('<meta name="app-version" content="2026.07.29.48">', '<meta name="app-version" content="2026.07.29.49">')
rep("const APP_VERSION = '2026.07.29.48';", "const APP_VERSION = '2026.07.29.49';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v125-2026-07-29-48';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v126-2026-07-29-49';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
