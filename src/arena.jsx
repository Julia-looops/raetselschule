const { useState, useEffect, useRef } = React;

/* ============================================================
   ZAHLODEX — DIE RECHEN-ARENA
   Zweites Spiel der Rätselschule. Nicht Texträtsel, sondern
   Automatisieren: 1×1 und Plus/Minus im Zahlenraum bis 20.

   Die Grundidee
   -------------
   Kinder merken sich hunderte Pokémon, weil jedes eine Nummer,
   einen Namen, ein Gesicht, einen Typ und eine Entwicklung hat —
   und weil man sie sammeln muss. Genau das machen wir mit Zahlen:

       JEDES ERGEBNIS IST EIN WESEN.
       7 · 8 ruft Wesen Nr. 56 herbei.

   Wer "7 · 8" kann, kennt ein Wesen. Wer es nicht kann, dem
   entwischt es. Damit ist das Auswendigwissen kein Selbstzweck
   mehr, sondern der Weg zur Sammlung.

   Alles Weitere fällt aus der Mathematik heraus, nicht aus
   Marketing:
     · TYP    = die Reihen, in denen die Zahl vorkommt (24 ist
                Typ 3, 4, 6, 8).
     · SELTEN = wie oft die Zahl im 1×1 vorkommt. 56 gibt es nur
                als 7·8 — selten. 24 gibt es viermal — häufig.
                Die legendären Wesen sind damit automatisch genau
                die schweren Kernaufgaben (42, 48, 49, 54, 56, 63,
                64, 72, 81).
     · ENTWICKLUNG = Verdoppeln. 7 → 14 → 28 → 56. Das ist die
                wichtigste Rechenstrategie im 1×1, hier sieht sie
                aus wie eine Entwicklungslinie.
     · SPIEGEL-WESEN = die Quadratzahlen (a·a).

   Darunter läuft ein Karteikasten (Leitner): gefangene Wesen
   wollen nach 10 Minuten, 1 Tag, 3, 7 und 21 Tagen wieder besucht
   werden. Das Kind sieht davon nichts — es sieht "Zwölfhorn
   wartet auf dich".
   ============================================================ */


/* ============================================================
   DIE WESEN
   Nur Zahlen, die man auch treffen kann, haben ein Wesen:
   die 42 Ergebnisse des 1×1 plus 11, 13, 17, 19 aus dem
   Zahlenraum bis 20. Macht 46 Wesen — sammelbar, nicht endlos.
   Nummer = Ergebnis. Name und Bild darf man frei ändern.
   ============================================================ */
const WESEN_LISTE = [
  [1, "Einzi", "🥚"],
  [2, "Zwibbel", "🐛"],
  [3, "Dreiflug", "🐝"],
  [4, "Viertaps", "🐢"],
  [5, "Fünkel", "🌟"],
  [6, "Sechsbein", "🐜"],
  [7, "Siebtatz", "🐈"],
  [8, "Achtopus", "🐙"],
  [9, "Neunschweif", "🦊"],
  [10, "Zehnzahn", "🦈"],
  [11, "Elfino", "🧚"],
  [12, "Zwölfhorn", "🦌"],
  [13, "Dreizonk", "🦇"],
  [14, "Vierzeck", "🐞"],
  [15, "Fünfzack", "🦔"],
  [16, "Sechzock", "🐡"],
  [17, "Siebzarr", "🦂"],
  [18, "Achtzold", "🦉"],
  [19, "Neunzir", "🐺"],
  [20, "Zwanzo", "🐲"],
  [21, "Ripsel", "🦎"],
  [24, "Trampa", "🐘"],
  [25, "Quinta", "🐊"],
  [27, "Trippel", "🐖"],
  [28, "Schluri", "🦥"],
  [30, "Nashor", "🦏"],
  [32, "Robbo", "🦭"],
  [35, "Lamula", "🦙"],
  [36, "Sextus", "🦑"],
  [40, "Wallo", "🐋"],
  [42, "Antwortus", "🦧"],
  [45, "Fuchsel", "🦝"],
  [48, "Sauri", "🦕"],
  [49, "Spiegelsieb", "💎"],
  [50, "Zebro", "🦓"],
  [54, "Mammuto", "🦣"],
  [56, "Rexi", "🦖"],
  [60, "Walta", "🐳"],
  [63, "Adlon", "🦅"],
  [64, "Spiegelacht", "💠"],
  [70, "Giraffo", "🦒"],
  [72, "Grimm", "👹"],
  [80, "Muhro", "🐄"],
  [81, "Spiegelneun", "💫"],
  [90, "Löwar", "🦁"],
  [100, "Hundrax", "🐉"],
];

const WESEN = {};
WESEN_LISTE.forEach(([nr, name, bild]) => (WESEN[nr] = { nr, name, bild }));
const ALLE_NR = WESEN_LISTE.map(([nr]) => nr);


/* ============================================================
   MATHEMATIK DER WESEN
   Typ, Seltenheit und Entwicklung werden gerechnet, nicht
   ausgedacht. Wer die Namensliste ändert, muss hier nichts tun.
   ============================================================ */

/* alle geordneten Paare a·b = n mit a,b aus dem 1×1 */
function paare(n) {
  const p = [];
  for (let a = 1; a <= 10; a++) {
    if (n % a === 0 && n / a <= 10) p.push([a, n / a]);
  }
  return p;
}

/* ungeordnet: 24 = 3·8 und 4·6 (nicht doppelt gezählt) */
function paareUngeordnet(n) {
  return paare(n).filter(([a, b]) => a <= b);
}

/* in welchen Reihen kommt die Zahl vor */
function typen(n) {
  const t = new Set();
  paare(n).forEach(([a, b]) => {
    if (a >= 2) t.add(a);
    if (b >= 2) t.add(b);
  });
  return [...t].sort((x, y) => x - y);
}

function istSpiegel(n) {
  const w = Math.round(Math.sqrt(n));
  return w * w === n && w <= 10;
}

/* Seltenheit — fällt aus der Anzahl der Zerlegungen heraus */
function seltenheit(n) {
  const u = paareUngeordnet(n);
  if (u.length === 0) return { rang: "wiese", text: "Wiesenwesen", sterne: 1 };
  if (n === 100) return { rang: "meister", text: "Meisterwesen", sterne: 4 };
  /* legendär = nur mit zwei großen Zahlen erreichbar. Die 10er sind
     leicht und zählen nicht dazu. Übrig bleiben genau die neun
     schweren Kernaufgaben: 42, 48, 49, 54, 56, 63, 64, 72, 81. */
  if (u.every(([a, b]) => a >= 6 && a <= 9 && b >= 6 && b <= 9))
    return { rang: "legendaer", text: "Legendär", sterne: 3 };
  /* Zahlen, zu denen nur die 1er-Reihe führt (2, 3, 5, 7 …) */
  if (u.length === 1 && u[0][0] === 1)
    return { rang: "einzel", text: "Einzelgänger", sterne: 1 };
  if (u.length === 1) return { rang: "selten", text: "Selten", sterne: 2 };
  return { rang: "haeufig", text: "Häufig", sterne: 1 };
}

const RANG_FARBE = {
  wiese: "text-lime-300",
  einzel: "text-lime-200",
  haeufig: "text-emerald-200",
  selten: "text-sky-300",
  legendaer: "text-amber-300",
  meister: "text-fuchsia-300",
};

/* Entwicklungslinie = Verdoppeln. 7 → 14 → 28 → 56 */
function linie(n) {
  let basis = n;
  while (basis % 2 === 0) basis = basis / 2;
  const l = [];
  for (let x = basis; x <= 100; x = x * 2) if (WESEN[x]) l.push(x);
  return l;
}


/* ============================================================
   DIE RECHNUNGEN
   Eine "Rechnung" (Fakt) ruft ein Wesen. Ein Wesen kann von
   mehreren Rechnungen gerufen werden — das ist der Punkt:
   wer 24 fangen will, lernt 3·8 UND 4·6.
   ============================================================ */

function faktenMalfeld(n) {
  return paare(n).map(([a, b]) => ({
    id: "m" + a + "x" + b,
    welt: "malfeld",
    a, b, op: "·",
    text: a + " · " + b,
    antwort: n,
  }));
}

function faktenWiese(n) {
  const f = [];
  for (let a = 1; a < n; a++) {
    const b = n - a;
    if (a <= 19 && b <= 19) {
      f.push({ id: "p" + a + "+" + b, welt: "wiese", a, b, op: "+", text: a + " + " + b, antwort: n });
    }
  }
  for (let k = 1; n + k <= 20; k++) {
    f.push({ id: "s" + (n + k) + "-" + k, welt: "wiese", a: n + k, b: k, op: "−", text: (n + k) + " − " + k, antwort: n });
  }
  /* Plus und Minus abwechselnd, damit beides drankommt */
  const plus = f.filter((x) => x.op === "+");
  const minus = f.filter((x) => x.op === "−");
  const gemischt = [];
  for (let i = 0; i < Math.max(plus.length, minus.length); i++) {
    if (plus[i]) gemischt.push(plus[i]);
    if (minus[i]) gemischt.push(minus[i]);
  }
  return gemischt;
}

function fakten(welt, n) {
  return welt === "malfeld" ? faktenMalfeld(n) : faktenWiese(n);
}

/* Die Rechnungen, die ein Wesen wirklich stellt. Aufgaben mit 1
   (10 · 1, 4 + 1) sind zu leicht und werden übersprungen, solange
   genug andere da sind — sie zählen deshalb auch nicht mit, wenn
   gezählt wird, was ein Kind schon kann. */
function zielFakten(welt, nr) {
  const alle = fakten(welt, nr);
  const ohneEins = alle.filter((x) => x.a !== 1 && x.b !== 1);
  return ohneEins.length >= 2 ? ohneEins : alle;
}

/* Umkehraufgabe: statt "6 · 7 = ?" heißt es "6 · ? = 42".
   Gefragt ist immer die zweite Zahl. Das deckt Lücken auf, die beim
   Vorwärtsrechnen unsichtbar bleiben — wer nur die Reihe aufsagen
   kann, kommt hier nicht weiter. */
function alsUmkehr(fakt) {
  return {
    ...fakt,
    id: fakt.id + "?",
    basis: fakt.id,
    umkehr: true,
    antwort: fakt.b,
    ergebnis: fakt.antwort,
    text: fakt.a + " " + fakt.op + " ? = " + fakt.antwort,
  };
}

/* Erst wenn ein Wesen schon zweimal wiedergesehen wurde, wird
   gelegentlich rückwärts gefragt. Vorher wäre es zu früh. */
const UMKEHR_AB_STUFE = 2;
const UMKEHR_ANTEIL = 0.3;

/* Wesen, die es in dieser Welt überhaupt gibt */
const NR_MALFELD = ALLE_NR.filter((n) => paare(n).length > 0);
const NR_WIESE = ALLE_NR.filter((n) => n <= 20);


/* ============================================================
   REIHENFOLGE — was zuerst gelernt wird
   Vom Sicheren zum Schweren. Die legendären Wesen (die schweren
   Kernaufgaben) kommen bewusst zuletzt.
   ============================================================ */
const ORDNUNG = {
  wiese: [10, 5, 2, 4, 6, 8, 3, 7, 9, 1, 20, 11, 12, 15, 13, 14, 16, 17, 18, 19],
  malfeld: [
    /* 1 — die tragenden Reihen (2er, 5er, 10er), bewusst durchmischt:
       laegen sie hintereinander, koennte man die Antwort raten, ohne
       die Aufgabe zu lesen. */
    10, 4, 20, 5, 2, 50, 30, 8, 15, 40,
    6, 25, 60, 12, 35, 70, 14, 45, 80, 16, 90, 18, 100,
    /* 2 — Spiegelwesen, 3er und 4er */
    1, 9, 3, 24, 36, 7, 21, 32, 27, 28,
    /* 3 — die schweren Kerne */
    49, 64, 42, 81, 56, 48, 63, 54, 72,
  ],
};

const WELT = {
  wiese: {
    id: "wiese",
    name: "Wiesenweg",
    bild: "🌿",
    was: "Plus und Minus bis 20",
    nrs: NR_WIESE,
  },
  malfeld: {
    id: "malfeld",
    name: "Malfeld",
    bild: "✖️",
    was: "das kleine Einmaleins",
    nrs: NR_MALFELD,
  },
};


/* ============================================================
   KARTEIKASTEN
   Stufe 0 = noch wild. Ab Stufe 1 gefangen, dann Wiedersehen in
   immer größeren Abständen. Falsch heißt nie "verloren", nur
   "eine Stufe zurück".
   ============================================================ */
const ABSTAND = [0, 10, 60 * 24, 60 * 24 * 3, 60 * 24 * 7, 60 * 24 * 21]; // Minuten
const MAX_STUFE = ABSTAND.length - 1;
const FANG_TREFFER = 3;   // so oft richtig, dann ist es gefangen
const BLITZ_MS = 4000;    // schneller als das = blitzschnell
const LANGSAM_MS = 10000; // langsamer als das = richtig, aber unsicher
const RUNDE_LAENGE = 10;
const BLITZ_FRAGEN = 10;      // Länge einer Blitzrunde
const BLITZ_AB_WESEN = 6;     // so viele gefangene Wesen braucht es dafür
const LUFT_HOLEN = 2;         // so oft darf die Uhr pro Runde anhalten
const TRICK_KOSTEN = 5;       // ⚡ für einen Trick
const MAX_TRICKS = 3;         // so viele kann ein Wesen lernen

/* ============================================================
   ZEIT IN DER BLITZRUNDE
   Eine feste Zeit für alle wäre ungerecht: 3 · 2 und 7 · 8 sind
   nicht gleich schwer. Das Spiel weiß aber, welche Zahlen schwer
   sind — daher kommt auch die Seltenheit der Wesen. Also bekommt
   jede Rechnung die Zeit, die sie verdient. Rund eine Sekunde davon
   geht immer fürs Tippen drauf.
   ============================================================ */
function schwereZahl(x) {
  return x >= 6 && x <= 9; // die 10er sind leicht, die 6er bis 9er nicht
}

function blitzZeit(fakt) {
  if (fakt.op === "·") {
    if (schwereZahl(fakt.a) && schwereZahl(fakt.b)) return 8;
    if (schwereZahl(fakt.a) || schwereZahl(fakt.b)) return 6;
    return 4;
  }
  /* Plus und Minus: der Zehnerübergang ist das Schwere daran */
  const uebergang =
    fakt.op === "+" ? fakt.a < 10 && fakt.a + fakt.b > 10 : fakt.a > 10 && fakt.a - fakt.b < 10;
  return uebergang ? 6 : 4;
}

/* ============================================================
   TRICKS
   Florentinas Idee: wer blitzschnell rechnet, kann seinen Wesen
   etwas beibringen. Jede blitzschnelle Antwort gibt einen ⚡, fünf
   davon sind ein Trick — und welches Wesen ihn lernt, entscheidet
   sie selbst. Das ist der Unterschied zwischen "freigeschaltet"
   und "beigebracht".

   Welcher Trick, sagt der Typ des Wesens: ein 8er-Wesen lernt den
   Achtsturm. Wesen ohne Reihe (11, 13, 17, 19) lernen Wiesentricks.
   Gebraucht werden die Tricks in der Arena.
   ============================================================ */
const TRICK_REIHE = {
  2: { name: "Doppelschlag", bild: "⚡" },
  3: { name: "Dreizack", bild: "🔱" },
  4: { name: "Vierwirbel", bild: "🌀" },
  5: { name: "Handstreich", bild: "✋" },
  6: { name: "Sechserwelle", bild: "🌊" },
  7: { name: "Glücksklaue", bild: "🍀" },
  8: { name: "Achtsturm", bild: "🌪️" },
  9: { name: "Neunfeuer", bild: "🔥" },
  10: { name: "Zehnerdonner", bild: "🌩️" },
};

/* für Wesen ohne Reihe (11, 13, 17, 19) */
const TRICK_WIESE = [
  { name: "Brückenschlag", bild: "🌉" },
  { name: "Zehnerblick", bild: "👁️" },
  { name: "Zwanzigersprung", bild: "🦘" },
];

/* zum Auffüllen, wenn ein Wesen weniger als drei Reihen hat */
const TRICK_ALLGEMEIN = [
  { name: "Doppelknall", bild: "💥" },
  { name: "Sternenhieb", bild: "💫" },
  { name: "Schutzschild", bild: "🛡️" },
];

/* Welche Tricks kann dieses Wesen lernen, in welcher Reihenfolge?
   Die größte Reihe zuerst — die ist die stolzeste. */
function trickListe(nr) {
  const reihen = typen(nr).slice().sort((a, b) => b - a);
  const aus = reihen.map((r) => ({ ...TRICK_REIHE[r], reihe: r }));
  const rest = reihen.length === 0 ? TRICK_WIESE : TRICK_ALLGEMEIN;
  rest.forEach((tr) => aus.push({ ...tr, reihe: 0 }));
  return aus.slice(0, MAX_TRICKS);
}

function trickZahl(t, nr) {
  const e = t.wesen[nr];
  return (e && e.tr) || 0;
}

function gelernteTricks(t, nr) {
  return trickListe(nr).slice(0, trickZahl(t, nr));
}

function kannNochLernen(t, nr) {
  return trickZahl(t, nr) < trickListe(nr).length;
}

function trickPunkte(t) {
  return t.punkte || 0;
}

function tricksGesamt(t) {
  return Object.values(t.wesen).reduce((s2, e) => s2 + ((e && e.tr) || 0), 0);
}
const REVIER = 4;         // so viele wilde Wesen gleichzeitig
const ENTDECKER_REVIER = 3; // so viele Wesen zeigen gleichzeitig Neues
const ENTDECKER_PLAETZE = 2; // so oft höchstens je Wesen und Runde

/* Der Abstand bekommt etwas Streuung (±15 %). Ohne sie werden alle
   Wesen einer Sitzung am nächsten Tag gleichzeitig fällig — und dann
   steht da "20 Wesen wollen dich wiedersehen", was erschlägt. */
function faelligIn(stufe) {
  const minuten = ABSTAND[Math.min(stufe, MAX_STUFE)];
  const streuung = 0.85 + Math.random() * 0.3;
  return Date.now() + minuten * streuung * 60000;
}

/* ============================================================
   WIE SCHNELL KOMMT EIN WESEN WIEDER?

   Nicht jede Rechnung braucht gleich viele Wiedersehen. Wer "10 · 4"
   aus dem Stand sagt, muss es nicht in drei Tagen nochmal sagen; wer
   bei "7 · 8" überlegen muss, schon. Also entscheidet das Tempo:

     blitzschnell (< 4 s)   zwei Stufen weiter — bald lange Ruhe
     normal                 eine Stufe weiter
     langsam (> 10 s)       Stufe bleibt, kommt bald wieder
     mit Beere              Stufe bleibt (Hilfe kostet nichts,
                            beweist aber auch nichts)
     falsch                 eine Stufe zurück

   Damit räumt sich die 1er- und die 10er-Reihe von selbst ab,
   während die schweren Kerne im Umlauf bleiben.
   ============================================================ */
function tempoVon(dauer, mitHilfe, richtig) {
  if (!richtig) return "falsch";
  if (mitHilfe) return "hilfe";
  if (dauer <= BLITZ_MS) return "blitz";
  if (dauer >= LANGSAM_MS) return "langsam";
  return "normal";
}

function nachWiedersehen(f, tempo) {
  const n = { ...f };
  if (tempo === "falsch") {
    n.s = Math.max(1, n.s - 1);
    n.f = faelligIn(1);
    return n;
  }
  if (tempo === "blitz") n.s = Math.min(MAX_STUFE, n.s + 2);
  else if (tempo === "normal") n.s = Math.min(MAX_STUFE, n.s + 1);
  if (tempo === "langsam" || tempo === "hilfe") {
    /* Die Stufe bleibt — verloren ist nichts. Aber wiedersehen wollen
       wir es bald: wer bei einer alten Bekannten überlegen muss, soll
       sie nicht erst in drei Wochen wieder treffen. Eine einzige
       schnelle Antwort schickt sie danach gleich wieder in die Ruhe. */
    n.f = faelligIn(Math.min(n.s, 2));
    return n;
  }
  n.f = faelligIn(n.s);
  return n;
}


/* ============================================================
   TON — selbst erzeugt, keine Dateien, läuft offline
   ============================================================ */
const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  C6: 1046.5, E6: 1318.5,
};

const Ton = {
  ctx: null,
  an: true,
  start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  klang(freq, start, dauer, lautst = 0.16, form = "triangle") {
    if (!this.an) return;
    const ctx = this.start();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = form;
    o.frequency.value = freq;
    const t = ctx.currentTime + start;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(lautst, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dauer + 0.05);
  },
  richtig() {
    [NOTE.E5, NOTE.G5].forEach((f, i) => this.klang(f, i * 0.07, 0.25, 0.13));
  },
  blitz() {
    [NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => this.klang(f, i * 0.05, 0.3, 0.14, "square"));
  },
  nochmal() {
    this.klang(NOTE.A4, 0, 0.14, 0.09);
    this.klang(NOTE.G4, 0.11, 0.2, 0.09);
  },
  tippen() {
    this.klang(NOTE.C5, 0, 0.05, 0.05, "sine");
  },
  wackeln() {
    this.klang(NOTE.C4, 0, 0.12, 0.09, "sine");
  },
  gefangen() {
    [[NOTE.C5, 0], [NOTE.E5, 0.11], [NOTE.G5, 0.22], [NOTE.C6, 0.34], [NOTE.E6, 0.48]]
      .forEach(([f, t]) => this.klang(f, t, 0.6, 0.16));
  },
  orden() {
    [[NOTE.G4, 0], [NOTE.C5, 0.12], [NOTE.E5, 0.24], [NOTE.G5, 0.36], [NOTE.C6, 0.5], [NOTE.G5, 0.66], [NOTE.C6, 0.78]]
      .forEach(([f, t]) => this.klang(f, t, 0.7, 0.15));
  },
};


/* ============================================================
   EIGENE ANIMATIONEN (Tailwind kann das nicht)
   ============================================================ */
function Stile() {
  return (
    <style>{`
      html,body{background:#062e26;}
      @keyframes wackel{0%,100%{transform:rotate(0)}20%{transform:rotate(-18deg)}
        40%{transform:rotate(16deg)}60%{transform:rotate(-12deg)}80%{transform:rotate(8deg)}}
      @keyframes auftauchen{from{opacity:0;transform:scale(.4) translateY(20px)}
        to{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes pochen{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
      @keyframes rutschen{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      @keyframes zittern{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}
        75%{transform:translateX(7px)}}
      @keyframes funkeln{0%,100%{opacity:.35}50%{opacity:1}}
      .a-wackel{animation:wackel .7s ease-in-out}
      .a-auftauchen{animation:auftauchen .5s cubic-bezier(.2,1.3,.5,1)}
      .a-pochen{animation:pochen 1.4s ease-in-out infinite}
      .a-rutschen{animation:rutschen .3s ease-out}
      .a-zittern{animation:zittern .35s ease-in-out}
      .a-funkeln{animation:funkeln 1.6s ease-in-out infinite}
      .kein-blau{-webkit-tap-highlight-color:transparent;}
    `}</style>
  );
}


/* ============================================================
   RECHENBILDER
   Nicht Deko: das Punktefeld zeigt, warum 7·8 = 5·8 + 2·8 ist,
   das Zwanzigerfeld zeigt den Zehnerübergang.
   ============================================================ */

function Punkt({ farbe }) {
  return <div className={"h-3 w-3 rounded-full sm:h-3.5 sm:w-3.5 " + farbe} />;
}

/* a Reihen zu b Punkten, nach 5 Spalten/Reihen getrennt */
function Punktefeld({ a, b }) {
  const reihen = [];
  for (let i = 0; i < a; i++) {
    const spalten = [];
    for (let j = 0; j < b; j++) {
      spalten.push(
        <Punkt key={j} farbe={i < 5 ? "bg-amber-300" : "bg-sky-300"} />
      );
      if (j === 4 && b > 5) spalten.push(<div key={"l" + j} className="w-2" />);
    }
    reihen.push(
      <div key={i} className="flex items-center gap-1">
        {spalten}
      </div>
    );
    if (i === 4 && a > 5) reihen.push(<div key={"h" + i} className="h-2" />);
  }
  return <div className="inline-flex flex-col gap-1">{reihen}</div>;
}

/* Zwanzigerfeld: zwei Zehnerreihen, zeigt den Übergang */
function Zwanzigerfeld({ voll, dazu, weg }) {
  const felder = [];
  for (let i = 0; i < 20; i++) {
    let farbe = "bg-emerald-950 border-emerald-700";
    if (i < voll) farbe = "bg-amber-300 border-amber-300";
    else if (i < voll + (dazu || 0)) farbe = "bg-sky-300 border-sky-300";
    if (weg && i >= voll - weg && i < voll) farbe = "bg-rose-400/40 border-rose-300 border-dashed";
    felder.push(<div key={i} className={"h-5 w-5 rounded-md border-2 sm:h-6 sm:w-6 " + farbe} />);
  }
  return (
    <div className="inline-flex flex-col gap-1">
      <div className="flex gap-1">
        {felder.slice(0, 5)}<div className="w-2" />{felder.slice(5, 10)}
      </div>
      <div className="flex gap-1">
        {felder.slice(10, 15)}<div className="w-2" />{felder.slice(15, 20)}
      </div>
    </div>
  );
}

/* passendes Bild zur Rechnung */
function Rechenbild({ fakt }) {
  if (fakt.op === "·") return <Punktefeld a={fakt.a} b={fakt.b} />;
  if (fakt.op === "+") return <Zwanzigerfeld voll={fakt.a} dazu={fakt.b} />;
  return <Zwanzigerfeld voll={fakt.a} weg={fakt.b} />;
}


/* ============================================================
   BEEREN — die Hilfen
   Hilfe kostet nie etwas. Sie macht nur den Weg sichtbar.
   ============================================================ */
function beeren(fakt) {
  const b = [];
  if (fakt.umkehr) {
    if (fakt.op === "·") {
      b.push({
        bild: "🍓",
        name: "Punktbeere",
        text: "Wie viele Reihen zu " + fakt.a + " braucht man für " + fakt.ergebnis + "?",
        bild2: true,
      });
      b.push({
        bild: "🪜",
        name: "Leiterbeere",
        text: "Zähl die " + fakt.a + "er-Reihe hoch, bis du bei " + fakt.ergebnis + " bist.",
      });
      b.push({
        bild: "🔁",
        name: "Teilbeere",
        text: "Anders gefragt: wie oft passt " + fakt.a + " in " + fakt.ergebnis + "?",
      });
    } else if (fakt.op === "+") {
      b.push({
        bild: "🍓",
        name: "Feldbeere",
        text: "Von " + fakt.a + " bis " + fakt.ergebnis + " — wie viele Felder fehlen?",
        bild2: true,
      });
      b.push({
        bild: "🌉",
        name: "Brückenbeere",
        text: "Erst von " + fakt.a + " auf 10, dann weiter bis " + fakt.ergebnis + ".",
      });
      b.push({
        bild: "🔁",
        name: "Umkehrbeere",
        text: "Denk minus: " + fakt.ergebnis + " − " + fakt.a + " = ?",
      });
    } else {
      b.push({
        bild: "🍓",
        name: "Feldbeere",
        text: "Von " + fakt.a + " auf " + fakt.ergebnis + " — wie viel muss weg?",
        bild2: true,
      });
      b.push({
        bild: "🔁",
        name: "Umkehrbeere",
        text: "Denk plus: " + fakt.ergebnis + " + ? = " + fakt.a + ".",
      });
    }
    return b;
  }
  if (fakt.op === "·") {
    const { a, b: bb } = fakt;
    b.push({
      bild: "🍓",
      name: "Punktbeere",
      text: "So viele Punkte sind das: " + a + " Reihen zu " + bb + ".",
      bild2: true,
    });
    if (bb > 5) {
      b.push({
        bild: "🍋",
        name: "Zerlegbeere",
        text: a + " · " + bb + " = " + a + " · 5 + " + a + " · " + (bb - 5) +
              " = " + a * 5 + " + " + a * (bb - 5),
      });
    } else if (a > 5) {
      b.push({
        bild: "🍋",
        name: "Zerlegbeere",
        text: a + " · " + bb + " = 5 · " + bb + " + " + (a - 5) + " · " + bb +
              " = " + 5 * bb + " + " + (a - 5) * bb,
      });
    } else {
      const reihe = [];
      for (let i = 1; i <= bb; i++) reihe.push(a * i);
      b.push({
        bild: "🍋",
        name: "Reihenbeere",
        text: "In " + a + "er-Schritten zählen: " + reihe.join(", ") + ".",
      });
    }
    if (bb > 1) {
      b.push({
        bild: "🫐",
        name: "Nachbarbeere",
        text: a + " · " + (bb - 1) + " = " + a * (bb - 1) + ". Ein " + a + "er mehr: " +
              a * (bb - 1) + " + " + a + ".",
      });
    }
    b.push({
      bild: "🔁",
      name: "Tauschbeere",
      text: a + " · " + bb + " ist genauso viel wie " + bb + " · " + a + ". Immer.",
    });
  } else if (fakt.op === "+") {
    const rest = 10 - fakt.a;
    b.push({ bild: "🍓", name: "Feldbeere", text: "Leg es dir hin: " + fakt.a + " gelbe, " + fakt.b + " blaue.", bild2: true });
    if (fakt.a < 10 && fakt.b > rest && rest > 0) {
      b.push({
        bild: "🌉",
        name: "Brückenbeere",
        text: "Erst auf 10: " + fakt.a + " + " + rest + " = 10. Dann der Rest: 10 + " + (fakt.b - rest) + ".",
      });
    }
    b.push({ bild: "🔁", name: "Tauschbeere", text: fakt.a + " + " + fakt.b + " ist genauso viel wie " + fakt.b + " + " + fakt.a + "." });
  } else {
    const bis10 = fakt.a - 10;
    b.push({ bild: "🍓", name: "Feldbeere", text: "Nimm " + fakt.b + " von " + fakt.a + " weg.", bild2: true });
    if (fakt.a > 10 && fakt.b > bis10 && bis10 > 0) {
      b.push({
        bild: "🌉",
        name: "Brückenbeere",
        text: "Erst auf 10: " + fakt.a + " − " + bis10 + " = 10. Dann noch " + (fakt.b - bis10) + " weg.",
      });
    }
    b.push({
      bild: "🔁",
      name: "Umkehrbeere",
      text: "Denk plus: " + fakt.b + " + ? = " + fakt.a + ".",
    });
  }
  return b.slice(0, 3);
}


/* ============================================================
   SPIELSTAND
   Eigener Schlüssel — der Fortschritt der Rätselschule bleibt
   unberührt. Jedes Kind hat eine eigene Trainerkarte, damit
   Florentina und ihre Freunde dasselbe Gerät benutzen können.
   ============================================================ */
/* wird beim Bauen ersetzt, siehe tools/build.mjs */
const FASSUNG = "__FASSUNG__";

const SPEICHER = "florentina-zahlodex";
const TRAINER_BILDER = ["🐾", "🧢", "🎒", "🪄", "🛼", "🦄", "🚀", "🍀"];

function leererTrainer(bild) {
  return {
    bild: bild || "🐾",
    wesen: {},
    orden: [],
    welt: "wiese",
    punkte: 0,
    stat: { richtig: 0, falsch: 0, blitze: 0, runden: 0, duelle: 0 },
  };
}

const KURZ = { wiese: "w", malfeld: "m" };

function holF(t, welt, nr) {
  const e = t.wesen[nr];
  return (e && e[KURZ[welt]]) || null;
}

/* neuer Trainer-Zustand mit geändertem Fortschritt für ein Wesen */
function mitF(t, welt, nr, wert) {
  const wesen = { ...t.wesen, [nr]: { ...(t.wesen[nr] || {}), [KURZ[welt]]: wert } };
  return { ...t, wesen };
}

/* ============================================================
   ABDECKUNG — Rechnungen zählen, nicht nur Wesen

   Ein Wesen gilt nach drei richtigen Antworten als gefangen. Im
   Malfeld sind das alle seine Rechnungen (im Schnitt 2,4). Auf dem
   Wiesenweg hat ein Wesen aber 16 Rechnungen — "gefangen" heißt
   dort also nur "einmal irgendwie erreicht", nicht "kann ich".

   Deshalb merkt sich das Spiel je Wesen, welche seiner Rechnungen
   schon einmal richtig waren. Der Streifzug zieht bevorzugt die,
   die noch fehlen, und im Zahlodex steht ehrlich, wie weit ein
   Wesen erforscht ist.
   ============================================================ */
function abdeckung(t, welt, nr) {
  const f = holF(t, welt, nr);
  const ziel = zielFakten(welt, nr);
  const hab = f && f.g ? ziel.filter((x) => f.g.includes(x.id)).length : 0;
  return { hab, ziel: ziel.length };
}

function erforscht(t, welt, nr) {
  const a = abdeckung(t, welt, nr);
  return a.hab >= a.ziel;
}

/* Wesen, die gefangen sind, aber noch Rechnungen offen haben */
function nochWasZuZeigen(t, welt) {
  return WELT[welt].nrs.filter((nr) => {
    const f = holF(t, welt, nr);
    return f && f.s >= 1 && !erforscht(t, welt, nr);
  });
}

function erforschteZahl(t, welt) {
  return WELT[welt].nrs.filter((nr) => {
    const f = holF(t, welt, nr);
    return f && f.s >= 1 && erforscht(t, welt, nr);
  }).length;
}

/* eine Rechnung als "saß schon" vermerken */
function merkeFakt(f, fakt) {
  const id = fakt.basis || fakt.id;
  const g = f.g || [];
  return g.includes(id) ? f : { ...f, g: [...g, id] };
}

function istGefangen(t, nr) {
  const e = t.wesen[nr];
  return !!(e && ((e.w && e.w.s >= 1) || (e.m && e.m.s >= 1)));
}

function anzahlGefangen(t) {
  return ALLE_NR.filter((nr) => istGefangen(t, nr)).length;
}

function faelligeZahl(t, welt) {
  const jetzt = Date.now();
  return WELT[welt].nrs.filter((nr) => {
    const f = holF(t, welt, nr);
    return f && f.s >= 1 && f.f <= jetzt;
  }).length;
}

/* ============================================================
   Welche Wesen kommen in dieser Runde dran?
   Erst die fälligen (Karteikasten), dann bis zu drei wilde
   Wesen aus der Lernreihenfolge.
   ============================================================ */
function baueRunde(t, welt, laenge) {
  const jetzt = Date.now();
  const faellig = WELT[welt].nrs
    .filter((nr) => {
      const f = holF(t, welt, nr);
      return f && f.s >= 1 && f.f <= jetzt;
    })
    .sort((a, b) => holF(t, welt, a).f - holF(t, welt, b).f);

  const angefangen = ORDNUNG[welt].filter((nr) => {
    const f = holF(t, welt, nr);
    return f && f.s === 0;
  });
  const unberuehrt = ORDNUNG[welt].filter((nr) => !holF(t, welt, nr));
  const revier = angefangen.slice(0, REVIER);
  while (revier.length < REVIER && unberuehrt.length) revier.push(unberuehrt.shift());

  const gefangen = WELT[welt].nrs.filter((nr) => {
    const f = holF(t, welt, nr);
    return f && f.s >= 1;
  });

  const roh = [];

  /* Wiedersehen: höchstens die Hälfte der Runde */
  const wieviel = Math.min(faellig.length, Math.ceil(laenge / 2));
  for (let i = 0; i < wieviel; i++) roh.push(faellig[i]);

  /* Fangen: die wilden Wesen reihum auffüllen, aber nur bis drei
     Viertel der Runde — der Rest wird aufgefrischt. */
  const platzFuerWild = Math.max(0, Math.floor(laenge * 0.75) - roh.length);
  for (let i = 0; i < platzFuerWild && revier.length; i++) {
    roh.push(revier[i % revier.length]);
  }

  /* Entdecken: gefangene Wesen, die noch Rechnungen übrig haben, die
     nie dran waren. Das ist der eigentliche Nachschub, sobald eine
     Gegend "voll" ist — auf dem Wiesenweg hat jedes Wesen 16
     Rechnungen, nach dem Fangen sind erst drei davon gesessen. */
  const entdeckbar = nochWasZuZeigen(t, welt)
    .filter((nr) => !faellig.includes(nr))
    /* Die, denen am wenigsten fehlt, zuerst: sonst käme überall ein
       bisschen dazu und kein einziges Wesen würde je fertig. So wird
       alle paar Runden eines vollständig erforscht. */
    .sort((a, b) => {
      const fa = abdeckung(t, welt, a);
      const fb = abdeckung(t, welt, b);
      return fa.ziel - fa.hab - (fb.ziel - fb.hab);
    })
    .slice(0, ENTDECKER_REVIER);
  /* Höchstens zwei Plätze je Wesen: sonst bestünde die halbe Runde
     aus einer einzigen Antwortzahl, und man könnte wieder raten,
     ohne zu lesen. */
  const plaetze = [];
  entdeckbar.forEach((nr) => {
    for (let k = 0; k < ENTDECKER_PLAETZE; k++) plaetze.push(nr);
  });
  while (roh.length < laenge && plaetze.length) {
    roh.push(plaetze.splice(Math.floor(Math.random() * plaetze.length), 1)[0]);
  }

  /* Auffrischen: alles schon erforscht — dann eben wiederholen. */
  const auffrischbar = gefangen.filter((nr) => !faellig.includes(nr));
  while (roh.length < laenge && auffrischbar.length) {
    const i = Math.floor(Math.random() * auffrischbar.length);
    roh.push(auffrischbar.splice(i, 1)[0]);
  }

  /* Notfalls mit dem auffüllen, was da ist */
  while (roh.length < laenge) {
    const topf = revier.length ? revier : gefangen.length ? gefangen : WELT[welt].nrs;
    roh.push(topf[Math.floor(Math.random() * topf.length)]);
  }

  return mischen(roh.slice(0, laenge));
}

/* Mischen, ohne dasselbe Wesen zweimal hintereinander — sonst tippt
   man die vorige Antwort einfach nochmal ein.

   Dafür reicht kein einfaches Schütteln: wer oft vorkommt, muss früh
   drankommen, sonst bleiben am Ende nur noch seine Kopien übrig. Also
   immer aus den häufigsten wählen, die gerade nicht verboten sind —
   und unter denen zufällig, damit keine feste Abfolge entsteht. */
function mischen(liste) {
  const zaehler = new Map();
  liste.forEach((x) => zaehler.set(x, (zaehler.get(x) || 0) + 1));
  const raus = [];
  while (raus.length < liste.length) {
    const vorige = raus.length ? raus[raus.length - 1] : null;
    let kandidaten = [...zaehler.keys()].filter((x) => zaehler.get(x) > 0 && x !== vorige);
    if (kandidaten.length === 0) {
      /* nur noch Kopien des vorigen übrig — dann muss es eben sein */
      kandidaten = [...zaehler.keys()].filter((x) => zaehler.get(x) > 0);
    }
    /* streng die häufigsten nehmen — mit Nachsicht ginge die Rechnung
       am Ende nicht mehr auf und es käme doch zu Dopplungen */
    const hoechste = Math.max(...kandidaten.map((x) => zaehler.get(x)));
    const beste = kandidaten.filter((x) => zaehler.get(x) === hoechste);
    const gewaehlt = beste[Math.floor(Math.random() * beste.length)];
    zaehler.set(gewaehlt, zaehler.get(gewaehlt) - 1);
    raus.push(gewaehlt);
  }
  return raus;
}

/* Welche Rechnung ruft dieses Wesen als nächstes? Nicht reihum,
   sondern zufällig — nur nie zweimal dieselbe hintereinander.

   Rechnungen mit 1 (10 · 1, 4 · 1) werden übersprungen, solange es
   genug andere gibt: sie sind zu leicht, um etwas zu üben. */
function waehleFakt(t, welt, nr, ohneUmkehr) {
  const grund = zielFakten(welt, nr);
  const f = holF(t, welt, nr);
  /* Was noch nie saß, kommt zuerst dran — sonst würde ein Wesen mit
     16 Rechnungen ewig dieselben drei zeigen. */
  const g = (f && f.g) || [];
  const neu2 = grund.filter((x) => !g.includes(x.id));
  const vorzug = neu2.length ? neu2 : grund;
  const ohneLetzte = f && f.l ? vorzug.filter((x) => x.id !== f.l) : vorzug;
  const topf = ohneLetzte.length ? ohneLetzte : vorzug;
  const gewaehlt = topf[Math.floor(Math.random() * topf.length)];
  const reif = f && f.s >= UMKEHR_AB_STUFE;
  /* Bei "a · a" wäre die Umkehr geschenkt — die Zahl steht schon da.
     Und "1 · ? = 2" fragt gar nichts. */
  const lohnt = gewaehlt.a !== gewaehlt.b && gewaehlt.a !== 1 && gewaehlt.b !== 1;
  if (!ohneUmkehr && reif && lohnt && Math.random() < UMKEHR_ANTEIL) return alsUmkehr(gewaehlt);
  return gewaehlt;
}


/* ============================================================
   KLEINE BAUSTEINE
   ============================================================ */

function Sterne({ n }) {
  return <span>{"✦".repeat(n)}</span>;
}

function Knopf({ children, onClick, art = "haupt", klein }) {
  const stile = {
    haupt: "bg-amber-400 text-emerald-950 hover:bg-amber-300",
    ruhig: "border-2 border-emerald-500/50 text-emerald-100 hover:bg-emerald-800/50",
    gruen: "bg-emerald-500 text-emerald-950 hover:bg-emerald-400",
  };
  return (
    <button
      onClick={onClick}
      className={
        "kein-blau w-full rounded-2xl font-black shadow-lg transition active:translate-y-px " +
        (klein ? "px-4 py-2 text-sm " : "px-5 py-4 text-lg ") +
        stile[art]
      }
    >
      {children}
    </button>
  );
}

/* Kopfzeile mit Zurück-Pfeil */
function Kopf({ titel, unter, onZurueck, rechts }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {onZurueck && (
        <button
          onClick={onZurueck}
          className="kein-blau rounded-xl border-2 border-emerald-500/50 px-3 py-2 text-lg text-emerald-100"
        >
          ‹
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xl font-black text-amber-300">{titel}</h2>
        {unter && <p className="truncate text-xs text-emerald-300">{unter}</p>}
      </div>
      {rechts}
    </div>
  );
}

/* Ziffernblock — auf dem Tablet schneller als die Systemtastatur */
function Ziffernblock({ wert, setWert, onOk, gesperrt }) {
  function tippe(z) {
    if (gesperrt) return;
    Ton.tippen();
    if (z === "weg") setWert(wert.slice(0, -1));
    else if (wert.length < 3) setWert((wert + z).replace(/^0(?=\d)/, ""));
  }
  const tasten = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];
  return (
    <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
      {tasten.map((z) => (
        <button
          key={z}
          onClick={() => tippe(z)}
          className="kein-blau rounded-2xl bg-emerald-800/70 py-4 text-2xl font-black text-emerald-50 active:bg-emerald-700"
        >
          {z}
        </button>
      ))}
      <button
        onClick={() => tippe("weg")}
        className="kein-blau rounded-2xl bg-emerald-900/70 py-4 text-xl font-black text-emerald-200 active:bg-emerald-800"
      >
        ←
      </button>
      <button
        onClick={() => tippe("0")}
        className="kein-blau rounded-2xl bg-emerald-800/70 py-4 text-2xl font-black text-emerald-50 active:bg-emerald-700"
      >
        0
      </button>
      <button
        onClick={onOk}
        disabled={gesperrt || wert === ""}
        className="kein-blau rounded-2xl bg-amber-400 py-4 text-2xl font-black text-emerald-950 disabled:opacity-40 active:bg-amber-300"
      >
        ✓
      </button>
    </div>
  );
}

/* Rechnungen als kleine Kaertchen — nebeneinander mit "·" waere
   verwirrend, weil "·" selbst ein Rechenzeichen ist. */
function Rechnungen({ liste, mehr }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {liste.map((x, i) => (
        <span
          key={i}
          className="rounded-lg bg-emerald-950/60 px-2 py-1 text-sm font-bold text-emerald-100"
        >
          {x}
        </span>
      ))}
      {mehr && <span className="px-1 py-1 text-sm text-emerald-400">…</span>}
    </div>
  );
}

/* Ein Wesen als Sammelkarte */
function TrickReihe({ t, nr }) {
  const kann = gelernteTricks(t, nr);
  const alle = trickListe(nr);
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-1">
      {alle.map((tr, k) => (
        <span
          key={k}
          className={
            "rounded-full px-2 py-0.5 text-xs font-bold " +
            (k < kann.length
              ? "bg-amber-300 text-emerald-950"
              : "bg-emerald-200/60 text-emerald-500")
          }
        >
          {k < kann.length ? tr.bild + " " + tr.name : "?"}
        </span>
      ))}
    </div>
  );
}

function WesenKarte({ nr, gross, t }) {
  const w = WESEN[nr];
  const s = seltenheit(nr);
  const typenListe = typen(nr);
  return (
    <div
      className={
        "rounded-3xl border-4 p-4 text-center shadow-2xl " +
        (s.rang === "legendaer"
          ? "border-amber-400 bg-gradient-to-b from-amber-100 to-amber-50"
          : s.rang === "meister"
          ? "border-fuchsia-400 bg-gradient-to-b from-fuchsia-100 to-amber-50"
          : "border-emerald-300 bg-gradient-to-b from-emerald-50 to-white")
      }
    >
      <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
        Nr. {nr}
      </p>
      <div className={gross ? "text-8xl" : "text-6xl"}>{w.bild}</div>
      <p className="mt-1 text-2xl font-black text-emerald-950">{w.name}</p>
      <p className="text-sm font-bold text-emerald-700">
        {s.text} <Sterne n={s.sterne} />
        {istSpiegel(nr) && " · Spiegel-Wesen"}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        {typenListe.length === 0 && (
          <span className="rounded-full bg-lime-200 px-2 py-0.5 text-xs font-bold text-lime-900">
            Typ Wiese
          </span>
        )}
        {typenListe.map((r) => (
          <span
            key={r}
            className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-900"
          >
            {r}er
          </span>
        ))}
      </div>
      {t && <TrickReihe t={t} nr={nr} />}
    </div>
  );
}


/* Fangball */
function Ball({ klasse }) {
  return (
    <div
      className={
        "relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-emerald-950 bg-white shadow-xl " +
        (klasse || "")
      }
    >
      <div className="absolute inset-x-0 top-0 h-1/2 bg-rose-500" />
      <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-emerald-950" />
      <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-emerald-950 bg-white" />
    </div>
  );
}

/* Schattenriss eines noch nicht gefangenen Wesens */
function Schatten({ nr, gross }) {
  return (
    <div className={(gross ? "text-7xl" : "text-4xl") + " opacity-30 grayscale contrast-0 brightness-0"}>
      {WESEN[nr].bild}
    </div>
  );
}


/* ============================================================
   STREIFZUG — das eigentliche Üben
   Eine Runde sind zehn Rechnungen. Was drankommt, entscheidet
   der Karteikasten, nicht der Zufall.
   ============================================================ */
function Streifzug({ start, welt, speichern, onEnde }) {
  const [t, setT] = useState(start);
  const [liste] = useState(() => baueRunde(start, welt, RUNDE_LAENGE));
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState("frage"); // frage | falsch | richtig | fang | bericht
  const [eingabe, setEingabe] = useState("");
  const [hilfe, setHilfe] = useState(-1);
  const [wiederholung, setWiederholung] = useState(false);
  const [wackel, setWackel] = useState(0);
  const [neuGefangen, setNeuGefangen] = useState(null);
  const [fangArt, setFangArt] = useState("neu"); // "neu" oder "seite"
  const [bilanz, setBilanz] = useState({ richtig: 0, falsch: 0, blitze: 0, gefangen: [], seiten: [] });
  const [warBlitz, setWarBlitz] = useState(false);
  const beginn = useRef(Date.now());

  useEffect(() => {
    speichern(t);
  }, [t]);

  const nr = liste[Math.min(pos, liste.length - 1)];
  const f = holF(t, welt, nr) || { h: 0, s: 0, f: 0, x: 0 };
  const wild = f.s === 0;
  /* Die Rechnung wird einmal je Frage gezogen und festgehalten —
     sonst würde sie sich bei jedem Neuzeichnen ändern. */
  const [fakt, setFakt] = useState(() => waehleFakt(start, welt, liste[0]));
  const tipps = beeren(fakt);
  const neueRechnung = !((f.g || []).includes(fakt.basis || fakt.id));
  /* Ein Wesen, das sie aus der anderen Gegend schon hat, ist hier
     nicht "wild" — es zeigt ihr nur eine neue Seite. */
  const schonBekannt = wild && istGefangen(t, nr);

  useEffect(() => {
    beginn.current = Date.now();
    setEingabe("");
    setHilfe(-1);
    /* nach einem Fehler dieselbe Rechnung nochmal, sonst eine neue */
    if (!wiederholung) setFakt(waehleFakt(t, welt, liste[Math.min(pos, liste.length - 1)]));
  }, [pos, wiederholung]);

  /* Tastatur mitbenutzen, falls eine da ist */
  useEffect(() => {
    function taste(e) {
      if (phase !== "frage") return;
      if (/^[0-9]$/.test(e.key)) setEingabe((v) => (v.length < 3 ? (v + e.key).replace(/^0(?=\d)/, "") : v));
      else if (e.key === "Backspace") setEingabe((v) => v.slice(0, -1));
      else if (e.key === "Enter") pruefen();
    }
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  });

  /* Fangszene: dreimal wackeln, dann aufgehen */
  useEffect(() => {
    if (phase !== "fang") return;
    const uhren = [];
    [1, 2, 3].forEach((i) => {
      uhren.push(setTimeout(() => { setWackel(i); Ton.wackeln(); }, i * 750));
    });
    uhren.push(setTimeout(() => { setWackel(4); Ton.gefangen(); }, 3100));
    return () => uhren.forEach(clearTimeout);
  }, [phase]);

  function weiter() {
    if (pos + 1 >= liste.length) {
      setT((alt) => ({ ...alt, stat: { ...alt.stat, runden: alt.stat.runden + 1 } }));
      setPhase("bericht");
    } else {
      setPos(pos + 1);
      setPhase("frage");
      setWiederholung(false);
    }
  }

  function pruefen() {
    if (eingabe === "" || phase !== "frage") return;
    const richtig = Number(eingabe) === fakt.antwort;
    const dauer = Date.now() - beginn.current;
    const mitHilfe = hilfe >= 0;

    /* Wichtig: der neue Stand wird hier ausgerechnet, nicht erst in
       der setT-Funktion. Sonst wüssten wir noch nicht, ob das Wesen
       gerade gefangen wurde — React führt Aktualisierungen später aus. */
    if (!richtig) {
      Ton.nochmal();
      setBilanz((b) => ({ ...b, falsch: b.falsch + 1 }));
      let n = { ...f, x: (f.x || 0) + 1, l: fakt.basis || fakt.id };
      if (n.s === 0) n.h = Math.max(0, (n.h || 0) - 1);
      else n = nachWiedersehen(n, "falsch");
      const neu = mitF(t, welt, nr, n);
      setT({ ...neu, stat: { ...neu.stat, falsch: neu.stat.falsch + 1 } });
      setPhase("falsch");
      return;
    }

    const blitz = dauer <= BLITZ_MS && !mitHilfe && !wiederholung;
    setWarBlitz(blitz);
    if (blitz) Ton.blitz(); else Ton.richtig();

    let wurdeGefangen = false;
    const tempo = tempoVon(dauer, mitHilfe, true);
    let n = merkeFakt({ ...f, l: fakt.basis || fakt.id }, fakt);
    if (blitz) n.blitz = true;
    if (wiederholung) {
      /* Verbesserung nach einem Fehler: zählt nicht als Treffer */
    } else if (n.s === 0) {
      n.h = (n.h || 0) + 1;
      if (blitz) n.fix = (n.fix || 0) + 1; // wie oft ging es aus dem Stand?
      if (n.h >= FANG_TREFFER) {
        /* Wer beim Fangen schon dreimal blitzschnell war, braucht das
           erste Wiedersehen nicht nach zehn Minuten. */
        n.s = (n.fix || 0) >= FANG_TREFFER ? 3 : (n.fix || 0) >= 2 ? 2 : 1;
        n.f = faelligIn(n.s);
        wurdeGefangen = true;
      }
    } else if (n.f <= Date.now()) {
      /* echtes Wiedersehen: das Tempo entscheidet über den Abstand */
      n = nachWiedersehen(n, tempo);
    }
    /* Auffrischung vor der Zeit lässt den Abstand unverändert —
       sonst würde häufiges Üben die Wiedersehen immer weiter
       hinausschieben. */
    const neu = mitF(t, welt, nr, n);
    setT({
      ...neu,
      stat: {
        ...neu.stat,
        richtig: neu.stat.richtig + 1,
        blitze: neu.stat.blitze + (blitz ? 1 : 0),
      },
    });

    const warBekannt = istGefangen(t, nr);
    setBilanz((b) => ({
      ...b,
      richtig: b.richtig + 1,
      blitze: b.blitze + (blitz ? 1 : 0),
      gefangen: wurdeGefangen && !warBekannt ? [...b.gefangen, nr] : b.gefangen,
      seiten: wurdeGefangen && warBekannt ? [...b.seiten, nr] : b.seiten,
    }));

    if (wurdeGefangen) {
      setNeuGefangen(nr);
      setFangArt(warBekannt ? "seite" : "neu");
      /* Bekanntes Wesen: kein Ball, keine Fangszene — es gehört ihr ja
         schon. Nur die Meldung, dass es hier auch etwas kann. */
      setWackel(warBekannt ? 4 : 0);
      setPhase("fang");
    } else {
      setPhase("richtig");
      setTimeout(weiter, 700);
    }
  }

  /* -------------------- Bericht -------------------- */
  if (phase === "bericht") {
    const morgen = WELT[welt].nrs.filter((x) => {
      const g = holF(t, welt, x);
      return g && g.s >= 1 && g.f > Date.now() && g.f < Date.now() + 36 * 3600 * 1000;
    });
    return (
      <div className="mx-auto max-w-md p-5">
        <div className="a-auftauchen rounded-3xl bg-emerald-900/70 p-5 text-center">
          <div className="text-5xl">🎒</div>
          <h2 className="mt-2 text-2xl font-black text-amber-300">Runde geschafft!</h2>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-emerald-800/70 p-3">
              <p className="text-2xl font-black text-emerald-100">{bilanz.richtig}</p>
              <p className="text-xs text-emerald-300">richtig</p>
            </div>
            <div className="rounded-2xl bg-emerald-800/70 p-3">
              <p className="text-2xl font-black text-emerald-100">{bilanz.blitze}</p>
              <p className="text-xs text-emerald-300">blitzschnell ⚡</p>
            </div>
            <div className="rounded-2xl bg-emerald-800/70 p-3">
              <p className="text-2xl font-black text-emerald-100">
                {bilanz.gefangen.length + bilanz.seiten.length}
              </p>
              <p className="text-xs text-emerald-300">gefangen</p>
            </div>
          </div>

          {bilanz.seiten.length > 0 && (
            <div className="mt-4 rounded-2xl border-2 border-emerald-400/40 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                Neue Seite entdeckt
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {bilanz.seiten.map((x) => (
                  <div key={x} className="text-center">
                    <div className="text-4xl">{WESEN[x].bild}</div>
                    <p className="text-xs font-bold text-emerald-100">{WESEN[x].name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bilanz.gefangen.length > 0 && (
            <div className="mt-4 rounded-2xl border-2 border-amber-400/50 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Neu im Zahlodex
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {bilanz.gefangen.map((x) => (
                  <div key={x} className="text-center">
                    <div className="text-4xl">{WESEN[x].bild}</div>
                    <p className="text-xs font-bold text-emerald-100">{WESEN[x].name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bilanz.falsch > 0 && (
            <p className="mt-4 text-sm text-emerald-200">
              {bilanz.falsch === 1 ? "Eine Rechnung" : bilanz.falsch + " Rechnungen"} ist dir
              entwischt. Macht nichts — sie kommt wieder.
            </p>
          )}
          <p className="mt-3 text-sm text-emerald-300">
            {morgen.length > 0
              ? morgen.length + " Wesen wollen dich morgen wiedersehen."
              : "Im Moment wartet niemand auf dich. Fang neue Wesen!"}
          </p>

          <div className="mt-5 space-y-2">
            <Knopf onClick={onEnde}>Zurück zur Karte</Knopf>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------- Fangszene -------------------- */
  if (phase === "fang") {
    return (
      <div className="mx-auto max-w-md p-5 text-center">
        {wackel < 4 ? (
          <div className="pt-10">
            <p className="text-sm font-bold uppercase tracking-widest text-amber-300">
              Ball geworfen!
            </p>
            <div className="mt-10">
              <Ball klasse={wackel > 0 ? "a-wackel" : ""} />
            </div>
            <div className="mt-8 flex justify-center gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={
                    "h-3 w-3 rounded-full " + (wackel >= i ? "bg-amber-300" : "bg-emerald-800")
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="a-auftauchen">
            <p className="text-sm font-black uppercase tracking-widest text-amber-300">
              {fangArt === "seite" ? "Neue Seite!" : "Gefangen!"}
            </p>
            {fangArt === "seite" && (
              <p className="mt-1 text-emerald-200">
                {WESEN[neuGefangen].name} kennt sich auch{" "}
                {welt === "malfeld" ? "im Malfeld" : "auf dem Wiesenweg"} aus.
              </p>
            )}
            <div className="mt-3">
              <WesenKarte nr={neuGefangen} gross t={t} />
            </div>
            <div className="mt-4 rounded-2xl bg-emerald-900/70 p-3 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                Rechnungen, die {WESEN[neuGefangen].name} rufen
              </p>
              <Rechnungen
                liste={fakten(welt, neuGefangen).slice(0, 6).map((x) => x.text)}
                mehr={fakten(welt, neuGefangen).length > 6}
              />
            </div>
            <div className="mt-4">
              <Knopf onClick={() => { setPhase("richtig"); weiter(); }}>Weiter ⚡</Knopf>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* -------------------- Frage / Fehler -------------------- */
  const anzeige = eingabe === "" ? "?" : eingabe;
  return (
    <div className="mx-auto max-w-md p-4">
      {/* Fortschritt der Runde */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={onEnde}
          className="kein-blau rounded-xl border-2 border-emerald-500/50 px-3 py-1 text-emerald-100"
        >
          ‹
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-900">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: ((pos / liste.length) * 100).toFixed(0) + "%" }}
          />
        </div>
        <span className="text-xs font-bold text-emerald-300">
          {pos + 1}/{liste.length}
        </span>
      </div>

      {/* Wer ist gerade dran */}
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-900/60 p-3">
        {wild && !schonBekannt ? (
          <Schatten nr={nr} />
        ) : (
          <div className="text-4xl">{WESEN[nr].bild}</div>
        )}
        <div className="min-w-0 flex-1">
          {schonBekannt ? (
            <>
              <p className="text-sm font-black text-amber-300">{WESEN[nr].name}</p>
              <p className="text-xs text-emerald-300">
                zeigt dir eine neue Seite —{" "}
                {welt === "malfeld" ? "im Malfeld" : "auf dem Wiesenweg"}
              </p>
            </>
          ) : wild ? (
            <>
              <p className="text-sm font-black text-amber-300">Ein wildes Wesen!</p>
              <p className="text-xs text-emerald-300">
                Fang es mit {FANG_TREFFER} richtigen Rechnungen.
              </p>
            </>
          ) : (
            <>
              {/* Bewusst ohne Nummer: die Nummer IST das Ergebnis der
                  Rechnung, die gerade gefragt wird. */}
              <p className="text-sm font-black text-amber-300">{WESEN[nr].name}</p>
              <p className="text-xs text-emerald-300">
                {neueRechnung
                  ? "zeigt dir eine neue Rechnung ✨"
                  : "❤️".repeat(f.s) + " will dich wiedersehen"}
              </p>
            </>
          )}
        </div>
        {wild && (
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={
                  "h-3 w-3 rounded-full border-2 border-emerald-700 " +
                  ((f.h || 0) >= i ? "bg-amber-300" : "bg-emerald-950")
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Die Rechnung */}
      <div className="mt-3 rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-5 text-center shadow-2xl">
        <p className={"text-4xl font-black text-emerald-950 sm:text-5xl " + (phase === "falsch" ? "a-zittern" : "")}>
          {fakt.umkehr ? (
            <>
              {fakt.a} {fakt.op}{" "}
              <span className="rounded-xl bg-amber-200 px-2">
                {phase === "falsch" ? fakt.antwort : anzeige}
              </span>{" "}
              = {fakt.ergebnis}
            </>
          ) : (
            <>
              {fakt.text} = {phase === "falsch" ? fakt.antwort : anzeige}
            </>
          )}
        </p>
        {fakt.umkehr && phase === "frage" && (
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-600">
            Rückwärts gefragt — welche Zahl fehlt?
          </p>
        )}
        {phase === "falsch" && (
          <div className="a-rutschen mt-4">
            <p className="font-bold text-rose-700">
              Das Wesen ist ausgewichen. So sieht die Rechnung aus:
            </p>
            <div className="mt-3 flex justify-center">
              <Rechenbild fakt={fakt} />
            </div>
            <p className="mt-3 text-sm text-emerald-800">{tipps[tipps.length - 1].text}</p>
          </div>
        )}
        {phase === "frage" && hilfe >= 0 && (
          <div className="a-rutschen mt-4 rounded-2xl bg-amber-100 p-3 text-left">
            <p className="text-sm font-black text-emerald-900">
              {tipps[hilfe].bild} {tipps[hilfe].name}
            </p>
            <p className="text-sm text-emerald-800">{tipps[hilfe].text}</p>
            {tipps[hilfe].bild2 && (
              <div className="mt-2 flex justify-center">
                <Rechenbild fakt={fakt} />
              </div>
            )}
          </div>
        )}
        {phase === "richtig" && (
          <p className="a-rutschen mt-2 font-black text-emerald-700">
            {warBlitz ? "Blitzschnell! ⚡" : "Richtig!"}
          </p>
        )}
      </div>

      {phase === "falsch" ? (
        <div className="mt-4">
          <Knopf
            onClick={() => {
              setWiederholung(true);
              setPhase("frage");
              setEingabe("");
            }}
          >
            Nochmal — jetzt weiß ich es
          </Knopf>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <Ziffernblock wert={eingabe} setWert={setEingabe} onOk={pruefen} gesperrt={phase !== "frage"} />
          </div>
          <div className="mt-3 flex gap-2">
            {tipps.map((b, i) => (
              <button
                key={i}
                onClick={() => { setHilfe(i); Ton.tippen(); }}
                className={
                  "kein-blau flex-1 rounded-2xl border-2 py-2 text-xs font-bold transition " +
                  (hilfe === i
                    ? "border-amber-400 bg-amber-400/20 text-amber-200"
                    : "border-emerald-600/60 text-emerald-200")
                }
              >
                <span className="text-lg">{b.bild}</span>
                <br />
                {b.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-emerald-400">
            Beeren kosten nichts. Nimm so viele du willst.
          </p>
        </>
      )}
    </div>
  );
}


/* ============================================================
   BLITZRUNDE
   Nur schon gefangene Wesen, dafür fünf Sekunden pro Rechnung und
   keine Beeren. Hier geht es nicht ums Ausrechnen, sondern ums
   Wiedererkennen — das ist der Unterschied zwischen "kann sie
   herleiten" und "kann sie".

   Wer zögert, wird nicht bestraft: das Wesen meldet sich nur gleich
   wieder, statt erst in ein paar Tagen.
   ============================================================ */
function blitzWesen(t, welt) {
  return WELT[welt].nrs.filter((nr) => {
    const f = holF(t, welt, nr);
    return f && f.s >= 1;
  });
}

function Blitzrunde({ start, welt, speichern, onEnde }) {
  const [t, setT] = useState(start);
  const [fragen] = useState(() => {
    const topf = blitzWesen(start, welt);
    const roh = [];
    for (let i = 0; i < BLITZ_FRAGEN; i++) roh.push(topf[i % topf.length]);
    return mischen(roh).map((nr) => ({ nr, fakt: waehleFakt(start, welt, nr, true) }));
  });
  const [i, setI] = useState(0);
  const [eingabe, setEingabe] = useState("");
  const [zeit, setZeit] = useState(() => blitzZeit(fragen[0].fakt));
  const [luft, setLuft] = useState(LUFT_HOLEN);
  const [pause, setPause] = useState(false);
  const [geschnauft, setGeschnauft] = useState(false);
  const [phase, setPhase] = useState("frage"); // frage | kurz | ende | lehren
  const [letzte, setLetzte] = useState(null);  // blitz | gerechnet | langsam | falsch
  const [bilanz, setBilanz] = useState({ blitz: 0, schnell: [], langsam: [], falsch: [] });
  const [gelehrt, setGelehrt] = useState([]);

  const dran = fragen[Math.min(i, fragen.length - 1)];
  const dauer = blitzZeit(dran.fakt);

  useEffect(() => {
    speichern(t);
  }, [t]);

  /* neue Frage: Uhr neu stellen */
  useEffect(() => {
    setZeit(dauer);
    setGeschnauft(false);
    setPause(false);
  }, [i]);

  useEffect(() => {
    if (phase !== "frage" || pause) return;
    const u = setInterval(
      () => setZeit((z) => Math.max(0, Math.round((z - 0.1) * 10) / 10)),
      100
    );
    return () => clearInterval(u);
  }, [i, phase, pause]);

  useEffect(() => {
    if (phase === "frage" && !pause && zeit <= 0) bewerten("langsam");
  }, [zeit, phase, pause]);

  useEffect(() => {
    function taste(e) {
      if (phase !== "frage") return;
      if (/^[0-9]$/.test(e.key)) setEingabe((v) => (v.length < 3 ? (v + e.key).replace(/^0(?=\d)/, "") : v));
      else if (e.key === "Backspace") setEingabe((v) => v.slice(0, -1));
      else if (e.key === "Enter") pruefen();
    }
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  });

  function bewerten(art) {
    const { nr, fakt } = fragen[i];
    setLetzte(art);
    setPause(false);
    const f = holF(t, welt, nr) || { h: 0, s: 1, f: 0, x: 0 };
    let n = { ...f, l: fakt.id };
    if (art === "blitz" || art === "gerechnet") n = merkeFakt(n, fakt);
    if (art === "blitz") {
      n.blitz = true;
      /* Wer es hier aus dem Stand kann, muss es nicht bald wieder
         zeigen — dieselbe Regel wie im Streifzug. */
      if (n.f <= Date.now()) n = nachWiedersehen(n, "blitz");
      Ton.blitz();
    } else if (art === "gerechnet") {
      /* mit Luft holen geschafft: richtig, aber kein Blitz */
      Ton.richtig();
    } else {
      /* gezoegert oder daneben: das Wesen meldet sich gleich wieder */
      n.f = Date.now();
      if (art === "falsch") { n.s = Math.max(1, n.s - 1); n.x = (n.x || 0) + 1; }
      Ton.nochmal();
    }
    const neu = mitF(t, welt, nr, n);
    setT({
      ...neu,
      punkte: trickPunkte(neu) + (art === "blitz" ? 1 : 0),
      stat: {
        ...neu.stat,
        richtig: neu.stat.richtig + (art === "falsch" ? 0 : 1),
        falsch: neu.stat.falsch + (art === "falsch" ? 1 : 0),
        blitze: neu.stat.blitze + (art === "blitz" ? 1 : 0),
      },
    });
    setBilanz((b) => ({
      blitz: b.blitz + (art === "blitz" ? 1 : 0),
      /* nur wer hier blitzschnell war, darf nachher etwas lernen */
      schnell: art === "blitz" ? [...new Set([...b.schnell, nr])] : b.schnell,
      langsam: art === "langsam" ? [...b.langsam, nr] : b.langsam,
      falsch: art === "falsch" ? [...b.falsch, nr] : b.falsch,
    }));
    setPhase("kurz");
    setTimeout(() => {
      if (i + 1 >= fragen.length) {
        setPhase("ende");
      } else {
        setI(i + 1);
        setEingabe("");
        setPhase("frage");
      }
    }, art === "blitz" ? 450 : 1500);
  }

  function pruefen() {
    if (eingabe === "" || phase !== "frage") return;
    const richtig = Number(eingabe) === fragen[i].fakt.antwort;
    bewerten(richtig ? (geschnauft ? "gerechnet" : "blitz") : "falsch");
  }

  function luftHolen() {
    if (luft <= 0 || pause || phase !== "frage") return;
    setLuft(luft - 1);
    setGeschnauft(true);
    setPause(true);
    Ton.tippen();
  }

  function lehren(nr) {
    if (trickPunkte(t) < TRICK_KOSTEN || !kannNochLernen(t, nr)) return;
    const e = t.wesen[nr] || {};
    const anzahl = trickZahl(t, nr) + 1;
    const trick = trickListe(nr)[anzahl - 1];
    Ton.orden();
    setT({
      ...t,
      punkte: trickPunkte(t) - TRICK_KOSTEN,
      wesen: { ...t.wesen, [nr]: { ...e, tr: anzahl } },
    });
    setGelehrt((g) => [...g, { nr, trick }]);
  }

  /* -------------------- Tricks beibringen -------------------- */
  if (phase === "lehren") {
    const punkte = trickPunkte(t);
    /* Beibringen darf sie nur den Wesen, die in dieser Runde
       blitzschnell waren. Sonst könnte man ⚡ auf der 2er-Reihe
       sammeln und damit die 7er-Arena aufrüsten. */
    const lernbereit = bilanz.schnell.filter((nr) => kannNochLernen(t, nr));
    return (
      <div className="mx-auto max-w-md p-4">
        <Kopf
          titel="Tricks beibringen"
          unter={punkte + " ⚡ übrig · ein Trick kostet " + TRICK_KOSTEN}
          onZurueck={onEnde}
        />
        {gelehrt.length > 0 && (
          <div className="a-auftauchen mb-3 rounded-2xl border-2 border-amber-400/60 bg-amber-400/10 p-3">
            {gelehrt.map((g, k) => (
              <p key={k} className="text-center font-black text-amber-200">
                {WESEN[g.nr].bild} {WESEN[g.nr].name} kann jetzt {g.trick.bild}{" "}
                {g.trick.name}!
              </p>
            ))}
          </div>
        )}
        {punkte < TRICK_KOSTEN ? (
          <p className="rounded-2xl bg-emerald-900/60 p-4 text-center text-emerald-200">
            {punkte === 0
              ? "Keine ⚡ übrig. Die nächste Blitzrunde bringt neue."
              : "Noch " + (TRICK_KOSTEN - punkte) +
                " ⚡ bis zum nächsten Trick. Sie bleiben dir erhalten."}
          </p>
        ) : lernbereit.length === 0 ? (
          <p className="rounded-2xl bg-emerald-900/60 p-4 text-center text-emerald-200">
            {bilanz.schnell.length === 0
              ? "Beibringen kannst du nur den Wesen, die gerade blitzschnell waren. Diese Runde war keines dabei — deine ⚡ bleiben dir."
              : "Die Wesen aus dieser Runde können schon alles, was sie lernen können. Deine ⚡ bleiben dir."}
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm text-emerald-200">
              Wem bringst du etwas bei? Nur Wesen, die gerade blitzschnell waren,
              können lernen. Welcher Trick es wird, sagt ihre Reihe.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {lernbereit.map((nr) => {
                const naechster = trickListe(nr)[trickZahl(t, nr)];
                return (
                  <button
                    key={nr}
                    onClick={() => lehren(nr)}
                    className="kein-blau rounded-2xl bg-emerald-800/70 p-2 text-center transition hover:bg-emerald-700 active:translate-y-px"
                  >
                    <div className="text-3xl">{WESEN[nr].bild}</div>
                    <p className="truncate text-xs font-bold text-emerald-50">
                      {WESEN[nr].name}
                    </p>
                    <p className="mt-1 text-[10px] leading-tight text-amber-300">
                      lernt {naechster.bild}
                      <br />
                      {naechster.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
        <div className="mt-5">
          <Knopf onClick={onEnde}>Fertig</Knopf>
        </div>
      </div>
    );
  }

  /* -------------------- Bericht -------------------- */
  if (phase === "ende") {
    const wackelig = [...new Set([...bilanz.langsam, ...bilanz.falsch])];
    const reicht =
      trickPunkte(t) >= TRICK_KOSTEN &&
      bilanz.schnell.some((nr) => kannNochLernen(t, nr));
    return (
      <div className="mx-auto max-w-md p-5 text-center">
        <div className="a-auftauchen rounded-3xl bg-emerald-900/70 p-6">
          <div className="text-6xl">⚡</div>
          <h2 className="mt-2 text-2xl font-black text-amber-300">
            {bilanz.blitz} von {fragen.length} blitzschnell
          </h2>
          <p className="mt-2 text-sm text-emerald-200">
            {bilanz.blitz === fragen.length
              ? "Alles in der Zeit. Das sitzt wirklich."
              : bilanz.blitz >= fragen.length - 2
              ? "Fast alles sitzt. Die paar wackeligen holst du dir gleich."
              : "Gut gemacht. Die hier brauchen noch ein Wiedersehen:"}
          </p>
          {wackelig.length > 0 && (
            <div className="mt-4 rounded-2xl border-2 border-amber-400/40 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                Haben gezögert
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {wackelig.map((nr) => (
                  <div key={nr} className="text-center">
                    <div className="text-3xl">{WESEN[nr].bild}</div>
                    <p className="text-xs font-bold text-emerald-100">{WESEN[nr].name}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-emerald-300">
                Sie warten jetzt auf dem Streifzug auf dich.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-emerald-950/60 p-3">
            <p className="text-2xl font-black text-amber-300">+{bilanz.blitz} ⚡</p>
            <p className="text-xs text-emerald-300">
              macht {trickPunkte(t)} ⚡ · ein Trick kostet {TRICK_KOSTEN}
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {reicht && (
              <Knopf onClick={() => setPhase("lehren")}>Trick beibringen ✨</Knopf>
            )}
            <Knopf art={reicht ? "ruhig" : "haupt"} onClick={onEnde}>
              Zurück
            </Knopf>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------- Frage -------------------- */
  const { nr, fakt } = dran;
  const offen = phase === "kurz" && letzte !== "blitz" && letzte !== "gerechnet";
  return (
    <div className="mx-auto max-w-md p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onEnde}
          className="kein-blau rounded-xl border-2 border-emerald-500/50 px-3 py-1 text-emerald-100"
        >
          ‹
        </button>
        <p className="flex-1 text-sm font-black uppercase tracking-widest text-amber-300">
          ⚡ Blitzrunde
        </p>
        <span className="text-xs font-bold text-emerald-300">
          {i + 1}/{fragen.length} · {bilanz.blitz} ⚡
        </span>
      </div>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-emerald-900">
        <div
          className={
            "h-full transition-all " +
            (pause ? "bg-sky-300" : zeit < 2 ? "bg-rose-400" : "bg-amber-400")
          }
          style={{ width: (zeit / dauer) * 100 + "%" }}
        />
      </div>

      <div className="mt-3 rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-6 text-center shadow-2xl">
        <p className="text-4xl font-black text-emerald-950 sm:text-5xl">
          {fakt.text} = {offen ? fakt.antwort : eingabe === "" ? "?" : eingabe}
        </p>
        {pause && phase === "frage" && (
          <p className="a-rutschen mt-2 text-sm font-black text-sky-700">
            Uhr angehalten — lass dir Zeit.
          </p>
        )}
        {phase === "kurz" && (
          <div className="a-rutschen mt-3 flex items-center justify-center gap-2">
            <span className="text-3xl">{WESEN[nr].bild}</span>
            <span
              className={
                "font-black " +
                (letzte === "blitz" || letzte === "gerechnet"
                  ? "text-emerald-700"
                  : "text-rose-700")
              }
            >
              {letzte === "blitz"
                ? WESEN[nr].name + " — blitzschnell!"
                : letzte === "gerechnet"
                ? WESEN[nr].name + " — richtig gerechnet"
                : letzte === "langsam"
                ? WESEN[nr].name + " war zu schnell weg"
                : "Das war " + WESEN[nr].name + " (" + fakt.antwort + ")"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Ziffernblock wert={eingabe} setWert={setEingabe} onOk={pruefen} gesperrt={phase !== "frage"} />
      </div>

      <button
        onClick={luftHolen}
        disabled={luft <= 0 || pause || phase !== "frage"}
        className={
          "kein-blau mt-3 w-full rounded-2xl border-2 py-3 text-sm font-black transition " +
          (luft > 0 && !pause && phase === "frage"
            ? "border-sky-400/60 text-sky-200 active:translate-y-px"
            : "border-emerald-800 text-emerald-700")
        }
      >
        😮‍💨 Luft holen {"●".repeat(luft)}{"○".repeat(LUFT_HOLEN - luft)}
      </button>
      <p className="mt-2 text-center text-xs text-emerald-400">
        Luft holen hält die Uhr an. Die Rechnung zählt dann als richtig — aber
        nicht als blitzschnell.
      </p>
    </div>
  );
}


/* ============================================================
   ZAHLODEX
   Das Album ist die Hundertertafel. Man sieht sofort: welche
   Zahlen im 1×1 vorkommen — und welche noch fehlen.
   ============================================================ */
function Zahlodex({ t, onZurueck }) {
  const [gewaehlt, setGewaehlt] = useState(null);
  const gefangen = anzahlGefangen(t);

  if (gewaehlt) return <WesenDetail t={t} nr={gewaehlt} onZurueck={() => setGewaehlt(null)} />;

  const zellen = [];
  for (let n = 1; n <= 100; n++) {
    const w = WESEN[n];
    if (!w) {
      zellen.push(<div key={n} className="aspect-square rounded-lg bg-emerald-950/60" />);
      continue;
    }
    const hab = istGefangen(t, n);
    zellen.push(
      <button
        key={n}
        onClick={() => setGewaehlt(n)}
        className={
          "kein-blau relative aspect-square rounded-lg text-lg leading-none transition sm:text-xl " +
          (hab ? "bg-emerald-700/70 hover:bg-emerald-600" : "bg-emerald-900/80")
        }
      >
        {hab ? (
          <span>{w.bild}</span>
        ) : (
          <span className="text-[10px] font-bold text-emerald-600">{n}</span>
        )}
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <Kopf
        titel="Zahlodex"
        unter={gefangen + " von " + ALLE_NR.length + " Wesen gefunden"}
        onZurueck={onZurueck}
      />
      <div className="rounded-3xl bg-emerald-900/50 p-3">
        <div className="grid grid-cols-10 gap-1">{zellen}</div>
      </div>
      <p className="mt-3 text-center text-xs text-emerald-400">
        Jedes Feld ist eine Zahl von 1 bis 100. Dunkle Felder sind Zahlen, die im
        1×1 gar nicht vorkommen — dort wohnt niemand.
      </p>
      <div className="mt-4 rounded-2xl bg-emerald-900/50 p-3 text-sm text-emerald-200">
        <p className="font-black text-amber-300">Seltenheit</p>
        <p className="mt-1">
          <span className="text-emerald-200">Häufig</span> — die Zahl kommt oft im 1×1
          vor (24 = 3·8 = 4·6).
        </p>
        <p>
          <span className="text-sky-300">Selten ✦✦</span> — es gibt nur einen Weg dorthin
          (35 = 5·7).
        </p>
        <p>
          <span className="text-lime-200">Einzelgänger ✦</span> — dorthin führt nur die
          1er-Reihe (7 = 1·7).
        </p>
        <p>
          <span className="text-amber-300">Legendär ✦✦✦</span> — nur mit großen Zahlen
          erreichbar. Genau die neun schweren Aufgaben.
        </p>
      </div>
    </div>
  );
}

function WesenDetail({ t, nr, onZurueck }) {
  const l = linie(nr);
  const fw = holF(t, "wiese", nr);
  const fm = holF(t, "malfeld", nr);
  const hab = istGefangen(t, nr);

  function stand(f, welt) {
    if (!f) return <span className="text-emerald-500">noch nie getroffen</span>;
    if (f.s === 0)
      return (
        <span className="text-amber-300">
          angeschlagen — {f.h || 0}/{FANG_TREFFER} Treffer
        </span>
      );
    const ab = abdeckung(t, welt, nr);
    const min = Math.max(0, Math.round((f.f - Date.now()) / 60000));
    const wann =
      min <= 0 ? "wartet jetzt auf dich" : min < 90 ? "in " + min + " Min wieder" :
      "in " + Math.round(min / 1440) + " Tagen wieder";
    return (
      <span className="text-emerald-200">
        Freundschaft {"❤️".repeat(f.s)} · {wann}
        <br />
        <span className={ab.hab >= ab.ziel ? "text-amber-300" : "text-emerald-400"}>
          {ab.hab >= ab.ziel
            ? "vollständig erforscht ✨ — jede Rechnung saß schon"
            : ab.hab + " von " + ab.ziel + " Rechnungen saßen schon"}
        </span>
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <Kopf titel={hab ? WESEN[nr].name : "Unbekanntes Wesen"} unter={"Nr. " + nr} onZurueck={onZurueck} />
      {hab ? (
        <WesenKarte nr={nr} gross t={t} />
      ) : (
        <div className="rounded-3xl border-4 border-emerald-700 bg-emerald-900/60 p-8 text-center">
          <Schatten nr={nr} gross />
          <p className="mt-3 font-black text-emerald-300">Noch nicht gefangen</p>
          <p className="text-sm text-emerald-400">Rechne dich hin — dann zeigt es sich.</p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-emerald-900/60 p-3">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
            Entwicklung — Verdoppeln
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {l.map((x, i) => (
              <React.Fragment key={x}>
                {i > 0 && <span className="text-emerald-500">→</span>}
                <div
                  className={
                    "rounded-xl px-2 py-1 text-center " +
                    (x === nr ? "bg-amber-400/20 ring-2 ring-amber-400" : "bg-emerald-800/60")
                  }
                >
                  <div className="text-2xl">
                    {istGefangen(t, x) ? WESEN[x].bild : <span className="opacity-30 grayscale brightness-0">{WESEN[x].bild}</span>}
                  </div>
                  <p className="text-[10px] font-bold text-emerald-200">{x}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
          {l.length === 1 && (
            <p className="mt-1 text-xs text-emerald-400">Dieses Wesen entwickelt sich nicht.</p>
          )}
        </div>

        {paare(nr).length > 0 && (
          <div className="rounded-2xl bg-emerald-900/60 p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Im Malfeld ✖️
            </p>
            <Rechnungen liste={paareUngeordnet(nr).map(([a, b]) => a + " · " + b)} />
            <p className="mt-1 text-xs">{stand(fm, "malfeld")}</p>
          </div>
        )}

        {nr <= 20 && (
          <div className="rounded-2xl bg-emerald-900/60 p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Auf dem Wiesenweg 🌿
            </p>
            <Rechnungen
              liste={faktenWiese(nr).slice(0, 6).map((x) => x.text)}
              mehr={faktenWiese(nr).length > 6}
            />
            <p className="mt-1 text-xs">{stand(fw, "wiese")}</p>
          </div>
        )}
      </div>
    </div>
  );
}


/* ============================================================
   ARENEN
   Neun Reihen, neun Arenaleiter — und der Arenaleiter einer
   Reihe ist ihr Spiegel-Wesen: die 7er-Arena führt 49 an.
   Dazu zwei Arenen für den Zehnerübergang.
   ============================================================ */
const ARENEN = [
  { id: "r2", art: "reihe", reihe: 2, name: "Zweier-Arena" },
  { id: "r5", art: "reihe", reihe: 5, name: "Fünfer-Arena" },
  { id: "r10", art: "reihe", reihe: 10, name: "Zehner-Arena" },
  { id: "r3", art: "reihe", reihe: 3, name: "Dreier-Arena" },
  { id: "r4", art: "reihe", reihe: 4, name: "Vierer-Arena" },
  { id: "r6", art: "reihe", reihe: 6, name: "Sechser-Arena" },
  { id: "r7", art: "reihe", reihe: 7, name: "Siebener-Arena" },
  { id: "r8", art: "reihe", reihe: 8, name: "Achter-Arena" },
  { id: "r9", art: "reihe", reihe: 9, name: "Neuner-Arena" },
  { id: "plus", art: "wiese", op: "+", name: "Brücken-Arena", leiterNr: 20 },
  { id: "minus", art: "wiese", op: "−", name: "Abstieg-Arena", leiterNr: 10 },
];

function arenaLeiter(a) {
  return a.art === "reihe" ? a.reihe * a.reihe : a.leiterNr;
}

/* Wie viele Wesen der Reihe hat das Kind schon? */
function arenaReif(t, a) {
  if (a.art === "reihe") {
    const dazu = NR_MALFELD.filter((n) => typen(n).includes(a.reihe));
    const hab = dazu.filter((n) => {
      const f = holF(t, "malfeld", n);
      return f && f.s >= 1;
    }).length;
    return { hab, noetig: 5, dazu: dazu.length };
  }
  const hab = NR_WIESE.filter((n) => {
    const f = holF(t, "wiese", n);
    return f && f.s >= 1;
  }).length;
  return { hab, noetig: 10, dazu: NR_WIESE.length };
}

/* Wie viele Tricks kennen die Wesen, die in dieser Arena antreten?
   Das sind genau die, die als Ergebnis vorkommen können. */
function arenaTeam(a) {
  if (a.art === "reihe") {
    const aus = [];
    for (let b = 1; b <= 10; b++) aus.push(a.reihe * b);
    return aus;
  }
  return NR_WIESE;
}

function teamTricks(t, a) {
  return arenaTeam(a).reduce((n, nr) => n + (WESEN[nr] ? trickZahl(t, nr) : 0), 0);
}

/* Die Aufgaben eines Arenakampfs */
function arenaAufgaben(a, anzahl) {
  const pool = [];
  if (a.art === "reihe") {
    for (let b = 1; b <= 10; b++) {
      pool.push({ text: a.reihe + " · " + b, antwort: a.reihe * b, a: a.reihe, b, op: "·" });
      if (b !== a.reihe)
        pool.push({ text: b + " · " + a.reihe, antwort: a.reihe * b, a: b, b: a.reihe, op: "·" });
    }
    /* Ein Orden soll etwas heißen. Bisher wurden zehn Rechnungen aus
       neunzehn gelost — die schweren (6·7, 6·8, 6·9 …) konnten dabei
       auch ausbleiben. Jetzt sind sie immer dabei, der Rest wird
       aufgefüllt. Bei den 2er-, 3er-, 4er-, 5er- und 10er-Reihen gibt
       es keine schweren, dort ändert sich nichts. */
    const hart = pool.filter((x) => schwereZahl(x.a) && schwereZahl(x.b));
    const rest = pool.filter((x) => !(schwereZahl(x.a) && schwereZahl(x.b)));
    const gelost = rest.sort(() => Math.random() - 0.5).slice(0, Math.max(0, anzahl - hart.length));
    return [...hart, ...gelost].sort(() => Math.random() - 0.5).slice(0, anzahl);
  } else if (a.op === "+") {
    for (let x = 2; x <= 9; x++)
      for (let y = 2; y <= 9; y++)
        if (x + y > 10 && x + y <= 20) pool.push({ text: x + " + " + y, antwort: x + y, a: x, b: y, op: "+" });
  } else {
    for (let m = 11; m <= 20; m++)
      for (let k = 2; k <= 9; k++)
        if (m - k < 10 && m - k > 0) pool.push({ text: m + " − " + k, antwort: m - k, a: m, b: k, op: "−" });
  }
  const gemischt = pool.sort(() => Math.random() - 0.5);
  return gemischt.slice(0, anzahl);
}


function ArenaListe({ t, onKampf, onZurueck }) {
  return (
    <div className="mx-auto max-w-md p-4">
      <Kopf
        titel="Arenen"
        unter={t.orden.length + " von " + ARENEN.length + " Orden"}
        onZurueck={onZurueck}
      />
      <div className="space-y-2">
        {ARENEN.map((a) => {
          const reif = arenaReif(t, a);
          const hat = t.orden.includes(a.id);
          const offen = reif.hab >= reif.noetig;
          const leiter = arenaLeiter(a);
          return (
            <button
              key={a.id}
              disabled={!offen}
              onClick={() => onKampf(a)}
              className={
                "kein-blau flex w-full items-center gap-3 rounded-2xl p-3 text-left transition " +
                (hat
                  ? "bg-amber-400/20 ring-2 ring-amber-400"
                  : offen
                  ? "bg-emerald-800/70 hover:bg-emerald-700"
                  : "bg-emerald-900/50 opacity-60")
              }
            >
              <div className="text-4xl">{offen ? WESEN[leiter].bild : "🔒"}</div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-emerald-50">{a.name}</p>
                <p className="text-xs text-emerald-300">
                  {offen
                    ? "Arenaleiter: " + WESEN[leiter].name +
                      (a.art === "reihe" ? " (" + a.reihe + " · " + a.reihe + ")" : "")
                    : "Fang erst " + reif.noetig + " Wesen (" + reif.hab + "/" + reif.noetig + ")"}
                </p>
                {offen && (
                  <p className="text-xs text-amber-300">
                    {teamTricks(t, a) > 0
                      ? "Dein Team kennt " + teamTricks(t, a) +
                        (teamTricks(t, a) === 1 ? " Trick" : " Tricks")
                      : "Dein Team kennt noch keine Tricks"}
                  </p>
                )}
              </div>
              {hat && <div className="text-2xl">🏅</div>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-emerald-400">
        In der Arena zählt Tempo: acht Sekunden pro Rechnung. Neun von zehn müssen
        sitzen.
      </p>
    </div>
  );
}

const KAMPF_FRAGEN = 10;
const KAMPF_ZEIT = 8;
/* Der Arenaleiter hält neun Treffer aus. Ohne Tricks braucht es also
   neun von zehn richtigen Antworten — genau wie bisher. Wer seinen
   Wesen Tricks beigebracht hat, schlägt härter und darf sich
   dadurch mehr Fehler leisten. Das ist der Lohn der Blitzrunden. */
const LEITER_LEBEN = 9;

function ArenaKampf({ t, arena, speichern, onEnde }) {
  const [fragen] = useState(() => arenaAufgaben(arena, KAMPF_FRAGEN));
  const [i, setI] = useState(0);
  const [eingabe, setEingabe] = useState("");
  const [treffer, setTreffer] = useState(0);
  const [schaden, setSchaden] = useState(0);
  const [zeit, setZeit] = useState(KAMPF_ZEIT);
  const [phase, setPhase] = useState("kampf"); // kampf | kurz | ende
  const [letzte, setLetzte] = useState(null);
  const [angriff, setAngriff] = useState(null); // welches Wesen hat zugeschlagen
  const leiter = arenaLeiter(arena);

  useEffect(() => {
    if (phase !== "kampf") return;
    setZeit(KAMPF_ZEIT);
    const u = setInterval(
      () => setZeit((z) => Math.max(0, Math.round((z - 0.1) * 10) / 10)),
      100
    );
    return () => clearInterval(u);
  }, [i, phase]);

  /* Zeit abgelaufen — bewusst in einem eigenen Effekt, nicht mitten
     in der Zustandsänderung des Zählers */
  useEffect(() => {
    if (phase === "kampf" && zeit <= 0) bewerten(false);
  }, [zeit, phase]);

  useEffect(() => {
    function taste(e) {
      if (phase !== "kampf") return;
      if (/^[0-9]$/.test(e.key)) setEingabe((v) => (v.length < 3 ? (v + e.key).replace(/^0(?=\d)/, "") : v));
      else if (e.key === "Backspace") setEingabe((v) => v.slice(0, -1));
      else if (e.key === "Enter") pruefen();
    }
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  });

  function bewerten(richtig) {
    setLetzte(richtig);
    if (richtig) {
      /* Das Wesen, das angreift, ist die Antwort selbst. */
      const wer = fragen[i].antwort;
      const tricks = WESEN[wer] ? gelernteTricks(t, wer) : [];
      const wucht = 1 + (tricks.length > 0 ? 1 : 0);
      setAngriff({ nr: wer, trick: tricks[0] || null, wucht });
      setTreffer((x) => x + 1);
      setSchaden((x) => x + wucht);
      Ton.richtig();
    } else {
      setAngriff(null);
      Ton.nochmal();
    }
    setPhase("kurz");
    setTimeout(() => {
      if (i + 1 >= fragen.length) {
        setPhase("ende");
      } else {
        setI(i + 1);
        setEingabe("");
        setPhase("kampf");
      }
    }, richtig ? 500 : 1500);
  }

  function pruefen() {
    if (eingabe === "" || phase !== "kampf") return;
    bewerten(Number(eingabe) === fragen[i].antwort);
  }

  useEffect(() => {
    if (phase !== "ende") return;
    const gewonnen = schaden >= LEITER_LEBEN;
    if (gewonnen && !t.orden.includes(arena.id)) {
      Ton.orden();
      speichern({ ...t, orden: [...t.orden, arena.id] });
    }
  }, [phase]);

  if (phase === "ende") {
    const gewonnen = schaden >= LEITER_LEBEN;
    return (
      <div className="mx-auto max-w-md p-5 text-center">
        <div className="a-auftauchen rounded-3xl bg-emerald-900/70 p-6">
          <div className="text-7xl">{gewonnen ? "🏅" : WESEN[leiter].bild}</div>
          <h2 className="mt-2 text-2xl font-black text-amber-300">
            {gewonnen ? "Orden gewonnen!" : "Knapp daneben"}
          </h2>
          <p className="mt-2 text-emerald-200">
            {treffer} von {KAMPF_FRAGEN} Rechnungen getroffen · {schaden} Schaden
          </p>
          <p className="mt-2 text-sm text-emerald-300">
            {gewonnen
              ? WESEN[leiter].name + " verbeugt sich. Die " + arena.name + " gehört dir."
              : schaden + " von " + LEITER_LEBEN +
                " Schaden. Bring deinen Wesen in der Blitzrunde Tricks bei — dann schlagen sie härter."}
          </p>
          <div className="mt-5">
            <Knopf onClick={onEnde}>Zurück</Knopf>
          </div>
        </div>
      </div>
    );
  }

  const frage = fragen[i];
  const leben = Math.max(0, LEITER_LEBEN - schaden);
  return (
    <div className="mx-auto max-w-md p-4">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-900/60 p-3">
        <div className={"text-4xl " + (letzte === true && phase === "kurz" ? "a-zittern" : "a-pochen")}>
          {WESEN[leiter].bild}
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-amber-300">{WESEN[leiter].name}</p>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-emerald-950">
            <div
              className="h-full bg-rose-400 transition-all"
              style={{ width: (leben / LEITER_LEBEN) * 100 + "%" }}
            />
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-300">
          {i + 1}/{fragen.length}
        </span>
      </div>

      {/* Zeitbalken */}
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-900">
        <div
          className={"h-full transition-all " + (zeit < 3 ? "bg-rose-400" : "bg-amber-400")}
          style={{ width: (zeit / KAMPF_ZEIT) * 100 + "%" }}
        />
      </div>

      <div className="mt-3 rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-6 text-center shadow-2xl">
        <p className="text-4xl font-black text-emerald-950 sm:text-5xl">
          {frage.text} = {phase === "kurz" && letzte === false ? frage.antwort : eingabe === "" ? "?" : eingabe}
        </p>
        {phase === "kurz" && (
          <div className="a-rutschen mt-2">
            {letzte && angriff ? (
              <p className="font-black text-emerald-700">
                <span className="text-2xl">{WESEN[angriff.nr] ? WESEN[angriff.nr].bild : "✨"}</span>{" "}
                {WESEN[angriff.nr] ? WESEN[angriff.nr].name : "Treffer"}
                {angriff.trick
                  ? " setzt " + angriff.trick.bild + " " + angriff.trick.name + " ein!"
                  : " greift an!"}{" "}
                <span className="text-rose-600">−{angriff.wucht}</span>
              </p>
            ) : (
              <p className="font-black text-rose-700">
                Daneben — {frage.text} = {frage.antwort}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4">
        <Ziffernblock wert={eingabe} setWert={setEingabe} onOk={pruefen} gesperrt={phase !== "kampf"} />
      </div>
      <button onClick={onEnde} className="mt-3 w-full text-center text-xs text-emerald-500">
        Kampf abbrechen
      </button>
    </div>
  );
}


/* ============================================================
   DUELL — zwei Kinder, ein Gerät
   Jedes bekommt Aufgaben aus dem eigenen Fortschritt. Damit
   kann auch jemand gewinnen, der weniger weit ist.
   ============================================================ */
function Duell({ stand, onZurueck, speichern }) {
  const namen = Object.keys(stand.trainer);
  const [a, setA] = useState(namen[0] || "");
  const [b, setB] = useState(namen[1] || "");
  const [lauf, setLauf] = useState(null);

  if (!lauf) {
    return (
      <div className="mx-auto max-w-md p-4">
        <Kopf titel="Duell" unter="Zwei Trainer, ein Gerät" onZurueck={onZurueck} />
        {namen.length < 2 ? (
          <p className="rounded-2xl bg-emerald-900/60 p-4 text-emerald-200">
            Für ein Duell braucht es zwei Trainerkarten. Leg auf der Startseite noch
            eine an — für Florentinas Freundin oder ihren Freund.
          </p>
        ) : (
          <>
            {[["Trainer 1", a, setA], ["Trainer 2", b, setB]].map(([titel, wert, setzen]) => (
              <div key={titel} className="mb-3 rounded-2xl bg-emerald-900/60 p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-300">{titel}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {namen.map((n) => (
                    <button
                      key={n}
                      onClick={() => setzen(n)}
                      className={
                        "kein-blau rounded-xl px-3 py-2 text-sm font-bold " +
                        (wert === n ? "bg-amber-400 text-emerald-950" : "bg-emerald-800 text-emerald-100")
                      }
                    >
                      {stand.trainer[n].bild} {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Knopf
              onClick={() => {
                if (a === b) return;
                const t1 = stand.trainer[a];
                const t2 = stand.trainer[b];
                setLauf({
                  spieler: [
                    { name: a, t: t1, liste: baueRunde(t1, t1.welt, 6), welt: t1.welt, punkte: 0 },
                    { name: b, t: t2, liste: baueRunde(t2, t2.welt, 6), welt: t2.welt, punkte: 0 },
                  ],
                });
              }}
            >
              {a === b ? "Zwei verschiedene wählen" : "Los! ⚔️"}
            </Knopf>
          </>
        )}
      </div>
    );
  }

  return <DuellLauf lauf={lauf} onEnde={onZurueck} stand={stand} speichern={speichern} />;
}

function DuellLauf({ lauf, onEnde, stand, speichern }) {
  const [zug, setZug] = useState(0); // 0..11
  const [punkte, setPunkte] = useState([0, 0]);
  const [eingabe, setEingabe] = useState("");
  const [phase, setPhase] = useState("frage");
  const [letzte, setLetzte] = useState(null);
  const [wurf] = useState(() => Math.floor(Math.random() * 97));
  const beginn = useRef(Date.now());
  const dran = zug % 2;
  const runde = Math.floor(zug / 2);
  const spieler = lauf.spieler[dran];
  const fertig = zug >= 12;

  useEffect(() => {
    beginn.current = Date.now();
    setEingabe("");
  }, [zug]);

  useEffect(() => {
    if (!fertig) return;
    const gewinner = punkte[0] === punkte[1] ? null : punkte[0] > punkte[1] ? 0 : 1;
    const neu = { ...stand.trainer };
    lauf.spieler.forEach((s) => {
      neu[s.name] = { ...neu[s.name], stat: { ...neu[s.name].stat, duelle: neu[s.name].stat.duelle + 1 } };
    });
    speichern({ ...stand, trainer: neu });
    if (gewinner !== null) Ton.orden();
  }, [fertig]);

  if (fertig) {
    const gewinner = punkte[0] === punkte[1] ? null : punkte[0] > punkte[1] ? 0 : 1;
    return (
      <div className="mx-auto max-w-md p-5 text-center">
        <div className="a-auftauchen rounded-3xl bg-emerald-900/70 p-6">
          <div className="text-6xl">{gewinner === null ? "🤝" : "🏆"}</div>
          <h2 className="mt-2 text-2xl font-black text-amber-300">
            {gewinner === null ? "Unentschieden!" : lauf.spieler[gewinner].name + " gewinnt!"}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {lauf.spieler.map((s, i) => (
              <div key={i} className="rounded-2xl bg-emerald-800/70 p-3">
                <p className="text-3xl">{s.t.bild}</p>
                <p className="font-bold text-emerald-100">{s.name}</p>
                <p className="text-2xl font-black text-amber-300">{punkte[i]}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-emerald-400">
            Jeder hat Aufgaben aus seinem eigenen Fortschritt bekommen — deshalb ist
            das fair, auch wenn einer schon weiter ist.
          </p>
          <div className="mt-5">
            <Knopf onClick={onEnde}>Fertig</Knopf>
          </div>
        </div>
      </div>
    );
  }

  const nr = spieler.liste[runde % spieler.liste.length];
  const fk = fakten(spieler.welt, nr);
  /* wurf verschiebt die Auswahl je Duell, damit nicht immer dieselben
     Rechnungen kommen — pro Zug bleibt sie aber stabil */
  const fakt = fk[(runde * 3 + dran * 2 + wurf) % fk.length];

  function pruefen() {
    if (eingabe === "" || phase !== "frage") return;
    const richtig = Number(eingabe) === fakt.antwort;
    const schnell = Date.now() - beginn.current <= BLITZ_MS;
    setLetzte(richtig ? (schnell ? 2 : 1) : 0);
    if (richtig) {
      const p = [...punkte];
      p[dran] += schnell ? 2 : 1;
      setPunkte(p);
      schnell ? Ton.blitz() : Ton.richtig();
    } else Ton.nochmal();
    setPhase("kurz");
    setTimeout(() => { setZug(zug + 1); setPhase("frage"); }, richtig ? 700 : 1400);
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="grid grid-cols-2 gap-2">
        {lauf.spieler.map((s, i) => (
          <div
            key={i}
            className={
              "rounded-2xl p-2 text-center " +
              (i === dran ? "bg-amber-400/20 ring-2 ring-amber-400" : "bg-emerald-900/60")
            }
          >
            <p className="text-2xl">{s.t.bild}</p>
            <p className="truncate text-xs font-bold text-emerald-100">{s.name}</p>
            <p className="text-xl font-black text-amber-300">{punkte[i]}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-sm font-black text-amber-300">
        {spieler.name} ist dran · Frage {runde + 1} von 6
      </p>
      <div className="mt-2 rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-6 text-center shadow-2xl">
        <p className="text-4xl font-black text-emerald-950 sm:text-5xl">
          {fakt.text} = {phase === "kurz" && letzte === 0 ? fakt.antwort : eingabe === "" ? "?" : eingabe}
        </p>
        {phase === "kurz" && (
          <p className={"mt-2 font-black " + (letzte ? "text-emerald-700" : "text-rose-700")}>
            {letzte === 2 ? "Blitzschnell! +2" : letzte === 1 ? "Richtig! +1" : "Daneben"}
          </p>
        )}
      </div>
      <div className="mt-4">
        <Ziffernblock wert={eingabe} setWert={setEingabe} onOk={pruefen} gesperrt={phase !== "frage"} />
      </div>
      <p className="mt-2 text-center text-xs text-emerald-400">
        Unter vier Sekunden gibt es zwei Punkte.
      </p>
      <button onClick={onEnde} className="mt-2 w-full text-center text-xs text-emerald-500">
        Duell abbrechen
      </button>
    </div>
  );
}


/* ============================================================
   TRAINERKARTE UND HAUPTMENÜ
   ============================================================ */
function Trainerkarte({ name, t, onBild }) {
  const gefangen = anzahlGefangen(t);
  return (
    <div className="rounded-3xl border-2 border-amber-400/60 bg-gradient-to-br from-emerald-800 to-emerald-900 p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBild}
          title="Bild ändern"
          className="kein-blau rounded-2xl px-1 text-5xl transition active:scale-95"
        >
          {t.bild}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
            Trainerkarte
          </p>
          <p className="truncate text-2xl font-black text-emerald-50">{name}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-amber-300">{gefangen}</p>
          <p className="text-[10px] text-emerald-300">von {ALLE_NR.length}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[11px]">
        <div className="rounded-xl bg-emerald-950/50 p-2">
          <p className="text-lg font-black text-emerald-100">{t.orden.length}</p>
          <p className="text-emerald-400">Orden 🏅</p>
        </div>
        <div className="rounded-xl bg-emerald-950/50 p-2">
          <p className="text-lg font-black text-amber-300">{trickPunkte(t)}</p>
          <p className="text-emerald-400">⚡ übrig</p>
        </div>
        <div className="rounded-xl bg-emerald-950/50 p-2">
          <p className="text-lg font-black text-emerald-100">{tricksGesamt(t)}</p>
          <p className="text-emerald-400">Tricks ✨</p>
        </div>
        <div className="rounded-xl bg-emerald-950/50 p-2">
          <p className="text-lg font-black text-emerald-100">{t.stat.richtig}</p>
          <p className="text-emerald-400">richtig</p>
        </div>
      </div>
    </div>
  );
}

function TrainerWahl({ stand, waehle, lege, loesche, zurueck }) {
  const [neu, setNeu] = useState("");
  const [bild, setBild] = useState(TRAINER_BILDER[0]);
  const namen = Object.keys(stand.trainer);
  return (
    <div className="mx-auto max-w-md p-4">
      <Kopf titel="Wer spielt?" unter="Jedes Kind hat einen eigenen Zahlodex" onZurueck={zurueck} />
      <div className="space-y-2">
        {namen.map((n) => (
          <div key={n} className="flex items-center gap-2">
            <button
              onClick={() => waehle(n)}
              className="kein-blau flex flex-1 items-center gap-3 rounded-2xl bg-emerald-800/70 p-3 text-left hover:bg-emerald-700"
            >
              <span className="text-3xl">{stand.trainer[n].bild}</span>
              <span className="flex-1 font-black text-emerald-50">{n}</span>
              <span className="text-sm text-emerald-300">
                {anzahlGefangen(stand.trainer[n])} Wesen
              </span>
            </button>
            <button
              onClick={() => loesche(n)}
              className="kein-blau rounded-xl border-2 border-rose-500/40 px-3 py-3 text-xs text-rose-300"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-emerald-900/60 p-3">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
          Neue Trainerkarte
        </p>
        <input
          value={neu}
          onChange={(e) => setNeu(e.target.value.slice(0, 14))}
          placeholder="Name"
          className="mt-2 w-full rounded-xl border-2 border-emerald-600 bg-emerald-950 px-3 py-2 text-emerald-50 outline-none focus:border-amber-400"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {TRAINER_BILDER.map((b) => (
            <button
              key={b}
              onClick={() => setBild(b)}
              className={
                "kein-blau rounded-xl px-2 py-1 text-2xl " +
                (bild === b ? "bg-amber-400/30 ring-2 ring-amber-400" : "bg-emerald-800")
              }
            >
              {b}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Knopf
            klein
            art="gruen"
            onClick={() => {
              const n = neu.trim();
              if (!n || stand.trainer[n]) return;
              lege(n, bild);
              setNeu("");
            }}
          >
            Anlegen
          </Knopf>
        </div>
      </div>
    </div>
  );
}

function Weltwahl({ t, waehle, blitz, zurueck }) {
  const blitzbereit = ["wiese", "malfeld"].filter(
    (w) => blitzWesen(t, w).length >= BLITZ_AB_WESEN
  );
  return (
    <div className="mx-auto max-w-md p-4">
      <Kopf titel="Wohin gehst du?" onZurueck={zurueck} />
      <div className="space-y-3">
        {["wiese", "malfeld"].map((w) => {
          const welt = WELT[w];
          const hab = welt.nrs.filter((n) => {
            const f = holF(t, w, n);
            return f && f.s >= 1;
          }).length;
          const dran = faelligeZahl(t, w);
          const erf = erforschteZahl(t, w);
          const offen = nochWasZuZeigen(t, w).length;
          return (
            <button
              key={w}
              onClick={() => waehle(w)}
              className="kein-blau w-full rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-4 text-left transition hover:from-emerald-600"
            >
              <div className="flex items-center gap-3">
                <span className="text-5xl">{welt.bild}</span>
                <div className="flex-1">
                  <p className="text-xl font-black text-amber-300">{welt.name}</p>
                  <p className="text-sm text-emerald-200">{welt.was}</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-950">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: (hab / welt.nrs.length) * 100 + "%" }}
                />
              </div>
              <p className="mt-1 text-xs text-emerald-300">
                {hab} von {welt.nrs.length} Wesen ·{" "}
                {dran > 0 ? dran + " freuen sich auf dich" : "nichts fällig"}
              </p>
              {/* Gefangen heißt noch nicht gekonnt: hier steht, bei wie
                  vielen Wesen wirklich jede Rechnung schon saß. */}
              <p className="mt-0.5 text-xs text-emerald-400">
                {erf} von {hab} erforscht
                {offen > 0
                  ? " · " + offen + " zeigen dir noch was"
                  : hab === welt.nrs.length
                  ? " · alles erkundet ✨"
                  : ""}
              </p>
            </button>
          );
        })}
      </div>

      {/* Blitzrunde — erst wenn es genug gefangene Wesen gibt */}
      <div className="mt-5 rounded-2xl border-2 border-amber-400/40 bg-emerald-900/50 p-3">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-amber-300">
          ⚡ Blitzrunde
        </p>
        <p className="mt-1 text-center text-sm text-emerald-200">
          Nur Wesen, die du schon hast. Wenig Zeit, keine Beeren — schwere
          Rechnungen bekommen mehr Sekunden als leichte.
        </p>
        {blitzbereit.length === 0 ? (
          <p className="mt-2 text-center text-xs text-emerald-400">
            Ab {BLITZ_AB_WESEN} gefangenen Wesen in einer Gegend geht das los.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["wiese", "malfeld"].map((w) => (
              <button
                key={w}
                disabled={!blitzbereit.includes(w)}
                onClick={() => blitz(w)}
                className={
                  "kein-blau rounded-xl px-3 py-3 text-sm font-black transition " +
                  (blitzbereit.includes(w)
                    ? "bg-amber-400 text-emerald-950 active:translate-y-px"
                    : "bg-emerald-900 text-emerald-600")
                }
              >
                {WELT[w].bild} {WELT[w].name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* ============================================================
   DIE ANWENDUNG
   ============================================================ */
function App() {
  const [stand, setStand] = useState(null);
  const [ansicht, setAnsicht] = useState("menue");
  const [welt, setWelt] = useState("wiese");
  const [arena, setArena] = useState(null);
  const [tonAn, setTonAn] = useState(true);
  const [bildWaehlen, setBildWaehlen] = useState(false);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    (async () => {
      let s = { version: 1, aktiv: null, trainer: {} };
      try {
        const r = await window.storage.get(SPEICHER);
        if (r && r.value) s = JSON.parse(r.value);
      } catch (e) {
        /* erster Start */
      }
      if (!s.trainer || Object.keys(s.trainer).length === 0) {
        s = { version: 1, aktiv: "Florentina", trainer: { Florentina: leererTrainer("🐾") } };
      }
      if (!s.aktiv || !s.trainer[s.aktiv]) s.aktiv = Object.keys(s.trainer)[0];
      /* Florentina hatte die Kappe nur, weil das die alte Vorgabe war.
         Wer sich selbst ein Bild ausgesucht hat, behält es. */
      if (s.trainer.Florentina && s.trainer.Florentina.bild === "🧢") {
        s.trainer.Florentina = { ...s.trainer.Florentina, bild: "🐾" };
      }
      setStand(s);
      setWelt(s.trainer[s.aktiv].welt || "wiese");
      setGeladen(true);
    })();
  }, []);

  useEffect(() => {
    if (!geladen || !stand) return;
    (async () => {
      try {
        await window.storage.set(SPEICHER, JSON.stringify(stand));
      } catch (e) {
        /* kein Speicher – das Spiel läuft trotzdem */
      }
    })();
  }, [stand, geladen]);

  useEffect(() => {
    Ton.an = tonAn;
  }, [tonAn]);

  if (!stand) {
    return (
      <div className="flex min-h-screen items-center justify-center text-4xl text-emerald-300">
        …
      </div>
    );
  }

  const t = stand.trainer[stand.aktiv];

  function speichereTrainer(neu) {
    setStand((s) => ({ ...s, trainer: { ...s.trainer, [s.aktiv]: neu } }));
  }

  /* ---------- Unteransichten ---------- */
  if (ansicht === "trainer") {
    return (
      <>
        <Stile />
        <TrainerWahl
          stand={stand}
          zurueck={() => setAnsicht("menue")}
          waehle={(n) => {
            setStand((s) => ({ ...s, aktiv: n }));
            setWelt(stand.trainer[n].welt || "wiese");
            setAnsicht("menue");
          }}
          lege={(n, b) =>
            setStand((s) => ({ ...s, aktiv: n, trainer: { ...s.trainer, [n]: leererTrainer(b) } }))
          }
          loesche={(n) =>
            setStand((s) => {
              const rest = { ...s.trainer };
              delete rest[n];
              const namen = Object.keys(rest);
              if (namen.length === 0) return { ...s, aktiv: "Florentina", trainer: { Florentina: leererTrainer("🐾") } };
              return { ...s, trainer: rest, aktiv: s.aktiv === n ? namen[0] : s.aktiv };
            })
          }
        />
      </>
    );
  }

  if (ansicht === "welt") {
    return (
      <>
        <Stile />
        <Weltwahl
          t={t}
          zurueck={() => setAnsicht("menue")}
          waehle={(w) => {
            setWelt(w);
            speichereTrainer({ ...t, welt: w });
            setAnsicht("streifzug");
          }}
          blitz={(w) => {
            setWelt(w);
            speichereTrainer({ ...t, welt: w });
            setAnsicht("blitz");
          }}
        />
      </>
    );
  }

  if (ansicht === "streifzug") {
    return (
      <>
        <Stile />
        <Streifzug
          start={t}
          welt={welt}
          speichern={speichereTrainer}
          onEnde={() => setAnsicht("menue")}
        />
      </>
    );
  }

  if (ansicht === "blitz") {
    return (
      <>
        <Stile />
        <Blitzrunde
          start={t}
          welt={welt}
          speichern={speichereTrainer}
          onEnde={() => setAnsicht("menue")}
        />
      </>
    );
  }

  if (ansicht === "dex") {
    return (
      <>
        <Stile />
        <Zahlodex t={t} onZurueck={() => setAnsicht("menue")} />
      </>
    );
  }

  if (ansicht === "arena") {
    return (
      <>
        <Stile />
        <ArenaListe
          t={t}
          onZurueck={() => setAnsicht("menue")}
          onKampf={(a) => { setArena(a); setAnsicht("kampf"); }}
        />
      </>
    );
  }

  if (ansicht === "kampf") {
    return (
      <>
        <Stile />
        <ArenaKampf
          t={t}
          arena={arena}
          speichern={speichereTrainer}
          onEnde={() => setAnsicht("arena")}
        />
      </>
    );
  }

  if (ansicht === "duell") {
    return (
      <>
        <Stile />
        <Duell stand={stand} speichern={setStand} onZurueck={() => setAnsicht("menue")} />
      </>
    );
  }

  /* ---------- Hauptmenü ---------- */
  const dranGesamt = faelligeZahl(t, "wiese") + faelligeZahl(t, "malfeld");
  return (
    <>
      <Stile />
      <div className="mx-auto max-w-md p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
            Zahlodex
          </p>
          <button
            onClick={() => setTonAn(!tonAn)}
            className="kein-blau rounded-xl border-2 border-emerald-600 px-3 py-1 text-sm text-emerald-200"
          >
            {tonAn ? "🔊" : "🔇"}
          </button>
        </div>

        <h1 className="text-3xl font-black leading-tight text-amber-300">
          Die Rechen-Arena
        </h1>
        <p className="mt-1 text-sm text-emerald-300">
          Jedes Ergebnis ist ein Wesen. Wer rechnet, fängt es.
        </p>

        <div className="mt-4">
          <Trainerkarte name={stand.aktiv} t={t} onBild={() => setBildWaehlen(!bildWaehlen)} />
        </div>

        {bildWaehlen && (
          <div className="a-rutschen mt-2 rounded-2xl bg-emerald-900/60 p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Bild für {stand.aktiv}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRAINER_BILDER.map((b) => (
                <button
                  key={b}
                  onClick={() => { speichereTrainer({ ...t, bild: b }); setBildWaehlen(false); }}
                  className={
                    "kein-blau rounded-xl px-2 py-1 text-3xl " +
                    (t.bild === b ? "bg-amber-400/30 ring-2 ring-amber-400" : "bg-emerald-800")
                  }
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        {dranGesamt > 0 && (
          /* Bewusst ruhig formuliert: "20 Wesen warten auf dich" liest
             sich wie eine Mahnung. Eine Runde nimmt ohnehin höchstens
             fünf davon. */
          <p className="mt-3 rounded-2xl bg-amber-400/15 p-3 text-center text-sm font-bold text-amber-200">
            {dranGesamt} {dranGesamt === 1 ? "Wesen freut" : "Wesen freuen"} sich auf ein
            Wiedersehen.
            {dranGesamt > 5 && (
              <span className="block text-xs font-normal text-amber-200/70">
                Eine Runde nimmt höchstens fünf davon — kein Stress.
              </span>
            )}
          </p>
        )}

        <div className="mt-4 space-y-2">
          <Knopf onClick={() => setAnsicht("welt")}>Auf Streifzug gehen 🌿</Knopf>
          <div className="grid grid-cols-2 gap-2">
            <Knopf art="ruhig" onClick={() => setAnsicht("dex")}>
              Zahlodex 📕
            </Knopf>
            <Knopf art="ruhig" onClick={() => setAnsicht("arena")}>
              Arenen 🏅
            </Knopf>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Knopf art="ruhig" onClick={() => setAnsicht("duell")}>
              Duell ⚔️
            </Knopf>
            <Knopf art="ruhig" onClick={() => setAnsicht("trainer")}>
              Trainer wechseln
            </Knopf>
          </div>
        </div>

        <a
          href="./index.html"
          className="mt-6 block rounded-2xl border-2 border-emerald-700 p-3 text-center text-sm text-emerald-300"
        >
          🦉 Zurück zu Florentinas Rätselschule
        </a>

        <p className="mt-4 text-center text-xs leading-relaxed text-emerald-500">
          Gefangene Wesen melden sich wieder — wer eine Rechnung aus dem Stand
          weiß, sieht sie lange nicht, wer überlegen muss, schon bald.
        </p>
        <p className="mt-3 text-center text-[11px] text-emerald-500">
          Zahlodex · Fassung {FASSUNG}
        </p>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
