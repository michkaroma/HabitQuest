import type { RequestHandler } from './$types';
import { getAddictionTarget, updateAddictionTarget, deleteAddictionTarget } from '$lib/server/db';
import { computeBossState } from '$lib/server/boss';
import { BOSS } from '$lib/config/boss';
import { ok, fail } from '$lib/server/respond';
import type { AddictionKind, NewAddictionTarget } from '$lib/types';

const KINDS: AddictionKind[] = ['tabac', 'alcool', 'sucre', 'ecrans', 'autre'];

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!getAddictionTarget(id)) return fail('NOT_FOUND', 'Boss introuvable.', 404);
	const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const patch: Partial<NewAddictionTarget> = {};
	if (typeof b.name === 'string' && b.name.trim()) patch.name = b.name.trim();
	if (KINDS.includes(b.kind as AddictionKind)) patch.kind = b.kind as AddictionKind;
	if (b.icon !== undefined) patch.icon = typeof b.icon === 'string' ? b.icon : null;
	if (b.money_per_day !== undefined && Number.isFinite(Number(b.money_per_day)))
		patch.money_per_day = Math.max(0, Number(b.money_per_day));
	if (b.target_streak_days !== undefined && Number.isFinite(Number(b.target_streak_days)))
		patch.target_streak_days = Math.max(BOSS.MIN_TARGET, Math.min(BOSS.MAX_TARGET, Math.floor(Number(b.target_streak_days))));
	const target = updateAddictionTarget(id, patch);
	return ok({ target, boss: target ? computeBossState(target) : null });
};

export const DELETE: RequestHandler = ({ params }) => {
	const id = Number(params.id);
	if (!getAddictionTarget(id)) return fail('NOT_FOUND', 'Boss introuvable.', 404);
	deleteAddictionTarget(id);
	return ok({ ok: true });
};
