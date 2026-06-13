import type { RequestHandler } from './$types';
import { getAddictionTarget, setCleanSince, localDate } from '$lib/server/db';
import { computeBossState } from '$lib/server/boss';
import { ok, fail } from '$lib/server/respond';

export const POST: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!getAddictionTarget(id)) return fail('NOT_FOUND', 'Boss introuvable.', 404);
	const b = (await request.json().catch(() => ({}))) as { cleanSince?: string | null };
	let cleanSince: string | null = null;
	if (typeof b.cleanSince === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.cleanSince)) {
		if (b.cleanSince > localDate()) return fail('VALIDATION', 'La date ne peut pas être dans le futur.', 400);
		cleanSince = b.cleanSince;
	}
	const target = setCleanSince(id, cleanSince);
	return ok({ target, boss: target ? computeBossState(target) : null });
};
