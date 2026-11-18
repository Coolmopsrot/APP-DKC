import assert from 'node:assert/strict';
const base='https://rylwnuxazfdkwolkogqr.supabase.co/functions/v1/dkc-control';
async function get(path){const r=await fetch(base+path);const d=await r.json();return {r,d};}
for(const path of ['/manage','/features?admin=1']){const {r,d}=await get(path);assert.ok([401,403].includes(r.status),JSON.stringify(d));}
const {r,d}=await get('/public');assert.equal(r.status,200);assert.ok(Array.isArray(d.events));assert.equal(d.drivers,undefined);
const f=await get('/features');assert.equal(f.r.status,200);assert.deepEqual(f.d.orders,[]);assert.ok(f.d.documents.every(d=>d.published));
const denied=await fetch(base+'/manage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'setup'})});assert.ok([401,403].includes(denied.status));
const invalid=await fetch(base+'/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:false})});assert.equal(invalid.status,400);
console.log('Live API: public data, protected administration, consent validation passed.');
