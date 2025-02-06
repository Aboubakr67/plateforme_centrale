const { mysqlConnection, mongoClient } = require("./config");

async function transferData() {
    try { 
        mysqlConnection.query("CALL produits_sportsalut()", async (err, results) => {
            if (err) {
                console.error("Erreur lors du call de la procédure:", err);
                return;
            }

            const produits = results[0];

            try {
                await mongoClient.connect();
                console.log("Connecté à MongoDB");

                const db = mongoClient.db(process.env.MONGO_DB_NAME);
                const collection = db.collection("sportsalut");

                await collection.insertMany(produits);
                console.log("Données insérées dans MongoDB avec succès");

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
