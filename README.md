# simplebydefault.com

Statische Website. Reines HTML, CSS und Vanilla-JavaScript. Kein Framework,
kein Build-Step, keine externen Requests. Die Seite lädt keine Schriften,
Bilder oder Skripte von Dritten, setzt keine Cookies und misst nichts.

## Dateien

```
index.html         Startseite mit den zwei Zuständen (Noise und Sharp)
impressum.html     Rechtliches, aktuell Platzhalter
datenschutz.html   Rechtliches, aktuell Platzhalter
noise.css          Alle Stile
noise.js           Rauschen, Popups, Scharfstellung, Kontakt-Widget
logo.svg           Bildmarke, dient zugleich als Favicon
CNAME              Custom Domain für GitHub Pages
```

Mehr gibt es nicht. Jede Datei wird gebraucht.

## Wie die Startseite funktioniert

Der Zustand hängt an einem einzigen Attribut, `data-state` am `<html>`.

- **Noise:** dunkel, körniges Filmkorn auf einem Canvas, dazu schwebende
  Fake-Benachrichtigungen, die nach und nach reinpoppen. Headline und
  Subline sind unscharf; scharf ist nur der Button.
- **Sharp:** ein Klick, und alles stellt in 0,3 Sekunden scharf. Die Seite
  wechselt auf Papier und Tinte, Korn und Popups lösen sich auf. Dazu ein
  kurzer Snap über die Web Audio API, ohne Sound-Datei. Zurück geht es über
  „Re-add noise" oben rechts.

`prefers-reduced-motion` wird respektiert: statisches Korn, sofortige
Scharfstellung, keine Puls- oder Driftanimationen.

Das Kontakt-Widget öffnet einen vorausgefüllten Mail-Entwurf. Es gibt kein
Backend und keinen Formular-Endpoint.

Die Rechtsseiten stehen fest auf `data-state="sharp"` und brauchen deshalb
kein JavaScript.

## Deploy über GitHub Pages

1. **Settings → Pages**
2. Source: **Deploy from a branch**, Ordner `/ (root)`
3. Custom domain wird aus der Datei `CNAME` gelesen
4. Sobald das Zertifikat ausgestellt ist: **Enforce HTTPS** aktivieren

DNS beim Registrar (Spaceship):

```
@     A      185.199.108.153
@     A      185.199.109.153
@     A      185.199.110.153
@     A      185.199.111.153
www   CNAME  <dein-github-user>.github.io
```

Es gibt keinen Build-Schritt. Was im Branch liegt, ist die Seite.

## Vor dem Launch

- [ ] `impressum.html`: Platzhalter durch geprüfte Angaben ersetzen
- [ ] `datenschutz.html`: Platzhalter durch geprüfte Angaben ersetzen
- [ ] `hello@simplebydefault.com` muss empfangsbereit sein
- [ ] Jahreszahl in den Footern prüfen, sie steht fest im Markup
