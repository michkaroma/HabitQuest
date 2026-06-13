<script lang="ts">
	import { reducedMotion } from '$lib/motion';

	interface TriggerCount {
		trigger: string;
		count: number;
		gaveInCount: number;
	}
	interface HourBucket {
		hour: number;
		count: number;
	}
	interface DayPoint {
		date: string;
		total: number;
		gaveIn: number;
	}
	interface TriggerStats {
		totalEntries: number;
		avgCraving: number;
		gaveInRate: number;
		byTrigger: TriggerCount[];
		byHour: HourBucket[];
		cravingByDay: DayPoint[];
		gaveInByDay: DayPoint[];
	}

	interface Props {
		stats: TriggerStats;
	}

	let { stats }: Props = $props();

	const enough = $derived(stats.totalEntries >= 3);

	// Bloc 1 — déclencheurs
	const maxTriggerCount = $derived(
		Math.max(1, ...stats.byTrigger.map((t) => t.count))
	);

	// Bloc 2 — envie moyenne (clamp 0..10)
	const cravingPct = $derived(
		Math.max(0, Math.min(100, (stats.avgCraving / 10) * 100))
	);

	// Bloc 3 — par heure
	const maxHour = $derived(Math.max(1, ...stats.byHour.map((h) => h.count)));
	const peakHour = $derived.by(() => {
		let peak = 0;
		let best = -1;
		for (const h of stats.byHour) {
			if (h.count > best) {
				best = h.count;
				peak = h.hour;
			}
		}
		return peak;
	});

	// Bloc 4 — évolution
	const dayTotals = $derived(stats.cravingByDay.map((d) => d.total));

	function sparkPoints(values: number[], w = 240, h = 48): string {
		const max = Math.max(1, ...values);
		if (!values.length) return '';
		const step = values.length > 1 ? w / (values.length - 1) : 0;
		return values
			.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
			.join(' ');
	}

	const trend = $derived.by(() => {
		const v = dayTotals;
		if (v.length < 2) return 'stable';
		const mid = Math.floor(v.length / 2);
		const first = v.slice(0, mid);
		const second = v.slice(mid);
		if (!first.length || !second.length) return 'stable';
		const avg = (arr: number[]) => arr.reduce((s, n) => s + n, 0) / arr.length;
		const a = avg(first);
		const b = avg(second);
		const diff = b - a;
		const threshold = Math.max(0.5, a * 0.1);
		if (diff < -threshold) return 'down';
		if (diff > threshold) return 'up';
		return 'stable';
	});

	const trendCaption = $derived(
		trend === 'down'
			? 'Ton envie moyenne baisse 📉'
			: trend === 'up'
				? 'Ton envie moyenne monte 📈'
				: 'Ton envie moyenne reste stable'
	);

	// Animation douce de la barre d'envie moyenne
	let gaugeWidth = $state(0);

	$effect(() => {
		const target = cravingPct;
		if (reducedMotion()) {
			gaugeWidth = target;
			return;
		}
		let raf = 0;
		const start = performance.now();
		const from = gaugeWidth;
		const duration = 600;
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			gaugeWidth = from + (target - from) * eased;
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const hours = Array.from({ length: 24 }, (_, i) => i);
	function hourCount(h: number): number {
		return stats.byHour.find((b) => b.hour === h)?.count ?? 0;
	}
</script>

{#if !enough}
	<div class="card text-muted">
		Pas encore assez de notes pour dégager une tendance. Continue à noter, sans pression.
	</div>
{:else}
	<div class="space-y-4">
		<!-- Bloc 1 — Déclencheurs -->
		<section class="card">
			<h3 class="label mb-3">Tes déclencheurs les plus fréquents</h3>
			<ul class="space-y-3">
				{#each stats.byTrigger as t (t.trigger)}
					<li>
						<div class="mb-1 flex items-baseline justify-between text-sm">
							<span class="text-ink">{t.trigger}</span>
							<span class="text-muted">{t.count}</span>
						</div>
						<div class="relative h-3 w-full overflow-hidden rounded-pill bg-surface2">
							<div
								class="absolute inset-y-0 left-0 rounded-pill bg-primary"
								style="width: {(t.count / maxTriggerCount) * 100}%"
							></div>
							{#if t.gaveInCount > 0}
								<div
									class="absolute bottom-0 left-0 h-1 rounded-pill bg-danger"
									style="width: {(t.gaveInCount / maxTriggerCount) * 100}%"
									title="{t.gaveInCount} fois cédé"
								></div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>

		<!-- Bloc 2 — Envie moyenne -->
		<section class="card">
			<h3 class="label mb-3">Envie moyenne</h3>
			<div class="track">
				<div class="track-fill bg-flame" style="width: {gaugeWidth}%"></div>
			</div>
			<p class="mt-2 text-right text-sm text-muted">
				<span class="text-ink font-semibold">{stats.avgCraving}</span> / 10
			</p>
		</section>

		<!-- Bloc 3 — Par heure -->
		<section class="card">
			<h3 class="label mb-3">Par heure</h3>
			<div class="flex h-20 items-end gap-px">
				{#each hours as h (h)}
					{@const c = hourCount(h)}
					<div
						class="flex-1 rounded-t {h === peakHour ? 'bg-flame' : 'bg-primary/60'}"
						style="height: {Math.max(2, (c / maxHour) * 100)}%"
						title="{h} h — {c}"
					></div>
				{/each}
			</div>
			<p class="mt-2 text-sm text-muted">
				Tes envies arrivent souvent vers <span class="text-ink font-semibold">{peakHour} h</span>
			</p>
		</section>

		<!-- Bloc 4 — Évolution -->
		<section class="card">
			<h3 class="label mb-3">Évolution</h3>
			<svg viewBox="0 0 240 48" class="h-12 w-full" preserveAspectRatio="none" role="img" aria-label="Évolution de l'envie moyenne par jour">
				<polyline
					points={sparkPoints(dayTotals)}
					fill="none"
					stroke="currentColor"
					class="text-accent"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					vector-effect="non-scaling-stroke"
				/>
			</svg>
			<p class="mt-2 text-sm text-muted">{trendCaption}</p>
		</section>
	</div>
{/if}
