// Builds the Firefox (desktop + Android) version of the extension into dist/trustlens-firefox
// node scripts/build-firefox.mjs  ->  load via about:debugging, or web-ext run -t firefox-android
import { cpSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
const OUT = "dist/trustlens-firefox";
rmSync(OUT, { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync("extension", OUT, { recursive: true });
const m = JSON.parse(readFileSync(`${OUT}/manifest.json`, "utf8"));
m.background = { scripts: ["guard.js", "background.js"] }; // Firefox MV3 uses event-page scripts, not a service worker
m.browser_specific_settings = { gecko: { id: "trustlens@teamzenith.in", strict_min_version: "128.0" }, gecko_android: { strict_min_version: "128.0" } };
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(m, null, 2));
console.log(`built ${OUT} (v${m.version})`);
