// src/lib/server/push.ts — envoi Web Push (VAPID) + stockage des abonnements.
import webpush from 'web-push';
import { env, pushConfigured, vapidSubject } from './env';
import { listPushSubscriptions, savePushSubscription, deletePushSubscription } from './db';
import type { WebPushKeys } from '../types';

if (pushConfigured) {
	webpush.setVapidDetails(vapidSubject(), env.VAPID_PUBLIC, env.VAPID_PRIVATE);
}

export interface PushPayload {
	title: string;
	body: string;
	url?: string;
	tag?: string;
}

export function saveSubscription(sub: WebPushKeys, userAgent: string | null): void {
	savePushSubscription(sub, userAgent ?? undefined);
}

export function removeSubscription(endpoint: string): void {
	deletePushSubscription(endpoint);
}

/** Envoie un payload à tous les abonnements ; purge ceux morts (404/410). */
export async function sendToAll(payload: PushPayload): Promise<{ sent: number; pruned: number }> {
	if (!pushConfigured) return { sent: 0, pruned: 0 };
	const subs = listPushSubscriptions();
	const json = JSON.stringify(payload);
	let sent = 0;
	let pruned = 0;
	await Promise.all(
		subs.map(async (s) => {
			try {
				await webpush.sendNotification(
					{ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
					json
				);
				sent++;
			} catch (err) {
				const code = (err as { statusCode?: number }).statusCode;
				if (code === 404 || code === 410) {
					deletePushSubscription(s.endpoint);
					pruned++;
				}
			}
		})
	);
	return { sent, pruned };
}
