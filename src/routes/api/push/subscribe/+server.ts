import type { RequestHandler } from './$types';
import { saveSubscription } from '$lib/server/push';
import { ok, fail } from '$lib/server/respond';
import type { WebPushKeys } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	const sub = (await request.json().catch(() => null)) as WebPushKeys | null;
	if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth)
		return fail('VALIDATION', 'Abonnement invalide.', 400);
	saveSubscription(sub, request.headers.get('user-agent'));
	return ok({ ok: true });
};
