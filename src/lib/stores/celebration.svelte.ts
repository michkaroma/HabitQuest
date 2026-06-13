// src/lib/stores/celebration.svelte.ts
// Bus d'événements de célébration partagé : toasts, overlay de montée de niveau,
// file de succès. Consommé par ToastHost + OverlayHost dans +layout.svelte.
import type { ToastItem, Achievement, ProgressDelta } from '$lib/types';

interface LevelUp {
	level: number;
	coins?: number;
	unlocked?: string[];
}

const toasts = $state<ToastItem[]>([]);
let levelUp = $state<LevelUp | null>(null);
const achievementQueue = $state<Achievement[]>([]);

function uid(): string {
	return typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID()
		: `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

export const celebration = {
	get toasts() {
		return toasts;
	},
	get levelUp() {
		return levelUp;
	},
	get achievementQueue() {
		return achievementQueue;
	},

	toast(message: string, tone: ToastItem['tone'] = 'info', opts: Partial<ToastItem> = {}) {
		const t: ToastItem = { id: uid(), message, tone, duration: 3200, ...opts };
		toasts.push(t);
		const ms = t.duration ?? 3200;
		if (ms > 0) {
			setTimeout(() => {
				const i = toasts.findIndex((x) => x.id === t.id);
				if (i >= 0) toasts.splice(i, 1);
			}, ms);
		}
		return t.id;
	},
	dismissToast(id: string) {
		const i = toasts.findIndex((x) => x.id === id);
		if (i >= 0) toasts.splice(i, 1);
	},

	celebrateLevel(level: number, coins?: number, unlocked?: string[]) {
		levelUp = { level, coins, unlocked };
	},
	clearLevelUp() {
		levelUp = null;
	},

	pushAchievement(a: Achievement) {
		achievementQueue.push(a);
	},
	consumeAchievement() {
		return achievementQueue.shift() ?? null;
	}
};

/** Transforme un ProgressDelta autoritaire en célébrations (FR). */
export function celebrateFromDelta(delta: ProgressDelta) {
	if (delta.leveledUp && delta.newLevel != null) {
		celebration.celebrateLevel(delta.newLevel, delta.coinsGained > 0 ? delta.coinsGained : undefined);
	}
	for (const a of delta.unlockedAchievements) {
		celebration.pushAchievement(a);
	}
	for (const q of delta.completedQuests) {
		celebration.toast(`Quête terminée : ${q.description}`, 'success', { icon: '📜' });
	}
}
