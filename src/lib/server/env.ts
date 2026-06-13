// src/lib/server/env.ts — config runtime ($env/dynamic/private, lue sans rebuild).
import { env as dyn } from '$env/dynamic/private';

export const env = {
	VAPID_PUBLIC: dyn.VAPID_PUBLIC ?? '',
	VAPID_PRIVATE: dyn.VAPID_PRIVATE ?? '',
	VAPID_SUBJECT: dyn.VAPID_SUBJECT ?? 'mailto:admin@localhost',
	APP_PASSWORD: dyn.APP_PASSWORD ?? '',
	SESSION_SECRET: dyn.SESSION_SECRET ?? '',
	ORIGIN: dyn.ORIGIN ?? 'http://localhost:5173',
	PUSH_TIME: dyn.PUSH_TIME ?? '20:00',
	DISABLE_CRON: dyn.DISABLE_CRON === '1',
	CRON_SECRET: dyn.CRON_SECRET ?? '',
	DB_PATH: dyn.DB_PATH ?? './data/habitquest.db'
} as const;

/** Le push n'est actif que si la paire VAPID est fournie. */
export const pushConfigured = !!(env.VAPID_PUBLIC && env.VAPID_PRIVATE);

/** Normalise le sujet VAPID en `mailto:`. */
export function vapidSubject(): string {
	return env.VAPID_SUBJECT.startsWith('mailto:') || env.VAPID_SUBJECT.startsWith('https:')
		? env.VAPID_SUBJECT
		: `mailto:${env.VAPID_SUBJECT}`;
}
