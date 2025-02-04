# Plateforme Centrale - Interface Revendeur

## Description

Une plateforme permettant aux revendeurs de gérer leurs produits. Les revendeurs peuvent se connecter, ajouter, modifier et supprimer des produits, ainsi que gérer leur profil.

## Structure du projet

```
├── frontend/
│   ├── components/
│   │   └── nav.html
│   ├── js/
│   │   └── common.js
│   ├── index.html
│   ├── revendeur.html
│   ├── produit-form.html
│   ├── profil.html
│   ├── 404.html
│   └── style.css
└── backend/
    ├── middlewares/
    │   └── verifyToken.js
    ├── .env
    ├── .env.exemple
    ├── index.js
    ├── package.json
    └── script.sql
```

## Installation

### Backend

1. **Installation des dépendances** :
```bash
cd backend
npm install
```

2. **Configuration de la base de données** :
- Créer une base de données MySQL
- Exécuter le fichier `script.sql` dans votre base de données
- Copier `.env.exemple` en `.env`
- Remplir les informations dans `.env` :
```env
PORT=5000
DB_HOST=localhost
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=plateforme_centrale
DB_PORT=3306
JWT_SECRET=votre_secret_jwt
```

3. **Lancer le serveur** :
```bash
npm run dev
```

### Frontend

1. **Serveur local** :
- Option 1 : Utiliser l'extension "Live Server" de VSCode
- Option 2 : Utiliser un serveur local comme :
```bash
npx serve frontend
```

## Utilisation

1. **Connexion** :
- Accéder à `http://127.0.0.1:5500/frontend/index.html`
- Utiliser les identifiants de test :
  - Nom : "John Doe"
  - Mot de passe : "password"

2. **Fonctionnalités disponibles** :
- Tableau de bord des produits
- Ajout de nouveaux produits
- Modification des produits existants
- Suppression de produits
- Gestion du profil
- Déconnexion

## Technologies utilisées

### Frontend
- HTML5
- CSS3 (Design système personnalisé)
- JavaScript vanilla
- Fetch API pour les requêtes

### Backend
- Node.js
- Express.js
- MySQL
- JWT pour l'authentification
- bcryptjs pour le hachage des mots de passe

## Sécurité

- Authentification par JWT
- Mots de passe hachés
- Protection CORS
- Validation des données
- Gestion des sessions

## Dépannage

1. **Erreur de connexion à la base de données** :
- Vérifier les informations dans `.env`
- Vérifier que le serveur MySQL est en cours d'exécution
- Vérifier que la base de données existe

2. **Erreur d'authentification** :
- Vérifier que le backend est en cours d'exécution
- Vérifier que les identifiants sont corrects
- Vérifier la validité du token JWT

3. **Problèmes de CORS** :
- Vérifier que le frontend est servi depuis un serveur local
- Vérifier la configuration CORS dans le backend

## Contribution

1. Forker le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT.
