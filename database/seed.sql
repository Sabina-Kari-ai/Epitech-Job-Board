-- =====================================================================
--  JobBoard - données de démonstration
--
--  À importer après schema.sql. Comptes disponibles (mot de passe entre
--  parenthèses) :
--    admin@jobboard.local       (Admin123!)       administrateur
--    candidat@jobboard.local    (Candidat123!)    candidat
--    entreprise@jobboard.local  (Entreprise123!)  recruteur Epitech, validé
--    nova@jobboard.local        (Entreprise123!)  recruteur Nova Conseil, en attente
--
--  Pense à changer ces mots de passe avant toute mise en ligne.
-- =====================================================================

SET NAMES utf8mb4;

INSERT INTO `companies` (`id`, `name`, `siret`, `location`, `description`, `status`, `validated_at`, `logo_path`, `created_at`) VALUES
(1, 'Tech Solutions', NULL, 'Paris', 'Entreprise spécialisée dans le développement de solutions numériques.', 'approved', '2026-10-08 08:55:36', NULL, '2026-10-08 08:55:36'),
(2, 'Digital Services', NULL, 'Lyon', 'Entreprise spécialisée dans les services numériques et les applications web.', 'approved', '2026-10-08 08:55:36', NULL, '2026-10-08 08:55:36'),
(3, 'Innovation Agency', NULL, 'Paris', 'Agence spécialisée dans les projets web et les nouvelles technologies.', 'approved', '2026-10-08 08:55:36', NULL, '2026-10-08 08:55:36'),
(4, 'Web Business', NULL, 'Lille', 'Entreprise spécialisée dans la création et le développement de sites web.', 'approved', '2026-10-08 08:55:36', NULL, '2026-10-08 08:55:36'),
(5, 'France Numérique', NULL, 'Paris', 'Entreprise spécialisée dans les services numériques et le développement web.', 'approved', '2026-10-08 08:55:36', NULL, '2026-10-08 08:55:36'),
(6, 'Future Systems', NULL, 'Lyon', 'Entreprise spécialisée dans les solutions logicielles.', 'approved', '2026-10-08 08:55:36', NULL, '2026-10-08 08:55:36'),
(7, 'Epitech', NULL, 'Nantes', 'École de l''innovation et de l''expertise informatique.', 'approved', '2026-10-14 08:30:00', 'uploads/company-logos/1a96af01ab8fb9725c2e409d1b1d2e67.jpg', '2026-10-14 08:12:19'),
-- Inscription en attente : sert à tester la validation depuis admin.html.
(8, 'Nova Conseil', '73282932000074', 'Bordeaux', 'Cabinet de conseil en recrutement.', 'pending', NULL, NULL, '2026-10-16 09:00:00');

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `phone`, `city`, `role`, `company_id`) VALUES
(1, 'Admin', 'JobBoard', 'admin@jobboard.local', '$2y$12$EuWIwtnsa8fx45kHzAGq0.6/cuw3DV29c60Zg9aqEqC1mB3NMBz9y', NULL, NULL, 'admin', NULL),
(2, 'Camille', 'Martin', 'candidat@jobboard.local', '$2y$12$nCvoiA8l2cejKQgSbS4kw.ySmc51vh.g9YwT16uxtIt0XQPKY/C.6', '0612345678', 'Nantes', 'candidate', NULL),
(3, 'Jean', 'Paul', 'entreprise@jobboard.local', '$2y$12$oxW6sHynavEMNJNUh8DreOgpaQ6gHWPhVGpFpIFMbp9fkJx9AwDVS', NULL, NULL, 'company', 7),
(4, 'Sarah', 'Nova', 'nova@jobboard.local', '$2y$12$oxW6sHynavEMNJNUh8DreOgpaQ6gHWPhVGpFpIFMbp9fkJx9AwDVS', NULL, NULL, 'company', 8);

INSERT INTO `jobs` (`id`, `company_id`, `title`, `location`, `contract_type`, `salary`, `short_description`, `description`, `cover_letter_required`, `created_at`) VALUES
(1, 1, 'Développeur Web Full Stack', 'Paris', 'CDI', '40k - 50k', 'Nous recherchons un développeur web full stack pour rejoindre notre équipe.', 'Vous participerez au développement d''applications web modernes, de la conception jusqu''à la mise en production.', 0, '2026-10-08 08:55:36'),
(2, 2, 'Backend Developer PHP', 'Lyon', 'CDI', '38k - 48k', 'Rejoignez notre équipe backend pour développer des applications PHP.', 'Vous développerez et maintiendrez des applications backend avec PHP, MySQL et les technologies web associées.', 0, '2026-10-08 08:55:36'),
(3, 3, 'Stage Développeur JavaScript', 'Paris', 'Stage', '800 - 1000 €/mois', 'Une opportunité de stage pour découvrir le développement JavaScript.', 'Vous participerez au développement d''interfaces web et découvrirez les bonnes pratiques du développement JavaScript.', 0, '2026-10-08 08:55:36'),
(4, 4, 'Développeur Frontend', 'Lille', 'Alternance', '1200 €/mois', 'Nous recherchons un développeur frontend en alternance.', 'Vous travaillerez sur la création et l''amélioration d''interfaces web modernes et responsives.', 0, '2026-10-08 08:55:36'),
(5, 5, 'Intégrateur Web', 'Paris', 'CDD', '32k - 38k', 'Rejoignez notre équipe en tant qu''intégrateur web.', 'Vous intégrerez des maquettes et développerez des interfaces web accessibles et responsives.', 1, '2026-10-08 08:55:36'),
(6, 6, 'Ingénieur Logiciel', 'Lyon', 'CDI', '45k - 55k', 'Nous recherchons un ingénieur logiciel pour renforcer notre équipe.', 'Vous participerez à la conception, au développement et à l''amélioration de solutions logicielles.', 0, '2026-10-08 08:55:36'),
(7, 7, 'Agent polyvalent / Employé(e) de service', 'Paris, France', 'CDI', '35000€ à 45000€', 'Notre entreprise est à la recherche d’un(e) employé(e) motivé(e), sérieux(se) et dynamique pour rejoindre notre équipe.', 'Missions principales\nAssurer les tâches quotidiennes liées au poste.\nRespecter les consignes et les procédures de travail.\nTravailler en équipe et participer au bon fonctionnement de l’entreprise.\nGarantir un travail de qualité et le respect des délais.\n\nProfil recherché\nÊtre sérieux(se), ponctuel(le) et organisé(e).\nAvoir le sens des responsabilités.\nÊtre capable de travailler en équipe.\nUne expérience dans le domaine serait un avantage.', 1, '2026-10-15 08:30:45'),
(8, 7, 'Agent polyvalent / Assistant administratif', 'Nantes, France', 'CDI', '45000€ à 55000€', 'Nous recrutons des personnes motivées pour renforcer notre pôle administration et opérations.', 'Missions\nParticiper à l’organisation des activités quotidiennes de l’entreprise.\nAccueillir, informer et orienter les clients, partenaires ou visiteurs.\nAssurer le suivi des dossiers et des opérations administratives.\nRédiger des comptes rendus et transmettre les informations à la hiérarchie.\n\nProfil\nBonne capacité d’organisation et de gestion des priorités.\nPonctualité, discrétion et sens des responsabilités.\nAisance à l’oral comme à l’écrit et maîtrise des outils informatiques courants.\n\nCe que nous proposons\nUn accompagnement à la prise de fonction, des formations et de vraies perspectives d’évolution.', 1, '2026-10-15 08:50:44');

-- Candidatures d'exemple (sans pièce jointe : les vraies candidatures
-- passent par le formulaire, qui exige un CV en PDF).
INSERT INTO `applications` (`id`, `job_id`, `user_id`, `candidate_name`, `candidate_email`, `candidate_phone`, `message`, `cover_letter`, `status`, `created_at`) VALUES
(1, 1, NULL, 'Jean Dupont', 'jean.dupont@email.com', '0601020304', 'Je souhaite rejoindre votre équipe et participer à vos projets web.', NULL, 'pending', '2026-10-08 08:55:36'),
(2, 2, NULL, 'Marie Martin', 'marie.martin@email.com', '0611223344', 'Mon expérience en PHP et MySQL correspond aux compétences recherchées.', NULL, 'reviewing', '2026-10-08 08:55:36'),
(3, 3, NULL, 'Lucas Bernard', 'lucas.bernard@email.com', '0622334455', 'Je souhaite effectuer mon stage au sein de votre agence.', NULL, 'accepted', '2026-10-08 08:55:36'),
(4, 5, NULL, 'Léa Petit', 'lea.petit@email.com', '0633445566', 'Intégratrice depuis deux ans, je serais ravie de travailler sur vos interfaces.', 'Madame, Monsieur, je vous adresse ma candidature pour ce poste d''intégratrice web.', 'interview', '2026-10-10 11:12:53'),
(5, 7, 2, 'Camille Martin', 'candidat@jobboard.local', '0612345678', 'Bonjour, je suis disponible immédiatement et très motivée par ce poste.', 'Je souhaite mettre mon sens de l''organisation au service de votre équipe.', 'reviewing', '2026-10-16 10:00:00');

INSERT INTO `notifications` (`company_id`, `user_id`, `application_id`, `job_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(7, NULL, 5, 7, 'Nouvelle candidature', 'Camille Martin a postulé à l''offre « Agent polyvalent / Employé(e) de service ».', 'new_application', 1, '2026-10-16 10:00:00'),
(NULL, 2, 5, 7, 'Candidature : En cours d''étude', 'Votre candidature « Agent polyvalent / Employé(e) de service » chez Epitech est désormais : en cours d''étude.', 'application_reviewing', 0, '2026-10-16 14:00:00');
