---
tier: ephemeral
purpose: build
title: 'Vitest Pool Config Tuning — Implementation Plan'
audience: human
category: implementation
status: active
date: 2026-05-25
related: [testing, vitest, pool, happy-dom, jsdom]
layer: spec
---

# Vitest Pool Config Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land a 2x dev-loop improvement on the 3 slow jsdom packages (charts, hooks, ui) by benchmarking 4 vitest pool/DOM variants and adopting the winner per package.

**Architecture:** Build a thin shell-script benchmark harness that runs each `(package, variant)` × 3 (1 cold, 2 warm) via vitest CLI flag overrides (`--pool`, `--environment`, `--no-isolate`) — no `vitest.config.ts` mutation needed during benchmarking. After CSV analysis, apply the chosen variant per package as a config edit, then ship as one PR with 3 commits inside.

**Tech Stack:** Bash, vitest 4.1.7 CLI, pnpm 9 + turbo 2.9, happy-dom (to be added as root devDep if benchmark adopts V2), jsdom (current).

**Spec:** `docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md` (committed as `3690d73f`).

---

## File Structure

| File                                                             | Action               | Purpose                                                                       |
| ---------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------- |
| `scripts/bench-vitest.sh`                                        | CREATE               | Benchmark harness — runs all variants via CLI flags, writes CSV               |
| `package.json` (root)                                            | MODIFY (conditional) | Add `happy-dom` to devDependencies if V2 wins anywhere                        |
| `packages/charts/vitest.config.ts`                               | MODIFY (conditional) | Apply chosen variant for charts                                               |
| `packages/hooks/vitest.config.ts`                                | MODIFY (conditional) | Apply chosen variant for hooks                                                |
| `packages/ui/vitest.config.ts`                                   | MODIFY (conditional) | Apply chosen variant for ui                                                   |
| `docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md` | MODIFY               | Fill in "Outcomes" section with benchmark table + adoption decisions          |
| `packages/hooks/CLAUDE.md`                                       | MODIFY (conditional) | Retire flaky-test-watch note IF 5 consecutive clean turbo runs after adoption |

The harness itself (`scripts/bench-vitest.sh`) is the only new file. All others are targeted modifications.

---

## Task 1: Branch + happy-dom prep + benchmark harness

**Files:**

- Create: `scripts/bench-vitest.sh`
- Modify (conditional): `package.json` (root)

- [ ] **Step 1.1: Create branch from main**

```bash
git checkout main
git pull --ff-only
git checkout -b perf/vitest-pool-tuning
```

Expected: on new branch, working tree clean.

- [ ] **Step 1.2: Verify or add happy-dom as root devDep**

happy-dom is needed for variants V2 and V3. It currently appears in `pnpm-lock.yaml` only as a transitive peer; not declared in our `package.json`. Vitest's `--environment happy-dom` flag will fail without an explicit dep.

```bash
grep -E '"happy-dom"' package.json && echo "already declared" || pnpm add -D -w happy-dom
```

Expected: either prints "already declared" OR runs install. Then verify:

```bash
node -e "require('happy-dom')" && echo "resolvable"
```

Expected: `resolvable`.

- [ ] **Step 1.3: Write the benchmark harness**

Create `scripts/bench-vitest.sh` with this exact content:

```bash
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

# CSV header (overwrite if PACKAGES is full set; append if restricted)
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
# Returns the file path on stdout. Sets exit code in $? (139 if timed out).
run_with_timeout() {
  local pkg="$1" flags="$2"
  local out
  out=$(mktemp)
  (
    pnpm --filter "@variscout/$pkg" test -- --run $flags 2>&1
  ) > "$out" &
  local pid=$!
  ( sleep "$TIMEOUT_SECONDS"; kill -9 $pid 2>/dev/null; pkill -9 -P $pid 2>/dev/null ) &
  local watcher=$!
  wait $pid
  local rc=$?
  kill $watcher 2>/dev/null
  echo "$out"
  return $rc
}

# Parse a vitest log file. Echoes CSV-row fragment: total,env,transform,import,tests,pass,fail
# All numeric values in seconds. Missing values default to 0.
parse_log() {
  local log="$1"
  # Match the "Duration NNN.NNs (transform Xs, setup Ys, import Zs, tests Ws, environment Es)" line
  local dur_line
  dur_line=$(grep -E "^\s+Duration\s+" "$log" | tail -1)
  local total transform setup import tests env
  total=$(echo "$dur_line" | grep -oE 'Duration\s+[0-9.]+s' | grep -oE '[0-9.]+' | head -1)
  transform=$(echo "$dur_line" | grep -oE 'transform\s+[0-9.]+(ms|s)' | head -1 | { read v; echo "${v#transform }"; } | sed 's/ms$//' | awk '{ if ($0 ~ /s$/) { sub("s$",""); print $0+0 } else { print $0/1000 } }' 2>/dev/null)
  setup=$(echo "$dur_line" | grep -oE 'setup\s+[0-9.]+(ms|s)' | head -1 | { read v; echo "${v#setup }"; } | sed 's/ms$//' | awk '{ if ($0 ~ /s$/) { sub("s$",""); print $0+0 } else { print $0/1000 } }' 2>/dev/null)
  import=$(echo "$dur_line" | grep -oE 'import\s+[0-9.]+(ms|s)' | head -1 | { read v; echo "${v#import }"; } | sed 's/ms$//' | awk '{ if ($0 ~ /s$/) { sub("s$",""); print $0+0 } else { print $0/1000 } }' 2>/dev/null)
  tests=$(echo "$dur_line" | grep -oE 'tests\s+[0-9.]+(ms|s)' | head -1 | { read v; echo "${v#tests }"; } | sed 's/ms$//' | awk '{ if ($0 ~ /s$/) { sub("s$",""); print $0+0 } else { print $0/1000 } }' 2>/dev/null)
  env=$(echo "$dur_line" | grep -oE 'environment\s+[0-9.]+(ms|s)' | head -1 | { read v; echo "${v#environment }"; } | sed 's/ms$//' | awk '{ if ($0 ~ /s$/) { sub("s$",""); print $0+0 } else { print $0/1000 } }' 2>/dev/null)
  # Pass/fail counts: "Tests  N passed (M)" or "Tests  X failed | Y passed (Z)"
  local pass fail
  pass=$(grep -oE 'Tests\s+([0-9]+\s+failed\s+\|\s+)?[0-9]+\s+passed' "$log" | tail -1 | grep -oE '[0-9]+\s+passed' | grep -oE '[0-9]+' || echo 0)
  fail=$(grep -oE 'Tests\s+[0-9]+\s+failed' "$log" | tail -1 | grep -oE '[0-9]+' || echo 0)
  printf "%s,%s,%s,%s,%s,%s,%s\n" "${total:-0}" "${env:-0}" "${transform:-0}" "${import:-0}" "${tests:-0}" "${pass:-0}" "${fail:-0}"
}

# Main loop
echo "==> Benchmarking: packages=[$PACKAGES] variants=[$VARIANTS]"
for pkg in $PACKAGES; do
  for variant in $VARIANTS; do
    flags=$(variant_flags "$variant")
    echo ""
    echo "--- $pkg / $variant (flags: ${flags:-baseline}) ---"

    for run_kind in cold warm-1 warm-2; do
      # Cold run wipes the vite cache for THIS package
      if [ "$run_kind" = "cold" ]; then
        rm -rf "packages/$pkg/node_modules/.vite"
      fi

      printf "  %s: " "$run_kind"
      log=$(run_with_timeout "$pkg" "$flags")
      rc=$?

      if [ $rc -eq 139 ] || [ $rc -eq 137 ]; then
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
python3 - <<'PYEOF'
import csv, statistics, sys
from collections import defaultdict
rows = []
with open("/tmp/bench-vitest.csv") as f:
    rows = list(csv.DictReader(f))
grouped = defaultdict(list)
for r in rows:
    if r['run_kind'].startswith('warm') and r['total_s'] != 'timeout':
        try:
            grouped[(r['pkg'], r['variant'])].append(float(r['total_s']))
        except ValueError:
            pass
print(f"\n{'package':<10} {'variant':<5} {'warm median (s)':>16} {'pass':>6} {'fail':>6}")
print("-" * 50)
pkgs = sorted(set(p for p,_ in grouped.keys()))
for pkg in pkgs:
    for variant in ['v0', 'v1', 'v2', 'v3']:
        key = (pkg, variant)
        if key in grouped:
            med = statistics.median(grouped[key])
            # Most-recent pass/fail (warm-2 if available)
            recent = [r for r in rows if r['pkg']==pkg and r['variant']==variant and r['run_kind']!='cold']
            recent = recent[-1] if recent else {'pass_count':'?','fail_count':'?'}
            print(f"{pkg:<10} {variant:<5} {med:>16.2f} {recent['pass_count']:>6} {recent['fail_count']:>6}")
    print()
PYEOF
```

- [ ] **Step 1.4: Make it executable + commit**

```bash
chmod +x scripts/bench-vitest.sh
git add scripts/bench-vitest.sh package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore(bench): add vitest pool/DOM variant benchmark harness

scripts/bench-vitest.sh runs each (package, variant) × 3 (1 cold, 2
warm) via vitest CLI flag overrides (--pool, --environment,
--no-isolate) — no vitest.config.ts mutation during benchmarking. CSV
output at /tmp/bench-vitest.csv; summary table to stdout.

Variants per spec docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md:
- v0 baseline (forks + jsdom)
- v1 threads + jsdom
- v2 threads + happy-dom
- v3 threads + happy-dom + no-isolate

happy-dom added as root devDep so --environment=happy-dom resolves.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: clean commit, pre-commit hook passes.

---

## Task 2: Smoke-test the harness on `@variscout/charts` only

**Files:** none modified.

- [ ] **Step 2.1: Run harness restricted to charts**

```bash
PACKAGES="charts" bash scripts/bench-vitest.sh
```

Expected output: 4 variants × 3 runs = 12 lines of progress, then a summary table with 4 rows for `charts`. Total wall-clock ~5-8 min (charts is the smallest jsdom package, ~30s per warm run × 12 runs).

- [ ] **Step 2.2: Sanity-check the CSV**

```bash
wc -l /tmp/bench-vitest.csv  # expect 13 (1 header + 12 data rows)
head /tmp/bench-vitest.csv
```

Expected:

- 13 lines total.
- Header row first.
- All 12 data rows have non-zero `total_s` (or `timeout` if a variant deadlocked).
- `pass_count` should be ~170 for charts on all variants (matches baseline test count).
- `fail_count` should be 0 for v0 and v1 (jsdom); may be non-zero for v2/v3 (happy-dom edge cases).

- [ ] **Step 2.3: If v2 (happy-dom) fails for charts, log the count + sample errors**

If `fail_count` is non-zero for v2:

```bash
PACKAGES="charts" VARIANTS="v2" CSV=/tmp/bench-vitest-debug.csv bash scripts/bench-vitest.sh 2>&1 | tee /tmp/bench-v2-charts.log
grep -A2 "FAIL" /tmp/bench-v2-charts.log | head -30
```

This gives a sample of the happy-dom failures to inform the adoption decision in Task 4. No commit needed for this debug pass.

- [ ] **Step 2.4: No commit — Task 2 is verification only**

Confirmed harness works. Moving to full run.

---

## Task 3: Full benchmark run (all 3 packages × 4 variants × 3 runs)

**Files:** none modified.

- [ ] **Step 3.1: Run the full benchmark in foreground (long-running)**

```bash
bash scripts/bench-vitest.sh 2>&1 | tee /tmp/bench-vitest-full.log
```

Expected wall-clock: ~30-45 min (charts ~5 min + hooks ~15 min + ui ~20 min, varies by variant — v3/no-isolate may be 2-3x faster, v0 baseline slowest).

This is the ONE long-running step. If executing inline, leave the terminal alone. If using subagent-driven, dispatch this as its own task with extended timeout.

- [ ] **Step 3.2: Verify the full CSV**

```bash
wc -l /tmp/bench-vitest.csv  # expect 37 (1 header + 36 data rows)
tail -40 /tmp/bench-vitest.csv
```

Expected:

- 37 lines total.
- 36 data rows: `charts/hooks/ui` × `v0/v1/v2/v3` × `cold/warm-1/warm-2`.
- The summary table printed at end of stdout (last 20 lines of `/tmp/bench-vitest-full.log`).

- [ ] **Step 3.3: Archive the raw CSV alongside the spec**

```bash
mkdir -p docs/superpowers/specs/2026-05-25-vitest-pool-config/
cp /tmp/bench-vitest.csv docs/superpowers/specs/2026-05-25-vitest-pool-config/bench-vitest.csv
git add docs/superpowers/specs/2026-05-25-vitest-pool-config/bench-vitest.csv
git commit -m "$(cat <<'EOF'
data(bench): raw vitest pool variant measurements (charts/hooks/ui)

36 measurements (3 pkgs × 4 variants × 3 runs). See
docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md
"Outcomes" section for analysis + adoption decisions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: CSV archived to the repo for posterity.

---

## Task 4: Analyze CSV + decide adoptions + update spec "Outcomes"

**Files:**

- Modify: `docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md` (the "Outcomes" section template)

- [ ] **Step 4.1: Extract warm-run medians**

```bash
python3 << 'PYEOF'
import csv, statistics
from collections import defaultdict
g = defaultdict(list)
with open("/tmp/bench-vitest.csv") as f:
    for r in csv.DictReader(f):
        if r['run_kind'].startswith('warm') and r['total_s'] not in ('timeout', '0'):
            g[(r['pkg'], r['variant'])].append(float(r['total_s']))
print(f"{'pkg':<10}{'v0':>8}{'v1':>8}{'v2':>8}{'v3':>8}")
for pkg in ['charts', 'hooks', 'ui']:
    row = [pkg]
    for v in ['v0','v1','v2','v3']:
        vals = g.get((pkg, v), [])
        row.append(f"{statistics.median(vals):.1f}s" if vals else "N/A")
    print(f"{row[0]:<10}{row[1]:>8}{row[2]:>8}{row[3]:>8}{row[4]:>8}")
PYEOF
```

Expected: a 3-row, 4-column table of warm-run medians in seconds. Save the output — it goes into the spec.

- [ ] **Step 4.2: Apply adoption decision rules per package**

For each of `charts`, `hooks`, `ui`:

1. Compute `(v0 - vN) / v0` for N in {1, 2, 3} — the relative speedup.
2. Apply the decision rules from spec "Adoption decision rules":
   - <30% on all → ship nothing for that package
   - 30-80% on v1 → adopt v1
   - ≥80% on v2 AND fail_count == 0 → adopt v2
   - ≥80% on v2 AND fail_count ≤ 5 → triage failures; if all are happy-dom edge cases (selector/focus), patch + adopt v2
   - ≥80% on v2 AND fail_count > 5 → fall back to v1
   - ≥150% on v3 with zero fails → DO NOT adopt; log as follow-up investigation

Write the decision per package (variant + reason) into a scratchpad. You'll paste into the spec next.

- [ ] **Step 4.3: Fill in the spec "Outcomes" section**

Replace the template "Outcomes" section in `docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md` with actual data. Find this block:

```markdown
## Outcomes (populated after B1 benchmark)

_To be filled in by the implementer after running `scripts/bench-vitest.sh`. Template:_

**Baseline pr-ready-check timing (main, pre-tuning):** _<seconds>_

**Per-package benchmark (warm-run median):**

| Package             | Baseline | V1  | V2  | V3  | Adopted |
| ------------------- | -------- | --- | --- | --- | ------- |
| `@variscout/charts` | —        | —   | —   | —   | —       |
| `@variscout/hooks`  | —        | —   | —   | —   | —       |
| `@variscout/ui`     | —        | —   | —   | —   | —       |

**Post-tuning pr-ready-check timing:** _<seconds>_ _(target: ≥30% improvement on the slow-package portion)_

**Cross-package consistency:** _<all packages on same variant, or per-package divergence reasons>_

**Retired flaky-test note in `packages/hooks/CLAUDE.md`:** _<yes/no — gated on 5 consecutive turbo runs with no flakes>_
```

Replace with:

```markdown
## Outcomes

**Baseline pr-ready-check timing (main, pre-tuning):** _[run `bash scripts/pr-ready-check.sh` on main once, paste total seconds from `time` output here]_

**Per-package benchmark (warm-run median, seconds):**

| Package             | V0 (baseline) | V1 (threads) | V2 (+happy-dom) | V3 (+no-isolate) | Adopted     | Reason              |
| ------------------- | ------------- | ------------ | --------------- | ---------------- | ----------- | ------------------- |
| `@variscout/charts` | _<v0>_        | _<v1>_       | _<v2>_          | _<v3>_           | _<variant>_ | _<one-line reason>_ |
| `@variscout/hooks`  | _<v0>_        | _<v1>_       | _<v2>_          | _<v3>_           | _<variant>_ | _<one-line reason>_ |
| `@variscout/ui`     | _<v0>_        | _<v1>_       | _<v2>_          | _<v3>_           | _<variant>_ | _<one-line reason>_ |

Raw measurements: `docs/superpowers/specs/2026-05-25-vitest-pool-config/bench-vitest.csv`.

**Post-tuning pr-ready-check timing:** _<deferred to Task 8 — capture after configs apply>_

**Cross-package consistency:** _<describe: all packages adopted same variant, or note per-package divergence reasons>_

**Retired flaky-test note in `packages/hooks/CLAUDE.md`:** _<deferred to Task 9 — gated on 5 consecutive turbo runs with no flakes>_

**V3 follow-up (if applicable):** _<if V3 showed dramatic wins anywhere, note here and open investigation card; otherwise: "V3 did not beat V2 enough to warrant the isolate:false safety tradeoff">_
```

Fill in the `_<...>_` placeholders with actual data from Step 4.1 + the adoption decisions from Step 4.2.

- [ ] **Step 4.4: Commit the spec update**

```bash
git add docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md
git commit -m "$(cat <<'EOF'
docs(spec): fill in vitest pool benchmark outcomes + adoption decisions

Benchmark complete (36 runs). Adoption per-package:
- charts: <variant> (<reason>)
- hooks:  <variant> (<reason>)
- ui:     <variant> (<reason>)

Cross-package consistency: <one-line summary>.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Replace `<variant>` and `<reason>` placeholders in the commit message with actual values before committing.

---

## Task 5: Apply config to `@variscout/charts` (lowest-risk package first)

**Files:**

- Modify: `packages/charts/vitest.config.ts`

Adoption variant for charts: **{whichever Task 4 decided — V1 means `pool: 'threads'` only; V2 means `pool: 'threads'` + `environment: 'happy-dom'`}**.

- [ ] **Step 5.1: Edit the config**

If adopted V1, change `packages/charts/vitest.config.ts` from:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 63,
        branches: 56,
        functions: 75,
      },
    },
  },
});
```

To:

```ts
import { defineConfig } from 'vitest/config';

// pool: 'threads' tuning — see docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../test/setup.ts'],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 63,
        branches: 56,
        functions: 75,
      },
    },
  },
});
```

If adopted V2, change `environment: 'jsdom'` → `environment: 'happy-dom'` AND add `pool: 'threads'` AND update the comment to `// pool: 'threads' + happy-dom tuning — see ...`.

If Task 4 decided no adoption for charts, skip Task 5 entirely.

- [ ] **Step 5.2: Run charts test suite once — confirm pass**

```bash
pnpm --filter @variscout/charts test -- --run
```

Expected: all 170 (or current count) tests pass, no errors.

- [ ] **Step 5.3: Run charts test suite 4 more times — confirm no flakes**

```bash
for i in 1 2 3 4; do
  echo "=== Run $i ==="
  pnpm --filter @variscout/charts test -- --run || { echo "FLAKE on run $i"; break; }
done
```

Expected: all 4 runs pass identically. If ANY run fails (and it passed in Step 5.2), revert the config edit and fall back to a more conservative variant (V2 → V1, V1 → no adoption); restart Task 5 with the fallback choice.

- [ ] **Step 5.4: Run charts build — confirm tsc still happy**

```bash
pnpm --filter @variscout/charts build
```

Expected: build completes without errors. (This catches edge cases where happy-dom types leak into prod code via `vitest/globals`.)

- [ ] **Step 5.5: Commit**

```bash
git add packages/charts/vitest.config.ts
git commit -m "$(cat <<'EOF'
perf(test): tune @variscout/charts vitest pool config

Adopted <V1/V2> per benchmark (see
docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md
Outcomes). Charts warm-run median: <v0_seconds>s → <adopted_seconds>s
(<percent>% faster).

Verification: 5 consecutive clean test runs + build green.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Replace `<V1/V2>`, `<v0_seconds>`, `<adopted_seconds>`, `<percent>` with actual values from the spec Outcomes table.

---

## Task 6: Apply config to `@variscout/hooks`

**Files:**

- Modify: `packages/hooks/vitest.config.ts`

Same pattern as Task 5 — substitute `hooks` for `charts` everywhere, apply the variant Task 4 chose for hooks.

Current `packages/hooks/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../test/setup.ts', './src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 68,
        branches: 53,
        functions: 78,
      },
    },
  },
});
```

- [ ] **Step 6.1: Edit config** — same template as Step 5.1, with the hooks-specific coverage thresholds preserved.

- [ ] **Step 6.2: Single test run**

```bash
pnpm --filter @variscout/hooks test -- --run
```

Expected: all 1213 (or current count) tests pass.

- [ ] **Step 6.3: 4 more runs — no flakes**

```bash
for i in 1 2 3 4; do
  echo "=== Run $i ==="
  pnpm --filter @variscout/hooks test -- --run || { echo "FLAKE on run $i"; break; }
done
```

Hooks is the package with the historical "flaky test watch" note (`packages/hooks/CLAUDE.md`). This 5x run is the gate.

- [ ] **Step 6.4: Build check**

```bash
pnpm --filter @variscout/hooks build
```

- [ ] **Step 6.5: Commit** — same template as Step 5.5 with `hooks` substituted.

---

## Task 7: Apply config to `@variscout/ui` (highest-risk — biggest test suite)

**Files:**

- Modify: `packages/ui/vitest.config.ts`

Current `packages/ui/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../../test/setup.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 57,
        branches: 55,
        functions: 52,
      },
    },
  },
});
```

Note: this one has `plugins: [react()]` — keep it.

- [ ] **Step 7.1: Edit config** — preserve `plugins: [react()]` and `exclude:`; add `pool: 'threads'` and (if V2) change `environment` to `happy-dom`.

- [ ] **Step 7.2: Single test run**

```bash
pnpm --filter @variscout/ui test -- --run
```

Expected: all 2140 (or current count) tests pass. This is the package with the Canvas.test.tsx history (PR #206) — extra attention here.

- [ ] **Step 7.3: 4 more runs — no flakes**

```bash
for i in 1 2 3 4; do
  echo "=== Run $i ==="
  pnpm --filter @variscout/ui test -- --run || { echo "FLAKE on run $i"; break; }
done
```

If Canvas.test.tsx or any other heavily-mocked file flakes, fall back to V1 (or no adoption). Document the divergence reason in the spec Outcomes.

- [ ] **Step 7.4: Build check**

```bash
pnpm --filter @variscout/ui build
```

- [ ] **Step 7.5: Commit** — same template as Step 5.5 with `ui` substituted.

---

## Task 8: Whole-branch verification

**Files:** none modified (verification step only).

- [ ] **Step 8.1: Full monorepo build**

```bash
pnpm build
```

Expected: all 5 builds (charts, hooks, ui, pwa, docs) green. (Reminder: `docs` build was unblocked by the earlier PR #207 sidebar fix.)

- [ ] **Step 8.2: pr-ready-check end-to-end — time it**

```bash
time bash scripts/pr-ready-check.sh 2>&1 | tee /tmp/pr-ready-final.log
```

Expected: `✓ All checks passed — PR is ready to merge.` Note the total wall-clock time.

- [ ] **Step 8.3: Capture before/after for the PR description**

```bash
echo "Baseline (main, pre-tuning): <SECONDS from spec Outcomes>"
echo "Post-tuning (this branch): $(grep 'real' /tmp/pr-ready-final.log || grep 'total' /tmp/pr-ready-final.log)"
```

Compute the percent improvement. This is the headline number for the PR description in Task 10.

---

## Task 9: PR-prep — update spec + maybe retire flaky note

**Files:**

- Modify: `docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md` (fill in remaining `_<deferred>_` fields)
- Modify (conditional): `packages/hooks/CLAUDE.md` (only if hooks had 5 clean runs in Task 6 AND under turbo too)

- [ ] **Step 9.1: Update spec "Outcomes" with post-tuning numbers**

Replace `_<deferred to Task 8>_` placeholders with actual numbers from Step 8.3. Replace `_<deferred to Task 9>_` placeholders with actual decisions.

- [ ] **Step 9.2: Decide if the hooks flaky-watch note can retire**

The note in `packages/hooks/CLAUDE.md` says: _"Flaky test watch: `packages/hooks/src/__tests__/index.test.ts` can timeout under concurrent Turbo load; passes when run alone."_

Retire it ONLY if BOTH:

- Task 6 Step 6.3 had 5 consecutive clean runs (isolated, no turbo)
- 3 consecutive clean turbo runs of the full pr-ready-check.sh (Task 8 was the first; run 2 more):

```bash
for i in 2 3; do
  echo "=== Turbo run $i ==="
  time bash scripts/pr-ready-check.sh > /tmp/turbo-run-$i.log 2>&1 || { echo "FLAKE on turbo run $i — DO NOT retire note"; break; }
done
```

If all 3 are green: edit `packages/hooks/CLAUDE.md` and delete the bullet starting `- Flaky test watch:` from the Invariants section.

If ANY flake: keep the note + update spec Outcomes to say "Retired flaky note: NO — flake observed on turbo run N".

- [ ] **Step 9.3: Commit pre-PR doc updates**

```bash
git add docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md packages/hooks/CLAUDE.md
git diff --cached --stat
git commit -m "$(cat <<'EOF'
docs: finalize vitest pool tuning outcomes + retire flaky note

Spec "Outcomes" now reflects post-tuning pr-ready-check timing
(<baseline>s → <final>s, <percent>% faster).

<INCLUDE IF NOTE RETIRED:>
@variscout/hooks/CLAUDE.md "Flaky test watch" note retired after
5 isolated + 3 turbo consecutive clean runs of
packages/hooks/src/__tests__/index.test.ts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Replace `<baseline>`, `<final>`, `<percent>` placeholders. Remove the `<INCLUDE IF NOTE RETIRED:>` block if the note stayed.

---

## Task 10: Push + create PR + Opus review + merge

**Files:** none modified (workflow step only).

- [ ] **Step 10.1: Push the branch**

```bash
git push -u origin perf/vitest-pool-tuning
```

Expected: push succeeds (pre-push hook runs `pr-ready-check` style checks — should be green from Task 8/9).

- [ ] **Step 10.2: Create the PR**

```bash
gh pr create --title "perf(test): tune vitest pool config — <percent>% faster pr-ready-check" --body "$(cat <<'EOF'
## Summary

Tuned vitest pool config across the 3 slow jsdom packages (charts, hooks, ui) per benchmark in `docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md`. **`pr-ready-check.sh` is now `<baseline>s → <final>s` (`<percent>% faster`)** locally.

## What changed

- `scripts/bench-vitest.sh` — new benchmark harness (kept in repo for future tuning rounds)
- `packages/charts/vitest.config.ts` — adopted `<variant>`
- `packages/hooks/vitest.config.ts` — adopted `<variant>`
- `packages/ui/vitest.config.ts` — adopted `<variant>`
- `package.json` — `happy-dom` added as root devDep (only if V2 was adopted anywhere)
- `docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md` — spec "Outcomes" filled in with benchmark table + adoption reasoning
- `docs/superpowers/specs/2026-05-25-vitest-pool-config/bench-vitest.csv` — raw 36-measurement CSV archived
- `packages/hooks/CLAUDE.md` — flaky-watch note retired (only if applicable)

## Benchmark results

| Package | V0 baseline | V1 threads | V2 +happy-dom | V3 +no-isolate | Adopted |
| --- | --- | --- | --- | --- | --- |
| charts | <…> | <…> | <…> | <…> | <…> |
| hooks | <…> | <…> | <…> | <…> | <…> |
| ui | <…> | <…> | <…> | <…> | <…> |

(Warm-run median in seconds. Raw CSV in the spec dir.)

## Verification

- Per-package: each suite ran 5 consecutive clean times (no flakes) + build green
- Whole-branch: `pnpm build` green, `bash scripts/pr-ready-check.sh` green (`<final>s` wall-clock, vs `<baseline>s` on main)
- Opus code-reviewer subagent dispatched per `feedback_subagent_driven_default`

## Out of scope (tracked in spec)

- `apps/azure` + `apps/pwa` tuning — they have explicit `fileParallelism: false` with unknown rationale; deferred to a follow-up after `git blame` archaeology
- Vitest Projects migration (Tier 2 in investigations.md)

## Test plan

- [x] All 5 packages build
- [x] pr-ready-check green
- [x] 5 consecutive isolated runs of each tuned package — no flakes
- [ ] Opus reviewer green

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Replace all `<...>` placeholders with actual values from Tasks 4 + 8 + 9.

- [ ] **Step 10.3: Dispatch Opus code-reviewer subagent**

Use the `Agent` tool with `subagent_type: 'feature-dev:code-reviewer'`, `model: 'opus'`. Prompt template:

```
You are reviewing PR <PR#> on branch `perf/vitest-pool-tuning`.

STEP 0 (mandatory):
  git fetch origin
  git checkout perf/vitest-pool-tuning
  git branch --show-current        # must echo: perf/vitest-pool-tuning
  git log --oneline -6             # confirm: bench harness commit + 3 per-package config commits + spec/CLAUDE.md commits

Context:
- Spec: docs/superpowers/specs/2026-05-25-vitest-pool-config-design.md (filled-in Outcomes section)
- Benchmark CSV: docs/superpowers/specs/2026-05-25-vitest-pool-config/bench-vitest.csv
- Adoption decisions land per-package in vitest.config.ts files; each guarded by 5 consecutive clean runs + build green
- happy-dom (if used) added as root devDep
- Out of scope: apps/azure + apps/pwa (deferred per spec)

What I want:
1. Confirm the per-package config changes match what the spec Outcomes table says was adopted.
2. Check that each config change preserves existing settings (coverage thresholds, plugins, exclude lists, setupFiles). Only pool/environment should change.
3. Sanity-check that the bench-vitest.sh script doesn't have any leftover debug/hardcoded paths and matches what's described in the spec.
4. Flag if any test files in packages/{charts,hooks,ui}/src/**/__tests__ were modified to accommodate happy-dom (the spec allows ≤5 narrow patches but reviewer should sanity-check they're truly happy-dom edge cases, not test-quality regressions).
5. Confirm package.json (root) has happy-dom in devDependencies if V2 was adopted anywhere.

Verified locally:
- pnpm build green
- bash scripts/pr-ready-check.sh green (<final>s vs <baseline>s baseline)
- 5 consecutive clean isolated runs per tuned package

Report only blockers + important findings. Under 300 words. End with "READY TO MERGE", "NEEDS CHANGES", or "BLOCKED — see findings".
```

- [ ] **Step 10.4: Address reviewer feedback (if any)**

If reviewer flags blockers, fix on the branch and force-push the corrected commits. Re-dispatch the reviewer for confirmation. Do NOT bypass via `gh pr merge --admin`.

- [ ] **Step 10.5: Squash-merge**

```bash
gh pr merge --squash --delete-branch
```

Expected: branch merged to main, local branch deleted (next `git fetch` will sync).

- [ ] **Step 10.6: Verify on main**

```bash
git checkout main
git pull --ff-only
git log --oneline -2
time bash scripts/pr-ready-check.sh > /tmp/pr-ready-postmerge.log 2>&1
tail -3 /tmp/pr-ready-postmerge.log
```

Expected: `pr-ready-check` green on main, wall-clock matches what was measured on the branch (within ±10s).

---

## Notes for the implementer

- **The CLI-flag-based benchmarking** in Task 1 is a simplification over what the spec describes (the spec talks about mutating config files; using `--pool` / `--environment` / `--no-isolate` CLI flags is equivalent and safer because it doesn't touch source files mid-benchmark). The spec's `## Benchmark harness` section is the original intent; this plan uses the cleaner approach.
- **If happy-dom isn't installed** (`Cannot find package 'happy-dom'`) when v2/v3 variants run, the harness will fail those rows. Task 1 Step 1.2 pre-installs it; if you skip that step, expect failures.
- **`--no-isolate` may reveal hidden test coupling** in v3 runs. Test failures in v3 are EXPECTED and don't block adoption of v1/v2. The adoption rules in spec section "Adoption decision rules" intentionally don't ship v3 by default.
- **If a package shows no win ≥30%**, ship nothing for that package and document under spec Outcomes. The plan's per-package tasks (5/6/7) are skippable individually.
- **Rollback** is per-package: each `vitest.config.ts` is 2-line revert. Keep that surgical.
