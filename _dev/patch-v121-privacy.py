#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PİLATERİA v121 — GİZLİLİK / VERİ SIZINTISI YAMASI
=================================================
Sahip kararı: TC kimlik, sağlık notu ve adres alanları UYGULAMADA KALIR (O-1 kapandı).
Bu yama diğer dört bulguyu kapatır:

  O-5  JSONBin yolu TAMAMEN kapatılır. Bugüne kadar her gün TÜM state
       (üye adları, telefon, TC, sağlık notu, adres, ödemeler) düz metin
       master key ile üçüncü tarafa gönderiliyordu. Ayrıca __sbFreshenFromJsonbin
       bir VERİ BÜTÜNLÜĞÜ tehlikesiydi: Supabase bir an boş dönerse bayat bir
       JSONBin kopyası canlı verinin üzerine yazabilirdi.
  D-1  target="_blank" olan toplu gönderim bağlantısında eksik rel="noopener".
  D-2  wa.me bağlantısı kişisel veriyi statik href içinde bekletiyordu.

Yöntem: str.replace + assert count (kanon kural).
"""
import io, sys

PATH = 'pilateria.html'
s = io.open(PATH, encoding='utf-8').read()
orig_len = len(s)
n = 0

def rep(old, new, why, count=1):
    """Tek ve kesin eşleşme garantili değiştirme."""
    global s, n
    c = s.count(old)
    assert c == count, 'ANCHOR HATASI (%d bulundu, %d bekleniyordu): %s' % (c, count, why)
    s = s.replace(old, new, count)
    n += 1
    print('  [%02d] %s' % (n, why))

print('PİLATERİA v121 yaması uygulanıyor…\n')

# ---------------------------------------------------------------------------
# 1) CSP — YAPISAL KİLİT.
#    connect-src'den jsonbin.io çıkınca gözden kaçan HERHANGİ bir kod yolu
#    tarayıcı seviyesinde ölür. JS içindeki korumalardan BAĞIMSIZ ikinci hat.
# ---------------------------------------------------------------------------
rep("connect-src 'self' https://api.jsonbin.io https://nvbnmhaxumrfsxdzrzzj.supabase.co",
    "connect-src 'self' https://nvbnmhaxumrfsxdzrzzj.supabase.co",
    "CSP: api.jsonbin.io connect-src'den KALDIRILDI (yapısal kill-switch)")

rep("""     Bağlantı yalnız kendi origin + JSONBin'e; nesne/embed yok; base/form kısıtlı; çerçeveleme engelli.""",
    """     v121: Bağlantı YALNIZ kendi origin + Supabase'e. JSONBin (ikinci bulut) tamamen kapatıldı —
     kişisel veri artık hiçbir üçüncü tarafa çıkmaz. Nesne/embed yok; base/form kısıtlı; çerçeveleme engelli.""",
    "CSP yorumu güncellendi (JSONBin artık izinli değil)")

# ---------------------------------------------------------------------------
# 2) TEK KAPI — JSONBIN_ENABLED bayrağı.
# ---------------------------------------------------------------------------
rep("""const SUPABASE_MODE = true;""",
    """const SUPABASE_MODE = true;
// v121 GİZLİLİK (O-5): JSONBin (eski "ikinci bulut") KAPATILDI ve bir daha açılmamalı.
// Sebep: JSONBin master key TARAYICIDA DÜZ METİN durur ve günlük yedek TÜM state'i
// (üye adı, telefon, TC kimlik, sağlık notu, adres, ödemeler) üçüncü tarafa yollardı.
// Bu bayrak JS tarafındaki tek kapı; ASIL kilit CSP connect-src'dir (yukarıda).
// Yerel 'pilateria_sync' anahtarı BİLEREK silinmez: JSONBin sürüm geçmişi arşivine
// (GET /v3/b/{binId}/versions) erişimin tek yolu odur — kurtarma ipucu olarak durur.
const JSONBIN_ENABLED = false;""",
    "const JSONBIN_ENABLED = false; eklendi (tek kapı)")

# ---------------------------------------------------------------------------
# 3) YEDİ JSONBin FONKSİYONUNA ERKEN ÇIKIŞ KAPISI.
#    Kapı her fonksiyonun İLK satırıdır — fetch'e ulaşılmadan dönülür.
# ---------------------------------------------------------------------------
rep("""async function pushToCloud(silent) {
  if (!syncCfg.enabled || !syncCfg.key || !syncCfg.bin) {""",
    """async function pushToCloud(silent) {
  if (!JSONBIN_ENABLED) return false; // v121 O-5: JSONBin yolu kapalı
  if (!syncCfg.enabled || !syncCfg.key || !syncCfg.bin) {""",
    "pushToCloud kapıya bağlandı")

rep("""async function pullFromCloud(silent) {
  if (!syncCfg.enabled || !syncCfg.key || !syncCfg.bin) {""",
    """async function pullFromCloud(silent) {
  if (!JSONBIN_ENABLED) return false; // v121 O-5: JSONBin yolu kapalı
  if (!syncCfg.enabled || !syncCfg.key || !syncCfg.bin) {""",
    "pullFromCloud kapıya bağlandı")

rep("""async function autoPush() {
  if (!syncConfigured()) return;""",
    """async function autoPush() {
  if (!JSONBIN_ENABLED) return; // v121 O-5: JSONBin yolu kapalı
  if (!syncConfigured()) return;""",
    "autoPush kapıya bağlandı")

rep("""async function autoPullIfNeeded(reason) {
  if (!syncConfigured()) return;""",
    """async function autoPullIfNeeded(reason) {
  if (!JSONBIN_ENABLED) return; // v121 O-5: JSONBin yolu kapalı
  if (!syncConfigured()) return;""",
    "autoPullIfNeeded kapıya bağlandı")

# CANLI SIZINTI buydu: syncConfigured()'ı hiç sormadığı için tek çalışan yoldu.
rep("""async function __pilOffsiteDaily() {
  try {
    if (__sbRole !== 'owner') return;""",
    """async function __pilOffsiteDaily() {
  try {
    if (!JSONBIN_ENABLED) return; // v121 O-5: günlük tam-state gönderimi DURDURULDU
    if (__sbRole !== 'owner') return;""",
    "__pilOffsiteDaily DURDURULDU (canlı sızıntı yolu)")

# Bu aynı zamanda bir VERİ BÜTÜNLÜĞÜ düzeltmesidir.
rep("""async function __sbFreshenFromJsonbin() {
  try {
    if (!syncCfg || !syncCfg.key || !syncCfg.bin) return;""",
    """async function __sbFreshenFromJsonbin() {
  try {
    // v121 O-5 + VERİ BÜTÜNLÜĞÜ: kapalı. Sızıntının yanı sıra bayat bir JSONBin
    // kopyasının canlı state'i ezme riskini de kaldırır (Supabase bir an boş dönerse).
    if (!JSONBIN_ENABLED) return;
    if (!syncCfg || !syncCfg.key || !syncCfg.bin) return;""",
    "__sbFreshenFromJsonbin kapatıldı (sızıntı + bayat veri ezme riski)")

rep("""    await __sbFreshenFromJsonbin(); // GÜVENCE: eski sistemin bulutundaki (JSONBin) EN GÜNCEL hali çek — hangi cihazdan geçilirse geçilsin veri kaybolmaz""",
    """    await __sbFreshenFromJsonbin(); // v121: artık işlem yapmaz (JSONBin kapalı). Bulut boş dönerse yerel veri korunur — aşağıdaki v65/v51 koruma katmanları devrede.""",
    "__sbFreshenFromJsonbin çağrı yeri yorumu düzeltildi")

# PIN teşhis paneli: sorgu kapatılır, "(senkron kapalı)" doğru şekilde görünür.
rep("""  if (syncCfg.enabled && syncCfg.key && syncCfg.bin) {
    try {
      const r = await fetch(`https://api.jsonbin.io/v3/b/${syncCfg.bin}/latest`, {
        headers: { 'X-Master-Key': syncCfg.key }
      });""",
    """  if (JSONBIN_ENABLED && syncCfg.enabled && syncCfg.key && syncCfg.bin) {
    try {
      const r = await fetch(`https://api.jsonbin.io/v3/b/${syncCfg.bin}/latest`, {
        headers: { 'X-Master-Key': syncCfg.key }
      });""",
    "diagnosePinSync JSONBin sorgusu kapıya bağlandı")

# Kapalıyken kaldırılmış bir panele yönlendiren YANILTICI ipucu çıkmasın.
rep("""  if (localHash && !cloudHash && syncCfg.enabled) {""",
    """  if (JSONBIN_ENABLED && localHash && !cloudHash && syncCfg.enabled) {""",
    "diagnosePinSync yanıltıcı 'Buluta Yolla' ipucu susturuldu")

# ---------------------------------------------------------------------------
# 4) DÜRÜSTLÜK — kullanıcıya artık var olmayan bir yedek vaat edilmemeli.
# ---------------------------------------------------------------------------
rep("""      Gece 00:00'da bulut yedeği OTOMATİK alınır (son 30 gün + ay başları 400 güne kadar). Her cihazda ayrıca son 5 günün yerel yedeği ve günde 1 kez ikinci bulut (JSONBin) kopyası tutulur. Uygulama hiç açılamazsa acil ekran: <b>keremcemulgen.github.io/pilateria/recover.html</b>""",
    """      Gece 00:00'da bulut yedeği OTOMATİK alınır (son 30 gün + ay başları 400 güne kadar) ve gün içinde saatlik anlık görüntü tutulur. Her cihazda ayrıca son 5 günün yerel yedeği vardır. Uygulama hiç açılamazsa acil ekran: <b>keremcemulgen.github.io/pilateria/recover.html</b><br><br>
      <b>v121 — Gizlilik:</b> Eski "ikinci bulut (JSONBin)" kopyası KAPATILDI; üye bilgileri artık hiçbir üçüncü tarafa gönderilmiyor. Buna karşılık tüm yedekler tek sağlayıcıda (Supabase) toplandığı için <b>ayda bir "⬇️ Yedek İndir (JSON)"</b> ile kendi cihazına da bir kopya almanı öneririm — son indirme tarihi yukarıda görünür.""",
    "kullanıcıya verilen yedek vaadi DÜRÜSTLEŞTİRİLDİ")

rep("""  let offsite = '—'; try { offsite = localStorage.getItem('pilateria_offsite_day') || '—'; } catch(e) {}""",
    """  // v121: JSONBin satırının yerine ELLE indirilen son yedeğin tarihi — sağlayıcı
  // çeşitliliği kapandığı için kullanıcının bunu görmesi artık daha önemli.
  let lastExport = 'hiç'; try { lastExport = localStorage.getItem('pilateria_last_export_day') || 'hiç'; } catch(e) {}""",
    "yedek paneli: offsite değişkeni son-elle-yedek ile değiştirildi")

rep("""    '🛰️ İkinci bulut (JSONBin) son gönderim: <b>' + esc(offsite) + '</b>'""",
    """    '💾 Son elle indirilen yedek (bu cihaz): <b>' + esc(lastExport) + '</b>'""",
    "yedek paneli satırı: JSONBin → son elle yedek")

rep("""  a.download = `pilateria-yedek-${todayISO()}.json`;
  a.click();""",
    """  a.download = `pilateria-yedek-${todayISO()}.json`;
  a.click();
  // v121: yedek panelinin "son elle yedek" satırı için damga (JSONBin kapandı,
  // elle indirilen kopyanın tazeliği artık görünür olmalı).
  try { localStorage.setItem('pilateria_last_export_day', todayISO()); } catch(e) {}""",
    "__exportDataNow: pilateria_last_export_day damgası eklendi")

# ---------------------------------------------------------------------------
# 5) D-1 / D-2 — WhatsApp akışı.
#    Ön dolu mesaj KORUNUR (Kerem'in günlük iş akışı bozulmaz); değişen tek şey
#    bağlantının NE ZAMAN ve NASIL kurulduğu.
# ---------------------------------------------------------------------------
rep("""function buildWaLink(phone, text) {""",
    """// v121 GİZLİLİK (D-2): WhatsApp bağlantısı artık sayfada statik <a href> içinde
// BEKLEMEZ. Kişisel veri (isim, borç tutarı, ders saati) yalnız TIKLAMA ANINDA
// URL'ye dönüşür ve sekme noopener,noreferrer ile açılır: açılan sekmenin
// window.opener'ı yoktur ve Referer gönderilmez.
// DÜRÜSTLÜK NOTU: mesaj metni wa.me'ye sorgu dizesiyle gitmeye DEVAM eder —
// bu wa.me'nin doğasıdır ve zaten alıcı WhatsApp'ın kendisidir. Kaldırılan risk,
// verinin tıklanmadan önce DOM'da/durum çubuğunda/kopyalanabilir bağlantıda durması.
function waOpenFrom(btn) {
  if (!btn || !btn.getAttribute) return;
  const p = btn.getAttribute('data-wa-p') || '';
  const m = btn.getAttribute('data-wa-m') || '';
  window.open(buildWaLink(p, m), '_blank', 'noopener,noreferrer');
}
function buildWaLink(phone, text) {""",
    "waOpenFrom() yardımcısı eklendi (URL tıklama anında kurulur)")

rep("""  window.open(link, '_blank');""",
    """  window.open(link, '_blank', 'noopener,noreferrer'); // v121 D-2: opener/referrer sızıntısı kapalı""",
    "sendWa: window.open noopener,noreferrer ile")

# Bugünün Mesajları paneli — kişisel yük href'ten çıkarıldı.
rep("""      ? `<a href="${buildWaLink(phone, msg)}" target="_blank" rel="noopener noreferrer" class="btn small" style="background:#25D366;border-color:#25D366;color:#fff;text-decoration:none;">💬 WhatsApp'ta Aç</a>`""",
    """      ? `<button type="button" onclick="waOpenFrom(this)" data-wa-p="${escapeHtml(phone)}" data-wa-m="${escapeHtml(msg)}" class="btn small" style="background:#25D366;border-color:#25D366;color:#fff;">💬 WhatsApp'ta Aç</button>`""",
    "Bugünün Mesajları: <a href> → buton (kişisel veri href'te değil)")

# Toplu gönderim — D-1 artığı (rel yoktu) burada da kapanır.
rep("""    const msg = fillWaTemplate(tpl.text, ctx);
    const link = buildWaLink(phone, msg);
    const phoneOk = !!normalizePhone(phone);""",
    """    const msg = fillWaTemplate(tpl.text, ctx);
    const phoneOk = !!normalizePhone(phone);""",
    "toplu gönderim: kullanılmayan link değişkeni kaldırıldı")

rep("""          ? `<a href="${link}" target="_blank" class="btn small" style="background:#25D366;border-color:#25D366;color:#fff;text-decoration:none;">📤 Gönder</a>`""",
    """          ? `<button type="button" onclick="waOpenFrom(this)" data-wa-p="${escapeHtml(phone)}" data-wa-m="${escapeHtml(msg)}" class="btn small" style="background:#25D366;border-color:#25D366;color:#fff;">📤 Gönder</button>`""",
    "toplu gönderim: <a href> → buton (D-1 eksik rel artığı da kapandı)")

io.open(PATH, 'w', encoding='utf-8').write(s)
print('\n%d yama uygulandı. Boyut: %d → %d (%+d)' % (n, orig_len, len(s), len(s) - orig_len))
