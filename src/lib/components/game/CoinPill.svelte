<script lang="ts">
	let { amount, delta = 0 }: { amount: number; delta?: number } = $props();

	let pop = $state(false);
	let floatVal = $state<number | null>(null);

	$effect(() => {
		if (delta > 0) {
			pop = true;
			floatVal = delta;
			const t1 = setTimeout(() => (pop = false), 460);
			const t2 = setTimeout(() => (floatVal = null), 650);
			return () => {
				clearTimeout(t1);
				clearTimeout(t2);
			};
		}
	});

	// Espace fin insécable pour les milliers (format FR).
	const formatted = $derived(amount.toLocaleString('fr-FR'));
</script>

<span class="pill relative bg-gold/15 text-gold">
	<span class:animate-coin-pop={pop}>🪙</span>
	<span class="font-medium tabular-nums">{formatted}</span>
	{#if floatVal !== null}
		<span class="animate-coin-float pointer-events-none absolute -top-3 right-1 text-xs font-bold text-gold">
			+{floatVal}
		</span>
	{/if}
</span>
