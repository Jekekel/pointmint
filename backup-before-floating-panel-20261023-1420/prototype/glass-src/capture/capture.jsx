import React from "react"; import { createRoot } from "react-dom/client";
import { PlasmaProvider } from "../vendor/plasma-ui/src/index"; import { THEMES } from "../src/island.jsx";
const t = THEMES[new URLSearchParams(location.search).get("t") || "lumen"];
createRoot(document.getElementById("r")).render(<PlasmaProvider mood={t.mood} theme="dark" grain={0} pointerDrop={false} pointerPull={false} preserveDrawingBuffer />);
