const { mongoClient } = require("../config");

const insertData = async (collectionName, data) => {
    try {
        await mongoClient.connect();
        const db = mongoClient.db(process.env.MONGO_DB_NAME);
        const collection = db.collection(collectionName);

        for (const item of data) {
            try {
                await collection.insertOne(item);
                console.log(`✅ ${collectionName}: Inséré ${item._id}: ${item.nom_produit || item.product?.product_name || item.p_name}`);
            } catch (error) {
                if (error.code === 11000) { // Duplicate key error (MongoDB)
                    return;
                } else {
                    throw error;
                }
            }
        }
    } catch (error) {
        console.error(`❌ Erreur lors de l'insertion dans ${collectionName}:`, error);
    } finally {
        await mongoClient.close();
    }
};

module.exports = { insertData };
