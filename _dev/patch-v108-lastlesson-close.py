#!/usr/bin/env python3
# v108 (Kerem):
# 1) ⭐ SON DERS = PAKET ERKEN KAPANIR: isaretli dersten SONRAKI planli dersler paketten DUSER (silinir),
#    kalan haklar 0 gorunur ve '⭐ N hak isletmeye' notu cikar. Hoca yalniz GIRILEN (yapilan/yanan) derslerden
#    kazanir (v41/v54/v56 kanonu zaten boyle: ders basi ucret = ay fiyati/8, katilan uyeden hesap) —
#    kalan derslerin parasi kendiliginden ISLETMEYE kalir. Kapanan ay 'kalan/sarkan' listelerine DUSMEZ.
# 2) UYE DETAY ders listesi EN ESKI ustte (grup detay + toplu liste zaten oyleydi; uye detay tersti).
# 3) Takvimden girilen dersler toplu listede zaten pm-bazli gorunuyor (v107 pm kanonuyla dogru aya duser) — testle kanitlanir.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ---- 1a) Erken kapanis yardimcisi ----
rep(
    "function sessionQuotaFor(ownerType, ownerId, monthISO){",
    "// v108 (Kerem): ⭐ elle SON DERS isaretli paket ERKEN KAPANMISTIR — kalan hak/para ISLETMEYE.\n"
    "function __pkgClosedEarlyLesson(ownerType, ownerId, ay) {\n"
    "  if (!ownerId || !ay) return null;\n"
    "  return (state.lessons || []).find(l => {\n"
    "    if (!l || l.isLastOfPackage !== true || l.status === 'cancelled') return false;\n"
    "    const pm = l.packageMonth || String(l.date || '').slice(0, 7);\n"
    "    if (pm !== ay) return false;\n"
    "    if (ownerType === 'group') return l.groupId === ownerId;\n"
    "    return !l.groupId && (l.memberIds || []).includes(ownerId);\n"
    "  }) || null;\n"
    "}\n"
    "function sessionQuotaFor(ownerType, ownerId, monthISO){",
    1, "closed-early-helper")

# ---- 1b) Kalan = 0 (kapali pakette) ----
rep(
    "function sessionsRemainingFor(ownerType, ownerId, monthISO){\n"
    "  return Math.max(0, sessionQuotaFor(ownerType, ownerId, monthISO) - sessionsUsedFor(ownerType, ownerId, monthISO));\n"
    "}",
    "function sessionsRemainingFor(ownerType, ownerId, monthISO){\n"
    "  if (__pkgClosedEarlyLesson(ownerType, ownerId, monthISO)) return 0; // v108: erken kapandi — kalan hak ISLETMEYE\n"
    "  return Math.max(0, sessionQuotaFor(ownerType, ownerId, monthISO) - sessionsUsedFor(ownerType, ownerId, monthISO));\n"
    "}",
    1, "remaining-closed")

# ---- 1c) FinishState: closedEarly + keptRights ----
rep(
    "  return { quota, done, planned, remaining: Math.max(0, quota - done - planned), trulyFinished: done >= quota };\n"
    "}",
    "  const __closed = !!__pkgClosedEarlyLesson(ownerType, ownerId, ay); // v108\n"
    "  const __rawRem = Math.max(0, quota - done - planned);\n"
    "  return { quota, done, planned, remaining: __closed ? 0 : __rawRem, keptRights: __closed ? __rawRem : 0,\n"
    "    closedEarly: __closed, trulyFinished: done >= quota || (__closed && planned === 0) };\n"
    "}",
    1, "finishstate-closed")

# ---- 1d) saveBatchDates: ⭐ sonrasi planli satirlar paketten duser ----
rep(
    "  const modalLessonIds = new Set(__batchDatesRows.filter(r => r.lessonId).map(r => r.lessonId));",
    "  // v108 (Kerem): ⭐ SON DERSTEN SONRAKI planli satirlar paketten DUSER (kalan hak/para ISLETMEYE).\n"
    "  // Yapilmis/yanan/iptal satirlar TARIHSEL KAYIT — dokunulmaz.\n"
    "  let __afterLastDropped = 0;\n"
    "  { const __lastR = __batchDatesRows.find(r => r && r.last && r.date);\n"
    "    if (__lastR) {\n"
    "      const __key = __lastR.date + ' ' + (__lastR.time || '');\n"
    "      __batchDatesRows = __batchDatesRows.filter(r => {\n"
    "        if (!r || r === __lastR) return true;\n"
    "        if (!r.date) return true;\n"
    "        if ((r.status || 'planned') !== 'planned') return true;\n"
    "        const drop = (r.date + ' ' + (r.time || '')) > __key;\n"
    "        if (drop) __afterLastDropped++;\n"
    "        return !drop;\n"
    "      });\n"
    "    } }\n"
    "  const modalLessonIds = new Set(__batchDatesRows.filter(r => r.lessonId).map(r => r.lessonId));",
    1, "batch-drop-after-last")

# ---- 1e) Kayit mesajina dusen ders bilgisi ----
rep(
    "  alert(`✓ ${created} yeni ders, ${updated} güncellendi${removed?`, ${removed} silindi`:''}.`);",
    "  alert(`✓ ${created} yeni ders, ${updated} güncellendi${removed?`, ${removed} silindi`:''}.${__afterLastDropped?` ⭐ Son dersten sonraki ${__afterLastDropped} planlı ders paketten düştü — hakları işletmeye kaldı.`:''}`);",
    1, "batch-msg")

# ---- 1f) Grup detay 'Kalan Ders' notu ----
rep(
    "hak: ${sessionQuotaFor('group', id, monthISO || currentMonth())} · <a href=\"#\" onclick=\"event.preventDefault();editGroupSessions('${id}','${monthISO||currentMonth()}')\" style=\"color:var(--acc);\">düzenle</a></div></div>",
    "hak: ${sessionQuotaFor('group', id, monthISO || currentMonth())} · <a href=\"#\" onclick=\"event.preventDefault();editGroupSessions('${id}','${monthISO||currentMonth()}')\" style=\"color:var(--acc);\">düzenle</a>${__fs.closedEarly?` · <b style=\"color:var(--warn)\">⭐ ${__fs.keptRights} hak işletmeye</b>`:''}</div></div>",
    1, "group-detail-note")

# ---- 1g) Uye detay 'Kalan Ders' notu ----
rep(
    "      <div class=\"stat blue\"><div class=\"label\">Kalan Ders (${ctxAy})</div><div class=\"value\">${remCanon}</div></div>",
    "      <div class=\"stat blue\"><div class=\"label\">Kalan Ders (${ctxAy})</div><div class=\"value\">${remCanon}</div>${(function(){try{const f=sessionsFinishState('member',id,ctxAy);return f.closedEarly?`<div style=\"font-size:9.5px;color:var(--warn);margin-top:2px;\">⭐ ${f.keptRights} hak işletmeye</div>`:''}catch(e){return ''}})()}</div>",
    1, "member-detail-note")

# ---- 2) UYE DETAY ders listesi EN ESKI USTTE ----
rep(
    "  const allLessons = state.lessons.filter(l=>(l.memberIds||[]).includes(id)).sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));",
    "  const allLessons = state.lessons.filter(l=>(l.memberIds||[]).includes(id)).sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time)); // v108 (Kerem): EN ESKI ders ustte (grup detay/toplu listeyle ayni)",
    1, "member-lessons-asc")

# ---- Surum ----
rep("2026.07.22.30", "2026.07.22.31", 2, "version-bump")

# Butunluk
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v108 uygulandi. fark=%d bayt" % (len(s)-len(o)))
