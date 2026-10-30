// Packs the extension into downloadable zips served by the site:
//   public/downloads/trustlens-chrome.zip   (Chrome, Edge, Brave: Load unpacked)
//   public/downloads/trustlens-firefox.zip  (Firefox desktop + Firefox for Android)
// node scripts/build-firefox.mjs && node scripts/pack-extension.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
mkdirSync("public/downloads", { recursive: true });
const zip = (dir, out) => execFileSync("python", ["-c", `
import zipfile, os, sys
src, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(src):
        for f in files:
            p = os.path.join(root, f); z.write(p, os.path.relpath(p, src))
print(out, os.path.getsize(out))`, dir, out], { stdio: "inherit" });
zip("extension", "public/downloads/trustlens-chrome.zip");
zip("dist/trustlens-firefox", "public/downloads/trustlens-firefox.zip");
