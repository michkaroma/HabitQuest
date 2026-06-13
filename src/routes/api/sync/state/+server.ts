import type { RequestHandler } from './$types';
import { listHabits, getHabitLog, getUserState, localDate } from '$lib/server/db';
import { computeHabitStreaks } from '$lib/server/streaks';
import { levelInfoFromState } from '$lib/server/progression';
import { ok } from '$lib/server/respond';
import type { SyncStateResponse } from '$lib/types';

export const GET: RequestHandler = () => {
	const date = localDate();
	const habits = listHabits();
	const today = habits.map((h) => ({
		habit: h,
		log: getHabitLog(h.id, date),
		streak: computeHabitStreaks(h.id, date).current
	}));
	const globalStreak = today.reduce((m, h) => Math.max(m, h.streak), 0);
	const user = getUserState();
	const payload: SyncStateResponse = {
		userState: user,
		level: levelInfoFromState(user),
		today: { date, habits: today, globalStreak },
		quests: [] // branché à l'étape 5
	};
	return ok(payload);
};
