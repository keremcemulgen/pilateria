#!/usr/bin/env bash
# PİLATERİA — TAM TEST PAKETİ. Repo kökünden çalıştır:  bash _dev/run-tests.sh
# pilateria.html = CANLI kaynak (SUPABASE_MODE=true). Çalışma kopyaları otomatik üretilir.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 1) jsdom (yoksa /tmp/piltest'e kur)
if [ ! -d /tmp/piltest/node_modules/jsdom ]; then
  echo "jsdom kuruluyor (/tmp/piltest)..."
  mkdir -p /tmp/piltest && (cd /tmp/piltest && npm i jsdom >/dev/null 2>&1)
fi
export NODE_PATH=/tmp/piltest/node_modules

# 2) çalışma kopyaları
cp pilateria.html pilateria-dev.html
sed 's/const SUPABASE_MODE = true;/const SUPABASE_MODE = false;/' pilateria-dev.html > pilateria-dev-false.html
python3 _dev/build-preview.py >/dev/null 2>&1 || echo "  (build-preview uyarı — preview-test atlanabilir)"

# 3) dosya-yönlendirmeli tam paket
FALSE=" auto-sync-test supabase-layer-test "
PREVIEW=" preview-test "
TOTOK=0; TOTFAIL=0; NF=0; PROB=""
for f in _dev/tests/*.js; do
  base="$(basename "$f" .js)"
  case " $FALSE " in *" $base "*) file="pilateria-dev-false.html";; *)
    case " $PREVIEW " in *" $base "*) file="preview.html";; *) file="pilateria-dev.html";; esac;; esac
  if [ "$base" = "smoke-real-data" ] && [ ! -f /tmp/piltest/state.json ]; then
    echo "  ATLA smoke-real-data (gerçek veri fixture'i /tmp/piltest/state.json yok)"; continue
  fi
  out="$(node "$f" "$file" 2>&1)"
  ok="$(echo "$out" | grep -oE '[0-9]+ (gecti|OK)' | grep -oE '[0-9]+' | tail -1)"
  kaldi="$(echo "$out" | grep -oE '[0-9]+ (kaldi|FAIL)' | grep -oE '[0-9]+' | tail -1)"
  crash="$(echo "$out" | grep -cE 'COKTU|TEST HATASI|throw err|ERR_')"
  NF=$((NF+1)); [ -n "$ok" ] && TOTOK=$((TOTOK+ok))
  if { [ -n "$kaldi" ] && [ "$kaldi" -gt 0 ]; } || { [ "$crash" -gt 0 ] && [ -z "$kaldi" ]; }; then
    TOTFAIL=$((TOTFAIL+${kaldi:-1})); PROB="$PROB\n  [$file] $base FAIL=${kaldi:-CRASH}"
  fi
done
echo "======================================"
echo "DOSYA:$NF OK:$TOTOK FAIL:$TOTFAIL"
[ -z "$PROB" ] && echo "TEMIZ (0 FAIL)" || echo -e "SORUNLU:$PROB"
# v106: FAIL varsa cikis kodu 1 — push zincirleri sahte-yesil gecemez
[ "$TOTFAIL" -eq 0 ]
