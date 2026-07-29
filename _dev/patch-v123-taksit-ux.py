# -*- coding: utf-8 -*-
# v123 — TAKSIT UX: kalan on-doldurma + modal bakiye seridi + mobil/grup "Odendi" yalani duzeltmesi
# Kural: str.replace + assert count; pilateria.html'e baska hicbir sey dokunmaz.
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:90])
    s = s.replace(old, new)

# ---------- 1) checkbox metni + mp-balance seridi ----------
rep(' ✏️ Özel fiyat girmek istiyorum</label></div>',
    ' ✏️ Farklı tutar gir (taksit / özel fiyat)</label></div>\n'
    '      <div id="mp-balance" style="display:none;margin:2px 0 6px;padding:8px 10px;border-radius:8px;background:#FFF8E1;font-size:12.5px;line-height:1.55;"></div>')

# ---------- 2) renderPayBalanceStrip — paymentCapCheck'in hemen ardina ----------
rep("""  const kalan = Math.max(0, Math.round((defined - paid) * 100) / 100);
  const ok = (paid + (+newAmount || 0)) <= defined + 0.005;
  return { ok, defined, paid, kalan };
}
""",
"""  const kalan = Math.max(0, Math.round((defined - paid) * 100) / 100);
  const ok = (paid + (+newAmount || 0)) <= defined + 0.005;
  return { ok, defined, paid, kalan };
}
// v123: TAKSIT GORUNURLUGU — odeme penceresinde bakiye seridi (motor v110'dan beri var, arayuzu yoktu)
function renderPayBalanceStrip() {
  const el = document.getElementById('mp-balance');
  if (!el) return;
  const memberId = (document.getElementById('mp-member')||{}).value || '';
  const groupId = (document.getElementById('mp-group')||{}).value || '';
  const editId = (document.getElementById('mp-id')||{}).value || '';
  const ay = ((document.getElementById('mp-pkg-month')||{}).value) || String((document.getElementById('mp-date')||{}).value || todayISO()).slice(0,7);
  if (!memberId) { el.style.display = 'none'; return; }
  const cap = paymentCapCheck(memberId, groupId, ay, 0, editId);
  const exNote = editId ? ' <span style="opacity:.7">(düzenlenen kayıt hariç)</span>' : '';
  el.style.display = 'block';
  if (cap.defined > 0) {
    if (cap.kalan <= 0.005) {
      el.style.background = '#E8F5E9';
      el.innerHTML = `📦 ${ay} paketi: <b>${money(cap.defined)} ₺</b> · Ödenen: <b>${money(cap.paid)} ₺</b>${exNote} — ✅ tamamen ödendi`;
    } else if (cap.paid > 0) {
      el.style.background = '#FFF8E1';
      el.innerHTML = `📦 ${ay} paketi: <b>${money(cap.defined)} ₺</b> · Ödenen: <b>${money(cap.paid)} ₺</b>${exNote} · Kalan: <b>${money(cap.kalan)} ₺</b> — 🟡 taksit devam ediyor`;
    } else {
      el.style.background = '#F1F8FF';
      el.innerHTML = `📦 ${ay} paketi: <b>${money(cap.defined)} ₺</b> · Kalan: <b>${money(cap.kalan)} ₺</b> — 💡 daha az girersen kalanı sonra <b>taksitle</b> alabilirsin`;
    }
  } else {
    el.style.background = '#FDECEA';
    el.innerHTML = `ℹ️ Bu üyenin ${ay} için tanımlı fiyatı yok — taksit takibi için üyeye aylık fiyat tanımla (fiyat tanımlıyken taksit, kalana kadar serbesttir).`;
  }
}
""")

# ---------- 3) openPaymentModal: bireysel yeni odemede KALANI on-doldur ----------
rep("""    const _own = memberMonthlyTotalPrice(memberId, (document.getElementById('mp-date').value||'').slice(0,7)||currentMonth()) || ((state.members.find(x=>x.id===memberId)||{}).totalPrice);
    if (_own) { document.getElementById('mp-list').value = _own; document.getElementById('mp-amount').value = _own; }
""",
"""    const _own = memberMonthlyTotalPrice(memberId, (document.getElementById('mp-date').value||'').slice(0,7)||currentMonth()) || ((state.members.find(x=>x.id===memberId)||{}).totalPrice);
    if (_own) { document.getElementById('mp-list').value = _own; document.getElementById('mp-amount').value = _own; }
    // v123: taksit — onceki odeme varsa KALANI on-doldur (grup akisinde applyLockedShare yapar)
    if (!groupId) {
      const __ay123 = (document.getElementById('mp-pkg-month')||{}).value || (document.getElementById('mp-date').value||'').slice(0,7) || currentMonth();
      const __cap123 = paymentCapCheck(memberId, '', __ay123, 0, '');
      if (__cap123.defined > 0 && __cap123.paid > 0 && __cap123.kalan > 0.005) document.getElementById('mp-amount').value = __cap123.kalan;
    }
""")

# ---------- 4) openPaymentModal: acilista seridi ciz ----------
rep("""  setupPayPriceLock(document.getElementById('mp-member').value || memberId, editId, groupId);
  renderTaxBreakdown();
  openModal('modal-payment');
""",
"""  setupPayPriceLock(document.getElementById('mp-member').value || memberId, editId, groupId);
  renderTaxBreakdown();
  renderPayBalanceStrip(); // v123
  openModal('modal-payment');
""")

# ---------- 5) onPayMemberChange: kalan on-dolum + serit ----------
rep("""    const month = ((document.getElementById('mp-pkg-month')||{}).value) || String(document.getElementById('mp-date').value || todayISO()).slice(0,7); // v37: paket ayi
    const own = memberMonthlyTotalPrice(mid, month) || ((state.members.find(x=>x.id===mid)||{}).totalPrice);
    if (own) { document.getElementById('mp-list').value = own; document.getElementById('mp-amount').value = own; }
  }
}
""",
"""    const month = ((document.getElementById('mp-pkg-month')||{}).value) || String(document.getElementById('mp-date').value || todayISO()).slice(0,7); // v37: paket ayi
    const own = memberMonthlyTotalPrice(mid, month) || ((state.members.find(x=>x.id===mid)||{}).totalPrice);
    if (own) { document.getElementById('mp-list').value = own; document.getElementById('mp-amount').value = own; }
    // v123: taksit — onceki odeme varsa KALANI on-doldur
    const __capC = paymentCapCheck(mid, '', month, 0, '');
    if (__capC.defined > 0 && __capC.paid > 0 && __capC.kalan > 0.005) document.getElementById('mp-amount').value = __capC.kalan;
  }
  renderPayBalanceStrip(); // v123
}
""")

# ---------- 6) applyLockedShare: kilit KALANA kilitlensin ----------
rep("""  if (share) { listEl.value = share; amountEl.value = share; }
  amountEl.readOnly = true;
""",
"""  if (share) { listEl.value = share; amountEl.value = share; }
  // v123: taksit — onceki odeme varsa KALANA kilitle (ikinci taksit tek dokunus)
  const __capL = paymentCapCheck(mid, gid, month, 0, (document.getElementById('mp-id')||{}).value || '');
  if (__capL.defined > 0 && __capL.paid > 0 && __capL.kalan > 0.005) amountEl.value = __capL.kalan;
  amountEl.readOnly = true;
""")

rep("""  if (info && g) info.textContent = `👯 ${groupDisplayName(g, (document.getElementById('mp-pkg-month')||{}).value || currentMonth())} üyesi — tutar grubun kişi başı payına kilitli (${money(share)} ₺). Farklı tutar için "Özel fiyat" işaretle.`;
""",
"""  if (info && g) info.textContent = `👯 ${groupDisplayName(g, (document.getElementById('mp-pkg-month')||{}).value || currentMonth())} üyesi — ${(__capL.defined > 0 && __capL.paid > 0 && __capL.kalan > 0.005) ? `tutar KALAN bakiyeye kilitli (${money(__capL.kalan)} ₺ — taksit tamamlama)` : `tutar grubun kişi başı payına kilitli (${money(share)} ₺)`}. Farklı tutar için "✏️ Farklı tutar gir" işaretle.`;
""")

rep("""    if (info) info.textContent = '✏️ Özel fiyat girebilirsin — kaydedilen tutar bu olacak.';
""",
"""    if (info) info.textContent = '✏️ Tutarı serbestçe girebilirsin — kalandan az girersen taksit olarak kaydedilir.';
""")

# ---------- 7) MOBIL KART: v110 kurali + Kalan satiri (EN KRITIK) ----------
rep("""    const paid = +r.paid || 0;
    const fee = (r.ownPrice !== undefined && r.ownPrice !== '') ? (+r.ownPrice||0) : (+r.totalPrice || 0); // v.40 grup uyesinde KENDI fiyati
    const isPaid = r.type === 'group' ? paid > 0 : ((+r.remaining||0) <= 0 && paid > 0);
""",
"""    const paid = +r.paid || 0;
    const fee = (r.ownPrice !== undefined && r.ownPrice !== '') ? (+r.ownPrice||0) : (+r.totalPrice || 0); // v.40 grup uyesinde KENDI fiyati
    const __kalanTL = r.type === 'group' ? Math.max(0, fee - paid) : Math.max(0, +r.remaining || 0); // v123
    const isPaid = fee > 0 ? (paid >= fee - 0.005) : paid > 0; // v123: v110 kurali mobilde de — kismi YESIL OLMAZ
    const isPartial = !isPaid && paid > 0 && fee > 0; // v123
""")

rep("""        <span class="mc-status ${isPaid?'ok':'due'}">${isPaid?'✅ Ödendi':'⏳ Bekliyor'}</span>
""",
"""        <span class="mc-status ${isPaid?'ok':'due'}">${isPaid?'✅ Ödendi':(isPartial?('🟡 Kısmi '+money(paid)+'/'+money(fee)):'⏳ Bekliyor')}</span>
""")

rep("""        ${r.type!=='group' ? `<span>Kalan <b class="${(+r.remaining||0)>0?'mc-due':''}">${money(+r.remaining||0)} ₺</b></span>` : ''}
""",
"""        <span>Kalan <b class="${__kalanTL>0?'mc-due':''}">${money(__kalanTL)} ₺</b></span>
""")

# ---------- 8) GRUP DETAYI: v110 kurali ----------
rep("""    const hasGroupPay = ayPays.length > 0;
""",
"""    const hasGroupPay = ayPays.length > 0;
    const __paidTL = ayPays.reduce((a,b)=>a+(+b.amount||0),0); // v123
""")

rep("""    const tickLabel = hasGroupPay ? '✅ Ödendi' : '⬜ Ödeme al';
    const tickStyle = hasGroupPay
      ? 'background:#E8F5E9;color:#2E7D32;border:1px solid #2E7D32;'
      : 'background:#FFF8E1;color:#8a7b20;border:1px dashed #c9b85f;';
    const __rowPrice = __ayPrice(m.id);
    const hasPrice = (+__rowPrice > 0);
    const priceLabel = hasPrice
      ? `<b>${money(+__rowPrice)} ₺</b>`
      : '<span style="color:#c62828;font-style:italic;">tanımsız</span>';
""",
"""    const __rowPrice = __ayPrice(m.id);
    const __full = (+__rowPrice > 0) ? (__paidTL >= (+__rowPrice) - 0.005) : hasGroupPay; // v123: v110 kurali grup detayinda da
    const __partial = !__full && __paidTL > 0; // v123
    const tickLabel = __full ? '✅ Ödendi' : (__partial ? ('🟡 Kısmi ' + money(__paidTL) + '/' + money(+__rowPrice)) : '⬜ Ödeme al');
    const tickStyle = __full
      ? 'background:#E8F5E9;color:#2E7D32;border:1px solid #2E7D32;'
      : (__partial
        ? 'background:#FFF8E1;color:#b8860b;border:1px solid #e0c060;'
        : 'background:#FFF8E1;color:#8a7b20;border:1px dashed #c9b85f;');
    const hasPrice = (+__rowPrice > 0);
    const priceLabel = hasPrice
      ? `<b>${money(+__rowPrice)} ₺</b>` + (__partial ? `<br><span style="font-size:11px;color:#c62828;">Kalan ${money(Math.max(0, (+__rowPrice) - __paidTL))} ₺</span>` : '')
      : '<span style="color:#c62828;font-style:italic;">tanımsız</span>';
""")

rep("""    return `<tr style="background:${hasGroupPay?'#f5fbf5':'#fffdf5'};">
""",
"""    return `<tr style="background:${__full?'#f5fbf5':'#fffdf5'};">
""")

rep("""onclick="togglePaidTick('${m.id}','${id}',event,'${monthISO||''}')" title="${hasGroupPay?((monthISO||'bu ay')+' ödemesini kaldır'):('Bu üye için '+(monthISO||'bu ay')+' ödeme kaydı yarat')}">${tickLabel}</button>""",
"""onclick="togglePaidTick('${m.id}','${id}',event,'${monthISO||''}')" title="${__full?((monthISO||'bu ay')+' ödemesini kaldır'):(__partial?'Kalanı tahsil et — taksit tamamlama':('Bu üye için '+(monthISO||'bu ay')+' ödeme kaydı yarat'))}">${tickLabel}</button>""")

# ---------- 9) UYE DETAYI: TL kalan bakiye ----------
rep("""      <div class="stat warn"><div class="label">Ödeme (${ctxAy}) ₺</div><div class="value">${money(totalPaid)}</div></div>
""",
"""      <div class="stat warn"><div class="label">Ödeme (${ctxAy}) ₺</div><div class="value">${money(totalPaid)}</div>${(function(){try{const __b=memberBalanceForMonth(id, ctxAy);return __b>0?('<div style="font-size:10px;color:#c62828;font-weight:700;margin-top:2px;">Kalan '+money(__b)+' ₺ — taksit devam</div>'):''}catch(e){return ''}})()}</div>
""")

# ---------- 10) SURUM ----------
rep('<meta name="app-version" content="2026.07.27.45">', '<meta name="app-version" content="2026.07.29.46">')
rep("const APP_VERSION = '2026.07.27.45';", "const APP_VERSION = '2026.07.29.46';")

io.open(P, 'w', encoding='utf-8').write(s)
print('pilateria.html OK (%+d bayt)' % (len(s) - n0))

# ---------- sw.js ----------
Q = 'sw.js'
t = io.open(Q, encoding='utf-8').read()
old = "const CACHE_NAME = 'pilateria-v122-2026-07-27-45';"
assert t.count(old) == 1, 'sw.js anchor!'
t = t.replace(old, "const CACHE_NAME = 'pilateria-v123-2026-07-29-46';")
io.open(Q, 'w', encoding='utf-8').write(t)
print('sw.js OK')
