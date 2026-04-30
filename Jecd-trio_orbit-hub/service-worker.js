/**
 * ORBIT Trio Hub — Service Worker
 * Stratégie : Network First → Cache Fallback
 * Scope : /
 * Version : v1
 */

const CACHE_NAME = 'orbit-trio-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/trio-artist-hub.js',
    '/manifest.json'
];

// ============================================================
// INSTALL — Mise en cache des assets statiques
// ============================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .catch(() => {
                // Silently fail — assets non critiques
            })
    );
    self.skipWaiting();
});

// ============================================================
// ACTIVATE — Nettoyage des anciens caches
// ============================================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// ============================================================
// FETCH — Network First, fallback Cache
// ============================================================
self.addEventListener('fetch', (event) => {
    // Ne pas intercepter les non-GET
    if (event.request.method !== 'GET') return;

    // Ne pas intercepter les appels API Railway (toujours réseau)
    if (event.request.url.includes('railway.app')) return;

    // Ne pas intercepter les appels Stripe
    if (event.request.url.includes('stripe.com')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Mettre en cache la réponse fraîche
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clone);
                });
                return response;
            })
            .catch(() => {
                // Fallback cache si hors ligne
                return caches.match(event.request)
                    .then((cached) => cached || new Response(
                        '<h1>Hors ligne</h1><p>Reconnectez-vous pour accéder au Trio.</p>',
                        { headers: { 'Content-Type': 'text/html' } }
                    ));
            })
    );
});
