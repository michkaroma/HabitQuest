<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let busy = $state(false);

	const unlocked = $derived(data.achievements.filter((a) => a.unlocked_at).length);

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
		<div class="flex items-baseline justify-between">
			<h2 class="text-lg font-bold">Succès</h2>
			<span class="text-sm text-muted tabular-nums">{unlocked}/{data.achievements.length}</span>
		</div>
		<div class="grid grid-cols-2 gap-2">
			{#each data.achievements as a (a.key)}
				<div
					class="card flex items-center gap-2 p-3"
					class:opacity-45={!a.unlocked_at}
				>
					<span class="text-2xl">{a.unlocked_at ? (a.icon ?? '🏆') : '🔒'}</span>
					<div class="min-w-0">
						<div class="truncate text-sm font-semibold">{a.name}</div>
						<div class="truncate text-xs text-muted">{a.description}</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-lg font-bold">Notifications</h2>
		<div class="card text-sm text-muted">Les rappels quotidiens (Web Push) arrivent à l'étape 8.</div>
	</section>

	<button class="btn-danger" onclick={logout} disabled={busy}>Se déconnecter</button>
</div>
