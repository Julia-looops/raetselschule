/* ============================================================
   Baut aus den Quelldateien in src/ die fertigen, eigenstaendigen
   HTML-Seiten.

   Aufruf im Projektordner:   node tools/build.mjs

   Was passiert:
   1. React, ReactDOM und Tailwind werden geladen (einmalig in
      tools/.cache zwischengespeichert, danach offline nutzbar).
   2. Jede Quelldatei wird mit Babel zu normalem JavaScript
      kompiliert, damit im Browser kein Babel mehr noetig ist.
   3. Alles wird in die Vorlage src/vorlage.html eingesetzt.

   Gebaut werden:
     src/game.jsx  -> index.html   (Raetselschule, Textraetsel)
     src/arena.jsx -> arena.html   (Zahlodex, 1x1 und Plus/Minus)

   Einmalig vorher:   npm install
   ============================================================ */
import { transformSync } from "@babel/core";
import { execSync } from "node:child_process";
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

const SEITEN = [
  { quelle: "game.jsx", ziel: "index.html", titel: "Florentinas Raetselschule", kurz: "Raetselschule" },
  { quelle: "arena.jsx", ziel: "arena.html", titel: "Zahlodex - Die Rechen-Arena", kurz: "Zahlodex" },
];

/* Laufende Nummer und Datum, damit man von aussen sehen kann, ob ein
   Update tatsaechlich angekommen ist. Die Nummer ist die Anzahl der
   Commits plus eins — also die Fassung, die dieser Build wird. Steht
   im Quellcode als Platzhalter __FASSUNG__ und wird hier ersetzt. */
function fassung() {
  let nummer = "?";
  try {
    const zahl = execSync("git rev-list --count HEAD", { cwd: wurzel }).toString().trim();
    nummer = String(Number(zahl) + 1);
  } catch (e) {
    /* kein Git zur Hand — dann eben ohne Nummer */
  }
  const d = new Date();
  const datum = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
  return nummer + " \u00b7 " + datum;
}

const FASSUNG = fassung();

function kompiliere(datei) {
  const src = readFileSync(join(wurzel, "src", datei), "utf8").replaceAll("__FASSUNG__", FASSUNG);
  const out = transformSync(src, {
    presets: [["@babel/preset-react", { runtime: "classic" }]],
    compact: false,
    comments: true,
    configFile: false,
    babelrc: false,
  });
  return out.code;
}

function setzeZusammen(spielCode, seite) {
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

  const kopf = teil(1, 9)
    .replace(/<title>[^<]*<\/title>/, `<title>${seite.titel}</title>`)
    .replace(/(name="apple-mobile-web-app-title" content=")[^"]*/, `$1${seite.kurz}`);

  return (
    [
      kopf, // DOCTYPE bis <title>
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

console.log("Fassung:", FASSUNG);
console.log("Bibliotheken:");
await holeLibs();
for (const seite of SEITEN) {
  console.log(`Kompiliere src/${seite.quelle} ...`);
  const code = kompiliere(seite.quelle);
  const html = setzeZusammen(code, seite);
  writeFileSync(join(wurzel, seite.ziel), html, "utf8");
  console.log(`  fertig: ${seite.ziel}, ${html.length} Bytes`);
}
