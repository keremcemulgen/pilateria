#!/usr/bin/env python3
# v57 (Kerem): "Grupta olmayan uyeler ders duzenle penceresinde gorunuyor" — KOK FIX
#
# KOK NEDEN (repro ile dogrulandi): "o ayin aktif kadrosu" tanimi TEK KAYNAK degildi.
# - saveBatchDates (Toplu Tarih Gir) yeni dersleri g.memberIds'ten (AY FILTRESIZ ham kok liste,
#   eski uyeler dahil) yaziyordu -> dersler BAYAT kadroyla olusuyordu. (ASIL SIZINTI KAYNAGI)
# - applyGroupToLesson preselect'i de g.memberIds idi.
# - migration kendi __memActive kopyasini, sync/modallar baska filtre kombinasyonlarini kullaniyordu
#   -> ayni soru ("bu ay kadroda kim var?") 5+ yerde 4 farkli sekilde cevaplaniyordu.
# - v55 grup-dersi modali bayat memberIds'i "kadro disi" rozetiyle ISARETLI gosteriyordu (Kerem sikayeti)
#   ve kadro uyeleri bayat listede olmadigindan ISARETSIZ geliyordu (kaydet -> yanlis excluded tuzagi).
#
# FIX: TEK KANONIK KAYNAK
#   __memberActiveInMonth(mm, pm)      — saf uyelik kurali (arsiv donemleri + archived + joinDate + enrolled)
#   activeGroupRosterForMonth(g,ay,st,keepUnknown) — resolve + kanonik filtre (st: migration s-guvenligi)
# Baglanan yollar: migration reconcile (grup+bireysel), syncGroupLessonsToRoster, saveBatchDates (create +
# kapasite), applyGroupToLesson, renderLessonMembersCheckboxes (ders modali), __groupLessonRoster (v55 modal),
# saveLesson excluded hesabi. v55 modal: PLANLI derste YALNIZ kadro listelenir (bayat uye GORUNMEZ, kaydet
# temizler); isaretler kanonik (roster - excluded - joinDate) gelir -> ac+kaydet veriyi ONARIR. Tarihsel
# (yapildi/yandi/iptal) derste memberIds korunur (maas/tarihsel veri bozulmaz) + kadro-disi rozetli gorunur.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---------- 1) KANONIK FONKSIYONLAR (resolveGroupMembersForMonth'tan hemen once) ----------
canon = (
    "// ===== v57 KANON: 'o ayin aktif kadrosu' TEK KAYNAK =====\n"
    "// Ayni soru (bu ay kadroda kim var?) eskiden 5+ yerde farkli filtrelerle cevaplaniyordu\n"
    "// (batch hic filtresiz g.memberIds kullaniyordu -> bayat uye sizmasi). Artik TUM ders-kadrosu\n"
    "// ureten/gosteren yollar bu iki fonksiyonu kullanir. Kurali degistirmek = SADECE burayi degistirmek.\n"
    "function __memberActiveInMonth(mm, pm) {\n"
    "  if (!mm || !pm) return false;\n"
    "  for (const per of (mm.archivePeriods || [])) {\n"
    "    const f = String((per && per.from) || '').slice(0, 7);\n"
    "    const t = (per && per.to) ? String(per.to).slice(0, 7) : null;\n"
    "    if (f && pm >= f && (!t || pm < t)) return false; // o ay pasif donemde\n"
    "  }\n"
    "  if (mm.archived) { const a = String(mm.archivedAt || '').slice(0, 7); if (!a || pm >= a) return false; }\n"
    "  const jd = String(mm.joinDate || '').slice(0, 7);\n"
    "  if (jd && jd > pm) return false;\n"
    "  let rsm; try { rsm = ROSTER_START_MONTH; } catch (e) { rsm = '2026-08'; } // TDZ guvenligi (load sirasi)\n"
    "  const mo = (mm.monthly || {})[pm];\n"
    "  if (pm >= rsm) return !!(mo && mo.enrolled === true);\n"
    "  return !(mo && mo.enrolled === false);\n"
    "}\n"
    "function activeGroupRosterForMonth(g, monthISO, st, keepUnknown) {\n"
    "  st = st || state;\n"
    "  const pm = monthISO || currentMonth();\n"
    "  return (resolveGroupMembersForMonth(g, pm) || []).filter(Boolean).filter(mid => {\n"
    "    const mm = (st.members || []).find(x => x && x.id === mid);\n"
    "    if (!mm) return !!keepUnknown; // bilinmeyen id: migration'da KORUNUR (senkron sirasi), UI'da gizlenir\n"
    "    return __memberActiveInMonth(mm, pm);\n"
    "  });\n"
    "}\n"
)
rep("function resolveGroupMembersForMonth(g, monthISO) {",
    canon + "function resolveGroupMembersForMonth(g, monthISO) {",
    1, "canon-funcs")

# ---------- 2) MIGRATION: kopya kural -> kanonik ----------
mig_def_old = (
    "    const __memActive = (mm, pm) => {\n"
    "      if (!mm) return false;\n"
    "      for (const per of (mm.archivePeriods || [])) {\n"
    "        const f = String((per && per.from) || '').slice(0, 7);\n"
    "        const t = (per && per.to) ? String(per.to).slice(0, 7) : null;\n"
    "        if (f && pm >= f && (!t || pm < t)) return false; // o ay pasif donemde\n"
    "      }\n"
    "      if (mm.archived) { const a = String(mm.archivedAt || '').slice(0, 7); if (!a || pm >= a) return false; }\n"
    "      const jd = String(mm.joinDate || '').slice(0, 7);\n"
    "      if (jd && jd > pm) return false;\n"
    "      const mo = (mm.monthly || {})[pm];\n"
    "      if (pm >= '2026-08') return !!(mo && mo.enrolled === true); // ROSTER_START_MONTH (TDZ nedeniyle sabit)\n"
    "      return !(mo && mo.enrolled === false);\n"
    "    };\n"
)
mig_def_new = (
    "    const __memActive = (mm, pm) => __memberActiveInMonth(mm, pm); // v57: TEK KAYNAK (yerel kopya kural kaldirildi)\n"
)
rep(mig_def_old, mig_def_new, 1, "migration-memActive-dedupe")

mig_g_old = (
    "        let roster = (resolveGroupMembersForMonth(gg, __pm) || []).filter(Boolean).filter(mid => {\n"
    "          const mm = (s.members || []).find(x => x && x.id === mid);\n"
    "          return mm ? __memActive(mm, __pm) : true;\n"
    "        });\n"
)
mig_g_new = (
    "        let roster = activeGroupRosterForMonth(gg, __pm, s, true); // v57: kanonik kadro (s-guvenli, bilinmeyen id korunur)\n"
)
rep(mig_g_old, mig_g_new, 1, "migration-group-canon")

rep("      if (__before > 0 && l.memberIds.length === 0) l.status = 'cancelled';\n    });\n  } catch(e) {}",
    "      if (__before > 0 && l.memberIds.length === 0) l.status = 'cancelled';\n    });\n  } catch(e) { try { console.error('[MIG] roster reconcile', e); } catch(_) {} }",
    1, "migration-catch-log")

# ---------- 3) SYNC: kanonik ----------
sync_old = (
    "    let mids = resolveGroupMembersForMonth(g, pm).filter(mid => {\n"
    "      if (!mid) return false;\n"
    "      const mm = state.members.find(x => x.id === mid);\n"
    "      if (!mm) return false;\n"
    "      if (isMemberInactiveInMonth(mm, pm)) return false; // v41: o ay pasif uye derse YAZILMAZ\n"
    "      return isMemberEnrolledInMonth(mid, pm); // v41: aydan cikarilan uye derse geri DONMEZ\n"
    "    });\n"
)
sync_new = "    let mids = activeGroupRosterForMonth(g, pm); // v57: kanonik kadro\n"
rep(sync_old, sync_new, 1, "sync-canon")

# ---------- 4) BATCH (ASIL KOK): create + kapasite kanonik kadro ----------
rep("    const __mids = g ? (g.memberIds||[]).filter(x => x && state.members.find(mm => mm.id === x)) : [m.id];",
    "    const __mids = g ? activeGroupRosterForMonth(g, packageMonth) : [m.id]; // v57 KOK FIX: o AYIN aktif kadrosu",
    1, "batch-capacity-canon")
rep("        newLesson.memberIds = (g.memberIds||[]).filter(x => x && state.members.find(mm => mm.id === x));",
    "        newLesson.memberIds = activeGroupRosterForMonth(g, packageMonth); // v57 KOK FIX: bayat g.memberIds DEGIL, o ayin AKTIF kadrosu",
    1, "batch-create-canon")

# ---------- 5) applyGroupToLesson preselect kanonik ----------
rep("  renderLessonMembersCheckboxes(g.memberIds||[]);\n}",
    "  const __apm = ((document.getElementById('ml-pkg-month')||{}).value) || ((document.getElementById('ml-date')||{}).value||'').slice(0,7) || currentMonth();\n"
    "  renderLessonMembersCheckboxes(activeGroupRosterForMonth(g, __apm)); // v57: preselect = o ayin AKTIF kadrosu\n}",
    1, "applyGroup-preselect-canon")

# ---------- 6) Ders modali (ml) grup dali kanonik ----------
ml_old = (
    "    const __gmids = resolveGroupMembersForMonth(__lg, __lpm).filter(mid => {\n"
    "      if (!mid) return false;\n"
    "      const mm = state.members.find(x => x.id === mid);\n"
    "      if (!mm) return false;\n"
    "      if (isMemberInactiveInMonth(mm, __lpm)) return false;\n"
    "      return isMemberEnrolledInMonth(mid, __lpm);\n"
    "    });\n"
)
ml_new = "    const __gmids = activeGroupRosterForMonth(__lg, __lpm); // v57: kanonik kadro\n"
rep(ml_old, ml_new, 1, "ml-gmids-canon")

rep("    const __monthRoster = new Set((resolveGroupMembersForMonth(__lg, __lpm) || []).filter(Boolean));",
    "    const __monthRoster = new Set(__gmids); // v57: kesisim de KANONIK kadroyla (filtresiz resolve degil)",
    1, "ml-monthroster-canon")

# ---------- 7) v55 grup-dersi modali: kanonik roster + planli/tarihsel ayrimi ----------
glr_old = (
    "  const pm = l.packageMonth || (l.date || '').slice(0, 7);\n"
    "  const roster = resolveGroupMembersForMonth(g, pm).filter(mid => {\n"
    "    const mm = state.members.find(x => x.id === mid);\n"
    "    return mm && !isMemberInactiveInMonth(mm, pm) && isMemberEnrolledInMonth(mid, pm);\n"
    "  });\n"
    "  return { g, roster, pm };\n"
)
glr_new = (
    "  const pm = l.packageMonth || (l.date || '').slice(0, 7);\n"
    "  const roster = activeGroupRosterForMonth(g, pm); // v57: kanonik kadro\n"
    "  return { g, roster, pm };\n"
)
rep(glr_old, glr_new, 1, "glRoster-canon")

glm_old = (
    "  const present = new Set(l.memberIds || []);\n"
    "  const ids = roster.slice();\n"
    "  (l.memberIds || []).forEach(mid => { if (!ids.includes(mid)) ids.push(mid); });\n"
)
glm_new = (
    "  // v57 (Kerem): PLANLI derste YALNIZ kadro listelenir — bayat memberIds'teki grup-disi uye GORUNMEZ,\n"
    "  // isaretler KANONIK gelir (kadro - elle cikarilan - katilim-tarihi-oncesi) -> ac+Kaydet bozuk veriyi ONARIR.\n"
    "  // TARIHSEL (yapildi/yandi/iptal) ders: memberIds = o gun gercekte girenler (maas buna bagli) — korunur,\n"
    "  // kadro-disi kalanlar rozetle gorunur (gizlenirse kayitta duser, tarihsel veri/maas bozulurdu).\n"
    "  const isPlanned = (l.status || 'planned') === 'planned';\n"
    "  const present = isPlanned ? new Set(__applyRosterOverrides(roster, l, g)) : new Set(l.memberIds || []);\n"
    "  const ids = roster.slice();\n"
    "  if (!isPlanned) (l.memberIds || []).forEach(mid => { if (!ids.includes(mid)) ids.push(mid); });\n"
)
rep(glm_old, glm_new, 1, "glMembers-planned-vs-historical")

# ---------- 8) saveLesson excluded hesabi kanonik ----------
sle_old = (
    "      __lessonExcluded = resolveGroupMembersForMonth(__gEx, packageMonth).filter(mid => {\n"
    "        const mm = state.members.find(x => x.id === mid);\n"
    "        if (!mm || isMemberInactiveInMonth(mm, packageMonth) || !isMemberEnrolledInMonth(mid, packageMonth)) return false;\n"
    "        return !__chk.has(mid);\n"
    "      });\n"
)
sle_new = "      __lessonExcluded = activeGroupRosterForMonth(__gEx, packageMonth).filter(mid => !__chk.has(mid)); // v57: kanonik\n"
rep(sle_old, sle_new, 1, "saveLesson-excluded-canon")

# ---------- Butunluk ----------
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
n_canon = s.count("activeGroupRosterForMonth")
assert n_canon == 9, "activeGroupRosterForMonth beklenen 9 (1 tanim + 8 cagri), bulunan %d" % n_canon
assert s.count("__memberActiveInMonth") == 3, "__memberActiveInMonth beklenen 3 (tanim + kanonik cagri + migration alias), bulunan %d" % s.count("__memberActiveInMonth")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v57 uygulandi. activeGroupRosterForMonth=%d __memberActiveInMonth=%d fark=%d bayt" % (
    n_canon, s.count("__memberActiveInMonth"), len(s)-len(o)))
