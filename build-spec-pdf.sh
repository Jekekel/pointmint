#!/usr/bin/env bash
# SPEC.md -> HTML (python-markdown) -> PDF (headless Chrome). Usage: ./build-spec-pdf.sh
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; TMP="$(mktemp -d)"
python3 - "$HERE/SPEC.md" "$TMP/spec.html" <<'PY'
import markdown, re, sys
src = open(sys.argv[1]).read()
title = re.search(r'^# (.+)$', src, re.M).group(1).replace(' — Product Spec', ' Spec')
out = []
for l in src.split('\n'):
    if re.match(r'^(\s*)([-*]|\d+\.) ', l) and out and out[-1].strip() and not re.match(r'^(\s*)([-*]|\d+\.) ', out[-1]) and not out[-1].startswith('|') and not out[-1].startswith('    '):
        out.append('')
    out.append(l)
html = markdown.markdown('\n'.join(out), extensions=['tables', 'fenced_code', 'sane_lists'])
css = '''@page{size:Letter;margin:0.7in 0.65in}
body{font-family:-apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:10.5pt;line-height:1.5;color:#111}
h1{font-size:21pt;margin:0 0 10pt}h2{font-size:14.5pt;margin:20pt 0 8pt;page-break-after:avoid}h3{font-size:12pt;margin:14pt 0 6pt;page-break-after:avoid}
hr{border:0;border-top:1px solid #ddd;margin:16pt 0}
code{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:8.6pt;background:#f3f3f3;padding:1px 3px;border-radius:3px}
pre{background:#f6f6f6;padding:9pt 11pt;border-radius:5px;font-size:8.2pt;line-height:1.4;white-space:pre-wrap;page-break-inside:avoid}pre code{background:none;padding:0}
blockquote{margin:10pt 0;padding:4pt 12pt;border-left:3px solid #ccc;color:#333;background:#fafafa}
table{border-collapse:collapse;width:100%;margin:8pt 0;font-size:8.8pt}tr{page-break-inside:avoid}
th,td{border:1px solid #ddd;padding:4pt 6pt;text-align:left;vertical-align:top}th{background:#f2f2f2}
li{margin:2pt 0}'''
open(sys.argv[2], 'w').write(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{title}</title><style>{css}</style></head><body>{html}</body></html>')
PY
google-chrome --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$HERE/PointMint-Agent-Network-Spec.pdf" "file://$TMP/spec.html" 2>/dev/null
pdfinfo "$HERE/PointMint-Agent-Network-Spec.pdf" | grep -E "Title|Pages"
