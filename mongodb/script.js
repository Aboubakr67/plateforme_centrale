const { mysqlConnection, mongoClient } = require("./config");
const { transformerProduits, filtrerNouveauxProduits } = require("./fonction");

async function transferData() {
    try { 
        mysqlConnection.query("CALL produits_sportsalut()", async (err, results) => {
            if (err) {
                console.error("Erreur lors du call de la procédure:", err);
                return;
            }

            const produits = results[0];
            const produitsTransformes = transformerProduits(produits);

            console.log(produits);
            
            try {
                await mongoClient.connect();
                console.log("Connecté à MongoDB");

                const db = mongoClient.db(process.env.MONGO_DB_NAME);
                const collection = db.collection("sport_salut");
                const documents = await collection.find({}).toArray();
                
                const produitsExistants = documents[0].produits || [];
                const { nouveauxProduits, produitsExistants: produitsDejaPresents } = 
                    filtrerNouveauxProduits(produitsTransformes, produitsExistants);

                // Log des produits existants
                if (produitsDejaPresents.length > 0) {
                    console.log("Produits déjà présents dans la base :");
                    produitsDejaPresents.forEach(produit => {
                        console.log(`- ${produit.nom_produit}`);
                    });
                }

                // Insertion des nouveaux produits
                if (nouveauxProduits.length > 0) {
                    await collection.updateOne(
                        { _id: documents[0]._id },
                        { $push: { produits: { $each: nouveauxProduits } } }
                    );
                    console.log(`${nouveauxProduits.length} nouveaux produits ajoutés :`);
                    nouveauxProduits.forEach(produit => {
                        console.log(`- ${produit.nom_produit}`);
                    });
                } else {
                    console.log("Aucun nouveau produit à ajouter");
                }
                
            } catch (error) {
                console.error("Erreur MongoDB:", error);
            } finally {
                await mongoClient.close();
                console.log("Connexion MongoDB fermée");
            }
        });
    } catch (error) {
        console.error("Erreur :", error);
    }
}

transferData();
