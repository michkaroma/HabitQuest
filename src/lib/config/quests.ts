// src/lib/config/quests.ts
import { xpToNextLevel } from './progression';

export type QuestScope = 'daily' | 'weekly';

export type QuestKind = 'build' | 'clean' | 'journaling' | 'variety' | 'streak' | 'sos';

/** Modèle de quête. `target`/récompense sont des fonctions du niveau.
 *  La description contient le littéral {n} remplacé par la cible résolue. */
export interface QuestTemplate {
	key: string;
	scope: QuestScope;
	kind: QuestKind;
	description: string;
	target: (level: number) => number;
	rewardXp: (level: number) => number;
	rewardCoins: (level: number) => number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function dailyXp(level: number, weight = 1): number {
	const base = Math.floor(xpToNextLevel(level) * 0.06) + 20;
	return Math.round(base * weight);
}
function weeklyXp(level: number, weight = 1): number {
	const base = Math.floor(xpToNextLevel(level) * 0.2) + 60;
	return Math.round(base * weight);
}
function dailyCoins(level: number, weight = 1): number {
	return Math.round((5 + Math.floor(level / 3)) * weight);
}
function weeklyCoins(level: number, weight = 1): number {
	return Math.round((25 + Math.floor(level / 2)) * weight);
}

export const QUEST_TEMPLATES: readonly QuestTemplate[] = [
	// ---------------- DAILY ----------------
	{
		key: 'd_build_n', scope: 'daily', kind: 'build',
		description: 'Valide {n} habitude(s) aujourd’hui.',
		target: (l) => clamp(2 + Math.floor(l / 6), 2, 6),
		rewardXp: (l) => dailyXp(l, 1), rewardCoins: (l) => dailyCoins(l, 1)
	},
	{
		key: 'd_build_morning', scope: 'daily', kind: 'build',
		description: 'Valide une habitude tôt dans la journée.',
		target: () => 1,
		rewardXp: (l) => dailyXp(l, 0.7), rewardCoins: (l) => dailyCoins(l, 0.7)
	},
	{
		key: 'd_clean_day', scope: 'daily', kind: 'clean',
		description: 'Passe une journée clean sur l’un de tes boss.',
		target: () => 1,
		rewardXp: (l) => dailyXp(l, 1.1), rewardCoins: (l) => dailyCoins(l, 1.1)
	},
	{
		key: 'd_variety', scope: 'daily', kind: 'variety',
		description: 'Valide des habitudes de {n} catégories différentes.',
		target: (l) => clamp(2 + Math.floor(l / 12), 2, 4),
		rewardXp: (l) => dailyXp(l, 1.2), rewardCoins: (l) => dailyCoins(l, 1.2)
	},
	{
		key: 'd_journal', scope: 'daily', kind: 'journaling',
		description: 'Note {n} entrée(s) dans ton journal aujourd’hui.',
		target: () => 1,
		rewardXp: (l) => dailyXp(l, 0.8), rewardCoins: (l) => dailyCoins(l, 0.8)
	},
	{
		key: 'd_streak_keep', scope: 'daily', kind: 'streak',
		description: 'Garde ta plus longue série en vie aujourd’hui.',
		target: () => 1,
		rewardXp: (l) => dailyXp(l, 0.9), rewardCoins: (l) => dailyCoins(l, 0.9)
	},
	{
		key: 'd_sos_or_resist', scope: 'daily', kind: 'sos',
		description: 'Face à une envie, respire ou note-la sans céder.',
		target: () => 1,
		rewardXp: (l) => dailyXp(l, 1.0), rewardCoins: (l) => dailyCoins(l, 1.0)
	},
	{
		key: 'd_all_build', scope: 'daily', kind: 'build',
		description: 'Valide {n} habitudes pour un sans-faute du jour.',
		target: (l) => clamp(3 + Math.floor(l / 5), 3, 8),
		rewardXp: (l) => dailyXp(l, 1.4), rewardCoins: (l) => dailyCoins(l, 1.4)
	},

	// ---------------- WEEKLY ----------------
	{
		key: 'w_build_n', scope: 'weekly', kind: 'build',
		description: 'Valide {n} habitudes cette semaine.',
		target: (l) => clamp(10 + l, 10, 40),
		rewardXp: (l) => weeklyXp(l, 1), rewardCoins: (l) => weeklyCoins(l, 1)
	},
	{
		key: 'w_clean_days', scope: 'weekly', kind: 'clean',
		description: 'Accumule {n} journées clean cette semaine.',
		target: (l) => clamp(3 + Math.floor(l / 8), 3, 7),
		rewardXp: (l) => weeklyXp(l, 1.3), rewardCoins: (l) => weeklyCoins(l, 1.3)
	},
	{
		key: 'w_no_relapse', scope: 'weekly', kind: 'clean',
		description: 'Termine la semaine sans aucune rechute.',
		target: () => 1,
		rewardXp: (l) => weeklyXp(l, 1.5), rewardCoins: (l) => weeklyCoins(l, 1.5)
	},
	{
		key: 'w_journal_n', scope: 'weekly', kind: 'journaling',
		description: 'Note {n} entrées dans ton journal cette semaine.',
		target: (l) => clamp(3 + Math.floor(l / 10), 3, 7),
		rewardXp: (l) => weeklyXp(l, 0.9), rewardCoins: (l) => weeklyCoins(l, 0.9)
	},
	{
		key: 'w_variety_days', scope: 'weekly', kind: 'variety',
		description: 'Aie {n} jours où tu valides au moins 2 catégories.',
		target: (l) => clamp(2 + Math.floor(l / 10), 2, 5),
		rewardXp: (l) => weeklyXp(l, 1.1), rewardCoins: (l) => weeklyCoins(l, 1.1)
	},
	{
		key: 'w_streak_reach', scope: 'weekly', kind: 'streak',
		description: 'Atteins une série de {n} jours sur une habitude.',
		target: (l) => clamp(5 + Math.floor(l / 4), 5, 30),
		rewardXp: (l) => weeklyXp(l, 1.4), rewardCoins: (l) => weeklyCoins(l, 1.4)
	},
	{
		key: 'w_resist_n', scope: 'weekly', kind: 'sos',
		description: 'Résiste à {n} envies cette semaine (journal, sans céder).',
		target: (l) => clamp(2 + Math.floor(l / 15), 2, 5),
		rewardXp: (l) => weeklyXp(l, 1.3), rewardCoins: (l) => weeklyCoins(l, 1.3)
	}
] as const;

/** Combien de quêtes par période. */
export const QUESTS_PER_PERIOD = { daily: 3, weekly: 2 } as const;

// --- Sélection déterministe (sans RNG) ---

/** Hash FNV-1a 32 bits d'une chaîne → entier non signé. */
function fnv1a(str: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

/** Stepper xorshift32 déterministe (source d'index stable). */
function makeStepper(seed: number): () => number {
	let s = seed >>> 0;
	if (s === 0) s = 0x9e3779b9;
	return () => {
		s ^= s << 13;
		s >>>= 0;
		s ^= s >>> 17;
		s ^= s << 5;
		s >>>= 0;
		return s >>> 0;
	};
}

/** Choisit `count` modèles non-répétés d'une portée, de façon déterministe. */
function pickTemplates(
	scope: QuestScope,
	period: string,
	level: number,
	count: number
): QuestTemplate[] {
	const pool = QUEST_TEMPLATES.filter((t) => t.scope === scope);
	const n = Math.min(count, pool.length);
	const idx = pool.map((_, i) => i);
	const next = makeStepper(fnv1a(`${scope}:${period}:L${level}`));
	for (let i = 0; i < n; i++) {
		const j = i + (next() % (idx.length - i));
		[idx[i], idx[j]] = [idx[j], idx[i]];
	}
	return idx.slice(0, n).map((i) => pool[i]);
}

/** Quête résolue, prête à INSÉRER. */
export interface GeneratedQuest {
	key: string;
	scope: QuestScope;
	kind: QuestKind;
	description: string;
	target: number;
	reward_xp: number;
	reward_coins: number;
	period: string;
}

function resolve(t: QuestTemplate, level: number, period: string): GeneratedQuest {
	const target = Math.max(1, Math.floor(t.target(level)));
	return {
		key: t.key,
		scope: t.scope,
		kind: t.kind,
		description: t.description.replace('{n}', String(target)),
		target,
		reward_xp: Math.max(1, Math.floor(t.rewardXp(level))),
		reward_coins: Math.max(0, Math.floor(t.rewardCoins(level))),
		period
	};
}

export function generateDailyQuests(period: string, level: number): GeneratedQuest[] {
	return pickTemplates('daily', period, level, QUESTS_PER_PERIOD.daily).map((t) =>
		resolve(t, level, period)
	);
}

export function generateWeeklyQuests(period: string, level: number): GeneratedQuest[] {
	return pickTemplates('weekly', period, level, QUESTS_PER_PERIOD.weekly).map((t) =>
		resolve(t, level, period)
	);
}

export function generateQuests(
	dailyPeriod: string,
	weeklyPeriod: string,
	level: number
): GeneratedQuest[] {
	return [
		...generateDailyQuests(dailyPeriod, level),
		...generateWeeklyQuests(weeklyPeriod, level)
	];
}
