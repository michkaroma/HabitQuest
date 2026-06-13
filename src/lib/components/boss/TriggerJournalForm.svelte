<script module lang="ts">
	export interface TriggerInput {
		targetId: number | null;
		trigger: string | null;
		craving: number | null;
		note: string | null;
		gaveIn: boolean;
	}
</script>

<script lang="ts">
	import { COMMON_TRIGGERS } from '$lib/content/fr';

	let {
		targetId = null,
		onsubmit,
		oncancel,
		submitting = false
	}: {
		targetId?: number | null;
		onsubmit: (e: TriggerInput) => void;
		oncancel?: () => void;
		submitting?: boolean;
	} = $props();

	let trigger = $state('');
	let craving = $state(5);
	let note = $state('');
	let gaveIn = $state(false);

	function submit(e: Event) {
		e.preventDefault();
		onsubmit({
			targetId,
			trigger: trigger.trim() || null,
			craving,
			note: note.trim() || null,
			gaveIn
		});
	}

	const cravingColor = $derived(craving <= 3 ? 'text-health' : craving <= 6 ? 'text-gold' : 'text-danger');
</script>

<form class="flex flex-col gap-3" onsubmit={submit}>
	<p class="text-sm text-muted">Noter une envie, c'est déjà une victoire.</p>

	<div>
		<label class="label" for="tj-trigger">Déclencheur</label>
		<input
			id="tj-trigger"
			class="input"
			list="tj-triggers"
			bind:value={trigger}
			placeholder="ex : Stress"
			maxlength="200"
		/>
		<datalist id="tj-triggers">
			{#each COMMON_TRIGGERS as t (t)}<option value={t}></option>{/each}
		</datalist>
	</div>

	<div>
		<label class="label" for="tj-craving">Intensité de l'envie : <span class={cravingColor}>{craving}/10</span></label>
		<input id="tj-craving" class="w-full" type="range" min="1" max="10" bind:value={craving} />
	</div>

	<div>
		<label class="label" for="tj-note">Note (facultatif)</label>
		<textarea id="tj-note" class="input h-20 py-2" bind:value={note} maxlength="500"></textarea>
	</div>

	<label class="flex items-center gap-2 text-sm">
		<input type="checkbox" bind:checked={gaveIn} class="h-4 w-4 accent-primary" />
		J'ai cédé cette fois (sans jugement)
	</label>

	<div class="flex gap-2">
		<button type="submit" class="btn-primary flex-1" disabled={submitting}>Enregistrer</button>
		{#if oncancel}<button type="button" class="btn-ghost" onclick={oncancel}>Annuler</button>{/if}
	</div>
</form>
