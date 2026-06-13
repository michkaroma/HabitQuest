import type { RequestHandler } from './$types';
import { getAddictionTarget } from '$lib/server/db';
import { defeatBoss, computeBossState } from '$lib/server/boss';
import { ok, fail } from '$lib/server/respond';

export const POST: RequestHandler = ({ params }) => {
	const id = Number(params.id);
	if (!getAddictionTarget(id)) return fail('NOT_FOUND', 'Boss introuvable.', 404);
	const result = defeatBoss(id);
	if (!result) return fail('ALREADY_DEFEATED', 'Boss déjà vaincu.', 409);
	const target = getAddictionTarget(id)!;
	return ok({
		boss: computeBossState(target),
		coinsAwarded: result.coinsAwarded,
		unlockedAchievements: result.unlocked
	});
};
