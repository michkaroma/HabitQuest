// src/lib/client/outbox.ts — file d'attente hors-ligne (IndexedDB) des validations.
// Idempotence garantie côté serveur par UNIQUE(habit_id, date).
import type { HabitStatus } from '$lib/types';

const DB_NAME = 'habitquest-outbox';
const STORE = 'logs';

export interface OutboxLog {
	clientId: string;
	habitId: number;
	date: string;
	status: HabitStatus;
	note: string | null;
	createdAt: number;
	attempts: number;
}

function uid(): string {
	return typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID()
		: `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'clientId' });
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	return openDb().then(
		(db) =>
			new Promise<T>((resolve, reject) => {
				const t = db.transaction(STORE, mode);
				const req = fn(t.objectStore(STORE));
				req.onsuccess = () => resolve(req.result);
				req.onerror = () => reject(req.error);
			})
	);
}

function hasIDB(): boolean {
	return typeof indexedDB !== 'undefined';
}

export async function enqueueLog(input: {
	habitId: number;
	date: string;
	status?: HabitStatus;
	note?: string | null;
}): Promise<void> {
	if (!hasIDB()) return;
	const record: OutboxLog = {
		clientId: uid(),
		habitId: input.habitId,
		date: input.date,
		status: input.status ?? 'done',
		note: input.note ?? null,
		createdAt: Date.now(),
		attempts: 0
	};
	await tx('readwrite', (s) => s.put(record));
}

export async function pendingLogs(): Promise<OutboxLog[]> {
	if (!hasIDB()) return [];
	const all = await tx<OutboxLog[]>('readonly', (s) => s.getAll() as IDBRequest<OutboxLog[]>);
	return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function countPending(): Promise<number> {
	if (!hasIDB()) return 0;
	return tx<number>('readonly', (s) => s.count());
}

async function remove(clientId: string): Promise<void> {
	await tx('readwrite', (s) => s.delete(clientId));
}

/** Rejoue toutes les validations en attente. Idempotent et sûr à répéter. */
export async function flushOutbox(): Promise<{ synced: number; remaining: number }> {
	if (!hasIDB() || (typeof navigator !== 'undefined' && !navigator.onLine))
		return { synced: 0, remaining: await countPending() };
	let synced = 0;
	for (const item of await pendingLogs()) {
		try {
			const res = await fetch(`/api/habits/${item.habitId}/log`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					date: item.date,
					status: item.status,
					note: item.note,
					clientId: item.clientId
				})
			});
			if (res.status === 401) break; // besoin de se reconnecter : on s'arrête
			if (res.ok || res.status === 409) {
				await remove(item.clientId); // idempotent : doublon = succès
				synced++;
			}
		} catch {
			break; // hors-ligne à nouveau
		}
	}
	return { synced, remaining: await countPending() };
}
