import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const out = process.argv[2] || "../public-next/glass";
mkdirSync(out, { recursive: true });
await build({
  entryPoints: ["src/island.jsx"], bundle: true, format: "esm", minify: true, target: "es2020",
  jsx: "automatic", outfile: `${out}/island.js`, define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "eof", logLevel: "info",
});
// CSS the library would have injected inline (CSP-safe external file)
const grab = (f, name) => readFileSync(f, "utf8").match(new RegExp(name + " = `([\\s\\S]*?)`"))[1];
const css = "/* Plasma UI 0.8.0 (MIT) fallback + component CSS */\n" +
  grab("vendor/plasma-ui/src/PlasmaProvider.tsx", "FALLBACK_CSS") + grab("vendor/plasma-ui/src/components/styles.ts", "COMPONENT_CSS");
writeFileSync(`${out}/plasma.css`, css);
console.log("ok");
