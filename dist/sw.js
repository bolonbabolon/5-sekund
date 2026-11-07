// Zmieniaj wersję przy każdej zmianie zasobów, w szczególności questions.js.
const VERSION='v2-2026-11-07-reading';
const PREFIX='5-sekund:'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ASSETS=['./','./index.html','./style.css','./app.js','./logic.js','./questions.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
// Nie aktywuj aktualizacji w połowie gry. Poczekaj na zamknięcie kart starej wersji.
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;
  try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return (await cache.match('./index.html'))||Response.error();throw error;}
 })());
});
