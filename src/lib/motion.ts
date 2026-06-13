// src/lib/motion.ts — respect des préférences de mouvement réduit.
export const reducedMotion = (): boolean =>
	typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Durée d'animation, ramenée à 0 si l'utilisateur préfère le mouvement réduit. */
export const dur = (ms: number): number => (reducedMotion() ? 0 : ms);
