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
