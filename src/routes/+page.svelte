<script lang="ts">
	import type { PageData } from './$types';
	import { gameState } from '$lib/stores/gameState.svelte';
	import AvatarCard from '$lib/components/game/AvatarCard.svelte';
	import HabitRow from '$lib/components/habits/HabitRow.svelte';

	let { data }: { data: PageData } = $props();

	const habits = $derived(data.today.habits);
	const remaining = $derived(
		habits.filter((h) => gameState.today[h.habit.id]?.logStatus == null).length
	);
</script>

<svelte:head><title>Aujourd'hui · HabitQuest</title></svelte:head>

<div class="flex flex-col gap-4">
	<AvatarCard
		level={gameState.level.level}
		intoLevel={gameState.level.intoLevel}
		needed={gameState.level.needed}
		coins={gameState.user.coins}
		prestige={gameState.level.prestige}
		topStreak={gameState.globalStreak}
	/>

	<section class="flex flex-col gap-2">
		<div class="flex items-baseline justify-between">
			<h1 class="text-xl font-extrabold tracking-tight">Aujourd'hui</h1>
			<span class="text-sm text-muted">
				{#if habits.length === 0}—{:else if remaining === 0}Tout est fait 🎉{:else}{remaining} à valider{/if}
			</span>
		</div>

		{#if habits.length === 0}
			<div class="card flex flex-col items-center gap-3 py-10 text-center">
				<div class="text-4xl">🌱</div>
				<p class="text-muted">Aucune habitude pour l'instant.</p>
				<a href="/habitudes" class="btn-primary">Créer ma première habitude</a>
			</div>
		{:else}
			{#each habits as h (h.habit.id)}
				<HabitRow habit={h.habit} />
			{/each}
			<a
				href="/habitudes"
				class="mt-1 rounded-lg border border-dashed border-border py-3 text-center text-sm text-muted hover:text-ink"
			>
				Gérer mes habitudes
			</a>
		{/if}
	</section>
</div>
