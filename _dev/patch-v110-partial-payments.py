#!/usr/bin/env python3
# v110 (Kerem): TAKSIT KANONU
# - Ayni ay paketine BIRDEN COK odeme (taksit) SERBEST; TOPLAM, uyenin o ay TANIMLI fiyatini ASAMAZ (tavan).
# - Fiyat TANIMSIZSA eski mukerrer korumasi surer (kazara cift kayit engeli) + kullanici fiyata yonlendirilir.
# - Toplu grup odemesi: uye bazinda KALANLA sinirlanir; tam odemis uye atlanir.
# - Hizli tik: kismen odenmis uyede tik = KALANI tahsil et; tam odenmiste eski davranis (kaldir/onay).
# - RENK: satir yesili artik TAM odeyince (taksitli uye sari kalir; grup komple yesil = herkes TAM).
# - HOCA MAASI ETKILENMEZ: v41 kanonu (tanimli ay fiyati/8 x katilan x oran) odemelerden bagimsizdir — testle kanitli.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---- A) Kanonik yardimcilar ----
rep(
    "function memberPaidInMonth(memberId, monthISO){",
    "// v110 (Kerem) TAKSIT KANONU: ayni ay paketine COK odeme olur; TOPLAM tanimli fiyati ASAMAZ.\n"
    "function memberPaidTowardsMonth(memberId, groupId, monthISO, excludePayId) {\n"
    "  return (state.payments || []).reduce((a, p) => {\n"
    "    if (!p || p.memberId !== memberId) return a;\n"
    "    if ((p.groupId || '') !== (groupId || '')) return a;\n"
    "    if ((p.packageMonth || String(p.date || '').slice(0, 7)) !== monthISO) return a;\n"
    "    if (excludePayId && p.id === excludePayId) return a;\n"
    "    return a + (+p.amount || 0);\n"
    "  }, 0);\n"
    "}\n"
    "function paymentCapCheck(memberId, groupId, monthISO, newAmount, excludePayId) {\n"
    "  const defined = +memberMonthlyTotalPrice(memberId, monthISO) || 0;\n"
    "  const paid = memberPaidTowardsMonth(memberId, groupId, monthISO, excludePayId);\n"
    "  if (defined <= 0) return { ok: true, defined: 0, paid, kalan: null };\n"
    "  const kalan = Math.max(0, Math.round((defined - paid) * 100) / 100);\n"
    "  const ok = (paid + (+newAmount || 0)) <= defined + 0.005;\n"
    "  return { ok, defined, paid, kalan };\n"
    "}\n"
    "function memberPaidInMonth(memberId, monthISO){",
    1, "cap-helpers")

# ---- B) savePayment: mukerrer engeli -> tavan kontrolu ----
rep(
    "  // v18: Ayni uyeye ayni paket ayi icin IKINCI odeme kaydi acilamaz (mukerrer engeli)\n"
    "  if (!id) {\n"
    "    const __dupMonth = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7);\n"
    "    const __dup = state.payments.find(pp => pp.memberId === memberId && (pp.groupId||'') === (groupId||'') && (pp.packageMonth || String(pp.date||'').slice(0,7)) === __dupMonth); // v22: 2. paket (farkli grup kaydi) ayri sayilir\n"
    "    if (__dup) {\n"
    "      const __dm = state.members.find(x=>x.id===memberId);\n"
    "      alert(`⛔ ${(__dm&&__dm.name)||'Üye'} için ${__dupMonth} ayında zaten ${money(__dup.amount)} ₺ ödeme kaydı var.\\n\\nAynı ay için ikinci ödeme alınamaz. Tutarı düzeltmek istersen mevcut kaydı üye detayındaki Ödeme Geçmişi'nden açıp düzenle.`);\n"
    "      return;\n"
    "    }\n"
    "  }",
    "  // v110 (Kerem): TAKSIT SERBEST, TANIMLI FIYAT ASILAMAZ. Fiyat tanimsizsa eski mukerrer korumasi surer.\n"
    "  {\n"
    "    const __pmMonth = ((document.getElementById('mp-pkg-month')||{}).value) || String(date).slice(0,7);\n"
    "    const __cap = paymentCapCheck(memberId, groupId, __pmMonth, amount, id || '');\n"
    "    if (__cap.defined > 0) {\n"
    "      if (!__cap.ok) {\n"
    "        const __dm = state.members.find(x=>x.id===memberId);\n"
    "        markInvalid('mp-amount', 'Tanımlı fiyat aşılıyor');\n"
    "        alert(`⛔ ${(__dm&&__dm.name)||'Üye'} — ${__pmMonth} paketi ${money(__cap.defined)} ₺.\\nŞimdiye kadar ödenen: ${money(__cap.paid)} ₺.\\nEn fazla ${money(__cap.kalan)} ₺ daha alınabilir (taksit toplamı tanımlı fiyatı aşamaz).`);\n"
    "        return;\n"
    "      }\n"
    "    } else if (!id) {\n"
    "      const __dup = state.payments.find(pp => pp.memberId === memberId && (pp.groupId||'') === (groupId||'') && (pp.packageMonth || String(pp.date||'').slice(0,7)) === __pmMonth);\n"
    "      if (__dup) {\n"
    "        const __dm = state.members.find(x=>x.id===memberId);\n"
    "        alert(`⛔ ${(__dm&&__dm.name)||'Üye'} için ${__pmMonth} ayında zaten ${money(__dup.amount)} ₺ ödeme var ve üyenin TANIMLI fiyatı yok.\\n\\nTaksitli tahsilat için önce üyeye aylık fiyat tanımla — taksitler tanımlı fiyata kadar serbest olur.`);\n"
    "        return;\n"
    "      }\n"
    "    }\n"
    "  }",
    1, "savePayment-cap")

# ---- C) saveGroupPaymentAll: uye bazinda kalanla sinirla ----
rep(
    "  // v18: Bu ay zaten odemesi olan uyeler ATLANIR (mukerrer engeli)\n"
    "  const __dupNames = [], __targetMids = [];\n"
    "  for (const mid of (g.memberIds||[])) {\n"
    "    if (!mid) continue;\n"
    "    const __d = state.payments.find(pp => pp.memberId === mid && (pp.groupId||'') === (groupId||'') && (pp.packageMonth || String(pp.date||'').slice(0,7)) === packageMonth); // v22: grup-bazli\n"
    "    if (__d) { const __m = state.members.find(x=>x.id===mid); __dupNames.push((__m&&__m.name)||mid); }\n"
    "    else __targetMids.push(mid);\n"
    "  }\n"
    "  if (!__targetMids.length) { alert(`⛔ ${packageMonth} ayında grubun tüm üyelerinin zaten ödeme kaydı var. İkinci ödeme alınamaz.`); return; }\n"
    "  let __cmsg = `\"${groupDisplayName(g, (document.getElementById('mp-pkg-month')||{}).value || currentMonth())}\" grubunda ${__targetMids.length} üye için kişi başı ${money(amount)} ₺ ödeme kaydı açılacak (toplam ${money(amount*__targetMids.length)} ₺).`;\n"
    "  if (__dupNames.length) __cmsg += `\\n\\n⚠️ Bu ay zaten ödemesi olduğu için ATLANACAKLAR:\\n  • ${__dupNames.join('\\n  • ')}`;\n"
    "  __cmsg += '\\n\\nDevam?';\n"
    "  if (!confirm(__cmsg)) return;\n"
    "  for (const mid of __targetMids) {\n"
    "    const rec = buildPaymentRecord('', mid, groupId, date, pkgObj, sessions, listPrice, amount, method, campaignId, campaignName, note, false);\n"
    "    rec.packageMonth = packageMonth;\n"
    "    state.payments.push(rec);\n"
    "    if (isMemberArchived(mid)) unarchiveMember(mid);\n"
    "    if (packageMonth >= ROSTER_START_MONTH) setMemberMonthly(mid, packageMonth, { enrolled: true }); // v23\n"
    "  }",
    "  // v110 (Kerem): TAKSIT KANONU — uye bazinda KALANLA sinirla; tam odemis uye atlanir; fiyat tanimsizsa eski mukerrer kurali.\n"
    "  const __dupNames = [], __targetMids = [], __adjNotes = [], __amtByMid = {};\n"
    "  for (const mid of (g.memberIds||[])) {\n"
    "    if (!mid) continue;\n"
    "    const __m = state.members.find(x=>x.id===mid);\n"
    "    const __cap = paymentCapCheck(mid, groupId, packageMonth, amount, '');\n"
    "    if (__cap.defined > 0) {\n"
    "      if (__cap.kalan <= 0.005) { __dupNames.push(((__m&&__m.name)||mid) + ' (tam ödendi)'); continue; }\n"
    "      const __use = Math.min(+amount || 0, __cap.kalan);\n"
    "      if (__use < (+amount || 0) - 0.005) __adjNotes.push(((__m&&__m.name)||mid) + ': ' + money(__use) + ' ₺ (kalanla sınırlandı)');\n"
    "      __amtByMid[mid] = __use; __targetMids.push(mid);\n"
    "    } else {\n"
    "      const __d = state.payments.find(pp => pp.memberId === mid && (pp.groupId||'') === (groupId||'') && (pp.packageMonth || String(pp.date||'').slice(0,7)) === packageMonth);\n"
    "      if (__d) { __dupNames.push(((__m&&__m.name)||mid) + ' (fiyat tanımsız, kaydı var)'); continue; }\n"
    "      __amtByMid[mid] = +amount || 0; __targetMids.push(mid);\n"
    "    }\n"
    "  }\n"
    "  if (!__targetMids.length) { alert(`⛔ ${packageMonth} ayında ödeme alınabilecek üye yok (hepsi tam ödemiş ya da kayıtlı).`); return; }\n"
    "  const __totAll = __targetMids.reduce((a, mid) => a + (__amtByMid[mid] || 0), 0);\n"
    "  let __cmsg = `\"${groupDisplayName(g, (document.getElementById('mp-pkg-month')||{}).value || currentMonth())}\" grubunda ${__targetMids.length} üye için ödeme kaydı açılacak (toplam ${money(__totAll)} ₺).`;\n"
    "  if (__adjNotes.length) __cmsg += `\\n\\n💡 Kalanla sınırlananlar:\\n  • ${__adjNotes.join('\\n  • ')}`;\n"
    "  if (__dupNames.length) __cmsg += `\\n\\n⚠️ ATLANACAKLAR:\\n  • ${__dupNames.join('\\n  • ')}`;\n"
    "  __cmsg += '\\n\\nDevam?';\n"
    "  if (!confirm(__cmsg)) return;\n"
    "  for (const mid of __targetMids) {\n"
    "    const __amt = __amtByMid[mid] || 0;\n"
    "    const rec = buildPaymentRecord('', mid, groupId, date, pkgObj, sessions, listPrice, __amt, method, campaignId, campaignName, note, false);\n"
    "    rec.packageMonth = packageMonth;\n"
    "    state.payments.push(rec);\n"
    "    if (isMemberArchived(mid)) unarchiveMember(mid);\n"
    "    if (packageMonth >= ROSTER_START_MONTH) setMemberMonthly(mid, packageMonth, { enrolled: true }); // v23\n"
    "  }",
    1, "groupPayAll-cap")

# ---- D) togglePaidTick: kismi odemede tik = KALANI tahsil ----
rep(
    "  const existing = state.payments.filter(p => p.memberId===memberId && (isGroup ? p.groupId===groupId : !p.groupId) && __payAyOf(p) === ay);\n"
    "  if (existing.length > 0) {",
    "  const existing = state.payments.filter(p => p.memberId===memberId && (isGroup ? p.groupId===groupId : !p.groupId) && __payAyOf(p) === ay);\n"
    "  // v110 (Kerem): KISMEN odenmisse tik = KALANI tahsil et (taksit tamamlama). Tam odenmiste eski davranis.\n"
    "  const __paidSum = existing.reduce((a,p)=>a+(+p.amount||0),0);\n"
    "  const __defPrice = +memberMonthlyTotalPrice(memberId, ay) || 0;\n"
    "  if (existing.length > 0 && __defPrice > 0 && __paidSum < __defPrice - 0.005) {\n"
    "    const __kal = Math.round((__defPrice - __paidSum) * 100) / 100;\n"
    "    if (!confirm(`\"${m.name}\" ${ay}: ${money(__paidSum)} ₺ ödendi, kalan ${money(__kal)} ₺.\\n\\nKalanı da ÖDENDİ olarak kaydedeyim mi?\\n(Vazgeç = değişiklik yok; taksitler Ödemeler sayfasından da girilebilir)`)) return;\n"
    "    const __pk0 = (isGroup && g && g.defaultPackageId ? state.packageTypes.find(p=>p.id===g.defaultPackageId) : null) || state.packageTypes[0] || { price: __kal, sessions: 8 };\n"
    "    const __rec2 = buildPaymentRecord('', memberId, groupId||'', todayISO(), __pk0, +__pk0.sessions||8, __kal, __kal, 'Nakit', '', '', 'Tik ile kalan tahsil', false);\n"
    "    __rec2.autoTick = true; __rec2.packageMonth = ay;\n"
    "    state.payments.push(__rec2);\n"
    "    save(); renderMembers(); renderPayments(); renderDashboard(); renderGroups(); refreshGroupDetailIfOpen();\n"
    "    return;\n"
    "  }\n"
    "  if (existing.length > 0) {",
    1, "tick-partial")

# ---- E) RENK: yesil = TAM odeme ----
rep(
    "    let isPaid;\n"
    "    if (r.isEmpty) {\n"
    "      isPaid = false; // BOŞ slotlar pay-ok/pay-due almasın\n"
    "    } else if (r.type === 'group') {\n"
    "      isPaid = r.groupFullyPaid || (+r.paid || 0) > 0;\n"
    "    } else {\n"
    "      isPaid = (+r.paid || 0) > 0;\n"
    "    }",
    "    let isPaid;\n"
    "    if (r.isEmpty) {\n"
    "      isPaid = false; // BOŞ slotlar pay-ok/pay-due almasın\n"
    "    } else if (r.type === 'group') {\n"
    "      const __own = +r.ownPrice || 0; // v110: TAKSIT — yesil ancak TAM odeyince (kismi sari kalir)\n"
    "      isPaid = r.groupFullyPaid || (__own > 0 ? ((+r.paid || 0) >= __own - 0.005) : (+r.paid || 0) > 0);\n"
    "    } else {\n"
    "      const __own = +r.totalPrice || 0; // v110\n"
    "      isPaid = __own > 0 ? ((+r.paid || 0) >= __own - 0.005) : (+r.paid || 0) > 0;\n"
    "    }",
    1, "color-fullpaid")

# ---- Surum ----
rep("2026.07.23.32", "2026.07.23.33", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v110 uygulandi. fark=%d bayt" % (len(s)-len(o)))
