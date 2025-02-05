-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 04 fév. 2025 à 16:25
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `projet_lc`
--

DELIMITER $$
--
-- Procédures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `AjouterProduit` (IN `p_nom` VARCHAR(100), IN `p_description` TEXT, IN `p_prix_achat` FLOAT, IN `p_statut` TINYINT(1), IN `p_date_creation` DATE, IN `p_date_modification` DATE, IN `p_id_fournisseur` INT, IN `f_nom` VARCHAR(100), IN `categorie_id` INT, IN `categorie_name` VARCHAR(100))   BEGIN
    DECLARE v_fournisseur_id INT DEFAULT NULL;
    DECLARE v_categorie_id INT DEFAULT NULL;
    
    -- Vérifier si un revendeur est spécifié
    IF p_id_fournisseur IS NOT NULL THEN
        -- Vérifier si le fournisseur existe déjà
        SELECT id INTO v_fournisseur_id FROM fournisseurs WHERE id = p_id_fournisseur LIMIT 1;
        
        -- Si le fournisseur n'existe pas, on le crée
        IF v_fournisseur_id IS NULL THEN
            INSERT INTO fournisseurs (id, nom, date_création) VALUES (p_id_fournisseur, f_nom, CURDATE());
        END IF;
    END IF;
    
    IF categorie_id IS NOT NULL THEN
        -- Vérifier si la catégorie existe déjà
        SELECT id INTO v_categorie_id FROM categories WHERE id = categorie_id LIMIT 1;
        
        -- Si la catégorie n'existe pas, on la créée
        IF v_categorie_id IS NULL THEN
            INSERT INTO categories (id, nom, date_creation) VALUES (categorie_id, categorie_name, CURDATE());
        END IF;
    END IF;

    -- Insérer le produit
    INSERT INTO produits (nom, description, prix_achat, statut, date_création, date_modification, id_fournisseur)
    VALUES (p_nom, p_description, p_prix_achat, p_statut, p_date_creation, p_date_modification, p_id_fournisseur);
    
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `date_creation` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id`, `nom`, `date_creation`) VALUES
(1, 'Jeu de société', '2025-02-03'),
(2, 'Sport', '2025-02-03'),
(3, 'Accessoire', '2025-02-04'),
(4, 'Accessoire High Tech', '2025-02-04');

-- --------------------------------------------------------

--
-- Structure de la table `fournisseurs`
--

CREATE TABLE `fournisseurs` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(200) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date_création` date NOT NULL,
  `id_user` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `fournisseurs`
--

INSERT INTO `fournisseurs` (`id`, `nom`, `email`, `password`, `date_création`, `id_user`) VALUES
(1, 'MARTIN', '', '', '2025-02-03', 2),
(3, 'Dorian', '', '', '2025-02-04', 2),
(5, 'TechStore', '', '', '2025-02-04', 2);

-- --------------------------------------------------------

--
-- Structure de la table `produits`
--

CREATE TABLE `produits` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `prix_achat` float DEFAULT NULL,
  `statut` tinyint(1) DEFAULT NULL,
  `date_création` date DEFAULT NULL,
  `date_modification` date DEFAULT NULL,
  `id_fournisseur` int(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `produits`
--

INSERT INTO `produits` (`id`, `nom`, `description`, `prix_achat`, `statut`, `date_création`, `date_modification`, `id_fournisseur`) VALUES
(1, 'Monopoly', 'Jeu de famille ', 10, 1, '2025-02-03', NULL, NULL),
(2, 'Gant de boxe', 'Gant pour taper ', 8, 1, '2025-02-04', NULL, NULL),
(3, 'Ordinateur HP', 'PC Portable 15 pouces', 750.99, 1, '2025-02-04', NULL, 5),
(4, 'Sac à dos', 'Sac à dos enfant', 12.99, 1, '2025-02-04', NULL, NULL),
(5, 'Ecouteurs', 'Ecouteurs sans fil', 19.99, 1, '2025-02-04', NULL, 3);

-- --------------------------------------------------------

--
-- Structure de la table `produits_categories`
--

CREATE TABLE `produits_categories` (
  `id_produit` int(10) DEFAULT NULL,
  `id_categorie` int(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `produits_categories`
--

INSERT INTO `produits_categories` (`id_produit`, `id_categorie`) VALUES
(1, 1),
(2, 2),
(2, 3);

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `rôle` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `user`
--

INSERT INTO `user` (`id`, `rôle`) VALUES
(1, 'Admin'),
(2, 'Fournisseur');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Etrangère` (`id_user`);

--
-- Index pour la table `produits`
--
ALTER TABLE `produits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Etrangère` (`id_fournisseur`) USING BTREE;

--
-- Index pour la table `produits_categories`
--
ALTER TABLE `produits_categories`
  ADD KEY `Etrangère` (`id_produit`),
  ADD KEY `Etrangère2` (`id_categorie`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `produits`
--
ALTER TABLE `produits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD CONSTRAINT `id_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `produits`
--
ALTER TABLE `produits`
  ADD CONSTRAINT `id_revendeur` FOREIGN KEY (`id_fournisseur`) REFERENCES `fournisseurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `produits_categories`
--
ALTER TABLE `produits_categories`
  ADD CONSTRAINT `id_categorie` FOREIGN KEY (`id_categorie`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `id_produit` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
