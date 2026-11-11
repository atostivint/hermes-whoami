# Registre — hermes-whoami

Une ligne par domaine. `session` est le `sessionID` renvoyé par l'outil subagent : le repasser à
la tâche suivante continue ce domaine au lieu de repartir de zéro. `files in play` est la surface
de conflit du moment.

| domain | session | last item | files in play | status |
|---|---|---|---|---|

## Règles

- Remplir `session` dès que le premier worker d'un domaine a renvoyé son identifiant.
- Session morte ou fausse : vider la cellule et en ouvrir une nouvelle. Ne jamais deviner un ID.
- Un seul item actif par domaine. Le reste attend dans `inbox.md`.
- `plugin.js` est un point de sérialisation : une seule tâche active dessus, tous domaines confondus.
- Mettre la ligne à jour **avant** de répondre à l'utilisateur.
- Après une compaction, ce tableau est la mémoire : le lire avant de trier quoi que ce soit.
