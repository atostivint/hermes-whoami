# Domaine `prefs-pane`

Préférences persistées, couleurs déterministes, et le panneau de réglages « Whoami ».

## Fichiers possédés

- `desktop/plugin.js` — en tête (≈ 8-27) : `PRESETS`, `PREFS_KEY = 'whoami.prefs'`,
  `DEFAULT_MODE = 'profile'`, `ACCENT = 'var(--ui-accent)'`.
- `desktop/plugin.js` — le store et les dérivations (≈ 29-189) : `normaliseProfile`, `hashProfile`,
  `presetForProfile`, `presetById`, `normalisePrefs`, `emit`, `subscribe`, `getPrefs`, `setPrefs`,
  `usePrefs`, `readClientOverrides`, `clientColour`, `colourFor`, `profileNames`,
  `activeProfileName`.
- `desktop/plugin.js` — le panneau (≈ 289-444) : `ModeRow`, `ProfileRow`, `WhoamiPane`.

## Contrat à ne pas casser

- Huit palettes, identifiants et valeurs fixes :
  `mono #9CA3AF`, `green #3ECF8E`, `cyan #22D3EE`, `violet #A78BFA`, `pink #F472B6`,
  `red #EF4444`, `orange #FB923C`, `nous #6EA8FE`.
- Forme persistée : `{ "mode": "profile", "colors": { "work": "cyan" } }` sous `whoami.prefs`.
  `mode: "accent"` → la pastille prend `var(--ui-accent)`.
- Ordre de résolution de `colourFor` (décidé le 2026-11-11, ne pas réordonner sans arbitrage) :
  profil nul → `mono` ; `mode: "accent"` → `var(--ui-accent)` ; choix explicite dans
  `prefs.colors[nom]` (hex ou identifiant de palette) ; puis **couleur d'identité du client**
  (`readClientOverrides` sur `hermes.desktop.profileColors`, sinon `hermesSdk.profileColor`) ;
  nom vide ou `default` → `mono`, comme le rendu « untagged » du client ; sinon la palette dérivée,
  repli des vieux hôtes sans `profileColor`.
- `clientColour` trime le nom **une fois**, en tête, et refuse `default` **avant** de lire les
  overrides : c'est l'ordre de `resolveProfileColor` dans le client, où le profil racine reste neutre
  même si une couleur traîne dans la map.
- `readClientOverrides` mémoïse sur la chaîne brute et renvoie `{}` pour une clé absente, un JSON
  invalide ou un `localStorage` absent : jamais d'exception, jamais de `JSON.parse` par ligne de
  profil.
- « reset » supprime l'entrée de la palette pour ce profil ; la couleur d'identité revient.
- L'import `import * as hermesSdk from '@hermes/plugin-sdk';` est un import d'espace de noms
  **exprès** : un import nommé d'un symbole absent de l'hôte échoue au link et tuerait le plugin,
  garde de version compris.
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
Depuis le 2026-11-11, sept checks de plus portent la chaîne de couleur : `client colour is used when
no swatch is chosen`, `client override wins over the derived hue`, `explicit swatch still beats the
client colour`, `missing profileColor falls back to the preset palette`, `colour resolution survives
a missing localStorage`, `a profile named default stays neutral`, `client colour trims the profile
name`, `client colour is stable across two module loads`. Total attendu :
`SMOKE: 37 passed, 0 failed`.

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
- La propagation d'un recoloriage fait dans le client n'est pas instantanée : `localStorage.setItem`
  dans le même document ne déclenche aucun événement `storage`, donc pas d'`emit()`. La pastille se
  met à jour au prochain rendu (changement de profil, panneau). Non vérifié dans Hermes Desktop.
- `profileColor` et la clé `hermes.desktop.profileColors` viennent du client, pas d'un contrat
  documenté du SDK : si l'un des deux bouge, la pastille retombe sur la palette dérivée sans erreur.
