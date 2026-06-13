import type { PageServerLoad } from './$types';
import { listAddictionTargets, getUserState } from '$lib/server/db';
import { computeBossState } from '$lib/server/boss';
import { getTriggerStats } from '$lib/server/triggerStats';

export const load: PageServerLoad = () => {
	const targets = listAddictionTargets();
	return {
		bosses: targets.map((t) => computeBossState(t)),
		freezes: getUserState().freezes,
		stats: getTriggerStats(null, 30)
	};
};
