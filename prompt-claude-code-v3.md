# Prompt Claude Code — Tâches ponctuelles, mode personnalisation & objectifs hebdomadaires

## Contexte

HabitQuest est une web-app SvelteKit + TypeScript + TailwindCSS + SQLite (better-sqlite3) + Web Push, auto-hébergée. C'est un tracker d'habitudes gamifié (XP/niveaux, avatar, streaks, quêtes quotidiennes/hebdomadaires, multiplicateurs de combo, boutique en monnaie virtuelle, module « addiction = boss »). Toute l'app est en français et suit une philosophie de design **non-punitive** (rechutes loguées neutrement, mécaniques de streak freeze plutôt que punition).

On ajoute **trois fonctionnalités** décrites plus bas. Tu peux renommer librement les concepts si tu trouves mieux — ce qui compte c'est le comportement.

---

## Consignes générales (à lire AVANT de coder)

1. **Explore d'abord le code existant.** Ne pars pas d'hypothèses. Utilise des `grep` ciblés par terme + extension dans `src/` (ex. `grep -rn "habit" src/ --include="*.ts"`, idem pour `quest`, `streak`, `avatar`, `xp`, `equip`, `cosmetic`, `shop`) pour repérer : le modèle de données des habitudes/quêtes, la couche SQLite + migrations, la logique de calcul XP, la gestion des bornes de jour/semaine, et le composant avatar. Lis ensuite les fichiers identifiés. Calque-toi sur les conventions déjà en place.
2. **Balance centralisée.** Tout paramètre chiffré (XP gagné, bonus, quotas par défaut) doit vivre dans `progression.ts`, pas en dur dans la logique.
3. **Français partout** : libellés UI, noms de variables côté domaine si c'est la convention actuelle, messages.
4. **Design non-punitif.** Aucune nouvelle mécanique ne doit punir un échec : on ne fait que ne pas récompenser. Pas de perte d'XP, pas de message culpabilisant.
5. **Bornes temporelles.** Le jour reset à minuit heure locale (pas d'offset custom). Pour la notion de « semaine », **réutilise la logique existante** dans le code si elle existe ; sinon définis une semaine ISO (lundi → dimanche) et centralise le helper. Attention : ni serveur ni client n'imposent un fuseau commun, donc ne crée pas de nouveau point de divergence de fuseau — reste sur la même base que le reste de l'app.
6. **Garde-fou « bug du vide ».** Toute condition formulée négativement (« 0 X cette semaine ») est vraie sur une base vide. Si tu en introduis, ajoute une clause exigeant au moins une donnée/un check-in préalable avant validation. (Les features ci-dessous sont surtout formulées positivement, mais reste vigilant.)
7. **Migrations SQLite.** Pas besoin de préserver les données existantes (tu peux faire une migration franche), mais écris une migration propre et idempotente pour que l'instance déployée ne casse pas au `docker compose up -d --build`.
8. **Style visuel.** Le redesign vise un rendu rétro 8-bit chevalier : palette **Sweetie-16**, police **Press Start 2P**. Toute nouvelle UI doit s'aligner sur ce style (ou sur le style actuel si le redesign n'est pas encore en place — vérifie).

---

## Fonctionnalité 1 — Tâches ponctuelles (à faire une seule fois)

**Idée :** pouvoir ajouter une action à réaliser **une seule fois**, sans récurrence — distincte des habitudes récurrentes. Une fois cochée, elle est terminée et quitte la liste active.

Nom suggéré : **« tâches ponctuelles »** (ou « quêtes ponctuelles » si tu veux rester dans le thème jeu).

**Modèle de données (à aligner sur l'existant) :**
- titre (obligatoire)
- description / note (optionnelle)
- échéance / date cible (optionnelle, purement indicative — son dépassement ne punit rien)
- récompense XP (valeur depuis `progression.ts`)
- statut (`à faire` / `faite`)
- horodatages création + complétion

**Comportement :**
- Création, édition et suppression depuis l'UI.
- Au check « fait » : attribuer l'XP une seule fois, marquer `faite`, sortir la tâche de la liste active (la basculer dans un historique « terminées » plutôt que la détruire).
- **Aucune logique de streak** (c'est ponctuel).
- Optionnel mais bienvenu : 2-3 paliers de difficulté qui mappent vers des montants d'XP distincts dans `progression.ts`.

**UI :**
- Une section clairement séparée des habitudes récurrentes pour éviter toute confusion.
- Petit feedback de gain d'XP cohérent avec celui des autres actions.

**Critères d'acceptation :**
- Je peux ajouter une tâche ponctuelle, la cocher, et elle disparaît de la liste active en créditant l'XP exactement une fois.
- Elle n'apparaît jamais comme « à refaire » le lendemain.
- Aucune tâche ponctuelle ne déclenche ni streak ni pénalité.

---

## Fonctionnalité 2 — Mode personnalisation du personnage

**Idée :** en **cliquant sur l'avatar**, accéder à un écran/modale de personnalisation du personnage.

Nom suggéré : **« L'Armurerie »** (cohérent avec le thème chevalier) ou « Vestiaire » / « Personnalisation » — au choix.

**⚠️ Dépendance importante :** cette feature s'imbrique avec la refonte avatar en cours (passage à un système de sprites SVG en calques, ancrés sur un viewBox 64×64 partagé, avec slots d'équipement **par catégorie** remplaçant le slot unique). **Avant de coder, détermine l'état réel du système avatar/cosmétiques/boutique** : sprites SVG en place ou encore emoji + badges de coin ? slots par catégorie déjà présents ou slot unique ? Construis l'UI de personnalisation **par-dessus le modèle de slots/inventaire réel**, et garde-la compatible avec l'arrivée des sprites SVG (le rendu suit ce que fait déjà le composant avatar ; la donnée, elle, s'appuie sur le modèle de slots par catégorie).

**Contenu de l'écran :**
- **Aperçu** du personnage avec ses cosmétiques équipés (rendu via la méthode actuelle de l'avatar).
- **Renommer** le personnage (champ texte, persisté).
- **Slots d'équipement par catégorie** (ex. tête, corps, arme, accessoire — selon les catégories réelles) : pour chaque catégorie, lister les objets **possédés** (achetés en boutique), permettre **équiper / déséquiper**.
- Les objets non possédés sont soit masqués, soit affichés verrouillés avec leur prix (au choix, mais cohérent).

**Comportement :**
- L'avatar devient cliquable depuis l'écran où il est affiché (repère-le).
- Équiper/déséquiper persiste immédiatement et se reflète partout où l'avatar apparaît.
- Pas d'XP ni de coût pour équiper un objet déjà possédé.

**Critères d'acceptation :**
- Cliquer sur l'avatar ouvre le mode personnalisation.
- Je peux renommer mon personnage et équiper/déséquiper des cosmétiques possédés par catégorie ; les changements persistent et s'affichent partout.
- L'écran ne casse pas selon que le système de sprites SVG est en place ou non.

---

## Fonctionnalité 3 — Objectifs à fréquence hebdomadaire (X fois / semaine)

**Idée :** des habitudes à réaliser **un certain nombre de fois par semaine** plutôt que tous les jours (ex. « ≥ 2 fois / semaine », sans imposer quels jours).

Nom suggéré : **« objectifs hebdomadaires »** ou « habitudes à quota hebdo ».

**Modèle de données (extension du modèle d'habitudes existant) :**
- Identifie comment la récurrence est modélisée aujourd'hui (quotidien / hebdo) et **ajoute un type de fréquence** « X fois par semaine » avec un `quota cible` (entier ≥ 1).
- Suivi des check-ins **dans la semaine courante** (compteur réinitialisé à chaque nouvelle semaine).

**Comportement :**
- Progression affichée **X / N** (ex. 1/2) pour la semaine en cours.
- Chaque check-in dans la fenêtre de la semaine incrémente le compteur ; plusieurs check-ins le même jour : à toi de décider (par défaut, max 1 par jour pour ce type, sauf si l'existant fait autrement — reste cohérent).
- Atteindre le quota = objectif **rempli** pour la semaine.
- **Streak hebdomadaire** (semaines consécutives où le quota est atteint), aligné sur les mécaniques de streak existantes. Ne pas atteindre le quota ne punit pas : le streak hebdo se réinitialise en douceur, et si un mécanisme de streak freeze existe, applique la même logique.
- XP : petit gain par check-in + **bonus à l'atteinte du quota** ; valeurs dans `progression.ts`.

**Bornes de semaine :** réutilise le helper de semaine existant (cf. consigne #5). Vérifie le passage d'une semaine à l'autre (remise à zéro du compteur) et garde-toi des off-by-one sur la borne.

**Critères d'acceptation :**
- Je peux créer une habitude « ≥ 2 fois / semaine » et la valider n'importe quels jours ; la progression X/N se met à jour.
- À 2/2, l'objectif est marqué rempli et le bonus d'XP est crédité une seule fois pour la semaine.
- Au changement de semaine, le compteur repart à 0 ; un quota non atteint ne génère aucune pénalité.

---

## Travail transverse

- **Migrations** : un script de migration propre couvrant les nouvelles tables/colonnes des 3 features.
- **XP & progression** : tous les nouveaux montants/bonus/quotas par défaut dans `progression.ts`, commentés.
- **Cohérence UI** : réutilise les composants existants (cartes d'habitude, feedback d'XP, boutons) ; respecte le style rétro 8-bit / Sweetie-16 / Press Start 2P.
- **Pas de régression** sur les habitudes quotidiennes, les quêtes existantes, le streak global et la boutique.

## Vérification finale

Avant de conclure :
1. `npm run build` (ou la commande de build du projet) passe sans erreur TypeScript.
2. Migration testée sur une base neuve ET appliquée proprement.
3. Récapitule les fichiers modifiés/créés et les paramètres ajoutés dans `progression.ts`.
4. Liste les éventuels points laissés ouverts (notamment côté système avatar si le redesign SVG n'est pas encore complet).

> Rappel déploiement (pour info, exécuté côté serveur) : `git fetch` → `git checkout -B main origin/main` → `docker compose up -d --build` → vérifier les logs.
