# Rätselschule & Zahlodex

Zwei Lernspiele für Florentina (9) und später vielleicht ihre Freundinnen.
Alles auf Deutsch, alles offline lauffähig, alles ohne Server.

- **`index.html`** — Florentinas Rätselschule (Texträtsel), Quelle `src/game.jsx`
- **`arena.html`** — Zahlodex, die Rechen-Arena (1×1, Plus/Minus bis 20,
  Geteilt in der Super-Arena), Quelle `src/arena.jsx`

Live unter <https://julia-looops.github.io/raetselschule/>.

## Bauen

```bash
npm install                 # einmalig, @babel/core + preset-react
node tools/build.mjs        # baut index.html und arena.html
```

Der Build kompiliert JSX zu fertigem JavaScript und setzt React, ReactDOM und
Tailwind **in die HTML-Dateien hinein**. Die Spiele brauchen im Browser kein
Babel und keine Netzverbindung. `__FASSUNG__` im Quelltext wird durch
Commit-Zahl + Datum ersetzt — daran sieht man von aussen, ob ein Update
angekommen ist.

**Wenn der Bibliotheks-Cache fehlt** (`tools/.cache/` ist in `.gitignore`, ein
neuer Container hat ihn also nicht) und cdnjs nicht erreichbar ist — das ist in
der Cloud-Umgebung der Normalfall: die drei Bibliotheken stecken schon in der
eingecheckten `arena.html` und lassen sich von dort zurückholen.

```bash
node -e '
const fs=require("fs");
const html=fs.readFileSync("arena.html","utf8");
const rest=html.slice(html.indexOf("<script>\n")).slice("<script>\n".length);
const teile=rest.split("\n</script>\n<script>\n");
fs.mkdirSync("tools/.cache",{recursive:true});
["react.js","react-dom.js","tailwind.js"].forEach((n,i)=>{
  let c=teile[i]; const e=c.indexOf("\n</script>\n"); if(e>=0) c=c.slice(0,e);
  fs.writeFileSync("tools/.cache/"+n,c);
});'
```

Jeder Block muss beim **ersten** `</script>` enden — sonst schluckt der letzte
den `<style>`-Block und den Storage-Shim mit. Gegenprobe: nach einem Neubau
darf sich `index.html` gegenüber dem vorigen Stand **nur in der Datumszeile**
unterscheiden.

## Testen

```bash
node tools/build.mjs && node tools/tests/lauf.mjs
node tools/tests/lauf.mjs rechnen        # nur die schnelle Gruppe
node tools/tests/lauf.mjs oberflaeche    # nur die klickende Gruppe
```

Getestet wird die **gebaute** `arena.html`, also vorher bauen. Der Lauf bringt
seinen eigenen Dateiserver mit und braucht sonst nur Playwright mit Chromium
(in der Cloud-Umgebung global unter `/opt/node22/lib/node_modules/playwright`).

Die Oberflächengruppe dauert ein paar Minuten, weil sie echte Runden spielt und
an einer Stelle bewusst die Uhr ablaufen lässt. Vor jedem Push beide laufen
lassen.

Wenn ein Test fehlschlägt: **erst nachsehen, ob das Produkt oder der Test falsch
liegt.** Beides ist hier schon vorgekommen, und einen echten Fehler
wegzukonfigurieren wäre das Schlimmste.

## Git

Entwickelt wird auf `claude/pokemon-math-learning-game-buwq41`, danach

```bash
git push -u origin claude/pokemon-math-learning-game-buwq41
git checkout main && git merge --ff-only claude/pokemon-math-learning-game-buwq41
git push origin main && git checkout claude/pokemon-math-learning-game-buwq41
```

**Erst der Merge nach `main` bringt das Update zu Florentina** — GitHub Pages
liefert von `main`. Nach dem Push den Pages-Lauf prüfen.

Commit-Nachrichten erzählen das *Warum*, nicht nur das *Was*, gern mit
Messwerten. Die Historie ist die einzige Erinnerung, die eine neue Session hat.

## Was beim Bauen zu beachten ist

**Die Regeln der Auftraggeberin** (Julia, die Mutter — sie testet mit dem Kind
und meldet zurück):

- **Ideen vor der Umsetzung zeigen.** Bei allem, was über einen Fehlerfix
  hinausgeht: erst kurz vorschlagen, dann bauen. Sie entscheidet gern selbst.
- **Texte im Spiel sind für das Kind**, nicht für die Erwachsene. Keine
  Erläuterungen, sondern etwas, worin sich ein Kind auskennt.
- **Eine Belohnung darf nie bedeuten, dass weniger gerechnet wird.** Punkte,
  Sterne, Pokale — aber nie weniger Aufgaben.
- **Nie wegnehmen, was das Kind erspielt hat.** Regeln dürfen strenger werden,
  aber rückwirkend aberkannt wird nichts.
- **Eine laufende Fassungsnummer** muss sichtbar bleiben, sonst lässt sich nicht
  prüfen, ob ein Update angekommen ist.

**Zwei Fehlerarten, die hier wiederholt aufgetreten sind:**

1. **Anzeigen, die aus einer losenden Funktion gespeist werden.** `arenaTeam`
   rief für die Super-Arena `superFakten()` auf — bei jedem Neuzeichnen kam eine
   andere Wesenreihe heraus, die Zeilenzahl sprang, und das Eingabefeld sprang
   mit. Alles, was angezeigt wird, muss entweder gerechnet oder einmalig
   festgelegt sein.
2. **Schwellen, die an Punkten hängen.** Punkte wachsen mit Tempo- und
   Trickbonus mit, also sank die Latte, je stärker das Team wurde — mit drei
   Tricks je Wesen reichten acht von zwölf Fehlern noch für den Orden. Wo es um
   Können geht, zählen **Treffer**, nicht Punkte.

Die Einzelheiten zu allen Stellschrauben stehen in **`BUILD.md`**, das Konzept
hinter dem Zahlodex in **`ZAHLODEX.md`**. Beide beim Ändern mitpflegen.

## Was nicht ins Repo gehört

Florentinas Spielstand lebt ausschliesslich in ihrem Browser (localStorage,
Schlüssel `florentina-fortschritt` und `florentina-zahlodex`). Deshalb gibt es
im Spiel unter ⚙️ → 🔐 eine Sicherung als Code oder Datei. **Die Schlüssel
dürfen nicht umbenannt werden**, sonst ist der Stand weg.

Es gibt keinen Server, kein Konto, keine Messung — nichts verlässt das Gerät.
Das ist Absicht und soll so bleiben.
