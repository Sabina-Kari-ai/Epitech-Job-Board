
# Epitech Job Board

Epitech Job Board est une application web pour consulter des offres d'emploi, découvrir des entreprises et envoyer des candidatures. Le projet comprend une interface en HTML, CSS et JavaScript, une API PHP et une base de données MySQL.

## Technologies

- HTML, CSS et JavaScript
- PHP
- MySQL
- Vite
- Git et GitHub

## Prérequis

- Node.js et npm
- PHP
- MySQL ou MariaDB
- Une base de données accessible depuis PHP

## Installation

1. Clone le dépôt et entre dans le dossier du projet :

   ```sh
   git clone https://github.com/Sabina-Kari-ai/Epitech-Job-Board.git
   cd Epitech-Job-Board
   ```

2. Installe les dépendances du frontend :

   ```sh
   npm install
   ```

3. Configure les identifiants MySQL dans [`api/config/database.php`](api/config/database.php).

4. Crée les tables en exécutant `database/schema.sql` dans MySQL Workbench ou depuis un terminal :

   ```sh
   mysql -u root -p < database/schema.sql
   ```

5. Pour ajouter les données de démonstration, exécute `database/seed.sql` une seule fois, après le schéma, sur une base vide :

   ```sh
   mysql -u root -p job_board < database/seed.sql
   ```

## Lancer le projet

Depuis la racine du dépôt, démarre l'API dans un terminal :

```sh
npm run api
```

Cette commande utilise PHP et lance l'API sur `http://127.0.0.1:8001`. Le script de démarrage automatique du dépôt utilise PowerShell ; si nécessaire, tu peux lancer le serveur PHP directement depuis la racine :

```sh
php -S 127.0.0.1:8001 -t .
```

Dans un autre terminal, démarre le frontend :

```sh
npm run dev
```

Ouvre l'adresse locale affichée par Vite, généralement `http://127.0.0.1:5173`.

## Pages

| Fichier | Page |
| --- | --- |
| `public/index.html` | Liste des offres |
| `public/job.html` | Détail d'une offre |
| `public/apply.html` | Formulaire de candidature |
| `public/companies.html` | Liste des entreprises |
| `public/app.html` | Candidatures |
| `public/admin.html` | Administration |

## API

Toutes les routes sont servies depuis `http://127.0.0.1:8001`.

| Méthode | Route | Utilisation |
| --- | --- | --- |
| `GET` | `/api/jobs/` | Liste les offres ; accepte `q`, `search`, `location`, `type`, `contract_type` et `company` en paramètres |
| `GET` | `/api/jobs/?id=1` | Récupère une offre |
| `POST` | `/api/jobs/` | Crée une offre |
| `PUT` | `/api/jobs/` | Modifie une offre ; l'identifiant `id` est envoyé dans le JSON |
| `DELETE` | `/api/jobs/?id=1` | Supprime une offre si aucune candidature ne lui est associée |
| `GET` | `/api/companies/` | Liste les entreprises |
| `POST` | `/api/companies/` | Crée une entreprise |
| `PUT` | `/api/companies/` | Modifie une entreprise ; l'identifiant `id` est envoyé dans le JSON |
| `DELETE` | `/api/companies/?id=1` | Supprime une entreprise si aucune offre ne lui est associée |
| `GET` | `/api/app/` | Liste les candidatures |
| `GET` | `/api/app/?id=1` | Récupère une candidature |
| `POST` | `/api/app/` | Envoie une candidature |
| `PUT` | `/api/app/` | Modifie le statut ; `id` et `status` sont envoyés dans le JSON |

Les requêtes `POST` et `PUT` attendent un corps JSON. Remplace `1` par l'identifiant de l'enregistrement voulu.

## Build

Pour générer les fichiers frontend de production :

```sh
npm run build
```

Les fichiers générés sont placés dans `dist/`.

## À poursuivre

- Connecter les boutons de suppression des entreprises et de modification du statut des candidatures dans l'administration à leurs routes API.
- Ajouter une authentification et des autorisations aux routes d'administration avant toute mise en ligne publique.

## Notes

- Vérifie la configuration de la base de données avant de lancer l'API.
- Une lettre de motivation est obligatoire pour les offres qui le demandent.
- Le contenu de `database/seed.sql` est prévu pour une base vide et doit être importé une seule fois.
