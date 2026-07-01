# Prompt 1 — Socle dates & fuseau horaire + 3 réparations

> **À coller dans Claude Code, exécuté sur le serveur** (accès à la base SQLite live et aux fichiers Docker non suivis).
> Mode permissions recommandé : *auto-accept edits* (Shift+Tab), pas `--dangerously-skip-permissions`.

## Contexte

Tu travailles sur **HabitQuest**, une PWA SvelteKit 2 / Svelte 5 (runes) / TypeScript strict / SQLite (`better-sqlite3`), mono-utilisateur, auto-hébergée, **interface en français**. **Lis `CLAUDE.md` en premier**, puis explore le dépôt avant de coder — surtout `src/lib/server/db.ts`, `src/lib/server/quests.ts`, `src/lib/server/achievements.ts`, `src/lib/config/progression.ts`, `src/lib/config/shop.ts`, `src/hooks.server.ts`, `src/routes/reglages/`.

Ce prompt est le **1ᵉʳ d'une série** de 9. Il pose les fondations (dates fiables + fuseau horaire) dont dépendront les notifications et le module sommeil, et corrige 3 dettes techniques. **Ne t'occupe QUE de ce qui est décrit ici** ; ne commence pas les autres fonctionnalités (rituels, minuteur, sommeil, tâches uniques, etc.).

## Contraintes non négociables

- **Node 22** (`node:22-bookworm-slim`). Node 26 casse `better-sqlite3`. N'ajoute **aucune dépendance** : utilise `Intl.DateTimeFormat` natif (Node 22 a l'ICU complet) pour la gestion du fuseau. Pas de `luxon`/`date-fns-tz`.
- **Tout l'équilibrage reste dans `src/lib/config/`** (`progression.ts` = hub).
- **Ton non-punitif** partout (§7 du brief) : aucune formulation culpabilisante dans les strings UI.
- **Strings UI toujours en français.**
- Migrations SQLite **idempotentes** si tu en ajoutes. Ici, aucune migration ne devrait être nécessaire (le fuseau se stocke dans la table `settings` déjà existante).
- Réponses API via les helpers existants `ok`/`fail` (`src/lib/server/respond.ts`).
- À la fin : `npm run check` doit passer à **0 erreur**, puis commit + mise à jour de `CLAUDE.md`.

---

## Tâche 1 — Fuseau horaire (socle)

**Problème :** `localDate()` (serveur, `db.ts`) et `todayStr()` (client, `clock.ts`) calculent « aujourd'hui » avec l'heure **locale de la machine**, sans fuseau partagé. Pour programmer des notifications à l'heure locale de l'utilisateur et faire fonctionner le futur module sommeil, le serveur doit connaître le fuseau configuré.

### 1.1 — Réglage `timezone`

- Stocke un réglage `timezone` (chaîne IANA, ex. `"Europe/Paris"`) dans la table `settings` (clé/valeur, déjà existante — pas de migration).
- Dans `initDb()` (`db.ts`), ajoute à côté de la ligne `reminder_hour` :
  ```ts
  if (getSetting('timezone') === null) setSetting('timezone', 'Europe/Paris');
  ```

### 1.2 — Helpers de fuseau dans `db.ts`

Ajoute un cache module + accesseurs :
```ts
let _tz: string | null = null;

export function getTimezone(): string {
  if (_tz) return _tz;
  _tz = getSetting<string>('timezone') ?? 'Europe/Paris';
  return _tz;
}

/** Valide (Intl throw si invalide) puis persiste + invalide le cache. */
export function setTimezone(tz: string): void {
  // Validation : lève une RangeError si le fuseau est inconnu.
  new Intl.DateTimeFormat('en-CA', { timeZone: tz });
  setSetting('timezone', tz);
  _tz = tz;
}
```

### 1.3 — `localDate` / `localDateTime` deviennent conscients du fuseau

Réécris **uniquement les fonctions « maintenant »** pour extraire la date/heure dans le fuseau configuré via `Intl.DateTimeFormat(...).formatToParts()` :
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
  // en-CA + hour12:false → 24h. Attention: minuit peut sortir en "24" selon l'env → normalise.
  const hh = p.hour === '24' ? '00' : p.hour;
  return `${p.year}-${p.month}-${p.day} ${hh}:${p.minute}:${p.second}`;
}
```

### 1.4 — L'arithmétique de dates ne doit PLUS passer par `localDate`

**Important pour éviter un couplage bugué :** `previousDate`/`nextDate` construisaient un `Date` local puis rappelaient `localDate`. Maintenant que `localDate` dépend du fuseau, ce serait faux. Remplace-les par de l'arithmétique **pure sur chaîne, en UTC** (indépendante du fuseau, comme le fait déjà `daysBetween`) :
```ts
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}
export const previousDate = (date: string): string => addDays(date, -1);
export const nextDate = (date: string): string => addDays(date, 1);
```
Vérifie que tous les appelants existants de `previousDate`/`nextDate` continuent de fonctionner (ils reçoivent/renvoient des chaînes `YYYY-MM-DD`, comportement inchangé).

### 1.5 — Le cron du rappel quotidien utilise le fuseau

Dans `src/hooks.server.ts`, passe le fuseau à `node-cron` pour que le rappel `PUSH_TIME` (défaut 20:00) parte à l'heure **locale de l'utilisateur** et non celle du serveur :
```ts
cron.schedule(`${Number(m)} ${Number(h)} * * *`, async () => {
  await sendToAll(buildDailyReminder());
}, { timezone: getTimezone() });
```
> Le rescheduling dynamique du cron quand l'utilisateur change de fuseau sera géré au **prompt 2** (refonte du moteur de notifications). Ici, il suffit que le fuseau soit lu au démarrage. Ajoute un commentaire `// TODO(prompt-2): reprogrammer le cron à chaud si le fuseau change`.

### 1.6 — Endpoint + UI de réglage

- **Endpoint :** `POST /api/settings/timezone` → body `{ timezone: string }` → `setTimezone()` dans un try/catch (renvoie `fail('VALIDATION', 'Fuseau horaire invalide.', 400)` si `Intl` lève) → `ok({ timezone })`.
- **UI :** dans `src/routes/reglages/+page.svelte`, ajoute une section **« Fuseau horaire »** :
  - Affiche le fuseau courant (chargé via `+page.server.ts`, voir plus bas).
  - Un champ pré-rempli côté client avec le fuseau détecté du navigateur : `Intl.DateTimeFormat().resolvedOptions().timeZone`.
  - Un bouton **« Enregistrer »** qui poste l'endpoint puis affiche un toast (`celebration.toast('Fuseau horaire mis à jour.', 'success')`), et une petite phrase d'aide : *« Utilisé pour programmer tes rappels à la bonne heure. »*
- **Server load :** dans `src/routes/reglages/+page.server.ts`, ajoute `timezone: getSetting('timezone')` à l'objet retourné (en plus de `achievements`).

> Pour ce mono-utilisateur, le fuseau du navigateur = son vrai fuseau. Le client garde `todayStr()` en heure navigateur (inchangé) ; le serveur utilise le fuseau configuré. Les deux coïncident en pratique sur son propre appareil.

---

## Tâche 2 — Cohérence des semaines ISO (lundi → dimanche)

**Problème :** `db.isoWeek()` calcule en **UTC**, mais `quests.weekBounds()` (dans `server/quests.ts`) **et** le calcul de semaine dans `server/achievements.ts` utilisent de l'arithmétique `Date` **locale**. Résultat : bornes de semaine potentiellement désalignées avec la clé de période.

**Correctif — une seule source de vérité, pure et UTC.** Ajoute dans `db.ts` :
```ts
/** Lundi de la semaine ISO contenant `date` (chaîne YYYY-MM-DD). */
export function weekStartMonday(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Lundi=0
  return addDays(date, -dow);
}
/** Dimanche de la même semaine. */
export function weekEndSunday(date: string): string {
  return addDays(weekStartMonday(date), 6);
}
```
Puis :
- Dans `server/quests.ts`, **supprime** la fonction locale `weekBounds` et remplace ses usages par `{ start: weekStartMonday(date), end: weekEndSunday(date) }`.
- Dans `server/achievements.ts`, remplace le calcul local des bornes de semaine (autour du `dow`/`setDate`) par les mêmes helpers `weekStartMonday`/`weekEndSunday`.
- Vérifie que `isoWeek()` (qui reste en UTC sur la chaîne, c'est correct) et `weekStartMonday()` sont d'accord sur le **lundi** comme début de semaine.

---

## Tâche 3 — Corriger le « bug du vide » (quête « sans aucune rechute »)

**Problème :** dans `server/quests.ts`, `computeAggregates` calcule `weeklyNoRelapse: relapses === 0`, et `progressFor` fait `if (q.key === 'w_no_relapse') return a.weeklyNoRelapse ? 1 : 0;`. Sur une base fraîche ou une semaine sans aucune activité, `relapses === 0` est vrai → la quête `w_no_relapse` se **pré-valide** (1/1, réclamable) alors qu'aucune abstinence n'a été vécue.

**Correctif — garde d'abstinence réellement suivie.** La quête « termine la semaine sans aucune rechute » n'a de sens que si l'utilisateur suit au moins une chose dont il peut rechuter. Ajoute aux agrégats un booléen `hasTrackedAbstinence` :
```
hasTrackedAbstinence =
     (nombre d'addiction_targets non archivés > 0)
  OR (nombre d'habits non archivés de type 'break' > 0)
```
Puis :
```ts
weeklyNoRelapse: relapses === 0 && hasTrackedAbstinence
```

**Attention (ne pas pénaliser l'abstinence passive) :** un boss en mode `abstinence` reste clean sans produire de log ni de check-in — ne conditionne donc **pas** la validation à « une activité positive cette semaine » (ni check-in, ni journée clean loggée). La simple existence d'un boss/habitude d'abstinence actif suffit. Sur base vide (aucun boss, aucune habitude `break`) → la quête ne se valide plus. C'est exactement le bug visé.

---

## Tâche 4 — Brancher le prestige à l'interface

**Problème :** `db.ts` expose `prestige()` (vers la ligne ~208) et le compteur de prestige s'affiche, **mais aucune route ni bouton ne l'appelle** → fonctionnalité inaccessible.

### 4.1 — Vérifier/compléter la fonction serveur

Relis `prestige()` dans `db.ts`. Elle doit, dans **une transaction** :
- Ne rien faire (retourner `null`) si le niveau courant `< PROGRESSION.PRESTIGE_LEVEL` (50).
- `total_xp = 0`, `prestige = prestige + 1`.
- Créditer `COIN_ECONOMY.PRESTIGE_BONUS` (= 500) pièces (`addCoins`).
- Journaliser un événement via `logLevelEvent('prestige', ...)` pour déclencher la célébration existante.
- Retourner le nouveau numéro de prestige.
Complète ce qui manque (souvent le crédit des pièces et/ou l'event). Les cosmétiques possédés, les pièces, les habitudes et les boss **ne sont pas touchés** ; seul l'XP repart à zéro (niveau → 1).

### 4.2 — Endpoint

`POST /api/prestige` :
- Guard : si `levelFromXp(getUserState().total_xp).level < PROGRESSION.PRESTIGE_LEVEL` → `fail('NOT_ELIGIBLE', 'Prestige disponible au niveau 50.', 409)`.
- Sinon appelle `prestige()`, puis `runAchievementChecks()` (débloque `prestige_1`, `prestige_3`), et renvoie `ok({ prestige, coinsAwarded: COIN_ECONOMY.PRESTIGE_BONUS, unlockedAchievements })`.

### 4.3 — UI (dans `/reglages`)

- Charge le niveau dans `+page.server.ts` (ex. `level: levelInfoFromState(getUserState())`) OU lis-le depuis le store `gameState` déjà hydraté par le layout — au choix, le plus simple.
- Affiche une section **« Prestige »** :
  - **Visible uniquement si `canPrestige`** (niveau ≥ 50). Sinon, une ligne discrète grisée : *« Prestige débloqué au niveau 50. »*
  - Un bouton **« Entrer en prestige ✨ »** qui ouvre le `ConfirmDialog` **existant** (`src/lib/components/feedback/ConfirmDialog.svelte`) avec un texte clair et **non-punitif** :
    > **Titre :** « Entrer en prestige ? »
    > **Corps :** « Ton niveau repart à 1, mais tu gardes tes pièces, tes cosmétiques et toute ta progression d'habitudes. Tu gagnes une étoile de prestige, une auréole, et **500 pièces**. Un nouveau cycle commence. »
    > **Confirmer :** « Renaître ✨ » — **Annuler :** « Pas encore »
  - Sur confirmation : appelle l'endpoint, puis `invalidateAll()` (recharge l'état → l'overlay/toast de célébration existant se déclenche via l'event `prestige` non vu). Ajoute un `celebration.toast('Prestige atteint ! ✨ +500 pièces', 'gold')`.

---

## Vérification (avant commit)

1. `npm run check` → **0 erreur**.
2. **Fuseau :** dans `/reglages`, change le fuseau (ex. `America/New_York`), enregistre → toast OK. Vérifie qu'un fuseau bidon (`Foo/Bar`) renvoie l'erreur de validation sans planter.
3. **Semaines :** vérifie qu'une validation d'habitude fait progresser les quêtes hebdo, et que les bornes lundi→dimanche sont cohérentes autour d'un dimanche/lundi.
4. **Bug du vide :** sur une base **sans boss ni habitude `break`**, la quête `w_no_relapse` doit afficher **0/1** (non réclamable). Crée un boss ou une habitude `break` → elle peut atteindre 1/1 si aucune rechute.
5. **Prestige :** avec un niveau < 50, la section est masquée/grisée et l'endpoint renvoie `NOT_ELIGIBLE`. (Pour tester le chemin nominal, tu peux temporairement injecter de l'XP en base — `UPDATE user_state SET total_xp = ...` — vérifier le bouton + confirmation + reset niveau→1 + +500 pièces + succès `prestige_1`, puis annuler la manip de test si besoin. La mémoire indique qu'il n'y a **pas** de contrainte de préservation des données, mais reste propre.)

## Definition of Done

- [ ] Réglage `timezone` (défaut `Europe/Paris`), helpers `getTimezone`/`setTimezone`, `localDate`/`localDateTime` conscients du fuseau.
- [ ] `previousDate`/`nextDate`/`addDays` en arithmétique UTC pure ; plus de couplage à `localDate`.
- [ ] Cron du rappel programmé avec `{ timezone }` + TODO prompt-2.
- [ ] `POST /api/settings/timezone` + section « Fuseau horaire » dans `/reglages`.
- [ ] `weekStartMonday`/`weekEndSunday` uniques et utilisés par `quests.ts` **et** `achievements.ts`.
- [ ] `w_no_relapse` gardée par `hasTrackedAbstinence` (fin du bug du vide).
- [ ] `prestige()` complète + `POST /api/prestige` + bouton/ConfirmDialog dans `/reglages` + célébration.
- [ ] `npm run check` à 0.

## Commit & doc

- Mets à jour `CLAUDE.md` : ajoute une ligne d'avancement (ex. « Étape 11 — Socle dates & fuseau horaire + réparations (bug du vide, prestige, semaines ISO) ») et documente le nouveau réglage `timezone` + les helpers de dates dans la section conventions.
- Commit en fin de tâche, message suggéré :
  `Étape 11 — Fuseau horaire + dates fiables ; fix bug du vide, prestige branché, semaines ISO unifiées`
