// PointMint liquid-glass island: upgrades the landing hero's [data-glass] blocks
// into Plasma UI surfaces (WebGL). Loaded only on desktop + WebGL2 + motion OK.
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { PlasmaProvider, Plasma, usePlasmaRuntime } from "../vendor/plasma-ui/src/index";

// Background moods: [deep base, mid tone, accent]
export const THEMES = {
  lumen: {
    mood: { colors: ["#020d14", "#0b4f57", "#3a52c9"], blend: 44, spring: { stiffness: 170, damping: 15 } },
    rimColor: "iridescent", tint: "#ffffff", opacity: 0, frost: 0.18,
    hero: { tint: "#00a08c", opacity: 0.16 },
  },
  neon: {
    mood: { colors: ["#0a0414", "#4b1677", "#ff2d95"], blend: 44, spring: { stiffness: 230, damping: 17 } },
    rimColor: "#ff4fb0", tint: "#160b1e", opacity: 0.35, frost: 0.22,
    hero: { tint: "#00a08c", opacity: 0.2 },
  },
  entropy: {
    mood: { colors: ["#060803", "#3b4613", "#8cf23a"], blend: 44, spring: { stiffness: 130, damping: 12 } },
    rimColor: "iridescent", tint: "#ffffff", opacity: 0, frost: 0.25,
    hero: { tint: "#00a08c", opacity: 0.18 },
  },
};

const ATTR_MAP = { class: "className", tabindex: "tabIndex", for: "htmlFor" };
function propsFromEl(el) {
  const p = {};
  for (const a of el.attributes) {
    if (a.name === "style" || a.name === "data-glass") continue;
    p[ATTR_MAP[a.name] || a.name] = a.value;
  }
  return p;
}

const SKIP = "a,button,input,select,textarea,label,summary,video,[data-glass],.plasma-panel,.nav,.ribbon,.foot,dialog,pre,code,p,h1,h2,h3,li,dd,dt";
function PulseOnBackground() {
  const { pulse, reducedMotion } = usePlasmaRuntime();
  useEffect(() => {
    if (reducedMotion) return;
    const onDown = (e) => {
      if (e.button !== 0 || e.target.closest(SKIP)) return;
      pulse(e.clientX, e.clientY, 1);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [pulse, reducedMotion]);
  return null;
}

function Island({ blocks, play, onFuse, initialTheme }) {
  const [theme, setTheme] = useState(initialTheme in THEMES ? initialTheme : "lumen");
  useEffect(() => {
    const on = (e) => setTheme(e.detail in THEMES ? e.detail : "lumen");
    addEventListener("pm-theme", on);
    return () => removeEventListener("pm-theme", on);
  }, []);
  const t = THEMES[theme];
  const bounds = React.useRef(play);
  const joined = React.useRef({ a: false, b: false });
  const report = (side) => (j) => { joined.current[side] = j; onFuse(joined.current.a || joined.current.b); };

  return (
    <PlasmaProvider
      mood={t.mood} theme="dark" radius={24} tint={t.tint} opacity={t.opacity} frost={t.frost}
      rimColor={t.rimColor} viscosity={0.55} stretch={1.1} elevation={0.4} grain={0.6}
      maxSurfaces={8} quality={1.25} pointerDrop={true}
    >
      <PulseOnBackground />
      {blocks.map((b, i) => {
        const kind = b.kind;
        const common = { key: i, as: b.tag, ...b.props, dangerouslySetInnerHTML: { __html: b.html } };
        let el;
        if (kind === "hero") el = <Plasma {...common} lean={4} tint={t.hero.tint} opacity={t.hero.opacity} frost={0.35} elevation={0.5} />;
        else if (kind === "code") el = <Plasma {...common} lean={false} tint="#04121a" opacity={0.42} frost={0.45} />;
        else if (kind === "twin") el = <Plasma {...common} lean={5} fuse={false} tint="#04121a" opacity={0.3} frost={0.3} />;
        else if (kind === "card") {
          const side = b.props["data-side"] || "a";
          el = <Plasma {...common} draggable group="intro" bounds={bounds} lean={6}
            tint={side === "a" ? "#0b2a3a" : "#00a08c"} opacity={side === "a" ? 0.35 : 0.14} frost={0.3}
            onJoinChange={report(side)} />;
        } else el = <Plasma {...common} />;
        return createPortal(el, b.slot, "g" + i);
      })}
    </PlasmaProvider>
  );
}

let current = null;
export function mount({ stage, play, onFuse = () => {}, theme = "lumen" }) {
  unmount();
  const els = [...document.querySelectorAll("[data-glass]")].filter((el) => stage.contains(el) || (play && play.contains(el)));
  const blocks = els.map((el) => {
    const slot = document.createElement("div");
    slot.className = "glass-slot";
    el.replaceWith(slot);
    return { kind: el.dataset.glass, tag: el.tagName.toLowerCase(), props: propsFromEl(el), html: el.innerHTML, slot, orig: el };
  });
  const host = document.createElement("div");
  host.id = "glassRoot";
  document.body.appendChild(host);
  document.documentElement.classList.add("glass-live");
  const root = createRoot(host);
  root.render(<Island blocks={blocks} play={play} onFuse={onFuse} initialTheme={theme} />);
  current = { root, host, blocks };
  // Autoplay videos rendered via innerHTML (React does not run them)
  requestAnimationFrame(() => document.querySelectorAll(".glass-slot video").forEach((v) => { v.muted = true; v.play().catch(() => {}); }));
  return unmount;
}
export function unmount() {
  if (!current) return;
  current.root.unmount();
  current.host.remove();
  document.documentElement.classList.remove("glass-live");
  current = null;
}
