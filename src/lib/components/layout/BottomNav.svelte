<script lang="ts">
	import { page } from '$app/stores';

	const tabs = [
		{ href: '/', label: 'Accueil', icon: '🏠' },
		{ href: '/habitudes', label: 'Habitudes', icon: '✅' },
		{ href: '/addictions', label: 'Boss', icon: '🛡️' },
		{ href: '/boutique', label: 'Boutique', icon: '🛍️' }
	];
	const isActive = (href: string) =>
		href === '/' ? $page.url.pathname === '/' : $page.url.pathname.startsWith(href);
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-border bg-surface/95 pb-safe backdrop-blur-md"
	style="height: calc(var(--nav-h) + var(--safe-bottom));"
>
	<ul class="grid h-[var(--nav-h)] grid-cols-4">
		{#each tabs as t (t.href)}
			<li>
				<a
					href={t.href}
					class="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors {isActive(
						t.href
					)
						? 'text-primary'
						: 'text-muted'}"
					aria-current={isActive(t.href) ? 'page' : undefined}
				>
					<span
						class="text-xl leading-none {isActive(t.href)
							? 'drop-shadow-[0_0_8px_rgb(var(--c-primary)/0.6)]'
							: ''}">{t.icon}</span
					>
					<span class="font-medium">{t.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
