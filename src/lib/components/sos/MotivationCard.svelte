<script lang="ts">
	import { MOTIVATION } from '$lib/config/wellnessCopy';

	interface Props {
		cleanDays?: number;
		bestStreak?: number;
		moneySaved?: number;
		nextMilestoneLabel?: string;
	}

	let { cleanDays, bestStreak, moneySaved, nextMilestoneLabel }: Props = $props();

	let message = $state(MOTIVATION[0]);

	$effect(() => {
		const index = Math.floor(Math.random() * MOTIVATION.length);
		message = MOTIVATION[index];
	});
</script>

<div class="card flex flex-col gap-3">
	<p class="text-lg font-semibold text-ink">{message}</p>

	{#if cleanDays != null}
		<div class="flex flex-col gap-1">
			<p class="text-ink">Tu as déjà tenu {cleanDays} jour(s).</p>
			{#if bestStreak}
				<p class="text-muted text-sm">
					Ta meilleure série : {bestStreak} j — tu sais que tu en es capable.
				</p>
			{/if}
		</div>
	{/if}

	{#if moneySaved != null}
		<p class="text-gold font-semibold">💶 {moneySaved} € économisés</p>
	{/if}

	{#if nextMilestoneLabel}
		<p class="text-health">Prochain palier santé : {nextMilestoneLabel}</p>
	{/if}

	<p class="text-muted text-sm">
		Une envie dure rarement plus de 5 minutes. Respire, bois un verre d'eau, change de pièce.
	</p>
</div>
