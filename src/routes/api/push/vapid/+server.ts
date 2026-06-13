import type { RequestHandler } from './$types';
import { env, pushConfigured } from '$lib/server/env';
import { ok } from '$lib/server/respond';

export const GET: RequestHandler = () => ok({ publicKey: env.VAPID_PUBLIC, configured: pushConfigured });
