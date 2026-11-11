# Domaine `prefs-pane`

Préférences persistées, couleurs déterministes, et le panneau de réglages « Whoami ».

## Fichiers possédés

- `plugin.js` — en tête (≈ 5-22) : `PRESETS`, `PREFS_KEY = 'whoami.prefs'`,
  `DEFAULT_MODE = 'profile'`, `ACCENT = 'var(--ui-accent)'`.
- `plugin.js` — le store et les dérivations (≈ 24-137) : `normaliseProfile`, `hashProfile`,
  `presetForProfile`, `presetById`, `normalisePrefs`, `emit`, `subscribe`, `getPrefs`, `setPrefs`,
  `usePrefs`, `colourFor`, `profileNames`, `activeProfileName`.
- `plugin.js` — le panneau (≈ 237-392) : `ModeRow`, `ProfileRow`, `WhoamiPane`.

## Contrat à ne pas casser

- Huit palettes, identifiants et valeurs fixes :
  `mono #9CA3AF`, `green #3ECF8E`, `cyan #22D3EE`, `violet #A78BFA`, `pink #F472B6`,
  `red #EF4444`, `orange #FB923C`, `nous #6EA8FE`.
- Forme persistée : `{ "mode": "profile", "colors": { "work": "cyan" } }` sous `whoami.prefs`.
  `mode: "accent"` → la pastille prend `var(--ui-accent)`.
- La couleur par défaut est **dérivée du nom** (`hashProfile` : `hash * 31 + code`, puis modulo sur
  les palettes). Elle doit rester stable entre deux démarrages et deux rendus.
- « reset » supprime l'entrée de la palette pour ce profil ; la couleur dérivée revient.
- Changer d'identifiant de palette ou la fonction de hash **invalide les préférences déjà
  enregistrées chez les utilisateurs** : c'est une décision utilisateur, pas un détail.

## Commandes de vérification

```powershell
npm run check
npm run smoke
```

Assertions concernées : huit pastilles trouvées par leur attribut d'accessibilité, clic sur `green`
→ `#3ECF8E` et `storage.colors.atlas === 'green'`, `reset` restaure la couleur d'origine et supprime
la clé, bouton de mode → `var(--ui-accent)`, deux profils différents peuvent différer de couleur.

## Pièges connus

- `getPrefs()` sert un cache alimenté par le store externe : un rendu après `setPrefs` doit voir la
  nouvelle valeur. Tester dans l'ordre du smoke, pas dans un ordre inventé.
- `host.storage` peut refuser ou perdre une valeur : `normalisePrefs` doit tolérer une forme
  partielle (`{}`, `colors` absent, palette inconnue → repli).
- `normaliseProfile` accepte une chaîne **ou** un objet (`name`, `id`, `label`, `profile`, `slug`) :
  ne pas supposer que le SDK renvoie une chaîne.

## Règles de style

- `const` en tête de fichier pour les constantes, fonctions pures ensuite, composants à la fin.
- Toute nouvelle préférence passe par `normalisePrefs` avec un repli explicite.
- Pas d'accès direct à `host.storage` hors de `getPrefs`/`setPrefs`.

## Fils ouverts

- Aucune migration de préférences n'existe : si les identifiants changent, en écrire une.
