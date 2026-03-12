import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { races, kartClasses, adminDemo, demoRegistrations } from "./data";

const STORAGE_KEY = "dkc_registrations_final_v1";

const emptyForm = {
  race: races[0],
  firstName: "",
  lastName: "",
  email: "",
  kartNumber: "",
  teamName: "",
  kartClass: "",
};

function readInitialData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoRegistrations;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : demoRegistrations;
  } catch {
    return demoRegistrations;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function numericKart(value) {
  const n = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function sortByKart(items) {
  return [...items].sort((a, b) => {
    const aNum = numericKart(a.kartNumber);
    const bNum = numericKart(b.kartNumber);
    if (aNum !== null && bNum !== null && aNum !== bNum) return aNum - bNum;
    return String(a.kartNumber).localeCompare(String(b.kartNumber), "de");
  });
}

function confirmationMail(entry) {
  return [
    `Hallo ${entry.firstName} ${entry.lastName},`,
    "",
    "deine Anmeldung zur Deutschen Kartchallenge wurde erfolgreich erfasst.",
    "",
    `Rennen: ${entry.race}`,
    `Klasse: ${entry.kartClass}`,
    `Kartnummer: ${entry.kartNumber}`,
    `Teamname: ${entry.teamName}`,
    "",
    "Diese Demo zeigt bereits die fertige Mail-Vorlage.",
    "Für den Live-Betrieb wird der echte Versand per Supabase Edge Function + Resend angebunden.",
    "",
    "Sportliche Grüße",
    "Deutsche Kartchallenge",
  ].join("\n");
}

export default function App() {
  const [registrations, setRegistrations] = useState(readInitialData);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [emailText, setEmailText] = useState("");
  const [adminUser, setAdminUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [raceFilter, setRaceFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  const raceCards = useMemo(() => {
    return races.map((race) => {
      const entries = sortByKart(registrations.filter((item) => item.race === race));
      return { race, entries };
    });
  }, [registrations]);

  const filtered = useMemo(() => {
    let items = [...registrations];
    if (raceFilter !== "all") items = items.filter((item) => item.race === raceFilter);
    if (classFilter !== "all") items = items.filter((item) => item.kartClass === classFilter);
    items.sort((a, b) => {
      if (a.race !== b.race) return a.race.localeCompare(b.race, "de");
      const aNum = numericKart(a.kartNumber);
      const bNum = numericKart(b.kartNumber);
      if (aNum !== null && bNum !== null && aNum !== bNum) return aNum - bNum;
      return a.lastName.localeCompare(b.lastName, "de");
    });
    return items;
  }, [registrations, raceFilter, classFilter]);

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submitRegistration(e) {
    e.preventDefault();
    setNotice("");
    setError("");
    setEmailText("");

    const values = Object.values(form).map((v) => String(v).trim());
    if (values.some((v) => !v)) {
      setError("Bitte fülle alle Pflichtfelder aus.");
      return;
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!validEmail) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }

    const duplicate = registrations.some(
      (item) =>
        item.race === form.race &&
        String(item.kartNumber).trim().toLowerCase() === String(form.kartNumber).trim().toLowerCase()
    );

    if (duplicate) {
      setError("Diese Kartnummer ist für dieses Rennen bereits vergeben.");
      return;
    }

    const entry = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      race: form.race.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      kartNumber: form.kartNumber.trim(),
      teamName: form.teamName.trim(),
      kartClass: form.kartClass.trim(),
    };

    const updated = [...registrations, entry];
    setRegistrations(updated);
    saveData(updated);
    setForm(emptyForm);
    setNotice("Registrierung erfolgreich gespeichert.");
    setEmailText(confirmationMail(entry));
  }

  function login(e) {
    e.preventDefault();
    if (adminUser === adminDemo.user && adminPassword === adminDemo.password) {
      setIsAdmin(true);
      setError("");
    } else {
      setError("Ungültige Zugangsdaten. Demo-Login: admin / kart2026");
    }
  }

  function exportExcel() {
    const rows = filtered.map((item) => ({
      Rennen: item.race,
      Vorname: item.firstName,
      Nachname: item.lastName,
      EMail: item.email,
      Kartnummer: item.kartNumber,
      Teamname: item.teamName,
      Klasse: item.kartClass,
      RegistriertAm: new Date(item.createdAt).toLocaleString("de-DE"),
    }));
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, "Starterliste");
    XLSX.writeFile(workbook, "DKC-Starterliste.xlsx");
  }

  function resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    setRegistrations(demoRegistrations);
    setNotice("Demo-Daten wurden zurückgesetzt.");
    setError("");
    setEmailText("");
  }

  return (
    <div className="page">
      <div className="container">
        <header className="hero card">
          <div className="hero-copy">
            <div className="badges">
              <span className="badge red">DKC 2026</span>
              <span className="badge gold">Gaststarter Registrierung</span>
            </div>
            <h1>Deutsche Kartchallenge</h1>
            <p>
              Finale Frontend-Version für IONOS. Handyfreundlich, mit Admin-Bereich,
              Excel-Export, Kartnummer-Prüfung und vorbereiteter E-Mail-Bestätigung.
            </p>
            <div className="meta-grid">
              <div className="meta-box">
                <strong>{races.length}</strong>
                <span>Rennen</span>
              </div>
              <div className="meta-box">
                <strong>{registrations.length}</strong>
                <span>Starter gesamt</span>
              </div>
            </div>
          </div>
          <div className="hero-logo-wrap">
            <img className="hero-logo" src="/dkc-logo.png" alt="DKC Logo" />
          </div>
        </header>

        <main className="main-grid">
          <section className="card">
            <h2>Gaststarter Anmeldung</h2>
            <p className="muted">Alle Pflichtfelder ausfüllen. Kartnummern sind pro Rennen eindeutig.</p>

            <form onSubmit={submitRegistration} className="form-grid">
              <label>
                <span>Rennen</span>
                <select value={form.race} onChange={(e) => handleChange("race", e.target.value)}>
                  {races.map((race) => (
                    <option key={race} value={race}>{race}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Vorname</span>
                <input value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
              </label>

              <label>
                <span>Nachname</span>
                <input value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
              </label>

              <label className="full">
                <span>E-Mail</span>
                <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              </label>

              <label>
                <span>Kartnummer</span>
                <input value={form.kartNumber} onChange={(e) => handleChange("kartNumber", e.target.value)} />
              </label>

              <label>
                <span>Teamname</span>
                <input value={form.teamName} onChange={(e) => handleChange("teamName", e.target.value)} />
              </label>

              <label className="full">
                <span>Klasse</span>
                <select value={form.kartClass} onChange={(e) => handleChange("kartClass", e.target.value)}>
                  <option value="">Klasse auswählen</option>
                  {kartClasses.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <button type="submit" className="btn btn-red full">Registrierung absenden</button>
            </form>

            {notice && <div className="notice success">{notice}</div>}
            {error && <div className="notice error">{error}</div>}

            {emailText && (
              <div className="mail-box">
                <h3>Bestätigungsmail-Vorschau</h3>
                <pre>{emailText}</pre>
              </div>
            )}
          </section>

          <section className="card">
            <h2>Rennen & Starterlisten</h2>
            <p className="muted">Automatisch sortiert nach Kartnummer.</p>
            <div className="race-list">
              {raceCards.map(({ race, entries }) => (
                <div key={race} className="race-card">
                  <div className="race-top">
                    <strong>{race}</strong>
                    <span className="chip">{entries.length} Starter</span>
                  </div>

                  {entries.length ? (
                    <div className="entry-stack">
                      {entries.map((item) => (
                        <div key={item.id} className="entry-row">
                          <span>{item.firstName} {item.lastName}</span>
                          <b>#{item.kartNumber}</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">Noch keine Starter registriert.</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>

        <section className="card admin-section">
          <div className="admin-head">
            <div>
              <h2>Admin Bereich</h2>
              <p className="muted">Login, Filter und Excel-Export.</p>
            </div>
            <button className="btn btn-dark" onClick={resetDemo}>Demo zurücksetzen</button>
          </div>

          {!isAdmin ? (
            <form onSubmit={login} className="admin-login">
              <label>
                <span>Benutzername</span>
                <input value={adminUser} onChange={(e) => setAdminUser(e.target.value)} />
              </label>
              <label>
                <span>Passwort</span>
                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
              </label>
              <button type="submit" className="btn btn-gold">Als Admin anmelden</button>
            </form>
          ) : (
            <>
              <div className="filters">
                <label>
                  <span>Rennen</span>
                  <select value={raceFilter} onChange={(e) => setRaceFilter(e.target.value)}>
                    <option value="all">Alle Rennen</option>
                    {races.map((race) => (
                      <option key={race} value={race}>{race}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Klasse</span>
                  <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                    <option value="all">Alle Klassen</option>
                    {kartClasses.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <div className="button-group">
                  <button type="button" className="btn btn-red" onClick={exportExcel}>Excel exportieren</button>
                  <button type="button" className="btn btn-dark" onClick={() => setIsAdmin(false)}>Logout</button>
                </div>
              </div>

              <div className="admin-cards">
                {filtered.length ? filtered.map((item) => (
                  <div key={item.id} className="admin-card">
                    <div className="admin-top">
                      <strong>#{item.kartNumber} · {item.firstName} {item.lastName}</strong>
                      <span className="chip gold">{item.kartClass}</span>
                    </div>
                    <div className="detail">Rennen: <b>{item.race}</b></div>
                    <div className="detail">E-Mail: <b>{item.email}</b></div>
                    <div className="detail">Teamname: <b>{item.teamName}</b></div>
                    <div className="detail">Registriert: <b>{new Date(item.createdAt).toLocaleString("de-DE")}</b></div>
                  </div>
                )) : (
                  <div className="empty">Keine Registrierungen für die aktuelle Filterauswahl.</div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="card">
          <h2>Live-Anbindung vorbereitet</h2>
          <ul className="checklist">
            <li>Frontend läuft direkt auf IONOS Deploy Now</li>
            <li>Logo liegt sauber im public-Ordner</li>
            <li>Supabase-Datei und .env.example sind enthalten</li>
            <li>SQL-Schema für echte Speicherung ist enthalten</li>
            <li>README erklärt die nächsten Live-Schritte</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
