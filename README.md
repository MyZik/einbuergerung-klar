# Einbürgerung Klar

Responsive React-Lernapp für den Einbürgerungstest. Hamburg ist vorausgewählt, alle 16 Bundesländer sind verfügbar.

## Funktionen

- 300 allgemeine Fragen und je 10 Fragen pro Bundesland (460 Datensätze), einschließlich 43 Abbildungen.
- Lernmodus mit sofortigem Feedback, Suche, Themenfiltern und Merkliste.
- 30-Fragen-Übung ohne Zeitlimit und Prüfungssimulation mit 30 allgemeinen und 3 Landesfragen, 60 Minuten und Bestehensgrenze 17.
- Fortschritt und laufende Tests werden lokal gespeichert. Bei Neuladen läuft die Prüfungszeit weiter.
- Supabase-basierte Fragenverwaltung mit bestätigter E-Mail-Anmeldung. Berechtigungen werden in PostgreSQL geprüft.
- Fragen können erstellt, bearbeitet und deaktiviert werden. Bilder lassen sich als HTTPS-Adresse oder vorhandener lokaler Bildpfad pflegen.

## Entwicklung

Node.js 22.12+ und npm:

```sh
npm ci
cp .env.example .env.local
# Öffentliche Supabase-Konfiguration ergänzen.
npm run dev
npm test
npm run build
```

Benötigt werden `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY`. Niemals einen Secret-/Service-Role-Schlüssel ins Frontend eintragen. `.env.local` wird nicht eingecheckt.

## Datenbank und Admin

`supabase/schema.sql` enthält das initiale Schema. Die produktive Migration wurde bereits angewendet. Ein Neuaufbau benötigt dieses Schema und den Import von `src/questions.json`. Freigeschaltete Admin-Adressen stehen ausschließlich in `private.admin_emails`; die Eigentümer-Adresse wird nicht ins Repository übernommen.

`/admin` sendet auf Anforderung einen Supabase-Magic-Link. Site URL und Redirect URLs müssen zur Deployment-Domain passen. Das Auth-Konto wird beim ersten Anfordern eines Links angelegt; es wird kein Passwort vorbelegt. Supabases Standard-Mailversand hat Empfänger- und Ratenbeschränkungen; für zusätzliche Nutzer kann eigenes SMTP nötig sein.

## Bereitstellung

Vite baut nach `dist`. Vercel verwendet den SPA-Rewrite aus `vercel.json`. Die GitHub-Verbindung ermöglicht automatische Deployments des Produktionsbranches. Beide öffentlichen Konfigurationsvariablen sind in Production, Preview und Development erforderlich.

## Quellen und Grenzen

Siehe [SOURCES.md](SOURCES.md). Bei nicht erreichbarer Datenbank dient der beiliegende Katalog als ausdrücklich gekennzeichneter Fallback. Dies ist kein vollständiger Offline-Modus: Erstaufruf und nicht zwischengespeicherte Bilder benötigen Internet.

Änderungen aus Supabase erscheinen beim nächsten Laden. Laufende Tests behalten ihren begonnenen Fragenstand. Lernfortschritt und Merkliste bleiben in diesem Browser und werden nicht zwischen Geräten synchronisiert. Die App ist ein unabhängiges Lernangebot.
