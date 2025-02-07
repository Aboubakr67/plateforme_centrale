const getCurrentDate = () => {
    return new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
};

const mapProduitsSportSalut = (produits) => {
    return produits.map(produit => ({
        _id: produit.id,
        nom_produit: produit.nom,
        description_produit: produit.description,
        nom_fournisseur: produit.user_nom,
        en_stock: produit.statut === 1 ? 'Oui' : 'Non',
        prix: parseFloat(produit.prix_achat)
    }));
};

const mapProduitsGamez = (produits) => {
    return produits.map(produit => ({
        _id: produit.produit_id,
        product: {
            product_name: produit.produit_nom,
            product_description: produit.description,
            product_price: parseFloat(produit.prix_achat) * 1.15, // Prix avec +15%
            product_status: produit.statut === 1 ? 'available' : 'unavailable'
        },
        seller: {
            seller_name: produit.user_nom,
            seller_creation_date: getCurrentDate()
        }
    }));
};

const mapProduitsMedidonc = (produits) => {
    return produits.map(produit => ({
        _id: produit.produit_id,
        p_name: produit.produit_nom,
        p_description: produit.description,
        p_last_update: new Date().toISOString().slice(0, 19).replace('T', ' '), // Format YYYY-MM-DD HH:MM:SS
        p_status: produit.statut === 1 ? 'En stock' : 'Rupture de stock',
        p_seller: JSON.stringify({
            id: produit.user_id,
            name: produit.user_nom,
            creation_date: getCurrentDate()
        })
    }));
};

module.exports = { mapProduitsSportSalut, mapProduitsMedidonc, mapProduitsGamez };
