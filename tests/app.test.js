// Test integracyjny kontrolera z atrapą DOM i zegarem. Nie zastępuje testów przeglądarkowych.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as logic from '../dist/logic.js';
import {CATEGORIES} from '../dist/questions.js';
const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import .+;$/gm,'');
function harness({raw,storageError=false}={}){
 const storage=new Map(raw?[['chaos.game.v1',raw]]:[]),nodes=new Map(),events=new Map(),frames=new Map();let now=0,frameID=0;
 const make=()=>({textContent:'',hidden:false,classList:{toggle(){},add(){},remove(){}},setAttribute(){},focus(){},addEventListener(){}});
 for(const id of ['app','mute','notice','offline'])nodes.set(id,make());
 Object.defineProperty(nodes.get('app'),'innerHTML',{set(value){this.html=value;for(const id of [...nodes.keys()])if(!['app','mute','notice','offline'].includes(id))nodes.delete(id);for(const m of value.matchAll(/\bid="([^"]+)"/g))nodes.set(m[1],make());},get(){return this.html;}});
 const document={hidden:false,querySelector:s=>nodes.get(s.slice(1))||null,querySelectorAll:()=>[],addEventListener:(k,f)=>events.set(k,f)};
 const context={...logic,CATEGORIES,document,window:{scrollTo(){},addEventListener:(k,f)=>events.set(k,f)},navigator:{},location:{protocol:'https:'},performance:{now:()=>now},Date,console,confirm:()=>true,localStorage:{getItem:k=>{if(storageError)throw Error('quota');return storage.get(k)||null;},setItem:(k,v)=>{if(storageError)throw Error('quota');storage.set(k,v);},removeItem:k=>storage.delete(k)},requestAnimationFrame:fn=>{frames.set(++frameID,fn);return frameID;},cancelAnimationFrame:id=>frames.delete(id)};
 vm.runInNewContext(source,context);
 return {nodes,storage,events,document,click:id=>{assert.ok(nodes.get(id)?.onclick,`Brak przycisku ${id}`);nodes.get(id).onclick();},state:()=>JSON.parse(storage.get('chaos.game.v1')),advance:ms=>{now+=ms;const f=[...frames.values()].at(-1);frames.clear();f?.(now);}};
}
test('kontroler: pytanie zakryte, wspólny start pytania i timera, timeout i punktacja',()=>{const h=harness();h.click('start');assert.equal(h.state().stage,'handoff');assert.ok(!h.nodes.get('app').innerHTML.includes('class="question"'));h.click('reveal');assert.equal(h.state().stage,'running');assert.ok(h.nodes.has('timer'));h.advance(2000);assert.equal(h.nodes.get('timer').textContent,'3.0');h.advance(3100);assert.equal(h.state().stage,'judging');assert.match(h.nodes.get('app').innerHTML,/KONIEC CZASU/);const old=h.nodes.get('yes').onclick;h.click('yes');old();assert.equal(h.state().history.length,1);h.click('undo');assert.equal(h.state().history.length,0);h.click('no');h.click('next');h.click('reveal');assert.ok(!h.nodes.has('undo'));});
test('kontroler: ukrycie strony kończy timer natychmiast',()=>{const h=harness();h.click('start');h.click('reveal');h.document.hidden=true;h.events.get('visibilitychange')();assert.equal(h.state().stage,'judging');h.advance(100);assert.equal(h.state().stage,'judging');});
test('kontroler: po odświeżeniu proponuje kontynuację, timer nie startuje ponownie',()=>{const h=harness();h.click('start');h.click('reveal');const before=h.state(),r=harness({raw:JSON.stringify(before)});assert.ok(r.nodes.has('continue'));r.click('continue');assert.equal(r.state().stage,'judging');assert.deepEqual(r.state().queue,before.queue);assert.ok(!r.nodes.has('timer'));});
test('kontroler: niedostępny localStorage nie blokuje gry i pokazuje ostrzeżenie',()=>{const h=harness({storageError:true});h.click('start');assert.ok(h.nodes.has('reveal'));assert.equal(h.nodes.get('notice').hidden,false);h.click('reveal');h.advance(6000);assert.ok(h.nodes.has('yes'));});
