// src/lib/server/reminder.ts — construit le rappel quotidien (ton bienveillant, §7).
import { getDb, localDate } from './db';
import type { PushPayload } from './push';

export function buildDailyReminder(): PushPayload {
	const today = localDate();
	const remaining = (
		getDb()
			.prepare(
				`SELECT COUNT(*) AS c FROM habits h
         WHERE h.archived = 0
           AND NOT EXISTS (SELECT 1 FROM habit_logs l WHERE l.habit_id = h.id AND l.date = ?)`
			)
			.get(today) as { c: number }
	).c;

	if (remaining === 0) {
		return {
			title: 'HabitQuest',
			body: 'Bravo, tout est validé pour aujourd’hui. 🔥 Reviens demain !',
			url: '/'
		};
	}
	const word = remaining === 1 ? 'habitude' : 'habitudes';
	return {
		title: 'HabitQuest',
		body: `Il te reste ${remaining} ${word} à valider aujourd’hui. Un petit pas compte. 💪`,
		url: '/?source=push',
		tag: 'daily-reminder'
	};
}
