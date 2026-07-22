#!/usr/bin/env python3
# v106 (Kerem — pasife alma / takvim / tik / ay-izolasyonu, 5 KOK NEDEN):
# 1) removeMemberFromMonth grup dersini BOSALTIYOR ama SILMIYORDU -> takvimde '0/4' hayalet planli dersler.
#    FIX: bosalan planli ders SILINIR (bireysel: her zaman; grup: o ayin AKTIF kadrosu da bosaldiysa).
# 2) Bireysel pasif -> dersler 'cancelled' kaliyordu (takvimde cizili gorunur). Kerem: SILINMELI.
#    FIX: ayni silme kurali; migration'da eski 'cancelled+bos' kalintilar da supurulur (tum cihazlarda iyilesir).
# 3) Yarim birakan uye ders MODALINDAN tamamen KAYBOLUYORDU (liste = yalniz aktif kadro).
#    FIX: o AYIN kadro slotlarindaki pasif uyeler listede KALIR — tiksiz + 'ayrıldı' rozeti.
# 4) g.memberJoinDates OKUNUYOR ama HIC YAZILMIYORDU -> yeni gelen uye ayin TUM derslerine (gecmis dahil) yaziliyordu.
#    FIX: assignMemberToSlot katilim tarihini yazar -> katilimdan onceki dersler tiksiz, sonrasi otomatik tikli.
# 5) Ay izolasyonu: mevcut kanon pm = l.packageMonth || ders-ayi her yerde dogru; yeni silme/rozet kurallari da
#    ayni pm kanonunu kullanir; testlerle KANITLANIR (onceki/sonraki ay dersleri birbirine karismaz).
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---- 1+2a) removeMemberFromMonth: bosalan planli dersler SILINIR ----
rep(
    "  // monthISO ve SONRASININ planli grup derslerinden cikar (yapilmis/iptal dersler TARIHSEL — dokunulmaz)\n"
    "  state.lessons.forEach(l => {\n"
    "    if (l.status !== 'planned') return; // v42: hem GRUP hem BIREYSEL planli dersler temizlenir\n"
    "    const __pm = l.packageMonth || (l.date||'').slice(0,7);\n"
    "    if (__pm >= monthISO && (l.memberIds||[]).includes(memberId)) {\n"
    "      l.memberIds = (l.memberIds||[]).filter(x => x !== memberId);\n"
    "      if (!l.groupId && l.memberIds.length === 0) l.status = 'cancelled'; // bos kalan bireysel planli ders iptal olur\n"
    "    }\n"
    "  });",
    "  // monthISO ve SONRASININ planli derslerinden cikar (yapilmis/iptal dersler TARIHSEL — dokunulmaz)\n"
    "  state.lessons.forEach(l => {\n"
    "    if (l.status !== 'planned') return; // v42: hem GRUP hem BIREYSEL planli dersler temizlenir\n"
    "    const __pm = l.packageMonth || (l.date||'').slice(0,7);\n"
    "    if (__pm >= monthISO && (l.memberIds||[]).includes(memberId)) {\n"
    "      l.memberIds = (l.memberIds||[]).filter(x => x !== memberId);\n"
    "    }\n"
    "  });\n"
    "  // v106 (Kerem): BOSALAN planli dersler TAKVIMDEN KALKAR — bireysel: SILINIR;\n"
    "  // grup: o ayin AKTIF kadrosu da bosaldiysa SILINIR (kadroda aktif kalan varsa ders yasar).\n"
    "  state.lessons = state.lessons.filter(l => {\n"
    "    if (!l || l.status !== 'planned') return true;\n"
    "    const __pm = l.packageMonth || (l.date||'').slice(0,7);\n"
    "    if (__pm < monthISO) return true;\n"
    "    if ((l.memberIds||[]).length) return true;\n"
    "    if (!l.groupId) return false;\n"
    "    const gg = state.groups.find(x => x && x.id === l.groupId);\n"
    "    if (!gg) return true;\n"
    "    return activeGroupRosterForMonth(gg, __pm, state, true).length > 0;\n"
    "  });",
    1, "removeMemberFromMonth-prune")

# ---- 2b) MIGRATION: olu ders supurmesi (eski kalintilar tum cihazlarda temizlenir) ----
rep(
    "  } catch(e) { try { console.error('[MIG] roster reconcile', e); } catch(_) {} }\n",
    "  } catch(e) { try { console.error('[MIG] roster reconcile', e); } catch(_) {} }\n"
    "  // v106 (Kerem): OLU DERS SUPURMESI — kimsesi kalmamis dersler takvimde durmasin. Idempotent.\n"
    "  // (a) IPTAL + uye listesi BOS -> SIL (gurultu; icinde uye olan iptaller TARIHSEL, kalir).\n"
    "  // (b) PLANLI bireysel + BOS -> SIL. (c) PLANLI grup + BOS + o ayin AKTIF kadrosu da BOS -> SIL\n"
    "  //     (bilinmeyen uye id'leri KORUNUR: senkron sirasi guvenligi — roster keepUnknown=true).\n"
    "  try {\n"
    "    s.lessons = (s.lessons || []).filter(l => {\n"
    "      if (!l) return false;\n"
    "      const st0 = l.status || 'planned';\n"
    "      const emptyM = !Array.isArray(l.memberIds) || l.memberIds.length === 0;\n"
    "      if (!emptyM) return true;\n"
    "      if (st0 === 'cancelled') return false;\n"
    "      if (st0 !== 'planned') return true;\n"
    "      if (!l.groupId) return false;\n"
    "      const gg = (s.groups || []).find(x => x && x.id === l.groupId);\n"
    "      if (!gg) return true;\n"
    "      const __pm = l.packageMonth || String(l.date || '').slice(0, 7);\n"
    "      return activeGroupRosterForMonth(gg, __pm, s, true).length > 0;\n"
    "    });\n"
    "  } catch(e) { try { console.error('[MIG] olu ders supurme', e); } catch(_) {} }\n",
    1, "migration-dead-lesson-sweep")

# ---- 1b) syncGroupLessonsToRoster: bu grubun bosalan planli dersleri de silinir ----
rep(
    "    if (mids.length > 0 && mids.length > capacityLeftFor(l.date, l.time, lessonDuration(l), l.id)) over.push(`${fmtDate(l.date)} ${l.time}`);\n"
    "  });\n"
    "  return { updated, over };\n"
    "}",
    "    if (mids.length > 0 && mids.length > capacityLeftFor(l.date, l.time, lessonDuration(l), l.id)) over.push(`${fmtDate(l.date)} ${l.time}`);\n"
    "  });\n"
    "  // v106: bu grubun BOSALAN planli dersleri (o ay aktif kadro da BOS) SILINIR — takvimde '0/N' hayalet kalmaz.\n"
    "  state.lessons = state.lessons.filter(l => {\n"
    "    if (!l || l.groupId !== groupId || l.status !== 'planned') return true;\n"
    "    const __pm2 = l.packageMonth || (l.date||'').slice(0,7);\n"
    "    if (__pm2 < fm) return true;\n"
    "    if ((l.memberIds||[]).length) return true;\n"
    "    return activeGroupRosterForMonth(g, __pm2, state, true).length > 0;\n"
    "  });\n"
    "  return { updated, over };\n"
    "}",
    1, "sync-prune")

# ---- 3) Ders modali: ayrilmis (o ay slotta ama pasif) uyeler listede — tiksiz + 'ayrıldı' rozeti ----
rep(
    "  const isPlanned = (l.status || 'planned') === 'planned';\n"
    "  const present = isPlanned ? new Set(__applyRosterOverrides(roster, l, g)) : new Set(l.memberIds || []);\n"
    "  const ids = roster.slice();\n"
    "  if (!isPlanned) (l.memberIds || []).forEach(mid => { if (!ids.includes(mid)) ids.push(mid); });",
    "  const isPlanned = (l.status || 'planned') === 'planned';\n"
    "  const present = isPlanned ? new Set(__applyRosterOverrides(roster, l, g)) : new Set(l.memberIds || []);\n"
    "  const ids = roster.slice();\n"
    "  // v106 (Kerem): o AYIN kadro slotlarinda olup PASIFE ALINMIS (ayrilmis) uyeler LISTEDE KALIR — tiksiz + 'ayrıldı' rozeti.\n"
    "  const __pmL = l.packageMonth || (l.date || '').slice(0, 7);\n"
    "  const __slotIds = (resolveGroupMembersForMonth(g, __pmL) || []).filter(Boolean);\n"
    "  __slotIds.forEach(mid => { if (!ids.includes(mid)) ids.push(mid); });\n"
    "  if (!isPlanned) (l.memberIds || []).forEach(mid => { if (!ids.includes(mid)) ids.push(mid); });",
    1, "modal-left-members-list")

rep(
    "    const checked = present.has(mid);\n"
    "    const outside = !roster.includes(mid);",
    "    const checked = present.has(mid);\n"
    "    const left = __slotIds.includes(mid) && !roster.includes(mid); // v106: o ay slotta ama artik aktif degil = AYRILDI\n"
    "    const outside = !left && !roster.includes(mid);",
    1, "modal-left-flag")

rep(
    "      + `<span>${escapeHtml(nm)}</span>${outside ? ' <span class=\"badge warn\" style=\"font-size:10px;\">kadro dışı</span>' : ''}</label>`;",
    "      + `<span>${escapeHtml(nm)}</span>${left ? ' <span class=\"badge\" style=\"font-size:10px;background:var(--danger);color:#fff;\">ayrıldı</span>' : ''}${outside ? ' <span class=\"badge warn\" style=\"font-size:10px;\">kadro dışı</span>' : ''}</label>`;",
    1, "modal-left-badge")

# ---- 4) assignMemberToSlot: KATILIM TARIHI yazilir (eksik ozelligin tamamlanmasi) ----
rep(
    "  __autoNameAfterRosterChange(g, __ctxAy); // v41: ad AY BAZLI guncellenir\n"
    "  { const _am = state.members.find(x=>x.id===memberId); if (_am && _am.archived && typeof unarchiveMember==='function') unarchiveMember(memberId, __ctxAy); }",
    "  // v106 (Kerem): yeni gelen uye derslere KATILDIGI TARIHTEN itibaren yazilir — onceki dersler tiksiz kalir.\n"
    "  { if (!g.memberJoinDates) g.memberJoinDates = {};\n"
    "    g.memberJoinDates[memberId] = (__ctxAy === currentMonth()) ? todayISO() : (__ctxAy + '-01'); }\n"
    "  __autoNameAfterRosterChange(g, __ctxAy); // v41: ad AY BAZLI guncellenir\n"
    "  { const _am = state.members.find(x=>x.id===memberId); if (_am && _am.archived && typeof unarchiveMember==='function') unarchiveMember(memberId, __ctxAy); }",
    1, "join-date-write")

# ---- Surum ----
rep("2026.07.21.28", "2026.07.22.29", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v106 uygulandi. fark=%d bayt" % (len(s)-len(o)))
