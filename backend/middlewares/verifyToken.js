const jwt = require("jsonwebtoken");

// Middleware pour vérifier l'authentification
const verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(403).json({ success: false, message: "Accès refusé. Token manquant." });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET); // Suppression du "Bearer "
        req.user = decoded; // Ajout des infos du user dans req
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token invalide ou expiré." });
    }
};

module.exports = verifyToken;