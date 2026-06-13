<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import ToastHost from '$lib/components/feedback/ToastHost.svelte';
	import OverlayHost from '$lib/components/feedback/OverlayHost.svelte';
	import { gameState } from '$lib/stores/gameState.svelte';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	const showShell = $derived(data.authed && $page.url.pathname !== '/login');

	$effect(() => {
		if (data.authed) {
			gameState.hydrate({
				userState: data.userState,
				level: data.level,
				today: data.today,
				quests: data.quests
			});
		}
	});
</script>

{#if showShell}
	<div class="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-bg">
		<AppHeader />
		<main class="flex-1 px-4 pb-nav pt-3">
			{@render children()}
		</main>
		<BottomNav />
	</div>
	<ToastHost />
	<OverlayHost />
{:else}
	{@render children()}
{/if}
