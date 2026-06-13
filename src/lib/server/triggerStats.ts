// src/lib/server/triggerStats.ts — agrégations du journal de déclencheurs (sans lib graphe).
import { getDb } from './db';

export interface TriggerCount {
	trigger: string;
	count: number;
	gaveInCount: number;
}
export interface HourBucket {
	hour: number;
	count: number;
}
export interface DayPoint {
	date: string;
	total: number;
	gaveIn: number;
}
export interface TriggerStats {
	totalEntries: number;
	avgCraving: number;
	gaveInRate: number;
	byTrigger: TriggerCount[];
	byHour: HourBucket[];
	cravingByDay: DayPoint[];
	gaveInByDay: DayPoint[];
}

/** Agrège le journal d'un boss (ou tous si targetId null) sur les `days` derniers jours. */
export function getTriggerStats(targetId: number | null, days = 30): TriggerStats {
	const db = getDb();
	const where = targetId == null ? '1=1' : 'target_id = @targetId';
	const since = `-${days} days`;
	const params = targetId == null ? { since } : { targetId, since };

	const base = db
		.prepare(
			`SELECT COUNT(*) AS n, COALESCE(AVG(craving),0) AS avgC, COALESCE(AVG(gave_in),0) AS rate
       FROM trigger_journal WHERE ${where} AND date >= datetime('now', @since)`
		)
		.get(params) as { n: number; avgC: number; rate: number };

	const byTrigger = db
		.prepare(
			`SELECT COALESCE(NULLIF(trigger,''),'(non précisé)') AS trigger,
              COUNT(*) AS count, SUM(gave_in) AS gaveInCount
       FROM trigger_journal WHERE ${where} AND date >= datetime('now', @since)
       GROUP BY trigger ORDER BY count DESC LIMIT 8`
		)
		.all(params) as TriggerCount[];

	const byHourRaw = db
		.prepare(
			`SELECT CAST(strftime('%H', date) AS INTEGER) AS hour, COUNT(*) AS count
       FROM trigger_journal WHERE ${where} AND date >= datetime('now', @since)
       GROUP BY hour`
		)
		.all(params) as HourBucket[];
	const byHour: HourBucket[] = Array.from({ length: 24 }, (_, h) => ({
		hour: h,
		count: byHourRaw.find((r) => r.hour === h)?.count ?? 0
	}));

	const byDay = db
		.prepare(
			`SELECT strftime('%Y-%m-%d', date) AS date, COUNT(*) AS total,
              SUM(gave_in) AS gaveIn, COALESCE(AVG(craving),0) AS avgCraving
       FROM trigger_journal WHERE ${where} AND date >= datetime('now', @since)
       GROUP BY date ORDER BY date ASC`
		)
		.all(params) as (DayPoint & { avgCraving: number })[];

	return {
		totalEntries: base.n,
		avgCraving: Math.round(base.avgC * 10) / 10,
		gaveInRate: Math.round(base.rate * 100) / 100,
		byTrigger,
		byHour,
		cravingByDay: byDay.map((d) => ({ date: d.date, total: Math.round(d.avgCraving * 10) / 10, gaveIn: d.gaveIn })),
		gaveInByDay: byDay.map((d) => ({ date: d.date, total: d.total, gaveIn: d.gaveIn }))
	};
}
