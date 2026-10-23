
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Always fetch from the network.
  // Do not maintain a service-worker cache.
  event.respondWith(fetch(event.request));
});
