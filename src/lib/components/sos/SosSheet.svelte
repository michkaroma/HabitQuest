<script lang="ts">
	import { sos } from '$lib/stores/sos.svelte';
	import { SOS } from '$lib/config/wellnessCopy';
	import { celebration } from '$lib/stores/celebration.svelte';
	import BreathingExercise from './BreathingExercise.svelte';
	import BubbleGame from './BubbleGame.svelte';
	import MotivationCard from './MotivationCard.svelte';
	import { fade, fly } from 'svelte/transition';
	import { dur } from '$lib/motion';
	import type { Achievement } from '$lib/types';

	type View = 'choices' | 'breathe' | 'distract' | 'motivate';
	let view = $state<View>('choices');

	$effect(() => {
		if (sos.open) view = 'choices';
	});

	async function breatheDone() {
		try {
			const r = await fetch('/api/sos/breathe', { method: 'POST' });
			const d = (await r.json().catch(() => null)) as { unlockedAchievements?: Achievement[] } | null;
			for (const a of d?.unlockedAchievements ?? []) celebration.pushAchievement(a);
		} catch {
			/* hors-ligne : pas grave */
		}
		celebration.toast(SOS.cravingPassed, 'success');
		view = 'choices';
	}

	function distractDone() {
		celebration.toast(SOS.cravingPassed, 'success');
		view = 'choices';
	}
</script>

{#if sos.open}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
		transition:fade={{ duration: dur(180) }}
		role="presentation"
		onclick={() => sos.closeSos()}
	>
		<div
			class="card max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-b-none pb-safe sm:rounded-2xl"
			transition:fly={{ y: 60, duration: dur(260) }}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			{#if view === 'choices'}
				<h2 class="text-lg font-bold">{SOS.sheetTitle}</h2>
				<p class="mt-1 text-sm text-muted">{SOS.sheetIntro}</p>
				<div class="mt-4 flex flex-col gap-2">
					<button class="card-2 flex items-center gap-3 p-3 text-left active:scale-[0.98]" onclick={() => (view = 'breathe')}>
						<span class="text-2xl">🫁</span>
						<span><span class="block font-semibold">{SOS.choiceBreathe}</span><span class="block text-xs text-muted">{SOS.choiceBreatheHint}</span></span>
					</button>
					<button class="card-2 flex items-center gap-3 p-3 text-left active:scale-[0.98]" onclick={() => (view = 'distract')}>
						<span class="text-2xl">🎮</span>
						<span><span class="block font-semibold">{SOS.choiceDistract}</span><span class="block text-xs text-muted">{SOS.choiceDistractHint}</span></span>
					</button>
					<button class="card-2 flex items-center gap-3 p-3 text-left active:scale-[0.98]" onclick={() => (view = 'motivate')}>
						<span class="text-2xl">💪</span>
						<span><span class="block font-semibold">{SOS.choiceMotivate}</span><span class="block text-xs text-muted">{SOS.choiceMotivateHint}</span></span>
					</button>
				</div>
				<button class="btn-ghost mt-4 w-full" onclick={() => sos.closeSos()}>{SOS.footerClose}</button>
			{:else}
				<button class="mb-2 text-sm text-muted hover:text-ink" onclick={() => (view = 'choices')}>← Retour</button>
				{#if view === 'breathe'}
					<BreathingExercise onfinish={breatheDone} />
				{:else if view === 'distract'}
					<BubbleGame onfinish={distractDone} />
				{:else if view === 'motivate'}
					<MotivationCard />
				{/if}
			{/if}
		</div>
	</div>
{/if}
