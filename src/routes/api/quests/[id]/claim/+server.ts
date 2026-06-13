import type { RequestHandler } from './$types';
import { getQuest, completeQuest } from '$lib/server/db';
import { grantRewards } from '$lib/server/progression';
import { getCurrentQuests } from '$lib/server/quests';
import { ok, fail } from '$lib/server/respond';

export const POST: RequestHandler = ({ params }) => {
	const id = Number(params.id);
	const quest = getQuest(id);
	if (!quest) return fail('NOT_FOUND', 'Quête introuvable.', 404);
	if (quest.completed) return fail('ALREADY_CLAIMED', 'Quête déjà réclamée.', 409);
	if (quest.progress < quest.target)
		return fail('QUEST_INCOMPLETE', "Cette quête n'est pas encore terminée.", 409);

	// Marque terminée (transition unique) puis crédite la récompense.
	if (!completeQuest(id)) return fail('ALREADY_CLAIMED', 'Quête déjà réclamée.', 409);
	const delta = grantRewards(quest.reward_xp, quest.reward_coins);
	const claimed = getQuest(id)!;
	delta.completedQuests = [claimed];

	return ok({ delta, quest: claimed, quests: getCurrentQuests() });
};
