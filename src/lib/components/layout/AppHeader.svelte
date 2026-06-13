<script lang="ts">
	import { gameState } from '$lib/stores/gameState.svelte';
	import LevelBadge from '$lib/components/game/LevelBadge.svelte';
	import CoinPill from '$lib/components/game/CoinPill.svelte';
	import XpBar from '$lib/components/game/XpBar.svelte';

	const level = $derived(gameState.level);
</script>

<header class="sticky top-0 z-30 border-b border-border bg-bg/85 pt-safe backdrop-blur-md">
	<div class="flex h-14 items-center justify-between gap-3 px-4">
		<a href="/" class="flex items-center gap-2" aria-label="Profil">
			<LevelBadge level={level.level} prestige={level.prestige} size="sm" />
			<span class="text-sm font-semibold">Niv. {level.level}</span>
		</a>
		<div class="flex items-center gap-2">
			<CoinPill amount={gameState.user.coins} />
			<a href="/reglages" class="btn-icon text-lg" aria-label="Réglages">⚙️</a>
		</div>
	</div>
	<div class="px-4 pb-2">
		<XpBar intoLevel={level.intoLevel} needed={level.needed} compact />
	</div>
</header>
