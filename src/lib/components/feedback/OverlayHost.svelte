<script lang="ts">
	import { celebration } from '$lib/stores/celebration.svelte';
	import LevelUpOverlay from './LevelUpOverlay.svelte';
	// SosSheet est branché à l'étape 7.
</script>

{#if celebration.levelUp}
	<LevelUpOverlay
		level={celebration.levelUp.level}
		coins={celebration.levelUp.coins}
		onclose={() => celebration.clearLevelUp()}
	/>
{/if}
