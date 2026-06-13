<script lang="ts">
	import { celebration } from '$lib/stores/celebration.svelte';
	import Toast from './Toast.svelte';
	import AchievementToast from './AchievementToast.svelte';
	import type { Achievement } from '$lib/types';

	// Affiche un succès à la fois, en file.
	let current = $state<Achievement | null>(null);

	$effect(() => {
		if (!current && celebration.achievementQueue.length > 0) {
			current = celebration.consumeAchievement();
		}
	});
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex max-w-[480px] flex-col gap-2 px-3 pt-safe">
	{#if current}
		<AchievementToast achievement={current} onclose={() => (current = null)} />
	{/if}
	{#each celebration.toasts.slice(-3) as toast (toast.id)}
		<Toast {toast} ondismiss={(id) => celebration.dismissToast(id)} />
	{/each}
</div>
