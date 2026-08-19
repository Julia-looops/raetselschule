/* ============================================================
   Baut aus src/game.jsx die fertige, eigenstaendige index.html.

   Aufruf im Projektordner:   node tools/build.mjs

   Was passiert:
   1. React, ReactDOM und Tailwind werden geladen (einmalig in
      tools/.cache zwischengespeichert, danach offline nutzbar).
   2. src/game.jsx wird mit Babel zu normalem JavaScript kompiliert,
      damit im Browser kein Babel mehr nötig ist.
   3. Alles wird in die Vorlage src/vorlage.html eingesetzt und als
      index.html geschrieben.

   Einmalig vorher:   npm install
   ============================================================ */
import { transformSync } from "@babel/core";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(wurzel, "tools", ".cache");

const LIBS = [
  ["react.js", "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"],
  ["react-dom.js", "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"],
  ["tailwind.js", "https://cdn.tailwindcss.com/3.4.1"],
];

async function holeLibs() {
  mkdirSync(cache, { recursive: true });
  for (const [name, url] of LIBS) {
    const ziel = join(cache, name);
    if (existsSync(ziel)) {
      console.log("  aus Cache:", name);
      continue;
    }
    console.log("  lade:", name);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    writeFileSync(ziel, Buffer.from(await res.arrayBuffer()));
  }
}

function kompiliere() {
  const src = readFileSync(join(wurzel, "src", "game.jsx"), "utf8");
  const out = transformSync(src, {
    presets: [["@babel/preset-react", { runtime: "classic" }]],
    compact: false,
    comments: true,
    configFile: false,
    babelrc: false,
  });
  return out.code;
}

function setzeZusammen(spielCode) {
  const vorlage = readFileSync(join(wurzel, "src", "vorlage.html"), "utf8").split("\n");

  /* Die Vorlage ist die urspruengliche CDN-Fassung. Wir pruefen ihre
     Struktur, damit niemals versehentlich aus einem Build-Ergebnis
     gebaut wird — dann waeren die Zeilennummern falsch. */
  const ok =
    vorlage.length >= 1179 &&
    vorlage[8].includes("<title>") &&
    vorlage[13].includes("<style>") &&
    vorlage[32].includes('type="text/babel"');
  if (!ok) throw new Error("src/vorlage.html sieht falsch aus — Abbruch.");

  const teil = (a, b) => vorlage.slice(a - 1, b).join("\n");
  const lib = (n) => readFileSync(join(cache, n), "utf8");
  const skript = (code) => "<script>\n" + code.trimEnd() + "\n</script>";

  return (
    [
      teil(1, 9), // DOCTYPE bis <title>
      '<meta name="robots" content="noindex, nofollow">',
      skript(lib("react.js")),
      skript(lib("react-dom.js")),
      skript(lib("tailwind.js")),
      teil(14, 32), // <style> bis Ende Storage-Shim
      skript(spielCode),
      "<script>",
      'if ("serviceWorker" in navigator) {',
      "  window.addEventListener(\"load\", function () {",
      '    navigator.serviceWorker.register("./sw.js").catch(function () {});',
      "  });",
      "}",
      "</script>",
      teil(1178, 1179), // </body></html>
    ].join("\n") + "\n"
  );
}

console.log("Bibliotheken:");
await holeLibs();
console.log("Kompiliere src/game.jsx ...");
const code = kompiliere();
console.log("Setze index.html zusammen ...");
const html = setzeZusammen(code);
writeFileSync(join(wurzel, "index.html"), html, "utf8");
console.log(`\nFertig: index.html, ${html.length} Bytes`);
