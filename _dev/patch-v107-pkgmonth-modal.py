#!/usr/bin/env python3
# v107 (Kerem):
# A) KOK NEDEN — v46 "akilli sarkan paket": onceki ayda hak kalmissa YENI dersin paket ayi SESSIZCE
#    onceki aya cekiliyordu (ozellikle ayin ILK ders girisinde yeni ay paketi henuz yokken) ->
#    "Temmuz'a girdigim dersler Haziran'a sayiliyor", yeni ay paketi hic dogmuyor, "8 hak" duruyor.
#    YENI KANON: DERS, TARIHININ AYININ paketine yazilir. Sarkan ders = KULLANICI Paket Ayi'ndan ELLE
#    onceki ayi secer (secenekte '📦 N ders kalan' rozeti + secicinin altinda yonlendirici ipucu).
#    ctx (grup detayindan acilan ay) onceligi korunur.
# B) MODAL: 'Grup sec' listesi artik BIREYSEL uyeleri de icerir (optgroup), paket ayi/kalan etiketiyle;
#    secim yapinca hoca + hoca yuzdesi + kapasite + uye tikleri + paket ayi OTOMATIK dolar.
#    'Katilan Uyeler' basligi netlestirildi.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---- A1) smartPkgMonthFor: HER ZAMAN dersin ayi ----
rep(
    "// v46: takvimden ders eklerken akilli varsayilan paket ayi\n"
    "function smartPkgMonthFor(ownerType, ownerId, dateISO) {\n"
    "  const dm = String(dateISO||'').slice(0,7);\n"
    "  if (!ownerId) return dm;\n"
    "  const win = resolvePackageMonthForDate(ownerType, ownerId, dateISO); // 1) tarihi kapsayan (30 gun) sarkan paket\n"
    "  if (win && win !== dm) return win;\n"
    "  const o = ownerType==='group' ? state.groups.find(x=>x.id===ownerId) : state.members.find(x=>x.id===ownerId);\n"
    "  const packs = (o && o.packages) || [];\n"
    "  if (packs.some(pk => pk && pk.month === dm)) return dm; // 2) tarih ayinda paket varsa o\n"
    "  const unfin = ownerUnfinishedMonths(ownerType, ownerId).filter(mo => mo < dm); // 3) onceki ayda BITMEMIS paket\n"
    "  if (unfin.length) return unfin[0];\n"
    "  return dm;\n"
    "}",
    "// v107 KANON (Kerem): DERS, TARIHININ AYININ paketine yazilir — OTOMATIK onceki-ay/sarkan secimi YOK.\n"
    "// (v46'nin 'akilli' secimi, yeni ayin ILK ders girislerini sessizce eski ayin paketine sayiyordu:\n"
    "//  yeni ay paketi hic dogmuyor, eski ay tasiyor, yeni ayda '8 hak' el degmemis gorunuyordu.)\n"
    "// Sarkan ders = kullanici Paket Ayi seciciden ELLE onceki ayi secer ('📦 N ders kalan' rozeti + ipucu).\n"
    "function smartPkgMonthFor(ownerType, ownerId, dateISO) {\n"
    "  return String(dateISO||'').slice(0,7) || currentMonth();\n"
    "}",
    1, "smartPkgMonthFor-canon")

# ---- A2) populateLessonPkgMonth: sarkan IPUCU (onceki ayda kalan varsa yonlendir) ----
rep(
    "    return '<option value=\"'+mo+'\"'+(mo===cur?' selected':'')+'>'+lbl+(mo===dm?' (dersin ayı)':'')+mark+'</option>';\n"
    "  }).join('');\n"
    "}",
    "    return '<option value=\"'+mo+'\"'+(mo===cur?' selected':'')+'>'+lbl+(mo===dm?' (dersin ayı)':'')+mark+'</option>';\n"
    "  }).join('');\n"
    "  // v107: SARKAN IPUCU — onceki ayda ders hakki kalan paket varsa kullaniciyi yonlendir (otomatik SECMEZ)\n"
    "  try {\n"
    "    let hint = document.getElementById('ml-pkg-hint');\n"
    "    if (!hint) { hint = document.createElement('div'); hint.id = 'ml-pkg-hint'; hint.style.cssText = 'font-size:11.5px;color:var(--warn);margin-top:4px;'; sel.parentNode.appendChild(hint); }\n"
    "    const prevRem = (owner.id ? months : []).filter(mo => mo < dm)\n"
    "      .filter(mo => ownerObj && (ownerObj.packages||[]).some(pk => pk && pk.month === mo))\n"
    "      .map(mo => ({ mo, rem: sessionsRemainingFor(owner.type, owner.id, mo) }))\n"
    "      .filter(x => x.rem > 0);\n"
    "    if (prevRem.length && cur === dm) {\n"
    "      const p0 = prevRem[prevRem.length - 1];\n"
    "      hint.textContent = '💡 ' + __shortMonth(p0.mo) + ' paketinde ' + p0.rem + ' ders hakkı kalmış. Bu ders o paketin SARKAN dersi ise yukarıdan ' + __shortMonth(p0.mo) + ' seç; değilse dokunma (dersin ayına sayılır).';\n"
    "      hint.style.display = 'block';\n"
    "    } else { hint.style.display = 'none'; hint.textContent = ''; }\n"
    "  } catch(e) {}\n"
    "}",
    1, "pkg-hint")

# ---- A3) saveLesson fallback: resolvePM yerine dersin ayi ----
rep(
    "  else if (groupId) packageMonth = (window.__lessonCtxMonth || resolvePackageMonthForDate('group', groupId, date));\n"
    "  else if (checked.length === 1) packageMonth = resolvePackageMonthForDate('member', checked[0], date);",
    "  else if (groupId) packageMonth = (window.__lessonCtxMonth || String(date).slice(0,7)); // v107: dersin ayi (otomatik sarkan YOK)\n"
    "  else if (checked.length === 1) packageMonth = String(date).slice(0,7); // v107: dersin ayi",
    1, "saveLesson-pm-fallback")

# ---- A4) addGroupLesson: hizli ekleme de dersin ayina ----
rep(
    "  const __pm = ctxMonth || resolvePackageMonthForDate('group', groupId, dISO); // v38: grup detay ayina",
    "  const __pm = ctxMonth || String(dISO).slice(0,7); // v107: ctx yoksa DERSIN AYI (otomatik sarkan YOK)",
    1, "addGroupLesson-pm")

# ---- B1) Birlesik secici: gruplar + BIREYSEL uyeler (optgroup), dm-bazli kalan etiketi ----
rep(
    "  const gSel = document.getElementById('ml-group-select');\n"
    "  if (gSel) {\n"
    "    gSel.innerHTML = '<option value=\"\">— Grup seçmeden —</option>' + state.groups.map(g=>{ const __ml = ownerPkgMonthLabel('group', g.id); return `<option value=\"${g.id}\" ${g.id===l.groupId?'selected':''}>${groupDisplayName(g, __gnAy)} (${g.size} kişi)${__ml?' · '+__ml:''}</option>`; }).join('');\n"
    "  }",
    "  const gSel = document.getElementById('ml-group-select');\n"
    "  if (gSel) {\n"
    "    // v107 (Kerem): BIREYSEL uyeler de listede — paket ayi/kalan etiketiyle; secim = otomatik dolgu.\n"
    "    const __selAy = __gnAy;\n"
    "    const __remLbl = (ty, oid) => { try { const r = sessionsRemainingFor(ty, oid, __selAy); return '📦 ' + __shortMonth(__selAy) + ': ' + r + ' kalan'; } catch(e) { return ''; } };\n"
    "    const __gOpts = state.groups.filter(g => g && !(typeof isGroupInactiveInMonth==='function' && isGroupInactiveInMonth(g, __selAy))).map(g => {\n"
    "      const lbl = __remLbl('group', g.id);\n"
    "      return `<option value=\"${g.id}\" ${g.id===l.groupId?'selected':''}>${groupDisplayName(g, __selAy)} (${g.size} kişi)${lbl?' · '+lbl:''}</option>`;\n"
    "    }).join('');\n"
    "    const __inGroupThatMonth = (mid) => state.groups.some(gr => gr && !(typeof isGroupInactiveInMonth==='function' && isGroupInactiveInMonth(gr, __selAy)) && activeGroupRosterForMonth(gr, __selAy).includes(mid));\n"
    "    const __indivs = state.members.filter(m => m && __memberActiveInMonth(m, __selAy) && !__inGroupThatMonth(m.id))\n"
    "      .sort((a,b)=> (a.name||'').localeCompare(b.name||'','tr'));\n"
    "    const __preSel = (!l.groupId && Array.isArray(l.memberIds) && l.memberIds.length===1) ? ('m:'+l.memberIds[0]) : '';\n"
    "    const __mOpts = __indivs.map(m => {\n"
    "      const lbl = __remLbl('member', m.id);\n"
    "      return `<option value=\"m:${m.id}\" ${('m:'+m.id)===__preSel?'selected':''}>${escapeHtml(m.name||m.id)} · Bireysel${lbl?' · '+lbl:''}</option>`;\n"
    "    }).join('');\n"
    "    gSel.innerHTML = '<option value=\"\">— Serbest seçim —</option>'\n"
    "      + (__gOpts ? ('<optgroup label=\"Gruplar\">' + __gOpts + '</optgroup>') : '')\n"
    "      + (__mOpts ? ('<optgroup label=\"Bireysel Üyeler\">' + __mOpts + '</optgroup>') : '');\n"
    "  }",
    1, "unified-picker")

# ---- B2) applyGroupToLesson: 'm:' dali + hoca yuzdesi otomatik ----
rep(
    "function applyGroupToLesson(groupId) {\n"
    "  if (!groupId) {",
    "function __lessonRatePlaceholder() { // v107: secili sahibe gore cozulen hoca yuzdesi placeholder'da\n"
    "  try {\n"
    "    const rateInp = document.getElementById('ml-instructor-rate'); if (!rateInp) return;\n"
    "    const gid = (document.getElementById('ml-group')||{}).value || '';\n"
    "    const checked = [...document.querySelectorAll('#ml-members input:checked')].map(x=>x.value);\n"
    "    const fake = { groupId: gid, memberIds: checked, instructorId: (document.getElementById('ml-instructor')||{}).value || '',\n"
    "      packageMonth: ((document.getElementById('ml-pkg-month')||{}).value) || '', date: (document.getElementById('ml-date')||{}).value || todayISO() };\n"
    "    rateInp.placeholder = 'Varsayılan: %' + resolveInstructorRate(fake);\n"
    "  } catch(e) {}\n"
    "}\n"
    "function applyMemberToLesson(memberId) { // v107: birlesik secicide BIREYSEL uye secimi = otomatik dolgu\n"
    "  const m = state.members.find(x => x.id === memberId); if (!m) return;\n"
    "  const __gh = document.getElementById('ml-group'); if (__gh) __gh.value = '';\n"
    "  const szEl = document.getElementById('ml-size'); if (szEl) szEl.value = 1;\n"
    "  const insSel = document.getElementById('ml-instructor');\n"
    "  if (insSel && m.instructorId && state.instructors.find(i=>i.id===m.instructorId)) insSel.value = m.instructorId;\n"
    "  renderLessonMembersCheckboxes([memberId]);\n"
    "  try { populateLessonPkgMonth(smartPkgMonthFor('member', memberId, (document.getElementById('ml-date')||{}).value || todayISO())); } catch(e) {}\n"
    "  __lessonRatePlaceholder();\n"
    "}\n"
    "function applyGroupToLesson(groupId) {\n"
    "  if (String(groupId||'').slice(0,2) === 'm:') { applyMemberToLesson(String(groupId).slice(2)); return; } // v107\n"
    "  if (!groupId) {",
    1, "apply-member-branch")

rep(
    "  const __apm = ((document.getElementById('ml-pkg-month')||{}).value) || ((document.getElementById('ml-date')||{}).value||'').slice(0,7) || currentMonth();\n"
    "  renderLessonMembersCheckboxes(activeGroupRosterForMonth(g, __apm)); // v57: preselect = o ayin AKTIF kadrosu\n"
    "}",
    "  const __apm = ((document.getElementById('ml-pkg-month')||{}).value) || ((document.getElementById('ml-date')||{}).value||'').slice(0,7) || currentMonth();\n"
    "  renderLessonMembersCheckboxes(activeGroupRosterForMonth(g, __apm)); // v57: preselect = o ayin AKTIF kadrosu\n"
    "  __lessonRatePlaceholder(); // v107: grubun cozulen hoca yuzdesi aninda gorunur\n"
    "}",
    1, "apply-group-rate")

# ---- B3) Etiketler ----
rep(
    "      <label>Grup (hızlı dolgu için seç — üye/hoca/kapasite otomatik gelir)</label>",
    "      <label>Kim için? (grup ya da bireysel üye seç — hoca, yüzde, kapasite ve paket ayı otomatik dolar)</label>",
    1, "picker-label")
rep(
    "      <label>Katılan Üyeler (dersin kapasitesi kadar seç)</label>",
    "      <label>Katılanlar — yukarıdan seçince otomatik işaretlenir; tek tek tik ekle/kaldır da yapabilirsin</label>",
    1, "members-label")

# ---- Surum ----
rep("2026.07.22.29", "2026.07.22.30", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v107 uygulandi. fark=%d bayt" % (len(s)-len(o)))
