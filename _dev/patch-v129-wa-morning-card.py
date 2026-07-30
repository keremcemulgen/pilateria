# -*- coding: utf-8 -*-
# v129 — PANELDE SABAH WHATSAPP RAPORU KARTI
# Sunucu motoru (pilateria_wa_morning, GOLGE mod) bugun kuruldu; her sabah 08:00 TR'de
# wa_morning_log'a yazar. Bu yama istemciye YALNIZ OKUYAN bir kart ekler:
#  - panelde ozet ("GOLGE: 18 uyeye gidecekti - 18 sorunlu numara - listele")
#  - detay modali: uye/saat/telefon/durum + telefonu eksik uyeye tek dokunusla "📞 Ekle"
# Onemli bulgu (2026-07-30 canli olcum): 114 uyenin TAMAMININ telefon alani bos —
# kart, numara tamamlama isini gorunur kilar.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# 1) panel HTML
rep("""    <div id="dash-birthdays" style="display:none;margin-top:6px;font-size:12.5px;"></div>
""",
"""    <div id="dash-birthdays" style="display:none;margin-top:6px;font-size:12.5px;"></div>
    <div id="dash-wa-morning" style="display:none;margin-top:6px;font-size:12.5px;"></div>
""")

# 2) JS — okuyucu + detay modali
rep("""function renderNextWeekMissing(){
""",
"""// v129: SABAH WHATSAPP RAPORU — sunucu 08:00'de yazar (pilateria_wa_morning), istemci YALNIZ OKUR.
// wa_config'e istemci ASLA erisemez (RLS politikasiz); burada yalniz wa_morning_log okunur.
async function __waMorningFetch() {
  const el = document.getElementById('dash-wa-morning');
  if (!el) return;
  if (!SUPABASE_MODE || !sbClient) { el.style.display = 'none'; return; }
  try {
    const r = await sbClient.from('wa_morning_log').select('id,data').eq('id', todayISO()).maybeSingle();
    if (!r || r.error || !r.data || !r.data.data) { el.style.display = 'none'; return; }
    const d = r.data.data;
    window.__waMorningData = d;
    const shadow = d.mode !== 'live';
    const bad = +d.sorunlu || 0;
    el.style.display = 'block';
    el.innerHTML = (shadow
        ? '📱 <b>Sabah mesajları</b> <span style="background:#FFF8E1;color:#8a6d00;border-radius:99px;padding:0 8px;font-size:11px;font-weight:700;">GÖLGE MOD</span> bugün <b>' + (+d.toplam || 0) + '</b> üyeye gidecekti'
        : '📱 <b>Sabah mesajları:</b> <b>' + (+d.gonderilen || 0) + '</b> gönderildi')
      + (bad ? ' · <span style="color:#c62828;font-weight:700;">' + bad + ' sorunlu numara</span>' : '')
      + ' · <a href="#" onclick="waMorningDetail();return false;">listele</a>';
  } catch(e) { el.style.display = 'none'; }
}
function waMorningDetail() {
  const d = window.__waMorningData;
  if (!d) return;
  const old = document.getElementById('modal-wa-morning'); if (old) old.remove();
  const mdl = document.createElement('div');
  mdl.id = 'modal-wa-morning'; mdl.className = 'modal-bg open';
  const rows = (d.kisiler || []).map(function(k) {
    const bad = /hatali|hata/.test(k.durum || '');
    return `<tr style="${bad ? 'background:#FDECEA;' : ''}">
      <td><b>${escapeHtml(k.ad || '')}</b></td>
      <td>${escapeHtml(k.saat || '')}</td>
      <td>${escapeHtml(k.tel || '—')}</td>
      <td>${escapeHtml(k.durum || '')}${(bad && k.memberId) ? ` <button class="btn small secondary" onclick="document.getElementById('modal-wa-morning').remove();openMemberModal('${k.memberId}')" title="Üyeye telefon numarası ekle">📞 Ekle</button>` : ''}</td>
    </tr>`;
  }).join('');
  mdl.innerHTML = `<div class="modal" style="max-width:600px;max-height:82vh;overflow:auto;">
    <h3>📱 Sabah mesajları — ${todayISO()} (${d.mode === 'live' ? 'CANLI' : 'GÖLGE MOD'})</h3>
    <div style="font-size:12.5px;color:var(--muted);margin:4px 0 8px;">${d.mode === 'live'
      ? 'Bu sabah 08:00\\'de gönderilen mesajlar.'
      : 'GÖLGE MOD: hiçbir mesaj GÖNDERİLMEDİ — gerçek gönderim açık olsaydı bu liste giderdi. Sorunlu numaraları 📞 Ekle ile tamamla.'}</div>
    <div class="table-wrap"><table>
      <thead><tr><th>Üye</th><th>Saat</th><th>Telefon</th><th>Durum</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4"><div class="empty">Bugün dersi olan üye yok.</div></td></tr>'}</tbody>
    </table></div>
    <div class="row" style="justify-content:flex-end;margin-top:8px;"><button class="btn secondary" onclick="document.getElementById('modal-wa-morning').remove()">Kapat</button></div>
  </div>`;
  document.body.appendChild(mdl);
}
function renderNextWeekMissing(){
""")

# 3) panel render kancasi
rep("""  try { __renderBirthdays(); } catch(e){}
""",
"""  try { __renderBirthdays(); } catch(e){}
  try { __waMorningFetch(); } catch(e){}
""")

# 4) surum
rep('<meta name="app-version" content="2026.07.29.51">', '<meta name="app-version" content="2026.07.30.52">')
rep("const APP_VERSION = '2026.07.29.51';", "const APP_VERSION = '2026.07.30.52';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v128-2026-07-29-51';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v129-2026-07-30-52';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
