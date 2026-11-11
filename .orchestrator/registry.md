# Registre — hermes-whoami

Une ligne par domaine. `session` est le `sessionID` renvoyé par l'outil subagent : le repasser à
la tâche suivante continue ce domaine au lieu de repartir de zéro. `files in play` est la surface
de conflit du moment.

| domain | session | last item | files in play | status |
|---|---|---|---|---|
| composer-ui | ses_e33ca883affeSn7jqi1RKHdGRY | W-1 couleur d'identité du client | desktop/plugin.js (`colourFor`, `dot`) | done — 37 PASS |
| prefs-pane | ses_e33b09552ffedK9Gd13Xo3O7xw | W-8 alignement sur `resolveProfileColor` | desktop/plugin.js (`clientColour`) | done — 37 PASS |
| tests-ci | ses_e33b09552ffedK9Gd13Xo3O7xw | W-8 (checks `default` neutre + trim) | tests/smoke.mjs | done — 37 PASS |
| plugin-shell | — | aucun | — | idle |
| docs-release | ses_e33b8fb81ffewKExwH3r2Jnle1 | W-7 restructuration `desktop/plugin.js` | README.md, CHANGELOG.md, package.json, .github/workflows/smoke.yml, AGENTS.md | done — 36 PASS, non commité |

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
