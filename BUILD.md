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

## Wo was steckt

| Datei | Inhalt |
|---|---|
| `src/game.jsx` | Rätselschule. Hier wird gearbeitet. |
| `src/arena.jsx` | Zahlodex. Hier wird gearbeitet. |
| `src/vorlage.html` | Das HTML-Gerüst (Kopf, Styles, Speicher-Shim). Ändert man selten. |
| `tools/build.mjs` | Der Bauvorgang: Bibliotheken holen, JSX kompilieren, zusammensetzen. Welche Seiten gebaut werden, steht in `SEITEN`. |
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
- **Karteikasten**: `FANG_TREFFER` (dreimal richtig = gefangen) und `ABSTAND`
  (Wiedersehen nach 10 Min, 1 Tag, 3 Tagen, 1 Woche, 3 Wochen, in Minuten).
- **Lernreihenfolge**: `ORDNUNG` — was zuerst drankommt. `REVIER` legt fest, wie
  viele wilde Wesen gleichzeitig gejagt werden (Vorgabe 3).
- **Tempo**: `BLITZ_MS` (unter 4 Sekunden = Blitz), `KAMPF_ZEIT` und
  `KAMPF_FRAGEN` für die Arenen, `BLITZ_ZEIT` / `BLITZ_FRAGEN` /
  `BLITZ_AB_WESEN` für die Blitzrunde.
- **Umkehraufgaben** ("6 · ? = 42"): `UMKEHR_ANTEIL` legt fest, wie oft sie
  vorkommen, `UMKEHR_AB_STUFE`, ab wann. Gefragt ist immer die zweite Zahl.
- **Abwechslung**: Die Runde wird über `mischen` so gemischt, dass kein Wesen
  zweimal hintereinander drankommt; `waehleFakt` zieht die Rechnung zufällig
  und überspringt Rechnungen mit 1, solange es genug andere gibt.

## Zurück zur Ursprungsfassung

Die allererste Fassung (ohne eingebettete Bibliotheken, ohne Finale) liegt im
Branch `original-cdn-fassung`.
