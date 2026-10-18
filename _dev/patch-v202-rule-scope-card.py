# -*- coding: utf-8 -*-
# v202 — ÖĞRENİLEN KAPSAM KARTA BAĞLI (Kerem 18.10: "Bunlar benim kartımdaysa hane, Derya ÖZTEPE'nin kartından geliyorsa stüdyo gideri").
# v200/v201'de kural (merchant → kapsam) kartın varsayılanını eziyordu: Kerem'in kartında 'hane' öğrenilen Getir/Pilita/Uber Eats, Derya'nın
# kartında da 'hane' geliyordu (canlıda elle düzeltildi). Artık: kural kapsamı yalnız (a) 'skip' ise ve kart employerSkip ise, (b) o kart için
# öğrenilmiş SAPMA ise (rule.scopeAcc === card.id) uygulanır; kartın varsayılanıyla aynı kapsam öğrenilmez (scope '' ). Kategori/cari öğrenimi değişmez.
import io
P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    c = s.count(old)
    assert c == cnt, 'ANCHOR %dx (beklenen %d): %r' % (c, cnt, old[:120])
    s = s.replace(old, new)

rep("""  const r = finRuleFor196(desc); if (r) return { category: r.category || 'Diğer', counterpartyId: r.counterpartyId || '', business: r.business !== false, scope: r.scope || (r.business === false ? 'hane' : ''), fromRule: true };""",
    """  const r = finRuleFor196(desc); if (r) return { category: r.category || 'Diğer', counterpartyId: r.counterpartyId || '', business: r.business !== false, scope: r.scope || (r.business === false ? 'hane' : ''), fromRule: true, rule: r }; // v202: rule → kapsam kart bazında (finRuleScope202)""")

rep("""function finLearnRule196(desc, category, counterpartyId, business, scope) {
  const key = finMerchantKey196(desc); if (!key || key.length < 3) return;
  __finNormalize196(state);
  let r = state.finRules.find(function(x){ return x && x.pattern === key; });
  if (!r) { r = { id: uid(), kind: 'rule', pattern: key, hits: 0, createdAt: new Date().toISOString() }; state.finRules.push(r); }
  r.category = category || 'Diğer'; r.counterpartyId = counterpartyId || ''; r.business = business !== false; r.scope = scope || (business === false ? 'hane' : 'studio'); r.hits = (r.hits || 0) + 1; r.updatedAt = new Date().toISOString(); // v200: kapsam öğrenilir
}""",
"""function finLearnRule196(desc, category, counterpartyId, business, scope, card) {
  const key = finMerchantKey196(desc); if (!key || key.length < 3) return;
  __finNormalize196(state);
  let r = state.finRules.find(function(x){ return x && x.pattern === key; });
  if (!r) { r = { id: uid(), kind: 'rule', pattern: key, hits: 0, createdAt: new Date().toISOString() }; state.finRules.push(r); }
  r.category = category || 'Diğer'; r.counterpartyId = counterpartyId || ''; r.business = business !== false; r.hits = (r.hits || 0) + 1; r.updatedAt = new Date().toISOString();
  if (card) { // v202: kapsam KARTA BAĞLI öğrenilir — yalnız kartın varsayılanından sapma saklanır (Kerem: "benim kartımdaysa hane, Derya'nın kartındaysa stüdyo")
    const def = card.scopeDefault || 'studio', sc = scope || 'studio';
    if (sc === 'skip') { r.scope = 'skip'; r.scopeAcc = ''; }
    else if (sc !== def) { r.scope = sc; r.scopeAcc = card.id; }
    else if (r.scope === 'skip' ? !!card.employerSkip : (!r.scopeAcc || r.scopeAcc === card.id)) { r.scope = ''; r.scopeAcc = ''; } // varsayılana dönüş: yalnız bu kartın (ya da kartsız eski) sapması silinir; başka kartın sapması ve işveren-dışı kartta 'atla' korunur
  } else { r.scope = scope || (business === false ? 'hane' : 'studio'); } // v200 (kartsız çağrı)
}
function finRuleScope202(rule, card) { // v202: öğrenilen kapsam ne zaman uygulanır — 'atla' yalnız işveren kartında; diğer sapmalar yalnız öğrenildiği kartta
  if (!rule || !rule.scope) return '';
  if (rule.scope === 'skip') return (card && card.employerSkip) ? 'skip' : '';
  if (card && rule.scopeAcc && rule.scopeAcc === card.id) return rule.scope;
  return '';
}""")

rep("""function finDefaultScope200(desc, card, guess) { // v200: satırın kapsamı — kural > işveren ipucu (employerSkip kartta) > stüdyo ipucu > kartın varsayılanı
  if (guess && guess.fromRule && guess.scope) return guess.scope;""",
"""function finDefaultScope200(desc, card, guess) { // v200: satırın kapsamı — kural > işveren ipucu (employerSkip kartta) > stüdyo ipucu > kartın varsayılanı · v202: kural kapsamı kart bazında
  const rs202 = (guess && guess.fromRule) ? finRuleScope202(guess.rule, card) : ''; if (rs202) return rs202;""")

rep("""    if (scope === 'skip') { nSkip++; fps.push(r.fp); finLearnRule196(r.desc, r.category, r.counterpartyId, true, 'skip'); return; } // işveren masrafı: hiç yazılmaz, parmak izi tutulur""",
    """    if (scope === 'skip') { nSkip++; fps.push(r.fp); finLearnRule196(r.desc, r.category, r.counterpartyId, true, 'skip', card); return; } // işveren masrafı: hiç yazılmaz, parmak izi tutulur""")
rep("""    finLearnRule196(r.desc, r.category, r.counterpartyId, scope !== 'hane', scope);""",
    """    finLearnRule196(r.desc, r.category, r.counterpartyId, scope !== 'hane', scope, card); // v202: kart bazında""")

rep('<meta name="app-version" content="2026.10.18.124">', '<meta name="app-version" content="2026.10.18.125">')
rep("const APP_VERSION = '2026.10.18.124';", "const APP_VERSION = '2026.10.18.125';")
io.open(P, 'w', encoding='utf-8').write(s)
SW = 'sw.js'; w = io.open(SW, encoding='utf-8').read()
assert w.count("const CACHE_NAME = 'pilateria-v201-2026-10-18-124';") == 1
w = w.replace("const CACHE_NAME = 'pilateria-v201-2026-10-18-124';", "const CACHE_NAME = 'pilateria-v202-2026-10-18-125';")
io.open(SW, 'w', encoding='utf-8').write(w)
print('v202 yama tamam')
