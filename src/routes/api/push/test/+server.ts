import type { RequestHandler } from './$types';
import { sendToAll } from '$lib/server/push';
import { ok } from '$lib/server/respond';

export const POST: RequestHandler = async () => {
	const r = await sendToAll({
		title: 'HabitQuest',
		body: 'Ceci est une notification de test. Tout fonctionne ! 🎉',
		url: '/'
	});
	return ok(r);
};
