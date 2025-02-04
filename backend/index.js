require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const verifyToken = require("./middlewares/verifyToken");

const app = express();
app.use(cors());
app.use(express.json());


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


// Route PUT pour modifier un revendeur
// PUT http://localhost:5000/revendeurs/:id
app.put("/revendeurs/:id", verifyToken, async (req, res) => {
    const { id } = req.params; // ID du revendeur à modifier
    const { nom, password } = req.body; // Nouveau nom et mot de passe

    // Vérification que l'utilisateur est bien le revendeur en question
    if (req.user.id !== parseInt(id)) {
        return res.status(403).json({ success: false, message: "Vous ne pouvez modifier que vos propres données." });
    }

    // Vérification des champs reçus
    if (!nom || !password) {
        return res.status(400).json({ success: false, message: "Nom et mot de passe sont requis." });
    }

    try {
        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Appel de la procédure stockée
        const sql = "CALL update_revendeur(?, ?, ?)";
        db.query(sql, [id, nom, hashedPassword], (err, results) => {
            if (err) {
                if (err.message === 'Le nom est déjà pris par un autre revendeur') {
                    return res.status(400).json({ success: false, message: err.message });
                }
                return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
            }

            res.json({ success: true, message: "Données du revendeur mises à jour avec succès." });
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour des données du revendeur :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// Route PUT pour modifier un produit
// PUT http://localhost:5000/produits/:id
app.put("/produits/:id", verifyToken, async (req, res) => {
    const { id } = req.params; // ID du produit à modifier
    const { nom, description, prix_achat, statut } = req.body; // Nouveaux champs du produit

    // Vérification que l'utilisateur est bien le revendeur en question
    if (req.user.id !== parseInt(id)) {
        return res.status(403).json({ success: false, message: "Vous ne pouvez modifier que vos propres produits." });
    }

    // Vérification que les champs nécessaires sont présents
    if (!nom || !description || !prix_achat || !statut) {
        return res.status(400).json({ success: false, message: "Tous les champs sont requis (nom, description, prix_achat, statut)." });
    }

    // Vérification de la validité du statut
    if (statut !== 'DISPONIBLE' && statut !== 'EN RUPTURE') {
        return res.status(400).json({ success: false, message: "Le statut doit être 'DISPONIBLE' ou 'EN RUPTURE'." });
    }

    try {
        // Appel de la procédure stockée
        const sql = "CALL update_produit(?, ?, ?, ?, ?)";
        db.query(sql, [id, nom, description, prix_achat, statut], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
            }

            // Si la procédure n'a affecté aucune ligne, cela signifie que le produit n'a pas été trouvé
            if (results.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Produit non trouvé." });
            }

            res.json({ success: true, message: "Produit mis à jour avec succès." });
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du produit :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});


// Route DELETE pour supprimer un revendeur
// DELETE http://localhost:5000/revendeurs/:id
app.delete("/revendeurs/:id", verifyToken, async (req, res) => {
    const { id } = req.params; // ID du revendeur à supprimer

    try {
        // Appel de la procédure stockée pour supprimer le revendeur
        const sql = "CALL delete_revendeur(?)";
        db.query(sql, [id], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
            }

            // Si la procédure n'a affecté aucune ligne, cela signifie que le revendeur n'a pas été trouvé
            if (results.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Revendeur non trouvé." });
            }

            res.json({ success: true, message: "Revendeur et ses produits supprimés avec succès." });
        });
    } catch (error) {
        console.error("Erreur lors de la suppression du revendeur :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// Route POST : Pour créer un produit / revendeurs
// http://localhost:5000/create-produit
app.post("/create-produit", verifyToken, async (req, res) => {
    const { nom, description, prix_achat, statut, nom_revendeur, password } = req.body;

    if(nom_revendeur) {
        if(!password) {
            return res.status(400).json({ success: false, message: "Le mot de passe est requis." });
        }
    }

    if (!nom || !description || !prix_achat || !statut) {
        return res.status(400).json({ success: false, message: "Tous les champs sont requis." });
    }

    try {
        let hashedPassword;
        if(nom_revendeur && password) {
        // Hachage du mot de passe
            hashedPassword = await bcrypt.hash(password, 10);
        }
        

        const sql = "CALL create_produit(?, ?, ?, ?, ?, ?)";

        db.query(sql, [nom, description, prix_achat, statut, nom_revendeur, hashedPassword], async (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
            }
     
         res.json({ success: true, message: "Produit créé avec succès.", token });
                });
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

// Route pour récupérer uniquement les produits de système (GamEZ)
// GET http://localhost:5000/produits_gamez
app.get("/produits_gamez", async (req, res) => {
    try {
        const sql = "CALL produits_gamez()";

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


// Route pour récupérer uniquement les produits de système (MEDIDONC)
// GET http://localhost:5000/produits_medidonc
app.get("/produits_medidonc", async (req, res) => {
    try {
        const sql = "CALL produits_medidonc()";

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


app.get("/verifyToken", verifyToken, (req, res) => {
    res.json({ success: true, message: "Token valide." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));