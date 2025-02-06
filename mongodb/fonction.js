function transformerProduits(produits) {
    return produits.map(produit => ({
        nom_produit: produit.nom,
        description_produit: produit.description,
        nom_fournisseur: produit.fournisseur_nom,
        en_stock: produit.statut === 1 ? 'Oui' : 'Non',
        prix: parseFloat(produit.prix_achat)
    }));
}

function filtrerNouveauxProduits(produitsTransformes, produitsExistants) {
    const resultats = {
        nouveauxProduits: [],
        produitsExistants: []
    };

    produitsTransformes.forEach(nouveauProduit => {
        const existe = produitsExistants.some(produitExistant => 
            produitExistant.nom_produit === nouveauProduit.nom_produit &&
            produitExistant.description_produit === nouveauProduit.description_produit
        );

        if (existe) {
            resultats.produitsExistants.push(nouveauProduit);
        } else {
            resultats.nouveauxProduits.push(nouveauProduit);
        }
    });

    return resultats;
}

module.exports = { transformerProduits, filtrerNouveauxProduits };
