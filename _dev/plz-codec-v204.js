// ═══════ v204 PLZ — yedek kopyaları için sıkıştırma (LZ77; çıktı 15 bit/karakter, UTF-16 güvenli; eşzamanlı; bağımlılık yok) ═══════
// Biçim: 'PLZ1:' + uzunluk(36 tabanı) + ':' + yük. Yük karakterleri 32..32799 (vekil çift yok). Simge: 1 bit bayrak; 0 = harf
// (0 + 7 bit ASCII | 1 + 16 bit), 1 = eşleşme (uzunluk-3: 4 bit, 15 ise +8 bit, 255 ise +16 bit; uzaklık-1: 0 + 10 bit | 1 + 17 bit).
// Pencere 131072, en kısa eşleşme 3, en uzun 4096 + ... Sıkıştırma başarısız/anlamsızsa (kazanç yok) ham metin döner (işaretsiz).
var __PLZ_MARK = 'PLZ1:';
function __plzIsPacked(s) { return typeof s === 'string' && s.indexOf(__PLZ_MARK) === 0; }
function __plzCompress(s) {
  s = String(s == null ? '' : s);
  var n = s.length; if (!n) return __PLZ_MARK + '0:';
  var WIN = 131072, MAXLEN = 4096 + 3 + 15 + 255, MAXCHAIN = 24, HBITS = 16, HMASK = (1 << HBITS) - 1;
  var head = new Int32Array(1 << HBITS).fill(-1), prev = new Int32Array(n);
  var out = [], acc = 0, nb = 0;
  function put(v, bits) { acc = ((acc << bits) | v) >>> 0; nb += bits; while (nb >= 15) { nb -= 15; out.push(String.fromCharCode(32 + ((acc >>> nb) & 0x7FFF))); } acc = nb ? (acc & ((1 << nb) - 1)) : 0; }
  function hash(i) { return (((s.charCodeAt(i) * 2654435761) ^ (s.charCodeAt(i + 1) * 40503) ^ (s.charCodeAt(i + 2) * 2246822519)) >>> 0) & HMASK; }
  function ins(i) { if (i + 2 < n) { var h = hash(i); prev[i] = head[h]; head[h] = i; } }
  var i = 0;
  while (i < n) {
    var bestLen = 0, bestOff = 0;
    if (i + 2 < n) {
      var h = hash(i), cand = head[h], chain = 0, maxLen = Math.min(MAXLEN, n - i);
      while (cand >= 0 && chain++ < MAXCHAIN && (i - cand) <= WIN) {
        if (s.charCodeAt(cand + bestLen) === s.charCodeAt(i + bestLen)) {
          var l = 0; while (l < maxLen && s.charCodeAt(cand + l) === s.charCodeAt(i + l)) l++;
          if (l > bestLen) { bestLen = l; bestOff = i - cand; if (l >= maxLen) break; }
        }
        cand = prev[cand];
      }
    }
    if (bestLen >= 3) {
      put(1, 1);
      var lv = bestLen - 3;
      if (lv < 15) put(lv, 4); else { put(15, 4); lv -= 15; if (lv < 255) put(lv, 8); else { put(255, 8); put(lv - 255, 16); } }
      var ov = bestOff - 1;
      if (ov < 1024) { put(0, 1); put(ov, 10); } else { put(1, 1); put(ov, 17); }
      for (var k = 0; k < bestLen; k++) ins(i + k);
      i += bestLen;
    } else {
      var c = s.charCodeAt(i);
      put(0, 1);
      if (c < 128) { put(0, 1); put(c, 7); } else { put(1, 1); put(c, 16); }
      ins(i); i++;
    }
  }
  if (nb > 0) out.push(String.fromCharCode(32 + ((acc << (15 - nb)) & 0x7FFF)));
  var z = __PLZ_MARK + n.toString(36) + ':' + out.join('');
  return (z.length < n || s.indexOf(__PLZ_MARK) === 0) ? z : s; // kazanç yoksa ham kalır — ama ham metin işaretle başlıyorsa yine paketlenir (çözücü şaşmasın)
}
function __plzDecompress(z) {
  if (!__plzIsPacked(z)) return z;
  var colon = z.indexOf(':', __PLZ_MARK.length); if (colon < 0) throw new Error('PLZ: başlık bozuk');
  var n = parseInt(z.slice(__PLZ_MARK.length, colon), 36); if (!(n >= 0)) throw new Error('PLZ: uzunluk bozuk');
  var p = colon + 1, acc = 0, nb = 0, len = z.length;
  function get(bits) { while (nb < bits) { if (p >= len) throw new Error('PLZ: veri kısa'); acc = ((acc << 15) | (z.charCodeAt(p++) - 32)) >>> 0; nb += 15; } nb -= bits; var v = (acc >>> nb) & ((1 << bits) - 1); acc = nb ? (acc & ((1 << nb) - 1)) : 0; return v; }
  var buf = new Uint16Array(n), o = 0;
  while (o < n) {
    if (get(1) === 1) {
      var l = get(4) + 3; if (l === 18) { var e = get(8); l += e; if (e === 255) l += get(16); }
      var off = (get(1) === 0 ? get(10) : get(17)) + 1;
      if (off > o || o + l > n) throw new Error('PLZ: eşleşme sınır dışı');
      for (var k = 0; k < l; k++) { buf[o] = buf[o - off]; o++; }
    } else {
      buf[o++] = get(1) === 0 ? get(7) : get(16);
    }
  }
  var parts = [], CH = 8192;
  for (var q = 0; q < n; q += CH) parts.push(String.fromCharCode.apply(null, buf.subarray(q, Math.min(n, q + CH))));
  return parts.join('');
}
