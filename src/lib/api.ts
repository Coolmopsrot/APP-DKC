import {createClient} from '@supabase/supabase-js';
export const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
export async function apiFetch(path:string,init:RequestInit={}){
 const {data:{session}}=await supabase.auth.getSession();
 const headers=new Headers(init.headers);headers.set('apikey',import.meta.env.VITE_SUPABASE_ANON_KEY);headers.set('Authorization','Bearer '+(session?.access_token||import.meta.env.VITE_SUPABASE_ANON_KEY));
 return fetch(import.meta.env.VITE_SUPABASE_URL+'/functions/v1/dkc-control'+path.replace('/api',''),{...init,headers});
}
export async function downloadDocument(id:string){
 const r=await apiFetch('/api/documents/download?id='+encodeURIComponent(id));const d=await r.json();if(!r.ok)throw Error(d.error);location.assign(d.url);
}
