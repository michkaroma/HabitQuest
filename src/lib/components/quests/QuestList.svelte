<script lang="ts">
	import type { Quest } from '$lib/types';
	import QuestCard from './QuestCard.svelte';

	let {
		quests,
		onclaim,
		title = 'Quêtes'
	}: { quests: Quest[]; onclaim: (id: number) => void; title?: string } = $props();

	const done = $derived(quests.filter((q) => q.completed).length);
</script>

{#if quests.length > 0}
	<section class="flex flex-col gap-2">
		<div class="flex items-baseline justify-between">
			<h2 class="text-lg font-bold">{title}</h2>
			<span class="text-sm text-muted tabular-nums">{done}/{quests.length}</span>
		</div>
		<div class="flex flex-col gap-2">
			{#each quests as q (q.id)}
				<QuestCard quest={q} {onclaim} />
			{/each}
		</div>
	</section>
{/if}
