// src/lib/server/progression.ts
// Moteur d'orchestration : applique une validation d'habitude (XP/pièces/séries,
// quêtes, succès, montées de niveau) dans UNE transaction.
import {
	getDb,
	getHabit,
	getHabitLog,
	getHabitLogDates,
	upsertHabitLog,
	deleteHabitLog,
	addXp,
	addCoins,
	setLastActive,
	getUserState,
	logLevelEvent
} from './db';
import { currentStreakFromDates } from './streaks';
import { recomputeQuestProgress } from './quests';
import { runAchievementChecks } from './achievements';
import { PROGRESSION, levelFromXp, xpWithStreak } from '../config/progression';
import { COIN_ECONOMY, coinsForLevelUp } from '../config/shop';
import type { HabitStatus, LevelInfo, ProgressDelta, LogResult, UserStateRow } from '../types';

/** Construit le view-model LevelInfo à partir de l'état utilisateur. */
export function levelInfoFromState(user: UserStateRow): LevelInfo {
	const li = levelFromXp(user.total_xp);
	const progressPct = li.needed > 0 ? Math.min(100, Math.round((li.intoLevel / li.needed) * 100)) : 0;
	return {
		level: li.level,
		intoLevel: li.intoLevel,
		needed: li.needed,
		totalXp: user.total_xp,
		progressPct,
		prestige: user.prestige,
		canPrestige: li.level >= PROGRESSION.PRESTIGE_LEVEL
	};
}

/** Crédite des pièces de montée de niveau et journalise l'événement. */
function applyLevelUp(levelBefore: number, levelAfter: number, prestige: number): void {
	if (levelAfter <= levelBefore) return;
	let coins = 0;
	for (let l = levelBefore + 1; l <= levelAfter; l++) coins += coinsForLevelUp(l);
	addCoins(coins);
	logLevelEvent('level_up', levelBefore, levelAfter, prestige);
}

/**
 * Valide (ou re-valide) une habitude pour `date`. Idempotent (deltas nets).
 * Fait progresser les quêtes et vérifie les succès. Renvoie l'état autoritaire.
 */
export function logHabit(
	habitId: number,
	date: string,
	status: HabitStatus = 'done',
	note: string | null = null
): LogResult {
	const db = getDb();
	return db.transaction((): LogResult => {
		const habit = getHabit(habitId);
		if (!habit) throw new Error('HABIT_NOT_FOUND');

		const before = getUserState();
		const levelBefore = levelFromXp(before.total_xp).level;

		const prior = getHabitLog(habitId, date);
		const prevXp = prior?.xp_awarded ?? 0;
		const prevCoins = prior?.coins_awarded ?? 0;

		// Série AVANT l'action (on exclut la date courante).
		const doneExcl = getHabitLogDates(habitId, 'done').filter((d) => d !== date);
		const preStreak = currentStreakFromDates(doneExcl, date);

		let baseXp = 0;
		let coinsAwarded = 0;
		let resultingStreak = 0;
		if (status === 'done') {
			baseXp =
				(habit.type === 'break' ? PROGRESSION.XP_BREAK_HABIT_DAY : PROGRESSION.XP_PER_HABIT) *
				habit.difficulty;
			coinsAwarded = habit.type === 'break' ? COIN_ECONOMY.PER_CLEAN_DAY : COIN_ECONOMY.PER_HABIT;
			resultingStreak = preStreak + 1;
		}
		const xpAwarded = status === 'done' ? xpWithStreak(baseXp, preStreak) : 0;

		const log = upsertHabitLog({ habitId, date, status, note, xpAwarded, coinsAwarded });
		addXp(xpAwarded - prevXp);
		addCoins(coinsAwarded - prevCoins);
		setLastActive(date);

		// Quêtes : recalcul de progression (récompense réclamée manuellement).
		recomputeQuestProgress(date);

		// Succès : déblocage + crédit des récompenses (peut ajouter XP/pièces).
		const unlockedAchievements = runAchievementChecks(date);

		// Montée(s) de niveau (couvre l'XP habitude + l'XP des succès).
		const afterXp = getUserState();
		const levelAfter = levelFromXp(afterXp.total_xp).level;
		applyLevelUp(levelBefore, levelAfter, before.prestige);

		const final = getUserState();
		const delta: ProgressDelta = {
			xpGained: final.total_xp - before.total_xp,
			coinsGained: final.coins - before.coins,
			totalXp: final.total_xp,
			coins: final.coins,
			freezes: final.freezes,
			leveledUp: levelAfter > levelBefore,
			newLevel: levelAfter > levelBefore ? levelAfter : null,
			level: levelInfoFromState(final),
			streakDays: resultingStreak,
			unlockedAchievements,
			completedQuests: []
		};
		return { log, delta, levelBefore, levelAfter };
	})();
}

/** Annule une validation du même jour (un-tap) : retire le log et l'XP/pièces. */
export function reverseHabitLog(habitId: number, date: string): ProgressDelta {
	const db = getDb();
	return db.transaction((): ProgressDelta => {
		const prior = getHabitLog(habitId, date);
		if (prior) {
			addXp(-prior.xp_awarded);
			addCoins(-prior.coins_awarded);
			deleteHabitLog(habitId, date);
		}
		recomputeQuestProgress(date);
		const after = getUserState();
		const streak = currentStreakFromDates(getHabitLogDates(habitId, 'done'), date);
		return {
			xpGained: prior ? -prior.xp_awarded : 0,
			coinsGained: prior ? -prior.coins_awarded : 0,
			totalXp: after.total_xp,
			coins: after.coins,
			freezes: after.freezes,
			leveledUp: false,
			newLevel: null,
			level: levelInfoFromState(after),
			streakDays: streak,
			unlockedAchievements: [],
			completedQuests: []
		};
	})();
}

/** Crédite une récompense (quête, etc.) avec gestion niveau + succès. */
export function grantRewards(xp: number, coins: number): ProgressDelta {
	const db = getDb();
	return db.transaction((): ProgressDelta => {
		const before = getUserState();
		const levelBefore = levelFromXp(before.total_xp).level;
		addXp(xp);
		addCoins(coins);
		const unlockedAchievements = runAchievementChecks();
		const afterXp = getUserState();
		const levelAfter = levelFromXp(afterXp.total_xp).level;
		applyLevelUp(levelBefore, levelAfter, before.prestige);
		const final = getUserState();
		return {
			xpGained: final.total_xp - before.total_xp,
			coinsGained: final.coins - before.coins,
			totalXp: final.total_xp,
			coins: final.coins,
			freezes: final.freezes,
			leveledUp: levelAfter > levelBefore,
			newLevel: levelAfter > levelBefore ? levelAfter : null,
			level: levelInfoFromState(final),
			streakDays: 0,
			unlockedAchievements,
			completedQuests: []
		};
	})();
}
