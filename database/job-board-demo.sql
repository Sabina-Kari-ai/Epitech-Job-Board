-- Fresh demo installation only. No private data or credentials.
CREATE DATABASE IF NOT EXISTS epitech_job_board
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE epitech_job_board;


-- ============================================
-- COMPANIES
-- ============================================

CREATE TABLE companies (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT NULL,

    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    website VARCHAR(255) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================
-- USERS
-- role = permissions
-- account_type = candidate / company
-- ============================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    company_id INT UNSIGNED NULL,

    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM(
        'candidate',
        'admin'
    ) NOT NULL DEFAULT 'candidate',

    account_type ENUM(
        'candidate',
        'company'
    ) NOT NULL DEFAULT 'candidate',

    cv_path VARCHAR(500) NULL,
    cover_letter TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    KEY idx_users_company_id (company_id),
    KEY idx_users_email (email),
    KEY idx_users_account_type (account_type),

    CONSTRAINT fk_users_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- ============================================
-- JOBS
-- ============================================

CREATE TABLE jobs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    company_id INT UNSIGNED NOT NULL,

    title VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    contract_type VARCHAR(50) NOT NULL,

    salary VARCHAR(100) NULL,

    short_description VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    skills TEXT NULL,
    missions TEXT NULL,
    profile TEXT NULL,
    benefits TEXT NULL,
    working_time VARCHAR(100) NULL,

    cover_letter_required BOOLEAN NOT NULL DEFAULT FALSE,

    application_deadline DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    KEY idx_jobs_company_id (company_id),
    KEY idx_jobs_title (title),
    KEY idx_jobs_location (location),
    KEY idx_jobs_contract_type (contract_type),

    CONSTRAINT fk_jobs_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================
-- APPLICATIONS
-- ============================================

CREATE TABLE applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    job_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NULL,

    candidate_name VARCHAR(150) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_phone VARCHAR(50) NOT NULL,

    message TEXT NOT NULL,
    cover_letter TEXT NULL,

    cv_path VARCHAR(500) NULL,
    cover_letter_path VARCHAR(500) NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    KEY idx_applications_job_id (job_id),
    KEY idx_applications_user_id (user_id),
    KEY idx_applications_status (status),
    KEY idx_applications_email (candidate_email),

    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_applications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_application_status
        CHECK (
            status IN (
                'pending',
                'reviewing',
                'accepted',
                'rejected'
            )
        )
);


-- ============================================
-- ALERTS
-- ============================================

CREATE TABLE alerts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    keyword VARCHAR(255) NULL,
    location VARCHAR(255) NULL,
    contract_type VARCHAR(100) NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    KEY idx_alerts_user_id (user_id),

    CONSTRAINT fk_alerts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ============================================
-- CV VIEWS
-- ============================================

CREATE TABLE cv_views (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    cv_id INT UNSIGNED NULL,
    user_id INT UNSIGNED NULL,
    company_id INT UNSIGNED NOT NULL,

    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    KEY idx_cv_views_cv_id (cv_id),
    KEY idx_cv_views_user_id (user_id),
    KEY idx_cv_views_company_id (company_id),

    CONSTRAINT fk_cv_views_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_cv_views_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ============================================
-- PASSWORD RESET
-- ============================================

CREATE TABLE password_reset_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    token_hash VARCHAR(255) NOT NULL UNIQUE,

    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    KEY idx_password_reset_user_id (user_id),

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS mail_outbox (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    dedupe_key VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('demo','pending','sent','failed') NOT NULL DEFAULT 'demo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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