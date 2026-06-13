<script lang="ts">
	import type { ToastItem } from '$lib/types';
	import { fly } from 'svelte/transition';
	import { dur } from '$lib/motion';

	let { toast, ondismiss }: { toast: ToastItem; ondismiss: (id: string) => void } = $props();

	const stripe: Record<NonNullable<ToastItem['tone']>, string> = {
		info: 'border-l-primary',
		success: 'border-l-health',
		warn: 'border-l-flame',
		danger: 'border-l-danger',
		flame: 'border-l-flame',
		gold: 'border-l-gold'
	};
</script>

<div
	class="pointer-events-auto flex items-center gap-2 rounded-lg border border-border border-l-4 bg-surface px-3 py-2.5 shadow-raised {stripe[
		toast.tone ?? 'info'
	]}"
	transition:fly={{ y: -24, duration: dur(220) }}
	role="status"
>
	{#if toast.icon}<span class="text-lg">{toast.icon}</span>{/if}
	<span class="flex-1 text-sm">{toast.message}</span>
	{#if toast.action}
		<button class="text-xs font-semibold text-primary" onclick={() => toast.action?.run()}>
			{toast.action.label}
		</button>
	{/if}
	<button class="text-muted hover:text-ink" aria-label="Fermer" onclick={() => ondismiss(toast.id)}>×</button>
</div>
