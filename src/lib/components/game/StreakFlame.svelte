<script lang="ts">
	let {
		days,
		size = 'md',
		showLabel = false
	}: { days: number; size?: 'sm' | 'md'; showLabel?: boolean } = $props();

	const pulse = $derived(days >= 3);
	const glow = $derived(days >= 30 ? 'drop-shadow-[0_0_8px_rgb(var(--c-flame)/0.7)]' : days >= 7 ? 'drop-shadow-[0_0_5px_rgb(var(--c-flame)/0.5)]' : '');
	const text = $derived(size === 'sm' ? 'text-sm' : 'text-base');
</script>

<span class="inline-flex items-center gap-0.5 {text}" class:text-flame={days > 0} class:text-muted={days === 0}>
	<span class="{glow}" class:animate-flame-pulse={pulse}>🔥</span>
	{#if showLabel}<span class="font-semibold tabular-nums">{days} j</span>{:else if days > 0}<span class="font-semibold tabular-nums">{days}</span>{/if}
</span>
