# -*- coding: utf-8 -*-
# v156 — Kerem (2026-08-30): "Agustosta sali-carsamba varsayilan gun secilen grup, EYLUL ayi uye
# listesinde 'Varsayilan Gun/Saatten Doldur' deyince toplu ders gir sekmesine AGUSTOS tarihlerini
# yaziyor. Kok nedeni bul; yama degil SISTEMIK cozum."
# KOK NEDEN: batchDatesAutoFill baslangic tarihini HEDEF PAKET AYINDAN (__batchDatesTarget.packageMonth
# — modal zaten v38'den beri bu aya kilitli) DEGIL, grupta eski packageStartDate alanindan, uyede
# bugunden aliyordu. Ayni hastalik scheduleGroupMonth'ta: bugunden uretir, derslere packageMonth
# yazmaz (hak tavani/rozet hesaplari yanlis aya bakar).
# v156 SISTEMIK KURALI: TOPLU TARIH URETIMI HER ZAMAN HEDEF PAKET AYININ 1'INDEN BASLAR.
#  - batchDatesAutoFill: capa = (__batchDatesTarget.packageMonth || currentMonth()) + '-01'.
#    packageStartDate/bugun capalari KALDIRILDI (tek kaynak: modalin kilitli oldugu ay).
#  - scheduleGroupMonth: capa = grup detayinin acik oldugu ayin 1'i; olusan derslere packageMonth
#    yazilir; onay metni hangi ay icin uretildigini soyler; hak tavani da o paket ayina bakar.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) batchDatesAutoFill: grup dalindaki eski capa kaldirilir ----------
rep("""    defaultDays = g.defaultDays || [];
    defaultTime = g.defaultTime || '';
    startStr = g.packageStartDate || todayISO();
  } else {""",
"""    defaultDays = g.defaultDays || [];
    defaultTime = g.defaultTime || '';
  } else {""")

# ---------- 2) batchDatesAutoFill: uye dalindaki eski capa kaldirilir ----------
rep("""    defaultDays = m.defaultDays || [];
    defaultTime = m.defaultTime || '';
    startStr = todayISO();
  }""",
"""    defaultDays = m.defaultDays || [];
    defaultTime = m.defaultTime || '';
  }""")

# ---------- 3) batchDatesAutoFill: tek sistemik capa — hedef paket ayinin 1'i ----------
rep("""  const start = parseISO(startStr);
  const dates = [];""",
"""  // v156 (Kerem): SISTEMIK KURAL — tarih uretimi HER ZAMAN hedef paket ayinin takviminden baslar
  // (modal hangi ayin paketine kilitliyse o ayin 1'i). Eski packageStartDate/bugun capalari, Eylul
  // listesinde acilan modala Agustos tarihleri yazdiriyordu (kok neden).
  startStr = (__batchDatesTarget.packageMonth || currentMonth()) + '-01';
  const start = parseISO(startStr);
  const dates = [];""")

# ---------- 4) scheduleGroupMonth: ay baglami + onay metni + capa ----------
rep("""  if (!confirm(`"${groupDisplayName(g)}" grubu için ${g.defaultDays.map(d=>DAYS_LONG[d]).join(', ')} günlerinde saat ${g.defaultTime}'te 4 hafta (${g.defaultDays.length*4} ders) oluşturulacak. Devam?`)) return;
  const startISO = todayISO();""",
"""  // v156 (Kerem): ayni sistemik kural — uretim GRUP DETAYININ ACIK OLDUGU AYIN 1'inden baslar
  // (bugunden degil) ve olusan derslere packageMonth yazilir ki hak/rozet hesaplari dogru aya baksin.
  const __ay156 = ((typeof currentGroupDetailMonth !== 'undefined' && currentGroupDetailMonth) || currentMonth());
  if (!confirm(`"${groupDisplayName(g, __ay156)}" grubu için ${pkgMonthLabel(__ay156)} ayında ${g.defaultDays.map(d=>DAYS_LONG[d]).join(', ')} günlerinde saat ${g.defaultTime}'te 4 hafta (${g.defaultDays.length*4} ders) oluşturulacak. Devam?`)) return;
  const startISO = __ay156 + '-01';""")

# ---------- 5) scheduleGroupMonth: hak tavani paket ayina bakar ----------
rep("""      if (quotaCeilingMsg('group', groupId, dISO.slice(0, 7), null)) { skipped++; continue; } // v154: hak tavani""",
"""      if (quotaCeilingMsg('group', groupId, __ay156, null)) { skipped++; continue; } // v154 hak tavani · v156: hedef paket ayina gore""")

# ---------- 6) scheduleGroupMonth: olusan derse packageMonth yazilir ----------
rep("""        instructorId: g.defaultInstructorId||'', size: g.size,
        memberIds: (g.memberIds||[]).filter(x => x && state.members.find(m=>m.id===x)), groupId: groupId, note: ''""",
"""        instructorId: g.defaultInstructorId||'', size: g.size, packageMonth: __ay156, /* v156 */
        memberIds: (g.memberIds||[]).filter(x => x && state.members.find(m=>m.id===x)), groupId: groupId, note: ''""")

# ---------- SURUM ----------
rep('<meta name="app-version" content="2026.08.30.78">', '<meta name="app-version" content="2026.08.30.79">')
rep("const APP_VERSION = '2026.08.30.78';", "const APP_VERSION = '2026.08.30.79';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v155-2026-08-30-78';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v156-2026-08-30-79';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
