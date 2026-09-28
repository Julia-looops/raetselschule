/* ============================================================
   Die Testläufe für den Zahlodex.

   Aufruf im Projektordner:   node tools/tests/lauf.mjs
                              node tools/tests/lauf.mjs rechnen
                              node tools/tests/lauf.mjs oberflaeche

   Getestet wird die GEBAUTE arena.html — also bitte vorher
   `node tools/build.mjs` laufen lassen. Der Testlauf startet seinen
   eigenen kleinen Dateiserver und braucht sonst nichts ausser
   Playwright mit Chromium.

   Zwei Gruppen:

   RECHNEN       ruft die Funktionen des Spiels direkt auf. Schnell,
                 und deckt genau die Stellen ab, an denen bisher
                 echte Fehler sassen: Schwellen, Reifung, Aufgaben.
   OBERFLAECHE   klickt sich wirklich durch. Langsamer, aber nur so
                 findet man Dinge wie "die naechste Frage wird sofort
                 mitgewertet" oder "das Eingabefeld springt".

   Jeder Fehlschlag nennt Erwartung und Befund. Am Ende steht eine
   Zusammenfassung; bei Fehlern ist der Rueckgabewert 1.
   ============================================================ */
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const nurGruppe = process.argv[2] || null;

/* -------------------- Playwright finden -------------------- */
async function holeChromium() {
  const orte = ["playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"];
  for (const ort of orte) {
    try {
      return (await import(ort)).chromium;
    } catch (e) {
      /* naechsten Ort probieren */
    }
  }
  throw new Error(
    "Playwright nicht gefunden. Entweder `npm i -D playwright` im Projekt\n" +
      "oder ein globales Playwright mit Chromium."
  );
}

/* -------------------- Kleiner Dateiserver -------------------- */
const TYPEN = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };

function starteServer() {
  return new Promise((fertig) => {
    const server = createServer((req, res) => {
      const pfad = join(wurzel, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
      if (!pfad.startsWith(wurzel) || !existsSync(pfad)) {
        res.writeHead(404).end("nicht da");
        return;
      }
      res.writeHead(200, { "content-type": TYPEN[extname(pfad)] || "text/plain; charset=utf-8" });
      res.end(readFileSync(pfad));
    });
    server.listen(0, "127.0.0.1", () => fertig({ server, port: server.address().port }));
  });
}

/* -------------------- Das bisschen Gerüst -------------------- */
const ergebnisse = [];
let aktuelleGruppe = "";

function gruppe(name) {
  aktuelleGruppe = name;
}

async function pruefe(name, fn) {
  try {
    const befund = await fn();
    if (befund === true || befund === undefined) {
      ergebnisse.push({ gruppe: aktuelleGruppe, name, ok: true });
      console.log("  ✓ " + name);
    } else {
      ergebnisse.push({ gruppe: aktuelleGruppe, name, ok: false, befund: String(befund) });
      console.log("  ✗ " + name + "\n      " + String(befund).split("\n").join("\n      "));
    }
  } catch (e) {
    ergebnisse.push({ gruppe: aktuelleGruppe, name, ok: false, befund: e.message });
    console.log("  ✗ " + name + "\n      " + e.message);
  }
}

/* Ein Spielstand zum Testen. Alles im Malfeld gefangen und auf Stufe 4,
   damit jede Arena offen ist; `zusatz` wird darübergelegt. */
function standSetzen(p, zusatz = {}) {
  return p.evaluate((z) => {
    let t = leererTrainer("🐾");
    t.welt = "malfeld";
    t.gesehen = { kampf: true, start: true, tasten: true };
    const spaet = Date.now() + 90 * 86400000;
    ["wiese", "malfeld"].forEach((w) =>
      WELT[w].nrs.forEach((nr) => {
        t = mitF(t, w, nr, { h: 9, s: 4, f: spaet, x: 0, g: zielFakten(w, nr).map((x) => x.id) });
      })
    );
    Object.assign(t, z);
    localStorage.setItem(
      "florentina-zahlodex",
      JSON.stringify({ version: 1, aktiv: "Florentina", trainer: { Florentina: t } })
    );
  }, zusatz);
}

const lies = (p) =>
  p.evaluate(() => JSON.parse(localStorage.getItem("florentina-zahlodex")).trainer.Florentina);

const text = async (p) =>
  (await p.locator("body").innerText()).split("\n").map((x) => x.trim()).filter(Boolean);

/* Die Rechnung in der Frage ausrechnen — egal welche Rechenart. */
function loese(anzeige) {
  const m = anzeige.replace(/\s+/g, " ").match(/(\d+)\s*([·:+−-])\s*(\d+)/);
  if (!m) return null;
  const a = +m[1], b = +m[3];
  return m[2] === "·" ? a * b : m[2] === ":" ? a / b : m[2] === "+" ? a + b : a - b;
}

/* Eine Arenarunde spielen. `falsch` und `bremse` sind Fragenummern. */
async function spieleRunde(p, { falsch = [], bremse = [], maxFragen = 25 } = {}) {
  const gestellt = [];
  for (let n = 0; n < maxFragen; n++) {
    const anzeige = await p.locator("p.text-4xl").first().innerText().catch(() => null);
    if (!anzeige) break;
    const wert = loese(anzeige);
    if (wert === null) break;
    gestellt.push(anzeige.replace(/\s+/g, " ").replace(" = ?", "") + " = " + wert);
    /* Lang genug, um sicher aus dem Blitzfenster zu fallen — das ist
       mit der Suchzeit fuer die wandernden Tasten auf bis zu 5 s
       gewachsen. Laeuft dabei die Uhr ganz ab, ist das auch recht:
       blitzschnell war es dann erst recht nicht. */
    if (bremse.includes(n)) await p.waitForTimeout(6500);
    await p.keyboard.type(String(falsch.includes(n) ? wert + 1 : wert), { delay: 8 });
    await p.keyboard.press("Enter");
    await p.waitForTimeout(700);
    /* Nach einem Fehler wartet der Kampf auf einen Klick. */
    await p.locator("button:has-text('Weiter')").click({ timeout: 700 }).catch(() => {});
    await p.waitForTimeout(200);
  }
  return gestellt;
}

/* ============================================================
   GRUPPE 1 — RECHNEN
   ============================================================ */
async function rechnen(p) {
  gruppe("Rechnen");

  await pruefe("Keine Arena stellt eine Rechnung mit 1", async () => {
    const treffer = await p.evaluate(() => {
      const raus = [];
      for (let r = 0; r < 200; r++)
        ARENEN.forEach((a) =>
          arenaAufgaben(a, kampfFragen(a)).forEach((x) => {
            if (x.op === "·" && (x.a === 1 || x.b === 1)) raus.push(a.id + ": " + x.text);
          })
        );
      return raus;
    });
    return treffer.length === 0 || "gefunden: " + treffer.slice(0, 5).join(", ");
  });

  await pruefe("Nie zwei gleiche Ergebnisse hintereinander", async () => {
    const treffer = await p.evaluate(() => {
      const raus = [];
      for (let r = 0; r < 200; r++)
        ARENEN.forEach((a) => {
          const f = arenaAufgaben(a, kampfFragen(a));
          f.forEach((x, k) => {
            if (k > 0 && f[k - 1].antwort === x.antwort)
              raus.push(a.id + ": " + f[k - 1].text + " / " + x.text);
          });
        });
      return raus;
    });
    return treffer.length === 0 || treffer.length + " Doppel, z. B. " + treffer.slice(0, 3).join(", ");
  });

  await pruefe("Jede Antwort gehört zu einem Wesen", async () => {
    const ohne = await p.evaluate(() => {
      const raus = new Set();
      for (let r = 0; r < 50; r++)
        ARENEN.forEach((a) =>
          arenaAufgaben(a, kampfFragen(a)).forEach((x) => {
            if (!WESEN[x.antwort]) raus.add(a.id + ": " + x.text + " = " + x.antwort);
          })
        );
      return [...raus];
    });
    return ohne.length === 0 || "ohne Wesen: " + ohne.slice(0, 5).join(", ");
  });

  await pruefe("Jede gestellte Rechnung stimmt", async () => {
    const falsch = await p.evaluate(() => {
      const raus = [];
      for (let r = 0; r < 50; r++)
        ARENEN.forEach((a) =>
          arenaAufgaben(a, kampfFragen(a)).forEach((x) => {
            const soll =
              x.op === "·" ? x.a * x.b : x.op === ":" ? x.a / x.b : x.op === "+" ? x.a + x.b : x.a - x.b;
            if (soll !== x.antwort) raus.push(x.text + " = " + x.antwort + " (soll " + soll + ")");
          })
        );
      return raus;
    });
    return falsch.length === 0 || falsch.slice(0, 5).join(", ");
  });

  await pruefe("Super-Arena: 20 Fragen, fünf je Rechenart", async () => {
    const befund = await p.evaluate(() => {
      const sa = ARENEN.find((a) => a.art === "super");
      const schief = [];
      for (let r = 0; r < 30; r++) {
        const f = arenaAufgaben(sa, kampfFragen(sa));
        const je = {};
        f.forEach((x) => (je[x.op] = (je[x.op] || 0) + 1));
        if (f.length !== 20) schief.push("Länge " + f.length);
        ["·", ":", "+", "−"].forEach((op) => {
          if (je[op] !== 5) schief.push(op + " kam " + (je[op] || 0) + "× statt 5×");
        });
      }
      return schief;
    });
    return befund.length === 0 || befund.slice(0, 4).join(", ");
  });

  await pruefe("arenaTeam liefert immer dasselbe (sonst wackelt die Anzeige)", async () => {
    const schief = await p.evaluate(() =>
      ARENEN.filter((a) => {
        const proben = [];
        for (let i = 0; i < 6; i++) proben.push(arenaTeam(a).join(","));
        return new Set(proben).size !== 1;
      }).map((a) => a.id)
    );
    return schief.length === 0 || "wechselt bei: " + schief.join(", ");
  });

  await pruefe("Orden verzeiht höchstens einen Fehler — egal wie stark das Team", async () => {
    const schief = await p.evaluate(() => {
      const a = ARENEN[0];
      const n = kampfFragen(a);
      const pkt = (richtig, tricks, blitz) => {
        let p2 = 0, k = 0;
        for (let i = 0; i < richtig; i++) {
          k++;
          p2 += 10 + (blitz ? 5 : 0) + tricks * 5;
          if (k % 3 === 0) p2 += 10;
        }
        return p2;
      };
      const raus = [];
      [0, 1, 2, 3].forEach((tricks) =>
        [false, true].forEach((blitz) => {
          let ordenMax = -1, zweiMax = -1;
          for (let fehler = 0; fehler <= n; fehler++) {
            const treffer = n - fehler;
            const st = sterneFuer(pkt(treffer, tricks, blitz), treffer, blitz ? treffer : 0, n, a);
            if (st >= 1) ordenMax = fehler;
            if (st >= 2) zweiMax = fehler;
          }
          if (ordenMax > 1) raus.push(tricks + " Tricks: Orden noch bei " + ordenMax + " Fehlern");
          if (zweiMax > 0) raus.push(tricks + " Tricks: ★★ noch bei " + zweiMax + " Fehlern");
        })
      );
      return raus;
    });
    return schief.length === 0 || schief.join("; ");
  });

  await pruefe("★★★ nur fehlerfrei und alles blitzschnell", async () => {
    const schief = await p.evaluate(() => {
      const a = ARENEN[0], n = kampfFragen(a);
      const raus = [];
      if (sterneFuer(9999, n, n - 1, n, a) === 3) raus.push("drei Sterne trotz einer langsamen Antwort");
      if (sterneFuer(9999, n - 1, n - 1, n, a) === 3) raus.push("drei Sterne trotz eines Fehlers");
      if (sterneFuer(120, n, n, n, a) !== 3) raus.push("perfekte Runde gibt keine drei Sterne");
      return raus;
    });
    return schief.length === 0 || schief.join("; ");
  });

  await pruefe("Die lange Pause zählt nur, wenn sie wirklich fällig war", async () => {
    const befund = await p.evaluate(() => {
      const w = "malfeld", nr = 20, max = maxStufe(w, nr);
      const offen = { h: 9, s: max, f: Date.now() + 9 * 86400000, x: 0, g: [], dauer: 0 };
      const faellig = { ...offen, f: Date.now() - 1000 };
      const raus = [];
      ["blitz", "normal", "langsam", "hilfe", "falsch"].forEach((tp) => {
        if (dauerZahl(nachWiedersehen({ ...offen }, tp, w, nr)) > 0)
          raus.push(tp + " zählte, obwohl die Pause noch lief");
      });
      ["blitz", "normal"].forEach((tp) => {
        if (dauerZahl(nachWiedersehen({ ...faellig }, tp, w, nr)) !== 1)
          raus.push(tp + " zählte nicht, obwohl fällig und gewusst");
      });
      ["langsam", "hilfe", "falsch"].forEach((tp) => {
        if (dauerZahl(nachWiedersehen({ ...faellig }, tp, w, nr)) > 0)
          raus.push(tp + " zählte, obwohl nicht sauber gewusst");
      });
      if (dauerZahl({ dauer: true }) !== 1) raus.push("alter Stand (dauer===true) wird nicht als eine gelesen");
      return raus;
    });
    return befund.length === 0 || befund.join("; ");
  });

  await pruefe("Dritter Trick erst nach zwei überstandenen Pausen", async () => {
    const befund = await p.evaluate(() => {
      const w = "malfeld", nr = 20, max = maxStufe(w, nr);
      const mach = (d) => {
        let t = leererTrainer("x");
        t = mitF(t, w, nr, {
          h: 9, s: max, f: Date.now() + 9e8, x: 0,
          g: zielFakten(w, nr).map((x) => x.id), dauer: d,
        });
        t.wesen[nr] = { ...t.wesen[nr], tr: 2 };
        return trickBedingung(t, w, nr).ok;
      };
      const raus = [];
      if (mach(0)) raus.push("ohne Pause schon erlaubt");
      if (mach(1)) raus.push("nach einer Pause schon erlaubt");
      if (!mach(2)) raus.push("nach zwei Pausen immer noch gesperrt");
      return raus;
    });
    return befund.length === 0 || befund.join("; ");
  });

  await pruefe("Pokalstufen erst nach Ablauf der Pause", async () => {
    const befund = await p.evaluate(() => {
      const raus = [];
      const bau = (stufe, tageHer) => ({
        pokal: { r2: { stufe, seit: Date.now() - tageHer * 86400000 } },
        orden: [], sterne: {},
      });
      POKAL_PAUSE.forEach((pause, stufe) => {
        const kurzVorher = pokalStand(bau(stufe, pause - 1), "r2");
        const danach = pokalStand(bau(stufe, pause + 1), "r2");
        if (kurzVorher.offen) raus.push("Stufe " + stufe + " war schon nach " + (pause - 1) + " Tagen offen");
        if (!danach.offen) raus.push("Stufe " + stufe + " war nach " + (pause + 1) + " Tagen noch zu");
      });
      if (pokalStand({ pokal: {}, orden: [], sterne: {} }, "r2").laeuft)
        raus.push("Uhr läuft ohne drei Sterne");
      return raus;
    });
    return befund.length === 0 || befund.join("; ");
  });

  await pruefe("Sicherung kommt Zeichen für Zeichen zurück", async () => {
    const befund = await p.evaluate(() => {
      let t = leererTrainer("🦄");
      NR_MALFELD.forEach((nr) => {
        t = mitF(t, "malfeld", nr, { h: 7, s: 4, f: Date.now() + 1e6, x: 2, g: ["m2x3"] });
        t.wesen[nr] = { ...t.wesen[nr], tr: 2, ein: "m" };
      });
      t.orden = ["r2", "r5"];
      t.sterne = { r2: 3 };
      t.pokal = { r2: { stufe: 1, seit: 123456 } };
      t.namen = { 20: { name: "Lärä 🐿️", bild: "⚡" } };
      t.angriffe = { 20: { 0: "Donnerblitz" } };
      const vorher = { version: 1, aktiv: "Lärä 🐿️", trainer: { "Lärä 🐿️": t } };
      const zurueck = ausCode(alsCode(vorher));
      delete zurueck.gesichert;
      return JSON.stringify(zurueck) === JSON.stringify(vorher)
        ? []
        : ["Round-Trip verändert den Stand"];
    });
    return befund.length === 0 || befund.join("; ");
  });

  await pruefe("Kaputte Sicherungen werden abgefangen", async () => {
    const befund = await p.evaluate(() => {
      const raus = [];
      const mussWerfen = (was, wie) => {
        try {
          ausCode(was);
          raus.push(wie + " wurde angenommen");
        } catch (e) {
          /* richtig so */
        }
      };
      mussWerfen("ZAHLODEX1:das-ist-kaputt", "beschädigter Code");
      mussWerfen("hallo, ich bin kein Code", "gar kein Code");
      mussWerfen(btoa('{"version":1}'), "Code ohne Kennwort");
      return raus;
    });
    return befund.length === 0 || befund.join("; ");
  });

  await pruefe("Eigene Namen liegen über der Vorgabe, ohne sie zu löschen", async () => {
    const befund = await p.evaluate(() => {
      const raus = [];
      let t = leererTrainer("🐾");
      if (wName(t, 20) !== WESEN[20].name) raus.push("Vorgabename wird nicht gelesen");
      t = mitNamen(t, 20, "Pikachu", "⚡");
      if (wName(t, 20) !== "Pikachu") raus.push("eigener Name greift nicht");
      if (wBild(t, 20) !== "⚡") raus.push("eigenes Bild greift nicht");
      if (WESEN[20].name !== "Zwanzo") raus.push("die Vorgabe wurde überschrieben");
      t = mitNamen(t, 20, "", "");
      if (wName(t, 20) !== WESEN[20].name) raus.push("Leeren setzt nicht zurück");
      if (eigenerName(t, 20)) raus.push("nach dem Leeren gilt es noch als eigener Name");
      t = mitAngriff(t, 20, 0, "Donnerblitz");
      if (aName(t, 20, 0, { name: "Doppelschlag" }) !== "Donnerblitz") raus.push("eigener Angriff greift nicht");
      t = mitAngriff(t, 20, 0, "");
      if (aName(t, 20, 0, { name: "Doppelschlag" }) !== "Doppelschlag") raus.push("Angriff leeren setzt nicht zurück");
      return raus;
    });
    return befund.length === 0 || befund.join("; ");
  });
}

/* Nachtrag zur Gruppe RECHNEN: die wandernden Tasten und das Abfragen */
async function rechnenTasten(p) {
  gruppe("Rechnen");

  await pruefe("Gemischte Tasten: alle zehn Ziffern, kaum eine am alten Platz", async () => {
    const befund = await p.evaluate(() => {
      const raus = [];
      const gesehen = new Set();
      for (let i = 0; i < 500; i++) {
        const t = gemischteTasten();
        gesehen.add(t.join(""));
        if (t.length !== 10 || new Set(t).size !== 10 || !t.every((z) => /^\d$/.test(z)))
          raus.push("keine Belegung aus 0–9: " + t.join(""));
        const gleich = t.filter((z, k) => z === TASTEN_STANDARD[k]).length;
        if (gleich > 2) raus.push(gleich + " Ziffern am gewohnten Platz: " + t.join(""));
      }
      if (gesehen.size < 400) raus.push("nur " + gesehen.size + " verschiedene Belegungen in 500 Würfen");
      return raus;
    });
    return befund.length === 0 || befund.slice(0, 3).join("; ");
  });

  await pruefe("Suchzeit: eine Sekunde mehr je Ziffer fürs Blitzen", async () => {
    const befund = await p.evaluate(() => {
      const raus = [];
      [[6, 5000], [56, 6000], [100, 7000]].forEach(([antwort, soll]) => {
        if (blitzGrenze(antwort) !== soll) raus.push("blitzGrenze(" + antwort + ") = " + blitzGrenze(antwort) + " statt " + soll);
      });
      if (tempoVon(5500, false, true, 56) !== "blitz") raus.push("5,5 s bei 56 zählt nicht als blitzschnell");
      if (tempoVon(6500, false, true, 56) !== "normal") raus.push("6,5 s bei 56 zählt nicht als normal");
      if (tempoVon(5500, false, true, 6) !== "normal") raus.push("5,5 s bei 6 zählt noch als blitzschnell");
      /* Arena: die erste Hälfte der Uhr ist das Blitzfenster */
      const f = { op: "·", a: 7, b: 8, antwort: 56 };
      const zugabe = blitzZeit(f) / 2 - grundZeit(f) / 2;
      if (zugabe !== 2) raus.push("Arena-Blitzfenster wächst bei 56 um " + zugabe + " s statt 2 s");
      return raus;
    });
    return befund.length === 0 || befund.join("; ");
  });

  await pruefe("Abfragen: nur gefangene Wesen, fällige zuerst, höchstens zehn", async () => {
    const befund = await p.evaluate(() => {
      const raus = [];
      let t = leererTrainer("🐾");
      const weit = Date.now() + 30 * 86400000;
      /* 15 gefangen, davon drei fällig, dazu fünf noch wilde. Genommen
         werden nur Wesen, die nicht allein über die 1 erreichbar sind —
         sonst fielen die fälligen heraus und die Prüfung wäre leer. */
      const echte = NR_MALFELD.filter((nr) => zielFakten("malfeld", nr).some(ohneEins));
      echte.slice(0, 15).forEach((nr, k) => {
        t = mitF(t, "malfeld", nr, { h: 3, s: 3, f: k < 3 ? Date.now() - 1000 : weit, x: 0, g: [] });
      });
      echte.slice(15, 20).forEach((nr) => {
        t = mitF(t, "malfeld", nr, { h: 1, s: 0, f: 0, x: 0, g: [] });
      });
      const faellig = echte.slice(0, 3);
      for (let i = 0; i < 50; i++) {
        const r = abfrageRunde(t, "malfeld");
        if (r.length !== 10) raus.push("Länge " + r.length);
        r.forEach(({ nr }) => {
          if (holF(t, "malfeld", nr).s < 1) raus.push("wildes Wesen " + nr + " dabei");
        });
        faellig.forEach((nr) => {
          if (!r.some((x) => x.nr === nr)) raus.push("fälliges Wesen " + nr + " fehlt");
        });
        r.forEach(({ fakt }) => {
          if (fakt.op === "·" && (fakt.a === 1 || fakt.b === 1)) raus.push("Einer-Rechnung abgefragt: " + fakt.text);
        });
      }
      return [...new Set(raus)];
    });
    return befund.length === 0 || befund.slice(0, 4).join("; ");
  });
}

/* ============================================================
   GRUPPE 2 — OBERFLAECHE
   ============================================================ */
async function oberflaeche(p, url) {
  gruppe("Oberfläche");

  const neuLaden = async (zusatz) => {
    await standSetzen(p, zusatz);
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(400);
  };
  const inDieArena = async (name) => {
    await p.getByText("Arenen 🏅").click();
    await p.waitForTimeout(350);
    await p.getByText(name).click();
    await p.waitForTimeout(500);
  };

  await pruefe("Erster Start erklärt das Spiel, danach nicht mehr", async () => {
    await p.evaluate(() => localStorage.clear());
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    if (!(await p.getByText("So läuft das hier").isVisible())) return "Erklärung fehlt beim ersten Start";
    await p.getByRole("button", { name: /Los geht/ }).click();
    await p.waitForTimeout(400);
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    if (await p.getByText("So läuft das hier").isVisible()) return "Erklärung kommt wieder";
    await p.locator("button:has-text('?')").first().click();
    await p.waitForTimeout(300);
    return (await p.getByText("So läuft das hier").isVisible()) || "über '?' nicht mehr erreichbar";
  });

  await pruefe("Die Startseite nennt immer etwas zu tun", async () => {
    const faelle = [
      [{}, null],
      [{ punkte: 9, wesen: null }, null],
      [{ orden: ["r2", "r5", "r10", "r3", "r4", "r6", "r7", "r8", "r9", "plus", "minus", "liga"],
        sterne: { r2: 3, r5: 3 } }, null],
    ];
    for (const [zusatz] of faelle) {
      const z = { ...zusatz };
      if (z.wesen === null) delete z.wesen;
      await neuLaden(z);
      const t = await text(p);
      const i = t.indexOf("HEUTE");
      if (i < 0 || !t[i + 1]) return "keine Heute-Zeile bei " + JSON.stringify(zusatz);
    }
    return true;
  });

  await pruefe("Nach einem Fehler wartet der Kampf auf einen Klick", async () => {
    await neuLaden({});
    await inDieArena("Siebener-Arena");
    const anzeige = await p.locator("p.text-4xl").first().innerText();
    await p.keyboard.type(String(loese(anzeige) + 1), { delay: 15 });
    await p.keyboard.press("Enter");
    await p.waitForTimeout(600);
    if (!(await p.locator("button:has-text('Weiter')").isVisible())) return "kein Weiter-Knopf";
    const zaehler = async () => (await text(p)).find((x) => /^\d+\/\d+$/.test(x));
    const vorher = await zaehler();
    await p.waitForTimeout(9000);
    const nachher = await zaehler();
    if (vorher !== nachher) return "ist von selbst weitergesprungen (" + vorher + " → " + nachher + ")";
    await p.locator("button:has-text('Weiter')").click();
    await p.waitForTimeout(500);
    return (await zaehler()) !== vorher || "Klick bewirkt nichts";
  });

  await pruefe("Ein Zeitablauf reisst die nächste Frage nicht mit", async () => {
    await neuLaden({});
    await inDieArena("Zweier-Arena");
    /* Erste Frage verstreichen lassen. Danach muss GENAU eine Frage
       verbraucht sein — der Fehler war, dass die naechste sofort
       mitgewertet wurde, weil sie noch die alte Restzeit sah. */
    /* Die Uhr ist mit der Suchzeit auf bis zu 10 s gewachsen. */
    await p.waitForTimeout(11000);
    await p.locator("button:has-text('Weiter')").click({ timeout: 2000 }).catch(() => {});
    await p.waitForTimeout(500);
    const zaehler = (await text(p)).find((x) => /^\d+\/\d+$/.test(x));
    const anzeige = (await p.locator("p.text-4xl").first().innerText()).replace(/\s+/g, " ");
    if (zaehler !== "2/12") return "Zähler steht auf " + zaehler + " statt 2/12";
    return anzeige.includes("?") || "Frage 2 ist schon beantwortet: " + anzeige;
  });

  await pruefe("Titel nur bei fehlerfrei und blitzschnell", async () => {
    const pokalStufe = async () => (await lies(p)).pokal.r2.stufe;
    const vorbereiten = () =>
      neuLaden({
        orden: ["r2"],
        sterne: { r2: 3 },
        pokal: { r2: { stufe: 0, seit: Date.now() - 5 * 86400000 } },
      });

    await vorbereiten();
    await p.getByText("Arenen 🏅").click();
    await p.waitForTimeout(350);
    await p.locator("button:has-text('Titelkampf')").first().click();
    await p.waitForTimeout(500);
    await spieleRunde(p, { falsch: [2] });
    await p.waitForTimeout(500);
    if ((await pokalStufe()) !== 0) return "Titel trotz Fehler vergeben";

    await vorbereiten();
    await p.getByText("Arenen 🏅").click();
    await p.waitForTimeout(350);
    await p.locator("button:has-text('Titelkampf')").first().click();
    await p.waitForTimeout(500);
    await spieleRunde(p, { bremse: [1] });
    await p.waitForTimeout(500);
    if ((await pokalStufe()) !== 0) return "Titel trotz langsamer Antwort vergeben";

    await vorbereiten();
    await p.getByText("Arenen 🏅").click();
    await p.waitForTimeout(350);
    await p.locator("button:has-text('Titelkampf')").first().click();
    await p.waitForTimeout(500);
    await spieleRunde(p, {});
    await p.waitForTimeout(500);
    return (await pokalStufe()) === 1 || "perfekte Runde gibt keinen Titel";
  });

  await pruefe("'Orden verteidigt' nur, wenn sie ihn heute auch geschafft hat", async () => {
    await neuLaden({ orden: ["r7"], sterne: { r7: 3 } });
    await inDieArena("Siebener-Arena");
    await spieleRunde(p, { falsch: [0, 1, 2, 3, 4] });
    await p.waitForTimeout(700);
    const t = await text(p);
    if (t.some((x) => x.includes("Orden verteidigt"))) return "sagt 'Orden verteidigt' nach fünf Fehlern";
    return t.some((x) => x.includes("Diesmal nicht")) || "keine ehrliche Rückmeldung: " + t.slice(0, 12).join(" | ");
  });

  await pruefe("Super-Arena: das Eingabefeld steht still", async () => {
    await neuLaden({ orden: ARENEN_ALLE });
    await inDieArena("Die Super-Arena");
    const messe = async () => {
      const block = await p.locator("button:has-text('7')").first().boundingBox();
      const frage = await p.locator("p.text-4xl").first().boundingBox();
      return Math.round(block.y) + "/" + Math.round(frage.y);
    };
    const werte = [];
    for (let n = 0; n < 5; n++) {
      werte.push(await messe());
      await p.waitForTimeout(400);
    }
    return new Set(werte).size === 1 || "Position wandert: " + werte.join(", ");
  });

  await pruefe("Beere hält die Uhr an und zeigt den Weg", async () => {
    await neuLaden({});
    await inDieArena("Siebener-Arena");
    await p.locator("button:has-text('🫐 Beere ')").click();
    await p.waitForTimeout(400);
    if (!(await p.getByText("Uhr angehalten").isVisible())) return "Uhr läuft weiter";
    const tipps = await p.locator(".bg-emerald-100 button").allInnerTexts();
    if (tipps.length === 0) return "keine Tipps zu sehen";
    if (!(await p.locator("button:has-text('🫐 Beere ')").isDisabled())) return "Beere lässt sich nochmal nehmen";
    /* richtig antworten: darf nur halbe Punkte und keinen Blitz geben */
    const wert = loese(await p.locator("p.text-4xl").first().innerText());
    await p.keyboard.type(String(wert), { delay: 12 });
    await p.keyboard.press("Enter");
    /* Die Meldung steht nur, bis die Runde weiterschaltet — also
       frueh genug nachsehen. */
    await p.waitForTimeout(300);
    const t = await text(p);
    if (!t.some((x) => x.includes("mit Beere"))) return "Beere wird im Treffer nicht erwähnt";
    return t.some((x) => x === "+5") || "gab nicht 5 Punkte: " + t.slice(0, 10).join(" | ");
  });

  await pruefe("Umbenennen wirkt überall", async () => {
    await neuLaden({ namen: { 49: { name: "Glurak", bild: "🔥" } } });
    await p.getByText("Arenen 🏅").click();
    await p.waitForTimeout(400);
    if (!(await p.locator("body").innerText()).includes("Glurak")) return "Arenaliste zeigt den Namen nicht";
    if ((await p.locator("body").innerText()).includes("Spiegelsieb")) return "alter Name steht noch da";
    await p.getByText("Siebener-Arena").click();
    await p.waitForTimeout(500);
    return (await p.locator("body").innerText()).includes("Glurak") || "Kampf zeigt den Namen nicht";
  });

  await pruefe("Sicherung schreibt und liest eine Datei", async () => {
    await neuLaden({ orden: ["r2", "r5"], sterne: { r2: 3 } });
    await p.locator("button:has-text('⚙️')").first().click();
    await p.waitForTimeout(400);
    await p.locator("button:has-text('🔐')").first().click();
    await p.waitForTimeout(400);
    const code = await p.locator("textarea").first().inputValue();
    if (!code.startsWith("ZAHLODEX1:")) return "kein Code im Feld";
    const vorher = await lies(p);
    await p.evaluate(() => localStorage.clear());
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    await p.getByRole("button", { name: /Los geht/ }).click({ timeout: 2000 }).catch(() => {});
    await p.waitForTimeout(300);
    /* Ohne gefangene Wesen mahnt das Menue nicht, dann steht dort das
       Zahnrad statt des Schlosses. Also immer ueber die Einstellungen. */
    await p.locator("button:has-text('⚙️')").first().click();
    await p.waitForTimeout(350);
    await p.locator("button:has-text('🔐')").first().click();
    await p.waitForTimeout(300);
    await p.locator("textarea").nth(1).fill(code);
    await p.waitForTimeout(500);
    await p.locator("button:has-text('Jetzt einspielen')").click();
    await p.waitForTimeout(600);
    const nachher = await lies(p);
    return (
      JSON.stringify(nachher.orden) === JSON.stringify(vorher.orden) ||
      "Orden kamen nicht zurück: " + JSON.stringify(nachher.orden)
    );
  });

  /* Liest die Ziffern des Ziffernblocks in Bildschirmreihenfolge */
  const belegung = async () =>
    (await p.locator("div.grid.max-w-xs.grid-cols-3 button").allInnerTexts())
      .map((x) => x.trim())
      .filter((x) => /^\d$/.test(x))
      .join("");

  await pruefe("Die Tasten wandern — aber nur zwischen den Runden, nie mittendrin", async () => {
    await neuLaden({});
    await inDieArena("Siebener-Arena");
    const anfang = await belegung();
    if (anfang.length !== 10) return "Ziffernblock nicht gefunden: " + anfang;
    if (anfang === "7894561230") return "Tasten liegen noch an der gewohnten Stelle";
    /* drei Fragen spielen, zwischendurch neu zeichnen lassen */
    for (let n = 0; n < 3; n++) {
      const wert = loese(await p.locator("p.text-4xl").first().innerText());
      await p.keyboard.type(String(wert), { delay: 10 });
      await p.keyboard.press("Enter");
      await p.waitForTimeout(900);
      const jetzt = await belegung();
      if (jetzt !== anfang) return "Belegung hat sich mitten im Kampf geändert: " + anfang + " → " + jetzt;
    }
    /* Neue Runde → neue Belegung */
    await p.locator("button:has-text('‹')").first().click();
    await p.waitForTimeout(400);
    await p.getByText("Siebener-Arena").click();
    await p.waitForTimeout(500);
    const zweite = await belegung();
    return zweite !== anfang || "zweite Runde hat dieselbe Belegung: " + zweite;
  });

  await pruefe("Wer schon gespielt hat, bekommt die wandernden Tasten einmal erklärt", async () => {
    await standSetzen(p, { gesehen: { kampf: true, start: true } });
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    if (!(await p.getByText("Die Tasten sind verzaubert!").isVisible())) return "Einblendung fehlt";
    await p.getByRole("button", { name: /Ich bin bereit/ }).click();
    await p.waitForTimeout(400);
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    return !(await p.getByText("Die Tasten sind verzaubert!").isVisible()) || "Einblendung kommt wieder";
  });

  await pruefe("Abfragen: sofort, gewusst und nicht gewusst wirken auf den Karteikasten", async () => {
    /* Alles im Malfeld fällig und auf Stufe 2 */
    await p.evaluate(() => {
      let t = leererTrainer("🐾");
      t.welt = "malfeld";
      t.gesehen = { kampf: true, start: true, tasten: true };
      NR_MALFELD.forEach((nr) => {
        t = mitF(t, "malfeld", nr, { h: 9, s: 2, f: Date.now() - 1000, x: 0, g: zielFakten("malfeld", nr).map((x) => x.id) });
      });
      localStorage.setItem("florentina-zahlodex", JSON.stringify({ version: 1, aktiv: "Florentina", trainer: { Florentina: t } }));
    });
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(400);
    await p.locator("button:has-text('⚙️')").first().click();
    await p.waitForTimeout(350);
    await p.locator("button:has-text('Abfragen')").first().click();
    await p.waitForTimeout(350);
    await p.locator("button:has-text('Malfeld')").first().click();
    await p.waitForTimeout(400);
    if ((await p.locator("div.grid.max-w-xs.grid-cols-3").count()) > 0) return "da ist doch ein Ziffernblock";

    const stufeVon = async (nr) => (await lies(p)).wesen[nr].m.s;
    const wesenDerFrage = async () => {
      /* Die Antwort der Frage ist die Wesennummer — ausser bei Umkehraufgaben.
         Deshalb lieber die Lösung zeigen lassen und dort ablesen. */
      await p.locator("button:has-text('Lösung zeigen')").click();
      await p.waitForTimeout(250);
      const t2 = (await p.locator("p.text-5xl").first().innerText()).replace(/\s+/g, " ");
      const m = t2.match(/(\d+)\s*[·+−:-]\s*(\d+)\s*=\s*(\d+)/);
      if (!m) return null;
      /* Ergebnis der Rechnung = Wesen */
      return +m[3];
    };
    const ergebnis = [];
    for (const [knopf, erwartet] of [["Sofort gewusst", 4], ["Gewusst, mit", 3], ["Nicht gewusst", 1]]) {
      const nr = await wesenDerFrage();
      if (nr === null) return "Lösung nicht lesbar";
      const vorher = await stufeVon(nr);
      await p.locator("button:has-text('" + knopf + "')").click();
      await p.waitForTimeout(350);
      const nachher = await stufeVon(nr);
      ergebnis.push(knopf + ": " + vorher + " → " + nachher);
      if (nachher !== erwartet) return "falsche Wirkung — " + ergebnis.join(", ") + " (erwartet " + erwartet + ")";
    }
    /* Rest der Runde durchklicken und die Übersicht prüfen */
    for (let n = 0; n < 10; n++) {
      const zeigen = p.locator("button:has-text('Lösung zeigen')");
      if (!(await zeigen.count())) break;
      await zeigen.click();
      await p.waitForTimeout(150);
      await p.locator("button:has-text('Gewusst, mit')").click();
      await p.waitForTimeout(150);
    }
    const t3 = await text(p);
    if (!t3.some((x) => x.includes("Die üben wir noch".toUpperCase()) || x.includes("Die üben wir noch")))
      return "Übersicht nennt die nicht gewusste Rechnung nicht";
    return t3.some((x) => x === "9/10") || "Übersicht zählt falsch: " + t3.slice(0, 8).join(" | ");
  });

  await pruefe("Trainer löschen fragt nach", async () => {
    await neuLaden({});
    await p.getByText("Trainer wechseln").click();
    await p.waitForTimeout(400);
    await p.locator("button:has-text('✕')").first().click();
    await p.waitForTimeout(300);
    if (!(await p.getByText("wirklich löschen?").isVisible())) return "löscht ohne Nachfrage";
    await p.locator("button:has-text('Doch nicht')").click();
    await p.waitForTimeout(300);
    const stand = await p.evaluate(() => JSON.parse(localStorage.getItem("florentina-zahlodex")));
    return Object.keys(stand.trainer).length === 1 || "Trainer trotz Abbruch weg";
  });
}

/* ============================================================
   Los
   ============================================================ */
const { server, port } = await starteServer();
const url = "http://127.0.0.1:" + port + "/arena.html";
const chromium = await holeChromium();
const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 420, height: 1400 } });

const jsFehler = [];
seite.on("pageerror", (e) => jsFehler.push("PAGEERROR " + e.message));
seite.on("console", (m) => {
  if (m.type() === "error") jsFehler.push("CONSOLE " + m.text());
});

console.log("Teste " + url + "\n");
await seite.goto(url, { waitUntil: "networkidle" });

/* Damit die Oberflächentests die Arenaliste kennen */
await seite.addInitScript(() => {});
const ARENEN_ALLE = await seite.evaluate(() => ARENEN.map((a) => a.id));
globalThis.ARENEN_ALLE = ARENEN_ALLE;

if (!nurGruppe || nurGruppe === "rechnen") {
  console.log("RECHNEN");
  await rechnen(seite);
  await rechnenTasten(seite);
  console.log("");
}
if (!nurGruppe || nurGruppe === "oberflaeche") {
  console.log("OBERFLÄCHE");
  await oberflaeche(seite, url);
  console.log("");
}

gruppe("Sauberkeit");
await pruefe("Keine JavaScript-Fehler im ganzen Lauf", () =>
  jsFehler.length === 0 || jsFehler.slice(0, 5).join("\n")
);

await browser.close();
server.close();

const fehlgeschlagen = ergebnisse.filter((e) => !e.ok);
console.log(
  "\n" + (ergebnisse.length - fehlgeschlagen.length) + " von " + ergebnisse.length + " bestanden"
);
if (fehlgeschlagen.length > 0) {
  console.log("\nFehlgeschlagen:");
  fehlgeschlagen.forEach((e) => console.log("  ✗ " + e.name + "\n      " + e.befund));
  process.exit(1);
}
