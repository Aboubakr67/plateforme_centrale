const { executeProcedure } = require("../services/mysqlService");
const { insertData } = require("../services/mongoService");
const { mapProduitsSportSalut, mapProduitsGamez, mapProduitsMedidonc } = require("../dataMapper");

const migrateData = async () => {
    try {
        console.log("Début de la migration des données");

        // Migration SPORT SALUT
        const sportsData = await executeProcedure("produits_sportsalut");
        const mappedSportsData = mapProduitsSportSalut(sportsData);
        if (mappedSportsData.length > 0) {
            await insertData("sport_salut", mappedSportsData);
        } else {
            console.log("Aucun produit SportSalut à migrer.");
        }

        // Migration GamEZ
        const gamezData = await executeProcedure("produits_gamez");
        const mappedGamezData = mapProduitsGamez(gamezData);
        if (mappedGamezData.length > 0) {
            await insertData("gamez", mappedGamezData);
        } else {
            console.log("Aucun produit Gamez à migrer.");
        }

        // Migration MEDIDONC
        const medidoncData = await executeProcedure("produits_medidonc");
        const mappedMedidoncData = mapProduitsMedidonc(medidoncData);
        if (mappedMedidoncData.length > 0) {
            await insertData("medidonc", mappedMedidoncData);
        } else {
            console.log("Aucun produit MediDonc à migrer.");
        }

        console.log("Migration terminée");
    } catch (error) {
        console.error("Erreur lors de la migration :", error);
    }
};

module.exports = { migrateData };
