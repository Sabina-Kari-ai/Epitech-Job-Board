
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

   `git clone https://github.com/Sabina-Kari-ai/Epitech-Job-Board.git`
   `cd Epitech-Job-Board`

2. Installe les dépendances du frontend :

   `npm install`

3. Configure les identifiants MySQL dans [`api/config/database.php`](api/config/database.php).

4. Crée les tables en exécutant `database/schema.sql` dans MySQL Workbench ou depuis un terminal :

   `mysql -u root -p < database/schema.sql`

5. Pour ajouter les données de démonstration, exécute `database/seed.sql` une seule fois, après le schéma, sur une base vide :

   `mysql -u root -p job_board < database/seed.sql`

Pour une base déjà créée avec l'ancien schéma, exécute dans l'ordre `database/migrations/001_candidate_accounts.sql`, `database/migrations/002_application_cv_upload.sql` et `database/migrations/003_company_accounts.sql`, une seule fois chacune. Vérifie avant l'exécution que les colonnes et contraintes correspondantes ne sont pas déjà présentes.

Depuis l'accueil, les liens de connexion et d'inscription ouvrent les formulaires dédiés. Après authentification, les candidats arrivent sur leur tableau de bord candidat et les comptes entreprise sur leur tableau de bord entreprise.

Les comptes se créent depuis `public/register.html` avec un mot de passe d'au moins 6 caractères. Après l'inscription, la session est ouverte automatiquement et l'utilisateur est dirigé vers le tableau de bord correspondant à son type de compte. Il pourra utiliser `public/login.html` lors de ses prochaines visites. Aucun compte utilisateur n'est créé par SQL.

## Lancer le projet

Depuis la racine du dépôt, démarre l'API dans un terminal :

`npm run api`

Cette commande utilise PHP et lance l'API sur `http://127.0.0.1:8001`. Le script de démarrage automatique du dépôt utilise PowerShell ; si nécessaire, tu peux lancer le serveur PHP directement depuis la racine :

`php -S 127.0.0.1:8001 -t .`

Dans un autre terminal, démarre le frontend :

`npm run dev`

Ouvre l'adresse locale affichée par Vite, généralement `http://127.0.0.1:5173`.

## Pages

| Fichier | Page |
| --- | --- |
| `public/index.html` | Liste des offres |
| `public/job.html` | Détail d'une offre |
| `public/apply.html` | Formulaire de candidature |
| `public/companies.html` | Liste des entreprises |
| `public/app.html` | Candidatures du compte connecté |
| `public/login.html` | Connexion candidat |
| `public/register.html` | Création de compte candidat ou entreprise |
| `public/candidate-dashboard.html` | Tableau de bord candidat et recherche d'offres |
| `public/company-dashboard.html` | Tableau de bord entreprise |
| `public/profile.html` | Profil candidat et documents |
| `public/alerts.html` | Gestion des alertes emploi |
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
| `GET` | `/api/app/?mine=1` | Liste les candidatures du compte connecté |
| `GET` | `/api/app/?id=1&attachment=cv` | Télécharge le CV avec autorisation |
| `POST` | `/api/app/` | Envoie une candidature connectée avec sa lettre et son CV PDF facultatif |
| `PUT` | `/api/app/` | Modifie le statut ; `id` et `status` sont envoyés dans le JSON |
| `GET` | `/api/auth/` | Récupère la session et le profil connecté |
| `POST` | `/api/auth/` | Crée un compte, ouvre/ferme une session ou met à jour le profil |

Les candidatures nécessitent une session : un candidat ne voit que les siennes et le rôle administrateur peut consulter la liste complète et modifier les statuts. Le CV PDF joint à une candidature est conservé dans la base et son téléchargement est limité au candidat concerné ou à l'administration. Les alertes et les noms des documents sélectionnés depuis le profil restent dans le stockage local du navigateur.

La création d'une candidature utilise `multipart/form-data` pour joindre le CV PDF (5 Mo maximum). Les autres requêtes `POST` et `PUT` attendent un corps JSON. Remplace `1` par l'identifiant de l'enregistrement voulu.

## Build

Pour générer les fichiers frontend de production :

`npm run build`

Les fichiers générés sont placés dans `dist/`.

## À poursuivre

- Ajouter une authentification et des autorisations aux autres routes d'administration avant toute mise en ligne publique.

## Notes

- Vérifie la configuration de la base de données avant de lancer l'API.
- Une lettre de motivation est obligatoire pour les offres qui le demandent.
- Le contenu de `database/seed.sql` est prévu pour une base vide et doit être importé une seule fois.
