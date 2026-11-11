# Espace de travail de l'orchestrateur — hermes-whoami

Ce dossier est la mémoire de l'orchestrateur. Il est versionné, donc il survit aux sessions, aux
compactions et aux worktrees.

| Fichier | Rôle |
|---|---|
| `POLICY.md` | Règles dures, contrat de preuve, périmètre, routage, format de réponse. Lu au triage. |
| `registry.md` | Domaine → session worker, fichiers en jeu, statut. Mémoire à long terme. |
| `inbox.md` | Items à trier et leur état (`ready`, `in-flight`, `blocked`, `done`). |
| `decisions.md` | Arbitrages utilisateur datés : ne s'effacent pas, se barrent. |

Les notes de domaine vivent dans `.opencode/domains/`.

## Ordre de démarrage

1. Lire `.orchestrator/POLICY.md` (règles), puis `registry.md` (où en est chaque domaine).
2. Lire `.opencode/domains/<domaine>.md` pour le périmètre concerné.
3. Prendre l'item suivant de `.orchestrator/inbox.md`, ou un item dicté par l'utilisateur.
4. Écrire le brief, lancer le worker, vérifier la preuve, mettre à jour `registry.md`.

Ne pas ouvrir une session par item : une seule session d'orchestrateur par projet, gardée vivante.
Les sessions worker sont des sessions subagent, dont l'`sessionID` est rangé dans `registry.md`.

## La boucle

1. `triage` : classer l'item contre `.opencode/domains/`, vérifier `git status --short` et
   `git worktree list`.
2. Brief : GOAL / SCOPE (fichiers exacts) / ACCEPTANCE (commandes exactes) / PROOF / STOP.
3. Un `worker` par tâche indépendante ; en arrière-plan (`background: true`) si les périmètres
   sont disjoints. Jamais deux workers sur `desktop/plugin.js`.
4. Pas de bloc PROOF → renvoi une fois → sinon clôture en échec.
5. Revue en une passe avec `reviewer` sur le diff courant.
6. Mise à jour de `registry.md`, `inbox.md` et de la note de domaine.

## Ce qu'il ne faut pas faire

- Laisser l'orchestrateur écrire du code applicatif : c'est le principe même de la configuration.
- Lancer deux items qui touchent `desktop/plugin.js` : c'est un seul fichier, tout se sérialise dessus.
- Commiter, pousser ou publier sans demande de l'utilisateur.
- Recopier un état venu d'un autre projet dans `registry.md` ou `inbox.md`.

## Revenir au travail direct

Changer d'agent (Tab dans OpenCode) pour une session de code normale. L'orchestrateur reste
configuré pour le triage suivant.
