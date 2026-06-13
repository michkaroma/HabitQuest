// See https://svelte.dev/docs/kit/types#app.d.ts
/// <reference types="@vite-pwa/sveltekit" />
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			authed: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
