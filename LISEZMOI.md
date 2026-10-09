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
- Mentions légales : nom, adresse, SIRET
- CGV : régime de TVA, pays livrés, médiateur de la consommation
- Page « Mon histoire » : texte + photo
- Vrais guides, produits, prix et photos (dossier `images/`)

## Après une modification de `assets/style.css` ou `assets/site.js`
Les pages appellent `style.css?v=3` : augmenter ce numéro dans toutes les pages (v=4, v=5…) force les téléphones à recharger le style.
