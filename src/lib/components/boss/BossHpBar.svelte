<script lang="ts">
	import type { BossTier } from '$lib/server/boss';

	let {
		hpRemaining,
		maxHp,
		tier,
		defeated = false
	}: { hpRemaining: number; maxHp: number; tier: BossTier; defeated?: boolean } = $props();

	const pct = $derived(maxHp > 0 ? Math.max(0, Math.min(100, (hpRemaining / maxHp) * 100)) : 0);
	const color: Record<BossTier, string> = {
		colossal: 'bg-boss',
		affaibli: 'bg-flame',
		vacillant: 'bg-gold',
		agonisant: 'bg-health',
		vaincu: 'bg-health'
	};
</script>

<div class="flex flex-col gap-1">
	<div class="track h-3">
		<div
			class="track-fill {defeated ? 'bg-health' : color[tier]} transition-[width] duration-700 ease-out-soft"
			style="width: {defeated ? 100 : pct}%"
		></div>
	</div>
	<div class="text-xs text-muted">
		{#if defeated}
			<span class="font-semibold text-health">Vaincu ! 🎉</span>
		{:else}
			PV {hpRemaining} / {maxHp} · encore {hpRemaining} jour{hpRemaining > 1 ? 's' : ''} pour le terrasser
		{/if}
	</div>
</div>
