# Epitech Job Board

Projet réalisé en binôme : annonces et entreprises, recherche et filtres, comptes candidat/entreprise, candidatures liées à la session, profil/CV/alertes et administration.

## Démarrage local

Prérequis : Node.js, PHP 8.4 avec pdo_mysql/fileinfo et MariaDB.

1. Exécuter npm ci.
2. Copier api/config/database.local.example.php vers api/config/database.local.php, puis renseigner les identifiants MariaDB. Ce fichier reste ignoré par Git.
3. Nouvelle base vide : importer database/schema.sql, puis database/seed.sql avec un compte autorisé à créer epitech_job_board.
4. Base existante provenant de la version précédente : conserver les données et exécuter database/migrate-integration.sql dans cette base avec un compte autorisé à modifier le schéma. Ne pas réimporter le seed dans une base déjà remplie.
5. Deux terminaux : npm run api et npm run dev. Ouvrir l'adresse donnée par Vite, généralement http://127.0.0.1:5173.

La configuration locale peut sélectionner une autre base. La base canonique partagée est epitech_job_board. Les routes /api et /uploads sont transmises au serveur PHP sur le port 8001 par le proxy Vite.

## Comptes de démonstration sur une base initialisée avec le seed

| Compte | Email | Mot de passe |
|---|---|---|
| Admin | admin@jobboard.test | Admin123! |
| Candidat | candidate@jobboard.test | Candidate123! |
| Entreprise | entreprise@jobboard.test | Company123! |

Ces comptes ne sont pas ajoutés automatiquement à une base existante.

## Fonctionnement

role représente les permissions (candidate/admin), account_type le type de compte (candidate/company). Une entreprise est reliée à companies par company_id et ne reçoit pas les permissions d'administration.

Les annonces et entreprises sont publiques en lecture ; leur création, modification et suppression nécessitent un admin. Les candidats connectés peuvent postuler et consulter uniquement leurs propres candidatures. Seul l'admin modifie les statuts. Le profil, les CV et les alertes complètent le parcours candidat.

## Vérification

Syntaxe : vérifier les fichiers PHP sous api avec php -l. Production frontend : npm run build inclut les 12 pages. Les tests d'intégration ont été exécutés dans une instance MariaDB isolée et les filtres/navigation ont été contrôlés séparément.

La migration conserve les comptes et les lignes existantes, transforme sent en pending et under_review/interview en reviewing. Les anciennes pièces jointes restent liées aux candidatures.

Pour une démonstration : recherche → inscription candidat/entreprise → login → profil/CV → candidature → Mes candidatures → alertes → logout → administration (jobs/companies/applications/users).

Explication courte en azéri : [docs/follow-up-az.md](docs/follow-up-az.md).
