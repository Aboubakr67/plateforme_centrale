DROP DATABASE IF EXISTS plateforme_centrale;
CREATE DATABASE plateforme_centrale;
USE plateforme_centrale;

CREATE TABLE `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `role` varchar(100) NOT NULL
) ENGINE=InnoDB;


CREATE TABLE `fournisseurs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `nom` varchar(100) NOT NULL,
  `password` varchar(255) NULL,
  `date_creation` TIMESTAMP NOT NULL,
  `date_modification` TIMESTAMP DEFAULT NULL,
  `id_user` int DEFAULT NULL,
  `code_acces` varchar(10) NOT NULL,
  FOREIGN KEY (`id_user`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

CREATE TABLE `categories` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `nom` varchar(100) NOT NULL,
  `date_creation` TIMESTAMP NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `produits` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `prix_achat` DECIMAL(10,2) NOT NULL,
  `statut` TINYINT(1) NOT NULL DEFAULT 1,
  `date_creation` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` TIMESTAMP DEFAULT NULL,
  `id_fournisseur` int NOT NULL,
  FOREIGN KEY (`id_fournisseur`) REFERENCES `fournisseurs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE `produits_categories` (
  `id_produit` int NOT NULL,
  `id_categorie` int NOT NULL,
  PRIMARY KEY (`id_produit`, `id_categorie`),
  FOREIGN KEY (`id_produit`) REFERENCES `produits`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_categorie`) REFERENCES `categories`(`id`)
) ENGINE=InnoDB;


-- Données d'exemple
INSERT INTO `users` (`role`) VALUES
('Admin'),
('Fournisseur');

INSERT INTO `fournisseurs` (`nom`, `password`, `date_creation`, `id_user`, `code_acces`) VALUES
('John Doe', '$2y$10$lMVBKmUR06RkmonDtrtxn.suRnUsGQNEqGvBJSzbYVaOBuzmhsO96', '2025-02-03', 2, '1234'),
('Alice Smith', '$2y$10$lMVBKmUR06RkmonDtrtxn.suRnUsGQNEqGvBJSzbYVaOBuzmhsO96', '2025-02-04', 2, '5678'),
('Bob Johnson', '$2y$10$lMVBKmUR06RkmonDtrtxn.suRnUsGQNEqGvBJSzbYVaOBuzmhsO96', '2025-02-04', 2, '9012');

INSERT INTO `categories` (`nom`, `date_creation`) VALUES
('Jeu de société', '2025-02-03'),
('Sport', '2025-02-03'),
('Accessoire', '2025-02-04'),
('Accessoire High Tech', '2025-02-04');

INSERT INTO `produits` (`nom`, `description`, `prix_achat`, `statut`, `date_creation`, `id_fournisseur`) VALUES
('Monopoly', 'Jeu de famille', 10.00, 1, '2025-02-03', 1),
('Gant de boxe', 'Gant pour taper', 8.00, 1, '2025-02-04', 1),
('Ordinateur HP', 'PC Portable 15 pouces', 750.99, 1, '2025-02-04', 3),
('Sac à dos', 'Sac à dos enfant', 12.99, 1, '2025-02-04', 2),
('Ecouteurs', 'Ecouteurs sans fil', 19.99, 1, '2025-02-04', 2);

INSERT INTO `produits_categories` (`id_produit`, `id_categorie`) VALUES
(1, 1),
(2, 2),
(2, 3);


---------------------------------------------------------------- Procédure ------------------------------------------------------------

DELIMITER //
CREATE PROCEDURE create_product(
  IN p_nom VARCHAR(255),
  IN p_description TEXT,
  IN p_prix_achat DECIMAL(10,2),
  IN p_statut TINYINT,
  IN p_fournisseur_nom VARCHAR(255),
  IN ids VARCHAR(255),
  IN p_code_acces VARCHAR(10)
)
BEGIN
  DECLARE v_fournisseur_id INT;
  DECLARE v_produit_id INT;



  -- Vérifier si le fournisseur existe déjà
  SELECT id INTO v_fournisseur_id FROM fournisseurs WHERE nom = p_fournisseur_nom;
  
  -- Si le fournisseur n'existe pas, l'insérer
  IF v_fournisseur_id IS NULL THEN
    INSERT INTO fournisseurs (nom, code_acces, id_user, date_creation) VALUES (p_fournisseur_nom, p_code_acces, 2, CURRENT_TIMESTAMP);
    SET v_fournisseur_id = LAST_INSERT_ID();
  END IF;

  -- Insérer le produit
  INSERT INTO produits (nom, description, prix_achat, statut, id_fournisseur)
  VALUES (p_nom, p_description, p_prix_achat, p_statut, v_fournisseur_id);

  -- Récupérer l'ID du produit inséré
  SET v_produit_id = LAST_INSERT_ID();

  -- Insérer les catégories associées
  SET @sql = CONCAT('INSERT INTO produits_categories (id_produit, id_categorie) 
                     SELECT ', v_produit_id, ', id FROM categories WHERE id IN (', ids, ')');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END //
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


-- Proceduré pour mettre à jour un fournisseur
DELIMITER $$
CREATE PROCEDURE update_fournisseur(
    IN p_id INT,
    IN p_nom VARCHAR(255),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE existingUser INT;

    -- Vérification si le nom est déjà pris par un autre revendeur
    SELECT COUNT(*) INTO existingUser 
    FROM fournisseurs 
    WHERE nom = p_nom AND id != p_id;


    IF existingUser > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le nom est déjà pris par un autre fournisseur';
    ELSE
        -- Mise à jour des données du revendeur
        UPDATE fournisseurs
        SET nom = p_nom,
            date_modification = CURRENT_TIMESTAMP
        WHERE id = p_id;

        IF p_password IS NOT NULL THEN
            UPDATE fournisseurs
            SET password = p_password,
                date_modification = CURRENT_TIMESTAMP
            WHERE id = p_id;
        END IF;

    END IF;
END $$
DELIMITER ;


-- Proceduré pour supprimer un fournisseur
DELIMITER $$
CREATE PROCEDURE delete_fournisseur(IN p_id INT)
BEGIN
    DECLARE existingFournisseur INT;

    -- Vérifier si le fournisseur existe
    SELECT COUNT(*) INTO existingFournisseur
    FROM fournisseurs
    WHERE id = p_id;

    IF existingFournisseur = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fournisseur non trouvé';
    ELSE
        -- Suppression du fournisseur (la contrainte ON DELETE CASCADE supprimera aussi les produits associés)
        DELETE FROM fournisseurs WHERE id = p_id;
    END IF;
END $$
DELIMITER ;



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
        f.date_creation AS fournisseur_date_creation
    FROM produits p
    JOIN produits_categories pc ON p.id = pc.id_produit
    JOIN categories c ON pc.id_categorie = c.id
    JOIN fournisseurs f ON p.id_fournisseur = f.id
    WHERE c.nom IN ('Jeu vidéo', 'Jeu de société');
END $$
DELIMITER ;


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
        f.date_creation AS fournisseur_date_creation
    FROM produits p
    JOIN produits_categories pc ON p.id = pc.id_produit
    JOIN categories c ON pc.id_categorie = c.id
    JOIN fournisseurs f ON p.id_fournisseur = f.id
    WHERE c.nom = 'Santé';
END $$
DELIMITER ;