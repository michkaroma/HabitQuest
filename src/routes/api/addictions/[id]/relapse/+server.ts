import type { RequestHandler } from './$types';
import { getAddictionTarget, relapse, addTriggerEntry, localDate } from '$lib/server/db';
import { computeBossState } from '$lib/server/boss';
import { recomputeQuestProgress } from '$lib/server/quests';
import { ok, fail } from '$lib/server/respond';

export const POST: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!getAddictionTarget(id)) return fail('NOT_FOUND', 'Boss introuvable.', 404);
	const b = (await request.json().catch(() => ({}))) as {
		useFreeze?: boolean;
		trigger?: string | null;
		craving?: number | null;
		note?: string | null;
	};

	// Journalise la rechute comme donnée neutre (gave_in = 1).
	addTriggerEntry({
		target_id: id,
		trigger: b.trigger ?? null,
		craving: typeof b.craving === 'number' ? b.craving : null,
		note: b.note ?? null,
		gave_in: true
	});

	const result = relapse(id, localDate(), !!b.useFreeze);
	recomputeQuestProgress();
	if (!result) return fail('CLAIM_FAILED', 'Action impossible.', 409);

	return ok({
		target: result.target,
		boss: computeBossState(result.target),
		usedFreeze: result.usedFreeze,
		bestStreakDays: result.target.best_streak_days
	});
};
