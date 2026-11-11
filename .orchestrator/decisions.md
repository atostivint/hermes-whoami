# Décisions de l'utilisateur — hermes-whoami

Une ligne par arbitrage. C'est la mémoire qui survit aux compactions, aux redémarrages et aux
agents qui relisent le dépôt. Quand une décision change, on ne l'efface pas : on la barre et on
ajoute la nouvelle, avec la date.

Format : `date — décision — pourquoi — où c'est appliqué`.

2026-11-11 — la couleur par défaut de la pastille est la couleur d'identité du client (même hash
`*31`, `hsl(h 68% 58%)`, fonction `profileColor` du SDK), les huit palettes ne servant plus que
d'override explicite — l'utilisateur veut que la pastille s'accorde avec le carré du rail et le tag
de profil — appliqué dans `desktop/plugin.js` (`clientColour`, `colourFor`), prouvé par les checks
`client colour is used when no swatch is chosen` et `explicit swatch still beats the client colour`.

2026-11-11 — les couleurs de profil recoloriées à la main dans le client sont lues depuis la clé
`localStorage` `hermes.desktop.profileColors` (clé interne, pas d'export SDK), avec repli sur
`profileColor` puis sur la palette dérivée — l'utilisateur préfère la couleur exacte à l'absence de
dépendance interne — appliqué dans `desktop/plugin.js` (`readClientOverrides`), sans exception si la clé est
absente ou illisible.

2026-11-11 — la publication passe par le catalogue de plugins Hermes (`hermes-agent/plugin-catalog`)
et non par une release GitHub seule — l'utilisateur veut que le plugin soit téléchargeable depuis
l'application — format du catalogue à vérifier avant d'écrire quoique ce soit (P-1).

