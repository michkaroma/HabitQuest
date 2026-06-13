import type { RequestHandler } from './$types';
import { removeSubscription } from '$lib/server/push';
import { ok } from '$lib/server/respond';

export const POST: RequestHandler = async ({ request }) => {
	const { endpoint } = (await request.json().catch(() => ({}))) as { endpoint?: string };
	if (endpoint) removeSubscription(endpoint);
	return ok({ ok: true });
};
