-- ============================================
-- EPITECH JOB BOARD
-- Shared database schema
-- Partner structure + authentication/user features
-- MySQL / MariaDB
-- ============================================

CREATE DATABASE IF NOT EXISTS job_board
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE job_board;


-- ============================================
-- USERS
-- Authentication / candidate / admin
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    password_hash VARCHAR(255) NOT NULL,

    role ENUM(
        'candidate',
        'admin'
    ) NOT NULL DEFAULT 'candidate',

    cv_path VARCHAR(500) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================
-- COMPANIES
-- Partner structure kept
-- ============================================

CREATE TABLE IF NOT EXISTS companies (
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
-- JOBS
-- Partner structure kept
-- ============================================

CREATE TABLE IF NOT EXISTS jobs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    company_id INT UNSIGNED NOT NULL,

    title VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    contract_type VARCHAR(50) NOT NULL,

    salary VARCHAR(100) NULL,

    short_description VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    cover_letter_required BOOLEAN NOT NULL DEFAULT FALSE,

    working_time VARCHAR(100) NULL,
    missions TEXT NULL,
    profile TEXT NULL,
    skills TEXT NULL,
    benefits TEXT NULL,
    application_deadline DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    KEY idx_jobs_company_id (company_id),
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
-- Partner Apply structure kept
-- User/CV compatibility added
-- ============================================

CREATE TABLE IF NOT EXISTS applications (
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
                'interview',
                'accepted',
                'rejected'
            )
        )
);


-- ============================================
-- ALERTS
-- Candidate job alerts
-- ============================================

CREATE TABLE IF NOT EXISTS alerts (
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
-- Compatible with partner structure
-- ============================================

CREATE TABLE IF NOT EXISTS cv_views (
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
-- PASSWORD RESET TOKENS
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
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


-- ============================================
-- ADDITIONAL INDEXES
-- ============================================

CREATE INDEX idx_jobs_title
    ON jobs(title);

CREATE INDEX idx_applications_email
    ON applications(candidate_email);