#!/usr/bin/env bash
# One-command pre-launch check for the PointMint Agent Network.
#   ./launch-check.sh [base-url]        (default https://agents.pointmint.io)
# Writes launch-checks/<YYYYMMDD-HHMM>/report.md + screenshots. Exit 0 = GO, 1 = NO-GO.
# Env: SKIP_FLOWS=1 (no test accounts), SKIP_LIGHTHOUSE=1, SKIP_CLEANUP=1, CRAWL_MAX=40
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="${1:-https://agents.pointmint.io}"
export PATH="$HOME/.local/node22/bin:$PATH"
STAMP="$(TZ=America/New_York date +%Y%m%d-%H%M)"
OUT="$HERE/launch-checks/$STAMP"; [ -e "$OUT" ] && OUT="$OUT-$(date +%S)"
mkdir -p "$OUT"
if [ ! -d "$HERE/launch-tools/node_modules/axe-core" ] || [ ! -d "$HERE/launch-tools/node_modules/lighthouse" ]; then
  echo "Installing check tools (one-time)…"; (cd "$HERE/launch-tools" && npm i --silent playwright-core@1.64.1 axe-core lighthouse) || exit 2
fi
START=$(date +%s)
node "$HERE/prototype/scripts/launch-check.mjs" "$BASE" "$OUT" 2>&1 | tee "$OUT/console.log"
CODE=${PIPESTATUS[0]}
echo "Total wall time: $(( ($(date +%s)-START)/60 ))m $(( ($(date +%s)-START)%60 ))s  ·  report: $OUT/report.md"
exit $CODE
