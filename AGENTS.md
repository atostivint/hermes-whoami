# hermes-whoami — règles pour tout agent de code

Plugin de bureau Hermes (« whoami ») : une pastille dans le composeur et un point dans la barre
d'état, qui montrent **quel profil** une nouvelle session utilisera. Module ES unique, sans build,
sans dépendance. La mémoire d'orchestration vit dans `.orchestrator/`.

## Où est quoi

| Chemin | Contenu |
|---|---|
| `plugin.js` | tout le plugin : constantes, store de préférences, dérivations de couleur, composants, `register` |
| `plugin.yaml` | manifeste lu par Hermes (nom, version, `requires_hermes`) |
| `tests/smoke.mjs` | harnais hors Hermes : lit `plugin.js` **comme du texte** et l'exécute avec des doublures |
| `.github/workflows/smoke.yml` | CI : `node 22`, `node --check` puis `npm run smoke` |
| `.opencode/domains/*.md` | périmètres de propriété (un fichier par surface) |
| `.orchestrator/*` | politique, registre, boîte de réception, décisions |

Carte du fichier unique : `PRESETS`/constantes (≈ 5-22), store et dérivations (≈ 24-137), `dot`/
`ComposerPill`/`StatusDot` (≈ 139-236), panneau `ModeRow`/`ProfileRow`/`WhoamiPane` (≈ 237-392),
`export default`/`register` (≈ 394-456).

## L'utilisateur et la langue

- Répondre **en français**, court et concret. Le code, les commentaires et les chaînes d'interface
  restent en anglais.
- L'utilisateur est le QA : dire ce qui a été vérifié **et ce qui ne l'a pas été** (rendu réel dans
  Hermes Desktop, autre build du SDK). Une capture ou une mesure vaut mieux qu'une affirmation.
- Pas de remplissage « IA » : pas de conclusion gratuite, pas de superlatif, pas d'emoji.

## Build, test, vérification (Windows et ailleurs)

Il n'y a **pas d'étape de build**. Le code est chargé tel quel par Hermes.

```powershell
npm run check   # node --check plugin.js — parse sans exécuter
npm run smoke   # node tests/smoke.mjs — harnais hors Hermes
```

- Node 22 ou plus récent (la CI utilise 22 ; la machine locale est en 26.4).
- **Aucun `npm install`** : `package.json` ne déclare aucune dépendance, et il ne doit pas en
  apparaître sans décision de l'utilisateur. Ne pas créer de `node_modules/` ni de lockfile.
- Un seul agent à la fois sur `plugin.js`. Les tests sont rapides, mais un worker qui lance le smoke
  pendant qu'un autre édite le fichier lit un état incohérent.
- Les deux commandes doivent rester vertes. `npm run smoke` finit par
  `SMOKE: 29 passed, 0 failed` aujourd'hui ; le total monte à chaque nouveau `check(...)`.

## Interdits

- **Commit ou push sans demande explicite.** Pas de tag, pas de release, pas de `gh pr create`
  spontané.
- Aucune dépendance ajoutée, aucun outil de build, aucun transpileur : `node --check` doit
  continuer à parser le fichier tel quel (donc pas de syntaxe JSX, uniquement des appels `jsx(...)`).
- Ne pas modifier `assets/` (fichier non suivi de l'utilisateur).
- Ne pas affaiblir ou supprimer une assertion existante de `tests/smoke.mjs` pour faire passer un
  changement.
- Ne pas toucher aux fichiers hors du périmètre du brief.

## Travail en parallèle

- **Un agent par fichier.** `plugin.js` est un point de sérialisation : une seule tâche active
  dessus, même sur des lignes différentes.
- Une tâche parallèle n'est légitime que si son périmètre est disjoint (`tests/smoke.mjs`,
  `.github/workflows/smoke.yml`, `plugin.yaml`, `README.md`, `CHANGELOG.md`).
- Deux tâches en parallèle = deux worktrees (`git worktree add ../whoami-NAME -b NAME`), jamais deux
  agents dans le même arbre.
- Fusionner par branche, jamais en recopiant des fichiers.

## Preuves obligatoires

Un rapport sans preuve est renvoyé une fois, puis clos en échec. Il contient :

1. `git diff --stat`.
2. Chaque commande exécutée, avec son code de sortie et la sortie pertinente (`npm run check`,
   `npm run smoke`).
3. Les vérifications ajoutées, **par leur nom** (le libellé du `check(...)`).
4. `gaps:` ce qui n'a pas pu être vérifié (rendu réel, version du SDK, rechargement à chaud).

## Conventions de code

- Petit, testé, lisible. Un commentaire explique un **pourquoi**, pas un quoi.
- Module ES unique, `const` en tête, fonctions pures au milieu, composants à la fin — ordre déjà en
  place dans `plugin.js`.
- Couleurs et typographie via les variables CSS de l'application (`var(--ui-...)`), jamais de thème
  recopié.
- Notifications : `host.notify({ kind, message })`, `kind` valant `info` ou `warning` ; la clé
  `level` est refusée par les tests.
- Toute nouvelle préférence passe par `normalisePrefs` avec un repli explicite, et son identifiant
  est stable (le changer invalide les préférences enregistrées).

## Pièges du dépôt

- `tests/smoke.mjs` retire **trois lignes d'import par correspondance exacte** : ajouter un import
  dans `plugin.js` casse le harnais tant que la ligne de retrait n'est pas ajoutée.
- Le harnais ne fournit que `host`, `useValue`, `useSyncExternalStore`, `jsx` : tout autre hook doit
  être doublé.
- La couleur dérivée d'un profil est déterministe (hash `* 31` sur le nom, modulo sur les palettes) :
  elle doit rester identique entre deux rendus et deux démarrages.
- `host.state.profile` peut être nul (scope « tous les profils ») : la pastille affiche `no profile`
  et le clic émet un avertissement.
- La version est écrite trois fois (`package.json`, `plugin.yaml`, `CHANGELOG.md`) : les trois
  doivent s'accorder.

## Orchestration

Les briefs, les preuves et le routage par domaine sont décrits dans `.orchestrator/POLICY.md`
et `.orchestrator/README.md`. Une tâche reçue par un worker est bornée : fichiers exacts,
commandes exactes, preuve exacte.
