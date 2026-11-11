# Politique d'orchestration — hermes-whoami

L'orchestrateur lit ce fichier au triage. Les workers ne reçoivent que ce que le brief cite d'ici.

## Règles dures

- **L'orchestrateur ne modifie jamais un fichier lui-même.** Il trie, écrit des briefs, vérifie
  les preuves, met à jour sa mémoire. Le code est écrit par des workers (`worker`) et relu par
  `reviewer`. Les seuls fichiers qu'il écrit sont `.orchestrator/*` et `.opencode/domains/*`.
- **Jamais de commit ni de push sans demande explicite de l'utilisateur.** Jamais de tag, jamais
  de release, jamais de `npm publish` (`private: true` de toute façon).
- **Pas d'installation de dépendance.** Le projet n'en a aucune : `node --check` et
  `node tests/smoke.mjs` suffisent. Ajouter une dépendance est une décision utilisateur, pas un
  détail d'implémentation.
- **Répondre en français**, court. Le code, les commentaires et les chaînes d'interface restent en
  anglais (convention du dépôt).
- **Toujours dire ce qui n'a pas pu être vérifié** (écran réel dans Hermes Desktop, autre build du
  SDK). Une apparence n'est pas prouvée par `node --check`.

## Contrat de preuve

Une tâche n'est acceptée que si son bloc PROOF contient :

1. `git diff --stat` — les fichiers réellement modifiés.
2. **Chaque commande exécutée, avec son code de sortie et la sortie pertinente.** Minimum :
   - `npm run check` (soit `node --check plugin.js`)
   - `npm run smoke` (soit `node tests/smoke.mjs`)
3. Les tests exécutés **par leur nom** pour tout comportement nouveau (les lignes `PASS ...` du
   smoke, ou le nom du `check(...)` ajouté).
4. Pour un changement de comportement, la ligne finale `SMOKE: N passed, 0 failed` avec le
   nouveau total.
5. `gaps:` ce qui n'a pas pu être vérifié (rendu réel dans l'application, version du SDK, autres
   profils).

Un résumé sans commandes ni diff est rejeté une fois. La deuxième fois, la tâche est close en échec.

## Pas de mort silencieuse

- Un worker **écrit le code d'abord**, dans ses premiers appels d'outils, ensuite il vérifie,
  ensuite il rapporte. Un rapport sans fichier modifié est une tâche échouée, même poli.
- Tout brief se termine par : « si tu manques d'étapes, laisse le fichier dans un état qui passe
  `npm run check` et dis exactement ce qui manque ; ne termine jamais par un simple plan ».
- L'orchestrateur vérifie l'arbre (`git status --short`, `git diff --stat`) **après chaque worker
  et avant de lire son rapport**. Un « ça passe » sans diff ne vaut rien.
- Un worker qui échoue deux fois sur la même tâche la voit **découpée**, pas relancée à l'identique.
- Rate-limit, blocage ou modèle indisponible : la tâche est relancée sur un **autre** modèle, sans
  changer le brief.

## Règles de périmètre

- Le brief liste **les fichiers exacts**. Aucun fichier hors de cette liste ne peut être touché.
- **`plugin.js` est le point de sérialisation** : une seule tâche active à la fois dessus, même si
  deux tâches ne touchent pas les mêmes lignes (le fichier fait 456 lignes et le smoke le lit en
  entier). Les tâches parallèles autorisées portent sur des fichiers disjoints : `tests/smoke.mjs`,
  `.github/workflows/smoke.yml`, `plugin.yaml`, `README.md`, `CHANGELOG.md`, `package.json`.
- Avant de créer une tâche : `git status --short` et `git worktree list`. Le travail peut déjà
  exister sur une branche `orch-*`.
- Deux tâches en parallèle = deux worktrees, jamais deux workers dans le même arbre.
- Aucune tâche ne modifie `assets/` (fichier non suivi appartenant à l'utilisateur).

## Routage

| Le sujet porte sur | Domaine |
|---|---|
| `register(ctx)`, zones/ordres des contributions, `plugin.yaml`, chargement par Hermes | `plugin-shell` |
| pastille du composeur, point de la barre d'état, styles, microcopie affichée | `composer-ui` |
| préférences `whoami.prefs`, palettes, couleur dérivée d'un nom, mode accent, panneau de réglages | `prefs-pane` |
| `tests/smoke.mjs`, CI GitHub Actions, harnais d'exécution hors Hermes | `tests-ci` |
| README, CHANGELOG, versions `package.json`/`plugin.yaml`, icône, publication | `docs-release` |

## Format de réponse au triage

Huit lignes maximum :

```
#ID (reformulation en une ligne) - lié à : #AUTRE.
Domaine : <domaine> (session : <id ou nouvelle>).
Porte sur : <ce que le correctif change>.
Non vérifié : <écran/SDK/autre build>.
```

## Après chaque tâche

- Mettre à jour `.orchestrator/registry.md` (la ligne du domaine) **avant** de répondre.
- Mettre à jour `.orchestrator/inbox.md` (statut de l'item).
- Noter dans `decisions.md` tout arbitrage utilisateur, daté, sans effacer l'ancien.
- Mettre à jour les « fils ouverts » de la note de domaine si la situation a bougé.
