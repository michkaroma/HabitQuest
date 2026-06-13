// src/lib/config/avatar.ts
// Évolution de l'avatar/créature : stade par niveau, humeur par série.

export interface AvatarStage {
	key: string;
	name: string; // FR
	minLevel: number;
	emoji: string;
	assetId: string;
	description: string; // FR
}

export const AVATAR_STAGES: readonly AvatarStage[] = [
	{ key: 'egg', name: 'Œuf', minLevel: 1, emoji: '🥚', assetId: 'avatar:egg', description: 'Tout commence ici. Une promesse qui attend d’éclore.' },
	{ key: 'hatchling', name: 'Nouveau-né', minLevel: 3, emoji: '🐣', assetId: 'avatar:hatchling', description: 'Ta créature vient d’éclore. Premiers pas !' },
	{ key: 'sprout', name: 'Pousse', minLevel: 6, emoji: '🌱', assetId: 'avatar:sprout', description: 'Elle grandit doucement, jour après jour.' },
	{ key: 'cub', name: 'Jeune', minLevel: 10, emoji: '🦊', assetId: 'avatar:cub', description: 'Pleine d’énergie, elle prend de l’assurance.' },
	{ key: 'adventurer', name: 'Aventurière', minLevel: 16, emoji: '🐺', assetId: 'avatar:adventurer', description: 'Aguerrie par tes efforts, prête à explorer.' },
	{ key: 'guardian', name: 'Gardienne', minLevel: 24, emoji: '🦁', assetId: 'avatar:guardian', description: 'Forte et fiable, elle veille sur tes habitudes.' },
	{ key: 'mythic', name: 'Mythique', minLevel: 34, emoji: '🐉', assetId: 'avatar:mythic', description: 'Une créature de légende, née de ta constance.' },
	{ key: 'celestial', name: 'Céleste', minLevel: 45, emoji: '🦄', assetId: 'avatar:celestial', description: 'Presque au sommet. Une aura rare l’entoure.' },
	{ key: 'ascended', name: 'Ascendante', minLevel: 50, emoji: '🔱', assetId: 'avatar:ascended', description: 'Le prestige est à portée. Tu as tout accompli.' }
] as const;

/** Humeur selon la série courante — jamais négative (§7 bienveillant). */
export type AvatarMoodKey = 'rest' | 'calm' | 'happy' | 'fired_up' | 'radiant';

export interface AvatarMood {
	key: AvatarMoodKey;
	minStreak: number;
	label: string; // FR
	overlayEmoji: string;
	auraClass: string;
}

export const AVATAR_MOODS: readonly AvatarMood[] = [
	{ key: 'rest', minStreak: 0, label: 'Au repos', overlayEmoji: '😌', auraClass: 'aura-none' },
	{ key: 'calm', minStreak: 1, label: 'Sereine', overlayEmoji: '🙂', auraClass: 'aura-soft' },
	{ key: 'happy', minStreak: 3, label: 'Joyeuse', overlayEmoji: '😊', auraClass: 'aura-warm' },
	{ key: 'fired_up', minStreak: 7, label: 'Enflammée', overlayEmoji: '🔥', auraClass: 'aura-fire' },
	{ key: 'radiant', minStreak: 30, label: 'Rayonnante', overlayEmoji: '🌟', auraClass: 'aura-radiant' }
] as const;

export function avatarStageForLevel(level: number): AvatarStage {
	let chosen = AVATAR_STAGES[0];
	for (const s of AVATAR_STAGES) if (level >= s.minLevel) chosen = s;
	return chosen;
}

export function avatarMoodForStreak(streakDays: number): AvatarMood {
	let chosen = AVATAR_MOODS[0];
	for (const m of AVATAR_MOODS) if (streakDays >= m.minStreak) chosen = m;
	return chosen;
}

export interface AvatarAppearance {
	stage: AvatarStage;
	mood: AvatarMood;
	prestigeHalo: boolean;
}

export function avatarAppearance(
	level: number,
	currentStreak: number,
	prestige: number
): AvatarAppearance {
	return {
		stage: avatarStageForLevel(level),
		mood: avatarMoodForStreak(currentStreak),
		prestigeHalo: prestige > 0
	};
}
