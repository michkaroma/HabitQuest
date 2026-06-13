import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.ts',
			registerType: 'prompt',
			scope: '/',
			base: '/',
			injectManifest: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff2,webmanifest}'],
				maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
			},
			manifest: {
				name: 'HabitQuest',
				short_name: 'HabitQuest',
				description:
					'Transforme tes bonnes habitudes et ta lutte contre les addictions en jeu vidéo : XP, niveaux, séries et récompenses.',
				lang: 'fr',
				dir: 'ltr',
				theme_color: '#0d0f14',
				background_color: '#0b1120',
				display: 'standalone',
				orientation: 'portrait',
				start_url: '/?source=pwa',
				scope: '/',
				categories: ['health', 'lifestyle', 'productivity'],
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{ src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
					{ src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				],
				shortcuts: [
					{
						name: 'Valider une habitude',
						short_name: 'Aujourd’hui',
						description: 'Aller directement à l’écran du jour',
						url: '/?source=shortcut'
					},
					{
						name: 'SOS envie',
						short_name: 'SOS',
						description: 'Ouvrir la respiration guidée',
						url: '/addictions?sos=1'
					}
				]
			},
			devOptions: {
				enabled: false,
				type: 'module',
				navigateFallback: '/'
			}
		})
	]
});
