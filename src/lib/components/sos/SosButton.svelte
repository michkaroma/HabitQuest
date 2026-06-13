<script lang="ts">
	import { sos } from '$lib/stores/sos.svelte';
</script>

<button
	class="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-pill bg-boss text-2xl text-white shadow-raised transition active:scale-90"
	style="bottom: calc(var(--nav-h) + var(--safe-bottom) + 1rem);"
	aria-label="J'ai une envie, besoin d'aide"
	onclick={() => sos.openSos(null)}
>
	🆘
</button>
