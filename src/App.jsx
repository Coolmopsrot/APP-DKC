import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Gauge, Filter, CalendarDays, Download, ShieldCheck, Search, BarChart3, Database, RefreshCw } from "lucide-react";

const races = [
  "1. Lauf – 26.04.26 – Lohsa",
  "2. Lauf – 17.05.26 – Belleben",
  "3. Lauf – 21.06.26 – Mülsen",
  "4. Lauf – 13.09.26 – Nachtrennen Belleben",
  "5. Lauf – 27.09.26 – Cheb",
  "6. Lauf – 11.10.26 – Wallrav",
];

const classes = [
  "Rotax Senior",
  "Rotax Junior",
  "Rotax Mini",
  "Rotax Micro",
  "Rotax DD2",
  "Rotax DD2 Master",
  "Rotax DD2 Trophy",
  "FUN Klasse",
];

const demoRegistrations = [
  { id: 1, race: races[0], firstName: "Max", lastName: "Beispiel", kartNumber: "27", teamName: "Speed Factory", kartClass: "Rotax Senior", status: "Bestätigt", email: "max@example.com", createdAt: "2026-01-12T10:00:00.000Z" },
  { id: 2, race: races[0], firstName: "Leon", lastName: "Richter", kartNumber: "5", teamName: "Kart Brothers", kartClass: "Rotax Junior", status: "Bestätigt", email: "leon@example.com", createdAt: "2026-01-15T12:30:00.000Z" },
  { id: 3, race: races[1], firstName: "Lena", lastName: "Muster", kartNumber: "14", teamName: "Night Riders", kartClass: "Rotax Junior", status: "Offen", email: "lena@example.com", createdAt: "2026-01-18T08:20:00.000Z" },
  { id: 4, race: races[1], firstName: "Tom", lastName: "Seidel", kartNumber: "88", teamName: "Red Apex", kartClass: "Rotax Senior", status: "Bestätigt", email: "tom@example.com", createdAt: "2026-01-19T09:15:00.000Z" },
  { id: 5, race: races[2], firstName: "Paul", lastName: "Schmidt", kartNumber: "3", teamName: "Mülsen GP", kartClass: "Rotax DD2", status: "Bestätigt", email: "paul@example.com", createdAt: "2026-01-22T14:00:00.000Z" },
  { id: 6, race: races[3], firstName: "Mia", lastName: "Hahn", kartNumber: "11", teamName: "Belleben Racing", kartClass: "FUN Klasse", status: "Offen", email: "mia@example.com", createdAt: "2026-01-23T16:05:00.000Z" },
];

function sortByKart(data) {
  return [...data].sort((a, b) => {
    const aNum = Number(String(a.kartNumber).replace(/[^\d]/g, ""));
    const bNum = Number(String(b.kartNumber).replace(/[^\d]/g, ""));
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) return aNum - bNum;
    return String(a.kartNumber).localeCompare(String(b.kartNumber), "de");
  });
}

function exportToCsv(rows) {
  const csvHeader = ["Rennen","Vorname","Nachname","Kartnummer","Teamname","Klasse","Status","E-Mail","Registriert am"];
  const csvRows = rows.map((item) => [
    item.race, item.firstName, item.lastName, item.kartNumber, item.teamName,
    item.kartClass, item.status, item.email || "", item.createdAt ? new Date(item.createdAt).toLocaleString("de-DE") : ""
  ]);
  const content = [csvHeader, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "DKC-Starterliste.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function loadSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, anonKey);
}

export default function DKCLiveDashboard() {
  const [selectedRace, setSelectedRace] = useState("Alle Rennen");
  const [selectedClass, setSelectedClass] = useState("Alle Klassen");
  const [search, setSearch] = useState("");
  const [registrations, setRegistrations] = useState(demoRegistrations);
  const [sourceLabel, setSourceLabel] = useState("Demo Daten");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => { loadRegistrations(); }, []);

  async function loadRegistrations() {
    setIsLoading(true);
    setLoadError("");
    try {
      const supabase = await loadSupabaseClient();
      if (!supabase) {
        setRegistrations(demoRegistrations);
        setSourceLabel("Demo Daten");
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map((item, index) => ({
        id: item.id || index + 1,
        race: item.race,
        firstName: item.first_name,
        lastName: item.last_name,
        kartNumber: item.kart_number,
        teamName: item.team_name,
        kartClass: item.kart_class,
        email: item.email,
        createdAt: item.created_at,
        status: item.status || "Bestätigt",
      }));
      setRegistrations(mapped);
      setSourceLabel("Supabase Live Daten");
    } catch {
      setRegistrations(demoRegistrations);
      setSourceLabel("Demo Daten");
      setLoadError("Live-Daten konnten noch nicht geladen werden. Aktuell wird die Demo angezeigt.");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRegistrations = useMemo(() => {
    return sortByKart(registrations.filter((entry) => {
      const matchesRace = selectedRace === "Alle Rennen" || entry.race === selectedRace;
      const matchesClass = selectedClass === "Alle Klassen" || entry.kartClass === selectedClass;
      const query = search.toLowerCase();
      const matchesSearch = !query ||
        `${entry.firstName} ${entry.lastName}`.toLowerCase().includes(query) ||
        entry.teamName.toLowerCase().includes(query) ||
        entry.kartNumber.toLowerCase().includes(query);
      return matchesRace && matchesClass && matchesSearch;
    }));
  }, [registrations, selectedRace, selectedClass, search]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const confirmed = registrations.filter((r) => r.status === "Bestätigt").length;
    const open = registrations.filter((r) => r.status === "Offen").length;
    const classesCount = new Set(registrations.map((r) => r.kartClass)).size;
    return { total, confirmed, open, classesCount };
  }, [registrations]);

  const raceStats = useMemo(() => races.map((race) => ({ race, count: registrations.filter((r) => r.race === race).length })), [registrations]);
  const classStats = useMemo(() => classes
      .map((item) => ({ name: item, count: registrations.filter((r) => r.kartClass === item).length }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count), [registrations]);

  return (
    <div className="page">
      <div className="container space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hero-grid">
          <div className="card">
            <div className="badges">
              <span className="pill red">DKC Live Dashboard</span>
              <span className="pill gold">Admin Übersicht</span>
              <span className="pill dark">{sourceLabel}</span>
            </div>
            <div className="hero-content">
              <img className="hero-logo" src="/dkc-logo.png" alt="DKC Logo" />
              <div>
                <h1>Deutsche Kartchallenge</h1>
                <p className="muted">Zentrale Live-Verwaltung für Starterlisten, Rennübersichten, Klassenverteilung, Statuskontrolle und schnelle Suche.</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title"><ShieldCheck size={18} color="#facc15" /> Live Status</div>
            <div className="stack">
              <div className="rowbox"><span><Database size={16} color="#ef4444" /> Datenquelle</span><strong>{sourceLabel}</strong></div>
              <button onClick={loadRegistrations} className="rowbtn">
                <span><RefreshCw size={16} color="#facc15" /> Daten neu laden</span>
                <span className="muted">{isLoading ? "lädt..." : "jetzt"}</span>
              </button>
              <div className="rowbox">Ideal für Laptop, Tablet und Handy</div>
            </div>
          </div>
        </motion.div>

        {loadError && <div className="warn">{loadError}</div>}

        <div className="stats-grid">
          {[
            { label: "Starter gesamt", value: stats.total, icon: Users, color: "#ef4444" },
            { label: "Bestätigt", value: stats.confirmed, icon: Trophy, color: "#facc15" },
            { label: "Offen", value: stats.open, icon: Gauge, color: "#e4e4e7" },
            { label: "Aktive Klassen", value: stats.classesCount, icon: BarChart3, color: "#f87171" },
          ].map((item) => (
            <div key={item.label} className="card stat">
              <div>
                <div className="muted small">{item.label}</div>
                <div className="big">{item.value}</div>
              </div>
              <item.icon size={24} color={item.color} />
            </div>
          ))}
        </div>

        <div className="main-grid">
          <div className="side-stack">
            <div className="card">
              <div className="section-title"><CalendarDays size={18} color="#facc15" /> Rennen im Überblick</div>
              <div className="stack">
                {raceStats.map((item) => (
                  <div key={item.race} className="rowbox">
                    <div className="small">{item.race}</div>
                    <span className="pill red">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="section-title"><BarChart3 size={18} color="#ef4444" /> Klassenverteilung</div>
              <div className="stack">
                {classStats.map((item) => (
                  <div key={item.name}>
                    <div className="row small"><span>{item.name}</span><strong style={{color:"#facc15"}}>{item.count}</strong></div>
                    <div className="bar"><div className="barfill" style={{ width: stats.total ? `${(item.count / stats.total) * 100}%` : "0%" }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="toolbar">
              <div>
                <div className="section-title"><Filter size={18} color="#facc15" /> Starterverwaltung</div>
                <p className="muted small">Filtern, durchsuchen und als Datei exportieren.</p>
              </div>
              <button onClick={() => exportToCsv(filteredRegistrations)} className="btn redbtn">
                <Download size={16} /> Export CSV
              </button>
            </div>

            <div className="filter-grid">
              <label>
                <span className="small">Rennen</span>
                <select value={selectedRace} onChange={(e) => setSelectedRace(e.target.value)}>
                  <option>Alle Rennen</option>
                  {races.map((race) => <option key={race}>{race}</option>)}
                </select>
              </label>

              <label>
                <span className="small">Klasse</span>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option>Alle Klassen</option>
                  {classes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>

              <label>
                <span className="small">Suche</span>
                <div className="searchwrap">
                  <Search className="searchicon" size={16} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, Team, Nr." />
                </div>
              </label>
            </div>

            <div className="stack">
              {filteredRegistrations.map((entry) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="entry-card">
                  <div className="row entry-top">
                    <div>
                      <div className="entry-name">#{entry.kartNumber} · {entry.firstName} {entry.lastName}</div>
                      <div className="muted small">{entry.race}</div>
                    </div>
                    <div className="badges">
                      <span className="pill gold">{entry.kartClass}</span>
                      <span className={`pill ${entry.status === "Bestätigt" ? "ok" : "dark"}`}>{entry.status}</span>
                    </div>
                  </div>
                  <div className="detail-grid small">
                    <div>Team: <strong>{entry.teamName}</strong></div>
                    <div>E-Mail: <strong>{entry.email || "-"}</strong></div>
                  </div>
                </motion.div>
              ))}

              {!isLoading && filteredRegistrations.length === 0 && <div className="emptybox">Keine passenden Starter gefunden.</div>}
              {isLoading && <div className="emptybox">Live-Daten werden geladen...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
