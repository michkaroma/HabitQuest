<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import BottomNav from '$lib/components/layout/BottomNav.svelte';
	import ToastHost from '$lib/components/feedback/ToastHost.svelte';
	import OverlayHost from '$lib/components/feedback/OverlayHost.svelte';
	import SosButton from '$lib/components/sos/SosButton.svelte';
	import PwaUpdater from '$lib/components/feedback/PwaUpdater.svelte';
	import { gameState } from '$lib/stores/gameState.svelte';
	import { sync } from '$lib/stores/sync.svelte';
	import { flushOutbox } from '$lib/client/outbox';
	import type { SyncStateResponse } from '$lib/types';

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

	async function doFlush() {
		sync.setSyncing(true);
		const { synced } = await flushOutbox();
		await sync.refresh();
		sync.setSyncing(false);
		if (synced > 0) {
			try {
				const r = await fetch('/api/sync/state');
				if (r.ok) gameState.hydrate((await r.json()) as SyncStateResponse);
			} catch {
				/* réessai au prochain événement */
			}
		}
	}

	// Synchronisation hors-ligne : écoute online/offline + signal du service worker.
	$effect(() => {
		if (!data.authed || typeof window === 'undefined') return;
		const onOnline = () => {
			sync.setOnline(true);
			doFlush();
		};
		const onOffline = () => sync.setOnline(false);
		const onMsg = (e: MessageEvent) => {
			if ((e.data as { type?: string })?.type === 'FLUSH_OUTBOX') doFlush();
		};
		window.addEventListener('online', onOnline);
		window.addEventListener('offline', onOffline);
		navigator.serviceWorker?.addEventListener?.('message', onMsg);
		sync.refresh();
		doFlush();
		return () => {
			window.removeEventListener('online', onOnline);
			window.removeEventListener('offline', onOffline);
			navigator.serviceWorker?.removeEventListener?.('message', onMsg);
		};
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
	<SosButton />
	<ToastHost />
	<OverlayHost />
	<PwaUpdater />
{:else}
	{@render children()}
{/if}
