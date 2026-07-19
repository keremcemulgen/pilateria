#!/usr/bin/env python3
# v54b (Kerem): GEC KATILIM + ELLE CIKARMA kalici olsun
# - Elle cikarma: grup dersinde bir uyeyi isaretsiz birakinca reconcile/sync bir daha OTOMATIK GERI EKLEMESIN
#   -> ders.excludedMemberIds. (Kerem: "ben yine elle dersten cikartabileyim")
# - Gec katilim: g.memberJoinDates[uyeId] varsa, o tarihten ONCEKI derslere OTOMATIK eklenmez (elle eklenmedikce).
#   Not: sync/reconcile zaten yalniz PLANLI dersleri isler; biten (completed/missed) dersler dokunulmaz -> gec
#   katilan zaten sadece yaklasan derslere otomatik eklenir. Bu yama hepsi-planli durumu + elle cikarmayi da kapsar.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# 1) __applyRosterOverrides saf yardimci — syncGroupLessonsToRoster tanimindan hemen once
helper = (
    "// v54: bir grup dersinin OTOMATIK kadrosuna (roster) ELLE CIKARMA + GEC KATILIM kurallarini uygular.\n"
    "// Saf fonksiyon (global state okumaz) -> migration (s-guvenli) ve sync ayni sekilde kullanir.\n"
    "// - l.excludedMemberIds: elle cikarilan uye geri EKLENMEZ.\n"
    "// - g.memberJoinDates[mid]: uye o tarihten ONCEKI derse otomatik eklenmez (elle eklenmis=halihazirda\n"
    "//   derste ise KORUNUR).\n"
    "function __applyRosterOverrides(roster, l, g) {\n"
    "  const excl = new Set((l && l.excludedMemberIds) || []);\n"
    "  const present = new Set((l && l.memberIds) || []);\n"
    "  const jmap = (g && g.memberJoinDates) || {};\n"
    "  const ldate = (l && l.date) || '';\n"
    "  return (roster || []).filter(mid => {\n"
    "    if (excl.has(mid)) return false;\n"
    "    const jd = jmap[mid] ? String(jmap[mid]).slice(0, 10) : '';\n"
    "    if (jd && ldate && ldate < jd && !present.has(mid)) return false;\n"
    "    return true;\n"
    "  });\n"
    "}\n"
)
rep("function syncGroupLessonsToRoster(groupId, fromMonth) {",
    helper + "function syncGroupLessonsToRoster(groupId, fromMonth) {",
    1, "helper-before-sync")

# 2) syncGroupLessonsToRoster: mids uzerine override uygula
sync_old = (
    "    const mids = resolveGroupMembersForMonth(g, pm).filter(mid => {\n"
    "      if (!mid) return false;\n"
    "      const mm = state.members.find(x => x.id === mid);\n"
    "      if (!mm) return false;\n"
    "      if (isMemberInactiveInMonth(mm, pm)) return false; // v41: o ay pasif uye derse YAZILMAZ\n"
    "      return isMemberEnrolledInMonth(mid, pm); // v41: aydan cikarilan uye derse geri DONMEZ\n"
    "    });\n"
    "    if (JSON.stringify(l.memberIds||[]) === JSON.stringify(mids)) return;\n"
)
sync_new = (
    "    let mids = resolveGroupMembersForMonth(g, pm).filter(mid => {\n"
    "      if (!mid) return false;\n"
    "      const mm = state.members.find(x => x.id === mid);\n"
    "      if (!mm) return false;\n"
    "      if (isMemberInactiveInMonth(mm, pm)) return false; // v41: o ay pasif uye derse YAZILMAZ\n"
    "      return isMemberEnrolledInMonth(mid, pm); // v41: aydan cikarilan uye derse geri DONMEZ\n"
    "    });\n"
    "    mids = __applyRosterOverrides(mids, l, g); // v54: elle cikarma + gec katilim\n"
    "    if (JSON.stringify(l.memberIds||[]) === JSON.stringify(mids)) return;\n"
)
rep(sync_old, sync_new, 1, "sync-override")

# 3) migration reconcile: roster uzerine override uygula
mig_old = (
    "        const roster = (resolveGroupMembersForMonth(gg, __pm) || []).filter(Boolean).filter(mid => {\n"
    "          const mm = (s.members || []).find(x => x && x.id === mid);\n"
    "          return mm ? __memActive(mm, __pm) : true;\n"
    "        });\n"
    "        if (roster.length && JSON.stringify(l.memberIds || []) !== JSON.stringify(roster)) {\n"
)
mig_new = (
    "        let roster = (resolveGroupMembersForMonth(gg, __pm) || []).filter(Boolean).filter(mid => {\n"
    "          const mm = (s.members || []).find(x => x && x.id === mid);\n"
    "          return mm ? __memActive(mm, __pm) : true;\n"
    "        });\n"
    "        roster = __applyRosterOverrides(roster, l, gg); // v54: elle cikarma (excludedMemberIds) + gec katilim (joinDate)\n"
    "        if (roster.length && JSON.stringify(l.memberIds || []) !== JSON.stringify(roster)) {\n"
)
rep(mig_old, mig_new, 1, "migration-override")

# 4) saveLesson: grup dersinde isaretsiz kadro uyesi -> excludedMemberIds
sl_anchor = "  // preserve existing status if editing; default planned on new\n"
sl_ins = (
    "  // v54: GRUP dersinde ISARETSIZ birakilan kadro uyesi = ELLE CIKARMA -> excludedMemberIds'e yazilir ki\n"
    "  // reconcile/sync OTOMATIK geri EKLEMESIN (Kerem: \"elle dersten cikartabileyim\"). Bireysel derste bos.\n"
    "  let __lessonExcluded = [];\n"
    "  if (groupId) {\n"
    "    const __gEx = state.groups.find(x => x.id === groupId);\n"
    "    if (__gEx) {\n"
    "      const __chk = new Set(checked);\n"
    "      __lessonExcluded = resolveGroupMembersForMonth(__gEx, packageMonth).filter(mid => {\n"
    "        const mm = state.members.find(x => x.id === mid);\n"
    "        if (!mm || isMemberInactiveInMonth(mm, packageMonth) || !isMemberEnrolledInMonth(mid, packageMonth)) return false;\n"
    "        return !__chk.has(mid);\n"
    "      });\n"
    "    }\n"
    "  }\n"
)
rep(sl_anchor, sl_ins + sl_anchor, 1, "saveLesson-excluded-compute")

# 4b) data objesine excludedMemberIds alani
rep("    memberIds: checked,\n    groupId,\n    packageMonth,\n",
    "    memberIds: checked,\n    groupId,\n    excludedMemberIds: __lessonExcluded,\n    packageMonth,\n",
    1, "saveLesson-data-field")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s.count("__applyRosterOverrides") == 3, "__applyRosterOverrides beklenen 3 (1 tanim + 2 cagri), bulunan %d" % s.count("__applyRosterOverrides")
assert s.count("excludedMemberIds") >= 4  # helper(1) + saveLesson compute(1) + data field(1) + (varsa digerleri)
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v54b uygulandi. __applyRosterOverrides=%d, excludedMemberIds=%d, fark=%d bayt" % (
    s.count("__applyRosterOverrides"), s.count("excludedMemberIds"), len(s)-len(o)))
