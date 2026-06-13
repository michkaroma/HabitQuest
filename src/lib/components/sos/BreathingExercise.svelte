<script lang="ts">
	import {
		BREATHING_DEFAULT,
		BREATHING_PRESETS,
		SOS,
		type BreathingConfig
	} from '$lib/config/wellnessCopy';
	import { reducedMotion } from '$lib/motion';

	type Props = { onfinish?: () => void };
	let { onfinish }: Props = $props();

	type Phase = 'idle' | 'inhale' | 'holdIn' | 'exhale' | 'holdOut' | 'done';

	let cfg = $state<BreathingConfig>({ ...BREATHING_DEFAULT });
	let phase = $state<Phase>('idle');
	let cycles = $state(0);
	let phaseProgress = $state(0);
	let elapsedMs = $state(0);
	let running = $state(false);

	const cue = $derived(
		phase === 'inhale'
			? 'Inspire'
			: phase === 'exhale'
				? 'Expire'
				: phase === 'holdIn' || phase === 'holdOut'
					? 'Pause'
					: phase === 'done'
						? 'Terminé'
						: 'Prêt ?'
	);

	const circleScale = $derived(
		phase === 'inhale'
			? 0.5 + 0.5 * phaseProgress
			: phase === 'exhale'
				? 1 - 0.5 * phaseProgress
				: phase === 'holdIn'
					? 1
					: 0.5
	);

	const order = ['inhale', 'holdIn', 'exhale', 'holdOut'] as const;
	type ActivePhase = (typeof order)[number];

	function durOf(p: Phase): number {
		return p === 'inhale'
			? cfg.inhaleMs
			: p === 'holdIn'
				? cfg.holdInMs
				: p === 'exhale'
					? cfg.exhaleMs
					: p === 'holdOut'
						? cfg.holdOutMs
						: 0;
	}

	// Anti-drift / animation state — non-reactive script locals.
	let raf = 0;
	let phaseStart = 0;
	let runStart = 0;
	let idx = 0;

	const totalMs = $derived(cfg.totalDurationMs);
	const remainingMs = $derived(Math.max(0, totalMs - elapsedMs));
	const trackPct = $derived(totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0);

	// Reduced-motion: numeric countdown for the active phase (seconds remaining).
	const phaseRemainingSec = $derived(
		(() => {
			const d = durOf(phase);
			if (d <= 0) return 0;
			return Math.max(0, Math.ceil((d * (1 - phaseProgress)) / 1000));
		})()
	);

	function fmtMMSS(ms: number): string {
		const total = Math.ceil(ms / 1000);
		const m = Math.floor(total / 60);
		const s = total % 60;
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	function buzz(p: Phase): void {
		if (!cfg.haptics) return;
		if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
		if (p === 'inhale') navigator.vibrate(40);
		else if (p === 'exhale') navigator.vibrate([20, 20]);
		else if (p === 'done') navigator.vibrate([60, 40, 60]);
	}

	function enter(p: ActivePhase): void {
		phase = p;
		phaseStart = performance.now();
		phaseProgress = 0;
		buzz(p);
	}

	function nextPhase(): void {
		// Advance idx, skipping phases whose duration is 0; increment cycles on wrap.
		for (let guard = 0; guard < order.length + 1; guard++) {
			idx = (idx + 1) % order.length;
			if (idx === 0) cycles += 1;
			if (durOf(order[idx]) > 0) break;
		}
		enter(order[idx]);
	}

	function loop(t: number): void {
		if (!running) return;
		elapsedMs = t - runStart;
		if (elapsedMs >= cfg.totalDurationMs) {
			finish();
			return;
		}
		const d = durOf(phase);
		phaseProgress = d > 0 ? Math.min(1, (t - phaseStart) / d) : 1;
		if (phaseProgress >= 1) nextPhase();
		raf = requestAnimationFrame(loop);
	}

	function start(): void {
		running = true;
		cycles = 0;
		elapsedMs = 0;
		idx = 0;
		runStart = performance.now();
		enter('inhale');
		raf = requestAnimationFrame(loop);
	}

	function finish(): void {
		running = false;
		phase = 'done';
		cancelAnimationFrame(raf);
		buzz('done');
	}

	function stop(): void {
		running = false;
		phase = 'idle';
		cancelAnimationFrame(raf);
	}

	function selectPreset(ms: number): void {
		cfg = { ...cfg, totalDurationMs: ms };
	}

	$effect(() => {
		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="card flex flex-col items-center gap-6 p-6">
	<!-- Cercle de respiration -->
	<div class="relative flex h-64 w-64 items-center justify-center">
		{#if reducedMotion()}
			<!-- Fallback statique : cercle fixe + décompte numérique -->
			<svg viewBox="0 0 200 200" class="h-full w-full" aria-hidden="true">
				<circle cx="100" cy="100" r="92" fill="none" stroke="var(--border, currentColor)" class="text-border opacity-40" stroke-width="2" />
				<circle
					cx="100"
					cy="100"
					r="64"
					fill="none"
					stroke-width="6"
					class={phase === 'inhale' ? 'text-accent' : phase === 'exhale' ? 'text-health' : 'text-muted'}
					stroke="currentColor"
				/>
			</svg>
			<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
				<span class="text-2xl font-semibold text-ink">{cue}</span>
				{#if running && durOf(phase) > 0}
					<span class="mt-1 text-4xl font-bold tabular-nums text-ink">{phaseRemainingSec}</span>
				{/if}
				<span class="mt-1 text-sm text-muted">Respiration {cycles}</span>
			</div>
		{:else}
			<!-- Cercle animé -->
			<svg viewBox="0 0 200 200" class="h-full w-full" aria-hidden="true">
				<circle cx="100" cy="100" r="92" fill="none" stroke="var(--border, currentColor)" class="text-border opacity-30" stroke-width="2" />
				<g style="transform-origin:100px 100px;transform:scale({circleScale});transition:none">
					<circle
						cx="100"
						cy="100"
						r="80"
						class={phase === 'inhale' ? 'text-accent' : phase === 'exhale' ? 'text-health' : 'text-primary'}
						fill="currentColor"
						fill-opacity="0.18"
						stroke="currentColor"
						stroke-width="3"
					/>
				</g>
			</svg>
			<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
				<span class="text-2xl font-semibold text-ink">{cue}</span>
				<span class="mt-1 text-sm text-muted">Respiration {cycles}</span>
			</div>
		{/if}
	</div>

	<!-- Progression globale + temps restant -->
	<div class="w-full">
		<div class="track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(trackPct)}>
			<div class="track-fill" style="width:{trackPct}%"></div>
		</div>
		<div class="mt-1 flex justify-between text-xs text-muted">
			<span>Temps restant</span>
			<span class="tabular-nums">{fmtMMSS(remainingMs)}</span>
		</div>
	</div>

	{#if phase === 'done'}
		<!-- Fin de l'exercice -->
		<div class="flex flex-col items-center gap-4 text-center">
			<p class="text-base text-ink">{SOS.cravingPassed}</p>
			<button type="button" class="btn btn-primary" onclick={() => onfinish?.()}>
				C'est passé
			</button>
		</div>
	{:else}
		<!-- Durées préréglées -->
		<div class="flex flex-wrap items-center justify-center gap-2">
			{#each BREATHING_PRESETS as preset (preset.label)}
				<button
					type="button"
					class="pill {cfg.totalDurationMs === preset.totalDurationMs ? 'text-ink' : 'text-muted'}"
					aria-pressed={cfg.totalDurationMs === preset.totalDurationMs}
					disabled={running}
					onclick={() => selectPreset(preset.totalDurationMs)}
				>
					{preset.label}
				</button>
			{/each}
		</div>

		<!-- Contrôles -->
		<div class="flex items-center gap-3">
			{#if running}
				<button type="button" class="btn btn-ghost" onclick={stop}>Arrêter</button>
			{:else}
				<button type="button" class="btn btn-primary" onclick={start}>Démarrer</button>
			{/if}
		</div>
	{/if}
</div>
