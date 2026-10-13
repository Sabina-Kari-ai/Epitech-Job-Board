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
-- Structure de la table `applications`
--

DROP TABLE IF EXISTS `applications`;
CREATE TABLE IF NOT EXISTS `applications` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED DEFAULT NULL,
  `candidate_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `candidate_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `candidate_phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_letter` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cv_file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cv_file` mediumblob,
  `cover_letter_file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_letter_file` mediumblob,
  PRIMARY KEY (`id`),
  KEY `idx_applications_job_id` (`job_id`),
  KEY `idx_applications_user_id` (`user_id`),
  KEY `idx_applications_status` (`status`)
) ;

--
-- Déchargement des données de la table `applications`
--

INSERT INTO `applications` (`id`, `job_id`, `user_id`, `candidate_name`, `candidate_email`, `candidate_phone`, `message`, `cover_letter`, `status`, `created_at`, `updated_at`, `cv_file_name`, `cv_file`, `cover_letter_file_name`, `cover_letter_file`) VALUES
(1, 1, NULL, 'Jean Dupont', '[jean.dupont@email.com](mailto:jean.dupont@email.com)', '0601020304', 'Je souhaite rejoindre votre équipe et participer à vos projets web.', NULL, 'pending', '2026-10-08 08:55:36', '2026-10-09 17:07:07', NULL, NULL, NULL, NULL),
(2, 2, NULL, 'Marie Martin', '[marie.martin@email.com](mailto:marie.martin@email.com)', '0611223344', 'Mon expérience en PHP et MySQL correspond aux compétences recherchées.', NULL, 'reviewing', '2026-10-08 08:55:36', '2026-10-08 08:55:36', NULL, NULL, NULL, NULL),
(3, 3, NULL, 'Lucas Bernard', '[lucas.bernard@email.com](mailto:lucas.bernard@email.com)', '0622334455', 'Je souhaite effectuer mon stage au sein de votre agence.', NULL, 'accepted', '2026-10-08 08:55:36', '2026-10-08 08:55:36', NULL, NULL, NULL, NULL),
(4, 1, NULL, 'Test Candidat', 'test.candidat@example.com', '0612345678', 'Candidature de test pour verifier l\'API.', NULL, 'pending', '2026-10-09 17:17:06', '2026-10-09 17:17:06', NULL, NULL, NULL, NULL),
(5, 5, NULL, 'Test Lettre Valide', 'test.lettre.valide@example.com', '0612345678', 'Je souhaite postuler à cette offre.', 'Madame, Monsieur, je vous adresse ma candidature pour cette offre et souhaite mettre mes compétences à votre service.', 'pending', '2026-10-10 11:12:53', '2026-10-10 11:12:53', NULL, NULL, NULL, NULL);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
