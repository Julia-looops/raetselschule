# Rätselschule — wie man die Spiele ändert

Es gibt zwei Spiele:

| Seite | Spiel | Quelle |
|---|---|---|
| `index.html` | **Rätselschule** — Textaufgaben, Hogwarts, Quidditch-Finale | `src/game.jsx` |
| `arena.html` | **Zahlodex** — 1×1 und Plus/Minus bis 20 als Sammelspiel | `src/arena.jsx` |

Die Idee hinter dem Zahlodex steht in `ZAHLODEX.md`.

Beide ausgelieferten HTML-Dateien sind **erzeugt**, nicht handgeschrieben. Sie
enthalten React, Tailwind und den vorkompilierten Spielcode eingebettet, damit
die Seiten ohne fremde Server und offline laufen. Deshalb gilt:

> **Niemals `index.html` oder `arena.html` direkt bearbeiten.** Änderungen gehen
> in `src/game.jsx` bzw. `src/arena.jsx`.

## Einmalig einrichten

```bash
npm install
```

## Ändern und neu bauen

1. `src/game.jsx` oder `src/arena.jsx` bearbeiten — das ist der lesbare
   Quellcode der Spiele.
2. Bauen (baut immer beide Seiten):

```bash
npm run build
```

Das schreibt `index.html` und `arena.html` neu.

3. Vor dem Hochladen lokal ansehen:

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen. Wichtig: der Service Worker und
die Animation im Finale brauchen ein **sichtbares** Fenster — in einem
Hintergrund-Tab pausiert `requestAnimationFrame`, der Quaffel bewegt sich dann
nicht.

4. Veröffentlichen:

```bash
git add -A && git commit -m "Beschreibung" && git push
```

GitHub Pages baut danach automatisch, das dauert rund eine Minute.

## Fassungsnummer

Beide Seiten zeigen unten klein ihre Fassung, z. B. `Fassung 12 · 4.9.2026`.
Damit lässt sich am Gerät prüfen, ob ein Update wirklich angekommen ist — der
Browser oder die Seite auf dem Home-Bildschirm hält gern die alte Fassung.

Die Nummer setzt `tools/build.mjs` selbst: sie ist die Anzahl der Commits plus
eins, also die Fassung, die dieser Build wird. Im Quellcode steht nur der
Platzhalter `__FASSUNG__`, nichts muss von Hand hochgezählt werden. Beim Bauen
wird die Fassung auch ausgegeben.

## Wo was steckt

| Datei | Inhalt |
|---|---|
| `src/game.jsx` | Rätselschule. Hier wird gearbeitet. |
| `src/arena.jsx` | Zahlodex. Hier wird gearbeitet. |
| `src/vorlage.html` | Das HTML-Gerüst (Kopf, Styles, Speicher-Shim). Ändert man selten. |
| `tools/build.mjs` | Der Bauvorgang: Bibliotheken holen, JSX kompilieren, zusammensetzen. Welche Seiten gebaut werden, steht in `SEITEN`. Setzt auch die Fassungsnummer. |
| `index.html`, `arena.html` | **Erzeugt.** Nicht bearbeiten. |
| `sw.js` | Service Worker für den Offline-Betrieb. Neue Seiten dort eintragen und `CACHE` hochzählen. |
| `robots.txt` | Hält Suchmaschinen fern. |
| `ZAHLODEX.md` | Die Idee hinter dem zweiten Spiel. |

Die Bibliotheken landen beim ersten Bauen in `tools/.cache/` und werden danach
von dort genommen — ab dann baut es auch ohne Internet.

## Wichtige Details im Spielcode

- **Spielstand**: liegt im Browser unter `localStorage`, Schlüssel
  `florentina-fortschritt`, Format `{ geloest, ergebnisse, mut, pokal }`.
  Ältere Spielstände ohne `pokal` funktionieren weiter.
  **Diesen Schlüssel nicht umbenennen** — sonst ist der Fortschritt weg.
- **Volt**: `VOLT_BASIS` 6 pro Rätsel, `VOLT_BONUS` 2 je nicht gebrauchtem
  Zauberspruch, also höchstens 12. `FINALE_VOLT` 60 öffnet das Finale.
- **Finale**: `MAX_BOOSTS` deckelt Pikachus Blitze auf 3, damit Geschick zählt.
  Die Trefferzonen und Zeiten stehen in `zoneBasis` und `dauer`.
- **Ein neues Rätsel** hinzufügen: einen Eintrag im Array `AUFGABEN` ergänzen
  (fortlaufende `id`, `kap` für das Kapitel). Album, Karte und Urkunde zählen
  automatisch mit.

## Wichtige Details im Zahlodex (`src/arena.jsx`)

- **Spielstand**: eigener Schlüssel `florentina-zahlodex`, völlig getrennt vom
  Fortschritt der Rätselschule. Format: `{ aktiv, trainer: { Name: {...} } }` —
  jedes Kind hat eine eigene Trainerkarte.
- **Die Wesen** stehen in `WESEN_LISTE` (Nummer, Name, Bild). Nummer = Ergebnis.
  Namen und Bilder darf man frei ändern; Typ, Seltenheit und Entwicklung werden
  daraus **gerechnet** und passen sich von selbst an.
- **Sicherung**: `alsCode` / `ausCode` (`ZAHLODEX1:` + base64 des ganzen
  Spielstands), `namenAlsCode` / `namenAusCode` (`ZAHLODEXNAMEN1:`, nur die
  Namen). `sicherungsStand` entscheidet, wann das Hauptmenü mahnt.
- **Karteikasten**: `FANG_TREFFER` (dreimal richtig = gefangen) und `ABSTAND`
  (Wiedersehen nach 10 Min, 1 Tag, 3 Tagen, 1 Woche, 3 Wochen, in Minuten).
  Wie weit ein Wesen springt, entscheidet `nachWiedersehen` anhand des Tempos
  (`tempoVon`, Grenzen `BLITZ_MS` und `LANGSAM_MS`): blitzschnell zwei Stufen,
  normal eine, langsam keine (kommt aber binnen eines Tages wieder), falsch
  eine zurück. `faelligIn` streut jeden Abstand um ±15 %, damit nicht alles
  einer Sitzung gleichzeitig wieder ansteht.
- **Lernreihenfolge**: `ORDNUNG` — was zuerst drankommt. `REVIER` legt fest, wie
  viele wilde Wesen gleichzeitig gejagt werden (Vorgabe 3).
- **Der Kampf** (`ArenaKampf`) ist der einzige Modus mit Uhr — die frühere
  Blitzrunde steckt darin. `KAMPF_FRAGEN` (12), `ORDEN_PUNKTE` (110),
  `PUNKTE_GRUND` / `PUNKTE_TEMPO` / `PUNKTE_TRICK` / `PUNKTE_KOMBO`,
  `LUFT_HOLEN`. Wie viel Zeit eine Rechnung bekommt, rechnet `blitzZeit` aus
  (4, 6 oder 8 Sekunden je nach Schwierigkeit); wer in der ersten Hälfte
  antwortet, bekommt Tempobonus und eine ⚡.
- **Sterne und Liga**: `sterneFuer` vergibt je Kampf 0-3 Sterne, `ordenPunkte`
  und `meisterPunkte` leiten die Schwellen aus `kampfFragen` ab (12 Fragen in
  einer Arena, 16 in der Liga). Die Liga steht als eigener Eintrag in `ARENEN`
  und öffnet, wenn alle Orden aus `ARENEN_OHNE_LIGA` hängen; ihre Fragen kommen
  aus `ligaFakten` (6·6 bis 9·9).
- **Tricks**: `TRICK_KOSTEN` (⚡ je Trick), `MAX_TRICKS` pro Wesen, Namen und
  Bilder in `TRICK_REIHE`. Wer wann lernen darf, entscheidet `trickBedingung`:
  erster Trick sofort, zweiter bei voller Erforschung und Stufe 3, dritter erst
  nach `DAUER_NOETIG` überstandenen langen Pausen (Vorgabe 2). `dauer` ist ein
  Zähler; hochgezählt wird nur in `nachWiedersehen` und nur dann, wenn das
  Wiedersehen wirklich fällig **war** und blitzschnell oder normal beantwortet
  wurde. Zögern, Beere und ein Aufruf vor der Zeit zählen nicht — sonst lässt
  sich die Leiter in einer Sitzung durchlaufen.
- **Der Pokal**: `POKAL` (drei Stufen) und `POKAL_PAUSE` (3/7/21 Tage). Er hängt
  über den Sternen: drei Sterne starten die Uhr (`mitPokalStart`), danach gibt
  `pokalStand` frei, wenn die Pause abgelaufen ist. Ein Titelkampf ist ein
  normaler Kampf mit `arena.titel` und zählt ab `meisterPunkte`; Scheitern
  kostet nichts, gewartet wird nur zwischen Erfolgen. `meisterkrone`, wenn alle
  Arenen Gold tragen.
- **Eigene Namen**: `t.namen[nr] = { name, bild }` und `t.angriffe[nr][i]`
  liegen als Ebene über `WESEN_LISTE` und `TRICK_REIHE`. Gelesen wird
  ausschließlich über `wName`, `wBild` und `aName` — wer neue Anzeigen baut,
  darf `WESEN[nr].name` nicht direkt verwenden. Namen sind reine Deko; welche
  Rechnung zu welchem Wesen gehört, hängt allein an der Nummer.
- **Reifen**: `LEITER` enthält drei Abstandsleitern (leicht/mittel/schwer),
  `reifeArt` stuft ein Wesen nach seinem leichtesten Rechenweg ein. Schwere
  Wesen kommen früher wieder, haben aber mehr Stufen — sie kommen also öfter
  dran und gelten später als gereift.
- **Umkehraufgaben** ("6 · ? = 42"): `UMKEHR_ANTEIL` legt fest, wie oft sie
  vorkommen, `UMKEHR_AB_STUFE`, ab wann. Gefragt ist immer die zweite Zahl.
- **Abwechslung**: Die Runde wird über `mischen` so gemischt, dass kein Wesen
  zweimal hintereinander drankommt; `waehleFakt` zieht die Rechnung zufällig
  und überspringt Rechnungen mit 1, solange es genug andere gibt.
- **Erforschen**: `zielFakten` sagt, welche Rechnungen ein Wesen überhaupt
  stellt, `abdeckung` wie viele davon schon saßen (gespeichert je Wesen unter
  `g`). `waehleFakt` bevorzugt die noch fehlenden. `ENTDECKER_REVIER` legt fest,
  wie viele Wesen gleichzeitig Neues zeigen, `ENTDECKER_PLAETZE` wie oft eines
  davon je Runde drankommen darf — beides zusammen entscheidet, wie schnell
  Wesen fertig werden und wie abwechslungsreich die Runde bleibt.

## Zurück zur Ursprungsfassung

Die allererste Fassung (ohne eingebettete Bibliotheken, ohne Finale) liegt im
Branch `original-cdn-fassung`.
