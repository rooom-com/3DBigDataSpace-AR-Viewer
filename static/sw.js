// Simple service worker to prevent 404 errors
// This is a minimal service worker that does nothing but prevents browser errors

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// No caching or other functionality - just prevents the 404 error
self.addEventListener('fetch', (event) => {
  // Let all requests pass through normally
  return;
});
