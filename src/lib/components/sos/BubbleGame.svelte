<script lang="ts">
	import { BUBBLE_GAME } from '$lib/config/wellnessCopy';
	import { reducedMotion } from '$lib/motion';

	interface Props {
		onfinish?: () => void;
	}
	let { onfinish }: Props = $props();

	interface Bubble {
		id: number;
		x: number; // left, percentage 0..100
		y: number; // px from bottom of the container
		size: number; // px
		speed: number; // px per second
		color: string;
	}

	let bubbles = $state<Bubble[]>([]);
	let popped = $state(0);
	let elapsedMs = $state(0);
	let running = $state(false);
	let containerH = $state(0);

	const won = $derived(popped >= BUBBLE_GAME.targetPops || elapsedMs >= BUBBLE_GAME.durationMs);

	// non-reactive script-local id counter
	let nextId = 0;

	function rand(min: number, max: number): number {
		return min + Math.random() * (max - min);
	}

	function pickColor(): string {
		const palette = BUBBLE_GAME.palette;
		return palette[Math.floor(Math.random() * palette.length)];
	}

	function spawnBubble(): void {
		const size = rand(BUBBLE_GAME.bubbleSizePx[0], BUBBLE_GAME.bubbleSizePx[1]);
		let speed = rand(BUBBLE_GAME.riseSpeedPxPerSec[0], BUBBLE_GAME.riseSpeedPxPerSec[1]);
		if (reducedMotion()) speed *= 0.45; // montée plus lente si mouvement réduit
		bubbles.push({
			id: nextId++,
			x: rand(0, 100),
			y: -size, // start just below the container
			size,
			speed,
			color: pickColor()
		});
	}

	function pop(id: number): void {
		bubbles = bubbles.filter((b) => b.id !== id);
		popped++;
		navigator.vibrate?.(15);
	}

	function reset(): void {
		bubbles = [];
		popped = 0;
		elapsedMs = 0;
		running = true;
	}

	// Stop the loop once the wave is over.
	$effect(() => {
		if (won) running = false;
	});

	// Main rAF loop. Restarts whenever `running` flips to true.
	$effect(() => {
		if (!running) return;

		let raf = 0;
		let last = performance.now();
		let spawnTimer = 0;
		let nextSpawnIn = rand(BUBBLE_GAME.spawnEveryMs[0], BUBBLE_GAME.spawnEveryMs[1]);

		const tick = (now: number) => {
			const dtMs = now - last;
			last = now;
			const dt = dtMs / 1000;

			elapsedMs += dtMs;

			// move bubbles up and drop those that left the top
			const h = containerH || 1;
			bubbles = bubbles
				.map((b) => ({ ...b, y: b.y + b.speed * dt }))
				.filter((b) => b.y < h + b.size);

			// spawn timing
			spawnTimer += dtMs;
			if (spawnTimer >= nextSpawnIn) {
				spawnTimer = 0;
				nextSpawnIn = rand(BUBBLE_GAME.spawnEveryMs[0], BUBBLE_GAME.spawnEveryMs[1]);
				spawnBubble();
			}

			raf = requestAnimationFrame(tick);
		};

		// seed a first bubble immediately so the screen isn't empty
		if (bubbles.length === 0) spawnBubble();
		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);
	});

	// Start automatically on mount.
	$effect(() => {
		running = true;
	});

	function bubbleStyle(b: Bubble): string {
		return [
			`left:${b.x}%`,
			`bottom:${b.y}px`,
			`width:${b.size}px`,
			`height:${b.size}px`,
			`background:${b.color}`,
			'transform:translateX(-50%)'
		].join(';');
	}
</script>

<div class="card flex flex-col gap-3">
	<header class="flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold text-ink">Souffle de calme</h2>
			<p class="text-sm text-muted">{popped} / {BUBBLE_GAME.targetPops} bulles</p>
		</div>
		<span class="pill">🌊</span>
	</header>

	<div
		class="relative h-[60vh] w-full overflow-hidden rounded-2xl border border-border bg-surface2"
		bind:clientHeight={containerH}
	>
		{#each bubbles as b (b.id)}
			<button
				type="button"
				aria-label="Éclater une bulle"
				class="absolute rounded-pill opacity-80 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
				style={bubbleStyle(b)}
				onpointerdown={() => pop(b.id)}
			></button>
		{/each}

		{#if won}
			<div
				class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-bg/80 p-6 text-center backdrop-blur-sm"
			>
				<p class="text-xl font-semibold text-ink">Tu as laissé passer la vague. 🌊</p>
				<div class="flex flex-wrap items-center justify-center gap-3">
					<button type="button" class="btn btn-ghost" onclick={reset}>Rejouer</button>
					<button type="button" class="btn btn-primary" onclick={() => onfinish?.()}>
						C'est passé
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
