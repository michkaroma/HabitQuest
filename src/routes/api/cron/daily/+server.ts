import type { RequestHandler } from './$types';
import { sendToAll } from '$lib/server/push';
import { buildDailyReminder } from '$lib/server/reminder';
import { env } from '$lib/server/env';
import { ok, fail } from '$lib/server/respond';

// Endpoint pour cron EXTERNE (inerte sauf si CRON_SECRET défini + en-tête fourni).
export const POST: RequestHandler = async ({ request }) => {
	if (!env.CRON_SECRET || request.headers.get('x-cron-secret') !== env.CRON_SECRET)
		return fail('UNAUTHORIZED', 'Non autorisé.', 401);
	const payload = buildDailyReminder();
	return ok(await sendToAll(payload));
};
