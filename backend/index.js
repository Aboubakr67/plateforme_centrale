require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("Erreur de connexion à la base de données :", err);
        process.exit(1); // Arrête le serveur en cas d'erreur critique
    }
    console.log("✅ Connecté à MySQL !");
});


// Route POST : Pour se connecter
// http://localhost:5000/login
app.post("/login", async (req, res) => {
    const { nom, password } = req.body;

    if (!nom || !password) {
        return res.status(400).json({ success: false, message: "Nom et mot de passe requis." });
    }

    try {
        // Requête préparée pour éviter l'injection SQL
        const sql = "SELECT * FROM revendeurs WHERE nom = ?";
        
        // Exécution de la requête
        db.query(sql, [nom], async (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
            }

            // Si aucun utilisateur n'est trouvé avec le nom donné
            if (results.length === 0) {
                return res.status(401).json({ success: false, message: "Nom ou mot de passe incorrect." });
            }

            const user = results[0]; // On récupère l'utilisateur trouvé

            // Comparaison du mot de passe fourni avec celui haché dans la base de données
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                // Si les mots de passe ne correspondent pas
                return res.status(401).json({ success: false, message: "Nom ou mot de passe incorrect." });
            }

            // Si la connexion est réussie, on génère un token JWT
            const token = jwt.sign(
                { id: user.id, nom: user.nom }, 
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({ success: true, message: "Connexion réussie", token });
        });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// Route pour récupérer tous les produits
// GET http://localhost:5000/produits
app.get("/produits", async (req, res) => {
    try {
        const sql = "SELECT * FROM produits";

        db.query(sql, (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
            }
            res.json({ success: true, produits: results });
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// Route pour récupérer un produit par son ID
// GET http://localhost:5000/produits/:id
app.get("/produits/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const sql = "SELECT * FROM produits WHERE id = ?";

        db.query(sql, [id], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
            }

            // Vérification si un produit a été trouvé
            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "Produit non trouvé." });
            }

            res.json({ success: true, produit: results[0] });
        });
    } catch (error) {
        console.error("Erreur lors de la récupération du produit :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));