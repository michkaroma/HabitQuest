<script lang="ts">
	import type { Achievement } from '$lib/types';
	import { fly } from 'svelte/transition';
	import { dur } from '$lib/motion';

	let { achievement, onclose }: { achievement: Achievement; onclose: () => void } = $props();

	$effect(() => {
		const t = setTimeout(onclose, 4200);
		return () => clearTimeout(t);
	});
</script>

<button
	class="pointer-events-auto relative w-full overflow-hidden rounded-lg border border-gold/50 bg-surface px-4 py-3 text-left shadow-raised"
	transition:fly={{ y: -32, duration: dur(280) }}
	onclick={onclose}
>
	<div
		class="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/20 to-transparent"
	></div>
	<div class="flex items-center gap-3">
		<span class="text-3xl">{achievement.icon ?? '🏆'}</span>
		<div class="min-w-0">
			<div class="text-xs font-semibold uppercase tracking-wide text-gold">Succès débloqué</div>
			<div class="truncate font-bold">{achievement.name}</div>
			{#if achievement.description}
				<div class="truncate text-xs text-muted">{achievement.description}</div>
			{/if}
		</div>
	</div>
</button>
