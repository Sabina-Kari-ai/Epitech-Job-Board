-- =====================================================================
--  JobBoard - structure de la base de données
--
--  À importer en premier, dans une base vide (ex. `job_board`).
--  Le fichier supprime puis recrée toutes les tables : ne l'importe pas
--  sur une base dont tu veux garder les données.
--
--  Ensuite, importe seed.sql pour avoir des données de démonstration.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `user_documents`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `jobs`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `companies`;

SET FOREIGN_KEY_CHECKS = 1;


-- ---------------------------------------------------------------------
-- Entreprises
-- Une entreprise inscrite via le site arrive en 'pending' : elle ne peut
-- pas publier tant qu'un admin ne l'a pas passée en 'approved'.
-- ---------------------------------------------------------------------
CREATE TABLE `companies` (
  `id`           int unsigned NOT NULL AUTO_INCREMENT,
  `name`         varchar(150) NOT NULL,
  `siret`        char(14)     DEFAULT NULL,
  `location`     varchar(150) NOT NULL,
  `description`  text,
  `status`       enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  `validated_at` datetime     DEFAULT NULL,
  `logo_path`    varchar(255) DEFAULT NULL,  -- chemin relatif, ex. uploads/company-logos/xxx.jpg
  `created_at`   timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_companies_siret` (`siret`),
  KEY `idx_companies_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- Personnes : candidats, recruteurs (liés à une entreprise) et admins.
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `first_name`    varchar(100) NOT NULL,
  `last_name`     varchar(100) NOT NULL,
  `email`         varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,     -- password_hash() côté PHP, jamais le mot de passe en clair
  `phone`         varchar(50)  DEFAULT NULL,
  `city`          varchar(150) DEFAULT NULL,
  `linkedin_url`  varchar(255) DEFAULT NULL,
  `bio`           text,
  `role`          enum('candidate','company','admin') NOT NULL DEFAULT 'candidate',
  `company_id`    int unsigned DEFAULT NULL,  -- renseigné uniquement pour les recruteurs
  `created_at`    timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_company_id` (`company_id`),
  CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`)
    REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- Offres d'emploi. Une offre appartient à une seule entreprise ;
-- l'API refuse de supprimer une entreprise qui a encore des offres.
-- ---------------------------------------------------------------------
CREATE TABLE `jobs` (
  `id`                    int unsigned NOT NULL AUTO_INCREMENT,
  `company_id`            int unsigned NOT NULL,
  `title`                 varchar(150) NOT NULL,
  `location`              varchar(150) NOT NULL,
  `contract_type`         varchar(50)  NOT NULL,   -- CDI, CDD, Stage, Alternance
  `salary`                varchar(100) DEFAULT NULL,
  `short_description`     varchar(255) NOT NULL,   -- affichée dans la liste des offres
  `description`           text         NOT NULL,   -- affichée par « En savoir plus »
  `cover_letter_required` tinyint(1)   NOT NULL DEFAULT 0,
  `created_at`            timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_company_id` (`company_id`),
  KEY `idx_jobs_location` (`location`),
  KEY `idx_jobs_contract_type` (`contract_type`),
  CONSTRAINT `fk_jobs_company` FOREIGN KEY (`company_id`)
    REFERENCES `companies` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- Candidatures : qui a postulé, à quelle offre, avec quel message.
-- Les coordonnées sont copiées au moment de l'envoi pour garder une
-- trace même si le compte du candidat est supprimé (user_id passe à NULL).
-- Le CV (obligatoire) et la lettre (facultative) sont stockés en BLOB.
-- ---------------------------------------------------------------------
CREATE TABLE `applications` (
  `id`                     int unsigned NOT NULL AUTO_INCREMENT,
  `job_id`                 int unsigned NOT NULL,
  `user_id`                int unsigned DEFAULT NULL,
  `candidate_name`         varchar(150) NOT NULL,
  `candidate_email`        varchar(255) NOT NULL,
  `candidate_phone`        varchar(50)  NOT NULL,
  `message`                text         NOT NULL,
  `cover_letter`           text,
  `cv_file_name`           varchar(255) DEFAULT NULL,
  `cv_file`                mediumblob,
  `cover_letter_file_name` varchar(255) DEFAULT NULL,
  `cover_letter_file`      mediumblob,
  `status`                 varchar(30)  NOT NULL DEFAULT 'pending',
  `created_at`             timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_applications_job_id` (`job_id`),
  KEY `idx_applications_user_id` (`user_id`),
  KEY `idx_applications_status` (`status`),
  CONSTRAINT `fk_applications_job` FOREIGN KEY (`job_id`)
    REFERENCES `jobs` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_applications_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_application_status`
    CHECK (`status` IN ('pending','reviewing','interview','accepted','rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- CV et lettre enregistrés dans le profil du candidat (un de chaque).
-- Ils sont proposés automatiquement dans le formulaire de candidature.
-- ---------------------------------------------------------------------
CREATE TABLE `user_documents` (
  `id`            int unsigned NOT NULL AUTO_INCREMENT,
  `user_id`       int unsigned NOT NULL,
  `document_type` enum('cv','cover_letter') NOT NULL,
  `file_name`     varchar(255) NOT NULL,
  `mime_type`     varchar(100) NOT NULL,
  `file_content`  mediumblob   NOT NULL,
  `created_at`    timestamp    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    timestamp    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_documents_user_type` (`user_id`, `document_type`),
  CONSTRAINT `fk_user_documents_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- Liens « mot de passe oublié ». On ne stocke que le SHA-256 du jeton
-- envoyé par e-mail ; il expire au bout de 30 minutes.
-- ---------------------------------------------------------------------
CREATE TABLE `password_resets` (
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `user_id`    int unsigned NOT NULL,
  `token_hash` char(64)     NOT NULL,
  `expires_at` datetime     NOT NULL,
  `used_at`    datetime     DEFAULT NULL,
  `created_at` timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_password_resets_token_hash` (`token_hash`),
  KEY `idx_password_resets_user_id` (`user_id`),
  CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------
-- Notifications affichées dans les espaces entreprise et candidat.
-- company_id : nouvelle candidature, validation ou refus de l'inscription.
-- user_id    : changement de statut d'une candidature du candidat.
-- ---------------------------------------------------------------------
CREATE TABLE `notifications` (
  `id`             int unsigned NOT NULL AUTO_INCREMENT,
  `company_id`     int unsigned DEFAULT NULL,
  `user_id`        int unsigned DEFAULT NULL,
  `application_id` int unsigned DEFAULT NULL,
  `job_id`         int unsigned DEFAULT NULL,
  `title`          varchar(150) NOT NULL,
  `message`        varchar(500) NOT NULL,
  `type`           varchar(50)  NOT NULL DEFAULT 'new_application',
  `is_read`        tinyint(1)   NOT NULL DEFAULT 0,
  `created_at`     timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_company_read` (`company_id`, `is_read`),
  KEY `idx_notifications_user_read` (`user_id`, `is_read`),
  CONSTRAINT `fk_notifications_company` FOREIGN KEY (`company_id`)
    REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
