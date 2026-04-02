// Service worker deshabilitado — limpia caches y se desregistra
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  await self.clients.claim();
  await self.registration.unregister();
});
