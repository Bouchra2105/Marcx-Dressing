# Dossier images — Marcx Dressing

## Structure actuelle

```
images/
├── logo/                 → logo, badge de marque, favicon
└── catalogue/
    ├── jeans/             → photos des jeans (9 articles)
    └── tshirts/           → photos des t-shirts (11 articles)
```

Toutes les photos du catalogue sont désormais **tes vraies photos produits**, déjà en place. Le catalogue et la page d'accueil pointent vers `images/catalogue/jeans/...` et `images/catalogue/tshirts/...`.

## Ajouter un nouvel article

1. Prends une photo du produit (idéalement bien cadrée, fond neutre, 800–1200 px de large).
2. Enregistre-la en `.jpg` dans le bon sous-dossier :
   - un jean → `images/catalogue/jeans/nom-du-produit.jpg`
   - un t-shirt → `images/catalogue/tshirts/nom-du-produit.jpg`
3. Dans `catalogue.html`, duplique un bloc `<div class="produit" data-cat="jean">...</div>` (ou `data-cat="tshirt"`) existant, puis modifie :
   - le `src` de l'image
   - le `alt`
   - le nom du produit (`<h4>`)
   - le prix (`<span class="prix">`)
   - le lien WhatsApp de commande (change le texte après `text=Commande%20:%20`)
4. Le filtrage et la pagination se mettent à jour automatiquement — aucune autre modification n'est nécessaire.

## Remplacer une photo existante

Écrase simplement le fichier `.jpg` correspondant avec le même nom — la mise à jour est automatique sur le site, sans toucher au code.

## Pagination du catalogue

Le catalogue affiche **8 articles par page**. Ce nombre est réglable dans `script.js`, variable `PAGE_SIZE` (recherche `const PAGE_SIZE = 8;`).
