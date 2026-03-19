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

    const {
      type,
      email,
      firstName,
      lastName,
      race,
      kartNumber,
      teamName,
      kartClass,
      quantity,
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

    const primary = "#e10600";
    const dark = "#111";
    const gold = "#facc15";

    if (type === "registration") {
      subject = "🏁 Deine Anmeldung zur DKC wurde bestätigt";
      html = `
      <div style="font-family:Arial,sans-serif;background:${dark};color:#fff;padding:20px">
        <div style="max-width:600px;margin:auto;background:#1a1a1a;border-radius:10px;overflow:hidden">
          <div style="background:${primary};padding:15px;text-align:center;font-size:20px;font-weight:bold">🏁 Deutsche Kartchallenge</div>
          <div style="padding:20px">
            <h2 style="color:${gold}">Anmeldung bestätigt</h2>
            <p>Hallo <strong>${firstName} ${lastName}</strong>,</p>
            <p>du bist erfolgreich für folgendes Rennen registriert:</p>
            <table style="width:100%;margin-top:15px">
              <tr><td><strong>Rennen:</strong></td><td>${race}</td></tr>
              <tr><td><strong>Kartnummer:</strong></td><td>${kartNumber}</td></tr>
              <tr><td><strong>Team:</strong></td><td>${teamName}</td></tr>
              <tr><td><strong>Klasse:</strong></td><td>${kartClass}</td></tr>
            </table>
            <p style="margin-top:20px">Wir wünschen dir viel Erfolg und spannende Rennen! 🏎️</p>
            <div style="margin-top:20px;font-size:12px;color:#aaa">DKC – Deutsche Kartchallenge</div>
          </div>
        </div>
      </div>`;
    } else if (type === "tires") {
      subject = "🛞 Deine Reifenbestellung wurde bestätigt";
      html = `
      <div style="font-family:Arial,sans-serif;background:${dark};color:#fff;padding:20px">
        <div style="max-width:600px;margin:auto;background:#1a1a1a;border-radius:10px;overflow:hidden">
          <div style="background:${primary};padding:15px;text-align:center;font-size:20px;font-weight:bold">🏁 Deutsche Kartchallenge</div>
          <div style="padding:20px">
            <h2 style="color:${gold}">Reifenbestellung bestätigt</h2>
            <p>Hallo <strong>${firstName} ${lastName}</strong>,</p>
            <p>deine Bestellung wurde erfolgreich aufgenommen:</p>
            <table style="width:100%;margin-top:15px">
              <tr><td><strong>Rennen:</strong></td><td>${race}</td></tr>
              <tr><td><strong>Reifen:</strong></td><td>${quantity} x Mojo D5</td></tr>
            </table>
            <p style="margin-top:20px">Deine Reifen stehen am Renntag für dich bereit.</p>
            <div style="margin-top:20px;font-size:12px;color:#aaa">DKC – Deutsche Kartchallenge</div>
          </div>
        </div>
      </div>`;
    } else {
      subject = "DKC Benachrichtigung";
      html = `<p>Hallo ${firstName} ${lastName},</p><p>deine Anfrage wurde verarbeitet.</p>`;
    }

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
        subject: `[Admin-Kopie] ${subject}`,
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
