/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & {
	__WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

interface SyncEvent extends ExtendableEvent {
	tag: string;
}

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Navigations : réseau d'abord, repli sur le shell en cache hors-ligne.
registerRoute(
	new NavigationRoute(
		new NetworkFirst({
			cacheName: 'pages',
			networkTimeoutSeconds: 3,
			plugins: [new CacheableResponsePlugin({ statuses: [200] })]
		}),
		{ denylist: [/^\/api\//, /^\/login/] }
	)
);

// API en lecture (GET) : dernières données connues hors-ligne.
registerRoute(
	({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
	new NetworkFirst({
		cacheName: 'api-cache',
		networkTimeoutSeconds: 3,
		plugins: [
			new CacheableResponsePlugin({ statuses: [200] }),
			new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 })
		]
	}),
	'GET'
);

// Images / polices.
registerRoute(
	({ request }) => ['image', 'font'].includes(request.destination),
	new CacheFirst({
		cacheName: 'assets',
		plugins: [
			new CacheableResponsePlugin({ statuses: [0, 200] }),
			new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 })
		]
	})
);

// --- Relais de vidage de l'outbox (l'IndexedDB est côté client) ---
function tellClientsToFlush(): void {
	self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((cs) => {
		for (const c of cs) c.postMessage({ type: 'FLUSH_OUTBOX' });
	});
}
self.addEventListener('sync', (event) => {
	const e = event as SyncEvent;
	if (e.tag === 'outbox-sync') e.waitUntil(Promise.resolve(tellClientsToFlush()));
});

self.addEventListener('message', (event) => {
	const data = event.data as { type?: string } | undefined;
	if (data?.type === 'SKIP_WAITING') self.skipWaiting();
	if (data?.type === 'FLUSH_OUTBOX') tellClientsToFlush();
});

// --- Web Push ---
interface PushPayload {
	title: string;
	body: string;
	url?: string;
	tag?: string;
}
self.addEventListener('push', (event) => {
	let payload: PushPayload = {
		title: 'HabitQuest',
		body: 'Tu as des habitudes à valider aujourd’hui.'
	};
	try {
		if (event.data) payload = { ...payload, ...(event.data.json() as PushPayload) };
	} catch {
		if (event.data) payload.body = event.data.text();
	}
	event.waitUntil(
		self.registration.showNotification(payload.title, {
			body: payload.body,
			tag: payload.tag ?? 'daily-reminder',
			renotify: true,
			icon: '/icons/icon-192.png',
			badge: '/icons/badge-72.png',
			data: { url: payload.url ?? '/?source=push' },
			lang: 'fr'
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const target = (event.notification.data?.url as string) ?? '/';
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
			for (const c of cs) {
				if ('focus' in c) {
					c.navigate(target).catch(() => {});
					return c.focus();
				}
			}
			return self.clients.openWindow(target);
		})
	);
});
