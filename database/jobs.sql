-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mar. 13 oct. 2026 à 13:17
-- Version du serveur : 8.4.7
-- Version de PHP : 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `job_board`
--

-- --------------------------------------------------------

--
-- Structure de la table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int UNSIGNED NOT NULL,
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contract_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salary` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `short_description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_letter_required` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_company_id` (`company_id`),
  KEY `idx_jobs_location` (`location`),
  KEY `idx_jobs_contract_type` (`contract_type`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `jobs`
--

INSERT INTO `jobs` (`id`, `company_id`, `title`, `location`, `contract_type`, `salary`, `short_description`, `description`, `cover_letter_required`, `created_at`, `updated_at`) VALUES
(1, 1, 'Développeur Web Full Stack', 'Paris', 'CDI', '40k - 50k', 'Nous recherchons un développeur web full stack pour rejoindre notre équipe.', 'Vous participerez au développement d\'applications web modernes, de la conception jusqu\'à la mise en production.', 0, '2026-10-08 08:55:36', '2026-10-08 08:55:36'),
(2, 2, 'Backend Developer PHP', 'Lyon', 'CDI', '38k - 48k', 'Rejoignez notre équipe backend pour développer des applications PHP.', 'Vous développerez et maintiendrez des applications backend avec PHP, MySQL et les technologies web associées.', 0, '2026-10-08 08:55:36', '2026-10-08 08:55:36'),
(3, 3, 'Stage Développeur JavaScript', 'Paris', 'Stage', '800 - 1000 €/mois', 'Une opportunité de stage pour découvrir le développement JavaScript.', 'Vous participerez au développement d\'interfaces web et découvrirez les bonnes pratiques du développement JavaScript.', 0, '2026-10-08 08:55:36', '2026-10-08 08:55:36'),
(4, 4, 'Développeur Frontend', 'Lille', 'Alternance', '1200 €/mois', 'Nous recherchons un développeur frontend en alternance.', 'Vous travaillerez sur la création et l\'amélioration d\'interfaces web modernes et responsives.', 0, '2026-10-08 08:55:36', '2026-10-08 08:55:36'),
(5, 5, 'Intégrateur Web', 'Paris', 'CDD', '32k - 38k', 'Rejoignez notre équipe en tant qu\'intégrateur web.', 'Vous intégrerez des maquettes et développerez des interfaces web accessibles et responsives.', 1, '2026-10-08 08:55:36', '2026-10-08 08:55:36'),
(6, 6, 'Ingénieur Logiciel', 'Lyon', 'CDI', '45k - 55k', 'Nous recherchons un ingénieur logiciel pour renforcer notre équipe.', 'Vous participerez à la conception, au développement et à l\'amélioration de solutions logicielles.', 0, '2026-10-08 08:55:36', '2026-10-08 08:55:36');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
