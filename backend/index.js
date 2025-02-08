import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mysql from "mysql2";
// import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import verifyToken from "./middlewares/verifyToken.js";


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// const db = mysql.createConnection({
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
// });

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// Vérifier la connexion une fois au démarrage
async function checkConnection() {
    try {
        const connection = await db.getConnection();
        connection.release();
        console.log("✅ Connecté à MySQL !");
    } catch (err) {
        console.error("❌ Erreur de connexion à MySQL :", err);
        process.exit(1);
    }
}

checkConnection();


app.post("/login", async (req, res) => {
    const { nom, password } = req.body;
    
    if (!nom || !password) {
        return res.status(400).json({ 
            success: false, 
            message: "Nom et mot de passe requis." 
        });
    }

    try {
        const sql = "SELECT * FROM users WHERE nom = ?";
        const [results] = await db.query(sql, [nom]);

        if (results.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: "Nom ou mot de passe incorrect." 
            });
        }

        const user = results[0];

        // Vérifier le mot de passe
        if (!user.password) {
            if (user.code_acces !== password) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Nom ou mot de passe incorrect." 
                });
            }
        } else {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Nom ou mot de passe incorrect." 
                });
            }
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: user.id, nom: user.nom, role: user.id_role === 1 ? "admin" : "revendeur" }, 
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.header("Authorization", `Bearer ${token}`);
        res.json({ 
            success: true, 
            message: "Connexion réussie",
            token: token // Ajout du token dans la réponse
        });

    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        res.status(500).json({ 
            success: false, 
            message: "Erreur interne serveur", 
            error: error.message 
        });
    }
});


// Route pour récupérer tous les produits
// GET http://localhost:5000/produits
app.get("/produits", async (req, res) => {
    try {
        const sql = "SELECT * FROM produits";
        const [results] = await db.query(sql);

        res.json({ success: true, produits: results });
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
        return res.status(500).json({ 
            success: false, 
            message: "Erreur interne serveur", 
            error: error.message 
        });
    }
});

// Route pour récupérer un produit par son ID
// GET http://localhost:5000/produits/:id
app.get("/produits/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const sql = "SELECT * FROM produits WHERE id = ?";
        const [results] = await db.query(sql, [id]); 

        // Vérification si un produit a été trouvé
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Produit non trouvé." });
        }

        res.json({ success: true, produit: results[0] });
    } catch (error) {
        console.error("Erreur lors de la récupération du produit :", error);
        return res.status(500).json({ 
            success: false, 
            message: "Erreur interne serveur", 
            error: error.message 
        });
    }
});



// Route PUT pour modifier un revendeur
// PUT http://localhost:5000/fournisseurs/:id
app.put("/fournisseurs/:id", verifyToken, async (req, res) => {
    const { id } = req.params; // ID du revendeur à modifier
    const { nom, password } = req.body; // Nouveau nom et mot de passe

    // Vérification que l'utilisateur est bien le revendeur en question ou un admin
    if (req.user.id !== parseInt(id) && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Vous ne pouvez modifier que vos propres données." });
    }

    // Vérification des champs reçus
    if (!nom) {
        return res.status(400).json({ success: false, message: "Nom requis." });
    }

    try {
        let hashedPassword = "";
        if (password) {
            // Hachage du mot de passe
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Appel de la procédure stockée avec mysql2/promise
        const sql = "CALL update_user(?, ?, ?)";
        await db.query(sql, [id, nom, hashedPassword]); // ✅ Suppression de la callback

        res.json({ success: true, message: "Données du revendeur mises à jour avec succès." });
    } catch (error) {
        console.error("Erreur lors de la mise à jour des données du revendeur :", error);

        if (error.message.includes("Le nom est déjà pris par un autre revendeur")) {
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});


// Route PUT pour modifier un produit
// PUT http://localhost:5000/produits/:id
app.put("/produits/:id", verifyToken, async (req, res) => {
    const { id } = req.params; // ID du produit à modifier
    const { nom, description, prix_achat, statut } = req.body; // Nouveaux champs du produit

    // Vérification que les champs nécessaires sont présents
    if (!nom || !description || !prix_achat || !statut) {
        return res.status(400).json({ 
            success: false, 
            message: "Tous les champs sont requis (nom, description, prix_achat, statut)." 
        });
    }

    // Vérification de la validité du statut
    if (statut !== '1' && statut !== '0') {
        return res.status(400).json({ 
            success: false, 
            message: "Le statut doit être '1' pour DISPONIBLE ou '0' pour EN RUPTURE." 
        });
    }

    try {
        // Vérification de l'existence du produit et récupération de l'utilisateur propriétaire
        const [results] = await db.query("SELECT id_user FROM PRODUITS WHERE id = ?", [id]);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Produit non trouvé." });
        }

        const userId = results[0].id_user;

        // Vérification des permissions
        if (userId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Vous ne pouvez modifier que vos propres produits." });
        }

        // Appel de la procédure stockée
        const sql = "CALL update_produit(?, ?, ?, ?, ?)";
        const [updateResult] = await db.query(sql, [id, nom, description, prix_achat, statut]);

        // Vérification si un produit a bien été mis à jour
        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Produit non trouvé." });
        }

        res.json({ success: true, message: "Produit mis à jour avec succès." });

    } catch (error) {
        console.error("Erreur lors de la mise à jour du produit :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});



// Route DELETE pour supprimer un fournisseur
// DELETE http://localhost:5000/fournisseurs/:id
app.delete("/fournisseurs/:id", verifyToken, async (req, res) => {
    const { id } = req.params; // ID du fournisseur à supprimer

    try {
        // Appel de la procédure stockée pour supprimer le fournisseur
        const sql = "CALL delete_user(?)";
        const [results] = await db.query(sql, [id]);

        // Vérification si un fournisseur a bien été supprimé
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Fournisseur non trouvé." });
        }

        res.json({ success: true, message: "Fournisseur et ses produits supprimés avec succès." });

    } catch (error) {
        console.error("Erreur lors de la suppression du fournisseur :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// Route POST : Pour créer un produit / fournisseurs
// http://localhost:5000/create-produit
app.post("/create-produit", verifyToken, async (req, res) => {
    const { nom, description, prix_achat, statut, nom_fournisseur, tabNomCategories } = req.body;
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Vous ne pouvez pas créer un produit." });
    }

    if (!nom || !description || !prix_achat || !statut || !tabNomCategories || !nom_fournisseur) {
        return res.status(400).json({ success: false, message: "Tous les champs sont requis." });
    }

    if (!Array.isArray(tabNomCategories) || tabNomCategories.length === 0) {
        return res.status(400).json({ success: false, message: "Le tableau des catégories est invalide." });
    }

    try {
        const tabIdCategories = await getCategories(tabNomCategories);
        const tabIdCategoriesString = tabIdCategories.join(',');

        const accessCode = generateAccessCode();

        // Debugging logs
        console.log({
            nom,
            description,
            prix_achat,
            statut,
            nom_fournisseur,
            tabIdCategoriesString,
            accessCode
        });

        const sql = "CALL create_product(?, ?, ?, ?, ?, ?, ?)";
        const [results] = await db.query(sql, [nom, description, prix_achat, statut, nom_fournisseur, tabIdCategoriesString, accessCode]);

        res.json({ success: true, message: "Produit créé avec succès." });

    } catch (error) {
        console.error("Erreur lors de la création du produit :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// Route pour récupérer uniquement les produits de sport (Sport Salut)
// GET http://localhost:5000/produits_sportsalut
app.get("/produits_sportsalut", async (req, res) => {
    try {
        const sql = "CALL produits_sportsalut()";
        const [results] = await db.query(sql);
        res.json({ success: true, produits: results[0] });
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// Route pour récupérer uniquement les produits de système (GamEZ)
// GET http://localhost:5000/produits_gamez
app.get("/produits_gamez", async (req, res) => {
    try {
        const sql = "CALL produits_gamez()";
        const [results] = await db.query(sql);
        res.json({ success: true, produits: results[0] });
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});


// Route pour récupérer uniquement les produits de système (MEDIDONC)
// GET http://localhost:5000/produits_medidonc
app.get("/produits_medidonc", async (req, res) => {
    try {
        const sql = "CALL produits_medidonc()";
        const [results] = await db.query(sql);
        res.json({ success: true, produits: results[0] });
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});


app.get("/verifyToken", verifyToken, (req, res) => {
    res.json({ success: true, message: "Token valide." });
});

// Fonction pour générer un code aléatoire de 10 caractères
const generateAccessCode = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }

    return code;
};

// Route GET : Pour récupérer tous les users (fournisseurs)
// GET http://localhost:5000/fournisseurs
app.get("/fournisseurs", async (req, res) => {
    try {
        const sql = "SELECT u.id, u.nom, u.date_creation, u.date_modification, u.code_acces FROM users u WHERE id_role = 2";
        const [results] = await db.query(sql);
        res.json({ success: true, users: results });
    } catch (error) {
        console.error("Erreur lors de la récupération des fournisseurs :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// Route GET : Pour récupérer tous les catégories
// GET http://localhost:5000/categories
app.get("/categories", async (req, res) => {
    try {
        const sql = "SELECT * FROM categories";
        const [results] = await db.query(sql);
        res.json({ success: true, categories: results });
    } catch (error) {
        console.error("Erreur lors de la récupération des catégories :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// ROUTE GET : Récupérer un user par son ID
// GET http://localhost:5000/fournisseurs/:id
app.get("/fournisseurs/:id", verifyToken, async (req, res) => {
    const { id } = req.params;

    if (req.user.id !== parseInt(id)) {
        return res.status(403).json({ success: false, message: "Ce n'est pas votre compte" });
    }

    try {
        const sql = "SELECT u.id, u.nom, u.date_creation, u.date_modification, u.code_acces FROM users u WHERE id = ?";
        const [results] = await db.query(sql, [id]);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user: results[0] });
    } catch (error) {
        console.error("Erreur lors de la récupération du fournisseur :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});


async function getCategories(tabNomCategories) {
    let tabIdCategories = [];

    if (!Array.isArray(tabNomCategories) || tabNomCategories.length === 0) {
        return tabIdCategories;
    }

    try {
        const queries = tabNomCategories.map(async (categoryName) => {
            const sql = "SELECT GetOrCreateCategory(?) AS id";
            const [rows] = await db.query(sql, [categoryName]);

            if (Array.isArray(rows) && rows.length > 0 && rows[0].id) {
                tabIdCategories.push(rows[0].id);
            } else {
                console.error(`⚠️ Problème lors de la récupération de l'ID pour : ${categoryName}`);
            }
        });

        await Promise.all(queries); // Exécute toutes les requêtes SQL en parallèle
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des catégories :", error);
    }

    return tabIdCategories;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));