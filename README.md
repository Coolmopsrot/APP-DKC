# DKC Anmeldung – finale ZIP

Diese ZIP ist die fertige Frontend-Version für deine DKC-Anmeldung.

## Schon enthalten
- DKC-Design in Schwarz / Rot / Gelb
- Handyfreundliches Layout
- Gaststarter-Formular
- Felder: Vorname, Nachname, E-Mail, Kartnummer, Teamname, Klasse
- Rennen für 2026
- Kartnummer nur einmal pro Rennen
- Admin-Login in der Demo
- Admin-Filter nach Rennen und Klasse
- Excel-Export
- Starterlisten pro Lauf nach Kartnummer sortiert
- Logo im public-Ordner

## Demo-Login
- Benutzername: admin
- Passwort: kart2026

## Lokal testen
npm install
npm run dev

## Für IONOS Deploy Now
- Build Command: npm run build
- Output Folder: dist

## Wichtig
Diese ZIP ist voll funktionsfähig als Frontend-Demo.
Für echten Live-Betrieb mit Datenbank, echtem Admin-Login und echtem Mailversand musst du noch anbinden:
- Supabase
- Resend
- echte Umgebungsvariablen

Die vorbereiteten Dateien dafür liegen schon in:
- .env.example
- supabase/schema.sql
- supabase/functions/send-confirmation/index.ts
