// src/lib/config/wellnessCopy.ts — microcopy FR + config bien-être (SOS, respiration,
// mini-jeu, rechute). Tout est centralisé pour rester ajustable.

export const SOS = {
	sheetTitle: 'Respire, tu n’es pas seul·e dans ce moment',
	sheetIntro:
		'Une envie, c’est une vague : elle monte, puis elle redescend. Choisis ce qui t’aide là, maintenant.',
	choiceBreathe: 'Respirer',
	choiceBreatheHint: 'Un exercice guidé pour calmer le corps',
	choiceDistract: 'Se distraire',
	choiceDistractHint: 'Un petit jeu pour laisser passer la vague',
	choiceMotivate: 'Se motiver',
	choiceMotivateHint: 'Rappelle-toi pourquoi tu fais ça',
	footerRelapse: 'Finalement, j’ai cédé…',
	footerClose: 'Ça va mieux, je ferme',
	cravingPassed: 'Bravo. Tu viens de laisser passer une envie. C’est exactement comme ça qu’on avance.'
} as const;

export const MOTIVATION: readonly string[] = [
	'Tu as déjà fait le plus dur : commencer. Ne lâche pas maintenant.',
	'Cette envie va passer, que tu cèdes ou non. Autant la laisser passer.',
	'Pense à toi dans une heure, fier d’avoir tenu.',
	'Chaque envie surmontée rend la suivante un peu plus facile.',
	'Tu vaux mieux que ce moment difficile. Il va passer.',
	'Bois un grand verre d’eau, respire à fond, change de pièce. Juste ça.',
	'Ta meilleure série, c’est la preuve que tu en es capable. Recommence ici.',
	'Personne ne te regarde, personne ne te juge. Fais-le pour toi.'
] as const;

// --- Respiration (cohérence cardiaque) ---
export interface BreathingConfig {
	inhaleMs: number;
	holdInMs: number;
	exhaleMs: number;
	holdOutMs: number;
	totalDurationMs: number;
	haptics: boolean;
}

export const BREATHING_DEFAULT: BreathingConfig = {
	inhaleMs: 5000,
	holdInMs: 0,
	exhaleMs: 5000,
	holdOutMs: 0,
	totalDurationMs: 5 * 60 * 1000,
	haptics: true
};

export const BREATHING_PRESETS = [
	{ label: '1 min', totalDurationMs: 60000 },
	{ label: '3 min', totalDurationMs: 180000 },
	{ label: '5 min', totalDurationMs: 300000 }
] as const;

// --- Mini-jeu « Souffle de calme » ---
export const BUBBLE_GAME = {
	durationMs: 60000,
	targetPops: 30,
	spawnEveryMs: [500, 1200] as const,
	riseSpeedPxPerSec: [25, 55] as const,
	bubbleSizePx: [36, 72] as const,
	palette: ['#60a5fa', '#34d399', '#a78bfa', '#f472b6', '#fbbf24'] as const
} as const;

// --- Équivalences argent économisé (affichage motivant) ---
export const MONEY_EQUIVALENTS: readonly { seuil: number; label: string }[] = [
	{ seuil: 15, label: 'un resto 🍽️' },
	{ seuil: 60, label: 'un jeu vidéo 🎮' },
	{ seuil: 150, label: 'une paire de chaussures 👟' },
	{ seuil: 400, label: 'un week-end 🧳' },
	{ seuil: 900, label: "un billet d'avion ✈️" }
] as const;

// --- Rechute (bienveillant, §7) ---
export const RELAPSE = {
	triggerLink: 'J’ai rechuté',
	introTitle: 'Une rechute, ça arrive. Ça n’efface rien.',
	introBody:
		'Ce n’est pas un échec, c’est une information. Tu n’es pas revenu·e à zéro : tout le chemin parcouru reste à toi. On note, et on repart.',
	introCta: 'Continuer',
	freezeTitle: 'Tu as un gel de série disponible',
	freezeBody:
		'Un gel protège ta série pour cette fois. Ta progression continue comme si de rien n’était. À utiliser quand tu en as besoin, sans culpabilité.',
	freezeUse: 'Utiliser un gel ❄️',
	freezeSkip: 'Non, je repars de zéro sereinement',
	freezeNone:
		'Tu n’as pas de gel disponible pour l’instant (tu en reçois un chaque semaine). Ce n’est pas grave : on repart en douceur.',
	resetTitle: 'On repart d’un nouveau premier jour',
	resetBody:
		'Un nouveau départ, ce n’est pas une punition. C’est juste aujourd’hui qui recommence. Tu sais déjà comment faire.',
	noteTitle: 'Envie d’en dire un mot ? (facultatif)',
	noteHintTrigger: 'Qu’est-ce qui a déclenché l’envie ?',
	noteHintCraving: 'Intensité de l’envie (1 à 10)',
	noteHintNote: 'Une note pour toi-même',
	noteSkip: 'Passer',
	noteSave: 'Enregistrer',
	doneTitle: 'C’est noté. On continue ensemble.',
	doneBestStreak: 'Ta meilleure série reste ta preuve : {best} jours. Tu peux refaire au moins ça.',
	doneFrozen: 'Ta série est protégée. Rien ne change, continue comme avant. ❄️',
	doneReset: 'Jour 1 commence maintenant. Le plus dur — décider de continuer — est déjà fait.',
	doneCta: 'Je repars maintenant 💪',
	toast: 'Rechute enregistrée. Cap sur le prochain jour clean.'
} as const;
