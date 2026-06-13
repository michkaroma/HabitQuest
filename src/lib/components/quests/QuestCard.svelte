<script lang="ts">
	import type { Quest } from '$lib/types';

	let { quest, onclaim }: { quest: Quest; onclaim: (id: number) => void } = $props();

	const pct = $derived(
		quest.target > 0 ? Math.min(100, Math.round((quest.progress / quest.target) * 100)) : 0
	);
	const completable = $derived(quest.progress >= quest.target && !quest.completed);
	const claimed = $derived(!!quest.completed);
</script>

<div class="card flex flex-col gap-2 p-3" class:opacity-70={claimed}>
	<div class="flex items-start justify-between gap-2">
		<span class="pill bg-surface2 text-muted">{quest.scope === 'weekly' ? 'Semaine' : 'Jour'}</span>
		<span class="text-xs text-muted">
			<span class="text-gold">+{quest.reward_xp} XP</span> · <span class="text-gold">🪙 {quest.reward_coins}</span>
		</span>
	</div>

	<p class="text-sm font-medium">{quest.description}</p>

	<div class="flex items-center gap-2">
		<div class="track flex-1">
			<div
				class="track-fill bg-gradient-to-r from-xp to-primary transition-[width] duration-500"
				style="width: {pct}%"
			></div>
		</div>
		<span class="w-12 text-right text-xs tabular-nums text-muted">{quest.progress}/{quest.target}</span>
	</div>

	{#if claimed}
		<div class="text-center text-sm font-semibold text-health">Réclamée ✓</div>
	{:else if completable}
		<button class="btn-primary animate-claim-pulse w-full" onclick={() => onclaim(quest.id)}>
			Réclamer la récompense
		</button>
	{/if}
</div>
