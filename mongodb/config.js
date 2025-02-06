const mysql = require("mysql");
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const mysqlConnection = mysql.createConnection({
    host: process.env.MYSQL_DB_HOST,
    port: process.env.MYSQL_DB_PORT,
    user: process.env.MYSQL_DB_USER,
    password: process.env.MYSQL_DB_PASSWORD,
    database: process.env.MYSQL_DB_NAME,
});

mysqlConnection.connect(err => {
    if (err) {
        console.error("Erreur de connexion à MySQL :", err);
        process.exit(1); // Arrête le serveur en cas d'erreur critique
    } else {
        console.log("✅ Connecté à MySQL !");
    }
});

const mongoClient = new MongoClient(process.env.MONGO_DB_URL);

module.exports = { mysqlConnection, mongoClient };