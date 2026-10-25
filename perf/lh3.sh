#!/usr/bin/env bash
# perf/lh3.sh <label> — 3 Lighthouse mobile runs against agents.pointmint.io, prints each and the median
L=$1; D=$(dirname "$0")/$L; mkdir -p $D
for i in 1 2 3; do CHROME_PATH=/usr/bin/google-chrome launch-tools/node_modules/.bin/lighthouse https://agents.pointmint.io/ --quiet --output=json --output-path=$D/run$i.json --only-categories=performance --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1; done
node -e '
const fs=require("fs"),d=process.argv[1];const r=[1,2,3].map(i=>JSON.parse(fs.readFileSync(d+"/run"+i+".json")));
const row=j=>({score:Math.round(j.categories.performance.score*100),TBT:Math.round(j.audits["total-blocking-time"].numericValue),LCP:+(j.audits["largest-contentful-paint"].numericValue/1000).toFixed(2),FCP:+(j.audits["first-contentful-paint"].numericValue/1000).toFixed(2),SI:+(j.audits["speed-index"].numericValue/1000).toFixed(2),TTI:+((j.audits.interactive?.numericValue||0)/1000).toFixed(1)});
const rows=r.map(row);rows.forEach((x,i)=>console.log("run",i+1,JSON.stringify(x)));const s=[...rows].sort((a,b)=>a.score-b.score);console.log("MEDIAN",JSON.stringify(s[1]));' $D
