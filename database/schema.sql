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

    city VARCHAR(150) NULL,
    linkedin_url VARCHAR(500) NULL,
    bio TEXT NULL,
    cover_letter_path VARCHAR(500) NULL,
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
