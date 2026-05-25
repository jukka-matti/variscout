#!/usr/bin/env bash
# bench-vitest.sh — benchmark vitest pool/DOM variants across slow packages.
# Outputs /tmp/bench-vitest.csv with columns:
#   pkg,variant,run_kind,total_s,env_s,transform_s,import_s,tests_s,pass_count,fail_count,exit_code
#
# Variants (CLI-flag overrides, no config files modified):
#   v0: baseline (no overrides)
#   v1: --pool=threads
#   v2: --pool=threads --environment=happy-dom
#   v3: --pool=threads --environment=happy-dom --no-isolate
#
# Each (pkg, variant) runs 3 times: 1 cold (.vite cache wiped), 2 warm.
# Hard timeout 240s per run.
#
# Usage:
#   bash scripts/bench-vitest.sh                # all 3 packages × 4 variants × 3 runs = 36 runs
#   PACKAGES="charts" bash scripts/bench-vitest.sh   # restrict to one package (smoke test)

set -uo pipefail

CSV="${CSV:-/tmp/bench-vitest.csv}"
PACKAGES="${PACKAGES:-charts hooks ui}"
VARIANTS="${VARIANTS:-v0 v1 v2 v3}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-240}"

# CSV header (overwrite if full run; append if restricted)
if [ "$PACKAGES" = "charts hooks ui" ] && [ "$VARIANTS" = "v0 v1 v2 v3" ]; then
  echo "pkg,variant,run_kind,total_s,env_s,transform_s,import_s,tests_s,pass_count,fail_count,exit_code" > "$CSV"
else
  [ -f "$CSV" ] || echo "pkg,variant,run_kind,total_s,env_s,transform_s,import_s,tests_s,pass_count,fail_count,exit_code" > "$CSV"
fi

variant_flags() {
  case "$1" in
    v0) echo "" ;;
    v1) echo "--pool=threads" ;;
    v2) echo "--pool=threads --environment=happy-dom" ;;
    v3) echo "--pool=threads --environment=happy-dom --no-isolate" ;;
    *) echo "unknown variant: $1" >&2; exit 1 ;;
  esac
}

# Run one vitest invocation with a kill-after timeout, capture output to a temp file.
# Echoes the file path on stdout. Returns vitest's exit code (137 if killed).
run_with_timeout() {
  local pkg="$1" flags="$2"
  local out
  out=$(mktemp)
  (
    pnpm --filter "@variscout/$pkg" test -- --run $flags 2>&1
  ) > "$out" &
  local pid=$!
  ( sleep "$TIMEOUT_SECONDS"; kill -9 $pid 2>/dev/null; pkill -9 -P $pid 2>/dev/null; pkill -9 -f "vitest" 2>/dev/null ) &
  local watcher=$!
  wait $pid
  local rc=$?
  kill $watcher 2>/dev/null
  echo "$out"
  return $rc
}

# Parse vitest log via Python (simpler + more robust than awk chains).
# Echoes CSV-row fragment: total,env,transform,import,tests,pass,fail (all seconds, missing → 0)
parse_log() {
  python3 - "$1" <<'PYEOF'
import re, sys
log = open(sys.argv[1]).read()

def grab(pattern):
    m = re.search(pattern, log)
    if not m:
        return 0.0
    v, unit = float(m.group(1)), m.group(2)
    return v / 1000.0 if unit == 'ms' else v

total = grab(r'Duration\s+([\d.]+)(s|ms)')
transform = grab(r'transform\s+([\d.]+)(ms|s)')
setup_v = grab(r'setup\s+([\d.]+)(ms|s)')
import_v = grab(r'import\s+([\d.]+)(ms|s)')
tests = grab(r'tests\s+([\d.]+)(ms|s)')
env = grab(r'environment\s+([\d.]+)(ms|s)')

# Pass/fail. Lines look like:
#   "Tests   2140 passed (2140)"
#   "Tests   X failed | Y passed (Z)"
#   "Tests   X passed | Y skipped (Z)"
pass_m = re.search(r'Tests\s+.*?(\d+)\s+passed', log)
fail_m = re.search(r'Tests\s+(\d+)\s+failed', log)
pass_count = int(pass_m.group(1)) if pass_m else 0
fail_count = int(fail_m.group(1)) if fail_m else 0

print(f"{total:.2f},{env:.2f},{transform:.2f},{import_v:.2f},{tests:.2f},{pass_count},{fail_count}")
PYEOF
}

# Main loop
echo "==> Benchmarking: packages=[$PACKAGES] variants=[$VARIANTS]"
echo "==> CSV: $CSV"

for pkg in $PACKAGES; do
  for variant in $VARIANTS; do
    flags=$(variant_flags "$variant")
    echo ""
    echo "--- $pkg / $variant (flags: ${flags:-baseline}) ---"

    for run_kind in cold warm-1 warm-2; do
      if [ "$run_kind" = "cold" ]; then
        rm -rf "packages/$pkg/node_modules/.vite"
      fi

      printf "  %s: " "$run_kind"
      log=$(run_with_timeout "$pkg" "$flags")
      rc=$?

      if [ $rc -eq 137 ] || [ $rc -eq 139 ]; then
        echo "TIMEOUT (${TIMEOUT_SECONDS}s)"
        echo "$pkg,$variant,$run_kind,timeout,0,0,0,0,0,0,$rc" >> "$CSV"
      else
        row=$(parse_log "$log")
        echo "$row exit=$rc"
        echo "$pkg,$variant,$run_kind,$row,$rc" >> "$CSV"
      fi
      rm -f "$log"
    done
  done
done

echo ""
echo "==> Done. CSV: $CSV"
echo ""
echo "==> Summary (warm-run median total_s per pkg/variant):"
python3 - <<PYEOF
import csv, statistics
from collections import defaultdict
g = defaultdict(list)
with open("$CSV") as f:
    for r in csv.DictReader(f):
        if r['run_kind'].startswith('warm') and r['total_s'] not in ('timeout', '0', '0.00'):
            try:
                g[(r['pkg'], r['variant'])].append(float(r['total_s']))
            except ValueError:
                pass
print(f"\n{'package':<10}{'v0':>10}{'v1':>10}{'v2':>10}{'v3':>10}")
print("-" * 50)
pkgs = sorted(set(p for p,_ in g.keys()))
for pkg in pkgs:
    row = [pkg]
    for v in ['v0','v1','v2','v3']:
        vals = g.get((pkg, v), [])
        row.append(f"{statistics.median(vals):.1f}s" if vals else "—")
    print(f"{row[0]:<10}{row[1]:>10}{row[2]:>10}{row[3]:>10}{row[4]:>10}")
print()
PYEOF
