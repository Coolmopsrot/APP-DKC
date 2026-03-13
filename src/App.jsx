import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Gauge, Filter, CalendarDays, Download, ShieldCheck, Search, BarChart3, Database, RefreshCw, ClipboardCheck, LayoutDashboard } from "lucide-react";

const races = ["1. Lauf – 26.04.26 – Lohsa","2. Lauf – 17.05.26 – Belleben","3. Lauf – 21.06.26 – Mülsen","4. Lauf – 13.09.26 – Nachtrennen Belleben","5. Lauf – 27.09.26 – Cheb","6. Lauf – 11.10.26 – Wallrav"];
const classes = ["Rotax Senior","Rotax Junior","Rotax Mini","Rotax Micro","Rotax DD2","Rotax DD2 Master","Rotax DD2 Trophy","FUN Klasse"];
const demoRegistrations = [
  { id: 1, race: races[0], firstName: "Max", lastName: "Beispiel", kartNumber: "27", teamName: "Speed Factory", kartClass: "Rotax Senior", status: "Bestätigt", email: "max@example.com", createdAt: "2026-01-12T10:00:00.000Z" },
  { id: 2, race: races[0], firstName: "Leon", lastName: "Richter", kartNumber: "5", teamName: "Kart Brothers", kartClass: "Rotax Junior", status: "Bestätigt", email: "leon@example.com", createdAt: "2026-01-15T12:30:00.000Z" },
  { id: 3, race: races[1], firstName: "Lena", lastName: "Muster", kartNumber: "14", teamName: "Night Riders", kartClass: "Rotax Junior", status: "Offen", email: "lena@example.com", createdAt: "2026-01-18T08:20:00.000Z" },
];
const emptyForm = { race: races[0], firstName: "", lastName: "", email: "", kartNumber: "", teamName: "", kartClass: "" };
function numericKart(value){const n=Number(String(value).replace(/[^\d]/g,"")); return Number.isNaN(n)?null:n;}
function sortByKart(data){return [...data].sort((a,b)=>{const aNum=numericKart(a.kartNumber), bNum=numericKart(b.kartNumber); if(aNum!==null&&bNum!==null&&aNum!==bNum)return aNum-bNum; return String(a.kartNumber).localeCompare(String(b.kartNumber),"de");});}
function exportToCsv(rows){const header=["Rennen","Vorname","Nachname","Kartnummer","Teamname","Klasse","Status","E-Mail","Registriert am"]; const csv=[header,...rows.map(i=>[i.race,i.firstName,i.lastName,i.kartNumber,i.teamName,i.kartClass,i.status,i.email||"",i.createdAt?new Date(i.createdAt).toLocaleString("de-DE"):""])].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\n"); const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="DKC-Starterliste.csv"; a.click(); URL.revokeObjectURL(url);}
async function loadSupabaseClient(){const url=import.meta.env.VITE_SUPABASE_URL; const anonKey=import.meta.env.VITE_SUPABASE_ANON_KEY; if(!url||!anonKey) return null; const { createClient } = await import("@supabase/supabase-js"); return createClient(url, anonKey);}

export default function App(){
  const [tab,setTab]=useState("registration");
  const [selectedRace,setSelectedRace]=useState("Alle Rennen");
  const [selectedClass,setSelectedClass]=useState("Alle Klassen");
  const [search,setSearch]=useState("");
  const [registrations,setRegistrations]=useState(demoRegistrations);
  const [sourceLabel,setSourceLabel]=useState("Demo Daten");
  const [isLoading,setIsLoading]=useState(true);
  const [loadError,setLoadError]=useState("");
  const [form,setForm]=useState(emptyForm);
  const [formError,setFormError]=useState("");
  const [formNotice,setFormNotice]=useState("");
  const [isSubmitting,setIsSubmitting]=useState(false);

  useEffect(()=>{ loadRegistrations(); }, []);
  async function loadRegistrations(){
    setIsLoading(true); setLoadError("");
    try{
      const supabase=await loadSupabaseClient();
      if(!supabase){ setRegistrations(demoRegistrations); setSourceLabel("Demo Daten"); setIsLoading(false); return; }
      const { data, error } = await supabase.from("registrations").select("*").order("created_at",{ascending:false});
      if(error) throw error;
      const mapped=(data||[]).map((item,index)=>({id:item.id||index+1,race:item.race,firstName:item.first_name,lastName:item.last_name,kartNumber:item.kart_number,teamName:item.team_name,kartClass:item.kart_class,email:item.email,createdAt:item.created_at,status:item.status||"Bestätigt"}));
      setRegistrations(mapped); setSourceLabel("Supabase Live Daten");
    } catch {
      setRegistrations(demoRegistrations); setSourceLabel("Demo Daten"); setLoadError("Live-Daten konnten noch nicht geladen werden. Aktuell wird die Demo angezeigt.");
    } finally { setIsLoading(false); }
  }
  function handleFormChange(key,value){ setForm(prev=>({...prev,[key]:value})); }
  async function submitRegistration(e){
    e.preventDefault(); setFormError(""); setFormNotice("");
    const values=Object.values(form).map(v=>String(v).trim()); if(values.some(v=>!v)){ setFormError("Bitte fülle alle Pflichtfelder aus."); return; }
    const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()); if(!validEmail){ setFormError("Bitte gib eine gültige E-Mail-Adresse ein."); return; }
    const duplicate=registrations.some(item=>item.race===form.race && String(item.kartNumber).trim().toLowerCase()===String(form.kartNumber).trim().toLowerCase());
    if(duplicate){ setFormError("Diese Kartnummer ist für dieses Rennen bereits vergeben."); return; }
    setIsSubmitting(true);
    try{
      const supabase=await loadSupabaseClient();
      if(!supabase){
        const newEntry={id:Date.now(),race:form.race,firstName:form.firstName.trim(),lastName:form.lastName.trim(),email:form.email.trim(),kartNumber:form.kartNumber.trim(),teamName:form.teamName.trim(),kartClass:form.kartClass.trim(),status:"Bestätigt",createdAt:new Date().toISOString()};
        setRegistrations(prev=>[newEntry,...prev]); setFormNotice("Demo-Modus: Registrierung lokal hinzugefügt."); setForm(emptyForm); setTab("dashboard"); return;
      }
      const payload={race:form.race.trim(),first_name:form.firstName.trim(),last_name:form.lastName.trim(),email:form.email.trim(),kart_number:form.kartNumber.trim(),team_name:form.teamName.trim(),kart_class:form.kartClass.trim(),status:"Bestätigt"};
      const { error } = await supabase.from("registrations").insert(payload); if(error) throw error;
      setFormNotice("Registrierung erfolgreich gespeichert."); setForm(emptyForm); await loadRegistrations(); setTab("dashboard");
    } catch(err){ setFormError(err?.message||"Registrierung konnte nicht gespeichert werden."); } finally { setIsSubmitting(false); }
  }
  const filteredRegistrations=useMemo(()=>sortByKart(registrations.filter(entry=>{const matchesRace=selectedRace==="Alle Rennen"||entry.race===selectedRace; const matchesClass=selectedClass==="Alle Klassen"||entry.kartClass===selectedClass; const query=search.toLowerCase(); const matchesSearch=!query||`${entry.firstName} ${entry.lastName}`.toLowerCase().includes(query)||entry.teamName.toLowerCase().includes(query)||entry.kartNumber.toLowerCase().includes(query); return matchesRace&&matchesClass&&matchesSearch;})),[registrations,selectedRace,selectedClass,search]);
  const stats=useMemo(()=>({total:registrations.length,confirmed:registrations.filter(r=>r.status==="Bestätigt").length,open:registrations.filter(r=>r.status==="Offen").length,classesCount:new Set(registrations.map(r=>r.kartClass)).size}),[registrations]);
  const raceStats=useMemo(()=>races.map(race=>({race,count:registrations.filter(r=>r.race===race).length})),[registrations]);
  const classStats=useMemo(()=>classes.map(name=>({name,count:registrations.filter(r=>r.kartClass===name).length})).filter(i=>i.count>0).sort((a,b)=>b.count-a.count),[registrations]);
  return <div className="page"><div className="container space-y-6">
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="hero-grid">
      <div className="card"><div className="badges"><span className="pill red">DKC 2026</span><span className="pill gold">Anmeldung + Dashboard</span><span className="pill dark">{sourceLabel}</span></div><div className="hero-content"><img className="hero-logo" src="/dkc-logo.png" alt="DKC Logo" /><div><h1>Deutsche Kartchallenge</h1><p className="muted">Komplette Live-Version mit Registrierung, Live-Dashboard, Filtersuche und CSV-Export.</p></div></div></div>
      <div className="card"><div className="section-title"><ShieldCheck size={18} color="#facc15" /> Live Status</div><div className="stack"><div className="rowbox"><span><Database size={16} color="#ef4444" /> Datenquelle</span><strong>{sourceLabel}</strong></div><button onClick={loadRegistrations} className="rowbtn"><span><RefreshCw size={16} color="#facc15" /> Daten neu laden</span><span className="muted">{isLoading ? "lädt..." : "jetzt"}</span></button><div className="rowbox">IONOS, Supabase und DKC-Logo vorbereitet</div></div></div>
    </motion.div>
    <div className="tabbar"><button className={`tabbtn ${tab==="registration"?"active":""}`} onClick={()=>setTab("registration")}><ClipboardCheck size={16} /> Registrierung</button><button className={`tabbtn ${tab==="dashboard"?"active":""}`} onClick={()=>setTab("dashboard")}><LayoutDashboard size={16} /> Dashboard</button></div>
    {loadError && <div className="warn">{loadError}</div>}
    {formNotice && <div className="success">{formNotice}</div>}
    {formError && <div className="error">{formError}</div>}
    {tab==="registration" ? <div className="form-wrap">
      <div className="card"><div className="section-title"><ClipboardCheck size={18} color="#facc15" /> Gaststarter Registrierung</div><form onSubmit={submitRegistration} className="form-grid">
        <label><span className="small">Rennen</span><select value={form.race} onChange={e=>handleFormChange("race",e.target.value)}>{races.map(race=><option key={race} value={race}>{race}</option>)}</select></label>
        <label><span className="small">Vorname</span><input value={form.firstName} onChange={e=>handleFormChange("firstName",e.target.value)} /></label>
        <label><span className="small">Nachname</span><input value={form.lastName} onChange={e=>handleFormChange("lastName",e.target.value)} /></label>
        <label className="full"><span className="small">E-Mail</span><input type="email" value={form.email} onChange={e=>handleFormChange("email",e.target.value)} /></label>
        <label><span className="small">Kartnummer</span><input value={form.kartNumber} onChange={e=>handleFormChange("kartNumber",e.target.value)} /></label>
        <label><span className="small">Teamname</span><input value={form.teamName} onChange={e=>handleFormChange("teamName",e.target.value)} /></label>
        <label className="full"><span className="small">Klasse</span><select value={form.kartClass} onChange={e=>handleFormChange("kartClass",e.target.value)}><option value="">Klasse auswählen</option>{classes.map(item=><option key={item} value={item}>{item}</option>)}</select></label>
        <button type="submit" className="btn redbtn full" disabled={isSubmitting}>{isSubmitting ? "speichert..." : "Registrierung absenden"}</button>
      </form></div>
      <div className="card"><div className="section-title"><CalendarDays size={18} color="#facc15" /> Rennen im Überblick</div><div className="stack">{raceStats.map(item=><div key={item.race} className="rowbox"><div className="small">{item.race}</div><span className="pill red">{item.count}</span></div>)}</div></div>
    </div> : <>
      <div className="stats-grid">{[
        {label:"Starter gesamt",value:stats.total,icon:Users,color:"#ef4444"},
        {label:"Bestätigt",value:stats.confirmed,icon:Trophy,color:"#facc15"},
        {label:"Offen",value:stats.open,icon:Gauge,color:"#e4e4e7"},
        {label:"Aktive Klassen",value:stats.classesCount,icon:BarChart3,color:"#f87171"},
      ].map(item=><div key={item.label} className="card stat"><div><div className="muted small">{item.label}</div><div className="big">{item.value}</div></div><item.icon size={24} color={item.color} /></div>)}</div>
      <div className="main-grid">
        <div className="side-stack">
          <div className="card"><div className="section-title"><CalendarDays size={18} color="#facc15" /> Rennen im Überblick</div><div className="stack">{raceStats.map(item=><div key={item.race} className="rowbox"><div className="small">{item.race}</div><span className="pill red">{item.count}</span></div>)}</div></div>
          <div className="card"><div className="section-title"><BarChart3 size={18} color="#ef4444" /> Klassenverteilung</div><div className="stack">{classStats.map(item=><div key={item.name}><div className="row small"><span>{item.name}</span><strong style={{color:"#facc15"}}>{item.count}</strong></div><div className="bar"><div className="barfill" style={{width:stats.total?`${(item.count/stats.total)*100}%`:"0%"}} /></div></div>)}</div></div>
        </div>
        <div className="card">
          <div className="toolbar"><div><div className="section-title"><Filter size={18} color="#facc15" /> Starterverwaltung</div><p className="muted small">Filtern, durchsuchen und als Datei exportieren.</p></div><button onClick={()=>exportToCsv(filteredRegistrations)} className="btn redbtn"><Download size={16} /> Export CSV</button></div>
          <div className="filter-grid">
            <label><span className="small">Rennen</span><select value={selectedRace} onChange={e=>setSelectedRace(e.target.value)}><option>Alle Rennen</option>{races.map(race=><option key={race}>{race}</option>)}</select></label>
            <label><span className="small">Klasse</span><select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}><option>Alle Klassen</option>{classes.map(item=><option key={item}>{item}</option>)}</select></label>
            <label><span className="small">Suche</span><div className="searchwrap"><Search className="searchicon" size={16} /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, Team, Nr." /></div></label>
          </div>
          <div className="stack">{filteredRegistrations.map(entry=><motion.div key={entry.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="entry-card"><div className="row entry-top"><div><div className="entry-name">#{entry.kartNumber} · {entry.firstName} {entry.lastName}</div><div className="muted small">{entry.race}</div></div><div className="badges"><span className="pill gold">{entry.kartClass}</span><span className={`pill ${entry.status==="Bestätigt"?"ok":"dark"}`}>{entry.status}</span></div></div><div className="detail-grid small"><div>Team: <strong>{entry.teamName}</strong></div><div>E-Mail: <strong>{entry.email||"-"}</strong></div></div></motion.div>)}
          {!isLoading && filteredRegistrations.length===0 && <div className="emptybox">Keine passenden Starter gefunden.</div>}
          {isLoading && <div className="emptybox">Live-Daten werden geladen...</div>}</div>
        </div>
      </div>
    </>}
  </div></div>;
}
