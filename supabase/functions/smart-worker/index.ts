import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, email, firstName, lastName, race, kartNumber, teamName, kartClass, quantity } = await req.json();

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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    let subject = "";
    let html = "";

    if (type === "registration") {
      subject = "🏁 Deine Anmeldung zur DKC wurde bestätigt";
      html = `<div style="font-family:Arial,sans-serif;background:#111111;color:#ffffff;padding:20px"><div style="max-width:600px;margin:auto;background:#1a1a1a;border-radius:10px;overflow:hidden"><div style="background:#e10600;padding:15px;text-align:center;font-size:20px;font-weight:bold;color:#ffffff">🏁 Deutsche Kartchallenge</div><div style="padding:20px"><h2 style="color:#facc15;margin-top:0;">Anmeldung bestätigt</h2><p style="color:#ffffff;">Hallo <strong>${firstName || "-"} ${lastName || ""}</strong>,</p><p style="color:#ffffff;">du bist erfolgreich für folgendes Rennen registriert:</p><div style="margin-top:18px;background:#f3f4f6;border-radius:8px;padding:14px;color:#111111;"><p style="margin:0 0 8px 0;"><strong>Rennen:</strong> ${race || "-"}</p><p style="margin:0 0 8px 0;"><strong>Kartnummer:</strong> ${kartNumber || "-"}</p><p style="margin:0 0 8px 0;"><strong>Team:</strong> ${teamName || "-"}</p><p style="margin:0;"><strong>Klasse:</strong> ${kartClass || "-"}</p></div><p style="margin-top:20px;color:#ffffff;">Wir wünschen dir viel Erfolg und spannende Rennen! 🏎️</p><div style="margin-top:20px;font-size:12px;color:#aaaaaa">DKC – Deutsche Kartchallenge</div></div></div></div>`;
    } else if (type === "tires") {
      subject = "🛞 Deine Reifenbestellung wurde bestätigt";
      html = `<div style="font-family:Arial,sans-serif;background:#111111;color:#ffffff;padding:20px"><div style="max-width:600px;margin:auto;background:#1a1a1a;border-radius:10px;overflow:hidden"><div style="background:#e10600;padding:15px;text-align:center;font-size:20px;font-weight:bold;color:#ffffff">🏁 Deutsche Kartchallenge</div><div style="padding:20px"><h2 style="color:#facc15;margin-top:0;">Reifenbestellung bestätigt</h2><p style="color:#ffffff;">Hallo <strong>${firstName || "-"} ${lastName || ""}</strong>,</p><p style="color:#ffffff;">deine Bestellung wurde erfolgreich aufgenommen:</p><div style="margin-top:18px;background:#f3f4f6;border-radius:8px;padding:14px;color:#111111;"><p style="margin:0 0 8px 0;"><strong>Rennen:</strong> ${race || "-"}</p><p style="margin:0;"><strong>Reifen:</strong> ${Number(quantity) || "-"} x Mojo D5</p></div><p style="margin-top:20px;color:#ffffff;">Deine Reifen stehen am Renntag für dich bereit.</p><div style="margin-top:20px;font-size:12px;color:#aaaaaa">DKC – Deutsche Kartchallenge</div></div></div></div>`;
    } else {
      subject = "DKC Benachrichtigung";
      html = `<div style="font-family:Arial,sans-serif;padding:20px;color:#111111;"><p>Hallo ${firstName || "-"} ${lastName || ""},</p><p>deine Anfrage wurde verarbeitet.</p></div>`;
    }

    await transporter.sendMail({
      from: \`"\${fromName}" <\${fromMail}>\`,
      to: email,
      subject,
      html,
    });

    if (adminMail) {
      await transporter.sendMail({
        from: \`"\${fromName}" <\${fromMail}>\`,
        to: adminMail,
        subject: \`[Admin-Kopie] \${subject}\`,
        html,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
