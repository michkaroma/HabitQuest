import type { PageServerLoad } from './$types';
import { listAchievements } from '$lib/server/db';

export const load: PageServerLoad = () => {
	return { achievements: listAchievements() };
};
