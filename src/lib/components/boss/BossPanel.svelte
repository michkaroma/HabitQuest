<script lang="ts">
	import type { BossState, BossTier } from '$lib/server/boss';
	import BossHpBar from './BossHpBar.svelte';
	import StreakFlame from '$lib/components/game/StreakFlame.svelte';
	import MoneySaved from './MoneySaved.svelte';

	let {
		boss,
		onsos,
		onrelapse,
		onsetclean,
		ondefeat
	}: {
		boss: BossState;
		onsos: (id: number) => void;
		onrelapse: (boss: BossState) => void;
		onsetclean: (boss: BossState) => void;
		ondefeat: (boss: BossState) => void;
	} = $props();

	const tierLabel: Record<BossTier, string> = {
		colossal: 'Colossal',
		affaibli: 'Affaibli',
		vacillant: 'Vacillant',
		agonisant: 'Agonisant',
		vaincu: 'Vaincu'
	};
	const tierEmojiClass: Record<BossTier, string> = {
		colossal: '',
		affaibli: 'opacity-90',
		vacillant: 'opacity-80 animate-wiggle',
		agonisant: 'opacity-60 grayscale-[.4] animate-wiggle',
		vaincu: 'opacity-40 grayscale'
	};

	const claimed = $derived(boss.defeatedAt !== null);
	const canClaimVictory = $derived(
		!claimed && boss.cleanSince !== null && boss.cleanDays >= boss.targetDays
	);
</script>

<div class="card flex flex-col gap-3 border-l-4 {boss.defeated ? 'border-l-health' : 'border-l-boss'}">
	<div class="flex items-center gap-3">
		<span class="text-4xl {tierEmojiClass[boss.tier]}">{boss.icon}</span>
		<div class="min-w-0 flex-1">
			<div class="truncate font-bold">{boss.name}</div>
			<div class="text-xs text-muted">Boss « {tierLabel[boss.tier]} »</div>
		</div>
	</div>

	{#if boss.cleanSince === null}
		<p class="text-sm text-muted">Indique depuis quand tu es clean pour commencer le combat.</p>
		<button class="btn-primary" onclick={() => onsetclean(boss)}>Définir une date de début</button>
	{:else}
		<BossHpBar hpRemaining={boss.hpRemaining} maxHp={boss.targetDays} tier={boss.tier} defeated={boss.defeated} />

		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
			<StreakFlame days={boss.cleanDays} showLabel />
			<span class="text-muted">🏆 Record : {boss.bestStreakDays} j</span>
		</div>

		<MoneySaved amount={boss.moneySaved} perDay={undefined} />

		{#if boss.nextMilestoneDays}
			<div class="text-xs text-muted">🩺 Prochain palier : {boss.nextMilestoneDays} jours clean</div>
		{/if}

		{#if claimed}
			<div class="rounded-lg bg-health/15 p-3 text-center text-sm font-semibold text-health">
				🏆 Boss vaincu — et la série continue !
			</div>
			<div class="flex gap-2">
				<button class="btn bg-boss/15 text-boss flex-1" onclick={() => onsos(boss.id)}>🆘 J'ai une envie</button>
				<button class="btn-ghost" onclick={() => onrelapse(boss)}>J'ai rechuté</button>
			</div>
		{:else if canClaimVictory}
			<div class="rounded-lg bg-health/15 p-3 text-center">
				<div class="font-bold text-health">🎉 Objectif atteint : {boss.targetDays} jours !</div>
				<button class="btn-primary mt-2 w-full" onclick={() => ondefeat(boss)}>Terrasser le boss</button>
			</div>
		{:else}
			<div class="flex gap-2">
				<button class="btn bg-boss/15 text-boss flex-1" onclick={() => onsos(boss.id)}>🆘 J'ai une envie</button>
				<button class="btn-ghost" onclick={() => onrelapse(boss)}>J'ai rechuté</button>
			</div>
		{/if}
	{/if}
</div>
