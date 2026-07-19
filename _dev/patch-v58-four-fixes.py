#!/usr/bin/env python3
# v58 (Kerem, 4 istek — hepsi KOK fix):
# A) 2.PAKET KLONU AY-KAPSAMI: Haziran'da olusturulan/eklenen klon (secondOfMember) Temmuz kadrosunda
#    5. uye olarak gorunuyordu. KOK: applyRosterChange eklemeyi o ay + SONRAKI tum ay kayitlarina ve kok
#    memberIds'e yazar (carry-forward, normal uye icin dogru); ROSTER_START oncesi aylarda "enrolled acikca
#    false degilse aktif" kurali klonu miras yoluyla aktif gosteriyordu. FIX-KANON: klon uye YALNIZ
#    monthly[ay].enrolled===true olan ayda aktiftir (v57 tek-kaynak fonksiyonuna kural eklendi) +
#    isMemberEnrolledInMonth artik __memberActiveInMonth'a delege (kural HER gorunumde ayni) +
#    savePayment klon odemesinde ROSTER-oncesi ayda da enrolled yazar (odeme alinan ay mesru).
# B) ODEMELER PAKET AYINA GORE: Haziran paketinin Temmuz'da odenen kaydi Odemeler sayfasinda Temmuz'da
#    cikiyordu. KOK: renderPayments TEK sapan yuzeydi (p.date ile filtre; gelir/rozetler zaten packageMonth).
#    FIX-KANON: paymentMonthOf(p) tek kaynak + renderPayments ona baglandi + tarih hucresine paket-ayi rozeti.
# C) AYARLAR GUVENLIK: Yedek Indir / Veri Yukle / Tum Veriyi Sifirla -> YONETICI e-posta+sifre dogrulamasi
#    (yanlislikla tiklama korumasi). Supabase signInWithPassword ile dogrulanir; offline/dev modda cifte onay.
# D) HOCA ORANI %0 OLMAZ: ders-bazli dokumde %0 gorunuyordu. KOK: saveGroup oran alani bosken groupRate=null
#    -> createGroupPackage `opts.instructorShareRate !== undefined ? +opts.instructorShareRate : null` ->
#    +null = 0 PAKET KAYDINA YAZILIYOR; resolveInstructorRate 0'i "tanimli" sayip %0 donduruyordu.
#    FIX-KANON: rateDefined(v)=v>0 — 0/bos/gecersiz TANIMSIZ, zincir devam, sonda default %30; yazim
#    tarafi 0 yazamaz; migration mevcut 0'lari null'a cevirir. Elle override (1-100) aynen calisir.
import io
P = "pilateria.html"
s = io.open(P, encoding="utf-8").read(); o = s

def rep(a, b, n=1, label=""):
    global s
    c = s.count(a); assert c == n, "ANCHOR '%s' beklenen %d bulunan %d" % (label, n, c)
    s = s.replace(a, b)

# ================= A) KLON AY-KAPSAMI =================
rep(
    "  let rsm; try { rsm = ROSTER_START_MONTH; } catch (e) { rsm = '2026-08'; } // TDZ guvenligi (load sirasi)\n"
    "  const mo = (mm.monthly || {})[pm];\n"
    "  if (pm >= rsm) return !!(mo && mo.enrolled === true);\n",
    "  let rsm; try { rsm = ROSTER_START_MONTH; } catch (e) { rsm = '2026-08'; } // TDZ guvenligi (load sirasi)\n"
    "  const mo = (mm.monthly || {})[pm];\n"
    "  if (mm.secondOfMember) return !!(mo && mo.enrolled === true); // v58 KANON: 2.paket klonu yalniz ACIKCA kaydedildigi ayda aktif — sonraki aya MIRAS YOK\n"
    "  if (pm >= rsm) return !!(mo && mo.enrolled === true);\n",
    1, "A1-clone-canon")

rep(
    "function isMemberEnrolledInMonth(memberId, monthISO) {\n"
    "  if (!monthISO) return true;\n"
    "  const m = state.members.find(x=>x.id===memberId);\n"
    "  if (!m) return false;\n"
    "  // Kayit tarihinden ONCEKI aylarda hicbir uye gorunmez (yeni uye gecmis listelere sizmasin)\n"
    "  if (m.joinDate && String(m.joinDate).slice(0,7) > monthISO) return false;\n"
    "  // v24: o ayda pasifse (donem kaydi dahil) listede degildir\n"
    "  if (typeof isMemberInactiveInMonth === 'function' && isMemberInactiveInMonth(m, monthISO)) return false;\n"
    "  const rec = (m.monthly||{})[monthISO];\n"
    "  if (monthISO >= ROSTER_START_MONTH) {\n"
    "    return !!(rec && rec.enrolled === true);\n"
    "  }\n"
    "  if (rec && rec.enrolled === false) return false;\n"
    "  return true;\n"
    "}",
    "function isMemberEnrolledInMonth(memberId, monthISO) {\n"
    "  if (!monthISO) return true;\n"
    "  const m = state.members.find(x=>x.id===memberId);\n"
    "  if (!m) return false;\n"
    "  // v58: TEK KAYNAK — v57 kanonu (joinDate + arsiv + ROSTER kurali + KLON kurali) her gorunumde ayni.\n"
    "  return __memberActiveInMonth(m, monthISO);\n"
    "}",
    1, "A2-enrolled-delegate")

rep(
    "  if (data.packageMonth >= ROSTER_START_MONTH && memberId) setMemberMonthly(memberId, data.packageMonth, { enrolled: true });",
    "  if (memberId && (data.packageMonth >= ROSTER_START_MONTH || ((state.members.find(x=>x.id===memberId)||{}).secondOfMember))) setMemberMonthly(memberId, data.packageMonth, { enrolled: true }); // v58: klon, odeme aldigi ayda da aktif olur",
    1, "A3-savePayment-clone-enroll")

# ================= B) ODEME PAKET AYI =================
rep(
    "function memberPaidInMonth(memberId, monthISO){",
    "// v58 KANON: bir odemenin AYI = odedigi PAKETIN ayi (packageMonth; yoksa odeme tarihi ayi).\n"
    "// Gec odeme (Haziran paketi Temmuz'da odendi) HAZIRAN gelirine/listesine yazilir. Ay-filtreli TUM\n"
    "// odeme yuzeyleri bunu kullanir (gelir istatistigi zaten boyleydi; Odemeler sayfasi v58'de baglandi).\n"
    "function paymentMonthOf(p){ return (p && (p.packageMonth || String(p.date||'').slice(0,7))) || ''; }\n"
    "function memberPaidInMonth(memberId, monthISO){",
    1, "B1-paymentMonthOf")

rep("  if (mm) list = list.filter(p=>p.date.startsWith(mm));",
    "  if (mm) list = list.filter(p=>paymentMonthOf(p)===mm); // v58 KANON: PAKET AYINA gore listele (gec odeme dogru ayda)",
    1, "B2-renderPayments-filter")

rep("      <td data-label=\"Tarih\">${fmtDate(p.date)}</td>",
    "      <td data-label=\"Tarih\">${fmtDate(p.date)}${(()=>{ const __pm=paymentMonthOf(p); return (__pm && __pm!==String(p.date||'').slice(0,7)) ? ' <span class=\"badge\" style=\"background:#eef2f7;color:#3a4a5a;font-size:10px;\" title=\"Odeme bu paketin ayina sayilir\">📦 '+(typeof __shortMonth==='function'?__shortMonth(__pm):__pm)+'</span>' : ''; })()}</td>",
    1, "B3-date-cell-badge")

# ================= C) AYARLAR GUARD =================
rep("<div class=\"modal-bg\" id=\"modal-group-lesson\">",
    "<div class=\"modal-bg\" id=\"modal-admin-verify\">\n"
    "  <div class=\"modal\" style=\"max-width:380px;\">\n"
    "    <h2>🔐 Yönetici Doğrulaması</h2>\n"
    "    <div style=\"font-size:13px;color:var(--muted);margin-bottom:10px;\"><b id=\"adv-action\"></b> için yönetici e-posta ve şifreni gir. Yanlışlıkla tıklamalara karşı koruma.</div>\n"
    "    <div class=\"fields-grid\" style=\"grid-template-columns:1fr;\">\n"
    "      <label>E-posta<input type=\"email\" id=\"adv-email\" autocomplete=\"off\"></label>\n"
    "      <label>Şifre<input type=\"password\" id=\"adv-pass\" autocomplete=\"new-password\" onkeydown=\"if(event.key==='Enter')confirmAdminVerify()\"></label>\n"
    "    </div>\n"
    "    <div id=\"adv-msg\" style=\"min-height:18px;color:var(--bad);font-size:13px;margin:6px 0;\"></div>\n"
    "    <div class=\"row\" style=\"justify-content:flex-end;gap:6px;margin-top:8px;\">\n"
    "      <button class=\"btn secondary\" onclick=\"__advCb=null;closeModal('modal-admin-verify')\">İptal</button>\n"
    "      <button class=\"btn\" onclick=\"confirmAdminVerify()\">Doğrula ve Devam Et</button>\n"
    "    </div>\n"
    "  </div>\n"
    "</div>\n"
    "<div class=\"modal-bg\" id=\"modal-group-lesson\">",
    1, "C1-adv-modal-html")

rep(
    "function exportData() {\n"
    "  const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });",
    "// v58 (Kerem): Yedek Indir / Veri Yukle / Tum Veriyi Sifirla -> YONETICI e-posta+sifre dogrulamasi\n"
    "// (yanlislikla tiklama korumasi). Supabase yoksa (offline/dev) cifte onaya duser.\n"
    "let __advCb = null;\n"
    "function requireAdminVerify(actionLabel, cb) {\n"
    "  if (!SUPABASE_MODE || !sbInit()) {\n"
    "    plConfirm('⚠️ ' + actionLabel + ' — emin misin? (Çevrimdışı mod: yönetici doğrulaması atlandı)', 'Devam').then(ok => { if (ok) cb(); });\n"
    "    return;\n"
    "  }\n"
    "  __advCb = cb;\n"
    "  var a = document.getElementById('adv-action'); if (a) a.textContent = actionLabel;\n"
    "  var e1 = document.getElementById('adv-email'); if (e1) e1.value = '';\n"
    "  var p1 = document.getElementById('adv-pass'); if (p1) p1.value = '';\n"
    "  var m1 = document.getElementById('adv-msg'); if (m1) m1.textContent = '';\n"
    "  openModal('modal-admin-verify');\n"
    "  setTimeout(() => { try { document.getElementById('adv-email').focus(); } catch(_) {} }, 60);\n"
    "}\n"
    "async function confirmAdminVerify() {\n"
    "  const email = (document.getElementById('adv-email').value || '').trim();\n"
    "  const pass = document.getElementById('adv-pass').value || '';\n"
    "  const msg = document.getElementById('adv-msg');\n"
    "  if (!email || !pass) { if (msg) msg.textContent = 'E-posta ve şifreni gir.'; return; }\n"
    "  if (msg) msg.textContent = 'Doğrulanıyor...';\n"
    "  try {\n"
    "    const { error } = await sbClient.auth.signInWithPassword({ email: email, password: pass });\n"
    "    if (error) { if (msg) msg.textContent = 'E-posta veya şifre hatalı.'; return; }\n"
    "    try { const { data } = await sbClient.auth.getSession(); if (data && data.session) __sbSession = data.session; } catch(_) {}\n"
    "  } catch(e2) { if (msg) msg.textContent = 'Doğrulama başarısız — bağlantıyı kontrol et.'; return; }\n"
    "  closeModal('modal-admin-verify');\n"
    "  const cb = __advCb; __advCb = null; if (cb) cb();\n"
    "}\n"
    "function exportData() { requireAdminVerify('Yedek İndir (JSON)', __exportDataNow); } // v58: yonetici dogrulamasi\n"
    "function __exportDataNow() {\n"
    "  const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });",
    1, "C2-guard-and-export")

rep(
    "function importData(e) {\n"
    "  const f = e.target.files[0]; if (!f) return;\n"
    "  const rd = new FileReader();",
    "function importData(e) { // v58: yonetici dogrulamasi — dosya secilir, ONCE dogrula, sonra oku\n"
    "  const f = e.target.files && e.target.files[0];\n"
    "  try { e.target.value = ''; } catch(_) {}\n"
    "  if (!f) return;\n"
    "  requireAdminVerify('Veri Yükle (JSON geri yükleme)', () => __importDataFile(f));\n"
    "}\n"
    "function __importDataFile(f) {\n"
    "  if (!f) return;\n"
    "  const rd = new FileReader();",
    1, "C3-importData-guard")

rep(
    "async function resetAllData() {\n"
    "  if (!(await plConfirm('TÜM veriler bu cihazdan silinecek. Emin misin?', 'Evet, sıfırla'))) return;",
    "async function resetAllData() { requireAdminVerify('Tüm Veriyi Sıfırla', __resetAllDataNow); } // v58: yonetici dogrulamasi\n"
    "async function __resetAllDataNow() {\n"
    "  if (!(await plConfirm('TÜM veriler bu cihazdan silinecek. Emin misin?', 'Evet, sıfırla'))) return;",
    1, "C4-reset-guard")

# ================= D) HOCA ORANI %0 OLMAZ =================
rep("function resolveInstructorRate(lesson) {",
    "// v58 KANON (Kerem): %0 hoca orani YOKTUR. 0/bos/gecersiz deger 'tanimsiz' sayilir, oran zinciri\n"
    "// devam eder, hicbir katman tanimli degilse DEFAULT %30. Elle ders-bazi override (1-100) aynen calisir.\n"
    "function rateDefined(v) { return v !== undefined && v !== null && v !== '' && isFinite(+v) && +v > 0; }\n"
    "function resolveInstructorRate(lesson) {",
    1, "D1-rateDefined")

rep(
    "  if (lesson.instructorRateOverride !== undefined && lesson.instructorRateOverride !== null && lesson.instructorRateOverride !== '') {\n"
    "    return +lesson.instructorRateOverride;\n"
    "  }",
    "  if (rateDefined(lesson.instructorRateOverride)) return +lesson.instructorRateOverride; // v58: 0 override tanimsiz sayilir",
    1, "D2-override")

rep(
    "      if (pkg && pkg.instructorShareRate !== null && pkg.instructorShareRate !== undefined && pkg.instructorShareRate !== '') {\n"
    "        return +pkg.instructorShareRate;\n"
    "      }",
    "      if (pkg && rateDefined(pkg.instructorShareRate)) return +pkg.instructorShareRate;",
    2, "D3-pkg-rate-x2")

rep("        if (rate !== undefined && rate !== null && rate !== '') return +rate;",
    "        if (rateDefined(rate)) return +rate;",
    1, "D4-memberInstructorRates")

rep(
    "      if (g.instructorShareRate !== undefined && g.instructorShareRate !== null && g.instructorShareRate !== '') {\n"
    "        return +g.instructorShareRate;\n"
    "      }",
    "      if (rateDefined(g.instructorShareRate)) return +g.instructorShareRate;",
    1, "D5-group-rate")

rep(
    "      if (m.instructorShareRate !== undefined && m.instructorShareRate !== null && m.instructorShareRate !== '') {\n"
    "        return +m.instructorShareRate;\n"
    "      }",
    "      if (rateDefined(m.instructorShareRate)) return +m.instructorShareRate;",
    1, "D6-member-rate")

rep(
    "    if (m && m.instructorShareRate !== undefined && m.instructorShareRate !== null && m.instructorShareRate !== '') {\n"
    "      return +m.instructorShareRate;\n"
    "    }",
    "    if (m && rateDefined(m.instructorShareRate)) return +m.instructorShareRate;",
    1, "D7-individual-member-rate")

rep(
    "    if (inst && inst.shareRate !== undefined && inst.shareRate !== null && inst.shareRate !== '') {\n"
    "      return +inst.shareRate;\n"
    "    }",
    "    if (inst && rateDefined(inst.shareRate)) return +inst.shareRate;",
    1, "D8-instructor-rate")

rep("    instructorShareRate: opts.instructorShareRate !== undefined ? +opts.instructorShareRate : null, // null = settings varsayılan",
    "    instructorShareRate: rateDefined(opts.instructorShareRate) ? +opts.instructorShareRate : null, // v58: 0/bos -> null (default %30)",
    1, "D9-createGroupPackage")

rep("    instructorShareRate: opts.instructorShareRate !== undefined ? +opts.instructorShareRate : null,\n    status: 'active'\n  };\n  m.packages.push(newPkg);",
    "    instructorShareRate: rateDefined(opts.instructorShareRate) ? +opts.instructorShareRate : null, // v58: 0/bos -> null\n    status: 'active'\n  };\n  m.packages.push(newPkg);",
    1, "D10-createMemberPackage")

rep(
    "  // 4) Members\n  s.members = (s.members || []).map(m => {",
    "  // v58: %0 hoca orani temizligi — 0 'tanimsiz' demektir (default %30'a duser). Idempotent.\n"
    "  try {\n"
    "    const __isZeroRate = v => v !== null && v !== undefined && v !== '' && isFinite(+v) && +v === 0;\n"
    "    (s.groups || []).forEach(g => { if (!g) return;\n"
    "      if (__isZeroRate(g.instructorShareRate)) g.instructorShareRate = null;\n"
    "      (g.packages || []).forEach(p => { if (p && __isZeroRate(p.instructorShareRate)) p.instructorShareRate = null; });\n"
    "      if (g.memberInstructorRates) Object.keys(g.memberInstructorRates).forEach(k => { if (__isZeroRate(g.memberInstructorRates[k])) delete g.memberInstructorRates[k]; });\n"
    "    });\n"
    "    (s.members || []).forEach(m => { if (!m) return;\n"
    "      if (__isZeroRate(m.instructorShareRate)) m.instructorShareRate = null;\n"
    "      (m.packages || []).forEach(p => { if (p && __isZeroRate(p.instructorShareRate)) p.instructorShareRate = null; });\n"
    "    });\n"
    "    (s.instructors || []).forEach(i => { if (i && __isZeroRate(i.shareRate)) i.shareRate = null; });\n"
    "    (s.lessons || []).forEach(l => { if (l && __isZeroRate(l.instructorRateOverride)) l.instructorRateOverride = null; });\n"
    "  } catch(e) { try { console.error('[MIG] zero-rate', e); } catch(_) {} }\n"
    "  // 4) Members\n  s.members = (s.members || []).map(m => {",
    1, "D11-migration-zero-clean")

# ---------- Butunluk ----------
assert s.count("</script>") == 3 and s.count("init();") == 1 and s.rstrip().endswith("</html>")
assert s.count("rateDefined") == 11, "rateDefined beklenen 11, bulunan %d" % s.count("rateDefined")
assert s.count("paymentMonthOf") == 3, "paymentMonthOf beklenen 3 (tanim+2 kullanim), bulunan %d" % s.count("paymentMonthOf")
assert s.count("requireAdminVerify") == 4, "requireAdminVerify beklenen 4 (tanim + 3 sarmal cagri), bulunan %d" % s.count("requireAdminVerify")
assert s.count("modal-admin-verify") == 4, "modal-admin-verify beklenen 4, bulunan %d" % s.count("modal-admin-verify")
assert s != o
io.open(P, "w", encoding="utf-8").write(s)
print("OK v58 uygulandi. rateDefined=%d paymentMonthOf=%d requireAdminVerify=%d fark=%d bayt" % (
    s.count("rateDefined"), s.count("paymentMonthOf"), s.count("requireAdminVerify"), len(s)-len(o)))
