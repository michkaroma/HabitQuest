import type { RequestHandler } from './$types';
import { listHabits, getHabitLog, getUserState, localDate } from '$lib/server/db';
import { computeHabitStreaks } from '$lib/server/streaks';
import { levelInfoFromState } from '$lib/server/progression';
import { ensureQuests, recomputeQuestProgress } from '$lib/server/quests';
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
	const level = levelInfoFromState(user);
	ensureQuests(level.level, date);
	const quests = recomputeQuestProgress(date);
	const payload: SyncStateResponse = {
		userState: user,
		level,
		today: { date, habits: today, globalStreak },
		quests
	};
	return ok(payload);
};
