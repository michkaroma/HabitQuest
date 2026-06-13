// src/lib/config/boss.ts — réglages du boss (HP = jours cibles ; 1 jour clean = 1 PV).
export const BOSS = {
	DEFAULT_TARGET: 90,
	MIN_TARGET: 7,
	MAX_TARGET: 365,
	DEFAULT_ICON: '👾',
	VICTORY_COIN_BONUS_PER_TARGET_DAY: 1, // pièces de victoire = jours cibles
	MILESTONES: [
		{ days: 1, label: 'Premier jour' },
		{ days: 3, label: '3 jours' },
		{ days: 7, label: '1 semaine' },
		{ days: 14, label: '2 semaines' },
		{ days: 30, label: '1 mois' },
		{ days: 90, label: '3 mois' },
		{ days: 180, label: '6 mois' },
		{ days: 365, label: '1 an' }
	]
} as const;

export const BOSS_DEFEAT_MESSAGES = [
	'Boss terrassé ! Chaque jour clean l’a affaibli — et regarde le chemin parcouru. 💪',
	'Victoire ! Tu as prouvé que tu es plus fort que cette habitude. Un nouveau défi t’attend.',
	'Incroyable. Ce boss est vaincu. Repose-toi, savoure, puis vise encore plus haut. 🌟'
] as const;
