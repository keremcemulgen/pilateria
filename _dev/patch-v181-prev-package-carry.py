# -*- coding: utf-8 -*-
# v181 — ONCEKI PAKETTEN DEVAM EDEN DERS HAKKI: YENI PAKET ACILIRKEN BILGI (ENGELLEMEZ)
# Kerem 2026-09-28: "onceki aydan devam eden ders hakki olan uyelerin veya gruplarin veya ikisi birden yeni paket
# acilirken uyari versin ama yine de paket acilmasini engellemesin, sadece bilgi olarak — eksiksiz ve hatasiz".
# TEK KAYNAK: __carryOfPackage181 (hak − yapilan; ⭐ erken kapanan paket = hak isletmeye → yok), __memberPrevUnit181
# (uyenin son birimi: bireysel / grup; payla ayrilan = hesap kapandi), packageCarryInfo181 (grup: kendi paketi + kadro
# uyelerinin kendi onceki birimleri; uye: son birimi), carryText181 (metin). YUZEYLER: odeme penceresi kutusu
# (#mp-carry-181), Odendi tiki + toplu odeme onay metni, createGroupPackage/createMemberPackage sonrasi 8 sn toast,
# grup/uye detayi notu. "Paket uzadi" (0 ₺) ve ayni-ay donusum (v175) = silent181. Hicbir yolda paket acilmasi engellenmez.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:110])
    s = s.replace(old, new)

# ---------- 1) TEK KAYNAK fonksiyonlari (sessionQuotaFor'un hemen onune) ----------
rep(r"""function sessionQuotaFor(ownerType, ownerId, monthISO){
  const ay = monthISO || currentMonth();""",
r"""// ===== v181: ONCEKI PAKETTEN DEVAM EDEN DERS HAKKI — BILGI, ENGEL DEGIL (Kerem 2026-09-28) =====
// "Onceki aydan devam eden ders hakki olan uyelerin veya gruplarin (veya ikisi birden) yeni paket acilirken uyari versin
// ama paket acilmasini engellemesin — sadece bilgi." TEK KAYNAK burasi; yuzeyler (odeme penceresi kutusu, Odendi tiki /
// toplu odeme onay metni, paket olusturma toast'i, grup/uye detayi notu) yalniz bu fonksiyonlari cagirir.
// Devam eden hak = birimin bir onceki paketinin hakki − yapilan (yapildi+yandi); planli dersler de devam eden haktir
// (v43: planli hak duser ama ders henuz yapilmadi). ⭐ erken kapanan paket (v108) = kalan hak isletmeye → devam eden hak
// yok. Iptal dersler sayilmaz. Uyenin "son birimi": bireysel paket ya da kadrosunda oldugu grup; payla ayrilan grup
// (v171) ve payla kapanan bireysel birim (v179) = hesap kapandi → devam eden hak yok. Kadro disi (misafir) ders birim degildir.
function __pkgMonthsOfUnit181(ownerType, ownerId) {
  const set = {};
  const pmOf = x => x.packageMonth || String(x.date || '').slice(0, 7);
  if (ownerType === 'group') {
    const g = (state.groups || []).find(x => x && x.id === ownerId); if (!g) return [];
    (g.packages || []).forEach(p => { if (p && p.month) set[p.month] = 1; });
    (state.lessons || []).forEach(l => { if (l && l.groupId === ownerId && l.status !== 'cancelled') { const pm = pmOf(l); if (pm) set[pm] = 1; } });
  } else {
    const m = (state.members || []).find(x => x && x.id === ownerId); if (!m) return [];
    (m.packages || []).forEach(p => { if (p && p.month) set[p.month] = 1; });
    (state.lessons || []).forEach(l => { if (l && !l.groupId && l.status !== 'cancelled' && (l.memberIds || []).includes(ownerId)) { const pm = pmOf(l); if (pm) set[pm] = 1; } });
  }
  return Object.keys(set).filter(k => /^\d{4}-\d{2}$/.test(k)).sort();
}
// Belirli paket ayinin devam eden hakki: {quota, done, planned, unscheduled, carry, plannedDates} ya da null
function __carryOfPackage181(ownerType, ownerId, pm) {
  if (!ownerId || !pm) return null;
  if (__pkgMonthsOfUnit181(ownerType, ownerId).indexOf(pm) === -1) return null; // o ay paket/ders yok — paket degil
  let fs; try { fs = sessionsFinishState(ownerType, ownerId, pm); } catch(e) { return null; }
  if (!fs || fs.closedEarly) return null;
  const quota = +fs.quota || 0, done = +fs.done || 0, planned = +fs.planned || 0;
  const carry = Math.max(0, quota - done);
  if (!(carry > 0)) return null;
  const plannedDates = (state.lessons || []).filter(l => {
    if (!l || l.status !== 'planned') return false;
    if ((l.packageMonth || String(l.date || '').slice(0, 7)) !== pm) return false;
    return ownerType === 'group' ? l.groupId === ownerId : (!l.groupId && (l.memberIds || []).includes(ownerId));
  }).map(l => l.date || '').filter(Boolean).sort();
  return { ownerType: ownerType, ownerId: ownerId, prevMonth: pm, quota: quota, done: done, planned: planned, unscheduled: Math.max(0, quota - done - planned), carry: carry, plannedDates: plannedDates };
}
// Uyenin ay'dan ONCEKI son birimi: {month, kind:'individual'|'group', gid} ya da null (son birimi payla kapandiysa da null)
function __memberPrevUnit181(memberId, ay) {
  if (!memberId || !ay) return null;
  const m = (state.members || []).find(x => x && x.id === memberId); if (!m) return null;
  const pmOf = x => x.packageMonth || String(x.date || '').slice(0, 7);
  const rosterHas = (g, pm) => { try { return (resolveGroupMembersForMonth(g, pm) || []).indexOf(memberId) !== -1; } catch(e) { return false; } };
  const cands = {};
  const add = (pm, gid) => { if (!pm || !/^\d{4}-\d{2}$/.test(pm) || pm >= ay) return; const c = cands[pm] || (cands[pm] = { i: false, g: {} }); if (gid) c.g[gid] = 1; else c.i = true; };
  (m.packages || []).forEach(p => { if (p) add(p.month, ''); });
  (state.lessons || []).forEach(l => {
    if (!l || l.status === 'cancelled' || !(l.memberIds || []).includes(memberId)) return;
    if (!l.groupId) { add(pmOf(l), ''); return; }
    const g = (state.groups || []).find(x => x && x.id === l.groupId);
    if (g && rosterHas(g, pmOf(l))) add(pmOf(l), g.id); // kadro disi (misafir) ders birim degildir
  });
  (state.groups || []).forEach(g => { if (!g) return; (g.packages || []).forEach(p => { if (p && p.month && p.month < ay && rosterHas(g, p.month)) add(p.month, g.id); }); });
  const months = Object.keys(cands).sort();
  if (!months.length) return null;
  const pm = months[months.length - 1], c = cands[pm];
  let og = null; try { og = memberActiveGroupForMonth(memberId, pm); } catch(e) { og = null; }
  const units = [];
  Object.keys(c.g).forEach(gid => { let ps = null; try { ps = partialShareFor(gid, memberId, pm); } catch(e) { ps = null; } if (ps) return; units.push({ kind: 'group', gid: gid }); }); // payla ayrildi: hesap kapandi
  if (c.i) { let ss = null; try { ss = __soloShare179Of(memberId, pm); } catch(e) { ss = null; } if (!(ss && og)) units.push({ kind: 'individual', gid: '' }); } // payla kapanan bireysel birim: hesap kapandi
  if (!units.length) return null; // son birim(ler) payla kapandi → devam eden hak yok (daha eskiye bakilmaz)
  let pick = units[0];
  if (units.length > 1) {
    const open = og ? units.find(u => u.kind === 'group' && u.gid === og.id) : units.find(u => u.kind === 'individual');
    if (open) pick = open;
    else { // ay sonunda acik birim yok: son dersin birimi
      let best = null, bestKey = '';
      (state.lessons || []).forEach(l => { if (!l || l.status === 'cancelled' || pmOf(l) !== pm || !(l.memberIds || []).includes(memberId)) return; const u = units.find(x => (l.groupId || '') === x.gid); if (!u) return; const key = (l.date || '') + (l.time || ''); if (key >= bestKey) { bestKey = key; best = u; } });
      if (best) pick = best;
    }
  }
  return { month: pm, kind: pick.kind, gid: pick.gid };
}
// Yeni paket acilan birim icin bilgi listesi. grup: grubun kendi onceki paketi + o ay kadrosundaki uyelerin KENDI onceki
// birimleri (ayni grubun paketi tekrar sayilmaz); uye: son birimi. Bos liste = devam eden hak yok.
function packageCarryInfo181(ownerType, ownerId, ay) {
  const out = [];
  if (!ownerId || !ay) return out;
  const mname = mid => { const m = (state.members || []).find(x => x && x.id === mid); return (m && m.name) || 'Üye'; };
  const gname = (gid, pm) => { const g = (state.groups || []).find(x => x && x.id === gid); if (!g) return 'Grup'; try { return groupDisplayName(g, pm) || g.name || 'Grup'; } catch(e) { return g.name || 'Grup'; } };
  const memberItem = (mid, ctxGid) => {
    const u = __memberPrevUnit181(mid, ay); if (!u) return null;
    if (u.kind === 'group' && ctxGid && u.gid === ctxGid) return null; // grubun kendi paketi ayrica raporlanir
    const c = u.kind === 'group' ? __carryOfPackage181('group', u.gid, u.month) : __carryOfPackage181('member', mid, u.month);
    if (!c) return null;
    let curG = null; try { curG = memberActiveGroupForMonth(mid, ay); } catch(e) { curG = null; }
    return Object.assign({ who: 'member', memberId: mid, name: mname(mid), kind: u.kind, gid: u.gid, groupName: u.kind === 'group' ? gname(u.gid, u.month) : '', sameGroup: !!(u.kind === 'group' && curG && curG.id === u.gid) }, c);
  };
  if (ownerType === 'group') {
    const g = (state.groups || []).find(x => x && x.id === ownerId); if (!g) return out;
    const months = __pkgMonthsOfUnit181('group', ownerId).filter(k => k < ay);
    if (months.length) { const c = __carryOfPackage181('group', ownerId, months[months.length - 1]); if (c) out.push(Object.assign({ who: 'group', memberId: '', name: gname(ownerId, c.prevMonth), kind: 'group', gid: ownerId, groupName: gname(ownerId, c.prevMonth), sameGroup: true }, c)); }
    let ros = []; try { ros = (resolveGroupMembersForMonth(g, ay) || []).filter(Boolean); } catch(e) { ros = []; }
    ros.forEach(mid => { const it = memberItem(mid, ownerId); if (it) out.push(it); });
  } else {
    const it = memberItem(ownerId, ''); if (it) out.push(it);
  }
  return out;
}
// Metin: her bilgi bir satir. opts.selfId: o uyenin adi one eklenmez (kendi detayi); opts.sep: satir ayraci.
function carryText181(items, opts) {
  opts = opts || {};
  if (!items || !items.length) return '';
  const lbl = pm => { try { return pkgMonthLabel(pm) || pm; } catch(e) { return pm; } };
  const fd = x => { try { return fmtShort(x); } catch(e) { return x; } };
  const det = c => {
    const parts = [c.done + '/' + c.quota + ' yapıldı'];
    if (c.planned) parts.push(c.planned + ' planlı' + ((c.plannedDates || []).length ? ': ' + c.plannedDates.slice(0, 4).map(fd).join(', ') + (c.plannedDates.length > 4 ? '…' : '') : ''));
    if (c.unscheduled) parts.push(c.unscheduled + ' planlanmamış');
    return parts.join(' · ');
  };
  return items.map(c => {
    const core = c.carry + ' ders hakkı devam ediyor (' + det(c) + ')';
    if (c.who === 'group') return '«' + c.name + '» grubunun ' + lbl(c.prevMonth) + ' paketinde ' + core;
    const pre = (opts.selfId && c.memberId === opts.selfId) ? '' : (c.name + ' — ');
    if (c.kind === 'group') return pre + (c.sameGroup ? '«' + c.groupName + '» grubunun ' : 'önceki grubu «' + c.groupName + '» ') + lbl(c.prevMonth) + ' paketinde ' + core;
    return pre + 'bireysel ' + lbl(c.prevMonth) + ' paketinde ' + core;
  }).join(opts.sep || '\n');
}
// Onay metnine eklenecek blok ('' = bilgi yok)
function __carryConfirmNote181(ownerType, ownerId, ay) {
  try { const items = packageCarryInfo181(ownerType, ownerId, ay); if (!items.length) return ''; return 'ℹ️ Önceki paketten devam eden ders hakkı (bilgi — engel değil):\n  • ' + carryText181(items, { sep: '\n  • ' }); } catch(e) { return ''; }
}
// Detay kutusu (grup detayi / uye detayi) — bilgi yoksa ''
function __carryNoteHtml181(ownerType, ownerId, ay, selfId) {
  try {
    if (!ownerId || !ay) return '';
    const items = packageCarryInfo181(ownerType, ownerId, ay);
    if (!items.length) return '';
    return '<div class="carry-note-181" style="padding:8px 12px;background:#FFF8E1;color:#6b4e00;border:1px solid #f1d48a;border-radius:6px;margin:8px 0;font-size:12.5px;line-height:1.45;">ℹ️ <b>Önceki paketten devam eden ders hakkı</b> <span style="color:#8a7b20;">— bilgi; yeni paket açılmasına engel değildir</span><br>' + items.map(it => '• ' + escapeHtml(carryText181([it], { selfId: selfId || '' }))).join('<br>') + '</div>';
  } catch(e) { return ''; }
}
// Paket olusturma sonrasi bilgi (1.9 sn sonra 8 sn toast). opts.silent181 / window.__carrySilent181 = sessiz. Asla engellemez.
function __carryNotify181(ownerType, ownerId, ay, opts) {
  try {
    if ((opts && opts.silent181) || window.__carrySilent181) return;
    const items = packageCarryInfo181(ownerType, ownerId, ay);
    if (!items.length) return;
    const txt = carryText181(items, { sep: ' • ' });
    window.__carryLast181 = { ownerType: ownerType, ownerId: ownerId, ay: ay, items: items, text: txt };
    // akisin kendi kisa toast'i (1.8 sn, orn. "👤 … bireysel") bilgiyi ezmesin: bilgi toast'i ondan SONRA gelir
    if (typeof plToast === 'function') setTimeout(function(){ try { plToast('ℹ️ ' + txt + ' — yeni paket yine de açıldı (bilgi).', 8000); } catch(e) {} }, 1900);
  } catch(e) {}
}
// Odeme penceresi kutusu: yeni kayitta (duzenlemede degil) — grup odemesinde grubun + kadronun bilgisi, bireyselde uyenin
function __refreshPayCarry181() {
  const box = document.getElementById('mp-carry-181'); if (!box) return;
  try {
    const editId = (document.getElementById('mp-id') || {}).value || '';
    const mid = (document.getElementById('mp-member') || {}).value || '';
    const gid = (document.getElementById('mp-group') || {}).value || '';
    const ay = (document.getElementById('mp-pkg-month') || {}).value || currentMonth();
    const items = (editId || !mid) ? [] : (gid ? packageCarryInfo181('group', gid, ay) : packageCarryInfo181('member', mid, ay));
    if (!items.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
    box.innerHTML = 'ℹ️ <b>Önceki paketten devam eden ders hakkı</b> — bilgi; yeni paket açılmasına engel değildir.<br>' + items.map(it => '• ' + escapeHtml(carryText181([it]))).join('<br>');
    box.style.display = 'block';
  } catch(e) { box.style.display = 'none'; box.innerHTML = ''; }
}
function sessionQuotaFor(ownerType, ownerId, monthISO){
  const ay = monthISO || currentMonth();""")

# ---------- 2) createGroupPackage / createMemberPackage: yeni kayit sonrasi bilgi (mevcut kayit donerse yok) ----------
rep(r"""  g.packages.push(newPkg);
  // Eski packageStartDate alanını da güncel tut (geriye dönük uyumluluk için)
  g.packageStartDate = newPkg.startDate;
  return newPkg;
}""",
r"""  g.packages.push(newPkg);
  // Eski packageStartDate alanını da güncel tut (geriye dönük uyumluluk için)
  g.packageStartDate = newPkg.startDate;
  __carryNotify181('group', g.id, monthISO, opts); // v181: onceki paketten devam eden hak — bilgi (engel degil)
  return newPkg;
}""")
rep(r"""  m.packages.push(newPkg);
  return newPkg;
}
// Bir paketin kullanılan ders sayısı (yapıldı + yandı)""",
r"""  m.packages.push(newPkg);
  __carryNotify181('member', m.id, monthISO, opts); // v181: onceki paketten devam eden hak — bilgi (engel degil)
  return newPkg;
}
// Bir paketin kullanılan ders sayısı (yapıldı + yandı)""")

# ---------- 3) Sessiz yollar: Paket uzadi (0 ₺) = devam eden hakkin kendisi; v175 ayni-ay donusum ----------
rep("createGroupPackage(g, monthISO, monthISO + '-01', { price: 0 })", "createGroupPackage(g, monthISO, monthISO + '-01', { price: 0, silent181: true })", 2)
rep("createMemberPackage(m, monthISO, monthISO + '-01', { price: 0 })", "createMemberPackage(m, monthISO, monthISO + '-01', { price: 0, silent181: true })", 2)
rep("const np = createMemberPackage(m, ay, start, { sessions: quota > 0 ? quota : undefined, price: price, instructorId: insId, instructorShareRate: rateG });",
    "const np = createMemberPackage(m, ay, start, { sessions: quota > 0 ? quota : undefined, price: price, instructorId: insId, instructorShareRate: rateG, silent181: true }); // v181: ayni ayin paketi tasiniyor (yeni donem degil)")

# ---------- 4) Odeme penceresi: bilgi kutusu + yenileme ----------
rep(r"""    <div id="mp-group-banner" style="display:none;background:#F6E8D5;color:var(--p2);padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:13px;font-weight:500;"></div>
    <div class="fields-grid">
      <div class="field"><label>Üye *</label><select id="mp-member" onchange="onPayMemberChange()"></select></div>""",
r"""    <div id="mp-group-banner" style="display:none;background:#F6E8D5;color:var(--p2);padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:13px;font-weight:500;"></div>
    <div id="mp-carry-181" style="display:none;background:#FFF8E1;color:#6b4e00;border:1px solid #f1d48a;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:12.5px;line-height:1.45;"></div>
    <div class="fields-grid">
      <div class="field"><label>Üye *</label><select id="mp-member" onchange="onPayMemberChange()"></select></div>""")
rep(r"""  renderPayBalanceStrip(); // v123
  openModal('modal-payment');
}""",
r"""  renderPayBalanceStrip(); // v123
  __refreshPayCarry181(); // v181
  openModal('modal-payment');
}""")
rep(r"""  renderPayBalanceStrip(); // v123
}
function savePayment() {""",
r"""  renderPayBalanceStrip(); // v123
  __refreshPayCarry181(); // v181
}
function savePayment() {""")

# ---------- 5) Odendi tiki + toplu odeme: onay metnine bilgi ----------
rep(r"""    if (!confirm(`"${m.name}" için ${ay} ayına ${money(amount)} ₺ ödeme kaydı oluşturulacak. Devam?`)) return;""",
r"""    { const __n181 = __carryConfirmNote181(isGroup ? 'group' : 'member', isGroup ? groupId : memberId, ay); // v181: bilgi — engel degil
      if (!confirm(`"${m.name}" için ${ay} ayına ${money(amount)} ₺ ödeme kaydı oluşturulacak.${__n181 ? '\n\n' + __n181 + '\n\n' : ' '}Devam?`)) return; }""")
rep(r"""  if (__dupNames.length) __cmsg += `\n\n⚠️ ATLANACAKLAR:\n  • ${__dupNames.join('\n  • ')}`;
  __cmsg += '\n\nDevam?';""",
r"""  if (__dupNames.length) __cmsg += `\n\n⚠️ ATLANACAKLAR:\n  • ${__dupNames.join('\n  • ')}`;
  { const __n181 = __carryConfirmNote181('group', groupId, packageMonth); if (__n181) __cmsg += '\n\n' + __n181; } // v181: bilgi — engel degil
  __cmsg += '\n\nDevam?';""")

# ---------- 6) Grup detayi / uye detayi notu ----------
rep(r"""    ${pkgBox}
    <div class="row" style="margin:8px 0;flex-wrap:wrap;gap:12px;font-size:13px;">
      <span>🕐 <b>Saat:</b> ${g.defaultTime||'—'}</span>""",
r"""    ${pkgBox}
    ${__carryNoteHtml181('group', id, monthISO)}
    <div class="row" style="margin:8px 0;flex-wrap:wrap;gap:12px;font-size:13px;">
      <span>🕐 <b>Saat:</b> ${g.defaultTime||'—'}</span>""")
rep(r"""      ${activePkg.extendedNote ? '<br>📝 ' + escapeHtml(activePkg.extendedNote) : ''}
    </div>` : ''}
    ${m.adres?`""",
r"""      ${activePkg.extendedNote ? '<br>📝 ' + escapeHtml(activePkg.extendedNote) : ''}
    </div>` : ''}
    ${__carryNoteHtml181('member', id, thisMonth, id)}
    ${m.adres?`""")

# ---------- 7) plToast sure parametresi (uzun bilgi okunabilsin) + toast genisligi ----------
rep(r"""  window.plToast=function(m){ toastEl.textContent=m; toastEl.classList.add('on'); clearTimeout(_tt); _tt=setTimeout(function(){toastEl.classList.remove('on');},1800); };""",
r"""  window.plToast=function(m, ms){ toastEl.textContent=m; toastEl.classList.add('on'); clearTimeout(_tt); _tt=setTimeout(function(){toastEl.classList.remove('on');},(+ms > 0 ? +ms : 1800)); }; // v181: istege bagli sure (bilgi mesajlari)""")
rep(r"""  .pl-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,16px);opacity:0;pointer-events:none;display:flex;align-items:center;gap:8px;background:var(--acc);color:var(--acc-contrast);font-size:14px;font-weight:500;padding:11px 18px;border-radius:999px;box-shadow:var(--shadow-pop);z-index:10000;transition:opacity .25s,transform .25s;}""",
r"""  .pl-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,16px);opacity:0;pointer-events:none;display:flex;align-items:center;gap:8px;background:var(--acc);color:var(--acc-contrast);font-size:14px;font-weight:500;padding:11px 18px;border-radius:22px;width:max-content;max-width:min(92vw,760px);line-height:1.35;box-shadow:var(--shadow-pop);z-index:10000;transition:opacity .25s,transform .25s;}""")

# ---------- surum ----------
rep('<meta name="app-version" content="2026.09.28.103">', '<meta name="app-version" content="2026.09.28.104">')
rep("const APP_VERSION = '2026.09.28.103';", "const APP_VERSION = '2026.09.28.104';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))
SW = 'sw.js'
w = io.open(SW, encoding='utf-8').read()
old = "'pilateria-v180-2026-09-28-103'"
assert w.count(old) == 1, w.count(old)
w = w.replace(old, "'pilateria-v181-2026-09-28-104'")
io.open(SW, 'w', encoding='utf-8').write(w)
print('sw.js OK')
