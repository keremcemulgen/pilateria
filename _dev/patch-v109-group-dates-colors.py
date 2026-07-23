#!/usr/bin/env python3
# v109 (Kerem — ekran goruntusu):
# 1) TARIH TUTARSIZLIGI: grup uyesinin paket baslangic/bitisi KISI-BAZLI turetiliyordu (kendi ilk dersi/
#    odemesi) -> gec katilan uyede tarih var, digerlerinde '—' gorunuyordu. KOK FIX: grup uyesinin penceresi =
#    GRUBUN penceresi (herkes AYNI): uyenin ELLE override'i -> grubun o ay paket baslangici -> grubun o ayin
#    (pm kanonu) ILK DERSI -> uyenin odemesi. Bireysel uyeler degismedi.
# 2) RENK: grup adi + Grup Toplami/Odenen/Kalan hucreleri SABIT renkte (ilk satirin bos-kirmizi/odenmis-yesil/
#    hover rengini ASLA almaz). Uye odedikce KENDI satiri yesil (mevcut). TUM uyeler odeyince grup KOMPLE yesil
#    (grp-all-paid; bireysel odenmis yesiliyle AYNI ton #E8F5E9).
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---- 1) Grup uyesi paket penceresi = grubun penceresi ----
rep(
    "      // Aylık paket başlangıç (override → o ayın ilk dersi → ödemesi → fallback joinDate)\n"
    "      const memberStart = monthISO\n"
    "        ? (memberMonthlyPackageStart(mid, monthISO) || (latestPay ? latestPay.date : ''))\n"
    "        : (m.joinDate || g.packageStartDate || (latestPay ? latestPay.date : ''));",
    "      // v109 (Kerem): GRUP uyesinin paket penceresi = GRUBUN penceresi — TUM uyelerde AYNI tarih.\n"
    "      // Oncelik: uyenin ELLE override'i -> grubun o ay paket baslangici -> grubun o ayin (pm) ilk dersi -> uyenin odemesi.\n"
    "      const __ovStart = monthISO ? (((getMemberMonthlyOverride(mid, monthISO)) || {}).packageStartDate || '') : '';\n"
    "      const __gPkgStart = monthISO ? (((((g.packages || []).find(pp => pp && pp.month === monthISO))) || {}).startDate || '') : '';\n"
    "      const __gFirstLesson = monthISO ? (((state.lessons.filter(l => l && l.groupId === g.id && l.status !== 'cancelled' && ((l.packageMonth || String(l.date || '').slice(0, 7)) === monthISO) && l.date).sort((a, b) => a.date.localeCompare(b.date))[0]) || {}).date || '') : '';\n"
    "      const memberStart = monthISO\n"
    "        ? (__ovStart || __gPkgStart || __gFirstLesson || (latestPay ? latestPay.date : ''))\n"
    "        : (m.joinDate || g.packageStartDate || (latestPay ? latestPay.date : ''));",
    1, "group-member-window")

# ---- 2a) CSS: sabit renkler + komple-yesil ----
rep(
    "  /* Grup adı hücresi her zaman kendi tonunda kalsın */\n"
    "  #members-table tr.pay-due td.grp-name-cell,\n"
    "  #members-table tr.pay-ok  td.grp-name-cell { background: #F3E6C7; }\n"
    "  /* Grup toplam/kalan birleşmiş hücreleri de kendi tonunda */\n"
    "  #members-table tr.pay-due td.grp-merge,\n"
    "  #members-table tr.pay-ok  td.grp-merge { background: #FBF5E7; }",
    "  /* v109 (Kerem): grup adi + birlesik hucreler SABIT renk — ilk satirin (bos-kirmizi/yesil/hover) rengini ASLA almaz */\n"
    "  #members-table td.grp-name-cell { background: #F3E6C7 !important; }\n"
    "  #members-table td.grp-merge { background: #FBF5E7 !important; }\n"
    "  /* v109: grubun TUM uyeleri odedi -> grup KOMPLE yesil (bireysel odenmis yesiliyle ayni) */\n"
    "  #members-table td.grp-name-cell.grp-all-paid,\n"
    "  #members-table td.grp-merge.grp-all-paid { background: #E8F5E9 !important; }",
    1, "fixed-colors-css")

# ---- 2b) Hucrelere grp-all-paid sinifi ----
rep(
    "        groupNameCell = `<td class=\"grp-name-cell\" rowspan=\"${rs}\"",
    "        groupNameCell = `<td class=\"grp-name-cell${r.groupFullyPaid ? ' grp-all-paid' : ''}\" rowspan=\"${rs}\"",
    1, "namecell-allpaid")
rep(
    "        totalCell = `<td class=\"grp-merge\" rowspan=\"${rs}\" style=\"cursor:pointer;\"",
    "        totalCell = `<td class=\"grp-merge${r.groupFullyPaid ? ' grp-all-paid' : ''}\" rowspan=\"${rs}\" style=\"cursor:pointer;\"",
    1, "totalcell-allpaid")
rep(
    "        paidCell = `<td class=\"grp-merge\" rowspan=\"${rs}\"><span class=\"grp-merge-label\">Grup Ödenen</span>${paidDisplay}</td>`;",
    "        paidCell = `<td class=\"grp-merge${r.groupFullyPaid ? ' grp-all-paid' : ''}\" rowspan=\"${rs}\"><span class=\"grp-merge-label\">Grup Ödenen</span>${paidDisplay}</td>`;",
    1, "paidcell-allpaid")
rep(
    "        remainingCell = `<td class=\"grp-merge\" rowspan=\"${rs}\"><span class=\"grp-merge-label\">Grup Kalan</span>${remDisplay}</td>`;",
    "        remainingCell = `<td class=\"grp-merge${r.groupFullyPaid ? ' grp-all-paid' : ''}\" rowspan=\"${rs}\"><span class=\"grp-merge-label\">Grup Kalan</span>${remDisplay}</td>`;",
    1, "remcell-allpaid")

# ---- Surum ----
rep("2026.07.22.31", "2026.07.23.32", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v109 uygulandi. fark=%d bayt" % (len(s)-len(o)))
