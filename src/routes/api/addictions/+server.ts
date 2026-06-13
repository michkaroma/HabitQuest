import type { RequestHandler } from './$types';
import { listAddictionTargets, createAddictionTarget } from '$lib/server/db';
import { computeBossState } from '$lib/server/boss';
import { BOSS } from '$lib/config/boss';
import { ok, fail } from '$lib/server/respond';
import type { AddictionKind, NewAddictionTarget } from '$lib/types';

const KINDS: AddictionKind[] = ['tabac', 'alcool', 'sucre', 'ecrans', 'autre'];

export const GET: RequestHandler = () => {
	return ok({ bosses: listAddictionTargets().map((t) => computeBossState(t)) });
};

export const POST: RequestHandler = async ({ request }) => {
	const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const name = typeof b.name === 'string' ? b.name.trim() : '';
	if (!name || name.length > 60) return fail('VALIDATION', 'Donne un nom à ton boss.', 400);

	const kind = KINDS.includes(b.kind as AddictionKind) ? (b.kind as AddictionKind) : 'autre';
	const target = Number(b.target_streak_days);
	const targetDays = Number.isFinite(target)
		? Math.max(BOSS.MIN_TARGET, Math.min(BOSS.MAX_TARGET, Math.floor(target)))
		: BOSS.DEFAULT_TARGET;
	const money = Number(b.money_per_day);

	const input: NewAddictionTarget = {
		name,
		kind,
		clean_since: typeof b.clean_since === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.clean_since) ? b.clean_since : null,
		money_per_day: Number.isFinite(money) && money >= 0 ? money : 0,
		target_streak_days: targetDays,
		icon: typeof b.icon === 'string' && b.icon ? b.icon : null
	};
	const created = createAddictionTarget(input);
	return ok({ target: created, boss: computeBossState(created) }, 201);
};
