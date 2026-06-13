// src/lib/stores/sync.svelte.ts — état de synchronisation hors-ligne (runes module).
import { countPending } from '$lib/client/outbox';

const state = $state<{ online: boolean; pending: number; syncing: boolean }>({
	online: typeof navigator === 'undefined' ? true : navigator.onLine,
	pending: 0,
	syncing: false
});

export const sync = {
	get online() {
		return state.online;
	},
	get pending() {
		return state.pending;
	},
	get syncing() {
		return state.syncing;
	},
	setOnline(v: boolean) {
		state.online = v;
	},
	setSyncing(v: boolean) {
		state.syncing = v;
	},
	markPending() {
		state.pending += 1;
	},
	async refresh() {
		state.pending = await countPending();
	}
};
