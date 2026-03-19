
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Gauge, Filter, CalendarDays, Download, ShieldCheck, Search, BarChart3, Database, RefreshCw, ClipboardCheck, LayoutDashboard, Lock, LogOut, Pencil, Trash2, Save, X, BadgeCheck, FolderOpen, Upload, FileText, ShoppingCart } from "lucide-react";

const races = ["1. Lauf – 26.04.26 – Lohsa","2. Lauf – 17.05.26 – Belleben","3. Lauf – 21.06.26 – Mülsen","4. Lauf – 13.09.26 – Nachtrennen Belleben","5. Lauf – 27.09.26 – Cheb","6. Lauf – 11.10.26 – Wallrav"];
const classes = ["Rotax Senior","Rotax Junior","Rotax Mini","Rotax Micro","Rotax DD2","Rotax DD2 Master","Rotax DD2 Trophy","FUN Klasse"];
const statusOptions = ["Bestätigt","Offen","Bezahlt","Abgemeldet"];
const documentCategories = ["Reglement","Ausschreibung","Zeitplan","Ergebnisse","Starterliste","Downloads","Sonstiges"];
const demoAdmin = { email: "admin@dkc.de", password: "DKC2026!" };
const demoRegistrations = [
  { id: 1, race: races[0], firstName: "Andy", lastName: "Zenner", kartNumber: "23", teamName: "wewer", kartClass: "Rotax DD2 Trophy", status: "Bestätigt", email: "andy_zenner@web.de", createdAt: "2026-02-02T18:21:00.000Z" },
  { id: 2, race: races[0], firstName: "Max", lastName: "Beispiel", kartNumber: "27", teamName: "Speed Factory", kartClass: "Rotax Senior", status: "Bezahlt", email: "max@example.com", createdAt: "2026-02-03T08:00:00.000Z" },
];
const demoDocuments = [
  { id: 1, title: "Reglement 2026", category: "Reglement", race: "Alle Rennen", fileName: "reglement-2026.pdf", filePath: "demo/reglement-2026.pdf", publicUrl: "#", createdAt: "2026-01-10T09:00:00.000Z" },
  { id: 2, title: "Ausschreibung Lohsa", category: "Ausschreibung", race: races[0], fileName: "ausschreibung-lohsa.pdf", filePath: "demo/ausschreibung-lohsa.pdf", publicUrl: "#", createdAt: "2026-01-15T10:00:00.000Z" },
];
const demoTireOrders = [
  { id: 1, race: races[0], firstName: "Andy", lastName: "Zenner", email: "andy_zenner@web.de", quantity: 2, createdAt: "2026-02-05T10:00:00.000Z" },
  { id: 2, race: races[1], firstName: "Max", lastName: "Beispiel", email: "max@example.com", quantity: 1, createdAt: "2026-02-06T11:00:00.000Z" },
];
const emptyTireForm = { race: races[0], firstName: "", lastName: "", email: "", quantity: 1 };
const emptyForm = { race: races[0], firstName: "", lastName: "", email: "", kartNumber: "", teamName: "", kartClass: "" };
const emptyDocumentForm = { title: "", category: documentCategories[0], race: "Alle Rennen", file: null };

function numericKart(value){ const n = Number(String(value).replace(/[^\d]/g,"")); return Number.isNaN(n) ? null : n; }
function sortByKart(data){ return [...data].sort((a,b)=>{ const aNum=numericKart(a.kartNumber); const bNum=numericKart(b.kartNumber); if(aNum!==null&&bNum!==null&&aNum!==bNum) return aNum-bNum; return String(a.kartNumber).localeCompare(String(b.kartNumber),"de");});}
function exportToCsv(rows){ const csvHeader=["Rennen","Vorname","Nachname","Kartnummer","Teamname","Klasse","Status","E-Mail","Registriert am"]; const csvRows=rows.map((item)=>[item.race,item.firstName,item.lastName,item.kartNumber,item.teamName,item.kartClass,item.status,item.email||"",item.createdAt?new Date(item.createdAt).toLocaleString("de-DE"):""]); const content=[csvHeader,...csvRows].map((row)=>row.map((cell)=>`"${String(cell).replace(/"/g,'""')}"`).join(";")).join("\n"); const blob=new Blob([content],{type:"text/csv;charset=utf-8;"}); const url=URL.createObjectURL(blob); const link=document.createElement("a"); link.href=url; link.download="DKC-Starterliste.csv"; link.click(); URL.revokeObjectURL(url);}
function exportTireCsv(rows){
  const header=["Lauf","Vorname","Nachname","E-Mail","Menge"];
  const csvRows = rows.map((r)=>[r.race,r.firstName,r.lastName,r.email,r.quantity]);
  const content = [header,...csvRows]
    .map((row)=>row.map((cell)=>`"${String(cell).replace(/"/g,'""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([content],{type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "DKC-Reifenbestellungen.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function getSupabaseClient(){ const url=import.meta.env.VITE_SUPABASE_URL; const anonKey=import.meta.env.VITE_SUPABASE_ANON_KEY; if(!url||!anonKey) return null; const { createClient } = await import("@supabase/supabase-js"); return createClient(url, anonKey);}

async function sendTireOrderMail(payload){
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if(!supabaseUrl || !anonKey) return { ok:false, error:"Supabase nicht konfiguriert" };

  try{
    const response = await fetch(`${supabaseUrl}/functions/v1/smart-worker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        race: payload.race,
        kartNumber: "-",
        teamName: `Reifenbestellung: ${payload.quantity} x Mojo D5`,
        kartClass: "Mojo D5 Reifenbestellung",
      }),
    });

    if(!response.ok){
      const text = await response.text();
      return { ok:false, error:text || `HTTP ${response.status}` };
    }

    return { ok:true };
  }catch(error){
    return { ok:false, error:String(error) };
  }
}

export default function App(){
  const [tab,setTab]=useState("registration");
  const [selectedRace,setSelectedRace]=useState("Alle Rennen");
  const [selectedClass,setSelectedClass]=useState("Alle Klassen");
  const [statusFilter,setStatusFilter]=useState("Alle Status");
  const [search,setSearch]=useState("");
  const [registrations,setRegistrations]=useState(demoRegistrations);
  const [documents,setDocuments]=useState(demoDocuments);
  const [sourceLabel,setSourceLabel]=useState("Demo Daten");
  const [isLoading,setIsLoading]=useState(true);
  const [loadError,setLoadError]=useState("");
  const [form,setForm]=useState(emptyForm);
  const [formError,setFormError]=useState("");
  const [formNotice,setFormNotice]=useState("");
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [adminEmail,setAdminEmail]=useState("");
  const [adminPassword,setAdminPassword]=useState("");
  const [adminLoggedIn,setAdminLoggedIn]=useState(false);
  const [loginError,setLoginError]=useState("");
  const [editingId,setEditingId]=useState(null);
  const [editForm,setEditForm]=useState(null);
  const [adminNotice,setAdminNotice]=useState("");
  const [documentForm,setDocumentForm]=useState(emptyDocumentForm);
  const [documentFilterCategory,setDocumentFilterCategory]=useState("Alle Kategorien");
  const [documentFilterRace,setDocumentFilterRace]=useState("Alle Rennen");
  const [documentSearch,setDocumentSearch]=useState("");
  const [documentNotice,setDocumentNotice]=useState("");
  const [isUploadingDocument,setIsUploadingDocument]=useState(false);
  const [tireOrders,setTireOrders]=useState(demoTireOrders);
  const [tireForm,setTireForm]=useState(emptyTireForm);
  const [tireNotice,setTireNotice]=useState("");
  const [tireError,setTireError]=useState("");
  const [isSubmittingTire,setIsSubmittingTire]=useState(false);
  const [editingTireId,setEditingTireId]=useState(null);
  const [editTireForm,setEditTireForm]=useState(null);

  useEffect(()=>{ loadAllData(); restoreSession(); },[]);

  async function restoreSession(){ const supabase=await getSupabaseClient(); if(!supabase) return; const { data } = await supabase.auth.getSession(); if(data?.session) setAdminLoggedIn(true); }
  async function loadAllData(){
    setIsLoading(true); setLoadError("");
    try{
      const supabase=await getSupabaseClient();
      if(!supabase){
        setRegistrations(demoRegistrations); setDocuments(demoDocuments); setTireOrders(demoTireOrders); setSourceLabel("Demo Daten"); setIsLoading(false); return;
      }
      const results = await Promise.all([
        supabase.from("registrations").select("*").order("created_at",{ascending:false}),
        supabase.from("documents").select("*").order("created_at",{ascending:false}),
        supabase.from("tire_orders").select("*").order("created_at",{ascending:false}),
      ]);
      const regRes = results[0];
      const docRes = results[1];
      const tireRes = results[2];
      if(regRes.error) throw regRes.error;
      if(docRes.error) throw docRes.error;
      if(tireRes.error) throw tireRes.error;
      setRegistrations((regRes.data||[]).map((item,index)=>({ id:item.id||index+1, race:item.race, firstName:item.first_name, lastName:item.last_name, kartNumber:item.kart_number, teamName:item.team_name, kartClass:item.kart_class, email:item.email, createdAt:item.created_at, status:item.status||"Bestätigt" })));
      setDocuments((docRes.data||[]).map((item,index)=>({ id:item.id||index+1, title:item.title, category:item.category, race:item.race||"Alle Rennen", fileName:item.file_name, filePath:item.file_path, publicUrl:item.public_url, createdAt:item.created_at })));
      setTireOrders((tireRes.data||[]).map((item,index)=>({ id:item.id||index+1, race:item.race, firstName:item.first_name, lastName:item.last_name, email:item.email, quantity:item.quantity, createdAt:item.created_at })));
      setSourceLabel("Supabase Live Daten");
    }catch(err){
      setRegistrations(demoRegistrations); setDocuments(demoDocuments); setTireOrders(demoTireOrders); setSourceLabel("Demo Daten"); setLoadError("Live-Daten konnten noch nicht geladen werden. Aktuell wird die Demo angezeigt.");
    }finally{ setIsLoading(false); }
  }

  function handleFormChange(key,value){ setForm((prev)=>({...prev,[key]:value})); }
  async function submitRegistration(e){
    e.preventDefault(); setFormError(""); setFormNotice("");
    const values=Object.values(form).map((v)=>String(v).trim());
    if(values.some((v)=>!v)) return setFormError("Bitte fülle alle Pflichtfelder aus.");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setFormError("Bitte gib eine gültige E-Mail-Adresse ein.");
    const duplicate=registrations.some((item)=>item.race===form.race&&String(item.kartNumber).trim().toLowerCase()===String(form.kartNumber).trim().toLowerCase());
    if(duplicate) return setFormError("Diese Kartnummer ist für dieses Rennen bereits vergeben.");
    setIsSubmitting(true);
    try{
      const supabase=await getSupabaseClient();
      if(!supabase){
        const newEntry={ id:Date.now(), race:form.race, firstName:form.firstName.trim(), lastName:form.lastName.trim(), email:form.email.trim(), kartNumber:form.kartNumber.trim(), teamName:form.teamName.trim(), kartClass:form.kartClass.trim(), status:"Bestätigt", createdAt:new Date().toISOString() };
        setRegistrations((prev)=>[newEntry,...prev]); setFormNotice("Demo-Modus: Registrierung lokal hinzugefügt."); setForm(emptyForm); setTab("dashboard"); return;
      }
      const payload={ race:form.race.trim(), first_name:form.firstName.trim(), last_name:form.lastName.trim(), email:form.email.trim(), kart_number:form.kartNumber.trim(), team_name:form.teamName.trim(), kart_class:form.kartClass.trim(), status:"Bestätigt" };
      const { error }=await supabase.from("registrations").insert(payload); if(error) throw error;
      setFormNotice("Registrierung erfolgreich gespeichert."); setForm(emptyForm); await loadAllData(); setTab("dashboard");
    }catch(err){ setFormError(err?.message||"Registrierung konnte nicht gespeichert werden."); }finally{ setIsSubmitting(false); }
  }

  async function handleAdminLogin(e){
    e.preventDefault(); setLoginError("");
    const supabase=await getSupabaseClient();
    if(supabase){
      const { error } = await supabase.auth.signInWithPassword({ email:adminEmail, password:adminPassword });
      if(error) return setLoginError(error.message);
      setAdminLoggedIn(true); setTab("admin"); return;
    }
    if(adminEmail===demoAdmin.email&&adminPassword===demoAdmin.password){ setAdminLoggedIn(true); setTab("admin"); return; }
    setLoginError("Ungültige Zugangsdaten.");
  }
  async function handleAdminLogout(){ const supabase=await getSupabaseClient(); if(supabase) await supabase.auth.signOut(); setAdminLoggedIn(false); setAdminEmail(""); setAdminPassword(""); setEditingId(null); setEditForm(null); setAdminNotice(""); setDocumentNotice(""); setTab("dashboard"); }

  function startEdit(entry){ setEditingId(entry.id); setEditForm({ ...entry }); setAdminNotice(""); }
  function cancelEdit(){ setEditingId(null); setEditForm(null); }
  async function saveEdit(){
    if(!editForm) return;
    const duplicateKart=registrations.some((item)=>item.id!==editingId&&item.race===editForm.race&&String(item.kartNumber).trim().toLowerCase()===String(editForm.kartNumber).trim().toLowerCase());
    if(duplicateKart) return setAdminNotice("Kartnummer in diesem Rennen bereits vergeben.");
    const supabase=await getSupabaseClient();
    if(!supabase){ setRegistrations((prev)=>prev.map((item)=>(item.id===editingId?{...editForm}:item))); setEditingId(null); setEditForm(null); setAdminNotice("Demo-Modus: Starter aktualisiert."); return; }
    const { error }=await supabase.from("registrations").update({ race:editForm.race, first_name:editForm.firstName, last_name:editForm.lastName, email:editForm.email, kart_number:editForm.kartNumber, team_name:editForm.teamName, kart_class:editForm.kartClass, status:editForm.status }).eq("id", editingId);
    if(error) return setAdminNotice(error.message);
    await loadAllData(); setEditingId(null); setEditForm(null); setAdminNotice("Starter erfolgreich aktualisiert.");
  }
  async function deleteStarter(id){
    if(!window.confirm("Starter wirklich löschen?")) return;
    const supabase=await getSupabaseClient();
    if(!supabase){ setRegistrations((prev)=>prev.filter((item)=>item.id!==id)); setAdminNotice("Demo-Modus: Starter gelöscht."); return; }
    const { error }=await supabase.from("registrations").delete().eq("id", id);
    if(error) return setAdminNotice(error.message);
    await loadAllData(); setAdminNotice("Starter erfolgreich gelöscht.");
  }
  async function quickSetStatus(id,status){
    const supabase=await getSupabaseClient();
    if(!supabase){ setRegistrations((prev)=>prev.map((item)=>(item.id===id?{...item,status}:item))); setAdminNotice(`Demo-Modus: Status auf ${status} gesetzt.`); return; }
    const { error }=await supabase.from("registrations").update({ status }).eq("id", id);
    if(error) return setAdminNotice(error.message);
    await loadAllData(); setAdminNotice(`Status auf ${status} gesetzt.`);
  }

  function handleDocumentField(key,value){ setDocumentForm((prev)=>({...prev,[key]:value})); }

  function handleTireField(key,value){ setTireForm((prev)=>({...prev,[key]:value})); }

  async function submitTireOrder(e){
    e.preventDefault(); setTireNotice(""); setTireError("");
    if(!tireForm.firstName.trim() || !tireForm.lastName.trim() || !tireForm.email.trim()) return setTireError("Bitte Vorname, Nachname und E-Mail ausfüllen.");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tireForm.email.trim())) return setTireError("Bitte gib eine gültige E-Mail-Adresse ein.");
    const quantity = Number(tireForm.quantity);
    if(!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return setTireError("Bitte eine Anzahl von 1 bis 10 Reifensätzen angeben.");

    const supabase=await getSupabaseClient();
    setIsSubmittingTire(true);
    try{
      if(!supabase){
        const newOrder = { id: Date.now(), race: tireForm.race, firstName: tireForm.firstName.trim(), lastName: tireForm.lastName.trim(), email: tireForm.email.trim(), quantity, createdAt: new Date().toISOString() };
        setTireOrders((prev)=>[newOrder, ...prev]);
        setTireForm(emptyTireForm);
        setTireNotice("Demo-Modus: Reifenbestellung gespeichert.");
        return;
      }

      const { error } = await supabase.from("tire_orders").insert({
        race: tireForm.race,
        first_name: tireForm.firstName.trim(),
        last_name: tireForm.lastName.trim(),
        email: tireForm.email.trim(),
        quantity,
      });
      if(error) throw error;

      const mailResult = await sendTireOrderMail({
        race: tireForm.race,
        firstName: tireForm.firstName.trim(),
        lastName: tireForm.lastName.trim(),
        email: tireForm.email.trim(),
        quantity,
      });

      setTireForm(emptyTireForm);
      await loadAllData();
      setTireNotice(mailResult.ok ? "Reifenbestellung erfolgreich gespeichert. Die Bestätigungsmail wurde versendet." : "Reifenbestellung erfolgreich gespeichert. Die Bestätigungsmail konnte aktuell nicht versendet werden.");
    }catch(err){
      setTireError(err?.message || "Reifenbestellung konnte nicht gespeichert werden.");
    }finally{
      setIsSubmittingTire(false);
    }
  }

  async function uploadDocument(e){
    e.preventDefault(); setDocumentNotice("");
    if(!documentForm.title.trim()||!documentForm.category.trim()||!documentForm.file) return setDocumentNotice("Bitte Titel, Kategorie und Datei auswählen.");
    const supabase=await getSupabaseClient();
    if(!supabase){
      const newDoc={ id:Date.now(), title:documentForm.title.trim(), category:documentForm.category, race:documentForm.race||"Alle Rennen", fileName:documentForm.file.name, filePath:`demo/${documentForm.file.name}`, publicUrl:"#", createdAt:new Date().toISOString() };
      setDocuments((prev)=>[newDoc,...prev]); setDocumentForm(emptyDocumentForm); setDocumentNotice("Demo-Modus: Dokument lokal hinzugefügt."); return;
    }
    setIsUploadingDocument(true);
    try{
      const safeName=documentForm.file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
      const filePath=`${Date.now()}-${safeName}`;
      const { error: uploadError }=await supabase.storage.from("documents").upload(filePath, documentForm.file, { upsert:true });
      if(uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("documents").getPublicUrl(filePath);
      const { error: insertError }=await supabase.from("documents").insert({ title:documentForm.title.trim(), category:documentForm.category, race:documentForm.race||"Alle Rennen", file_name:documentForm.file.name, file_path:filePath, public_url:publicData?.publicUrl||"" });
      if(insertError) throw insertError;
      setDocumentForm(emptyDocumentForm); await loadAllData(); setDocumentNotice("Dokument erfolgreich hochgeladen.");
    }catch(error){ setDocumentNotice(error?.message||"Dokument konnte nicht hochgeladen werden."); }finally{ setIsUploadingDocument(false); }
  }
  async function deleteDocument(doc){
    if(!window.confirm("Dokument wirklich löschen?")) return;
    const supabase=await getSupabaseClient();
    if(!supabase){ setDocuments((prev)=>prev.filter((item)=>item.id!==doc.id)); setDocumentNotice("Demo-Modus: Dokument gelöscht."); return; }
    const { error: storageError }=await supabase.storage.from("documents").remove([doc.filePath]); if(storageError) return setDocumentNotice(storageError.message);
    const { error: deleteError }=await supabase.from("documents").delete().eq("id", doc.id); if(deleteError) return setDocumentNotice(deleteError.message);
    await loadAllData(); setDocumentNotice("Dokument erfolgreich gelöscht.");
  }


  function startEditTire(order){
    setEditingTireId(order.id);
    setEditTireForm({ ...order });
    setTireError("");
    setTireNotice("");
  }

  function cancelEditTire(){
    setEditingTireId(null);
    setEditTireForm(null);
  }

  async function saveEditTire(){
    if(!editTireForm) return;
    const quantity = Number(editTireForm.quantity);
    if(!Number.isInteger(quantity) || quantity < 1 || quantity > 10){
      setTireError("Bitte eine Anzahl von 1 bis 10 Reifensätzen angeben.");
      return;
    }

    const supabase = await getSupabaseClient();
    try{
      if(!supabase){
        setTireOrders((prev)=>prev.map((item)=>item.id===editingTireId ? { ...editTireForm, quantity } : item));
        setEditingTireId(null);
        setEditTireForm(null);
        setTireNotice("Demo-Modus: Reifenbestellung aktualisiert.");
        return;
      }

      const { error } = await supabase
        .from("tire_orders")
        .update({
          race: editTireForm.race,
          first_name: editTireForm.firstName.trim(),
          last_name: editTireForm.lastName.trim(),
          email: editTireForm.email.trim(),
          quantity,
        })
        .eq("id", editingTireId);

      if(error) throw error;

      await loadAllData();
      setEditingTireId(null);
      setEditTireForm(null);
      setTireNotice("Reifenbestellung erfolgreich geändert.");
    }catch(err){
      setTireError(err?.message || "Reifenbestellung konnte nicht geändert werden.");
    }
  }

  async function deleteTireOrder(id){
    if(!window.confirm("Reifenbestellung wirklich löschen?")) return;
    const supabase = await getSupabaseClient();
    try{
      if(!supabase){
        setTireOrders((prev)=>prev.filter((item)=>item.id!==id));
        setTireNotice("Demo-Modus: Reifenbestellung gelöscht.");
        return;
      }

      const { error } = await supabase.from("tire_orders").delete().eq("id", id);
      if(error) throw error;
      await loadAllData();
      setTireNotice("Reifenbestellung gelöscht.");
    }catch(err){
      setTireError(err?.message || "Reifenbestellung konnte nicht gelöscht werden.");
    }
  }

  const filteredRegistrations=useMemo(()=>sortByKart(registrations.filter((entry)=>{ const matchesRace=selectedRace==="Alle Rennen"||entry.race===selectedRace; const matchesClass=selectedClass==="Alle Klassen"||entry.kartClass===selectedClass; const matchesStatus=statusFilter==="Alle Status"||entry.status===statusFilter; const query=search.toLowerCase(); const matchesSearch=!query||`${entry.firstName} ${entry.lastName}`.toLowerCase().includes(query)||entry.teamName.toLowerCase().includes(query)||entry.kartNumber.toLowerCase().includes(query); return matchesRace&&matchesClass&&matchesStatus&&matchesSearch; })),[registrations,selectedRace,selectedClass,statusFilter,search]);
  const filteredDocuments=useMemo(()=>documents.filter((doc)=>{ const matchesCategory=documentFilterCategory==="Alle Kategorien"||doc.category===documentFilterCategory; const matchesRace=documentFilterRace==="Alle Rennen"||doc.race===documentFilterRace; const query=documentSearch.toLowerCase(); const matchesSearch=!query||doc.title.toLowerCase().includes(query)||doc.fileName.toLowerCase().includes(query)||doc.category.toLowerCase().includes(query); return matchesCategory&&matchesRace&&matchesSearch; }),[documents,documentFilterCategory,documentFilterRace,documentSearch]);
  const filteredTireOrders=useMemo(()=>tireOrders.filter((item)=>{ const matchesRace=selectedRace==="Alle Rennen"||item.race===selectedRace; const query=search.toLowerCase(); const matchesSearch=!query||`${item.firstName} ${item.lastName}`.toLowerCase().includes(query)||String(item.quantity).includes(query); return matchesRace&&matchesSearch; }),[tireOrders,selectedRace,search]);
  const tireTotalsByRace=useMemo(()=>races.map((race)=>({ race, total:tireOrders.filter((item)=>item.race===race).reduce((sum,item)=>sum+Number(item.quantity||0),0), orders:tireOrders.filter((item)=>item.race===race).length })),[tireOrders]);
  const visibleTireTotal=useMemo(()=>filteredTireOrders.reduce((sum,item)=>sum+Number(item.quantity||0),0),[filteredTireOrders]);
  const stats=useMemo(()=>({ total:registrations.length, confirmed:registrations.filter((r)=>r.status==="Bestätigt").length, open:registrations.filter((r)=>r.status==="Offen").length, classesCount:new Set(registrations.map((r)=>r.kartClass)).size }),[registrations]);
  const raceStats=useMemo(()=>races.map((race)=>({ race, count:registrations.filter((r)=>r.race===race).length })),[registrations]);
  const classStats=useMemo(()=>classes.map((item)=>({ name:item, count:registrations.filter((r)=>r.kartClass===item).length })).filter((item)=>item.count>0).sort((a,b)=>b.count-a.count),[registrations]);

  return (
    <div className="page"><div className="container space-y-6">
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="hero-grid">
        <div className="card"><div className="badges"><span className="pill red">DKC 2026</span><span className="pill gold">Live App Komplett</span><span className="pill dark">{sourceLabel}</span></div><div className="hero-content"><img className="hero-logo" src="/dkc-logo.png" alt="DKC Logo" /><div><h1>Deutsche Kartchallenge</h1><p className="muted">Komplette Live-Version mit Registrierung, Dashboard, Admin Pro und Dokumentenbereich.</p></div></div></div>
        <div className="card"><div className="section-title"><ShieldCheck size={18} color="#facc15" /> Live Status</div><div className="stack"><div className="rowbox"><span><Database size={16} color="#ef4444" /> Datenquelle</span><strong>{sourceLabel}</strong></div><button onClick={loadAllData} className="rowbtn"><span><RefreshCw size={16} color="#facc15" /> Daten neu laden</span><span className="muted">{isLoading?"lädt...":"jetzt"}</span></button><div className="rowbox">{adminLoggedIn?"Admin eingeloggt":"Admin nicht eingeloggt"}</div></div></div>
      </motion.div>

      <div className="tabbar">
        <button className={`tabbtn ${tab==="registration"?"active":""}`} onClick={()=>setTab("registration")}><ClipboardCheck size={16} /> Registrierung</button>
        <button className={`tabbtn ${tab==="dashboard"?"active":""}`} onClick={()=>setTab("dashboard")}><LayoutDashboard size={16} /> Dashboard</button>
        <button className={`tabbtn ${tab==="admin"?"active":""}`} onClick={()=>setTab("admin")}><Lock size={16} /> Admin Pro</button>
        <button className={`tabbtn ${tab==="documents"?"active":""}`} onClick={()=>setTab("documents")}><FolderOpen size={16} /> Dokumente</button>
        <button className={`tabbtn ${tab==="tires"?"active":""}`} onClick={()=>setTab("tires")}><ShoppingCart size={16} /> Reifenbestellung</button>
      </div>

      {loadError&&<div className="warn">{loadError}</div>}
      {formNotice&&<div className="success">{formNotice}</div>}
      {formError&&<div className="error">{formError}</div>}
      {adminNotice&&<div className="warn">{adminNotice}</div>}
      {documentNotice&&<div className="warn">{documentNotice}</div>}
      {tireNotice&&<div className="success">{tireNotice}</div>}
      {tireError&&<div className="error">{tireError}</div>}

      {tab==="registration"&&<div className="form-wrap">
        <div className="card"><div className="section-title"><ClipboardCheck size={18} color="#facc15" /> Gaststarter Registrierung</div><form onSubmit={submitRegistration} className="form-grid">
          <label><span className="small">Rennen</span><select value={form.race} onChange={(e)=>handleFormChange("race",e.target.value)}>{races.map((race)=><option key={race} value={race}>{race}</option>)}</select></label>
          <label><span className="small">Vorname</span><input value={form.firstName} onChange={(e)=>handleFormChange("firstName",e.target.value)} /></label>
          <label><span className="small">Nachname</span><input value={form.lastName} onChange={(e)=>handleFormChange("lastName",e.target.value)} /></label>
          <label className="full"><span className="small">E-Mail</span><input type="email" value={form.email} onChange={(e)=>handleFormChange("email",e.target.value)} /></label>
          <label><span className="small">Kartnummer</span><input value={form.kartNumber} onChange={(e)=>handleFormChange("kartNumber",e.target.value)} /></label>
          <label><span className="small">Teamname</span><input value={form.teamName} onChange={(e)=>handleFormChange("teamName",e.target.value)} /></label>
          <label className="full"><span className="small">Klasse</span><select value={form.kartClass} onChange={(e)=>handleFormChange("kartClass",e.target.value)}><option value="">Klasse auswählen</option>{classes.map((item)=><option key={item} value={item}>{item}</option>)}</select></label>
          <button type="submit" className="btn redbtn full" disabled={isSubmitting}>{isSubmitting?"speichert...":"Registrierung absenden"}</button>
        </form></div>
        <div className="card"><div className="section-title"><CalendarDays size={18} color="#facc15" /> Rennen im Überblick</div><div className="stack">{raceStats.map((item)=><div key={item.race} className="rowbox"><div className="small">{item.race}</div><span className="pill red">{item.count}</span></div>)}</div></div>
      </div>}

      {tab==="dashboard"&&<>
        <div className="stats-grid">{[{label:"Starter gesamt",value:stats.total,icon:Users,color:"#ef4444"},{label:"Bestätigt",value:stats.confirmed,icon:Trophy,color:"#facc15"},{label:"Offen",value:stats.open,icon:Gauge,color:"#e4e4e7"},{label:"Aktive Klassen",value:stats.classesCount,icon:BarChart3,color:"#f87171"}].map((item)=><div key={item.label} className="card stat"><div><div className="muted small">{item.label}</div><div className="big">{item.value}</div></div><item.icon size={24} color={item.color} /></div>)}</div>
        <div className="main-grid">
          <div className="side-stack">
            <div className="card"><div className="section-title"><CalendarDays size={18} color="#facc15" /> Rennen im Überblick</div><div className="stack">{raceStats.map((item)=><div key={item.race} className="rowbox"><div className="small">{item.race}</div><span className="pill red">{item.count}</span></div>)}</div></div>
            <div className="card"><div className="section-title"><BarChart3 size={18} color="#ef4444" /> Klassenverteilung</div><div className="stack">{classStats.map((item)=><div key={item.name}><div className="row small"><span>{item.name}</span><strong style={{color:"#facc15"}}>{item.count}</strong></div><div className="bar"><div className="barfill" style={{width:stats.total?`${(item.count/stats.total)*100}%`:"0%"}} /></div></div>)}</div></div>
          </div>
          <div className="card"><div className="toolbar"><div><div className="section-title"><Filter size={18} color="#facc15" /> Starterübersicht</div><p className="muted small">Filtern, durchsuchen und als Datei exportieren.</p></div><button onClick={()=>exportToCsv(filteredRegistrations)} className="btn redbtn"><Download size={16} /> Export CSV</button></div>
            <div className="filter-grid">
              <label><span className="small">Rennen</span><select value={selectedRace} onChange={(e)=>setSelectedRace(e.target.value)}><option>Alle Rennen</option>{races.map((race)=><option key={race}>{race}</option>)}</select></label>
              <label><span className="small">Klasse</span><select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)}><option>Alle Klassen</option>{classes.map((item)=><option key={item}>{item}</option>)}</select></label>
              <label><span className="small">Status</span><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option>Alle Status</option>{statusOptions.map((item)=><option key={item}>{item}</option>)}</select></label>
              <label><span className="small">Suche</span><div className="searchwrap"><Search className="searchicon" size={16} /><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Name, Team, Nr." /></div></label>
            </div>
            <div className="stack">{filteredRegistrations.map((entry)=><motion.div key={entry.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="entry-card"><div className="row entry-top"><div><div className="entry-name">#{entry.kartNumber} · {entry.firstName} {entry.lastName}</div><div className="muted small">{entry.race}</div></div><div className="badges"><span className="pill gold">{entry.kartClass}</span><span className={`pill ${entry.status==="Bestätigt"?"ok":entry.status==="Bezahlt"?"blue":"dark"}`}>{entry.status}</span></div></div><div className="detail-grid small"><div>Team: <strong>{entry.teamName}</strong></div><div>Registriert: <strong>{entry.createdAt?new Date(entry.createdAt).toLocaleString("de-DE"):"-"}</strong></div></div></motion.div>)}{!isLoading&&filteredRegistrations.length===0&&<div className="emptybox">Keine passenden Starter gefunden.</div>}{isLoading&&<div className="emptybox">Live-Daten werden geladen...</div>}</div>
          </div>
        </div>
      </>}

      {tab==="admin"&&(!adminLoggedIn?<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="card admin-login-card"><div className="section-title"><Lock size={18} color="#facc15" /> Admin anmelden</div><form onSubmit={handleAdminLogin} className="admin-form"><label><span className="small">E-Mail / Benutzer</span><input value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} placeholder="admin@dkc.de" /></label><label><span className="small">Passwort</span><input type="password" value={adminPassword} onChange={(e)=>setAdminPassword(e.target.value)} placeholder="Passwort" /></label><button className="btn goldbtn"><ShieldCheck size={16} /> Als Admin anmelden</button></form><div className="rowbox small">Demo-Zugang ohne Supabase Auth: <strong>admin@dkc.de / DKC2026!</strong></div>{loginError&&<div className="error">{loginError}</div>}</motion.div>:<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-6">
        <div className="rowbox"><div><div className="section-title"><Users size={18} color="#facc15" /> Admin Pro aktiv</div><p className="muted small">Bearbeiten, löschen, Status ändern und Dokumente verwalten.</p></div><button onClick={handleAdminLogout} className="btn darkbtn"><LogOut size={16} /> Logout</button></div>
        <div className="card"><div className="toolbar"><div><div className="section-title"><Filter size={18} color="#facc15" /> Starterverwaltung</div><p className="muted small">Suche, Filter, Status-Quickactions, Bearbeiten und Löschen.</p></div><div className="toolbar-actions"><button onClick={loadAllData} className="btn darkbtn"><RefreshCw size={16} /> Neu laden</button><button onClick={()=>exportToCsv(filteredRegistrations)} className="btn redbtn"><Download size={16} /> CSV Export</button></div></div>
          <div className="filter-grid">
            <label><span className="small">Rennen</span><select value={selectedRace} onChange={(e)=>setSelectedRace(e.target.value)}><option>Alle Rennen</option>{races.map((race)=><option key={race}>{race}</option>)}</select></label>
            <label><span className="small">Klasse</span><select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)}><option>Alle Klassen</option>{classes.map((item)=><option key={item}>{item}</option>)}</select></label>
            <label><span className="small">Status</span><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option>Alle Status</option>{statusOptions.map((item)=><option key={item}>{item}</option>)}</select></label>
            <label><span className="small">Suche</span><div className="searchwrap"><Search className="searchicon" size={16} /><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Name, Team, Nr." /></div></label>
          </div>
          <div className="stack">{filteredRegistrations.map((entry)=>{ const editing=editingId===entry.id; return <div key={entry.id} className="entry-card">{!editing?<>
            <div className="row entry-top"><div><div className="entry-name">#{entry.kartNumber} · {entry.firstName} {entry.lastName}</div><div className="muted small">{entry.race}</div></div><div className="badges"><span className="pill gold">{entry.kartClass}</span><span className={`pill ${entry.status==="Bestätigt"?"ok":entry.status==="Bezahlt"?"blue":"dark"}`}>{entry.status}</span></div></div>
            <div className="detail-grid small"><div>Team: <strong>{entry.teamName}</strong></div><div>Registriert: <strong>{entry.createdAt?new Date(entry.createdAt).toLocaleString("de-DE"):"-"}</strong></div></div>
            <div className="action-row"><button onClick={()=>startEdit(entry)} className="btn darkbtn smallbtn"><Pencil size={16} /> Bearbeiten</button><button onClick={()=>deleteStarter(entry.id)} className="btn redbtn smallbtn"><Trash2 size={16} /> Löschen</button><button onClick={()=>quickSetStatus(entry.id,"Bestätigt")} className="btn greenbtn smallbtn"><BadgeCheck size={16} /> Bestätigt</button><button onClick={()=>quickSetStatus(entry.id,"Bezahlt")} className="btn bluebtn smallbtn">Bezahlt</button></div>
          </>:<div className="edit-grid">
            <label><span className="small">Rennen</span><select value={editForm.race} onChange={(e)=>setEditForm((prev)=>({...prev,race:e.target.value}))}>{races.map((race)=><option key={race}>{race}</option>)}</select></label>
            <label><span className="small">Klasse</span><select value={editForm.kartClass} onChange={(e)=>setEditForm((prev)=>({...prev,kartClass:e.target.value}))}>{classes.map((item)=><option key={item}>{item}</option>)}</select></label>
            <label><span className="small">Vorname</span><input value={editForm.firstName} onChange={(e)=>setEditForm((prev)=>({...prev,firstName:e.target.value}))} /></label>
            <label><span className="small">Nachname</span><input value={editForm.lastName} onChange={(e)=>setEditForm((prev)=>({...prev,lastName:e.target.value}))} /></label>
            <label><span className="small">E-Mail</span><input value={editForm.email} onChange={(e)=>setEditForm((prev)=>({...prev,email:e.target.value}))} /></label>
            <label><span className="small">Kartnummer</span><input value={editForm.kartNumber} onChange={(e)=>setEditForm((prev)=>({...prev,kartNumber:e.target.value}))} /></label>
            <label><span className="small">Teamname</span><input value={editForm.teamName} onChange={(e)=>setEditForm((prev)=>({...prev,teamName:e.target.value}))} /></label>
            <label><span className="small">Status</span><select value={editForm.status} onChange={(e)=>setEditForm((prev)=>({...prev,status:e.target.value}))}>{statusOptions.map((item)=><option key={item}>{item}</option>)}</select></label>
            <div className="action-row full"><button onClick={saveEdit} className="btn goldbtn smallbtn"><Save size={16} /> Speichern</button><button onClick={cancelEdit} className="btn darkbtn smallbtn"><X size={16} /> Abbrechen</button></div>
          </div>}</div>; })}{filteredRegistrations.length===0&&<div className="emptybox">Keine passenden Starter gefunden.</div>}</div>
        </div>
        <div className="card"><div className="section-title"><Upload size={18} color="#facc15" /> Dokumente hochladen</div><form onSubmit={uploadDocument} className="form-grid"><label><span className="small">Titel</span><input value={documentForm.title} onChange={(e)=>handleDocumentField("title",e.target.value)} placeholder="z. B. Reglement 2026" /></label><label><span className="small">Kategorie</span><select value={documentForm.category} onChange={(e)=>handleDocumentField("category",e.target.value)}>{documentCategories.map((item)=><option key={item}>{item}</option>)}</select></label><label><span className="small">Rennen</span><select value={documentForm.race} onChange={(e)=>handleDocumentField("race",e.target.value)}><option>Alle Rennen</option>{races.map((race)=><option key={race}>{race}</option>)}</select></label><label><span className="small">Datei</span><input type="file" onChange={(e)=>handleDocumentField("file",e.target.files?.[0]||null)} /></label><button type="submit" className="btn redbtn full" disabled={isUploadingDocument}>{isUploadingDocument?"lädt hoch...":"Dokument hochladen"}</button></form></div>
      </motion.div>)}


      {tab==="tires"&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-6">
        <div className="form-wrap">
          <div className="card">
            <div className="section-title"><ShoppingCart size={18} color="#facc15" /> Mojo D5 Reifenbestellung</div>
            <form onSubmit={submitTireOrder} className="form-grid">
              <label><span className="small">Lauf</span><select value={tireForm.race} onChange={(e)=>handleTireField("race",e.target.value)}>{races.map((race)=><option key={race} value={race}>{race}</option>)}</select></label>
              <label><span className="small">Anzahl Mojo D5 Reifensätze</span><input type="number" min="1" max="10" value={tireForm.quantity} onChange={(e)=>handleTireField("quantity",e.target.value)} /></label>
              <label><span className="small">Vorname</span><input value={tireForm.firstName} onChange={(e)=>handleTireField("firstName",e.target.value)} /></label>
              <label><span className="small">Nachname</span><input value={tireForm.lastName} onChange={(e)=>handleTireField("lastName",e.target.value)} /></label>
              <label className="full"><span className="small">E-Mail</span><input type="email" value={tireForm.email} onChange={(e)=>handleTireField("email",e.target.value)} /></label>
              <button type="submit" className="btn redbtn full" disabled={isSubmittingTire}>{isSubmittingTire?"speichert...":"Reifen bestellen"}</button>
            </form>
          </div>
          <div className="card">
            <div className="section-title"><FileText size={18} color="#facc15" /> Hinweis</div>
            <div className="stack">
              <div className="rowbox">Bestellt werden können Mojo D5 Reifensätze pro Lauf.</div>
              <div className="rowbox">Nach erfolgreicher Bestellung wird eine Bestätigung an die eingetragene E-Mail-Adresse gesendet.</div>
            </div>
          </div>
        </div>

        {adminLoggedIn&&<div className="card">
          <div className="toolbar">
            <div>
              <div className="section-title"><ShoppingCart size={18} color="#facc15" /> Reifenbestellungen Übersicht</div>
              <p className="muted small">Bearbeiten, exportieren und Summen pro Lauf ansehen.</p>
            </div>
            <button onClick={()=>exportTireCsv(filteredTireOrders)} className="btn redbtn"><Download size={16} /> Export CSV</button>
          </div>

          <div className="stats-grid">
            {tireTotalsByRace.map((item)=><div key={item.race} className="card stat"><div><div className="muted small">{item.race}</div><div className="big">{item.total}</div><div className="muted small">{item.orders} Bestellungen</div></div><ShoppingCart size={24} color="#facc15" /></div>)}
          </div>

          <div className="rowbox"><span>Summe aktuelle Ansicht</span><strong>{visibleTireTotal} x Mojo D5</strong></div>

          <div className="stack">
            {filteredTireOrders.map((item)=>{
              const editing = editingTireId === item.id;
              return <div key={item.id} className="entry-card">
                {!editing ? <>
                  <div className="row entry-top">
                    <div>
                      <div className="entry-name">{item.firstName} {item.lastName}</div>
                      <div className="muted small">{item.race}</div>
                    </div>
                    <div className="badges">
                      <span className="pill gold">{item.quantity} x Mojo D5</span>
                    </div>
                  </div>
                  <div className="detail-grid small">
                    <div>E-Mail: <strong>{item.email}</strong></div>
                    <div>Bestellt: <strong>{item.createdAt?new Date(item.createdAt).toLocaleString("de-DE"):"-"}</strong></div>
                  </div>
                  <div className="action-row">
                    <button onClick={()=>startEditTire(item)} className="btn darkbtn smallbtn"><Pencil size={16} /> Bearbeiten</button>
                    <button onClick={()=>deleteTireOrder(item.id)} className="btn redbtn smallbtn"><Trash2 size={16} /> Löschen</button>
                  </div>
                </> : <div className="edit-grid">
                  <label><span className="small">Lauf</span><select value={editTireForm.race} onChange={(e)=>setEditTireForm((prev)=>({...prev,race:e.target.value}))}>{races.map((race)=><option key={race}>{race}</option>)}</select></label>
                  <label><span className="small">Anzahl</span><input type="number" min="1" max="10" value={editTireForm.quantity} onChange={(e)=>setEditTireForm((prev)=>({...prev,quantity:e.target.value}))} /></label>
                  <label><span className="small">Vorname</span><input value={editTireForm.firstName} onChange={(e)=>setEditTireForm((prev)=>({...prev,firstName:e.target.value}))} /></label>
                  <label><span className="small">Nachname</span><input value={editTireForm.lastName} onChange={(e)=>setEditTireForm((prev)=>({...prev,lastName:e.target.value}))} /></label>
                  <label className="full"><span className="small">E-Mail</span><input value={editTireForm.email} onChange={(e)=>setEditTireForm((prev)=>({...prev,email:e.target.value}))} /></label>
                  <div className="action-row full">
                    <button onClick={saveEditTire} className="btn goldbtn smallbtn"><Save size={16} /> Speichern</button>
                    <button onClick={cancelEditTire} className="btn darkbtn smallbtn"><X size={16} /> Abbrechen</button>
                  </div>
                </div>}
              </div>
            })}
            {filteredTireOrders.length===0&&<div className="emptybox">Keine Reifenbestellungen vorhanden.</div>}
          </div>
        </div>}
      </motion.div>}

      {tab==="documents"&&<motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-6"><div className="card"><div className="toolbar"><div><div className="section-title"><FolderOpen size={18} color="#facc15" /> Dokumente & Downloads</div><p className="muted small">Reglemente, Ausschreibungen, Zeitpläne, Ergebnisse und weitere Dateien für Teilnehmer.</p></div></div>
        <div className="filter-grid"><label><span className="small">Kategorie</span><select value={documentFilterCategory} onChange={(e)=>setDocumentFilterCategory(e.target.value)}><option>Alle Kategorien</option>{documentCategories.map((item)=><option key={item}>{item}</option>)}</select></label><label><span className="small">Rennen</span><select value={documentFilterRace} onChange={(e)=>setDocumentFilterRace(e.target.value)}><option>Alle Rennen</option>{races.map((race)=><option key={race}>{race}</option>)}</select></label><label className="full"><span className="small">Suche</span><div className="searchwrap"><Search className="searchicon" size={16} /><input value={documentSearch} onChange={(e)=>setDocumentSearch(e.target.value)} placeholder="Titel, Datei, Kategorie" /></div></label></div>
        <div className="stack">{filteredDocuments.map((doc)=><div key={doc.id} className="entry-card"><div className="row entry-top"><div><div className="entry-name"><FileText size={16} style={{display:"inline-block",marginRight:8}} />{doc.title}</div><div className="muted small">{doc.category} · {doc.race}</div></div><div className="badges"><a href={doc.publicUrl||"#"} target="_blank" rel="noreferrer" className="btn redbtn smallbtn"><Download size={16} /> Download</a>{adminLoggedIn&&<button onClick={()=>deleteDocument(doc)} className="btn darkbtn smallbtn"><Trash2 size={16} /> Löschen</button>}</div></div><div className="detail-grid small"><div>Datei: <strong>{doc.fileName}</strong></div><div>Hochgeladen: <strong>{doc.createdAt?new Date(doc.createdAt).toLocaleString("de-DE"):"-"}</strong></div></div></div>)}{filteredDocuments.length===0&&<div className="emptybox">Keine passenden Dokumente gefunden.</div>}</div>
      </div></motion.div>}
    </div></div>
  );
}
