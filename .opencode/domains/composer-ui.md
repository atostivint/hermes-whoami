# Domaine `composer-ui`

Ce que l'utilisateur voit : la pastille du composeur et le point de la barre d'état.

## Fichiers possédés

- `plugin.js` — `dot()` (≈ 139), `ComposerPill()` (≈ 153), `StatusDot()` (≈ 202), plus les jetons
  de style en tête de fichier (`ACCENT`, `TEXT_SECONDARY`, `TEXT_TERTIARY`, `STROKE_SECONDARY`).

## Comportement attendu

- La pastille affiche **le nom du profil actif** (`host.state.profile`, normalisé) et prend la
  couleur décidée par le domaine `prefs-pane` — jamais une couleur en dur ici.
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
