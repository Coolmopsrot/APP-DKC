import test from 'node:test';
import assert from 'node:assert/strict';
import {inspection,CHECKS,person,number,quantity,date} from '../supabase/functions/dkc-control/domain.mjs';
test('Freigabe braucht alle verschiedenen Prüfpunkte',()=>{assert.throws(()=>inspection({status:'bestanden',checks:[CHECKS[0],CHECKS[0],...CHECKS.slice(2)],notes:''}));assert.throws(()=>inspection({status:'bestanden',checks:CHECKS.slice(1),notes:''}));assert.equal(inspection({status:'bestanden',checks:CHECKS,notes:'OK'}).status,'bestanden');});
test('Startnummern sind kanonisch, damit 082 und 82 kollidieren',()=>{assert.equal(number('0082'),'82');assert.throws(()=>number('82a'));});
test('Keine Anmeldung ohne Einwilligung oder gültige Klasse',()=>{const p={first:'Test',last:'Fahrer',email:'test@example.com',phone:'0123',klasse:'Rotax Senior',number:'82',consent:true};assert.equal(person(p).email,'test@example.com');assert.throws(()=>person({...p,consent:false}));assert.throws(()=>person({...p,klasse:'Unbekannt'}));});
test('Ungültige Menge und Kalenderdaten abweisen',()=>{for(const n of [0,51,1.5,NaN])assert.throws(()=>quantity(n));assert.throws(()=>date('2027-02-30'));assert.equal(date('2027-04-03'),'2027-04-03');});
