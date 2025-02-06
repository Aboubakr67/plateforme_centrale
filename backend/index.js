import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mysql from "mysql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import verifyToken from "./middlewares/verifyToken.js";


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
        return res.status(400).json({ 
            success: false, 
            message: "Nom et mot de passe requis." 
        });
    }

    try {
        const sql = "SELECT * FROM users WHERE nom = ?";
        
        db.query(sql, [nom], async (err, results) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: "Erreur serveur", 
                    error: err 
                });
            }

            if (results.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: "Nom ou mot de passe incorrect." 
                });
            }

            const user = results[0];

            console.log(user);

            if(!user.password) {
                if(user.code_acces !== password) {
                    return res.status(401).json({ 
                        success: false, 
                        message: "Nom ou mot de passe incorrect." 
                    });
                }
            } else {
                let isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ 
                        success: false, 
                        message: "Nom ou mot de passe incorrect." 
                    });
                }
            }       
            

            const token = jwt.sign(
                { id: user.id, nom: user.nom, role: user.id_role === 1 ? "admin" : "revendeur" }, 
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.header("Authorization", `Bearer ${token}`);
            res.json({ 
                success: true, 
                message: "Connexion réussie",
                token: token // Ajout du token dans le corps de la réponse
            });
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
// PUT http://localhost:5000/fournisseurs/:id
app.put("/fournisseurs/:id", verifyToken, async (req, res) => {
    const { id } = req.params; // ID du revendeur à modifier
    const { nom, password } = req.body; // Nouveau nom et mot de passe

    // Vérification que l'utilisateur est bien le revendeur en question
    if (req.user.id !== parseInt(id) || req.user.id_role !== 1) {
        return res.status(403).json({ success: false, message: "Vous ne pouvez modifier que vos propres données." });
    }

    // Vérification des champs reçus
    if (!nom) {
        return res.status(400).json({ success: false, message: "Nom requis." });
    }

    try {
        let hashedPassword = '';
        if(password) {
            // Hachage du mot de passe
        hashedPassword = await bcrypt.hash(password, 10);
        }

        // Appel de la procédure stockée
        const sql = "CALL update_user(?, ?, ?)";
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


    const sql = "SELECT id_user FROM PRODUITS WHERE id = ?";

    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Produit non trouvé." });
        }

        const userId = results[0].id_user;

        if (userId !== req.user.id && req.user.id_role !== 1) {
            return res.status(403).json({ success: false, message: "Vous ne pouvez modifier que vos propres produits." });
        }
    });


    // Vérification que les champs nécessaires sont présents
    if (!nom || !description || !prix_achat || !statut) {
        return res.status(400).json({ success: false, message: "Tous les champs sont requis (nom, description, prix_achat, statut)." });
    }

    // Vérification de la validité du statut
    if (statut !== '1' && statut !== '0') {
        return res.status(400).json({ success: false, message: "Le statut doit être '1' pour DISPONIBLE ou '0' pour EN RUPTURE." });
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


// Route DELETE pour supprimer un fournisseur
// DELETE http://localhost:5000/fournisseurs/:id
app.delete("/fournisseurs/:id", verifyToken, async (req, res) => {
    const { id } = req.params; // ID du fournisseur à supprimer

    try {
        // Appel de la procédure stockée pour supprimer le fournisseur
        const sql = "CALL delete_fournisseur(?)";
        db.query(sql, [id], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
            }

            // Si la procédure n'a affecté aucune ligne, cela signifie que le fournisseur n'a pas été trouvé
            if (results.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Fournisseur non trouvé." });
            }

            res.json({ success: true, message: "Fournisseur et ses produits supprimés avec succès." });
        });
    } catch (error) {
        console.error("Erreur lors de la suppression du fournisseur :", error);
        return res.status(500).json({ success: false, message: "Erreur interne serveur", error: error.message });
    }
});

// Route POST : Pour créer un produit / fournisseurs
// http://localhost:5000/create-produit
app.post("/create-produit", verifyToken, async (req, res) => {
    const { nom, description, prix_achat, statut, nom_fournisseur, tabIdCategories } = req.body;

    if(req.user.id_role !== 1) {
        return res.status(403).json({ success: false, message: "Vous ne pouvez pas créer un produit." });
    }

    if (!nom || !description || !prix_achat || !statut || !tabIdCategories || !nom_fournisseur) {
        return res.status(400).json({ success: false, message: "Tous les champs sont requis." });
    }

    try {

        const accessCode = generateAccessCode();
    
        const sql = "CALL create_product(?, ?, ?, ?, ?, ?, ?)";

        db.query(sql, [nom, description, prix_achat, statut, nom_fournisseur, tabIdCategories, accessCode], async (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Erreur serveur", error: err });
            }
     
         res.json({ success: true, message: "Produit créé avec succès."});
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
            res.json({ success: true, produits: results[0] });
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
            res.json({ success: true, produits: results[0] });
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
            res.json({ success: true, produits: results[0] });
        });
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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));