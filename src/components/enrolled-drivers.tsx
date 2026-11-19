import {useState} from 'react';
import {apiFetch} from '../lib/api';

type Driver = {last:string; first:string; klasse:string; team:string};

export default function EnrolledDrivers({season}:{season:string}) {
 const [drivers,setDrivers]=useState<Driver[]|null>(null);
 const [page,setPage]=useState(0);
 const [more,setMore]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 async function load(next:number) {
   setBusy(true);
   setError('');
   try {
     const response=await apiFetch('/api/enrolled?'+new URLSearchParams({season,page:String(next)}));
     const data=await response.json();
     if(!response.ok) throw Error(data.error);
     setDrivers(data.drivers);
     setMore(data.more);
     setPage(next);
   } catch {
     setError('Die Einschreibungsliste konnte nicht geladen werden.');
   } finally {
     setBusy(false);
   }
 }
 return <section className="card registration-form">
   <h2>Saisoneinschreibungen {season}</h2>
   {error&&<p role="alert">{error}</p>}
   {drivers===null
     ? <button disabled={busy||!/^\d{4}$/.test(season)} onClick={()=>load(0)}>{busy?'Wird geladen …':'Eingeschriebene Fahrer anzeigen'}</button>
     : <>{drivers.length===0?<p>Noch keine veröffentlichten Einschreibungen.</p>:<div className="table-wrap"><table>
       <thead><tr><th>Nachname</th><th>Vorname</th><th>Klasse</th><th>Team</th></tr></thead>
       <tbody>{drivers.map((driver,index)=><tr key={index}><td>{driver.last}</td><td>{driver.first}</td><td>{driver.klasse}</td><td>{driver.team||'–'}</td></tr>)}</tbody>
     </table></div>}
     {page>0&&<button disabled={busy} onClick={()=>load(page-1)}>Zurück</button>}
     {more&&<button disabled={busy} onClick={()=>load(page+1)}>Weitere Fahrer</button>}</>}
 </section>;
}
