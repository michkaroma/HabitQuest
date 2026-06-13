// src/lib/config/achievements.ts
import type { GameState, GameStats } from './types';

/** Conditions machine-vérifiables. Seuils inclusifs (>=). */
export type AchievementCondition =
	| { type: 'habit_streak'; days: number }
	| { type: 'level'; value: number }
	| { type: 'clean_days'; days: number }
	| { type: 'total_done'; value: number }
	| { type: 'quests_completed'; value: number }
	| { type: 'money_saved'; value: number }
	| { type: 'prestige'; value: number }
	| { type: 'no_relapse_week' }
	| { type: 'boss_defeated'; value: number }
	| { type: 'journal_entries'; value: number }
	| { type: 'variety_day'; categories: number }
	| { type: 'coins_total'; value: number }
	| { type: 'sos_used'; value: number }
	| { type: 'cravings_resisted'; value: number };

export interface Achievement {
	key: string;
	name: string; // FR
	description: string; // FR
	icon: string;
	condition: AchievementCondition;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
	// --- Premiers pas / habitudes ---
	{ key: 'first_step', name: 'Premier pas', description: 'Valide ta toute première habitude.', icon: '👟', condition: { type: 'total_done', value: 1 } },
	{ key: 'done_10', name: 'Sur la lancée', description: 'Valide 10 habitudes au total.', icon: '✅', condition: { type: 'total_done', value: 10 } },
	{ key: 'done_100', name: 'Centurion', description: 'Valide 100 habitudes au total.', icon: '💯', condition: { type: 'total_done', value: 100 } },
	{ key: 'done_500', name: 'Force de l’habitude', description: 'Valide 500 habitudes au total.', icon: '🏛️', condition: { type: 'total_done', value: 500 } },
	{ key: 'done_1000', name: 'Maître du quotidien', description: 'Valide 1000 habitudes au total.', icon: '🗿', condition: { type: 'total_done', value: 1000 } },

	// --- Séries ---
	{ key: 'streak_3', name: 'Étincelle', description: 'Tiens une série de 3 jours sur une habitude.', icon: '✨', condition: { type: 'habit_streak', days: 3 } },
	{ key: 'streak_7', name: 'Semaine de feu', description: 'Tiens une série de 7 jours.', icon: '🔥', condition: { type: 'habit_streak', days: 7 } },
	{ key: 'streak_30', name: 'Mois en flammes', description: 'Tiens une série de 30 jours.', icon: '🌋', condition: { type: 'habit_streak', days: 30 } },
	{ key: 'streak_100', name: 'Brasier légendaire', description: 'Tiens une série de 100 jours.', icon: '☄️', condition: { type: 'habit_streak', days: 100 } },

	// --- Niveaux ---
	{ key: 'level_5', name: 'Apprenti', description: 'Atteins le niveau 5.', icon: '🥉', condition: { type: 'level', value: 5 } },
	{ key: 'level_10', name: 'Aventurier confirmé', description: 'Atteins le niveau 10.', icon: '🥈', condition: { type: 'level', value: 10 } },
	{ key: 'level_25', name: 'Héros', description: 'Atteins le niveau 25.', icon: '🥇', condition: { type: 'level', value: 25 } },
	{ key: 'level_50', name: 'Légende vivante', description: 'Atteins le niveau 50.', icon: '👑', condition: { type: 'level', value: 50 } },

	// --- Prestige ---
	{ key: 'prestige_1', name: 'Renaissance', description: 'Effectue ton premier prestige.', icon: '🌟', condition: { type: 'prestige', value: 1 } },
	{ key: 'prestige_3', name: 'Âme ascendante', description: 'Atteins le 3ᵉ prestige.', icon: '💫', condition: { type: 'prestige', value: 3 } },

	// --- Addictions : jours clean ---
	{ key: 'clean_1', name: 'Jour un', description: 'Tiens 1 journée clean. Le plus dur est commencé.', icon: '🌱', condition: { type: 'clean_days', days: 1 } },
	{ key: 'clean_7', name: 'Une semaine libre', description: 'Tiens 7 jours clean.', icon: '🍃', condition: { type: 'clean_days', days: 7 } },
	{ key: 'clean_30', name: 'Un mois reconquis', description: 'Tiens 30 jours clean.', icon: '🌳', condition: { type: 'clean_days', days: 30 } },
	{ key: 'clean_90', name: 'Trois mois de liberté', description: 'Tiens 90 jours clean.', icon: '🌲', condition: { type: 'clean_days', days: 90 } },
	{ key: 'clean_365', name: 'Une année renaissante', description: 'Tiens 365 jours clean.', icon: '🎍', condition: { type: 'clean_days', days: 365 } },

	// --- Boss ---
	{ key: 'boss_first', name: 'Premier boss terrassé', description: 'Viens à bout de ton premier boss.', icon: '⚔️', condition: { type: 'boss_defeated', value: 1 } },

	// --- Résilience ---
	{ key: 'no_relapse_week', name: 'Semaine sans faille', description: 'Passe une semaine entière sans rechute.', icon: '🛡️', condition: { type: 'no_relapse_week' } },
	{ key: 'resist_10', name: 'Volonté de fer', description: 'Résiste à 10 envies notées dans le journal.', icon: '💪', condition: { type: 'cravings_resisted', value: 10 } },
	{ key: 'sos_used', name: 'Respire', description: 'Utilise le bouton SOS et termine une respiration.', icon: '🫁', condition: { type: 'sos_used', value: 1 } },

	// --- Argent économisé ---
	{ key: 'money_50', name: 'Petites économies', description: 'Économise 50 grâce à tes journées clean.', icon: '🪙', condition: { type: 'money_saved', value: 50 } },
	{ key: 'money_500', name: 'Magot grandissant', description: 'Économise 500 au total.', icon: '💰', condition: { type: 'money_saved', value: 500 } },

	// --- Quêtes ---
	{ key: 'quests_10', name: 'Chasseur de quêtes', description: 'Termine 10 quêtes.', icon: '📜', condition: { type: 'quests_completed', value: 10 } },
	{ key: 'quests_50', name: 'Quêteur émérite', description: 'Termine 50 quêtes.', icon: '🗺️', condition: { type: 'quests_completed', value: 50 } },

	// --- Variété / journal ---
	{ key: 'variety_3', name: 'Équilibre', description: 'Valide des habitudes de 3 catégories le même jour.', icon: '🎯', condition: { type: 'variety_day', categories: 3 } },
	{ key: 'journal_20', name: 'Introspection', description: 'Note 20 entrées dans ton journal de déclencheurs.', icon: '📓', condition: { type: 'journal_entries', value: 20 } }
] as const;

/** Prédicat pur : la condition est-elle satisfaite par l'instantané ? */
export function isUnlocked(c: AchievementCondition, s: GameState): boolean {
	switch (c.type) {
		case 'habit_streak':
			return s.bestHabitStreak >= c.days;
		case 'level':
			return s.level >= c.value;
		case 'clean_days':
			return s.cleanDaysMax >= c.days;
		case 'total_done':
			return s.totalDone >= c.value;
		case 'quests_completed':
			return s.questsCompleted >= c.value;
		case 'money_saved':
			return s.moneySaved >= c.value;
		case 'prestige':
			return s.prestige >= c.value;
		case 'no_relapse_week':
			return s.noRelapseThisWeek === true;
		case 'boss_defeated':
			return s.bossesDefeated >= c.value;
		case 'journal_entries':
			return s.journalEntries >= c.value;
		case 'variety_day':
			return s.categoriesDoneToday.length >= c.categories;
		case 'coins_total':
			return s.coins >= c.value;
		case 'sos_used':
			return s.sosUsed >= c.value;
		case 'cravings_resisted':
			return s.cravingsResisted >= c.value;
		default: {
			const _never: never = c;
			return _never;
		}
	}
}

/** Clés des succès satisfaits mais pas encore débloqués. */
export function checkAchievements(
	state: GameState,
	stats: GameStats,
	alreadyUnlocked: ReadonlySet<string> = new Set()
): Achievement[] {
	void stats;
	return ACHIEVEMENTS.filter((a) => !alreadyUnlocked.has(a.key) && isUnlocked(a.condition, state));
}

/** Récompense (pièces/XP) au déblocage d'un succès. */
export function achievementReward(a: Achievement): { coins: number; xp: number } {
	const c = a.condition;
	const big =
		(c.type === 'level' && c.value >= 25) ||
		(c.type === 'clean_days' && c.days >= 90) ||
		(c.type === 'habit_streak' && c.days >= 100) ||
		c.type === 'prestige';
	return big ? { coins: 100, xp: 200 } : { coins: 25, xp: 50 };
}
