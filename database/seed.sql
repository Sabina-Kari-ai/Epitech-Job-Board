-- ============================================
-- EPITECH JOB BOARD
-- Test data
-- ============================================

USE epitech_job_board;

-- ============================================
-- USERS
-- ============================================

INSERT INTO users (
    firstname,
    lastname,
    email,
    phone,
    password_hash,
    role
) VALUES
(
    'Admin',
    'JobBoard',
    'admin@jobboard.test',
    '0600000000',
    '$2y$12$PPnCWeuGeBg8/h9zI4aB5.Q1TUiBk89FCqpipfP8LN2nBBR70fFLW',
    'admin'
),
(
    'Test',
    'Candidate',
    'candidate@jobboard.test',
    '0611111111',
    '$2y$12$m98oASZrXpnkTh.ySUuSauJmpsPd/S4TRD8DR4IBab/AUxXTxi2.S',
    'candidate'
);

-- Test passwords:
-- admin@jobboard.test     -> Admin123!
-- candidate@jobboard.test -> Candidate123!


-- ============================================
-- COMPANIES
-- ============================================

INSERT INTO companies (
    name,
    description,
    email,
    phone,
    website
) VALUES
(
    'TechNova',
    'Entreprise spécialisée dans le développement web et les solutions numériques.',
    'contact@technova.test',
    '0200000001',
    'https://technova.test'
),
(
    'DataSphere',
    'Entreprise spécialisée dans la data, le cloud et l intelligence artificielle.',
    'contact@datasphere.test',
    '0200000002',
    'https://datasphere.test'
),
(
    'WebCraft',
    'Agence numérique spécialisée dans les applications web modernes.',
    'contact@webcraft.test',
    '0200000003',
    'https://webcraft.test'
);


-- ============================================
-- JOBS
-- ============================================

INSERT INTO jobs (
    company_id,
    title,
    short_description,
    description,
    location,
    contract_type,
    salary,
    working_time,
    missions,
    profile,
    skills,
    benefits,
    application_deadline,
    cover_letter_required
) VALUES
(
    1,
    'Développeur Web Junior',
    'Participer au développement de plusieurs applications web.',
    'Vous rejoindrez une équipe de développement afin de créer et maintenir des applications web.',
    'Nantes',
    'Alternance',
    NULL,
    '35h',
    'Développer des fonctionnalités, corriger des bugs et participer aux tests.',
    'Étudiant en informatique avec de bonnes bases en développement web.',
    'HTML, CSS, JavaScript, PHP, SQL',
    'Télétravail partiel, tickets restaurant',
    '2026-11-30',
    FALSE
),
(
    2,
    'Assistant Data Analyst',
    'Participer à la préparation et à l analyse des données.',
    'Vous travaillerez avec l équipe Data sur la préparation, le nettoyage et la visualisation de données.',
    'Saint-Herblain',
    'Alternance',
    NULL,
    '35h',
    'Nettoyage de données, création de rapports et tableaux de bord.',
    'Étudiant intéressé par la data et les outils analytiques.',
    'SQL, Python, Excel',
    'Formation interne',
    '2026-12-15',
    TRUE
),
(
    3,
    'Développeur PHP',
    'Développement et maintenance de plateformes web.',
    'WebCraft recherche un développeur PHP junior pour accompagner ses projets clients.',
    'Rezé',
    'Stage',
    1200.00,
    '35h',
    'Développement backend, API REST et intégration avec MySQL.',
    'Bonnes bases en PHP et bases de données relationnelles.',
    'PHP, MySQL, REST API, Git',
    'Horaires flexibles',
    '2026-12-20',
    FALSE
);


-- ============================================
-- APPLICATIONS
-- ============================================

INSERT INTO applications (
    user_id,
    job_id,
    cv_path,
    cover_letter_path,
    status
) VALUES
(
    2,
    1,
    'uploads/cv/test-candidate-cv.pdf',
    NULL,
    'sent'
),
(
    2,
    2,
    'uploads/cv/test-candidate-cv.pdf',
    'uploads/cover-letters/test-candidate-letter.pdf',
    'under_review'
);


-- ============================================
-- ALERTS
-- ============================================

INSERT INTO alerts (
    user_id,
    keyword,
    location,
    contract_type,
    active
) VALUES
(
    2,
    'Développeur',
    'Nantes',
    'Alternance',
    TRUE
),
(
    2,
    'Data',
    'Saint-Herblain',
    'Alternance',
    TRUE
);


-- ============================================
-- CV VIEWS
-- ============================================

INSERT INTO cv_views (
    user_id,
    company_id
) VALUES
(
    2,
    1
),
(
    2,
    2
);