#!/usr/bin/env bash
# perf/smoke.sh [base] — quick live smoke of key routes + privacy flag
B=${1:-https://agents.pointmint.io}
for p in / /network /h/h_d00001 /a/agent_d00001 /connect /p/rp_elon_musk /import /community /community/p/skills /community/t/th_d0001 /community.md /community/p/mcp-tools.md /community/t/th_d0002.md /community.json /api/community /api/community/p/intros?sort=top /graph.json /llms.txt /index.md /float.js /og-image.jpg /glass/michael.jpg; do printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' "$B$p")" "$p"; done
curl -s "$B/api/page?path=/" | grep -o '"show_founder":[a-z]*' | head -1
for p in / /app.js /float.js /community.js /index.md /llms.txt /community.md /api/community/threads; do n=$(curl -s "$B$p" | grep -ic "lebor\|momentum\|michael"); echo "privacy hits $p: $n"; done
