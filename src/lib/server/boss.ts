// src/lib/server/boss.ts — état dérivé du boss (HP = jours cibles, 1 jour clean = 1 PV).
import { BOSS } from '../config/boss';
import { computeCleanStreak } from './streaks';
import { localDate, getAddictionTarget, markBossDefeated, addCoins } from './db';
import { runAchievementChecks } from './achievements';
import type { AddictionTarget, AddictionKind } from '../types';

export type BossTier = 'colossal' | 'affaibli' | 'vacillant' | 'agonisant' | 'vaincu';

export interface BossState {
	id: number;
	name: string;
	icon: string;
	kind: AddictionKind;
	cleanDays: number;
	targetDays: number;
	hpRemaining: number;
	hpFraction: number; // 0..1
	bestStreakDays: number;
	defeated: boolean; // cible atteinte OU trophée posé
	defeatedAt: string | null; // trophée posé (victoire réclamée)
	tier: BossTier;
	moneySaved: number;
	cleanSince: string | null;
	nextMilestoneDays: number | null;
}

const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365, 730];

export function nextMilestone(cleanDays: number): number | null {
	return MILESTONES.find((m) => m > cleanDays) ?? null;
}

export function bossTier(hpFraction: number, defeated: boolean): BossTier {
	if (defeated) return 'vaincu';
	if (hpFraction > 0.66) return 'colossal';
	if (hpFraction > 0.4) return 'affaibli';
	if (hpFraction > 0.15) return 'vacillant';
	return 'agonisant';
}

export function computeBossState(row: AddictionTarget, today: string = localDate()): BossState {
	const clean = computeCleanStreak(row, today);
	const cleanDays = clean.currentDays;
	const targetDays = Math.max(BOSS.MIN_TARGET, Math.min(BOSS.MAX_TARGET, row.target_streak_days));
	const hpRemaining = Math.max(0, targetDays - cleanDays);
	const hpFraction = targetDays > 0 ? Math.min(1, Math.max(0, hpRemaining / targetDays)) : 0;
	const defeated = cleanDays >= targetDays || row.defeated_at != null;
	return {
		id: row.id,
		name: row.name,
		icon: row.icon ?? BOSS.DEFAULT_ICON,
		kind: (row.kind ?? 'autre') as AddictionKind,
		cleanDays,
		targetDays,
		hpRemaining,
		hpFraction,
		bestStreakDays: Math.max(row.best_streak_days, cleanDays),
		defeated,
		defeatedAt: row.defeated_at,
		tier: bossTier(hpFraction, defeated),
		moneySaved: clean.moneySaved,
		cleanSince: row.clean_since,
		nextMilestoneDays: defeated ? null : nextMilestone(cleanDays)
	};
}

/** Marque un boss vaincu : trophée + bonus de pièces (une fois) + vérif succès. */
export function defeatBoss(id: number): { coinsAwarded: number; unlocked: ReturnType<typeof runAchievementChecks> } | null {
	const before = getAddictionTarget(id);
	if (!before || before.defeated_at) return null;
	const target = markBossDefeated(id);
	if (!target) return null;
	const coinsAwarded = target.target_streak_days * BOSS.VICTORY_COIN_BONUS_PER_TARGET_DAY;
	addCoins(coinsAwarded);
	const unlocked = runAchievementChecks();
	return { coinsAwarded, unlocked };
}
