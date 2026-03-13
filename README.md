# DKC Live Admin Pro

## Enthalten
- Gaststarter Registrierung
- Live Dashboard
- Admin Pro Login
- Starter bearbeiten
- Starter löschen
- Status ändern
- CSV Export
- Filter nach Rennen, Klasse und Status
- Supabase Insert / Select / Update / Delete
- DKC Logo
- Demo-Fallback, wenn Supabase noch nicht verbunden ist

## Demo Admin Login
admin@dkc.de
DKC2026!

## Für IONOS
Build Command: npm run build
Output Directory: dist

## Supabase Variablen
VITE_SUPABASE_URL=https://deinprojekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein_anon_key

- Dashboard ohne E-Mail-Anzeige


## IONOS Mail über Supabase Edge Function

Diese Version verschickt nach erfolgreicher Registrierung automatisch eine Bestätigungsmail über deinen IONOS SMTP-Server.

### Edge Function
Die Function liegt in:
- `supabase/functions/send-ionos-mail/index.ts`

### Benötigte Secrets in Supabase
Lege in Supabase für die Edge Function diese Secrets an:

- `IONOS_SMTP_USER` = deine IONOS Mailadresse
- `IONOS_SMTP_PASS` = dein IONOS Mailpasswort
- `IONOS_SMTP_HOST` = `smtp.ionos.de`
- `IONOS_SMTP_PORT` = `587`
- `IONOS_FROM_EMAIL` = z.B. `info@deinedomain.de`
- `IONOS_FROM_NAME` = z.B. `DKC Kartserie`
- `IONOS_ADMIN_EMAIL` = optionale Kopie an dich

### Frontend Variable
Zusätzlich im Frontend:
- `VITE_SUPABASE_FUNCTIONS_URL=https://DEINPROJEKT.supabase.co/functions/v1`

### Deploy der Edge Function
Mit Supabase CLI:
- `supabase functions deploy send-ionos-mail --no-verify-jwt`

