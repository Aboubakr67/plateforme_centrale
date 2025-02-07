const { migrateData } = require("./controllers/migrationController");

const interval24hours = 24 * 60 * 60 * 1000; // 24 heures

const startMigration = async () => {
    const formattedDate = new Date().toLocaleString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    try {
        console.log(`Migration démarrée à ${formattedDate} le ${new Date().toLocaleDateString('fr-FR')}`);
        await migrateData();
        console.log("✅ Migration terminée avec succès !");
    } catch (error) {
        console.error("❌ Une erreur est survenue lors de la migration :", error);
    }
};

// Lancer immédiatement la migration
startMigration();

// Exécuter la migration à intervalles réguliers
setInterval(startMigration, interval24hours);
