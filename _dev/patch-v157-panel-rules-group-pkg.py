# -*- coding: utf-8 -*-
# v157 — Kerem (2026-08-30, ekran goruntuleri + secenek cevabi):
# A) "1 Dersi Kalan / Biten" BITEN satiri, birime DAHA YENI paket yazildiysa DUSER:
#    bireysel: kisinin (klonlar dahil) yeni aya yazilmis kaydi/paketi YA DA ayni ay 2. paket kaydi;
#    grup: grubun kendisi yeni aya yazilmis YA DA ikiz "(N. Paket)" grubu (ayni kisiler, numarasi
#    buyuk ya da ayi yeni). Kimsesi devam etmeyen KALIR (aranacaklar). Kural yalniz BITEN icin;
#    "1 ders kaldi" gercek alacak, kalir. Satirlar KAYIT bazinda kalir (Kerem: klon katlama YOK).
# B) "Gelecek Hafta Ders Girilmemis": hafta HANGI AYLARA dokunuyorsa o aylarin aktifleri esas
#    (yalniz bulunulan aya capalamak Eylul'e kayitli uyeyi KACIRIYORDU); ders-varligi ve grup
#    uyeligi KISI bazinda katlanir (klonuyla dersi/grubu olan kisinin diger kaydi listelenmez).
# C) GRUBA "+ N. Paket": grup sayfasindan, uyelerdeki akisin karsiligi — kadronun her kisisi icin
#    klon kaydi (pkgSlotForMonth motoru), yeni grup secondOfGroup+pkgNo ile; uyuyan ikiz yeniden
#    kullanilir (v150 kanonu: mukerrer kayit acilmaz).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- B) getNextWeekMissing: ay kapsami + kisi katlama ----------
rep("""function getNextWeekMissing(){
  const ws = startOfWeek(0);
  const start = addDays(ws, 7);   // gelecek hafta Pzt
  const end = addDays(ws, 14);    // sonraki Pzt (haric)
  const cm = currentMonth();
  // v125: TEK GECIS — grup/uye basina tam state.lessons taramasi kare karmasiklikti (ay 36'da ~1.5 sn olacakti)
  const __gHas = new Set(), __mHas = new Set();
  state.lessons.forEach(l => {
    if (!l || l.status === 'cancelled') return;
    const d = parseISO(l.date);
    if (!(d >= start && d < end)) return;
    if (l.groupId) __gHas.add(l.groupId);
    else (l.memberIds || []).forEach(id => __mHas.add(id));
  });
  const groups = state.groups.filter(g => !isGroupInactiveInMonth(g, cm) && __activeRosterForMonth(g, cm).length>0 && !__gHas.has(g.id));
  const inAnyGroup = new Set(); state.groups.forEach(g => __activeRosterForMonth(g, cm).forEach(id=>inAnyGroup.add(id)));
  const members = state.members.filter(m => !m.archived && isMemberEnrolledInMonth(m.id, cm) && !inAnyGroup.has(m.id) && !__mHas.has(m.id));
  return { start, end, groups, members };
}""",
"""function getNextWeekMissing(){
  const ws = startOfWeek(0);
  const start = addDays(ws, 7);   // gelecek hafta Pzt
  const end = addDays(ws, 14);    // sonraki Pzt (haric)
  // v157 (Kerem): hafta HANGI AYLARA dokunuyorsa O AYLARIN aktifleri esas alinir — yalniz
  // bulunulan aya capalamak, ay sinirindaki haftada YENI AYA kayitli uyeyi kaciriyordu (OYKU
  // vakasi) ve biten ayin uyesini bosuna listeliyordu. v156 ile ayni hastalik ailesi (ay capasi).
  const months = [];
  for (let d0 = new Date(start); d0 < end; d0 = addDays(d0, 1)) {
    const mo = isoDate(d0).slice(0, 7);
    if (!months.includes(mo)) months.push(mo);
  }
  // v157: ders-varligi ve grup uyeligi KISI bazinda katlanir (klon kayitlar ayni kisidir — v59
  // secondOfMember kanonu). Kisinin HERHANGI bir kaydinin dersi/grubu varsa diger kayitlari
  // listelenmez (TAMELLA vakasi). Satirlar yine kayit bazinda (Kerem karari: klon katlama yok).
  const __rootOf = function(mid){ const mm = (state.members || []).find(function(x){ return x && x.id === mid; }); return mm ? (mm.secondOfMember || mm.id) : mid; };
  // v125: TEK GECIS — grup/uye basina tam state.lessons taramasi kare karmasiklikti (ay 36'da ~1.5 sn olacakti)
  const __gHas = new Set(), __pHas = new Set();
  state.lessons.forEach(l => {
    if (!l || l.status === 'cancelled') return;
    const d = parseISO(l.date);
    if (!(d >= start && d < end)) return;
    if (l.groupId) __gHas.add(l.groupId);
    (l.memberIds || []).forEach(id => __pHas.add(__rootOf(id)));
  });
  const groups = state.groups.filter(g => months.some(mo => !isGroupInactiveInMonth(g, mo) && __activeRosterForMonth(g, mo).length > 0) && !__gHas.has(g.id));
  const inAnyGroupP = new Set(); state.groups.forEach(g => months.forEach(mo => __activeRosterForMonth(g, mo).forEach(id => inAnyGroupP.add(__rootOf(id)))));
  const members = state.members.filter(m => !m.archived && months.some(mo => isMemberEnrolledInMonth(m.id, mo)) && !inAnyGroupP.has(m.secondOfMember || m.id) && !__pHas.has(m.secondOfMember || m.id));
  return { start, end, groups, members };
}""")

# ---------- A) supersede yardimcilari (pkgSlotForMonth'un hemen ardina) ----------
rep("""  let n = 2; while (taken[n]) n++;
  return { n: n, reuse: dormant[n] || null };
}""",
"""  let n = 2; while (taken[n]) n++;
  return { n: n, reuse: dormant[n] || null };
}
// v157 (Kerem): BITEN satiri dusme kurali — birime DAHA YENI paket yazildiysa panel Biten
// listesinden duser (veri degismez). Bireysel: kisinin (klonlar dahil) yeni aya yazilmis
// kaydi/paketi YA DA ayni ay icin daha yuksek numarali paket kaydi. Grup: kendisi yeni aya
// yazilmis YA DA ikiz "(N. Paket)" grubu (ayni kisilerin, numarasi buyuk ya da ayi yeni;
// secondOfGroup bagi varsa kisi-kumesi sarti aranmaz).
function __pkgNumOfName(name) { const mt = /\\((\\d+)\\.\\s*Paket\\)\\s*$/.exec(name || ''); return mt ? +mt[1] : 0; }
function __supersededMemberFin(mid, ay) {
  const me = (state.members || []).find(function(x){ return x && x.id === mid; });
  if (!me || !ay) return false;
  const rootId = me.secondOfMember || me.id;
  const myNum = __pkgNumOfName(me.name) || 1;
  let sup = false;
  (state.members || []).forEach(function(x){
    if (sup || !x || x.archived) return;
    if ((x.secondOfMember || x.id) !== rootId) return;
    ((x.packages) || []).forEach(function(pk){ if (pk && pk.month && pk.month > ay) sup = true; });
    Object.keys(x.monthly || {}).forEach(function(mo){ const e = x.monthly[mo]; if (e && e.enrolled === true && mo > ay) sup = true; });
    if (!sup && x.id !== mid && (__pkgNumOfName(x.name) || 1) > myNum) {
      if (isMemberEnrolledInMonth(x.id, ay) || ((x.packages) || []).some(function(pk){ return pk && pk.month === ay; })) sup = true;
    }
  });
  return sup;
}
function __groupContinuationMonths(x) {
  const mos = new Set();
  ((x.packages) || []).forEach(function(pk){ if (pk && pk.month) mos.add(pk.month); });
  Object.keys(x.monthlyMembers || {}).forEach(function(mo){ if ((x.monthlyMembers[mo] || []).length) mos.add(mo); });
  if (!mos.size) { // eski elle-acilmis ikizler: kadro-ay kaydi yoksa ders aylari
    (state.lessons || []).forEach(function(l){
      if (!l || l.status === 'cancelled' || l.groupId !== x.id) return;
      const pm = l.packageMonth || String(l.date || '').slice(0, 7);
      if (pm) mos.add(pm);
    });
  }
  return mos;
}
function __supersededGroupFin(gid, ay) {
  const g = (state.groups || []).find(function(x){ return x && x.id === gid; });
  if (!g || !ay) return false;
  if (((g.packages) || []).some(function(pk){ return pk && pk.month && pk.month > ay; })) return true;
  if (Object.keys(g.monthlyMembers || {}).some(function(mo){ return mo > ay && (g.monthlyMembers[mo] || []).length > 0; })) return true;
  const __rootOfM = function(mid){ const mm = (state.members || []).find(function(y){ return y && y.id === mid; }); return mm ? (mm.secondOfMember || mm.id) : mid; };
  const rootGid = g.secondOfGroup || g.id;
  const myNum = (+g.pkgNo) || __pkgNumOfName(g.name) || 1;
  const myP = new Set((resolveGroupMembersForMonth(g, ay) || []).filter(Boolean).map(__rootOfM));
  return (state.groups || []).some(function(x){
    if (!x || x.id === gid || x.archived) return false;
    const linked = !!(x.secondOfGroup || g.secondOfGroup) && ((x.secondOfGroup || x.id) === rootGid);
    if (!linked) { // eski ikizler: kadrosu ayni KISILERIN (alt)kumesi olan >=2 kisilik grup
      const xP = ((x.memberIds) || []).filter(Boolean).map(__rootOfM);
      if (xP.length < 2 || !myP.size) return false;
      if (!xP.every(function(p){ return myP.has(p); })) return false;
    }
    const xNum = (+x.pkgNo) || __pkgNumOfName(x.name) || 1;
    const mos = __groupContinuationMonths(x);
    let newer = false;
    mos.forEach(function(mo){ if (mo > ay || (mo === ay && xNum > myNum)) newer = true; });
    return newer;
  });
}""")

# ---------- A) lowfin'e baglama: grup satiri ----------
rep("""      const st = __st(fin); if (!st) return;
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, ay), ay: ay, st: st, fin: fin });""",
"""      const st = __st(fin); if (!st) return;
      if (st === 2 && __supersededGroupFin(g.id, ay)) return; // v157: yeni paket yazilmis — Biten satiri duser
      rows.push({ tip:'group', id:g.id, ad: groupDisplayName(g, ay), ay: ay, st: st, fin: fin });""")

# ---------- A) lowfin'e baglama: uye satiri ----------
rep("""      const st = __st(fin); if (!st) return;
      rows.push({ tip:'member', id:mm.id, ad: mm.name, ay: ay, st: st, fin: fin });""",
"""      const st = __st(fin); if (!st) return;
      if (st === 2 && __supersededMemberFin(mm.id, ay)) return; // v157: yeni paket yazilmis — Biten satiri duser
      rows.push({ tip:'member', id:mm.id, ad: mm.name, ay: ay, st: st, fin: fin });""")

# ---------- C) grup "+ N. Paket": motor ----------
rep("""// ========== EMPTY SLOT FILL ==========""",
"""// v157 (Kerem): GRUBA "+ N. Paket" — uyelerdeki v149/v150 akisinin grup karsiligi.
// Ikizler secondOfGroup ile koke, numara pkgNo ile kayda baglanir. Numara kurali v150'nin aynisi:
// o AY KADROLU (aktif kadrosu bos olmayan) arsivsiz ikiz numarayi tutar; teklif = en kucuk bos >= 2;
// o numarali UYUYAN ikiz (arsivsiz ama o ay kadrosuz) YENIDEN KULLANILIR — mukerrer grup acilmaz.
function groupPkgRootId(g) { return (g && (g.secondOfGroup || g.id)) || ''; }
function groupPkgSlotForMonth(rootGid, monthISO) {
  const ay = monthISO || currentMonth();
  const taken = {}; const dormant = {};
  (state.groups || []).forEach(function(x){
    if (!x || x.archived) return;
    if ((x.secondOfGroup || '') !== rootGid) return;
    const n = (+x.pkgNo) || __pkgNumOfName(x.name) || 0; if (!n) return;
    if ((activeGroupRosterForMonth(x, ay) || []).length) taken[n] = true;
    else if (!dormant[n]) dormant[n] = x;
  });
  let n = 2; while (taken[n]) n++;
  return { n: n, reuse: dormant[n] || null };
}
function createGroupSecondPackage(groupId, monthISO) {
  const g = state.groups.find(function(x){ return x.id === groupId; }); if (!g) return;
  const ay = monthISO || ((typeof currentGroupDetailMonth !== 'undefined' && currentGroupDetailMonth) || currentMonth());
  const rootGid = groupPkgRootId(g);
  const slot = groupPkgSlotForMonth(rootGid, ay);
  if (slot.reuse) {
    const r = slot.reuse;
    if (!confirm('"' + groupDisplayName(r, ay) + '" grup kaydı zaten var (geçmiş bir aydan). ' + ay + ' ayı için kadrosu YENİDEN ETKİNLEŞTİRİLECEK — yeni grup açılmaz; ödeme/ders geçmişi aynı kayıtta birikir.\\n\\nDevam?')) return;
    const ros = (r.memberIds || []).filter(Boolean);
    ros.forEach(function(mid){ reactivateMemberForMonth(mid, ay); });
    r.monthlyMembers = r.monthlyMembers || {}; r.monthlyMembers[ay] = ros.slice();
    save(); renderMembers(); renderGroups(); renderDashboard();
    openGroupDetail(r.id, ay);
    if (typeof plToast === 'function') { try { plToast(groupDisplayName(r, ay) + ' bu aya eklendi — paket/ödemeyi buradan gir'); } catch(e){} }
    return;
  }
  const srcRos = activeGroupRosterForMonth(g, ay);
  if (!srcRos.length) { alert('Bu ayın kadrosu boş — önce kadroyu doldur.'); return; }
  const n = slot.n;
  if (!confirm('Bu grubun ' + ay + ' kadrosundaki her üye için kendi "(N. Paket)" klon kaydı açılacak (varsa uyuyan kaydı uyandırılır) ve bunlarla BAĞIMSIZ bir ' + n + '. paket grubu oluşturulacak.\\n\\n• Aynı kişiler, ayrı paket: ödeme, ders ve ders hakkı ayrı tutulur.\\n• Aktif üye SAYISI değişmez.\\n\\nDevam?')) return;
  const cloneIds = srcRos.map(function(mid){
    const mm = state.members.find(function(x){ return x.id === mid; }); if (!mm) return null;
    const rootId = mm.secondOfMember || mm.id;
    const ms = pkgSlotForMonth(rootId, ay);
    if (ms.reuse) { reactivateMemberForMonth(ms.reuse.id, ay); return ms.reuse.id; }
    const root = state.members.find(function(x){ return x.id === rootId; }) || mm;
    const rootName = (root.name || 'Üye').replace(/\\s*\\(\\d+\\.\\s*Paket\\)\\s*$/, '').trim();
    const clone = {
      id: uid(), name: rootName + ' (' + ms.n + '. Paket)', secondOfMember: rootId,
      joinDate: root.joinDate || todayISO(),
      phone: root.phone || '', tcno: '', adres: '', instructorId: root.instructorId || '',
      health: '', note: '', instructorShareRate: null,
      totalPrice: (root.totalPrice !== undefined ? root.totalPrice : ''),
      defaultPackageId: root.defaultPackageId || '',
      monthly: {}, packages: [], archived: false
    };
    clone.monthly[ay] = { enrolled: true };
    state.members.push(clone); return clone.id;
  }).filter(Boolean);
  const ng = {
    id: uid(), name: (typeof autoGroupName === 'function' ? autoGroupName(cloneIds) : '') || (groupDisplayName(g, ay) + ' (' + n + '. Paket)'),
    secondOfGroup: rootGid, pkgNo: n, size: g.size || cloneIds.length,
    memberIds: cloneIds.slice(),
    defaultInstructorId: g.defaultInstructorId || '', defaultPackageId: g.defaultPackageId || '',
    defaultTime: g.defaultTime || '', defaultDays: (g.defaultDays || []).slice(),
    monthlyMembers: {}, monthlyNotes: {}, packages: [], note: ''
  };
  ng.monthlyMembers[ay] = cloneIds.slice();
  state.groups.push(ng);
  save(); renderMembers(); renderGroups(); renderDashboard();
  openGroupDetail(ng.id, ay);
  if (typeof plToast === 'function') { try { plToast(n + '. paket grubu açıldı — ödeme/dersleri buradan yönet'); } catch(e){} }
}
// ========== EMPTY SLOT FILL ==========""")

# ---------- C) grup detay butonu ----------
rep("""      <button class="btn secondary" onclick="openGroupModal('${id}')" title="Grubu düzenle — grup detayı arka planda açık kalır">Düzenle</button>""",
"""      <button class="btn secondary" onclick="openGroupModal('${id}')" title="Grubu düzenle — grup detayı arka planda açık kalır">Düzenle</button>
      ${!g.archived ? (() => { const __gAy157 = monthISO || currentMonth(); const __gs157 = groupPkgSlotForMonth(groupPkgRootId(g), __gAy157); const __gt157 = __gs157.reuse ? `"${groupDisplayName(__gs157.reuse, __gAy157)}" grup kaydı ${__gAy157} için yeniden etkinleştirilir (yeni kayıt açılmaz; geçmişi aynı kayıtta birikir)` : `Aynı üyelerle BAĞIMSIZ ${__gs157.n}. paket grubu oluştur — kadrodaki her üye için kendi klon kaydı açılır/uyandırılır (aktif üye sayısı değişmez)`; return `<button class="btn secondary pl-owner-only" onclick="createGroupSecondPackage('${id}','${monthISO||''}')" title="${__gt157}">+ ${__gs157.n}. Paket</button>`; })() : ''}""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.30.79">', '<meta name="app-version" content="2026.08.30.80">')
rep("const APP_VERSION = '2026.08.30.79';", "const APP_VERSION = '2026.08.30.80';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v156-2026-08-30-79';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v157-2026-08-30-80';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
