# HabitQuest 🎮🔥

Application web **personnelle, mono-utilisateur**, pour bâtir de bonnes habitudes et
vaincre des addictions sous forme de jeu vidéo : **XP, niveaux, séries (flammes),
quêtes, succès, boutique, avatar évolutif** et un module **« boss »** pour les
addictions (compteur clean, argent économisé, frise santé, SOS respiration, journal
de déclencheurs). **PWA installable**, fonctionnelle hors-ligne, avec notifications.

> Usage strictement personnel, jamais commercialisé. Interface **en français**.
> Auto-hébergée derrière un reverse proxy HTTPS.

## Stack

SvelteKit 2 · Svelte 5 (runes) · TypeScript strict · SQLite (`better-sqlite3`) ·
TailwindCSS v3 · PWA (`@vite-pwa/sveltekit`, service worker custom) ·
Web Push (`web-push` / VAPID) · `@sveltejs/adapter-node`.

## Prérequis

- Node.js ≥ 20
- (Prod) un nom de domaine + **Caddy** ou **nginx** pour le HTTPS

## 1. Installation

```bash
git clone <repo> habitquest
cd habitquest
npm install
cp .env.example .env          # Windows PowerShell : Copy-Item .env.example .env
```

## 2. Configurer l'environnement (`.env`)

| Variable | Rôle |
|---|---|
| `APP_PASSWORD` | Mot de passe d'accès à l'app |
| `SESSION_SECRET` | Secret de signature du cookie de session |
| `VAPID_PUBLIC` / `VAPID_PRIVATE` | Clés Web Push (voir ci-dessous) |
| `VAPID_SUBJECT` | Contact VAPID (`mailto:…`) |
| `PUSH_TIME` | Heure du rappel quotidien `HH:MM` (défaut 20:00) |
| `ORIGIN` | URL publique **exacte** (prod, CSRF adapter-node) |
| `HOST` / `PORT` | Interface/port du serveur Node (prod) |
| `DB_PATH` | Chemin du fichier SQLite (défaut `./data/habitquest.db`) |
| `DISABLE_CRON` / `CRON_SECRET` | Pour un cron externe (optionnel) |

Générer les clés VAPID puis les coller dans `.env` :

```bash
npm run vapid        # = web-push generate-vapid-keys
```

Générer un secret de session :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Sans clés VAPID, l'app fonctionne entièrement — seules les notifications push sont désactivées.

## 3. Icônes (une fois)

```bash
npm run icons        # génère static/icons/* depuis assets/logo-source.svg (sharp)
```

Les icônes générées sont **commitées** (le build de prod n'a pas besoin de `sharp`).

## 4. Données de démo (optionnel)

```bash
npm run seed         # profil de démonstration (habitudes, séries, boss, succès…)
```

## 5. Développement

```bash
npm run dev          # http://localhost:5173
```

> Le service worker est **désactivé en dev** (`devOptions.enabled: false`) pour éviter
> les caches obsolètes. Le push et le hors-ligne se testent en build/prod (HTTPS).

## 6. Build & lancement production

```bash
npm run build
npm start            # = node build/index.js
```

## 7. Scripts npm

| Script | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production (`adapter-node` → `build/`) |
| `npm start` | lance le serveur de prod |
| `npm run check` | vérification TypeScript / Svelte |
| `npm run icons` | (re)génère les icônes PWA |
| `npm run seed` | injecte les données de démo |
| `npm run vapid` | génère une paire de clés VAPID |

## 8. Déploiement (auto-hébergé, **HTTPS obligatoire**)

> Le Web Push et l'installation PWA exigent HTTPS. On lance Node en local
> (`127.0.0.1:3000`) derrière un reverse proxy qui gère TLS.

```bash
npm run build
HOST=127.0.0.1 PORT=3000 ORIGIN=https://habitquest.exemple.fr npm start
```

### Option A — Caddy (TLS automatique, recommandé)

`/etc/caddy/Caddyfile` :

```
habitquest.exemple.fr {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000
}
```

`sudo systemctl reload caddy` — Caddy obtient et renouvelle le certificat seul.

### Option B — nginx (+ certbot)

```nginx
server {
    listen 443 ssl http2;
    server_name habitquest.exemple.fr;
    ssl_certificate     /etc/letsencrypt/live/habitquest.exemple.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/habitquest.exemple.fr/privkey.pem;
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }
}
server {
    listen 80;
    server_name habitquest.exemple.fr;
    return 301 https://$host$request_uri;
}
```

> `ORIGIN` doit correspondre **exactement** à l'URL HTTPS, sinon les POST échouent
> (protection CSRF d'adapter-node).

### Persistance SQLite

La base vit dans `data/habitquest.db` (**ignorée par git**). En prod, place ce dossier
sur un disque persistant et **sauvegarde-le** régulièrement. Définis `DB_PATH` si tu
déplaces le fichier. Ne **jamais** committer ce fichier.

### systemd (optionnel)

`/etc/systemd/system/habitquest.service` :

```ini
[Unit]
Description=HabitQuest (SvelteKit/Node)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/habitquest
EnvironmentFile=/opt/habitquest/.env
Environment=HOST=127.0.0.1
Environment=PORT=3000
ExecStart=/usr/bin/node build
Restart=always
RestartSec=5
User=habitquest

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now habitquest
```

## 9. Notifications

- Active-les dans l'app via **Réglages → Rappels quotidiens** (un tap → permission).
- Le rappel part chaque jour à `PUSH_TIME` via un planificateur interne (`node-cron`).
- Cron externe à la place : `DISABLE_CRON=1`, puis appeler chaque jour
  `POST /api/cron/daily` avec l'en-tête `x-cron-secret: $CRON_SECRET`.

## 10. Conception & notes

- Tous les **réglages d'équilibrage** sont dans `src/lib/config/` (⭐ `progression.ts`).
- Les **rechutes** ne sont jamais punitives : donnée neutre, gel de série, mise en avant
  de la « meilleure série » (voir le brief §7).
- Architecture détaillée et avancement : voir [`CLAUDE.md`](CLAUDE.md).
- Blueprint d'implémentation : [`docs/BLUEPRINT.md`](docs/BLUEPRINT.md).
