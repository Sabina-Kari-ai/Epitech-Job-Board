USE epitech_job_board;


-- ============================================
-- COMPANIES
-- ============================================

INSERT INTO companies (
    name,
    location,
    description,
    email,
    phone,
    website
) VALUES
(
    'Tech Solutions',
    'Paris',
    'Entreprise spécialisée dans le développement de solutions numériques.',
    'contact@techsolutions.test',
    '0100000001',
    'https://example.com'
),
(
    'Digital Services',
    'Lyon',
    'Entreprise spécialisée dans les services numériques et les applications web.',
    'contact@digitalservices.test',
    '0100000002',
    NULL
),
(
    'Innovation Agency',
    'Paris',
    'Agence spécialisée dans les projets web et les nouvelles technologies.',
    'contact@innovationagency.test',
    '0100000003',
    NULL
),
(
    'Web Business',
    'Lille',
    'Entreprise spécialisée dans la création et le développement de sites web.',
    'contact@webbusiness.test',
    '0100000004',
    NULL
),
(
    'France Numérique',
    'Paris',
    'Entreprise spécialisée dans les services numériques.',
    'contact@francenumerique.test',
    '0100000005',
    NULL
),
(
    'Future Systems',
    'Lyon',
    'Entreprise spécialisée dans les solutions logicielles.',
    'contact@futuresystems.test',
    '0100000006',
    NULL
);


-- ============================================
-- USERS
-- ============================================

INSERT INTO users (
    company_id,
    firstname,
    lastname,
    email,
    phone,
    password_hash,
    role,
    account_type
) VALUES
(
    NULL,
    'Admin',
    'JobBoard',
    'admin@jobboard.test',
    '0600000000',
    '$2y$12$xSAzJaKiNEPXLXfb6jXkoOyy9zZhx5PQl2gS/mqil12vsUN/GFYTq',
    'admin',
    'candidate'
),
(
    NULL,
    'Test',
    'Candidate',
    'candidate@jobboard.test',
    '0611111111',
    '$2y$12$1vl7A7IX3ZiD9JTVJS6am..7np54eE8dgM0ahdqdeIuJ3GBuLtMhC',
    'candidate',
    'candidate'
),
(
    1,
    'Sophie',
    'Martin',
    'entreprise@jobboard.test',
    '0622222222',
    '$2y$12$H0VM/FhlDp7y7/hqfqw8cei/kBKqi6pAcSjsOUHNRSwm/aAhpWtNy',
    'candidate',
    'company'
);

-- Test passwords:
-- admin@jobboard.test      -> Admin123!
-- candidate@jobboard.test  -> Candidate123!
-- entreprise@jobboard.test -> Company123!


-- ============================================
-- JOBS
-- ============================================

INSERT INTO jobs (
    company_id,
    title,
    location,
    contract_type,
    salary,
    short_description,
    description,
    skills,
    cover_letter_required
) VALUES
(
    1,
    'Développeur Web Full Stack',
    'Paris',
    'CDI',
    '40k - 50k €',
    'Développement d’applications web modernes.',
    'Développement frontend et backend au sein d’une équipe technique.',
    'HTML, CSS, JavaScript, PHP, MySQL',
    FALSE
),
(
    2,
    'Backend Developer PHP',
    'Lyon',
    'CDI',
    '38k - 48k €',
    'Développement backend avec PHP.',
    'Développement et maintenance des applications backend.',
    'PHP, MySQL, API REST, Git',
    FALSE
),
(
    3,
    'Développeur JavaScript',
    'Paris',
    'Alternance',
    '1 200 €/mois',
    'Alternance en développement JavaScript.',
    'Participation au développement d’interfaces web modernes.',
    'JavaScript, HTML, CSS, Git',
    FALSE
),
(
    4,
    'Développeur Frontend',
    'Lille',
    'Alternance',
    '1 200 €/mois',
    'Développement frontend en alternance.',
    'Création et amélioration d’interfaces web responsives.',
    'HTML, CSS, JavaScript',
    FALSE
),
(
    5,
    'Intégrateur Web',
    'Paris',
    'CDD',
    '32k - 38k €',
    'Intégration de maquettes web.',
    'Intégration HTML/CSS et amélioration des interfaces.',
    'HTML, CSS, Responsive Design',
    TRUE
),
(
    6,
    'Ingénieur Logiciel',
    'Lyon',
    'CDI',
    '45k - 55k €',
    'Conception de solutions logicielles.',
    'Participation au développement de solutions logicielles.',
    'Software Engineering, API, Git',
    FALSE
);


-- ============================================
-- APPLICATIONS
-- ============================================

INSERT INTO applications (
    job_id,
    user_id,
    candidate_name,
    candidate_email,
    candidate_phone,
    message,
    status
) VALUES
(
    1,
    2,
    'Test Candidate',
    'candidate@jobboard.test',
    '0611111111',
    'Je souhaite rejoindre votre équipe.',
    'pending'
),
(
    2,
    NULL,
    'Marie Martin',
    'marie.martin@email.com',
    '0611223344',
    'Mon expérience PHP correspond au poste.',
    'reviewing'
),
(
    3,
    NULL,
    'Lucas Bernard',
    'lucas.bernard@email.com',
    '0622334455',
    'Je souhaite rejoindre votre entreprise.',
    'accepted'
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
    'Paris',
    'Alternance',
    TRUE
),
(
    2,
    'PHP',
    'Lyon',
    'CDI',
    TRUE
);