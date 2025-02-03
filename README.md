# Projet [Plateforme centrale]

## Contexte

_À compléter avec la description du projet._

## Dossiers du projet

Le projet est divisé en deux dossiers principaux :

1. **`frontend`** : Contient le code pour l'interface utilisateur (frontend).
2. **`backend`** : Contient le code pour le serveur, les routes API, et la gestion de la base de données.

---

## Backend

### Prérequis

1. Assurez-vous d'avoir **Node.js** et **npm** installés sur votre machine.
2. Vous devez avoir un **serveur MySQL** en fonctionnement et une base de données configurée.

### Installation

1. **Lancer l'installation des dépendances** :

   - Ouvrez un terminal et allez dans le dossier `backend`.
   - Exécutez la commande suivante pour installer les dépendances :
     ```bash
     npm install
     ```

2. **Créer et configurer le fichier `.env`** :

   - Dans le dossier `backend`, créez un fichier `.env` en vous inspirant du fichier `.env.exemple` fourni.
   - Remplissez les champs avec vos informations de connexion à la base de données MySQL.

     Exemple de fichier `.env` :

     ```ini
     PORT=5000
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=root
     DB_NAME=nom_de_votre_base_de_donnees
     DB_PORT=3306
     JWT_SECRET=secretkeyanepassupprimer
     ```

3. **Lancer le serveur** :
   - Une fois les dépendances installées et le fichier `.env` configuré, vous pouvez démarrer le serveur avec la commande :
     ```bash
     npm run dev
     ```
   - Le serveur devrait maintenant être en cours d'exécution.

---
