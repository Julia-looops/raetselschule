# Rätselschule — wie man das Spiel ändert

Die ausgelieferte `index.html` ist **erzeugt**, nicht handgeschrieben. Sie enthält
React, Tailwind und den vorkompilierten Spielcode eingebettet, damit die Seite
ohne fremde Server und offline läuft. Deshalb gilt:

> **Niemals `index.html` direkt bearbeiten.** Änderungen gehen in `src/game.jsx`.

## Einmalig einrichten

```bash
npm install
```

## Ändern und neu bauen

1. `src/game.jsx` bearbeiten — das ist der lesbare Quellcode des Spiels
   (Rätsel, Kapitel, Volt-Regeln, Quidditch-Finale).
2. Bauen:

```bash
npm run build
```

Das schreibt `index.html` neu.

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
| `src/game.jsx` | Der Spielcode. Hier wird gearbeitet. |
| `src/vorlage.html` | Das HTML-Gerüst (Kopf, Styles, Speicher-Shim). Ändert man selten. |
| `tools/build.mjs` | Der Bauvorgang: Bibliotheken holen, JSX kompilieren, zusammensetzen. |
| `index.html` | **Erzeugt.** Nicht bearbeiten. |
| `sw.js` | Service Worker für den Offline-Betrieb. |
| `robots.txt` | Hält Suchmaschinen fern. |

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

## Zurück zur Ursprungsfassung

Die allererste Fassung (ohne eingebettete Bibliotheken, ohne Finale) liegt im
Branch `original-cdn-fassung`.
