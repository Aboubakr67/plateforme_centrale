-- Script Aboubakr de test connexion
CREATE TABLE revendeurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


INSERT INTO revendeurs (nom, password)
VALUES 
    ('John Doe', '$2y$10$LyVQzlcOgovjujlfLa7e3eS5ign0SbNGjUTFIdemaejXj5Qg5xls6'),  -- 'password' haché
    ('Alice Smith', '$2y$10$LyVQzlcOgovjujlfLa7e3eS5ign0SbNGjUTFIdemaejXj5Qg5xls6'),  -- 'password' haché
    ('Bob Johnson', '$2y$10$LyVQzlcOgovjujlfLa7e3eS5ign0SbNGjUTFIdemaejXj5Qg5xls6');  -- 'password' haché

----------------------------------------------------------------------------

-- Proceduré pour mettre à jour un revendeur
DELIMITER $$
CREATE PROCEDURE update_revendeur(
    IN p_id INT,
    IN p_nom VARCHAR(255),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE existingUser INT;

    -- Vérification si le nom est déjà pris par un autre revendeur
    SELECT COUNT(*) INTO existingUser 
    FROM revendeurs 
    WHERE nom = p_nom AND id != p_id;


    IF existingUser > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le nom est déjà pris par un autre revendeur';
    ELSE
        -- Mise à jour des données du revendeur
        UPDATE revendeurs
        SET nom = p_nom,
            password = p_password,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_id;
    END IF;
END $$
DELIMITER ;



-- Procedure pour mettre à jour un produit
DELIMITER $$
CREATE PROCEDURE update_produit(
    IN p_id INT,
    IN p_nom VARCHAR(255),
    IN p_description TEXT,
    IN p_prix_achat DECIMAL(10, 2),
    IN p_statut TINYINT
)
BEGIN
    DECLARE existingProduit INT;

    -- Vérification si le produit existe
    SELECT COUNT(*) INTO existingProduit
    FROM produits
    WHERE id = p_id;

    IF existingProduit = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produit non trouvé';
    ELSE
        -- Mise à jour du produit
        UPDATE produits
        SET 
            nom = p_nom,
            description = p_description,
            prix_achat = p_prix_achat,
            statut = p_statut,
            date_modification = CURRENT_TIMESTAMP
        WHERE id = p_id;
    END IF;
END $$
DELIMITER ;


-- Proceduré pour supprimer un revendeur
DELIMITER $$
CREATE PROCEDURE delete_revendeur(IN p_id INT)
BEGIN
    DECLARE existingRevendeur INT;

    -- Vérifier si le revendeur existe
    SELECT COUNT(*) INTO existingRevendeur
    FROM revendeurs
    WHERE id = p_id;

    IF existingRevendeur = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Revendeur non trouvé';
    ELSE
        -- Suppression du revendeur (la contrainte ON DELETE CASCADE supprimera aussi les produits associés)
        DELETE FROM revendeurs WHERE id = p_id;
    END IF;
END $$
DELIMITER ;


-- Procédure Marevan pour récupérer les produits de sport

DELIMITER $$

CREATE PROCEDURE produits_sportsalut()
BEGIN
    SELECT p.id, p.nom, p.description, p.prix_achat, p.statut, f.id AS fournisseur_id, f.nom AS fournisseur_nom
    FROM produits p
    JOIN produits_categories pc ON p.id = pc.id_produit
    JOIN categories c ON pc.id_categorie = c.id
    JOIN fournisseurs f ON p.id_fournisseur = f.id
    WHERE c.nom = 'Sport';
END $$

DELIMITER ;

CALL produits_sportsalut();


-- Procédure Marevan pour récupérer les jeux vidéos et jeux de plateaux

DELIMITER $$
CREATE PROCEDURE produits_gamez()
BEGIN
    SELECT 
        p.id AS produit_id,
        p.nom AS produit_nom,
        p.description,
        p.prix_achat,
        p.statut,
        f.id AS fournisseur_id,
        f.nom AS fournisseur_nom,
        f.date_création AS fournisseur_date_creation
    FROM produits p
    JOIN produits_categories pc ON p.id = pc.id_produit
    JOIN categories c ON pc.id_categorie = c.id
    JOIN fournisseurs f ON p.id_fournisseur = f.id
    WHERE c.nom IN ('Jeu vidéo', 'Jeu de société');
END $$
DELIMITER ;

CALL produits_gamez();


-- Procédure Marevan pour récupérer les produits de santé

DELIMITER $$

CREATE PROCEDURE produits_medidonc()
BEGIN
    SELECT 
        p.id AS produit_id,
        p.nom AS produit_nom,
        p.description,
        p.date_modification,
        p.statut,
        p.prix_achat,
        f.id AS fournisseur_id,
        f.nom AS fournisseur_nom,
        f.date_création AS fournisseur_date_creation
    FROM produits p
    JOIN produits_categories pc ON p.id = pc.id_produit
    JOIN categories c ON pc.id_categorie = c.id
    JOIN fournisseurs f ON p.id_fournisseur = f.id
    WHERE c.nom = 'Santé';
END $$

DELIMITER ;

CALL produits_medidonc();