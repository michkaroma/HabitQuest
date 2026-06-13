// src/lib/content/fr.ts — petites listes de contenu FR partagées.

export const COMMON_TRIGGERS = [
	'Stress',
	'Ennui',
	'Soirée',
	'Café',
	'Après le repas',
	'Émotion forte',
	'Fatigue',
	'Habitude',
	'Entourage'
] as const;

export const ADDICTION_KINDS = [
	{ value: 'tabac', label: 'Tabac', icon: '🚬' },
	{ value: 'alcool', label: 'Alcool', icon: '🍷' },
	{ value: 'sucre', label: 'Sucre / malbouffe', icon: '🍩' },
	{ value: 'ecrans', label: 'Écrans / réseaux', icon: '📱' },
	{ value: 'autre', label: 'Autre', icon: '👾' }
] as const;
