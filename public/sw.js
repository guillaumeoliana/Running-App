const CACHE='stride-shell-v4';
const SHELL=['/','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('stride-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
const url=new URL(event.request.url);
if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname==='/config.json')return;
if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('/',copy)))}return response}).catch(()=>caches.match('/')));return}
if(!SHELL.includes(url.pathname))return;
event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
