<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { enablePush, disablePush, getPushState, type PushState } from '$lib/client/push';
	import { celebration } from '$lib/stores/celebration.svelte';

	let { data }: { data: PageData } = $props();

	let busy = $state(false);
	let pushState = $state<PushState>('default');
	let pushBusy = $state(false);

	const unlocked = $derived(data.achievements.filter((a) => a.unlocked_at).length);

	$effect(() => {
		getPushState().then((s) => (pushState = s));
	});

	const pushLabel = $derived(
		pushState === 'subscribed'
			? 'Activés ✓'
			: pushState === 'denied'
				? 'Refusés (navigateur)'
				: pushState === 'unsupported'
					? 'Non supporté'
					: pushState === 'unconfigured'
						? 'Clés VAPID manquantes'
						: 'Désactivés'
	);

	async function togglePush() {
		if (pushBusy) return;
		pushBusy = true;
		try {
			if (pushState === 'subscribed') {
				await disablePush();
				pushState = 'default';
				celebration.toast('Rappels désactivés.', 'info');
			} else {
				const s = await enablePush();
				pushState = s;
				if (s === 'subscribed') celebration.toast('Rappels quotidiens activés ! 🔔', 'success');
				else if (s === 'denied')
					celebration.toast('Notifications refusées dans le navigateur.', 'warn');
				else if (s === 'unconfigured')
					celebration.toast('Push non configuré (clés VAPID manquantes côté serveur).', 'warn');
				else if (s === 'unsupported')
					celebration.toast('Notifications non supportées sur cet appareil.', 'warn');
			}
		} finally {
			pushBusy = false;
		}
	}

	async function testPush() {
		const r = await fetch('/api/push/test', { method: 'POST' });
		const d = (await r.json().catch(() => null)) as { sent?: number } | null;
		celebration.toast(d?.sent ? `Notification envoyée (${d.sent}).` : 'Aucun appareil abonné.', 'info');
	}

	async function logout() {
		busy = true;
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}
</script>

<svelte:head><title>Réglages · HabitQuest</title></svelte:head>

<div class="flex flex-col gap-5">
	<h1 class="text-xl font-extrabold tracking-tight">Réglages</h1>

	<section class="flex flex-col gap-2">
		<h2 class="text-lg font-bold">Rappels quotidiens</h2>
		<div class="card flex items-center justify-between gap-3">
			<div class="min-w-0">
				<div class="font-semibold">Notifications</div>
				<div class="text-xs text-muted">{pushLabel}</div>
			</div>
			<button class="btn-primary" onclick={togglePush} disabled={pushBusy}>
				{pushState === 'subscribed' ? 'Désactiver' : 'Activer'}
			</button>
		</div>
		{#if pushState === 'subscribed'}
			<button class="btn-ghost" onclick={testPush}>Envoyer une notification de test</button>
		{/if}
	</section>

	<section class="flex flex-col gap-2">
		<div class="flex items-baseline justify-between">
			<h2 class="text-lg font-bold">Succès</h2>
			<span class="text-sm text-muted tabular-nums">{unlocked}/{data.achievements.length}</span>
		</div>
		<div class="grid grid-cols-2 gap-2">
			{#each data.achievements as a (a.key)}
				<div class="card flex items-center gap-2 p-3" class:opacity-45={!a.unlocked_at}>
					<span class="text-2xl">{a.unlocked_at ? (a.icon ?? '🏆') : '🔒'}</span>
					<div class="min-w-0">
						<div class="truncate text-sm font-semibold">{a.name}</div>
						<div class="truncate text-xs text-muted">{a.description}</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<button class="btn-danger" onclick={logout} disabled={busy}>Se déconnecter</button>
</div>
