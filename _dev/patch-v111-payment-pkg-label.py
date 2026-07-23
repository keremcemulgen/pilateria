#!/usr/bin/env python3
# v111 (Kerem): ODEME LISTELERINDE PAKET ADI = UYENIN O AY ALDIGI PAKET.
# KOK: odeme kaydi olusurken pkgName DAMGALANIYORDU ve tik yolu GRUBUN varsayilanini ya da listedeki
# ILK paketi basiyordu -> uye 'KISI BASI' paketteyken odemede 'INDIRIMLI' gorunuyordu.
# FIX (iki katman):
#  1) GOSTERIM KANONU: paymentPkgLabel(p) = uyenin o ay paketi (ay override -> uye varsayilani) -> yoksa
#     kayitli pkgName. TUM odeme listeleri bunu kullanir -> ESKI yanlis damgali kayitlar da duzelir.
#  2) OLUSTURMA: tik (tam + kalan-tahsil) ve toplu grup odemesi pkgObj'u UYE-ONCELIKLI cozer.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---- A) Kanonik yardimcilar ----
rep(
    "function paymentMonthOf(p){",
    "// v111 (Kerem): odemede gorunen paket = UYENIN O AY ALDIGI paket; kayit damgasi yalniz YEDEK.\n"
    "function memberPkgIdForMonth(memberId, ay) {\n"
    "  const m = state.members.find(x => x.id === memberId);\n"
    "  if (!m) return '';\n"
    "  return ((m.monthly && ay && m.monthly[ay] && m.monthly[ay].packageId) || m.defaultPackageId || '');\n"
    "}\n"
    "function paymentPkgLabel(p) {\n"
    "  const ay = (p && (p.packageMonth || String(p.date || '').slice(0, 7))) || '';\n"
    "  const pid = memberPkgIdForMonth(p && p.memberId, ay);\n"
    "  const pt = pid ? (state.packageTypes || []).find(x => x.id === pid) : null;\n"
    "  return (pt && pt.name) || (p && p.pkgName) || '';\n"
    "}\n"
    "function paymentMonthOf(p){",
    1, "pkg-label-canon")

# ---- B) Gosterimler ----
rep(
    "          return `<tr><td>${fmtDate(p.date)}</td><td>${memberName(p.memberId)}</td><td>${p.pkgName}</td><td><b>${money(p.amount)} ₺</b>${kdvInfo}</td><td>${p.method||'—'}</td></tr>`;",
    "          return `<tr><td>${fmtDate(p.date)}</td><td>${memberName(p.memberId)}</td><td>${escapeHtml(paymentPkgLabel(p))}</td><td><b>${money(p.amount)} ₺</b>${kdvInfo}</td><td>${p.method||'—'}</td></tr>`;",
    1, "group-detail-label")
rep(
    "<td>${escapeHtml(p.pkgName||'')}</td><td>${p.sessions}</td>",
    "<td>${escapeHtml(paymentPkgLabel(p))}</td><td>${p.sessions}</td>",
    1, "member-detail-label")
rep(
    "      <td data-label=\"Paket\">${escapeHtml(p.pkgName||'')}<br>",
    "      <td data-label=\"Paket\">${escapeHtml(paymentPkgLabel(p))}<br>",
    1, "payments-page-label")

# ---- C1) Tik (tam tahsil): uye-oncelikli paket ----
rep(
    "    let pkgObj = null;\n"
    "    if (isGroup && g && g.defaultPackageId) {\n"
    "      pkgObj = state.packageTypes.find(p => p.id === g.defaultPackageId);\n"
    "    }\n"
    "    if (!pkgObj) pkgObj = state.packageTypes[0];",
    "    let pkgObj = null;\n"
    "    const __memberPid = memberPkgIdForMonth(memberId, ay); // v111: ONCE uyenin o ayki paketi\n"
    "    if (__memberPid) pkgObj = state.packageTypes.find(p => p.id === __memberPid);\n"
    "    if (!pkgObj && isGroup && g && g.defaultPackageId) {\n"
    "      pkgObj = state.packageTypes.find(p => p.id === g.defaultPackageId);\n"
    "    }\n"
    "    if (!pkgObj) pkgObj = state.packageTypes[0];",
    1, "tick-member-first")

# ---- C2) Tik (kalan tahsil, v110): uye-oncelikli ----
rep(
    "    const __pk0 = (isGroup && g && g.defaultPackageId ? state.packageTypes.find(p=>p.id===g.defaultPackageId) : null) || state.packageTypes[0] || { price: __kal, sessions: 8 };",
    "    const __pk0 = (function(){ const pid = memberPkgIdForMonth(memberId, ay); return (pid && state.packageTypes.find(p=>p.id===pid)) || (isGroup && g && g.defaultPackageId ? state.packageTypes.find(p=>p.id===g.defaultPackageId) : null) || state.packageTypes[0] || { price: __kal, sessions: 8 }; })(); // v111: uye-oncelikli",
    1, "tick-partial-member-first")

# ---- C3) Toplu grup odemesi: uye-bazli paket ----
rep(
    "    const __amt = __amtByMid[mid] || 0;\n"
    "    const rec = buildPaymentRecord('', mid, groupId, date, pkgObj, sessions, listPrice, __amt, method, campaignId, campaignName, note, false);",
    "    const __amt = __amtByMid[mid] || 0;\n"
    "    const __mPkg = (function(){ const pid = memberPkgIdForMonth(mid, packageMonth); return (pid && state.packageTypes.find(p=>p.id===pid)) || pkgObj; })(); // v111: uyenin kendi paketi\n"
    "    const rec = buildPaymentRecord('', mid, groupId, date, __mPkg, sessions, listPrice, __amt, method, campaignId, campaignName, note, false);",
    1, "groupPayAll-member-pkg")

# ---- Surum ----
rep("2026.07.23.33", "2026.07.23.34", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v111 uygulandi. fark=%d bayt" % (len(s)-len(o)))
