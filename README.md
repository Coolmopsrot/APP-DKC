# DKC Live Komplett

## Enthalten
- Gaststarter Registrierung
- Live Dashboard
- Admin Pro Login
- Starter bearbeiten / löschen / Status ändern
- Öffentliche Dokumente-Seite
- Admin Dokumente hochladen / löschen
- Supabase Storage Bucket `documents`
- DKC Logo

## Demo Admin Login
admin@dkc.de
DKC2026!

## Für IONOS
Build Command: npm run build
Output Directory: dist

## Supabase Variablen
VITE_SUPABASE_URL=https://deinprojekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein_anon_key

## Einrichtung
1. `supabase/schema.sql` im SQL Editor ausführen
2. Prüfen, dass der Storage Bucket `documents` existiert
3. Admin in Supabase Auth anlegen

- Mojo D5 Reifenbestellung pro Lauf
- Bestätigungsmail über die konfigurierte Mail-Function

- Mail-Fix für Reifenbestellung über direkte Edge-Function `smart-worker`

- Mail-Fix für Gaststarterregistrierung über direkte Edge-Function `smart-worker`


## Profi-Mail Trennung
Diese Version sendet unterschiedliche Mailtexte für:
- Gaststarterregistrierung (`type: "registration"`)
- Reifenbestellung (`type: "tires"`)

Wichtig:
Die Supabase Edge Function `smart-worker` muss durch die Datei
`supabase/functions/smart-worker/index.ts`
aus dieser ZIP ersetzt und neu deployed werden.
