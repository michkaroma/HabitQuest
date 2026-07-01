# Prompt 1 (révisé) — Socle dates & fuseau horaire + bug du vide + prestige

> **À coller dans Claude Code, exécuté sur le serveur.** Mode *auto-accept edits* (Shift+Tab).
> **Remplace** la version précédemment commitée dans `prompts/prompt-01-socle_dates_fuseau.md` (celle-ci tient compte du travail déjà fait à l'« Étape 11 »).

## Contexte

**HabitQuest** : PWA SvelteKit 2 / Svelte 5 (runes) / TS strict / SQLite (`better-sqlite3`), mono-utilisateur, auto-hébergée, **UI en français**. **Lis `CLAUDE.md` en premier**, puis explore : `src/lib/server/db.ts`, `src/lib/server/quests.ts`, `src/lib/server/achievements.ts`, `src/lib/server/streaks.ts`, `src/lib/config/progression.ts`, `src/lib/config/shop.ts`, `src/hooks.server.ts`, `src/routes/reglages/`.

**Déjà fait (Étape 11, migration v2 `tasks_weekly_goals_player_name`) — NE PAS refaire :** tâches ponctuelles (`one_time_tasks`), objectifs hebdomadaires (`habits.frequency_type`/`weekly_quota` + `weekly_goal_awards`), et L'Armurerie (renommage `player_name`, équip/déséquip). Le helper `weekBounds` est déjà centralisé dans `db.ts` et importé par `quests.ts`, `achievements.ts` et `streaks.ts`.

Ce prompt est le **1ᵉʳ d'une série** encore à faire. Il pose les fondations de dates fiables (indispensables aux prompts suivants : notifications, sommeil) et corrige 2 dettes techniques. **Ne t'occupe QUE de ce qui est décrit ici.** Ne commence pas les rituels / le minuteur / le sommeil / les notifications avancées.

## Contraintes non négociables

- **Node 22** (`node:22-bookworm-slim`). **Aucune nouvelle dépendance** : `Intl.DateTimeFormat` natif pour le fuseau (pas de `luxon`/`date-fns-tz`).
- Équilibrage dans `src/lib/config/` (`progression.ts` = hub). Économie de pièces dans `shop.ts` (`COIN_ECONOMY`).
- **Ton non-punitif** partout ; **strings UI en français**.
- Migrations idempotentes (via `addColumnIfMissing`) si besoin. **Ici aucune migration** : le fuseau se stocke dans la table `settings` existante.
- Réponses API via `ok`/`fail` (`src/lib/server/respond.ts`).
- Fin : `npm run check` à **0 erreur**, puis commit + mise à jour de `CLAUDE.md`.

---

## Tâche 1 — Fuseau horaire (socle) + assainissement des dates

**Problème :** `localDate()` (serveur) calcule « aujourd'hui » avec l'heure **locale de la machine**, sans fuseau partagé. Pour programmer les notifications (prompt 2) et le module sommeil (prompt 5) à l'heure locale réelle de l'utilisateur, le serveur doit connaître le fuseau configuré.

### 1.1 — Réglage `timezone`
- Stocke `timezone` (chaîne IANA, ex. `"Europe/Paris"`) dans la table `settings` (pas de migration).
- Dans `initDb()` (`db.ts`), à côté de la ligne `reminder_hour` :
  ```ts
  if (getSetting('timezone') === null) setSetting('timezone', 'Europe/Paris');
  ```

### 1.2 — Helpers de fuseau dans `db.ts`
```ts
let _tz: string | null = null;

export function getTimezone(): string {
  if (_tz) return _tz;
  _tz = getSetting<string>('timezone') ?? 'Europe/Paris';
  return _tz;
}

/** Valide (Intl throw si invalide) puis persiste + invalide le cache. */
export function setTimezone(tz: string): void {
  new Intl.DateTimeFormat('en-CA', { timeZone: tz }); // RangeError si fuseau inconnu
  setSetting('timezone', tz);
  _tz = tz;
}
```

### 1.3 — `localDate` / `localDateTime` conscients du fuseau
Réécris **uniquement les fonctions « maintenant »** pour extraire la date/heure dans le fuseau via `formatToParts` :
```ts
export function localDate(d: Date = new Date(), tz: string = getTimezone()): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(d).map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}`;
}

export function localDateTime(d: Date = new Date(), tz: string = getTimezone()): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(d).map((x) => [x.type, x.value])
  );
  const hh = p.hour === '24' ? '00' : p.hour; // normalise minuit
  return `${p.year}-${p.month}-${p.day} ${hh}:${p.minute}:${p.second}`;
}
```

### 1.4 — ⚠️ L'arithmétique de dates ne doit PLUS passer par `localDate`
**Principe :** `localDate(d)` ne doit être appelée QU'AVEC un instant réel (`now`). Tout endroit qui construit une `Date` **juste pour du calcul calendaire** doit utiliser une arithmétique **UTC pure sur chaîne**. Ajoute dans `db.ts` :
```ts
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}
```
Puis **corrige ces 4 endroits** (ils construisent aujourd'hui une `Date` locale repassée à `localDate`) :

1. **`db.ts` → `previousDate`** : `return addDays(date, -1);`
2. **`db.ts` → `nextDate`** : `return addDays(date, 1);`
3. **`db.ts` → `weekBounds`** : réécris en UTC pur, **sans** `localDate` :
   ```ts
   export function weekBounds(date: string = localDate()): { start: string; end: string } {
     const [y, m, d] = date.split('-').map(Number);
     const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Lundi = 0
     const start = addDays(date, -dow);
     return { start, end: addDays(start, 6) };
   }
   ```
   (Le défaut `= localDate()` reste correct : c'est bien « maintenant ».)
4. **`streaks.ts` → `shiftDays`** : supprime cette fonction locale et remplace ses usages (`weeklyStatus`, `weeklyStreakBefore`) par `addDays` importé de `./db`.

Vérifie que `isoWeek()` (déjà en UTC sur la chaîne, correct) et `weekBounds()` restent d'accord sur le **lundi** comme début de semaine.

### 1.5 — Le cron du rappel utilise le fuseau
Dans `src/hooks.server.ts`, passe le fuseau à `node-cron` pour que le rappel `PUSH_TIME` (défaut 20:00) parte à l'heure **locale de l'utilisateur** :
```ts
cron.schedule(`${Number(m)} ${Number(h)} * * *`, async () => {
  await sendToAll(buildDailyReminder());
}, { timezone: getTimezone() });
// TODO(prompt-2): reprogrammer le cron à chaud quand le fuseau change
```
> Le reschedule dynamique est explicitement repoussé au prompt 2 (refonte du moteur de notifications). Ici, lire le fuseau au démarrage suffit.

### 1.6 — Endpoint + UI de réglage
- **Endpoint :** `POST /api/settings/timezone` → body `{ timezone: string }` → `setTimezone()` en try/catch → `fail('VALIDATION', 'Fuseau horaire invalide.', 400)` si Intl lève, sinon `ok({ timezone })`.
- **UI :** dans `src/routes/reglages/+page.svelte`, section **« Fuseau horaire »** : afficher le fuseau courant, un champ pré-rempli côté client avec `Intl.DateTimeFormat().resolvedOptions().timeZone`, un bouton **« Enregistrer »** (poste l'endpoint → toast `celebration.toast('Fuseau horaire mis à jour.', 'success')`), et l'aide : *« Utilisé pour programmer tes rappels à la bonne heure. »*
- **Server load :** dans `reglages/+page.server.ts`, ajoute `timezone: getSetting('timezone')` au retour.

> Le client garde `todayStr()` en heure navigateur (inchangé) ; sur l'appareil de l'utilisateur, ça coïncide avec le fuseau configuré.

---

## Tâche 2 — Corriger le « bug du vide » (quête « sans aucune rechute »)

**Problème :** dans `server/quests.ts`, `computeAggregates` fait `weeklyNoRelapse: relapses === 0` et `progressFor` renvoie `q.key === 'w_no_relapse' ? (weeklyNoRelapse ? 1 : 0)`. Sur base fraîche / semaine sans activité, `relapses === 0` est vrai → la quête se **pré-valide** (1/1) sans qu'aucune abstinence n'ait été vécue.

**Correctif — garde d'abstinence réellement suivie.** Ajoute aux agrégats :
```
hasTrackedAbstinence =
     (nb d'addiction_targets NON archivés > 0)
  OR (nb d'habits NON archivés de type 'break' > 0)
```
Puis :
```ts
weeklyNoRelapse: relapses === 0 && hasTrackedAbstinence
```

**Ne pas pénaliser l'abstinence passive :** un boss `abstinence` reste clean sans produire de log ni de check-in — **ne conditionne PAS** la validation à une activité positive de la semaine. La simple existence d'un boss/habitude d'abstinence actif suffit. Sur base vide → la quête ne se valide plus (bug corrigé).

---

## Tâche 3 — Brancher le prestige à l'interface

**Constat :** `db.ts` → `prestige()` (vers la ligne ~232) existe : elle garde `level >= PROGRESSION.PRESTIGE_LEVEL`, remet `total_xp = 0`, `prestige = prestige+1`, et journalise `logLevelEvent('prestige', level, 1, newPrestige)`. **Mais** elle **ne crédite pas** les pièces de prestige, et **aucune route ni bouton** ne l'appelle.

### 3.1 — Compléter la fonction
Dans la transaction de `prestige()`, ajoute le crédit des pièces **avant** le `return` :
```ts
addCoins(COIN_ECONOMY.PRESTIGE_BONUS); // = 500
```
(Importe `COIN_ECONOMY` depuis `../config/shop` si pas déjà fait.) Les cosmétiques, pièces, habitudes, tâches et boss ne sont pas touchés ; seul l'XP repart à zéro (niveau → 1).

### 3.2 — Endpoint
`POST /api/prestige` :
- Guard : si `levelFromXp(getUserState().total_xp).level < PROGRESSION.PRESTIGE_LEVEL` → `fail('NOT_ELIGIBLE', 'Prestige disponible au niveau 50.', 409)`.
- Sinon `const p = prestige();`, puis `const unlockedAchievements = runAchievementChecks();` (débloque `prestige_1`, `prestige_3`), et `ok({ prestige: p, coinsAwarded: COIN_ECONOMY.PRESTIGE_BONUS, unlockedAchievements })`.

### 3.3 — UI (dans `/reglages`)
- Récupère le niveau (via le store `gameState` déjà hydraté par le layout, ou via `+page.server.ts`).
- Section **« Prestige »** :
  - **Visible seulement si `canPrestige`** (niveau ≥ 50) ; sinon ligne grisée : *« Prestige débloqué au niveau 50. »*
  - Bouton **« Entrer en prestige ✨ »** ouvrant le `ConfirmDialog` **existant** (`src/lib/components/feedback/ConfirmDialog.svelte`) :
    > **Titre :** « Entrer en prestige ? »
    > **Corps :** « Ton niveau repart à 1, mais tu gardes tes pièces, tes cosmétiques et toute ta progression. Tu gagnes une étoile de prestige, une auréole, et **500 pièces**. Un nouveau cycle commence. »
    > **Confirmer :** « Renaître ✨ » — **Annuler :** « Pas encore »
  - Sur confirmation : appelle l'endpoint, `invalidateAll()` (recharge → l'overlay/toast de célébration existant se déclenche via l'event `prestige` non vu), et `celebration.toast('Prestige atteint ! ✨ +500 pièces', 'gold')`.

---

## Vérification (avant commit)

1. `npm run check` → **0 erreur**.
2. **Fuseau :** dans `/reglages`, change le fuseau (ex. `America/New_York`) → toast OK ; un fuseau bidon (`Foo/Bar`) renvoie l'erreur sans planter.
3. **Dates :** une validation d'habitude fait progresser les quêtes ; les bornes lundi→dimanche restent cohérentes autour d'un dimanche/lundi ; la série hebdo (`weeklyStatus`) et les séries quotidiennes se calculent toujours correctement.
4. **Bug du vide :** base **sans boss ni habitude `break`** → `w_no_relapse` affiche **0/1**. Crée un boss ou une habitude `break` → peut atteindre 1/1 sans rechute.
5. **Prestige :** niveau < 50 → section masquée/grisée + endpoint `NOT_ELIGIBLE`. (Test nominal possible en injectant temporairement de l'XP : `UPDATE user_state SET total_xp = ...` → bouton + confirmation → niveau→1, +500 pièces, succès `prestige_1`.)

## Definition of Done

- [ ] Réglage `timezone` (défaut `Europe/Paris`) + `getTimezone`/`setTimezone` + `localDate`/`localDateTime` conscients du fuseau.
- [ ] `addDays` UTC pur ; `previousDate`, `nextDate`, `weekBounds` (db.ts) et `shiftDays`→`addDays` (streaks.ts) découplés de `localDate`.
- [ ] Cron programmé avec `{ timezone }` + TODO prompt-2.
- [ ] `POST /api/settings/timezone` + section « Fuseau horaire » dans `/reglages`.
- [ ] `w_no_relapse` gardée par `hasTrackedAbstinence` (fin du bug du vide).
- [ ] `prestige()` crédite 500 pièces + `POST /api/prestige` + bouton/ConfirmDialog dans `/reglages` + célébration.
- [ ] `npm run check` à 0.

## Commit & doc

- Mets à jour `CLAUDE.md` (nouvelle ligne d'avancement, ex. « Étape 12 — Fuseau horaire + dates fiables ; fix bug du vide, prestige branché »), documente le réglage `timezone`, les helpers de dates (`addDays`, `localDate`/`localDateTime` sensibles au fuseau) et la règle « `localDate` uniquement pour `now` ».
- Commit, message suggéré :
  `Étape 12 — Fuseau horaire + dates UTC-pures ; fix bug du vide + prestige branché`
