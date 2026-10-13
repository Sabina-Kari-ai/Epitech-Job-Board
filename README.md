
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

4. Dans phpMyAdmin, sélectionne la base `job_board` puis importe les fichiers SQL conservés dans cet ordre : `database/companies.sql`, `database/users.sql`, `database/user_documents.sql`, `database/jobs.sql`, `database/applications.sql` et `database/cv_views.sql`.

   Les exports des tables existantes contiennent des instructions `DROP TABLE` et des données. Leur import remplace les tables correspondantes ; ne les importe pas sur une base dont tu veux conserver les données. `database/user_documents.sql` est une migration additive et peut être importée seule sur une base existante.

Depuis l'accueil, les liens de connexion et d'inscription ouvrent les formulaires dédiés. Après authentification, les candidats arrivent sur les offres et les comptes entreprise sur leur tableau de bord entreprise.

Les comptes se créent depuis `public/register.html` avec un mot de passe d'au moins 6 caractères. Après inscription ou connexion, les candidats arrivent sur les offres et les comptes entreprise sur leur tableau de bord. Il sera possible de se reconnecter depuis `public/login.html`. Aucun compte utilisateur n'est créé par SQL.

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
| `POST` | `/api/auth/` | Crée un compte, gère la session, met à jour le profil, change l'e-mail/le mot de passe ou supprime un compte candidat après confirmation du mot de passe |
| `GET`, `POST`, `DELETE` | `/api/profile-documents/` | Liste, enregistre, prévisualise ou retire les documents du profil connecté |

Les candidatures nécessitent une session : un candidat ne voit que les siennes et le rôle administrateur peut consulter la liste complète et modifier les statuts. Les CV PDF et lettres joints à une candidature sont conservés dans la base et leur téléchargement est limité au candidat concerné ou à l'administration. Les documents du profil sont également stockés en base et accessibles uniquement à leur propriétaire. Une offre peut rendre obligatoire la lettre, qui peut être saisie ou jointe en PDF. Les alertes restent dans le stockage local du navigateur.

La création d'une candidature et l'enregistrement de documents de profil utilisent `multipart/form-data` (5 Mo maximum par fichier). Le CV du profil doit être un PDF afin d'être automatiquement prévisualisé dans le formulaire de candidature. Les autres requêtes `POST` et `PUT` attendent un corps JSON. Remplace `1` par l'identifiant de l'enregistrement voulu.

## Build

Pour générer les fichiers frontend de production :

`npm run build`

Les fichiers générés sont placés dans `dist/`.

## À poursuivre

- Ajouter une authentification et des autorisations aux autres routes d'administration avant toute mise en ligne publique.

## Notes

- Vérifie la configuration de la base de données avant de lancer l'API.
- Une lettre de motivation est obligatoire pour les offres qui le demandent.
