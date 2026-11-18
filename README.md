# DKC Race Control

Mobile Saisoneinschreibung und Gaststarts, Veranstaltungsverwaltung, Teilnehmerlisten, technische Abnahme, Reifenbestellungen und PDF-Unterlagen.

## Betrieb
- Frontend: React/Vite auf IONOS Deploy Now
- Backend: Supabase Edge Function `dkc-control`, geschützte `dkc_*` Tabellen und privater PDF-Bucket
- Fahrerportal: `/?view=register`
- Verwaltung: `/?view=admin` (bestätigtes Supabase-Konto mit DKC-Rolle)
- Reifen: `/?view=tyres`; Dokumente: `/?view=documents`

## Entwicklung
`npm install`, `npm test`, `npm run build`

Nur VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY gehören in die Frontend-Konfiguration. Service-Role-Schlüssel und SMTP-Zugangsdaten bleiben ausschließlich im Backend.

## Testbetrieb
Die Veranstaltung TEST – DKC Funktionsprüfung ist kein echter Renntermin. Test-Gastanmeldungen und Test-Reifenbestellungen versenden keine E-Mails. Bestehende 2026-Daten bleiben in ihren ursprünglichen Tabellen erhalten.
