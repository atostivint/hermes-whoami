# Domaine `tests-ci`

Le harnais qui prouve que le plugin fonctionne **sans** Hermes Desktop, et la CI qui le lance.

## Fichiers possédés

- `tests/smoke.mjs` — harnais Node autonome.
- `.github/workflows/smoke.yml` — workflow GitHub Actions.
- `package.json` — uniquement ses `scripts` (`check`, `smoke`).

## Comment le harnais fonctionne (à lire avant de le modifier)

`tests/smoke.mjs` lit `plugin.js` **comme du texte**, puis :

1. retire trois lignes d'import par correspondance littérale exacte
   (`@hermes/plugin-sdk`, `react`, `react/jsx-runtime`) ;
2. remplace `export default` par `const plugin =` ;
3. évalue le tout par `new Function('host', 'useValue', 'useSyncExternalStore', 'jsx', src + 'return plugin;')`
   avec des doublures : un atome de profil, un faux `host` (`state.profile`, `notify`), un stockage
   `Map`, un `jsx` qui appelle directement les composants fonction ;
4. enregistre le plugin dans un faux `ctx` (`register`, `registerMany`, `storage`), puis vérifie les
   contributions et rend les composants.

Conséquences directes :

- **Ajouter un import dans `plugin.js` casse le harnais** (ligne d'import laissée dans le corps de
  la fonction). Toute nouvelle dépendance d'import exige une ligne de retrait correspondante ici.
- **Utiliser un hook non doublé casse le harnais** : seuls `host`, `useValue`,
  `useSyncExternalStore` et `jsx` existent dans la portée. Tout ajout doit être passé en paramètre.
- Le fichier n'est pas un bundle : `plugin.js` doit rester un module autonome d'un seul fichier.

## Commandes exactes

```powershell
npm run check     # node --check plugin.js — parse sans exécuter
npm run smoke     # node tests/smoke.mjs — harnais hors Hermes
```

Sortie attendue aujourd'hui : une ligne `PASS ...` par vérification, puis
`SMOKE: 29 passed, 0 failed`. Code de sortie non nul en cas d'échec.

CI : `node 22`, sur `push` et `pull_request` vers `master`/`main`, exécute `node --check plugin.js`
puis `npm run smoke`. Pas de `npm install` : aucune dépendance.

## Règles

- Tout comportement nouveau = un `check('nom explicite', …)` nouveau. **Ne jamais affaiblir une
  assertion existante** pour faire passer un changement.
- Le nom du `check` est la preuve citée dans le rapport : il doit décrire le comportement, pas
  l'implémentation.
- Ne pas transformer le harnais en test de rendu React : il tourne sans React, c'est sa valeur.

## Pièges connus

- Les vérifications s'exécutent dans l'ordre : un test qui change les préférences ou le profil
  affecte les suivants. Remettre l'état (`profile.set('atlas')`) plutôt que compter sur l'ordre.
- Une doublure trop permissive (par exemple un `jsx` qui ignore les props) rendrait des tests verts
  pour un composant cassé. Vérifier ce que la doublure fait réellement avant d'y faire confiance.

## Fils ouverts

- Le harnais ne couvre ni le rendu réel, ni la version du SDK, ni le rechargement à chaud.
