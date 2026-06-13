import type { RequestHandler } from './$types';
import { addTriggerEntry, listTriggerEntries } from '$lib/server/db';
import { getTriggerStats } from '$lib/server/triggerStats';
import { recomputeQuestProgress } from '$lib/server/quests';
import { runAchievementChecks } from '$lib/server/achievements';
import { ok } from '$lib/server/respond';

export const GET: RequestHandler = ({ url }) => {
	const tid = url.searchParams.get('targetId');
	const targetId = tid !== null ? Number(tid) : null;
	return ok({
		entries: listTriggerEntries(targetId !== null ? { targetId } : undefined),
		stats: getTriggerStats(targetId)
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const b = (await request.json().catch(() => ({}))) as {
		targetId?: number | null;
		trigger?: string | null;
		craving?: number | null;
		note?: string | null;
		gaveIn?: boolean;
	};
	const entry = addTriggerEntry({
		target_id: typeof b.targetId === 'number' ? b.targetId : null,
		trigger: b.trigger ?? null,
		craving: typeof b.craving === 'number' ? b.craving : null,
		note: b.note ?? null,
		gave_in: !!b.gaveIn
	});
	recomputeQuestProgress();
	const unlockedAchievements = runAchievementChecks();
	return ok({ entry, unlockedAchievements }, 201);
};
