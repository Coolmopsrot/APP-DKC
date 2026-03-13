import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import nodemailer from "npm:nodemailer";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const {
      email,
      firstName,
      lastName,
      race,
      kartNumber,
      teamName,
      kartClass,
    } = await req.json();

    const smtpUser = Deno.env.get("IONOS_SMTP_USER");
    const smtpPass = Deno.env.get("IONOS_SMTP_PASS");
    const smtpHost = Deno.env.get("IONOS_SMTP_HOST") || "smtp.ionos.de";
    const smtpPort = Number(Deno.env.get("IONOS_SMTP_PORT") || "587");
    const fromMail = Deno.env.get("IONOS_FROM_EMAIL") || smtpUser || "info@example.com";
    const fromName = Deno.env.get("IONOS_FROM_NAME") || "DKC Kartserie";
    const adminMail = Deno.env.get("IONOS_ADMIN_EMAIL");

    if (!smtpUser || !smtpPass) {
      return new Response(JSON.stringify({ ok: false, error: "Missing SMTP credentials" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subject = "DKC Gaststarter Anmeldung bestätigt";

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2 style="margin-bottom:8px;">DKC Gaststarter Anmeldung</h2>
        <p>Hallo ${firstName} ${lastName},</p>
        <p>deine Anmeldung wurde erfolgreich gespeichert.</p>
        <table style="border-collapse:collapse;">
          <tr><td style="padding:4px 10px 4px 0;"><strong>Rennen:</strong></td><td>${race}</td></tr>
          <tr><td style="padding:4px 10px 4px 0;"><strong>Kartnummer:</strong></td><td>${kartNumber}</td></tr>
          <tr><td style="padding:4px 10px 4px 0;"><strong>Teamname:</strong></td><td>${teamName}</td></tr>
          <tr><td style="padding:4px 10px 4px 0;"><strong>Klasse:</strong></td><td>${kartClass}</td></tr>
        </table>
        <p>Wir freuen uns auf dich!</p>
        <p>Sportliche Grüße<br />DKC Kartserie</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"${fromName}" <${fromMail}>`,
      to: email,
      subject,
      html,
    });

    if (adminMail) {
      await transporter.sendMail({
        from: `"${fromName}" <${fromMail}>`,
        to: adminMail,
        subject: `Neue DKC Anmeldung: ${firstName} ${lastName}`,
        html,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
