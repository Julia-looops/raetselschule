const { useState, useEffect, useRef } = React;


/* ============================================================
   FLORENTINAS RÄTSELSCHULE
   Hogwarts + Pikachu · 3. Klasse VS · Zahlenraum bis 100
   ============================================================ */

const KAPITEL = [
  { id: 1, titel: "Der Brief aus Hogwarts", emoji: "🦉" },
  { id: 2, titel: "Die Schokofrosch-Kammer", emoji: "🐸" },
  { id: 3, titel: "Der Wald von Hogsmeade", emoji: "⚡" },
  { id: 4, titel: "Die verbotene Bibliothek", emoji: "📚" },
  { id: 5, titel: "Das große Finale", emoji: "🏆" },
];

const AUFGABEN = [
  {
    id: 1, kap: 1,
    story: "Eine Eule klopft an Harrys Fenster. Sie bringt ihm 24 Zauberkarten. Am Abend bringt Hedwig noch 18 Karten dazu.",
    frage: "Wie viele Zauberkarten hat Harry jetzt?",
    antwort: 42, einheit: "Karten",
    lumos: "Im Text stecken zwei Zahlen: 24 und 18.",
    accio: "Gesucht ist: Wie viele Karten hat sie ZUSAMMEN, nachdem sie mehr bekommen hat?",
    reducio: "Sie bekommt Karten dazu — also rechnest du plus: 24 + 18 = ?",
    loesung: "24 + 18 = 42. Harry hat 42 Zauberkarten.",
    karte: { emoji: "🦉", name: "Hedwig", art: "Eulenkarte" },
  },
  {
    id: 2, kap: 1,
    story: "Im Hogwarts-Express kauft Ron eine Packung mit 60 Bertie-Botts-Bohnen. 27 davon schmecken nach Ohrenschmalz. Die legt er weg.",
    frage: "Wie viele gute Bohnen bleiben Ron übrig?",
    antwort: 33, einheit: "Bohnen",
    lumos: "Im Text stecken zwei Zahlen: 60 und 27.",
    accio: "Gesucht ist: Wie viele Bohnen bleiben ÜBRIG, nachdem er welche weglegt?",
    reducio: "Weglegen heißt weniger — also rechnest du minus: 60 − 27 = ?",
    loesung: "60 − 27 = 33. Es bleiben 33 gute Bohnen.",
    karte: { emoji: "🍬", name: "Bertie Botts Bohnen", art: "Süßigkeitenkarte" },
  },
  {
    id: 3, kap: 1,
    story: "Gryffindor hat 35 Hauspunkte. Hermine antwortet richtig und holt 28 Punkte dazu. Dann redet Ron im Unterricht und Gryffindor verliert 9 Punkte.",
    frage: "Wie viele Hauspunkte hat Gryffindor am Ende?",
    antwort: 54, einheit: "Punkte",
    lumos: "Im Text stecken drei Zahlen: 35, 28 und 9.",
    accio: "Gesucht sind die Punkte AM ENDE. Achtung: hier passieren zwei Dinge — erst dazu, dann weg.",
    reducio: "Schritt 1: 35 + 28 = 63. Schritt 2: 63 − 9 = ?",
    loesung: "35 + 28 = 63, dann 63 − 9 = 54. Gryffindor hat 54 Punkte.",
    karte: { emoji: "🦁", name: "Gryffindor-Wappen", art: "Hauskarte" },
  },
  {
    id: 4, kap: 2,
    story: "In der Hogwarts-Küche stehen 6 Packungen Schokofrösche. In jeder Packung sitzen 8 Frösche.",
    frage: "Wie viele Schokofrösche sind das zusammen?",
    antwort: 48, einheit: "Frösche",
    lumos: "Im Text stecken zwei Zahlen: 6 Packungen und 8 Frösche pro Packung.",
    accio: "Gesucht sind ALLE Frösche zusammen.",
    reducio: "In jeder Packung sind gleich viele — also malnehmen: 6 · 8 = ?",
    loesung: "6 · 8 = 48. Das sind 48 Schokofrösche.",
    karte: { emoji: "🐸", name: "Schokofrosch", art: "Sammelkarte" },
  },
  {
    id: 5, kap: 2,
    story: "42 Kürbispasteten sollen gleichmäßig auf 6 Teller verteilt werden.",
    frage: "Wie viele Pasteten kommen auf jeden Teller?",
    antwort: 7, einheit: "Pasteten",
    lumos: "Im Text stecken zwei Zahlen: 42 Pasteten und 6 Teller.",
    accio: "Gesucht ist, wie viele auf EINEN einzigen Teller kommen.",
    reducio: "Gleichmäßig aufteilen — also dividieren: 42 : 6 = ?",
    loesung: "42 : 6 = 7. Auf jeden Teller kommen 7 Pasteten.",
    karte: { emoji: "🎃", name: "Kürbispastete", art: "Festessen-Karte" },
  },
  {
    id: 6, kap: 2,
    story: "Ollivander sortiert Zauberstäbe ins Regal: 9 Reihen, und in jeder Reihe liegen 7 Zauberstäbe.",
    frage: "Wie viele Zauberstäbe liegen im Regal?",
    antwort: 63, einheit: "Zauberstäbe",
    lumos: "Im Text stecken zwei Zahlen: 9 Reihen und 7 Stäbe pro Reihe.",
    accio: "Gesucht sind alle Zauberstäbe im ganzen Regal.",
    reducio: "In jeder Reihe liegen gleich viele — also malnehmen: 9 · 7 = ?",
    loesung: "9 · 7 = 63. Im Regal liegen 63 Zauberstäbe.",
    karte: { emoji: "🪄", name: "Zauberstab aus Ulme", art: "Ollivander-Karte" },
  },
  {
    id: 7, kap: 3,
    story: "Luna packt 5 Beutel mit Futter für Pikachu. In jeden Beutel legt sie 4 Beeren. Auf dem Waldweg fallen 3 Beeren in den Schnee.",
    frage: "Wie viele Beeren hat Luna noch?",
    antwort: 17, einheit: "Beeren",
    lumos: "Im Text stecken drei Zahlen: 5 Beutel, 4 Beeren pro Beutel, 3 verlorene Beeren.",
    accio: "Gesucht ist, wie viele Beeren Luna am Ende noch HAT. Zwei Schritte!",
    reducio: "Schritt 1: 5 · 4 = 20. Schritt 2: 20 − 3 = ?",
    loesung: "5 · 4 = 20, dann 20 − 3 = 17. Luna hat noch 17 Beeren.",
    karte: { emoji: "🫐", name: "Beerenbeutel", art: "Ausrüstungskarte" },
  },
  {
    id: 8, kap: 3,
    story: "Pikachu verteilt 56 Blitz-Sticker an 8 Kinder. Jedes Kind bekommt gleich viele.",
    frage: "Wie viele Sticker bekommt ein Kind?",
    antwort: 7, einheit: "Sticker",
    lumos: "Im Text stecken zwei Zahlen: 56 Sticker und 8 Kinder.",
    accio: "Gesucht ist die Menge für EIN Kind.",
    reducio: "Gleich viele für jedes Kind — also dividieren: 56 : 8 = ?",
    loesung: "56 : 8 = 7. Jedes Kind bekommt 7 Sticker.",
    karte: { emoji: "⚡", name: "Pikachu", art: "Blitzkarte ✦ selten" },
  },
  {
    id: 9, kap: 3,
    story: "Der Waldweg ist 100 Schritte lang. Ginny geht 38 Schritte, macht eine Pause, und geht dann noch 25 Schritte.",
    frage: "Wie viele Schritte fehlen Ginny noch bis zum Ende?",
    antwort: 37, einheit: "Schritte",
    lumos: "Im Text stecken drei Zahlen: 100, 38 und 25.",
    accio: "Gesucht ist der REST des Weges — nicht, wie weit Ginny schon gegangen ist.",
    reducio: "Schritt 1: 38 + 25 = 63 (so weit ist sie schon). Schritt 2: 100 − 63 = ?",
    loesung: "38 + 25 = 63, dann 100 − 63 = 37. Es fehlen noch 37 Schritte.",
    karte: { emoji: "🌿", name: "Bisasam", art: "Waldkarte" },
  },
  {
    id: 10, kap: 4,
    story: "In der Bibliothek stehen 4 Regale, in jedem 9 Zauberbücher. 7 Bücher sind gerade ausgeliehen.",
    frage: "Wie viele Bücher stehen noch in den Regalen?",
    antwort: 29, einheit: "Bücher",
    lumos: "Im Text stecken drei Zahlen: 4 Regale, 9 Bücher pro Regal, 7 ausgeliehen.",
    accio: "Gesucht ist, wie viele Bücher noch DA sind. Zwei Schritte!",
    reducio: "Schritt 1: 4 · 9 = 36. Schritt 2: 36 − 7 = ?",
    loesung: "4 · 9 = 36, dann 36 − 7 = 29. Es stehen noch 29 Bücher da.",
    karte: { emoji: "📚", name: "Buch der Monster", art: "Bibliothekskarte" },
  },
  {
    id: 11, kap: 4,
    story: "Fred hat 100 Galleonen. Er kauft einen Zauberstab für 45 Galleonen und 2 Schreibfedern für je 8 Galleonen.",
    frage: "Wie viele Galleonen bleiben Fred?",
    antwort: 39, einheit: "Galleonen",
    lumos: "Im Text stecken: 100 Galleonen, 45 für den Stab, 2 Federn zu je 8.",
    accio: "Gesucht ist, was am Ende im Geldbeutel ÜBRIG bleibt. Drei Schritte!",
    reducio: "Schritt 1: 2 · 8 = 16 (die Federn). Schritt 2: 45 + 16 = 61. Schritt 3: 100 − 61 = ?",
    loesung: "2 · 8 = 16, 45 + 16 = 61, 100 − 61 = 39. Fred bleiben 39 Galleonen.",
    karte: { emoji: "🪙", name: "Goldene Galleone", art: "Gringotts-Karte" },
  },
  {
    id: 12, kap: 4,
    story: "72 Schokofrösche werden in Kisten gepackt, 8 Frösche in jede Kiste. 3 Kisten werden sofort verschickt.",
    frage: "Wie viele Kisten bleiben in der Kammer?",
    antwort: 6, einheit: "Kisten",
    lumos: "Im Text stecken: 72 Frösche, 8 pro Kiste, 3 Kisten weg.",
    accio: "Gesucht sind KISTEN, nicht Frösche. Erst musst du wissen, wie viele Kisten es überhaupt gibt.",
    reducio: "Schritt 1: 72 : 8 = 9 Kisten. Schritt 2: 9 − 3 = ?",
    loesung: "72 : 8 = 9 Kisten, dann 9 − 3 = 6. Es bleiben 6 Kisten.",
    karte: { emoji: "🗝️", name: "Der goldene Schlüssel", art: "Geheimniskarte" },
  },
  {
    id: 13, kap: 5,
    story: "Quidditch-Finale! Gryffindor schießt 7 Tore, jedes Tor zählt 10 Punkte. Dann fängt Harry den Goldenen Schnatz: 15 Punkte. Slytherin hat 80 Punkte.",
    frage: "Um wie viele Punkte gewinnt Gryffindor?",
    antwort: 5, einheit: "Punkte",
    lumos: "Im Text stecken: 7 Tore, 10 Punkte pro Tor, 15 für den Schnatz, 80 für Slytherin.",
    accio: "Gesucht ist der UNTERSCHIED zwischen den beiden Punktezahlen.",
    reducio: "Schritt 1: 7 · 10 = 70. Schritt 2: 70 + 15 = 85. Schritt 3: 85 − 80 = ?",
    loesung: "7 · 10 = 70, 70 + 15 = 85, 85 − 80 = 5. Gryffindor gewinnt um 5 Punkte!",
    karte: { emoji: "✨", name: "Goldener Schnatz", art: "Quidditch-Karte ✦ selten" },
  },
  {
    id: 14, kap: 5,
    story: "Pikachu lädt sich auf: 3 Runden mit je 12 Volt. Dann kommt ein Blitz und bringt noch 9 Volt dazu.",
    frage: "Wie viele Volt hat Pikachu jetzt?",
    antwort: 45, einheit: "Volt",
    lumos: "Im Text stecken: 3 Runden, 12 Volt pro Runde, 9 Volt extra.",
    accio: "Gesucht ist die Ladung am Ende — alles zusammen.",
    reducio: "Schritt 1: 3 · 12 = 36. Schritt 2: 36 + 9 = ?",
    loesung: "3 · 12 = 36, dann 36 + 9 = 45. Pikachu hat 45 Volt!",
    karte: { emoji: "🌩️", name: "Voltattacke", art: "Angriffskarte" },
  },
  {
    id: 15, kap: 5,
    story: "Beim Siegesfest gibt es 96 Muffins für 8 Tische, an jedem Tisch gleich viele. An Nevilles Tisch werden schon 5 Muffins gegessen.",
    frage: "Wie viele Muffins liegen an Nevilles Tisch noch?",
    antwort: 7, einheit: "Muffins",
    lumos: "Im Text stecken: 96 Muffins, 8 Tische, 5 gegessen.",
    accio: "Gesucht sind die Muffins an EINEM Tisch, nachdem welche gegessen wurden.",
    reducio: "Schritt 1: 96 : 8 = 12 pro Tisch. Schritt 2: 12 − 5 = ?",
    loesung: "96 : 8 = 12, dann 12 − 5 = 7. Es liegen noch 7 Muffins da.",
    karte: { emoji: "👑", name: "Krone der Rätselmeisterin", art: "Legendär ✦✦✦" },
  },
];

/* ============================================================
   VOLT-REGELN
   Selbst gelöst gibt immer Volt — Hilfe kostet nie etwas.
   Wer ohne Zauberspruch auskommt, bekommt Bonus-Volt.
   ============================================================ */
const VOLT_BASIS = 6;
const VOLT_BONUS = 2;      // pro nicht gebrauchtem Zauberspruch
const VOLT_MAX_PRO_RAETSEL = VOLT_BASIS + 3 * VOLT_BONUS; // 12
const FINALE_VOLT = 60;    // Tor zu Kapitel 5

function voltFuer(hilfen, loesungAufgedeckt) {
  if (loesungAufgedeckt) return 0;
  const benutzt = ["lumos", "accio", "reducio"].filter((k) => hilfen[k]).length;
  return VOLT_BASIS + (3 - benutzt) * VOLT_BONUS;
}

const SPRUCH_ICON = { lumos: "💡", accio: "🔍", reducio: "🪄" };

/* kleine Zeile: welche Sprüche wurden gebraucht */
function SpruchZeile({ e, dunkel }) {
  const benutzt = ["lumos", "accio", "reducio"].filter((k) => e && e[k]);
  const farbe = dunkel ? "text-amber-200" : "text-stone-600";
  if (e && e.loesung) return <p className={`text-xs ${farbe}`}>Lösungsweg angesehen</p>;
  if (benutzt.length === 0)
    return <p className={`text-xs font-bold ${dunkel ? "text-yellow-300" : "text-yellow-700"}`}>ganz allein gelöst ✦</p>;
  return (
    <p className={`text-xs ${farbe}`}>
      {benutzt.map((k) => SPRUCH_ICON[k]).join(" ")} {benutzt.length} Zauberspruch
      {benutzt.length > 1 ? "e" : ""}
    </p>
  );
}

const LOB = [
  "Pika-piiii! Genau richtig!",
  "Stimmt haargenau. Gryffindor jubelt.",
  "Perfekt gerechnet, Florentina!",
  "Volltreffer! Pikachu macht Funken.",
  "Richtig! Professor McGonagall nickt anerkennend.",
  "Ja! Das war ein echter Rätselmeister-Moment.",
];

const AUFMUNTERN = [
  "Noch nicht ganz — aber du bist dran. Probier Lumos!",
  "Fast! Lies die Frage nochmal langsam. Was genau will sie wissen?",
  "Nicht die richtige Zahl. Zaubersprüche helfen — und kosten nichts.",
];

/* ============================================================
   TON — alles selbst erzeugt, keine Dateien, läuft offline
   ============================================================ */
const NOTE = {
  B3: 246.94, D4: 293.66, E4: 329.63, "F#4": 369.99, G4: 392.0,
  A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
  G5: 783.99, A5: 880.0, B5: 987.77, E6: 1318.5,
};

const Ton = {
  ctx: null,
  musikAn: false,
  timer: null,
  start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  klang(freq, start, dauer, lautst = 0.18, form = "triangle") {
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
  /* richtig: aufsteigender Dreiklang */
  richtig() {
    [NOTE.E5, NOTE.G5, NOTE.B5].forEach((f, i) =>
      this.klang(f, i * 0.09, 0.4, 0.16)
    );
  },
  /* nochmal probieren: weich, nie hart oder tief */
  nochmal() {
    this.klang(NOTE.A4, 0, 0.16, 0.1);
    this.klang(NOTE.G4, 0.12, 0.22, 0.1);
  },
  /* Zauberspruch: Funkeln */
  zauber() {
    [NOTE.B5, NOTE.E6, NOTE.A5, NOTE.E6].forEach((f, i) =>
      this.klang(f, i * 0.06, 0.25, 0.1, "sine")
    );
  },
  /* neue Karte: kleine Fanfare */
  karte() {
    [
      [NOTE.E4, 0], [NOTE.A4, 0.1], [NOTE.C5, 0.2],
      [NOTE.E5, 0.3], [NOTE.A5, 0.42],
    ].forEach(([f, t]) => this.klang(f, t, 0.55, 0.17));
  },
  /* Pikachu piepst */
  pika() {
    this.klang(NOTE.E6, 0, 0.09, 0.1, "square");
    this.klang(NOTE.B5, 0.1, 0.14, 0.08, "square");
  },
  /* eigene Melodie in e-moll, sehr leise im Hintergrund */
  melodie: [
    "E4","G4","B4","A4","G4","E4","F#4","A4","C5","B4","A4","F#4",
    "G4","B4","E5","D5","B4","G4","F#4","E4","B3","E4","E4","B3",
  ],
  musikStart() {
    const ctx = this.start();
    if (!ctx || this.timer) return;
    this.musikAn = true;
    let i = 0;
    const schlag = 0.62;
    const spiel = () => {
      if (!this.musikAn) return;
      for (let n = 0; n < 4; n++) {
        const name = this.melodie[(i + n) % this.melodie.length];
        this.klang(NOTE[name], n * schlag, schlag * 1.5, 0.05, "sine");
        this.klang(NOTE[name] / 2, n * schlag, schlag * 1.5, 0.025, "triangle");
      }
      i = (i + 4) % this.melodie.length;
    };
    spiel();
    this.timer = setInterval(spiel, schlag * 4 * 1000);
  },
  musikStop() {
    this.musikAn = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  },
};

/* Pikachu als Begleiter — er sagt, was gerade dran ist */
const PIKA_START = [
  "Pika! Zuerst lesen, dann rechnen.",
  "Pika-pi! Ich passe auf, dir passiert nichts.",
  "Wenn du steckenbleibst: Zauberspruch. Immer erlaubt.",
  "Pikaaa. Lies den Text zweimal. Ich warte.",
];
const PIKA_HILFE = [
  "Gut gemacht, dass du fragst! Pika!",
  "Pika-pi! Hilfe holen ist tapfer.",
  "So machen es alle guten Zauberer.",
];
const PIKA_FALSCH = [
  "Pika? Egal — nochmal.",
  "Fast! Ich glaub an dich.",
  "Pikaaa... probier's nochmal, nichts kaputt.",
];

/* ---------- Hilfsfunktion: Zahlen im Text hervorheben ---------- */
function StoryText({ text, leuchtet }) {
  const teile = text.split(/(\d+)/);
  return (
    <p className="text-lg leading-relaxed text-stone-800">
      {teile.map((t, i) =>
        /^\d+$/.test(t) && leuchtet ? (
          <span
            key={i}
            className="mx-0.5 inline-block rounded bg-yellow-300 px-1.5 font-bold text-stone-900 shadow-sm"
          >
            {t}
          </span>
        ) : (
          <span key={i}>{t}</span>
        )
      )}
    </p>
  );
}

/* ---------- Zauberspruch-Button ---------- */
function Zauber({ emoji, name, was, onClick, aktiv }) {
  return (
    <button
      onClick={onClick}
      disabled={aktiv}
      className={`flex-1 rounded-xl border-2 px-3 py-2 text-left transition ${
        aktiv
          ? "border-yellow-400 bg-yellow-100 opacity-70"
          : "border-purple-300 bg-white hover:-translate-y-0.5 hover:border-purple-500 hover:shadow-md"
      }`}
    >
      <div className="text-base font-bold text-purple-900">
        {emoji} {name}
      </div>
      <div className="text-xs text-stone-600">{was}</div>
    </button>
  );
}

/* Eigenes Bild: Datei "pikachu.png" neben die HTML-Datei legen.
   Fehlt sie, erscheint automatisch das Blitz-Symbol. */
const PIKA_BILD = "pikachu.png";

/* ---------- Pikachu-Leiste: Volt füllen sich mit jeder Aufgabe ---------- */
function Pikachu({ volt, max, spruch, tor }) {
  const p = Math.round((volt / max) * 100);
  const [bildDa, setBildDa] = useState(true);
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-indigo-900/60 p-3">
      {bildDa ? (
        <img
          src={PIKA_BILD}
          alt="Pikachu"
          onError={() => setBildDa(false)}
          className="h-16 w-16 shrink-0 object-contain"
        />
      ) : (
        <div className="text-4xl">⚡</div>
      )}
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-100">{spruch}</p>
        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-indigo-950">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all duration-700"
            style={{ width: `${p}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-yellow-500">
          Pikachus Ladung: {volt} Volt{" "}
          {volt >= tor ? (
            <span className="font-bold text-yellow-300">
              · Finale ist offen ✦
            </span>
          ) : (
            <span>· Finale ab {tor} Volt (noch {tor - volt})</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ---------- Ton-Schalter ---------- */
function TonSchalter({ tonAn, setTonAn, musik, setMusik }) {
  return (
    <span className="flex gap-1">
      <button
        onClick={() => {
          const neu = !tonAn;
          setTonAn(neu);
          if (neu) Ton.zauber();
          if (!neu) {
            Ton.musikStop();
            setMusik(false);
          }
        }}
        title="Geräusche"
        className={`rounded-lg border px-2 py-1 text-sm ${
          tonAn
            ? "border-yellow-400 bg-yellow-400/20 text-yellow-200"
            : "border-indigo-600 text-indigo-400"
        }`}
      >
        {tonAn ? "🔊" : "🔇"}
      </button>
      <button
        onClick={() => {
          if (musik) {
            Ton.musikStop();
            setMusik(false);
          } else {
            setTonAn(true);
            setMusik(true);
            Ton.musikStart();
          }
        }}
        title="Musik"
        className={`rounded-lg border px-2 py-1 text-sm ${
          musik
            ? "border-yellow-400 bg-yellow-400/20 text-yellow-200"
            : "border-indigo-600 text-indigo-400"
        }`}
      >
        🎵
      </button>
    </span>
  );
}

/* ============================================================
   DAS QUIDDITCH-FINALE
   Rechnen laedt den Schuss, Geschick fuehrt ihn aus.
   Die im Spiel erarbeiteten Volt werden zu Pikachus Blitz-Boosts —
   damit zahlt sich jedes geloeste Raetsel hier sichtbar aus.
   ============================================================ */

const GRYFFINDOR_START = 70;   // Halbzeitstand: Gryffindor liegt zurueck
const SLYTHERIN_START = 80;
const TOR_PUNKTE = 10;
const SCHNATZ_PUNKTE = 15;
const VOLT_PRO_BOOST = 20;     // 60 Volt = 3 Blitze
const MAX_BOOSTS = 3;          // Deckel: Geschick soll bedeutsam bleiben

/* Rechenaufgabe im Zahlenraum bis 100, gemischt plus und minus */
function neueRechnung() {
  if (Math.random() < 0.5) {
    const a = 12 + Math.floor(Math.random() * 59);            // 12..70
    const b = 8 + Math.floor(Math.random() * (100 - a - 7));  // Summe bleibt <= 100
    return { text: a + " + " + b, loesung: a + b };
  }
  const gross = 45 + Math.floor(Math.random() * 51);           // 45..95
  /* Der kleinere Wert wird so begrenzt, dass das Ergebnis nie unter 10 faellt —
     ohne diese Grenze konnte 45 − 47 herauskommen. */
  const maxKlein = Math.min(47, gross - 10);
  const klein = 8 + Math.floor(Math.random() * (maxKlein - 7));
  return { text: gross + " − " + klein, loesung: gross - klein };
}

/* Anzeigetafel */
function Tafel({ gryffindor, slytherin }) {
  const fuehrt = gryffindor > slytherin;
  return (
    <div className="mt-3 flex items-stretch gap-2">
      <div
        className={`flex-1 rounded-2xl border-2 p-3 text-center ${
          fuehrt ? "border-yellow-400 bg-yellow-400/15" : "border-yellow-600/30 bg-indigo-900/50"
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-amber-200">🦁 Gryffindor</p>
        <p className="font-serif text-4xl font-black text-yellow-300">{gryffindor}</p>
      </div>
      <div className="flex items-center font-serif text-2xl font-black text-amber-200/60">:</div>
      <div
        className={`flex-1 rounded-2xl border-2 p-3 text-center ${
          !fuehrt ? "border-emerald-400/60 bg-emerald-900/25" : "border-indigo-700/50 bg-indigo-950/60"
        }`}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">🐍 Slytherin</p>
        <p className="font-serif text-4xl font-black text-emerald-200">{slytherin}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------- Zielleiste */
function Zielleiste({ label, zone, markerRef }) {
  return (
    <div className="mt-5">
      <p className="text-center text-sm font-bold text-amber-200">{label}</p>
      <div className="relative mt-2 h-14 overflow-hidden rounded-2xl border-2 border-yellow-600/40 bg-indigo-950">
        {/* Trefferzone */}
        <div
          className="absolute inset-y-0 bg-yellow-400/30 border-x-2 border-yellow-400"
          style={{
            left: (0.5 - zone) * 100 + "%",
            width: zone * 200 + "%",
          }}
        />
        {/* Ring in der Mitte */}
        <div className="absolute inset-y-0 left-1/2 flex w-0 items-center justify-center">
          <span className="text-2xl">🥅</span>
        </div>
        {/* Marker */}
        <div
          ref={markerRef}
          className="absolute inset-y-0 w-1 -translate-x-1/2 bg-yellow-200"
          style={{ left: "0%" }}
        />
      </div>
    </div>
  );
}

function QuidditchFinale({ voltGesamt, tonAn, onGewonnen, onZurueck }) {
  const [phase, setPhase] = useState("intro");
  const [gryffindor, setGryffindor] = useState(GRYFFINDOR_START);
  const [slytherin, setSlytherin] = useState(SLYTHERIN_START);
  const [rechnung, setRechnung] = useState(neueRechnung);
  const [eingabe, setEingabe] = useState("");
  const [versuche, setVersuche] = useState(0);
  const [ladung, setLadung] = useState(0);
  const [boosts, setBoosts] = useState(Math.min(MAX_BOOSTS, Math.floor(voltGesamt / VOLT_PRO_BOOST)));
  const [boostAktiv, setBoostAktiv] = useState(false);
  const [meldung, setMeldung] = useState(null);
  const [treffer, setTreffer] = useState(false);
  const [schnatzVersuche, setSchnatzVersuche] = useState(4);
  const [fehlserie, setFehlserie] = useState(0);

  const posRef = useRef(0);
  const markerRef = useRef(null);

  const zielphase = phase === "werfen" || phase === "schnatz";
  const dauer = phase === "schnatz" ? 1450 : 1750;   // ein Hin-und-Her in ms

  /* Der Marker laeuft ueber die Leiste. Bewusst per Ref direkt im DOM,
     damit React nicht 60 Mal pro Sekunde neu rendern muss. */
  useEffect(() => {
    if (!zielphase) return;
    let aktiv = true;
    let id = 0;
    const t0 = performance.now();
    const schritt = (t) => {
      if (!aktiv) return;
      const p = ((t - t0) % dauer) / dauer;
      const pos = p < 0.5 ? p * 2 : 2 - p * 2;        // 0 -> 1 -> 0
      posRef.current = pos;
      if (markerRef.current) markerRef.current.style.left = pos * 100 + "%";
      id = requestAnimationFrame(schritt);
    };
    id = requestAnimationFrame(schritt);
    return () => {
      aktiv = false;
      cancelAnimationFrame(id);
    };
  }, [zielphase, dauer]);

  const zoneBasis =
    phase === "schnatz" ? 0.11 : [0, 0.12, 0.155, 0.19][ladung] || 0.12;
  const zone = boostAktiv ? Math.min(0.4, zoneBasis * 2.2) : zoneBasis;

  function pruefeRechnung() {
    const n = parseInt(eingabe, 10);
    if (Number.isNaN(n)) return;
    if (n === rechnung.loesung) {
      setLadung(versuche === 0 ? 3 : versuche === 1 ? 2 : 1);
      setVersuche(0);
      setEingabe("");
      setMeldung(null);
      setPhase("werfen");
      if (tonAn) {
        Ton.richtig();
        Ton.pika();
      }
    } else {
      setVersuche((v) => v + 1);
      setEingabe("");
      setMeldung("Nicht ganz. Rechne nochmal — der Wurf wartet auf dich.");
      if (tonAn) Ton.nochmal();
    }
  }

  function wirf() {
    const genau = Math.abs(posRef.current - 0.5) <= zone;
    setBoostAktiv(false);
    if (genau) {
      const neu = gryffindor + TOR_PUNKTE;
      setGryffindor(neu);
      setFehlserie(0);
      setTreffer(true);
      setMeldung(
        neu > slytherin
          ? "TOR! Gryffindor geht in Führung — und über dir blitzt etwas Goldenes auf."
          : "TOR! Der Quaffel ist durch den Ring."
      );
      if (tonAn) Ton.karte();
    } else {
      const serie = fehlserie + 1;
      setTreffer(false);
      if (serie >= 2) {
        setSlytherin((s) => s + TOR_PUNKTE);
        setFehlserie(0);
        setMeldung("Slytherins Hüterin hält — und kontert sofort. Kopf hoch, weiter!");
      } else {
        setFehlserie(serie);
        setMeldung("Knapp daneben, die Hüterin hält. Nochmal Anlauf nehmen!");
      }
      if (tonAn) Ton.nochmal();
    }
    setPhase("wurfErgebnis");
  }

  function fangeSchnatz() {
    const genau = Math.abs(posRef.current - 0.5) <= zone;
    setBoostAktiv(false);
    if (genau) {
      setGryffindor((g) => g + SCHNATZ_PUNKTE);
      setPhase("gewonnen");
      if (tonAn) {
        Ton.karte();
        Ton.pika();
      }
      onGewonnen();
    } else {
      const uebrig = schnatzVersuche - 1;
      setSchnatzVersuche(uebrig);
      if (tonAn) Ton.nochmal();
      if (uebrig <= 0) {
        setPhase("verloren");
      } else {
        setMeldung("Die Finger schließen sich um Luft. Der Schnatz ist noch da!");
        setPhase("schnatzErgebnis");
      }
    }
  }

  function naechsterAngriff() {
    setRechnung(neueRechnung());
    setLadung(0);
    setMeldung(null);
    setPhase("rechnen");
  }

  function nochmalVonVorn() {
    setGryffindor(GRYFFINDOR_START);
    setSlytherin(SLYTHERIN_START);
    setSchnatzVersuche(4);
    setFehlserie(0);
    setBoosts(Math.min(MAX_BOOSTS, Math.floor(voltGesamt / VOLT_PRO_BOOST)));
    setBoostAktiv(false);
    naechsterAngriff();
  }

  const rahmen = "min-h-screen bg-gradient-to-b from-indigo-950 to-purple-950 p-4";

  /* ---------------------------------------------- INTRO */
  if (phase === "intro") {
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-xl">
          <button onClick={onZurueck} className="text-sm text-yellow-300 hover:underline">
            ← Rätselkarte
          </button>
          <div className="mt-3 rounded-2xl border-2 border-yellow-500/40 bg-indigo-900/60 p-5 text-center">
            <div className="text-5xl">🏆</div>
            <h2 className="mt-2 font-serif text-3xl font-black text-yellow-300">
              Das Quidditch-Finale
            </h2>
            <p className="mt-3 text-amber-100">
              Es ist Halbzeit und Gryffindor liegt zurück. Du fliegst als Jägerin.
              Pikachu sitzt auf deinem Besenstiel — aufgeladen mit{" "}
              <b className="text-yellow-300">{voltGesamt} Volt</b> aus allen Rätseln,
              die du gelöst hast.
            </p>
            <div className="mt-4 space-y-2 rounded-2xl border border-yellow-500/30 bg-indigo-950/60 p-4 text-left text-sm text-amber-100">
              <p>
                <b className="text-yellow-300">1. Aufladen:</b> Löse eine Rechnung. Je
                schneller du sie triffst, desto kräftiger der Wurf.
              </p>
              <p>
                <b className="text-yellow-300">2. Werfen:</b> Der Quaffel fliegt hin und
                her. Tippe, wenn er im goldenen Feld ist.
              </p>
              <p>
                <b className="text-yellow-300">3. Der Schnatz:</b> Sobald Gryffindor führt,
                blitzt der Goldene Schnatz auf. Fang ihn — dann ist das Spiel gewonnen.
              </p>
              <p className="border-t border-yellow-500/20 pt-2">
                <b className="text-yellow-300">⚡ Pikachus Blitz:</b> Du hast{" "}
                <b>{boosts}</b>{" "}
                {boosts === 1 ? "Blitz" : "Blitze"} — jeder macht das goldene Feld für
                einen Wurf viel breiter. Die hast du dir erarbeitet.
              </p>
            </div>
            <Tafel gryffindor={gryffindor} slytherin={slytherin} />
            <button
              onClick={naechsterAngriff}
              className="mt-5 w-full rounded-2xl bg-red-700 px-6 py-4 text-xl font-black text-yellow-300 shadow-xl transition active:translate-y-0.5"
            >
              Aufs Spielfeld ⚡
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------- GEWONNEN */
  if (phase === "gewonnen") {
    return (
      <div className={rahmen}>
        <div className="mx-auto mt-4 max-w-lg rounded-2xl border-8 border-double border-yellow-500 bg-amber-50 p-8 text-center shadow-2xl">
          <div className="text-6xl">✨🏆✨</div>
          <h2 className="mt-3 font-serif text-3xl font-black text-stone-900">
            Gryffindor gewinnt!
          </h2>
          <p className="mt-4 font-serif text-lg text-stone-700">
            Du hast den Goldenen Schnatz gefangen. Endstand{" "}
            <b>
              {gryffindor} : {slytherin}
            </b>
            . Das ganze Stadion ruft deinen Namen — und Pikachu macht Funken.
          </p>
          <p className="mt-4 text-3xl">🦁 ⚡ 🥇</p>
          <p className="mt-2 font-serif italic text-stone-600">
            Der Quidditch-Pokal geht in dein Kartenalbum.
          </p>
          <button
            onClick={onZurueck}
            className="mt-6 w-full rounded-xl bg-red-700 py-3 font-bold text-yellow-200"
          >
            Zurück nach Hogwarts
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------- VERLOREN */
  if (phase === "verloren") {
    return (
      <div className={rahmen}>
        <div className="mx-auto max-w-xl">
          <div className="mt-4 rounded-2xl border-2 border-yellow-500/40 bg-indigo-900/60 p-6 text-center">
            <div className="text-5xl">🐍</div>
            <h2 className="mt-2 font-serif text-2xl font-black text-yellow-300">
              Slytherin hat den Schnatz
            </h2>
            <p className="mt-3 text-amber-100">
              Diesmal war er schneller. Das passiert auch den besten Jägerinnen — und
              das Spiel lässt sich wiederholen, so oft du willst.
            </p>
            <Tafel gryffindor={gryffindor} slytherin={slytherin} />
            <button
              onClick={nochmalVonVorn}
              className="mt-5 w-full rounded-2xl bg-red-700 px-6 py-4 text-xl font-black text-yellow-300"
            >
              Nochmal aufs Feld ⚡
            </button>
            <button
              onClick={onZurueck}
              className="mt-2 w-full rounded-xl border border-yellow-500/40 py-2 text-sm text-yellow-200/80"
            >
              Zurück zur Rätselkarte
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------- LAUFENDES SPIEL */
  const fuehrt = gryffindor > slytherin;

  return (
    <div className={rahmen}>
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between text-sm">
          <button onClick={onZurueck} className="text-yellow-300 hover:underline">
            ← Rätselkarte
          </button>
          <span className="font-bold text-amber-200">
            ⚡ {boosts} {boosts === 1 ? "Blitz" : "Blitze"}
            {phase === "schnatz" || phase === "schnatzErgebnis"
              ? " · 🟡 " + schnatzVersuche + " Versuche"
              : ""}
          </span>
        </div>

        <Tafel gryffindor={gryffindor} slytherin={slytherin} />

        {/* ---------- Rechnen ---------- */}
        {phase === "rechnen" && (
          <div className="mt-4 rounded-2xl border-2 border-yellow-500/40 bg-indigo-900/60 p-5">
            <p className="text-center text-sm font-bold uppercase tracking-widest text-amber-200">
              Pikachu aufladen
            </p>
            <p className="mt-3 text-center font-serif text-5xl font-black text-yellow-300">
              {rechnung.text}
            </p>
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={eingabe}
                onChange={(e) => setEingabe(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") pruefeRechnung();
                }}
                placeholder="?"
                className="w-full rounded-xl border-2 border-yellow-600/40 bg-indigo-950 px-4 py-4 text-center text-2xl font-black text-yellow-200 outline-none focus:border-yellow-400"
              />
              <button
                onClick={pruefeRechnung}
                className="rounded-xl bg-yellow-500 px-6 py-4 text-lg font-black text-stone-900 active:translate-y-0.5"
              >
                Laden ⚡
              </button>
            </div>
            {meldung && (
              <p className="mt-3 text-center text-sm font-bold text-amber-200">{meldung}</p>
            )}
          </div>
        )}

        {/* ---------- Werfen / Schnatz ---------- */}
        {zielphase && (
          <div className="mt-4 rounded-2xl border-2 border-yellow-500/40 bg-indigo-900/60 p-5">
            {phase === "werfen" ? (
              <>
                <p className="text-center text-sm font-bold uppercase tracking-widest text-amber-200">
                  Wurf mit Ladung {ladung} von 3
                </p>
                <Zielleiste
                  label="Tippe, wenn der Quaffel im goldenen Feld ist"
                  zone={zone}
                  markerRef={markerRef}
                />
                <button
                  onClick={wirf}
                  className="mt-4 w-full rounded-2xl bg-red-700 px-6 py-5 text-2xl font-black text-yellow-300 shadow-xl active:translate-y-0.5"
                >
                  Wurf! 🤾
                </button>
              </>
            ) : (
              <>
                <p className="text-center text-sm font-bold uppercase tracking-widest text-amber-200">
                  Der Goldene Schnatz — {schnatzVersuche}{" "}
                  {schnatzVersuche === 1 ? "Versuch" : "Versuche"}
                </p>
                <Zielleiste
                  label="Er ist schnell und klein. Tippe genau!"
                  zone={zone}
                  markerRef={markerRef}
                />
                <button
                  onClick={fangeSchnatz}
                  className="mt-4 w-full rounded-2xl bg-yellow-500 px-6 py-5 text-2xl font-black text-stone-900 shadow-xl active:translate-y-0.5"
                >
                  Fangen! ✨
                </button>
              </>
            )}
            {boosts > 0 && !boostAktiv && (
              <button
                onClick={() => {
                  setBoosts((b) => b - 1);
                  setBoostAktiv(true);
                  if (tonAn) Ton.pika();
                }}
                className="mt-2 w-full rounded-xl border-2 border-yellow-400/60 py-3 text-base font-bold text-yellow-200"
              >
                ⚡ Pikachus Blitz einsetzen ({boosts} übrig) — macht das Feld breiter
              </button>
            )}
            {boostAktiv && (
              <p className="mt-2 text-center text-sm font-black text-yellow-300">
                ⚡ Pikachus Blitz ist aktiv — das Feld ist jetzt viel breiter!
              </p>
            )}
          </div>
        )}

        {/* ---------- Ergebnis eines Wurfs ---------- */}
        {(phase === "wurfErgebnis" || phase === "schnatzErgebnis") && (
          <div className="mt-4 rounded-2xl border-2 border-yellow-500/40 bg-indigo-900/60 p-5 text-center">
            <div className="text-5xl">{treffer ? "🎉" : "🧤"}</div>
            <p className="mt-3 text-lg font-bold text-amber-100">{meldung}</p>
            {phase === "wurfErgebnis" && fuehrt ? (
              <button
                onClick={() => {
                  setMeldung(null);
                  setPhase("schnatz");
                }}
                className="mt-5 w-full rounded-2xl bg-yellow-500 px-6 py-4 text-xl font-black text-stone-900"
              >
                Dem Schnatz nachjagen 🟡
              </button>
            ) : phase === "wurfErgebnis" ? (
              <button
                onClick={naechsterAngriff}
                className="mt-5 w-full rounded-2xl bg-red-700 px-6 py-4 text-xl font-black text-yellow-300"
              >
                Nächster Angriff ⚡
              </button>
            ) : (
              <button
                onClick={() => {
                  setMeldung(null);
                  setPhase("schnatz");
                }}
                className="mt-5 w-full rounded-2xl bg-yellow-500 px-6 py-4 text-xl font-black text-stone-900"
              >
                Nochmal nach dem Schnatz greifen ✨
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function Raetselschule() {
  const [tonAn, setTonAn] = useState(true);
  const [musik, setMusik] = useState(false);
  const [pikaSpruch, setPikaSpruch] = useState(PIKA_START[0]);
  const [view, setView] = useState("start");
  const [idx, setIdx] = useState(0);
  const [geloest, setGeloest] = useState([]);
  const [ergebnisse, setErgebnisse] = useState({}); // Bestwert je Rätsel
  const [runde, setRunde] = useState(null); // Ergebnis der gerade gelösten Runde
  const [mut, setMut] = useState(0);
  const [eingabe, setEingabe] = useState("");
  const [hilfen, setHilfen] = useState({ lumos: false, accio: false, reducio: false });
  const [versuche, setVersuche] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [zeigLoesung, setZeigLoesung] = useState(false);
  const [geladen, setGeladen] = useState(false);
  const [pokal, setPokal] = useState(false);   // Quidditch-Finale gewonnen

  const a = AUFGABEN[idx];
  const voltGesamt = Object.values(ergebnisse).reduce((s2, e) => s2 + e.volt, 0);
  const voltMoeglich = AUFGABEN.length * VOLT_MAX_PRO_RAETSEL;
  const finaleOffen = voltGesamt >= FINALE_VOLT;
  const fertig = geloest.length === AUFGABEN.length;

  /* Fortschritt laden */
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("florentina-fortschritt");
        if (r?.value) {
          const d = JSON.parse(r.value);
          setGeloest(d.geloest || []);
          setErgebnisse(d.ergebnisse || {});
          setMut(d.mut || 0);
          setPokal(d.pokal || false);
        }
      } catch (e) {
        /* erster Start – nichts gespeichert */
      }
      setGeladen(true);
    })();
  }, []);

  /* Fortschritt speichern */
  useEffect(() => {
    if (!geladen) return;
    (async () => {
      try {
        await window.storage.set(
          "florentina-fortschritt",
          JSON.stringify({ geloest, ergebnisse, mut, pokal })
        );
      } catch (e) {
        /* nicht speicherbar – Spiel läuft trotzdem */
      }
    })();
  }, [geloest, ergebnisse, mut, pokal, geladen]);

  async function allesZuruecksetzen() {
    setGeloest([]);
    setErgebnisse({});
    setRunde(null);
    setMut(0);
    setPokal(false);
    setIdx(0);
    setEingabe("");
    setHilfen({ lumos: false, accio: false, reducio: false });
    setVersuche(0);
    setFeedback(null);
    setZeigLoesung(false);
    setView("start");
    try {
      await window.storage.set(
        "florentina-fortschritt",
        JSON.stringify({ geloest: [], ergebnisse: {}, mut: 0, pokal: false })
      );
    } catch (e) {
      /* kein Speicher – Zustand ist trotzdem zurückgesetzt */
    }
  }

  function zauberWirken(art) {
    if (hilfen[art]) return;
    setHilfen({ ...hilfen, [art]: true });
    setMut((m) => m + 1);
    if (tonAn) Ton.zauber();
    setPikaSpruch(PIKA_HILFE[Math.floor(Math.random() * PIKA_HILFE.length)]);
  }

  function neueAufgabe(i) {
    setPikaSpruch(PIKA_START[Math.floor(Math.random() * PIKA_START.length)]);
    setIdx(i);
    setEingabe("");
    setHilfen({ lumos: false, accio: false, reducio: false });
    setVersuche(0);
    setFeedback(null);
    setZeigLoesung(false);
    setView("task");
  }

  function pruefen() {
    if (eingabe.trim() === "") return;
    if (Number(eingabe) === a.antwort) {
      if (!geloest.includes(a.id)) setGeloest([...geloest, a.id]);
      const verdient = voltFuer(hilfen, zeigLoesung);
      const alt = ergebnisse[a.id];
      const neuerBestwert = !alt || verdient > alt.volt;
      const eintrag = { volt: verdient, ...hilfen, loesung: zeigLoesung };
      if (neuerBestwert) setErgebnisse({ ...ergebnisse, [a.id]: eintrag });
      setRunde({ ...eintrag, neuerBestwert, bisher: alt ? alt.volt : null });
      if (tonAn) {
        Ton.richtig();
        setTimeout(() => tonAn && Ton.karte(), 500);
      }
      setView("reward");
    } else {
      const v = versuche + 1;
      setVersuche(v);
      setFeedback(AUFMUNTERN[Math.min(v - 1, AUFMUNTERN.length - 1)]);
      setPikaSpruch(PIKA_FALSCH[Math.min(v - 1, PIKA_FALSCH.length - 1)]);
      if (tonAn) {
        Ton.nochmal();
        setTimeout(() => tonAn && Ton.pika(), 250);
      }
      if (v >= 2 && !hilfen.reducio) zauberWirken("reducio");
    }
  }

  const naechsteOffen = AUFGABEN.findIndex((x) => !geloest.includes(x.id));

  /* ============================ START ============================ */
  if (view === "start") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-950 p-5 text-center">
        <div className="mx-auto mt-6 max-w-xl">
          <div className="text-6xl">🦉</div>
          <p className="mt-3 font-serif text-sm uppercase tracking-[0.3em] text-yellow-400">
            Hogwarts · Haus Gryffindor
          </p>
          <h1 className="mt-2 font-serif text-4xl font-black leading-tight text-yellow-300 sm:text-5xl">
            Florentinas
            <br />
            Rätselschule
          </h1>

          <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-left shadow-2xl">
            <p className="font-serif text-lg leading-relaxed text-stone-800">
              Liebe Florentina,
              <br />
              <br />
              wir haben ein Problem. In Hogwarts sind alle Rätsel durcheinander
              geraten, und niemand kann sie lösen.
              <br />
              <br />
              Wir schicken dir <b>Pikachu</b> als Begleiter. Er lädt sich auf,
              sobald du ein Rätsel löst. Ab <b>{FINALE_VOLT} Volt</b> darf er beim
              Quidditch-Finale mitkämpfen.
              <br />
              <br />
              Du brauchst nichts vorher zu wissen. Du bekommst
              <b> drei Zaubersprüche</b> — die helfen dir bei jedem Rätsel.
              <br />
              <br />
              <span className="italic">Prof. McGonagall</span> 🪄
            </p>
          </div>

          <div className="mt-5 space-y-2 rounded-2xl border-2 border-yellow-500/40 bg-indigo-900/60 p-4 text-left">
            <p className="text-center text-sm font-bold uppercase tracking-widest text-yellow-400">
              Deine drei Zaubersprüche
            </p>
            <p className="text-amber-100">
              💡 <b>Lumos</b> — lässt alle Zahlen im Text aufleuchten.
            </p>
            <p className="text-amber-100">
              🔍 <b>Accio Frage</b> — holt hervor, was das Rätsel wirklich fragt.
            </p>
            <p className="text-amber-100">
              🪄 <b>Reducio</b> — zerlegt das Rätsel in kleine Schritte.
            </p>
            <p className="pt-2 text-center text-sm font-bold text-yellow-300">
              Jeder Zauberspruch gibt dir +1 Mut-Punkt. Hilfe holen ist hier
              tapfer, nicht schwach.
            </p>
          </div>

          <div className="mt-3 rounded-2xl border-2 border-yellow-500/40 bg-indigo-900/60 p-4 text-left">
            <p className="text-center text-sm font-bold uppercase tracking-widest text-yellow-400">
              So lädt sich Pikachu auf
            </p>
            <p className="mt-2 text-amber-100">
              Rätsel selbst gelöst: <b>{VOLT_BASIS} Volt</b> — immer, auch mit
              allen Zaubersprüchen.
            </p>
            <p className="text-amber-100">
              Für jeden Spruch, den du <i>nicht</i> gebraucht hast:{" "}
              <b>+{VOLT_BONUS} Volt</b>. Ganz allein geschafft ={" "}
              <b>{VOLT_MAX_PRO_RAETSEL} Volt</b>.
            </p>
            <p className="mt-2 text-center text-sm text-amber-200">
              Ein Rätsel darfst du so oft nochmal machen, wie du willst. Es
              zählt immer dein bester Versuch — schlechter wird es nie.
            </p>
          </div>

          <button
            onClick={() => neueAufgabe(naechsteOffen === -1 ? 0 : naechsteOffen)}
            className="mt-6 w-full rounded-2xl bg-red-700 px-6 py-4 text-xl font-black text-yellow-300 shadow-xl transition hover:-translate-y-0.5 hover:bg-red-600"
          >
            {geloest.length > 0 ? "Weiterzaubern ⚡" : "Rätselschule beginnen ⚡"}
          </button>
          {geloest.length > 0 && (
            <button
              onClick={() => setView("map")}
              className="mt-2 w-full rounded-xl border border-yellow-500/50 px-4 py-2 text-sm text-yellow-200"
            >
              Alle Kapitel ansehen
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ============================ KARTE / MAP ============================ */
  if (view === "map") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-purple-950 p-5">
        <div className="mx-auto max-w-xl">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-black text-yellow-300">
              Die Rätsel von Hogwarts
            </h2>
            <span className="text-sm font-bold text-amber-200">
              🦁 {geloest.length}/{AUFGABEN.length} · ⚡ {voltGesamt} · 💪 {mut}
            </span>
          </div>

          <p className="mt-2 text-sm text-amber-200">
            Tipp ein goldenes Rätsel nochmal an, wenn du mehr Volt holen willst.
          </p>

          {KAPITEL.map((k) => {
            const auf = AUFGABEN.filter((x) => x.kap === k.id);
            const offenIdx = AUFGABEN.findIndex((x) => !geloest.includes(x.id));
            const kapGesperrt = k.id === 5 && !finaleOffen;
            return (
              <div
                key={k.id}
                className={`mt-4 rounded-2xl border p-4 ${
                  kapGesperrt
                    ? "border-indigo-700/50 bg-indigo-950/60"
                    : "border-yellow-600/30 bg-indigo-900/50"
                }`}
              >
                <p className="font-serif text-lg font-bold text-amber-100">
                  {k.emoji} {k.titel}
                </p>
                {kapGesperrt && (
                  <p className="mt-1 text-sm font-bold text-yellow-400">
                    🔒 Pikachu braucht {FINALE_VOLT} Volt, um mitzukämpfen — noch{" "}
                    {FINALE_VOLT - voltGesamt} Volt.
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  {auf.map((x) => {
                    const ok = geloest.includes(x.id);
                    const i = AUFGABEN.indexOf(x);
                    const gesperrt =
                      kapGesperrt || (i > offenIdx && offenIdx !== -1);
                    const e = ergebnisse[x.id];
                    return (
                      <button
                        key={x.id}
                        disabled={gesperrt}
                        onClick={() => neueAufgabe(i)}
                        className={`flex h-16 flex-1 flex-col items-center justify-center rounded-xl font-black transition ${
                          ok
                            ? "bg-yellow-400 text-stone-900 hover:bg-yellow-300"
                            : gesperrt
                            ? "bg-indigo-800/50 text-indigo-600"
                            : "bg-red-700 text-yellow-200 hover:bg-red-600"
                        }`}
                      >
                        <span className="text-xl">
                          {ok ? "⭐" : gesperrt ? "🔒" : "?"}
                        </span>
                        {ok && (
                          <span className="text-xs font-bold">
                            {e ? e.volt : 0} V
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {finaleOffen && (
            <button
              onClick={() => setView("finale")}
              className="mt-5 w-full rounded-2xl border-2 border-yellow-400 bg-red-700 px-6 py-4 text-xl font-black text-yellow-300 shadow-xl active:translate-y-0.5"
            >
              🏆 {pokal ? "Quidditch-Finale nochmal spielen" : "Zum Quidditch-Finale!"}
            </button>
          )}

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setView("album")}
              className="flex-1 rounded-xl bg-yellow-500 py-3 font-bold text-stone-900"
            >
              🗂️ Kartenalbum
            </button>
            {fertig && (
              <button
                onClick={() => setView("urkunde")}
                className="flex-1 rounded-xl bg-red-700 py-3 font-bold text-yellow-200"
              >
                📜 Urkunde
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ============================ ALBUM ============================ */
  if (view === "album") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-purple-950 p-5">
        <div className="mx-auto max-w-xl">
          <h2 className="font-serif text-2xl font-black text-yellow-300">
            🗂️ Florentinas Kartenalbum
          </h2>
          <p className="mt-1 text-sm text-amber-200">
            {geloest.length} von {AUFGABEN.length} Karten · ⚡ {voltGesamt} von{" "}
            {voltMoeglich} Volt
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AUFGABEN.map((x) => {
              const ok = geloest.includes(x.id);
              return (
                <div
                  key={x.id}
                  className={`rounded-xl p-3 text-center ${
                    ok
                      ? "border-2 border-yellow-400 bg-amber-50"
                      : "border-2 border-dashed border-indigo-700 bg-indigo-900/40"
                  }`}
                >
                  <div className="text-4xl">{ok ? x.karte.emoji : "❔"}</div>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      ok ? "text-stone-800" : "text-indigo-500"
                    }`}
                  >
                    {ok ? x.karte.name : "noch geheim"}
                  </p>
                  {ok && (
                    <>
                      <p className="text-xs text-stone-500">{x.karte.art}</p>
                      <div className="mt-2 border-t border-stone-300 pt-1.5">
                        <p className="text-sm font-black text-yellow-700">
                          ⚡ {ergebnisse[x.id] ? ergebnisse[x.id].volt : 0} Volt
                        </p>
                        <SpruchZeile e={ergebnisse[x.id]} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {pokal && (
              <div className="rounded-xl border-2 border-yellow-400 bg-amber-50 p-3 text-center">
                <div className="text-4xl">🏆</div>
                <p className="mt-1 text-sm font-bold text-stone-800">Quidditch-Pokal</p>
                <p className="text-xs text-stone-500">Finalkarte ✦ selten</p>
                <div className="mt-2 border-t border-stone-300 pt-1.5">
                  <p className="text-sm font-black text-yellow-700">Schnatz gefangen ✦</p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setView("map")}
            className="mt-5 w-full rounded-xl bg-yellow-500 py-3 font-bold text-stone-900"
          >
            Zurück zu den Rätseln
          </button>
          <button
            onClick={allesZuruecksetzen}
            className="mt-2 w-full rounded-xl border border-red-400/40 py-2 text-xs text-red-300"
          >
            Alles von vorne beginnen (für Erwachsene) — löscht alle Karten
          </button>
        </div>
      </div>
    );
  }

  /* ============================ BELOHNUNG ============================ */
  if (view === "reward") {
    const naechste = AUFGABEN.findIndex((x) => !geloest.includes(x.id));
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-purple-950 p-5">
        <div className="mx-auto mt-8 max-w-md text-center">
          <p className="text-lg font-bold text-yellow-300">
            {LOB[a.id % LOB.length]}
          </p>
          <div className="mx-auto mt-4 w-64 rounded-2xl border-4 border-yellow-400 bg-amber-50 p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">
              Neue Karte
            </p>
            <div className="my-3 text-7xl">{a.karte.emoji}</div>
            <p className="font-serif text-xl font-black text-stone-900">
              {a.karte.name}
            </p>
            <p className="text-sm text-stone-500">{a.karte.art}</p>
          </div>
          <p className="mt-4 text-amber-100">{a.loesung}</p>

          {/* Volt-Abrechnung dieser Runde */}
          <div className="mt-4 rounded-2xl border border-yellow-500/40 bg-indigo-900/70 p-4 text-left">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold uppercase tracking-widest text-yellow-400">
                Diese Runde
              </span>
              <span className="text-2xl font-black text-yellow-300">
                +{runde ? runde.volt : 0} Volt
              </span>
            </div>
            <div className="mt-1">
              <SpruchZeile e={runde} dunkel />
            </div>
            {runde && runde.volt === VOLT_MAX_PRO_RAETSEL && (
              <p className="mt-2 text-sm font-bold text-yellow-200">
                Höchstwert! Mehr Volt gibt es für ein Rätsel nicht.
              </p>
            )}
            {runde && runde.loesung && (
              <p className="mt-2 text-sm text-amber-200">
                Der Lösungsweg war aufgedeckt — dafür gibt es keine Volt. Die
                Karte gehört dir trotzdem. Tipp das Rätsel später auf der
                Rätselkarte nochmal an und hol dir die Volt.
              </p>
            )}
            {runde && !runde.loesung && runde.volt < VOLT_MAX_PRO_RAETSEL && (
              <p className="mt-2 text-sm text-amber-200">
                Mit einem Zauberspruch weniger wären es{" "}
                {runde.volt + VOLT_BONUS} Volt. Du darfst dieses Rätsel jederzeit
                nochmal probieren.
              </p>
            )}
            {runde && runde.bisher !== null && (
              <p className="mt-2 text-sm font-bold text-yellow-300">
                {runde.neuerBestwert
                  ? `Neuer Bestwert! Vorher: ${runde.bisher} Volt.`
                  : `Dein Bestwert bleibt ${runde.bisher} Volt.`}
              </p>
            )}
            <p className="mt-3 border-t border-yellow-500/20 pt-2 text-sm text-amber-100">
              ⚡ Pikachu: <b>{voltGesamt} Volt</b>{" "}
              {finaleOffen ? (
                <span className="font-bold text-yellow-300">
                  · das Finale ist offen!
                </span>
              ) : (
                <span>
                  · noch {FINALE_VOLT - voltGesamt} bis zum Finale
                </span>
              )}
            </p>
          </div>

          <p className="mt-3 text-sm text-amber-300">
            🦁 {geloest.length} Karten · 💪 {mut} Mut-Punkte
          </p>

          {naechste === -1 ? (
            <button
              onClick={() => setView("urkunde")}
              className="mt-6 w-full rounded-2xl bg-red-700 py-4 text-lg font-black text-yellow-300"
            >
              Alle Rätsel gelöst! Urkunde ansehen 📜
            </button>
          ) : (
            <>
              <button
                onClick={() => neueAufgabe(naechste)}
                className="mt-6 w-full rounded-2xl bg-red-700 py-4 text-lg font-black text-yellow-300 hover:bg-red-600"
              >
                Nächstes Rätsel ⚡
              </button>
              <button
                onClick={() => setView("map")}
                className="mt-2 w-full rounded-xl border border-yellow-500/50 py-2 text-sm text-yellow-200"
              >
                Pause machen
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ============================ URKUNDE ============================ */
  if (view === "finale") {
    return (
      <QuidditchFinale
        voltGesamt={voltGesamt}
        tonAn={tonAn}
        onGewonnen={() => setPokal(true)}
        onZurueck={() => setView("map")}
      />
    );
  }

  if (view === "urkunde") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-purple-950 p-5">
        <div className="mx-auto mt-6 max-w-lg rounded-2xl border-8 border-double border-yellow-500 bg-amber-50 p-8 text-center shadow-2xl">
          <div className="text-5xl">🏆</div>
          <p className="mt-2 font-serif text-sm uppercase tracking-[0.3em] text-red-800">
            Schule für Hexerei und Zauberei
          </p>
          <h2 className="mt-3 font-serif text-3xl font-black text-stone-900">
            Meisterin der Rätsel
          </h2>
          <p className="mt-4 font-serif text-4xl font-black text-red-800">
            Florentina
          </p>
          <p className="mt-4 font-serif text-lg text-stone-700">
            hat alle {AUFGABEN.length} Rätsel von Hogwarts gelöst, {mut} Mal
            tapfer einen Zauberspruch benutzt und dabei bewiesen: Sie liest
            genau, denkt in Schritten und gibt nicht auf.
          </p>
          {pokal && (
            <p className="mt-4 font-serif text-lg font-bold text-red-800">
              Und im Quidditch-Finale hat sie den Goldenen Schnatz gefangen. 🏆
            </p>
          )}
          <p className="mt-4 text-3xl">🦁 ⚡ 🪄</p>
          <p className="mt-2 font-serif italic text-stone-600">
            Prof. McGonagall &nbsp;·&nbsp; Pikachu
          </p>
          {finaleOffen && !pokal && (
            <button
              onClick={() => setView("finale")}
              className="mt-6 w-full rounded-xl border-2 border-yellow-500 bg-red-700 py-3 text-lg font-black text-yellow-200"
            >
              🏆 Das Quidditch-Finale wartet noch!
            </button>
          )}
          <button
            onClick={() => setView("album")}
            className="mt-3 w-full rounded-xl bg-red-700 py-3 font-bold text-yellow-200"
          >
            Kartenalbum ansehen
          </button>
        </div>
      </div>
    );
  }

  /* ============================ AUFGABE ============================ */
  const kap = KAPITEL.find((k) => k.id === a.kap);
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-purple-950 p-4">
      <div className="mx-auto max-w-xl">
        {/* Kopfzeile */}
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={() => setView("map")}
            className="text-yellow-300 hover:underline"
          >
            ← Rätselkarte
          </button>
          <span className="flex items-center gap-2 font-bold text-amber-200">
            🦁 {geloest.length}/{AUFGABEN.length} · ⚡ {voltGesamt} · 💪 {mut}
            <TonSchalter
              tonAn={tonAn}
              setTonAn={setTonAn}
              musik={musik}
              setMusik={setMusik}
            />
          </span>
        </div>

        <p className="mt-3 font-serif text-sm uppercase tracking-widest text-yellow-400">
          {kap.emoji} {kap.titel}
        </p>

        {/* Pergament */}
        <div className="mt-2 rounded-2xl bg-amber-50 p-5 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-red-700">
            Rätsel {a.id}
          </p>
          <div className="mt-2">
            <StoryText text={a.story} leuchtet={hilfen.lumos} />
          </div>
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-lg font-bold text-red-900">
            {a.frage}
          </p>

          {/* Hilfen */}
          {hilfen.lumos && (
            <p className="mt-3 rounded-lg bg-yellow-100 p-3 text-stone-800">
              💡 <b>Lumos:</b> {a.lumos}
            </p>
          )}
          {hilfen.accio && (
            <p className="mt-2 rounded-lg bg-blue-50 p-3 text-stone-800">
              🔍 <b>Accio Frage:</b> {a.accio}
            </p>
          )}
          {hilfen.reducio && (
            <p className="mt-2 rounded-lg bg-purple-50 p-3 text-stone-800">
              🪄 <b>Reducio:</b> {a.reducio}
            </p>
          )}
          {zeigLoesung && (
            <p className="mt-2 rounded-lg border-2 border-green-300 bg-green-50 p-3 text-stone-800">
              ✅ <b>So geht es:</b> {a.loesung}
            </p>
          )}

          {/* Eingabe */}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={eingabe}
              onChange={(e) => {
                setEingabe(e.target.value);
                setFeedback(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && pruefen()}
              placeholder="?"
              className="w-28 rounded-xl border-4 border-stone-300 px-3 py-3 text-center text-2xl font-black text-stone-900 focus:border-yellow-500 focus:outline-none"
            />
            <span className="text-lg font-bold text-stone-600">
              {a.einheit}
            </span>
            <button
              onClick={pruefen}
              className="ml-auto rounded-xl bg-red-700 px-6 py-3 text-lg font-black text-yellow-200 shadow hover:bg-red-600"
            >
              Prüfen
            </button>
          </div>

          {feedback && (
            <p className="mt-3 rounded-xl bg-stone-100 p-3 font-bold text-stone-700">
              ⚡ {feedback}
            </p>
          )}
        </div>

        {/* Zaubersprüche */}
        <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-yellow-400">
          Zaubersprüche · jeder gibt +1 Mut-Punkt
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Zauber
            emoji="💡"
            name="Lumos"
            was="Zahlen leuchten auf"
            aktiv={hilfen.lumos}
            onClick={() => zauberWirken("lumos")}
          />
          <Zauber
            emoji="🔍"
            name="Accio Frage"
            was="Was ist gesucht?"
            aktiv={hilfen.accio}
            onClick={() => zauberWirken("accio")}
          />
          <Zauber
            emoji="🪄"
            name="Reducio"
            was="In Schritte zerlegen"
            aktiv={hilfen.reducio}
            onClick={() => zauberWirken("reducio")}
          />
        </div>

        <Pikachu
          volt={voltGesamt}
          max={voltMoeglich}
          spruch={pikaSpruch}
          tor={FINALE_VOLT}
        />

        {!zeigLoesung && (
          <button
            onClick={() => setZeigLoesung(true)}
            className="mt-3 w-full rounded-xl border border-yellow-500/40 py-2 text-sm text-yellow-200/80"
          >
            Ich will den ganzen Weg sehen (das ist erlaubt)
          </button>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Raetselschule />);
