# Ancre d'Armor — site ancre-darmor.fr

Site statique (HTML/CSS/JS) hébergé sur Cloudflare Pages, relié à GitHub.

## Mise en ligne
1. Créer un dépôt GitHub `ancre-darmor` et y envoyer tout le contenu de ce dossier.
2. Cloudflare > Workers & Pages > Create > Pages > Import an existing Git repository > `ancre-darmor`.
   Framework : None · Build command : vide · Output directory : `/`
3. Domaine : réserver `ancre-darmor.fr` (au nom de la propriétaire), puis Custom domains dans le projet Pages.

## Formulaire de contact (dossier `functions/`)
Cloudflare Pages > projet > Settings > Variables and secrets :
- `RESEND_API_KEY` (secret) · `CONTACT_TO` · `CONTACT_FROM` (adresse d'un domaine vérifié chez Resend)

## Paiements PayPal
Dans `guides.html` et `boutique.html`, remplacer `TODO-email-paypal@exemple.fr` par l'e-mail du compte PayPal.
Le texte de personnalisation arrive dans le détail de la transaction PayPal (« Personnalisation »).
Ensuite : commande passée à la main sur Gelato, ou envoi du PDF pour un guide.

## Publier l'histoire du dimanche
1. Copier `histoires/modele-histoire.html` sous un nouveau nom (ex. `histoires/pointe-du-raz.html`).
2. Remplacer titre, date, département, résumé (balises `<title>`, `description`, `og:*`, `canonical`) et le texte.
   Retirer la ligne `<meta name="robots" content="noindex">`.
3. Dans `histoires/index.html`, copier un bloc `<article class="card">` en haut de la grille et l'adapter.
4. Ajouter l'adresse dans `sitemap.xml`.

## À compléter avant l'ouverture (surligné en jaune sur le site)

- CGV : médiateur de la consommation

- Vrais guides, produits, prix et photos (dossier `images/`)

## Après une modification de `assets/style.css` ou `assets/site.js`
Les pages appellent `style.css?v=17` : augmenter ce numéro dans toutes les pages (v=18, v=19…) force les téléphones à recharger le style.

## Code promo (bandeau en haut des pages)
- Réglage dans `build.py` : `PROMO = dict(code="BREIZH15", pct=15, fin="2026-11-17T23:59:59+01:00", fin_txt="17 novembre")`.
- Le bandeau et le champ « Code promo » de la boutique disparaissent tout seuls après la date de fin.
- Le code fait baisser le prix envoyé à PayPal, et le nom de l'article indique « code BREIZH15 (-15 %) » : vérifier ce libellé sur chaque commande.
- Pour supprimer la promo du code : `PROMO = None`, puis regénérer.
