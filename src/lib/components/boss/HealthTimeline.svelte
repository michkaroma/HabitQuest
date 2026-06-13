<script lang="ts">
	import { timelineFor, type HealthMilestone } from '$lib/config/healthTimelines';
	import { reducedMotion } from '$lib/motion';

	interface Props {
		kind: string;
		cleanSince: string | null;
	}

	let { kind, cleanSince }: Props = $props();

	const milestones = $derived<HealthMilestone[]>(timelineFor(kind));

	// Horloge réactive (mise à jour douce une fois par seconde).
	let now = $state(Date.now());

	$effect(() => {
		// Pas de date de début → pas besoin de minuter.
		if (cleanSince === null) return;
		const id = setInterval(() => {
			now = Date.now();
		}, 1000);
		now = Date.now();
		return () => clearInterval(id);
	});

	const startMs = $derived(
		cleanSince === null ? null : new Date(cleanSince + 'T00:00:00').getTime()
	);

	const elapsedSeconds = $derived(
		startMs === null ? 0 : Math.max(0, (now - startMs) / 1000)
	);

	// Index du premier palier non atteint (= prochaine étape), -1 si tout est atteint.
	const nextIndex = $derived.by(() => {
		if (cleanSince === null) return -1;
		return milestones.findIndex((m) => elapsedSeconds < m.afterSeconds);
	});
</script>

<section class="card">
	<h3 class="text-lg font-semibold text-ink">Frise de récupération</h3>

	{#if cleanSince === null}
		<p class="mt-2 text-sm text-muted">
			Indique une date de début pour suivre ta récupération.
		</p>
	{/if}

	<ol class="relative mt-4 ml-2 flex flex-col gap-5 border-l border-border pl-6">
		{#each milestones as m, i (m.afterSeconds)}
			{@const reached = cleanSince !== null && elapsedSeconds >= m.afterSeconds}
			{@const isNext = i === nextIndex}
			<li
				class="relative {cleanSince === null
					? 'opacity-50'
					: reached
						? 'opacity-100'
						: 'opacity-50'}"
			>
				<!-- Pastille sur le rail -->
				<span
					class="absolute -left-[2.1rem] flex h-7 w-7 items-center justify-center rounded-full text-sm
						{reached ? 'bg-health text-bg' : 'bg-surface2 border border-border text-muted'}
						{isNext && !reducedMotion ? 'animate-flame-pulse' : ''}"
					aria-hidden="true"
				>
					{#if reached}
						✓
					{:else if cleanSince === null}
						🔒
					{:else}
						⏳
					{/if}
				</span>

				<div
					class="rounded-lg {isNext
						? 'ring-1 ring-accent/60 bg-accent/5 px-3 py-2 -mx-3'
						: ''}"
				>
					{#if isNext}
						<p class="pill mb-1 inline-block bg-accent/15 text-accent">Prochaine étape</p>
					{/if}
					<p class="text-xs text-muted">{m.afterLabel}</p>
					<p class="font-semibold text-ink">{m.title}</p>
					<p class="mt-0.5 text-sm text-muted">{m.message}</p>
				</div>
			</li>
		{/each}
	</ol>
</section>
