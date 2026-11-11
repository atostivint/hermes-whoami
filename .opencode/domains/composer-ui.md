# Domaine `composer-ui`

Ce que l'utilisateur voit : la pastille du composeur et le point de la barre d'état.

## Fichiers possédés

- `desktop/plugin.js` — `dot()` (≈ 191), `ComposerPill()` (≈ 205), `StatusDot()` (≈ 254), plus les jetons
  de style en tête de fichier (`ACCENT`, `TEXT_SECONDARY`, `TEXT_TERTIARY`, `STROKE_SECONDARY`).

## Comportement attendu

- La pastille affiche **le nom du profil actif** (`host.state.profile`, normalisé) et prend la
  couleur décidée par le domaine `prefs-pane` — jamais une couleur en dur ici.
- Depuis le 2026-11-11 cette couleur est, par défaut, **la couleur d'identité du client** (celle du
  carré du rail et du tag de profil) : une valeur `hsl(…)` et non plus un hex de palette. `dot()` ne
  doit donc jamais supposer un format hexadécimal ; `backgroundColor` accepte la chaîne telle quelle.
- L'étiquette de couleur (`label`) vaut `accent`, un nom de palette, un hex ou la chaîne `hsl(…)`
  renvoyée par le client : elle est interpolée dans les notifications, donc jamais de jeton interne
  type `client`.
- Un profil dont le nom trimé est vide ou `default` affiche `mono` (`#9CA3AF`), le neutre du plugin,
  parce que le client ne colore pas le profil racine.
- Profil nul (scope « tous les profils ») → pastille grise `no profile`. Un clic dans cet état
  émet `host.notify({ kind: 'warning', message: … })` qui explique qu'une nouvelle session exige un
  profil explicite.
- Le point de la barre d'état lit **le même état** que la pastille : les deux ne doivent jamais
  diverger (c'est la réclamation du README).
- Notifications : `kind` (`info`/`warning`), **jamais** `level`. Le smoke refuse `level`.
- Couleurs via variables CSS (`var(--ui-accent)`, `var(--ui-text-secondary)`…) pour suivre le thème
  de l'application. Les tests comparent la chaîne littérale : ne pas remplacer par un calcul.

## Commandes de vérification

```powershell
npm run check
npm run smoke
```

Assertions concernées : le texte de la pastille contient le profil simulé, la pastille porte une
couleur, deux rendus du même profil donnent la même couleur, `null` → `no profile` + un warning.

## Pièges connus

- La pastille est montée dans `composer.actions` : sur un build trop ancien, seule la barre d'état
  apparaît. Ce n'est pas un bug du plugin — le rapporter comme `gaps`.
- Aucun rendu réel n'est vérifié hors Hermes Desktop. Un changement visuel sans capture ni capture
  d'écran n'est **pas** prouvé.
- `dot()` sert aux deux surfaces : une modification de taille ou de rayon touche les deux, et le
  smoke n'a qu'une assertion de couleur.

## Règles de style

- Rayons, tailles et espacements en littéraux `px` cohérents avec l'existant ; pas de nouvelle
  variable CSS sans raison.
- Microcopie en anglais, courte, sans emphase commerciale.
- Un composant = une fonction, sans état local autre que celui du store de préférences.

## Fils ouverts

- Le libellé du scope « tous les profils » n'est couvert que par `no profile` ; si Hermes expose un
  nom de scope, la décision d'affichage revient à l'utilisateur.
