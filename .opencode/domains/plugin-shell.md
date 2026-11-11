# Domaine `plugin-shell`

Chargement du plugin par Hermes Desktop : le manifeste et l'enregistrement des contributions.
C'est la porte d'entrée ; rien d'autre ne s'exécute si ce domaine est cassé.

## Fichiers possédés

- `desktop/plugin.js` — de `export default {` à la fin du fichier (≈ 446-508) : `id`, `name`,
  `description`, `register(ctx)`.
- `plugin.yaml` — nom, version, `requires_hermes`, `provides_*`, `tags`.

## Contrat à ne pas casser

`register(ctx)` enregistre **exactement trois** contributions, avec ces identifiants et zones :

| id | area | détail |
|---|---|---|
| `composer-pill` | `composer.actions` | `order: 20`, `render: () => h(ComposerPill, {})` |
| `palette-show` | `palette` | `data: { id: 'whoami.show', action, label, keywords, run() }` |
| `settings-pane` | `panes` | `title: 'Whoami'`, `data: { placement: 'right', width: '240px' }` |

- La barre d'état n'est **plus** une surface du plugin (décision du 2026-11-11) : ne pas y
  réenregistrer de contribution sans arbitrage utilisateur. Le smoke le refuse
  (`no contribution targets the status bar`).

- La forme d'une contribution est `{ id, area, order?, render? , data? }`. **Jamais de clé
  `component`** : le smoke refuse explicitement cette forme.
- `register` lève une erreur si `host.state.profile` est absent : c'est le garde-fou
  `requires_hermes: ">=0.21.5"`. Ne pas l'enlever, ne pas l'assouplir sans décision utilisateur.
- `register` remet `REGISTER_CTX` et vide le cache de préférences : un rechargement de plugin doit
  repartir propre.

## Commandes de vérification

```powershell
npm run check     # node --check desktop/plugin.js
npm run smoke     # node tests/smoke.mjs
```

Le smoke vérifie le nombre de contributions, la présence des quatre zones, `placement === 'right'`,
`palette.data.run` appelable, et l'absence de clé `component`.

## Pièges connus

- `tests/smoke.mjs` lit `desktop/plugin.js` **comme du texte** et retire quatre lignes d'import par
  correspondance exacte. Ajouter un import, ou reformater ces lignes, casse le harnais.
- Une contribution placée dans une zone inconnue de Hermes est ignorée **silencieusement** : le
  smoke atteste la forme, pas que l'application l'affiche. Le dire dans `gaps`.
- Le plugin n'a aucune dépendance : `package.json` reste sans `dependencies`.

## Règles de style

- Module ES unique, appels `jsx(type, props, ...children)` explicites — pas de syntaxe JSX, c'est ce
  qui permet à `node --check` de passer sans transpilation.
- Chaînes d'interface en anglais, en minuscules comme le reste du produit (`no profile`).
- Pas de commentaire décoratif ; un commentaire explique un pourquoi non évident.

## Fils ouverts

- Aucun. Toute nouvelle zone de contribution (`composer.actions`, `panes`, …) dépend d'une version
  du SDK : vérifier `requires_hermes` avant de l'annoncer.
