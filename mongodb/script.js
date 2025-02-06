const { mysqlConnection, mongoClient } = require("./config");

async function transferData() {
    try {
        mysqlConnection.connect(err => {
            if (err) {
                console.error("Erreur de connexion MySQL:", err);
                return;
            }
            console.log("Connecté à MySQL");
            
            mysqlConnection.query("CALL produits_sportsalut()", async (err, results) => {
                if (err) {
                    console.error("Erreur lors du call de la procédure:", err);
                    return;
                }

                const produits = results[0];

                try {
                    // Se connecter à MongoDB et insérer les données
                } catch {
                
                }
            });
        });
    } catch (error) {
        console.error("Erreur :", error);
    } finally {
        mysqlConnection.end();
        console.log("Connexion MySQL fermée");
    }
}

transferData();
