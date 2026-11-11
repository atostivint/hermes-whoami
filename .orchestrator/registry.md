# Registre — hermes-whoami

Une ligne par domaine. `session` est le `sessionID` renvoyé par l'outil subagent : le repasser à
la tâche suivante continue ce domaine au lieu de repartir de zéro. `files in play` est la surface
de conflit du moment.

| domain | session | last item | files in play | status |
|---|---|---|---|---|
| composer-ui | ses_e338d7ea4ffeOh4GhT7Zi77quq | W-9 rendu des enfants (`h()`) | desktop/plugin.js (`h`, `dot`, `ComposerPill`) | done — 39 PASS, vérifié à l'écran |
| prefs-pane | ses_e33b09552ffedK9Gd13Xo3O7xw | W-8 alignement sur `resolveProfileColor` | desktop/plugin.js (`clientColour`) | done — 39 PASS |
| tests-ci | ses_e338d7ea4ffeOh4GhT7Zi77quq | W-9 (double `jsx` à la vraie signature) | tests/smoke.mjs | done — 39 PASS |
| plugin-shell | — | aucun | — | idle |
| docs-release | ses_e33814ce7ffe3sLS32UOQi9mHC | P-1 captures + entrée catalogue | README.md, docs/screenshots/, plugin.yaml | done — 3 URLs d'images en 200 |

## Règles

- Remplir `session` dès que le premier worker d'un domaine a renvoyé son identifiant.
- Session morte ou fausse : vider la cellule et en ouvrir une nouvelle. Ne jamais deviner un ID.
- Un seul item actif par domaine. Le reste attend dans `inbox.md`.
- `desktop/plugin.js` est un point de sérialisation : une seule tâche active dessus, tous domaines confondus.
  W-1 a donc consommé composer-ui, prefs-pane et tests-ci dans la même passe.
- Mettre la ligne à jour **avant** de répondre à l'utilisateur.
- Après une compaction, ce tableau est la mémoire : le lire avant de trier quoi que ce soit.
- 2026-11-11 : la revue du diff W-1 a renvoyé un bloquant (override d'un profil nommé `default`
  ignoré) ; corrigé dans la même session, re-vérifié 36/36.
- 2026-11-11 : W-7 a déplacé `desktop/plugin.js` (exigence du catalogue) ; `plugin.yaml` reste à la
  racine. Toute tâche qui touche le code repart de ce chemin.
