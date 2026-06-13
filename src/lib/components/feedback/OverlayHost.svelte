<script lang="ts">
	import { celebration } from '$lib/stores/celebration.svelte';
	import LevelUpOverlay from './LevelUpOverlay.svelte';
	import SosSheet from '$lib/components/sos/SosSheet.svelte';
</script>

{#if celebration.levelUp}
	<LevelUpOverlay
		level={celebration.levelUp.level}
		coins={celebration.levelUp.coins}
		onclose={() => celebration.clearLevelUp()}
	/>
{/if}

<SosSheet />
