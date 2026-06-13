// src/lib/config/types.ts
// Instantané agrégé et machine-vérifiable de l'état de jeu (mono-utilisateur),
// construit côté serveur, consommé par achievements.ts.

export interface GameState {
	// --- Progression ---
	level: number;
	totalXp: number;
	coins: number;
	prestige: number;
	freezes: number;

	// --- Habitudes / logs (cumulés sauf indication) ---
	totalDone: number;
	bestHabitStreak: number;
	habitStreaks: number[];
	categoriesDoneToday: string[];
	doneToday: number;
	distinctHabitsDoneToday: number;

	// --- Addictions / boss ---
	cleanDaysMax: number;
	cleanDaysTotalBest: number;
	bossesDefeated: number;
	moneySaved: number;
	noRelapseThisWeek: boolean;

	// --- Quêtes ---
	questsCompleted: number;

	// --- Journal ---
	journalEntries: number;
	journalEntriesThisWeek: number;

	// --- SOS / respiration ---
	sosUsed: number;
	cravingsResisted: number;
}

export type GameStats = GameState;
