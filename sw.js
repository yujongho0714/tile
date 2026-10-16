/* 태권도 타일 게임 오프라인 — 한 번 열면 저장돼서 인터넷 없이도 열려요.
   타일 게임 파일을 고쳐서 다시 올릴 때는 아래 VERSION 숫자를 하나 올려주세요. */
const VERSION = 'tile-v1';
const CACHE = 'jd-tile-' + VERSION;
const FONT = ['fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.add('./').catch(() => {}))); });
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('jd-tile-') && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url), same = u.origin === self.location.origin;
  if (same && !u.pathname.startsWith(new URL('./', self.registration.scope).pathname)) return;   // 다른 저장소(끝말잇기 등)는 그쪽이 알아서
  if (!same && !FONT.includes(u.hostname)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    if (r.mode === 'navigate') {   // 게임 파일: 인터넷 되면 새 것, 안 되면 저장된 것
      try { const res = await fetch(r); if (res && res.ok) c.put(r, res.clone()); return res; }
      catch (err) { return (await c.match(r, { ignoreSearch: true })) || (await c.match('./')) || new Response('오프라인이에요', { status: 503 }); }
    }
    const hit = await c.match(r, { ignoreSearch: same }); if (hit) return hit;
    try { const res = await fetch(r); if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }
    catch (err) { return new Response('', { status: 504 }); }
  })());
});
