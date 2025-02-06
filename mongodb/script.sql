CREATE USER 'mongodb'@'localhost' IDENTIFIED BY 'mongodb';
GRANT SELECT ON centrale.* TO 'mongodb'@'localhost';
GRANT EXECUTE ON PROCEDURE centrale.produits_sportsalut TO 'mongodb'@'localhost';
GRANT EXECUTE ON PROCEDURE centrale.produits_gamez TO 'mongodb'@'localhost';
GRANT EXECUTE ON PROCEDURE centrale.produits_medidonc TO 'mongodb'@'localhost';