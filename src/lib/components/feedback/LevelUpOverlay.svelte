<script lang="ts">
	import LevelBadge from '$lib/components/game/LevelBadge.svelte';
	import { confettiLite } from './confetti';
	import { fade, scale } from 'svelte/transition';
	import { dur } from '$lib/motion';

	let {
		level,
		coins,
		onclose
	}: { level: number; coins?: number; onclose: () => void } = $props();

	$effect(() => {
		confettiLite(30);
		const t = setTimeout(onclose, 3600);
		return () => clearTimeout(t);
	});
</script>

<button
	class="fixed inset-0 z-50 grid place-items-center bg-bg/80 backdrop-blur-md"
	transition:fade={{ duration: dur(200) }}
	onclick={onclose}
	aria-label="Fermer"
>
	<div class="flex flex-col items-center gap-4 text-center" transition:scale={{ start: 0.5, duration: dur(360) }}>
		<div class="relative grid place-items-center">
			<span class="absolute h-24 w-24 animate-ping-ring rounded-pill bg-primary/40"></span>
			<LevelBadge {level} size="lg" />
		</div>
		<div>
			<div class="font-display text-3xl font-extrabold">Niveau {level} !</div>
			<div class="text-muted">Continue comme ça. 🎉</div>
		</div>
		{#if coins}
			<span class="pill bg-gold/15 text-gold">🪙 +{coins} pièces</span>
		{/if}
		<div class="text-xs text-muted">Touche pour fermer</div>
	</div>
</button>
