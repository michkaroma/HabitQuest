<script lang="ts">
	let {
		intoLevel,
		needed,
		compact = false
	}: { intoLevel: number; needed: number; compact?: boolean } = $props();

	const pct = $derived(needed > 0 ? Math.min(100, Math.round((intoLevel / needed) * 100)) : 0);
</script>

<div class="w-full">
	{#if !compact}
		<div class="mb-1 flex items-center justify-between text-xs text-muted">
			<span>XP</span>
			<span class="tabular-nums">{intoLevel} / {needed}</span>
		</div>
	{/if}
	<div class="track" class:h-1.5={compact}>
		<div
			class="track-fill bg-gradient-to-r from-xp to-primary transition-[width] duration-500 ease-out-soft"
			style="width: {pct}%"
		></div>
	</div>
</div>
