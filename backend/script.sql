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
