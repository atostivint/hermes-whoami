# Domaine `docs-release`

Documentation, manifeste et numéro de version : ce qui est publié et ce qui est promis.

## Fichiers possédés

- `README.md` — usage, installation, configuration, limites, développement.
- `CHANGELOG.md` — une section par version, la plus récente en haut.
- `package.json` — `version`, `scripts`, `private: true`, `license`.
- `plugin.yaml` — `version`, `description`, `requires_hermes`, `provides_*`, `tags`.
- `assets/icon.png` — **fichier non suivi appartenant à l'utilisateur : ne pas le modifier.**

## Règles de cohérence

- Le numéro de version est le même dans `package.json`, `plugin.yaml` et la dernière section de
  `CHANGELOG.md`. Une seule version par changement.
- `requires_hermes: ">=0.21.5"` doit rester cohérent avec le garde-fou de `register()`
  (`host.state.profile` absent → erreur explicite).
- Les commandes citées dans le README doivent exister dans `package.json` : `npm run check`,
  `npm run smoke`.
- Le README décrit des limites assumées (lecture seule, pas de changement de profil). Une limite
  levée se retire du README **et** apparaît au CHANGELOG.

## Commandes de vérification

```powershell
npm run check
npm run smoke
Select-String -Path package.json,plugin.yaml -Pattern '"version"|^version:'
```

Un changement purement documentaire ne demande pas de nouveau test, mais demande la preuve que les
commandes citées existent encore (lecture de `scripts` dans `package.json`).

## Pièges connus

- `private: true` : aucune publication npm n'est possible ni voulue.
- Pas de tag, pas de release, pas de push sans demande explicite de l'utilisateur.
- Une capture ou une icône ajoutée sans mesure n'est pas une preuve : le dire dans `gaps`.

## Règles de style

- README en anglais (convention du dépôt), phrases courtes, pas de superlatif.
- CHANGELOG au format « une puce = un changement visible », pas de journal de commits.
- Pas de badge ni de section qui ne corresponde à un fichier réel du dépôt.

## Fils ouverts

- Aucune icône n'est référencée par le manifeste aujourd'hui.
