import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  try {
    const { email, firstName, lastName, race, kartClass, kartNumber, teamName } = await req.json();

    const result = await resend.emails.send({
      from: "DKC Anmeldung <noreply@kartserie.de>",
      to: [email],
      subject: "Bestätigung deiner DKC-Anmeldung",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Deine Anmeldung ist eingegangen</h2>
          <p>Hallo ${firstName} ${lastName},</p>
          <p>deine Anmeldung zur Deutschen Kartchallenge wurde erfolgreich gespeichert.</p>
          <ul>
            <li><strong>Rennen:</strong> ${race}</li>
            <li><strong>Klasse:</strong> ${kartClass}</li>
            <li><strong>Kartnummer:</strong> ${kartNumber}</li>
            <li><strong>Teamname:</strong> ${teamName}</li>
          </ul>
          <p>Sportliche Grüße<br/>Deutsche Kartchallenge</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
