// src/lib/stores/sos.svelte.ts — état global de la feuille SOS (runes au niveau module).
let state = $state<{ open: boolean; targetId: number | null }>({ open: false, targetId: null });

export const sos = {
	get open() {
		return state.open;
	},
	get targetId() {
		return state.targetId;
	},
	openSos(targetId: number | null = null) {
		state = { open: true, targetId };
	},
	closeSos() {
		state = { open: false, targetId: null };
	}
};
