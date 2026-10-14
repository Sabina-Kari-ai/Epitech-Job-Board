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

Syntaxe : vérifier les fichiers PHP sous api avec php -l. Production frontend : npm run build inclut les 13 pages. 118 contrôles API/migration ont réussi dans une instance MariaDB isolée et 170 contrôles statiques/frontend ont réussi. Le navigateur a confirmé l'inscription à deux formulaires, le login candidat, l'envoi d'une candidature, Mes candidatures, le logout et l'administration avec modification du statut. Les styles JobBoard d'origine ont été restaurés et les éléments HTML requis par chaque script ont été vérifiés.

La migration conserve les comptes et les lignes existantes, transforme sent en pending et under_review/interview en reviewing. Les anciennes pièces jointes restent liées aux candidatures.

Pour une démonstration : recherche → inscription candidat/entreprise → login → profil/CV → candidature → Mes candidatures → alertes → logout → administration (jobs/companies/applications/users).

Explication courte en azéri : [docs/follow-up-az.md](docs/follow-up-az.md).

## Partage de la base et six offres

Une base MariaDB locale n'est pas synchronisée par GitHub. Pour une installation vide, importer database/job-board-demo.sql : fichier complet schema + seed avec six offres. Ne pas l'importer dans une base déjà remplie.

Pour la base existante à trois offres : sélectionner la base, exécuter migrate-integration.sql, puis add-demo-offers.sql. Ce dernier ajoute les offres manquantes jusqu'à six sans supprimer les lignes existantes ; une seconde exécution ne crée pas de doublons. La configuration locale doit sélectionner la base réellement importée.

Guide en azéri : docs/database-sharing-az.md.

## Dernières fonctionnalités

L'admin lit le téléphone, le message, la lettre de motivation et les pièces jointes d'une candidature. Les documents sont accessibles via un endpoint protégé. Les compétences, missions, profil, avantages, temps de travail et date limite sont enregistrés et éditables dans l'offre. Les candidatures répétées (y compris concurrentes) et les offres expirées sont bloquées.

Les réinitialisations et alertes génèrent des emails dans une boîte de réception locale réservée à l'admin : Emails. Sans SMTP configuré, aucun email externe n'est envoyé. Le token de réinitialisation n'est jamais renvoyé par l'API publique. Les alertes actives sont filtrées par mot-clé, lieu et contrat ; plusieurs alertes correspondantes ne génèrent qu'un message par candidat/offre.

Base déjà installée : importer database/migrate-completion.sql pour créer mail_outbox. Une installation complète via job-board-demo.sql inclut ce neuvième tableau. Configuration optionnelle : api/config/mail.local.example.php. Guide : docs/email-demo-az.md.

## Accueil personnalisé

Bonjour et le prénom après connexion, menu du compte avec nom complet, profil, documents et déconnexion. La cloche ouvre les alertes candidat ou les emails admin. Le candidat peut enregistrer une lettre de motivation qui préremplit ses candidatures.

Base déjà installée : importer database/migrate-profile-letter.sql. La migration complète et job-board-demo.sql incluent ce champ.

## Navigation après connexion

Connexion et Créer un compte sont affichés uniquement aux visiteurs déconnectés. Les raccourcis Mes candidatures ont été retirés du menu du compte et du profil à la demande du binôme. La page app.html reste disponible pour consulter les candidatures du candidat connecté. Les alertes sont accessibles par la cloche et le bouton du profil. Le menu admin contient Administration et Les candidatures ; ce dernier ouvre directement la gestion des candidatures. La boîte Emails reste accessible depuis la page admin.

Les menus supérieurs des pages candidat, entreprises et offres sont cohérents : Offres et Entreprises, puis les icônes du compte connecté. Le chargement des entreprises et du détail d’une offre possède une limite de dix secondes et affiche une erreur si le serveur ne répond pas.
