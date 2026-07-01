# Prompt 2 — Moteur de notifications programmables

> **À coller dans Claude Code, exécuté sur le serveur.** Mode *auto-accept edits* (Shift+Tab).
> **Prérequis :** le prompt 1 doit être fait et commité (fuseau horaire + `getTimezone`/`localDate` sensibles au fuseau + `addDays`). Ce prompt s'appuie dessus.

## Contexte

**HabitQuest** : PWA SvelteKit 2 / Svelte 5 (runes) / TS strict / SQLite (`better-sqlite3`), mono-utilisateur, auto-hébergée, **UI en français**. **Lis `CLAUDE.md` en premier**, puis explore : `src/lib/server/push.ts`, `src/lib/server/reminder.ts`, `src/lib/server/env.ts`, `src/hooks.server.ts`, `src/service-worker.ts`, `src/lib/client/push.ts`, `src/routes/api/push/*`, `src/routes/api/cron/daily/+server.ts`, `src/lib/server/migrations.ts`, `src/lib/server/schemas.ts`, `src/lib/components/habits/HabitForm.svelte`, `src/routes/reglages/`.

**Objectif :** poser un **moteur de notifications programmables** générique, qui remplace le rappel unique quotidien actuel. Il doit permettre : (a) un **rappel par habitude à une heure choisie**, et (c) un **récapitulatif du soir intelligent** (« il te reste X à valider ») envoyé **seulement si tout n'est pas fait**. Il doit aussi poser la **tuyauterie des boutons d'action Android** (pour que les prompts 5 « Je suis debout ☀️ » et 6 « Pause » n'aient plus qu'à s'y brancher).

**Ce prompt NE fait PAS :** le module sommeil, le minuteur, ni leurs notifications spécifiques (prompts 5 et 6). Il fournit seulement le socle + les deux rappels généraux.

## Contraintes non négociables

- **Node 22**, **aucune nouvelle dépendance** (on garde `node-cron` et `web-push` déjà présents).
- Le moteur programme à l'heure **locale de l'utilisateur** via `getTimezone()`/`localDate()` du prompt 1.
- **Ton non-punitif** partout ; **strings UI et notifications en français**.
- Migration idempotente via `addColumnIfMissing` (prochaine version : **v3**).
- Réponses API via `ok`/`fail`.
- Fin : `npm run check` à **0 erreur**, commit + `CLAUDE.md`.

---

## Tâche 1 — Schéma & réglages

### 1.1 — Migration v3 (`notification_engine`)
Dans `src/lib/server/migrations.ts`, ajoute une migration **v3** :
```ts
addColumnIfMissing(db, 'habits', 'reminder_time', `reminder_time TEXT`); // 'HH:MM' ou NULL
```
(Rien d'autre en base : les préférences globales vont dans `settings`.)

### 1.2 — Réglages par défaut (`initDb`)
Ajoute un réglage global `notif_prefs` (JSON) s'il est absent, en réutilisant l'heure existante comme défaut :
```ts
if (getSetting('notif_prefs') === null) {
  setSetting('notif_prefs', { eveningRecap: { enabled: true, time: env.PUSH_TIME /* défaut '20:00' */ } });
}
```
> `reminder_time` d'une habitude est porté par la ligne `habits` (pas dans `notif_prefs`). `notif_prefs` ne contient que les préférences globales.

---

## Tâche 2 — Le moteur (tick à la minute)

Crée `src/lib/server/scheduler.ts`. Principe : **une fonction évaluée chaque minute** qui lit l'heure locale en direct, envoie les notifications dues (non déjà envoyées aujourd'hui), avec une petite fenêtre de rattrapage.

### 2.1 — Anti-doublon (dans la table `settings`)
Un seul objet borné `notif_sent` = `{ [key: string]: 'YYYY-MM-DD' }` (une entrée par notification, écrasée) :
```ts
function alreadySentToday(key: string, date: string): boolean {
  const m = getSetting<Record<string, string>>('notif_sent') ?? {};
  return m[key] === date;
}
function markSentToday(key: string, date: string): void {
  const m = getSetting<Record<string, string>>('notif_sent') ?? {};
  m[key] = date;
  setSetting('notif_sent', m);
}
```

### 2.2 — La fonction principale
```ts
const CATCHUP_MIN = 15; // tolère un serveur redémarré / une minute manquée

/** Minutes depuis minuit pour 'HH:MM'. */
function hmToMinutes(hm: string): number { const [h, m] = hm.split(':').map(Number); return h * 60 + m; }

export async function runScheduledNotifications(now: Date = new Date()): Promise<void> {
  const tz = getTimezone();
  const date = localDate(now, tz);
  const [hh, mm] = localDateTime(now, tz).slice(11, 16).split(':').map(Number);
  const nowMin = hh * 60 + mm;

  // Une notif est "due" si l'heure cible est atteinte et dans la fenêtre de rattrapage, non envoyée aujourd'hui.
  const due = (target: string, key: string) => {
    const t = hmToMinutes(target);
    return nowMin >= t && nowMin - t < CATCHUP_MIN && !alreadySentToday(key, date);
  };

  // --- (a) Rappels par habitude ---
  for (const h of listHabits({ archived: false })) {
    if (!h.reminder_time) continue;
    const key = `habit:${h.id}`;
    if (!due(h.reminder_time, key)) continue;
    if (isHabitSatisfied(h, date)) continue; // déjà faite (voir 2.3) → pas de rappel
    await sendToAll({
      title: 'HabitQuest',
      body: `Petit rappel : ${h.name} 🗡️`,
      url: '/', tag: `habit-${h.id}`
    });
    markSentToday(key, date);
  }

  // --- (c) Récapitulatif du soir (conditionnel) ---
  const prefs = getSetting<{ eveningRecap?: { enabled: boolean; time: string } }>('notif_prefs');
  const recap = prefs?.eveningRecap;
  if (recap?.enabled && due(recap.time, 'evening_recap')) {
    const remaining = countRemainingToday(date); // voir 2.3
    if (remaining > 0) {
      const word = remaining === 1 ? 'chose' : 'choses';
      await sendToAll({
        title: 'HabitQuest',
        body: `Il te reste ${remaining} ${word} à valider aujourd'hui. Un petit pas compte. 💪`,
        url: '/?source=push', tag: 'daily-reminder'
      });
    }
    markSentToday('evening_recap', date); // marqué même si rien envoyé → pas de re-check en boucle
  }
}
```

### 2.3 — Helpers de « déjà fait » / « reste à faire »
Implémente (ou réutilise si équivalent existe) :
- `isHabitSatisfied(habit, date)` : pour une habitude **daily**, vraie si un log `done` existe pour `date`. Pour une habitude **weekly**, vraie si le **quota de la semaine est déjà atteint** (réutilise `weeklyStatus`/`weekBounds` de `streaks.ts`/`db.ts`). → on ne harcèle pas une habitude déjà satisfaite.
- `countRemainingToday(date)` : **habitudes daily** (`frequency_type='daily'`, non archivées) sans log `done` ce jour **+** **tâches ponctuelles** `one_time_tasks` en statut `'todo'`. **Exclure les habitudes weekly** (elles sont souples, pas de nag quotidien). Le récap doit rester non-punitif.

> Tu peux garder `buildDailyReminder()` dans `reminder.ts` mais fais-le calculer le compte via `countRemainingToday`, ou déplace la logique dans `scheduler.ts` et retire l'ancienne. Une seule source de vérité pour le compte.

---

## Tâche 3 — Branchement du cron (résout le TODO du prompt 1)

Dans `src/hooks.server.ts`, **remplace** l'unique cron quotidien (`${m} ${h} * * *` sur `PUSH_TIME`) par un **tick chaque minute**. Comme le tick lit `getTimezone()` en direct, **aucune reprogrammation n'est nécessaire quand le fuseau change** → supprime le `TODO(prompt-2)` laissé dans le prompt 1.
```ts
if (!started && !env.DISABLE_CRON) {
  started = true;
  cron.schedule('* * * * *', () => {
    runScheduledNotifications().catch((e) => console.error('[scheduler]', e));
  });
  console.log('[cron] Moteur de notifications actif (tick/minute)');
}
```
**Cron externe (cas `DISABLE_CRON=1`) :** ajoute `POST /api/cron/tick` protégé par `CRON_SECRET` (même schéma d'en-tête `x-cron-secret` que `/api/cron/daily`) qui appelle `runScheduledNotifications()`. L'utilisateur externe l'appellera chaque minute. Laisse `/api/cron/daily` tel quel (déclencheur manuel d'un récap immédiat), ou fais-le appeler `runScheduledNotifications()` — au choix, cohérent.

---

## Tâche 4 — Boutons d'action Android (tuyauterie service worker)

Objectif : permettre à une notification de porter des **boutons** qui, cliqués, **appellent un endpoint** (fetch same-origin depuis le SW → le cookie de session part automatiquement) puis focalisent l'app. Les prompts 5 (« Je suis debout ☀️ ») et 6 (« Pause ») s'y brancheront.

### 4.1 — Étendre le type de payload (serveur, `src/lib/server/push.ts`)
```ts
export interface PushAction { action: string; title: string; }
export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  actions?: PushAction[];
  /** Map action → endpoint POST à appeler quand le bouton est cliqué. */
  actionEndpoints?: Record<string, string>;
  /** true = notification persistante (utile plus tard pour le minuteur). */
  requireInteraction?: boolean;
  /** true = pas de son/vibration (rappels discrets). */
  silent?: boolean;
}
```

### 4.2 — Service worker (`src/service-worker.ts`)
- Mets à jour l'interface `PushPayload` locale du SW pour refléter les nouveaux champs.
- Dans le handler `push`, passe à `showNotification` : `actions`, `requireInteraction`, `silent`, et stocke dans `data` : `{ url, actionEndpoints }`. (Si TS râle sur `actions`/`requireInteraction` dans `NotificationOptions`, caste l'objet d'options.)
- Réécris `notificationclick` pour **dispatcher les actions** :
  ```ts
  self.addEventListener('notificationclick', (event) => {
    const notif = event.notification;
    notif.close();
    const data = (notif.data ?? {}) as { url?: string; actionEndpoints?: Record<string, string> };
    const endpoint = event.action && data.actionEndpoints?.[event.action];
    event.waitUntil((async () => {
      if (endpoint) {
        try { await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' } }); } catch {}
      }
      const target = data.url ?? '/';
      const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of cs) { if ('focus' in c) { c.navigate(target).catch(() => {}); return c.focus(); } }
      return self.clients.openWindow(target);
    })());
  });
  ```
> Les deux rappels de ce prompt n'ont pas besoin de boutons ; ne leur en ajoute pas. Cette tâche pose seulement le **mécanisme** réutilisable.

---

## Tâche 5 — Interface de réglage

### 5.1 — Récapitulatif du soir (`/reglages`)
- Endpoint `POST /api/settings/notifications` → body `{ eveningRecap: { enabled: boolean; time: string } }` → valide `time` au format `HH:MM` (sinon `fail('VALIDATION', …, 400)`), fusionne dans `notif_prefs`, `ok({ notif_prefs })`.
- Dans la section notifications de `reglages/+page.svelte` : un **interrupteur « Récapitulatif du soir »** + un **champ d'heure** (`type="time"`), chargés via `+page.server.ts` (`notif_prefs: getSetting('notif_prefs')`), enregistrés via l'endpoint + toast. Aide : *« Un rappel le soir, seulement s'il te reste des choses à faire. »*

### 5.2 — Heure de rappel par habitude (`HabitForm`)
- Ajoute un champ **facultatif « Heure de rappel »** (`type="time"`, vide = aucun rappel) dans `src/lib/components/habits/HabitForm.svelte`.
- Fais accepter `reminder_time` (string `HH:MM` | null) par : `validateNewHabit`/le validateur de patch dans `schemas.ts`, `createHabit`/`updateHabit` dans `db.ts`, et les types `NewHabit`/`HabitPatch` dans `types.ts`. Valide le format `HH:MM` (ou null).
- Facultatif (bonus) : petite cloche 🔔 + heure sur `HabitRow.svelte` quand un rappel est défini.

---

## Vérification (avant commit)

1. `npm run check` → **0 erreur** + `npm run build` (injectManifest) OK.
2. **Tick :** au démarrage, log « Moteur de notifications actif (tick/minute) ». Règle une habitude avec `reminder_time` = l'heure locale actuelle +1 min, laisse-la non validée → tu reçois le rappel. Valide-la → à la minute suivante, pas de rappel.
3. **Récap :** règle l'heure du récap sur maintenant +1 min ; avec des choses à faire → notif « Il te reste X… » ; tout validé → **aucune** notif.
4. **Fuseau :** change le fuseau dans `/reglages` → sans redémarrage, le tick utilise la nouvelle heure locale (vérifie qu'un rappel calé sur la nouvelle heure part bien).
5. **Anti-doublon :** un rappel donné ne part **qu'une fois** par jour même si le tick tourne chaque minute.
6. **Action SW :** avec `/api/push/test`, envoie un payload de test incluant `actions` + `actionEndpoints` bidon et vérifie que le bouton apparaît (Android) et que le clic focalise l'app sans erreur.

## Definition of Done

- [ ] Migration v3 : `habits.reminder_time`. Réglage `notif_prefs` par défaut.
- [ ] `scheduler.ts` : `runScheduledNotifications()` (rappels par habitude + récap conditionnel), anti-doublon `notif_sent`, fenêtre de rattrapage.
- [ ] `isHabitSatisfied` (daily & weekly) + `countRemainingToday` (daily + tâches, weekly exclues).
- [ ] Cron minute dans `hooks.server.ts` ; TODO du prompt 1 supprimé ; `POST /api/cron/tick` (CRON_SECRET).
- [ ] `PushPayload` étendu (actions/actionEndpoints/requireInteraction/silent) + SW qui dispatch les actions vers un endpoint puis focalise.
- [ ] `POST /api/settings/notifications` + UI récap dans `/reglages` + champ « Heure de rappel » dans `HabitForm` (+ API/validation/types).
- [ ] `npm run check` 0 + `npm run build` OK.

## Commit & doc

- `CLAUDE.md` : ligne d'avancement (ex. « Étape 13 — Moteur de notifications programmables (tick/minute, rappels par habitude + récap du soir conditionnel, tuyauterie boutons d'action) »), documente `scheduler.ts`, `notif_prefs`, `habits.reminder_time`, et la convention `actions`/`actionEndpoints` pour les prompts suivants.
- Commit suggéré :
  `Étape 13 — Moteur de notifications programmables (tick/minute) + rappels habitude + récap du soir`
