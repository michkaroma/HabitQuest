<script lang="ts">
	import { goto } from '$app/navigation';

	let busy = $state(false);

	async function logout() {
		busy = true;
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}
</script>

<svelte:head><title>Réglages · HabitQuest</title></svelte:head>

<div class="flex flex-col gap-4">
	<h1 class="text-xl font-extrabold tracking-tight">Réglages</h1>

	<div class="card flex flex-col gap-1">
		<div class="font-semibold">Notifications</div>
		<p class="text-sm text-muted">Les rappels quotidiens (Web Push) arrivent à l'étape 8.</p>
	</div>

	<button class="btn-danger" onclick={logout} disabled={busy}>Se déconnecter</button>
</div>
