// Uruchom: npm install --no-save playwright && npx playwright install chromium
// npm run test:browser. Opcjonalnie PLAYWRIGHT_MODULE i CHROMIUM_PATH wskazują istniejącą instalację.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith('/5-sekund/')){res.writeHead(404);res.end();return;}
 const relative=decodeURIComponent(url.pathname.slice('/5-sekund/'.length))||'index.html';
 const file=path.resolve(root,relative);
 if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
 try{const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/5-sekund/`;
let browser,passed=0;
const check=async(name,fn)=>{await fn();passed++;console.log(`PASS ${name}`);};
const state=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('chaos.game.v1')));
const noOverflow=async p=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Przewijanie poziome');
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 console.log('Chromium '+browser.version());
 for(const width of [375,390,430,1280])await check(`układ ${width}px: konfiguracja, pytanie, ocena, wyniki, brak overflow`,async()=>{
  const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<700,hasTouch:width<700,reducedMotion:'reduce'}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.locator('#start').waitFor();await noOverflow(p);
  await p.locator('#minus').click();await p.locator('[data-name="0"]').fill('Ą'.repeat(40));
  await p.locator('#custom').click();await p.locator('#custom-rounds').fill('1');
  await p.locator('#mute').click();assert.equal(await p.locator('#mute').getAttribute('aria-pressed'),'true');
  await p.locator('#start').click();assert.equal(await p.locator('.question').count(),0);await noOverflow(p);
  // Pierwsze uruchomienie SW musi ukończyć się przed kontrolowaniem zegara strony.
  await p.waitForFunction(()=>document.querySelector('#offline').textContent==='GOTOWE OFFLINE');
  await p.clock.install();await p.locator('#reveal').click();assert.equal((await state(p)).stage,'reading');await p.clock.fastForward(60000);assert.equal((await state(p)).stage,'reading');assert.equal(await p.locator('#timer').count(),0);await noOverflow(p);await p.reload();await p.locator('#continue').click();assert.equal((await state(p)).stage,'reading');await p.locator('#start-timer').click();assert.equal((await state(p)).stage,'running');await noOverflow(p);
  await p.clock.fastForward(2100);assert.ok(await p.locator('#timer').evaluate(e=>e.classList.contains('urgent')));
  assert.equal(await p.locator('#timer').evaluate(e=>getComputedStyle(e).animationName),'none');
  await p.clock.fastForward(3100);await p.locator('#yes').waitFor();await noOverflow(p);await p.locator('#yes').click();
  await p.locator('#again').waitFor();assert.equal((await state(p)).stage,'finished');await noOverflow(p);assert.match(await p.locator('.ranking').innerText(),/100%/);
  if(process.env.SCREENSHOT_DIR)await p.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`results-${width}.png`),fullPage:true});
  assert.deepEqual(errors,[]);await ctx.close();
 });
 await check('walidacja formularza: 1–10 graczy, nazwy, kategorie, własny limit',async()=>{
  const ctx=await browser.newContext(),p=await ctx.newPage();await p.goto(url);
  await p.locator('[data-name="0"]').fill(' Ala ');await p.locator('[data-name="1"]').fill('ala');assert.equal(await p.locator('#start').isDisabled(),true);
  await p.locator('[data-name="1"]').fill(' ');assert.equal(await p.locator('#start').isDisabled(),true);
  await p.locator('[data-name="1"]').fill('Olek');assert.equal(await p.locator('#start').isEnabled(),true);
  for(let i=2;i<10;i++)await p.locator('#plus').click();assert.equal(await p.locator('#plus').isDisabled(),true);
  for(const cb of await p.locator('[data-category]').all())await cb.uncheck();assert.equal(await p.locator('#start').isDisabled(),true);
  await p.locator('[data-category="c3"]').check();assert.match(await p.locator('#limit').innerText(),/5/);
  await p.locator('#custom').click();await p.locator('#custom-rounds').fill('6');assert.equal(await p.locator('#start').isDisabled(),true);
  await p.locator('#custom-rounds').fill('1.5');assert.equal(await p.locator('#start').isDisabled(),true);
  await p.locator('#custom-rounds').fill('1');assert.equal(await p.locator('#start').isEnabled(),true);
  for(let i=10;i>1;i--)await p.locator('#minus').click();assert.equal(await p.locator('#minus').isDisabled(),true);await ctx.close();
 });
 await check('prawdziwe 5 sekund, ocena, cofanie, blokada po odkryciu, remis i restart',async()=>{
  const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
  await p.locator('#custom').click();await p.locator('#custom-rounds').fill('1');await p.locator('#start').click();
  const start=Date.now();await p.locator('#reveal').click();await p.locator('#start-timer').click();await p.locator('#yes').waitFor({timeout:8000});assert.ok(Date.now()-start>=4800);
  await p.locator('#yes').click();await p.locator('#next').click();await p.locator('#undo').click();assert.equal((await state(p)).history.length,0);
  await p.locator('#no').click();await p.locator('#next').click();await p.locator('#reveal').click();await p.locator('#start-timer').click();assert.equal(await p.locator('#undo').count(),0);
  await p.clock.install();await p.clock.fastForward(6000);await p.locator('#no').click();assert.match(await p.locator('h2').innerText(),/remis/);
  await p.locator('#undo').click();await p.locator('#yes').click();assert.match(await p.locator('h2').innerText(),/zwycięzcę/);
  const oldQueue=(await state(p)).queue;p.once('dialog',d=>d.accept());await p.locator('#again').click();assert.equal((await state(p)).history.length,0);assert.equal((await state(p)).queue.length,oldQueue.length);
  p.once('dialog',d=>d.dismiss());await p.locator('#exit').click();assert.equal((await state(p)).stage,'handoff');
  p.once('dialog',d=>d.accept());await p.locator('#exit').click();await p.locator('#start').waitFor();assert.equal(await state(p),null);assert.deepEqual(errors,[]);await ctx.close();
 });
 await check('odświeżenie zachowuje kolejkę; przerwany timer kończy się oceną',async()=>{
  const ctx=await browser.newContext(),p=await ctx.newPage();await p.goto(url);await p.locator('#start').click();await p.locator('#reveal').click();await p.locator('#start-timer').click();const queue=(await state(p)).queue;
  await p.reload();await p.locator('#continue').click();assert.equal((await state(p)).stage,'judging');assert.deepEqual((await state(p)).queue,queue);assert.equal(await p.locator('#timer').count(),0);
  await p.locator('#no').click();await p.locator('#next').click();await p.locator('#reveal').click();await p.locator('#start-timer').click();
  // Symulacja ukrycia w tej samej przeglądarce: test obsługi zdarzenia visibilitychange.
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal((await state(p)).stage,'judging');await ctx.close();
 });
 await check('prawdziwy service worker: cały start i odświeżenie offline w /5-sekund/',async()=>{
  const ctx=await browser.newContext(),p=await ctx.newPage();await p.goto(url);await p.waitForFunction(()=>document.querySelector('#offline').textContent==='GOTOWE OFFLINE');
  await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller);const cache=await p.evaluate(async()=>{const k=(await caches.keys()).find(k=>k.startsWith('5-sekund:'));return (await (await caches.open(k)).keys()).map(r=>new URL(r.url).pathname);});
  assert.equal(cache.length,10);assert.ok(cache.includes('/5-sekund/questions.js'));await ctx.setOffline(true);await p.reload();await p.locator('#start').click();await p.locator('#reveal').click();await p.locator('#start-timer').click();const queue=(await state(p)).queue;
  await p.reload();await p.locator('#continue').click();assert.equal((await state(p)).stage,'judging');assert.deepEqual((await state(p)).queue,queue);
  await p.locator('#yes').click();assert.equal((await state(p)).history.length,1);await ctx.close();
 });
 console.log(`${passed}/${passed} scenariuszy przeglądarkowych zaliczonych.`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
