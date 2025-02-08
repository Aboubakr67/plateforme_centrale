CREATE USER 'mongodb'@'localhost' IDENTIFIED BY 'mongodb';
GRANT SELECT ON plateforme_centrale.* TO 'mongodb'@'localhost';
GRANT EXECUTE ON PROCEDURE plateforme_centrale.produits_sportsalut TO 'mongodb'@'localhost';
GRANT EXECUTE ON PROCEDURE plateforme_centrale.produits_gamez TO 'mongodb'@'localhost';
GRANT EXECUTE ON PROCEDURE plateforme_centrale.produits_medidonc TO 'mongodb'@'localhost';