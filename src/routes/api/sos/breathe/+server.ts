import type { RequestHandler } from './$types';
import { getSetting, setSetting } from '$lib/server/db';
import { recomputeQuestProgress } from '$lib/server/quests';
import { runAchievementChecks } from '$lib/server/achievements';
import { ok } from '$lib/server/respond';

/** Marque une respiration SOS terminée (compteur sos_used) → débloque le succès « Respire ». */
export const POST: RequestHandler = () => {
	const n = (getSetting<number>('sos_used') ?? 0) + 1;
	setSetting('sos_used', n);
	recomputeQuestProgress();
	const unlockedAchievements = runAchievementChecks();
	return ok({ sosUsed: n, unlockedAchievements });
};
