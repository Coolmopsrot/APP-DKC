import {useEffect,useState} from 'react';
import Home from './Home';
import {supabase} from './lib/api';
export default function App(){
 const [session,setSession]=useState<any>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const publicMode=['register','documents','tyres'].includes(new URLSearchParams(location.search).get('view')||'register');
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session);setReady(true)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setReady(true)});return()=>data.subscription.unsubscribe()},[]);
 if(publicMode)return <Home/>;
 if(!ready)return <div className="empty">Anmeldung wird geprüft …</div>;
 if(!session)return <div className="public"><div className="card" style={{maxWidth:440,margin:'8vh auto',padding:32}}><h1>DKC Verwaltung</h1><p>Mit deinem DKC-Benutzerkonto anmelden.</p><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget);const {error}=await supabase.auth.signInWithPassword({email:String(f.get('email')),password:String(f.get('password'))});if(error)setError('Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen.');setBusy(false)}}><label className="field">E-Mail<input name="email" type="email" autoComplete="username" required/></label><label className="field">Passwort<input name="password" type="password" autoComplete="current-password" required/></label>{error&&<p className="error">{error}</p>}<button className="primary full" disabled={busy}>Anmelden</button></form><p style={{marginTop:20}}><a href="/?view=register">Zum Fahrerportal →</a></p></div></div>;
 return <><div className="session-bar"><span>{session.user.email}</span><button onClick={()=>supabase.auth.signOut()}>Abmelden</button></div><Home key={session.user.id}/></>;
}
