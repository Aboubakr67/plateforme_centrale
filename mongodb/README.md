# MongoDB - Migration de données

## Description
Ce programme permet de migrer des données depuis une base de données **MySQL** vers **MongoDB**. Il se connecte à la base MySQL, exécute des procédures stockées pour récupérer les produits, puis insère ces données dans les collections MongoDB correspondantes (`sport_salut`, `medidonc`, `gamez`), tout en évitant les doublons.

## Structure du programme
mongodb/
    ├── controllers/
    │   └──migrationController.js
    ├── services/
    │   └──mongoService.js
    │   └──mysqlService.js
    ├── .env
    ├── .env.example
    ├── config.js
    ├── dataMapper.js
    ├── index.js
    ├── package.json
    └── README.md

### 1. **Installation des dépendances** :
```bash
cd mongodb
npm install
```

### 2. **Configuration de la base de données** :
Il faut dans un 1er temps créer un utilisateur MySQL qui aura seulement les droits d'appeler les procédures stockées dans la base centrale :
```sql
CREATE USER 'mongodb'@'localhost' IDENTIFIED BY 'mongodb';
GRANT SELECT ON plateforme_centrale.* TO 'mongodb'@'localhost';
GRANT EXECUTE ON PROCEDURE plateforme_centrale.produits_sportsalut TO 'mongodb'@'localhost';
GRANT EXECUTE ON PROCEDURE plateforme_centrale.produits_gamez TO 'mongodb'@'localhost';
GRANT EXECUTE ON PROCEDURE plateforme_centrale.produits_medidonc TO 'mongodb'@'localhost';
```

- Créer une base de données MongoDB (si ce n'est pas déjà fait)
- Copier le fichier .env.exemple en .env
- Configurer les informations suivantes dans .env :
```sh
# MongoDB configuration
MONGO_DB_URL=mongodb://localhost:27017        # URL de votre base MongoDB
MONGO_DB_NAME=mongodb                        # Nom de la base MongoDB

# MySQL configuration
MYSQL_DB_HOST=localhost                      # Hôte de la base MySQL
MYSQL_DB_PORT=3306                           # Port de la base MySQL
MYSQL_DB_USER=votre_utilisateur              # Utilisateur MySQL qui a le seulement les droits pour appeler les procédures stockées
MYSQL_DB_PASSWORD=votre_mot_de_passe         # Mot de passe de l'utilisateur MySQL qui a le seulement les droits pour appeler les procédures stockées
MYSQL_DB_NAME=plateforme_centrale            # Nom de la base MySQL contenant les produits
```


### 3. **Lancer le programme de migration** :
Une fois les dépendances installées et la configuration prête, tu peux lancer le programme de migration avec la commande suivante :
```bash
npm start
```
Cela exécutera la migration, récupérera les données depuis MySQL via les procédures stockées et insérera les produits dans MongoDB dans les collections appropriées.

#### Fonctionnalités
- **Migration des produits** : Le programme exécute trois procédures MySQL pour récupérer les produits depuis la base de données :
  - produits_sportsalut (insérés dans la collection sport_salut)
  - produits_medidonc (insérés dans la collection medidonc)
  - produits_gamez (insérés dans la collection gamez)

- **Insertion avec prévention des doublons** : Si un produit existe déjà dans MongoDB (via son ID), il n'est pas réinséré.

- **Format des données** : Les données récupérées de MySQL sont transformées en un format JSON précis par chaque collections MongoDB.