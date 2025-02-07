DROP DATABASE IF EXISTS plateforme_centrale;
CREATE DATABASE plateforme_centrale;
USE plateforme_centrale;

CREATE TABLE `roles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `role` varchar(100) NOT NULL
) ENGINE=InnoDB;


CREATE TABLE `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `nom` varchar(100) NOT NULL,
  `password` varchar(255) NULL,
  `date_creation` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_role` int DEFAULT NULL,
  `code_acces` varchar(10) NOT NULL,
  FOREIGN KEY (`id_role`) REFERENCES `roles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE `categories` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `nom` varchar(100) NOT NULL,
  `date_creation` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `produits` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `prix_achat` DECIMAL(10,2) NOT NULL,
  `statut` TINYINT(1) NOT NULL DEFAULT 1,
  `date_creation` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `id_user` int NOT NULL,
  FOREIGN KEY (`id_user`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE `produits_categories` (
  `id_produit` int NOT NULL,
  `id_categorie` int NOT NULL,
  PRIMARY KEY (`id_produit`, `id_categorie`),
  FOREIGN KEY (`id_produit`) REFERENCES `produits`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_categorie`) REFERENCES `categories`(`id`)
) ENGINE=InnoDB;


INSERT INTO `roles` (`role`) VALUES
('Admin'),
('Fournisseur');

INSERT INTO `users` (`nom`, `password`, `date_creation`, `id_role`, `code_acces`) VALUES
('Admin', '$2y$10$lMVBKmUR06RkmonDtrtxn.suRnUsGQNEqGvBJSzbYVaOBuzmhsO96', '2025-02-04', 1, 'aQ67b45q'),
('John Doe', '$2y$10$lMVBKmUR06RkmonDtrtxn.suRnUsGQNEqGvBJSzbYVaOBuzmhsO96', '2025-02-03', 2, '1234'),
('Alice Smith', '$2y$10$lMVBKmUR06RkmonDtrtxn.suRnUsGQNEqGvBJSzbYVaOBuzmhsO96', '2025-02-04', 2, '5678'),
('Bob Johnson', '$2y$10$lMVBKmUR06RkmonDtrtxn.suRnUsGQNEqGvBJSzbYVaOBuzmhsO96', '2025-02-04', 2, '9012');
-- Mot de passe : password pour les 3 derniers utilisateurs

INSERT INTO `categories` (`nom`, `date_creation`) VALUES
('Jeu de société', '2025-02-03'),
('Sport', '2025-02-03'),
('Accessoire', '2025-02-04'),
('Accessoire High Tech', '2025-02-04');

INSERT INTO `produits` (`nom`, `description`, `prix_achat`, `statut`, `date_creation`, `id_user`) VALUES
('Monopoly', 'Jeu de famille', 10.00, 1, '2025-02-03', 2),
('Gant de boxe', 'Gant pour taper', 8.00, 1, '2025-02-04', 2),
('Crampon de football', 'Pour jouer au football', 28.00, 1, '2025-02-04', 2),
('Ordinateur HP', 'PC Portable 15 pouces', 750.99, 1, '2025-02-04', 3),
('Sac à dos', 'Sac à dos enfant', 12.99, 1, '2025-02-04', 4),
('Ecouteurs', 'Ecouteurs sans fil', 19.99, 1, '2025-02-04', 4);

INSERT INTO `produits_categories` (`id_produit`, `id_categorie`) VALUES
(1, 1),
(2, 2),
(3, 2),
(2, 3),
(5, 4);



DELIMITER //
CREATE PROCEDURE create_product(
  IN p_nom VARCHAR(255),
  IN p_description TEXT,
  IN p_prix_achat DECIMAL(10,2),
  IN p_statut TINYINT,
  IN p_user_nom VARCHAR(255),
  IN ids VARCHAR(255),
  IN p_code_acces VARCHAR(10)
)
BEGIN
  DECLARE v_user_id INT;
  DECLARE v_produit_id INT;

  -- ✅ Commence une transaction
  START TRANSACTION;

  -- Vérifier si l'utilisateur existe déjà
  SELECT id INTO v_user_id FROM users WHERE nom = p_user_nom;
  
  -- Si l'user n'existe pas, l'insérer
  IF v_user_id IS NULL THEN
    INSERT INTO users (nom, date_creation, id_role, code_acces) VALUES (p_user_nom, CURRENT_TIMESTAMP, 2, p_code_acces);
    SET v_user_id = LAST_INSERT_ID();
  END IF;

  -- Insérer le produit
  INSERT INTO produits (nom, description, prix_achat, statut, id_user)
  VALUES (p_nom, p_description, p_prix_achat, p_statut, v_user_id);

  -- Récupérer l'ID du produit inséré
  SET v_produit_id = LAST_INSERT_ID();

  -- Insérer les catégories associées
  SET @sql = CONCAT('INSERT INTO produits_categories (id_produit, id_categorie) 
                     SELECT ', v_produit_id, ', id FROM categories WHERE id IN (', ids, ')');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

  -- ✅ Valide la transaction
  COMMIT;

  -- ✅ Renvoie un message de confirmation
  SELECT 'Produit inséré avec succès' AS message;
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


-- Proceduré pour mettre à jour un user
DELIMITER $$ 
CREATE PROCEDURE update_user(
    IN p_id INT,
    IN p_nom VARCHAR(255),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE existingUser INT;

    -- Vérifier si le nom est déjà pris
    SELECT COUNT(*) INTO existingUser 
    FROM users 
    WHERE nom = p_nom AND id != p_id;

    IF existingUser > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le nom est déjà pris par un autre utilisateur';
    ELSE
        -- Mise à jour des données du user
        UPDATE users
        SET nom = p_nom,
            password = COALESCE(p_password, password),
            date_modification = CURRENT_TIMESTAMP
        WHERE id = p_id;
    END IF;
END $$ 
DELIMITER ;



-- Proceduré pour supprimer un user (fournisseur)
DELIMITER $$
CREATE PROCEDURE delete_user(IN p_id INT)
BEGIN
    DECLARE existingUser INT;

    -- Vérifier si le user existe
    SELECT COUNT(*) INTO existingUser
    FROM users
    WHERE id = p_id;

    IF existingUser = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User non trouvé';
    ELSE
        -- Suppression du user
        DELETE FROM users WHERE id = p_id;
    END IF;
END $$
DELIMITER ;


DELIMITER $$
CREATE PROCEDURE produits_sportsalut()
BEGIN
    SELECT p.id, p.nom, p.description, p.prix_achat, p.statut, u.id AS user_id, u.nom AS user_nom
    FROM produits p
    JOIN produits_categories pc ON p.id = pc.id_produit
    JOIN categories c ON pc.id_categorie = c.id
    JOIN users u ON p.id_user = u.id
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
        u.id AS user_id,
        u.nom AS user_nom,
        u.date_creation AS user_date_creation
    FROM produits p
    JOIN produits_categories pc ON p.id = pc.id_produit
    JOIN categories c ON pc.id_categorie = c.id
    JOIN users u ON p.id_user = u.id
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
        u.id AS user_id,
        u.nom AS user_nom,
        u.date_creation AS user_date_creation
    FROM produits p
    JOIN produits_categories pc ON p.id = pc.id_produit
    JOIN categories c ON pc.id_categorie = c.id
    JOIN users u ON p.id_user = u.id
    WHERE c.nom = 'Santé';
END $$
DELIMITER ;



DELIMITER //

CREATE FUNCTION GetOrCreateCategory(catNom VARCHAR(100)) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE existingId INT;

    -- Vérifie si la catégorie existe déjà
    SELECT id INTO existingId FROM categories WHERE nom = catNom LIMIT 1;

    -- Si elle existe, retourne l'ID
    IF existingId IS NOT NULL THEN
        RETURN existingId;
    ELSE
        -- Sinon, insère la nouvelle catégorie et retourne son nouvel ID
        INSERT INTO categories (nom) VALUES (catNom);
        RETURN LAST_INSERT_ID();
    END IF;
END //

DELIMITER ;