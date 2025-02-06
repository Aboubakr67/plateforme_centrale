const { mysqlConnection, mongoClient } = require("./config");
const { transformerProduits, insererProduits } = require("./fonction");

async function transferData() {
    try { 
        mysqlConnection.query("CALL produits_sportsalut()", async (err, results) => {
            if (err) {
                console.error("Erreur lors du call de la procédure:", err);
                return;
            }

            const produits = results[0];
            const produitsTransformes = transformerProduits(produits);
            
            try {
                await mongoClient.connect();
                console.log("Connecté à MongoDB");

                const db = mongoClient.db(process.env.MONGO_DB_NAME);
                const resultats = await insererProduits(db, produitsTransformes);
                
                // Afficher les résultats pour chaque collection
                Object.entries(resultats).forEach(([collection, resultat]) => {
                    if (resultat.success) {
                        console.log(`✅ ${resultat.message}`);
                    } else {
                        console.error(`❌ ${resultat.message}`);
                    }
                });

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
