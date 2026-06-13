<script lang="ts">
	let {
		level,
		prestige = 0,
		size = 'md'
	}: { level: number; prestige?: number; size?: 'sm' | 'md' | 'lg' } = $props();

	const dims = { sm: 'h-7 w-7 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-xl' };
</script>

<span class="relative inline-grid place-items-center">
	<span
		class="grid {dims[size]} place-items-center rounded-pill bg-gradient-to-br from-primary to-accent font-display font-bold text-white shadow-card"
		class:ring-2={prestige > 0}
		class:ring-gold={prestige > 0}
	>
		{level}
	</span>
	{#if prestige > 0}
		<span class="absolute -bottom-1 -right-1 rounded-pill bg-bg px-1 text-[10px] font-bold text-gold">
			★{prestige}
		</span>
	{/if}
</span>
