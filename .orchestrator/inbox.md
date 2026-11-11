# Boîte de réception — hermes-whoami

Une ligne par item. `done` = présent sur la branche courante et vérifié par `npm run smoke`,
`ready` = prêt à partir, `blocked` = attend une information de l'utilisateur.
Les décisions qui expliquent ces items sont dans `decisions.md`.

| id | item | fichiers | état | notes |
|---|---|---|---|---|
| W-1 | La pastille prend la couleur d'identité du client (hue `profileColor`, overrides `hermes.desktop.profileColors`) | desktop/plugin.js, tests/smoke.mjs | done | `npm run check` 0 ; `npm run smoke` 37/37 ; checks nommés ; non commité |
| W-8 | Aligner sur `resolveProfileColor` : `default` neutre avant l'override, nom trimé avant tout | desktop/plugin.js, tests/smoke.mjs | done | renvoi de la revue avant commit ; rouge→vert vérifié deux fois |
| W-9 | Les enfants `jsx` passaient en argument positionnel : React les lisait comme `key`, d'où une pastille vide et un point invisible | desktop/plugin.js, tests/smoke.mjs | done | vérifié dans l'app (pastille `● sandbox` visible) ; 39 PASS ; commit `7686b75` |
| P-1 | Entrée catalogue `plugin-catalog/whoami.yaml` épinglée sur `b923057`, branche `catalog/whoami` poussée sur le fork | — | done | validateur structurel OK, 3 URLs d'images en 200, PR non ouverte (choix utilisateur) |
| W-2 | `setPrefs` sans `try/catch` ni test de `storage` : un stockage absent qui jette casse le panneau | desktop/plugin.js | ready | audit 2026-11-11, sévérité haute |
| W-3 | Aperçu du panneau faux en mode accent (toutes les lignes prennent `var(--ui-accent)`) | desktop/plugin.js | ready | audit, moyen |
| W-4 | Swatches sans `aria-pressed`, `aria-label` identique pour tous les profils | desktop/plugin.js | ready | audit, moyen |
| W-5 | Le harnais retire les imports par littéral ; une regex `^import` plus une assertion du nombre | tests/smoke.mjs | ready | audit, moyen |
| W-6 | `register` (garde de version) et `storage` qui jette jamais exercés | tests/smoke.mjs | ready | audit, moyen |
| W-7 | Déplacer `plugin.js` → `desktop/plugin.js` (entrypoint admis par le validateur et matérialisé par Electron) | desktop/plugin.js, tests/smoke.mjs, package.json, .github/workflows/smoke.yml, README.md, CHANGELOG.md, AGENTS.md | done | `npm run check` 0 ; `npm run smoke` 36/36 ; racine sans `plugin.js` |
| P-1 | Publication au catalogue de plugins Hermes (entrée `plugin-catalog/whoami.yaml` sur le dépôt `hermes-agent`) | README.md, CHANGELOG.md, plugin.yaml, package.json | ready | W-7 lève le blocage `loadable` ; il manque un commit public épinglable et la PR |
| P-2 | README : étape de vérification, capture, dépannage `host.state.profile is missing` | README.md | ready | audit, sévérité haute pour un nouvel utilisateur |
| P-3 | `requires_hermes: ">=0.21.5"` contredit le mode dégradé promis par le README | plugin.yaml, README.md | blocked | dépend de ce que le host applique vraiment au manifeste |
