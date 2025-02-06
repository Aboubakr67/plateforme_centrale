function transformerProduits(produits) {
    return {
        sport_salut: produits.map(produit => ({
            nom_produit: produit.nom,
            description_produit: produit.description,
            nom_fournisseur: produit.fournisseur_nom,
            en_stock: produit.statut === 1 ? 'Oui' : 'Non',
            prix: parseFloat(produit.prix_achat)
        })),
        
        medidonc: produits.map(produit => ({
            p_name: produit.nom,
            p_description: produit.description,
            p_last_update: new Date().toISOString().slice(0, 19).replace('T', ' '),
            p_status: produit.statut === 1 ? 'En stock' : 'Rupture de stock',
            p_seller: JSON.stringify({
                id: produit.fournisseur_id,
                name: produit.fournisseur_nom,
                creation_date: "2024-01-12" // À adapter selon vos besoins
            })
        })),
        
        gamez: produits.map(produit => ({
            product: {
                product_name: produit.nom,
                product_description: produit.description,
                product_price: parseFloat(produit.prix_achat) * 1.15, // +15% par défaut
                product_status: produit.statut === 1 ? 'available' : 'unavailable'
            },
            seller: {
                seller_name: produit.fournisseur_nom,
                seller_creation_date: "2024-01-12" // À adapter selon vos besoins
            }
        }))
    };
}

function filtrerNouveauxProduits(produitsTransformes, produitsExistants, type) {
    const resultats = {
        nouveauxProduits: [],
        produitsExistants: []
    };

    const comparerProduits = (nouveau, existant) => {
        switch(type) {
            case 'sport_salut':
                return existant.nom_produit === nouveau.nom_produit &&
                       existant.description_produit === nouveau.description_produit;
            case 'medidonc':
                return existant.p_name === nouveau.p_name &&
                       existant.p_description === nouveau.p_description;
            case 'gamez':
                return existant.product.product_name === nouveau.product.product_name &&
                       existant.product.product_description === nouveau.product.product_description;
            default:
                return false;
        }
    };

    produitsTransformes.forEach(nouveauProduit => {
        const existe = produitsExistants.some(produitExistant => 
            comparerProduits(nouveauProduit, produitExistant)
        );

        if (existe) {
            resultats.produitsExistants.push(nouveauProduit);
        } else {
            resultats.nouveauxProduits.push(nouveauProduit);
        }
    });

    return resultats;
}

async function insererProduits(db, produitsTransformes) {
    const collections = {
        sport_salut: "sport_salut",
        medidonc: "medidonc",
        gamez: "gamez"
    };

    const resultats = {};

    for (const [type, collectionName] of Object.entries(collections)) {
        try {
            const collection = db.collection(collectionName);
            const documents = await collection.find({}).toArray();
            
            // Filtrer les nouveaux produits pour toutes les collections
            const produitsExistants = documents || [];
            const { nouveauxProduits } = filtrerNouveauxProduits(produitsTransformes[type], produitsExistants, type);
            
            if (nouveauxProduits.length > 0) {
                // Insertion directe pour toutes les collections
                await collection.insertMany(nouveauxProduits);
                resultats[type] = {
                    success: true,
                    message: `${nouveauxProduits.length} nouveaux produits insérés dans ${collectionName}`
                };
            } else {
                resultats[type] = {
                    success: true,
                    message: `Aucun nouveau produit à insérer dans ${collectionName}`
                };
            }
        } catch (error) {
            resultats[type] = {
                success: false,
                message: `Erreur lors de l'insertion dans ${collectionName}: ${error.message}`
            };
        }
    }

    return resultats;
}

module.exports = { transformerProduits, filtrerNouveauxProduits, insererProduits };
