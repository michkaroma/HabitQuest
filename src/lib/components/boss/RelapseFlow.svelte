<script lang="ts">
	import type { BossState } from '$lib/server/boss';
	import { RELAPSE } from '$lib/config/wellnessCopy';
	import { COMMON_TRIGGERS } from '$lib/content/fr';
	import { fade, fly } from 'svelte/transition';
	import { dur } from '$lib/motion';

	let {
		open,
		boss,
		freezes,
		onconfirm,
		onclose
	}: {
		open: boolean;
		boss: BossState | null;
		freezes: number;
		onconfirm: (p: {
			useFreeze: boolean;
			trigger: string | null;
			craving: number | null;
			note: string | null;
		}) => Promise<{ usedFreeze: boolean; bestStreakDays: number }>;
		onclose: () => void;
	} = $props();

	type Step = 'intro' | 'freeze' | 'note' | 'done';
	let step = $state<Step>('intro');
	let useFreeze = $state(false);
	let trigger = $state('');
	let craving = $state(5);
	let note = $state('');
	let busy = $state(false);
	let result = $state<{ usedFreeze: boolean; bestStreakDays: number } | null>(null);

	// Réinitialise quand on (ré)ouvre.
	$effect(() => {
		if (open) {
			step = 'intro';
			useFreeze = false;
			trigger = '';
			craving = 5;
			note = '';
			result = null;
		}
	});

	function afterIntro() {
		step = freezes > 0 ? 'freeze' : 'note';
	}

	async function doConfirm() {
		if (busy) return;
		busy = true;
		try {
			result = await onconfirm({
				useFreeze,
				trigger: trigger.trim() || null,
				craving,
				note: note.trim() || null
			});
			step = 'done';
		} finally {
			busy = false;
		}
	}

	const doneBest = $derived(
		RELAPSE.doneBestStreak.replace('{best}', String(result?.bestStreakDays ?? boss?.bestStreakDays ?? 0))
	);
</script>

{#if open && boss}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
		transition:fade={{ duration: dur(180) }}
		role="presentation"
		onclick={onclose}
	>
		<div
			class="card max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-b-none sm:rounded-2xl"
			transition:fly={{ y: 40, duration: dur(240) }}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			{#if step === 'intro'}
				<h2 class="text-lg font-bold">{RELAPSE.introTitle}</h2>
				<p class="mt-2 text-sm text-muted">{RELAPSE.introBody}</p>
				<div class="mt-4 flex gap-2">
					<button class="btn-primary flex-1" onclick={afterIntro}>{RELAPSE.introCta}</button>
					<button class="btn-ghost" onclick={onclose}>Fermer</button>
				</div>
			{:else if step === 'freeze'}
				<h2 class="text-lg font-bold">{RELAPSE.freezeTitle}</h2>
				<p class="mt-2 text-sm text-muted">{RELAPSE.freezeBody}</p>
				<div class="mt-4 flex flex-col gap-2">
					<button class="btn-primary" onclick={() => { useFreeze = true; step = 'note'; }}>
						{RELAPSE.freezeUse} ({freezes} dispo)
					</button>
					<button class="btn-ghost" onclick={() => { useFreeze = false; step = 'note'; }}>
						{RELAPSE.freezeSkip}
					</button>
				</div>
			{:else if step === 'note'}
				<h2 class="text-lg font-bold">{RELAPSE.noteTitle}</h2>
				<div class="mt-3 flex flex-col gap-3">
					<div>
						<label class="label" for="rf-trigger">{RELAPSE.noteHintTrigger}</label>
						<input id="rf-trigger" class="input" list="rf-triggers" bind:value={trigger} maxlength="200" />
						<datalist id="rf-triggers">
							{#each COMMON_TRIGGERS as t (t)}<option value={t}></option>{/each}
						</datalist>
					</div>
					<div>
						<label class="label" for="rf-craving">{RELAPSE.noteHintCraving} : {craving}/10</label>
						<input id="rf-craving" class="w-full" type="range" min="1" max="10" bind:value={craving} />
					</div>
					<div>
						<label class="label" for="rf-note">{RELAPSE.noteHintNote}</label>
						<textarea id="rf-note" class="input h-16 py-2" bind:value={note} maxlength="500"></textarea>
					</div>
					<div class="flex gap-2">
						<button class="btn-primary flex-1" onclick={doConfirm} disabled={busy}>{RELAPSE.noteSave}</button>
						<button class="btn-ghost" onclick={doConfirm} disabled={busy}>{RELAPSE.noteSkip}</button>
					</div>
				</div>
			{:else}
				<h2 class="text-lg font-bold">{RELAPSE.doneTitle}</h2>
				<p class="mt-2 text-sm">{result?.usedFreeze ? RELAPSE.doneFrozen : RELAPSE.doneReset}</p>
				<p class="mt-1 text-sm text-muted">{doneBest}</p>
				<button class="btn-primary mt-4 w-full" onclick={onclose}>{RELAPSE.doneCta}</button>
			{/if}
		</div>
	</div>
{/if}
