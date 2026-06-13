<script lang="ts">
	import { MONEY_EQUIVALENTS } from '$lib/config/wellnessCopy';
	import { reducedMotion } from '$lib/motion';

	interface Props {
		amount: number;
		perDay?: number;
		currency?: string;
	}

	let { amount, perDay, currency = 'EUR' }: Props = $props();

	let display = $state(0);

	const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

	const formatted = $derived(
		new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency ?? 'EUR' }).format(
			display
		)
	);

	const symbol = $derived((currency ?? 'EUR') === 'EUR' ? '€' : (currency ?? 'EUR'));

	const equivalent = $derived.by(() => {
		let match: { seuil: number; label: string } | undefined;
		for (const eq of MONEY_EQUIVALENTS) {
			if (eq.seuil <= amount) match = eq;
		}
		return match;
	});

	$effect(() => {
		const target = amount;

		if (reducedMotion()) {
			display = target;
			return;
		}

		const from = display;
		const delta = target - from;
		const duration = 900;
		const start = performance.now();
		let raf = 0;

		const tick = (now: number) => {
			const elapsed = now - start;
			const t = Math.min(elapsed / duration, 1);
			display = from + delta * easeOutCubic(t);
			if (t < 1) {
				raf = requestAnimationFrame(tick);
			} else {
				display = target;
			}
		};

		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="card flex flex-col items-center text-center">
	<h3 class="label text-muted">Argent économisé 💶</h3>

	<p class="font-display text-health text-4xl sm:text-5xl tabular-nums" aria-live="polite">
		{formatted}
	</p>

	{#if perDay != null}
		<p class="text-muted text-sm">{perDay} {symbol}/jour économisés</p>
	{/if}

	{#if equivalent}
		<p class="text-sm">Soit déjà {equivalent.label} !</p>
	{/if}
</div>
