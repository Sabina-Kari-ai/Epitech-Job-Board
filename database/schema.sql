CREATE DATABASE IF NOT EXISTS job_board
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE job_board;

CREATE TABLE IF NOT EXISTS companies (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id INT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    contract_type VARCHAR(50) NOT NULL,
    salary VARCHAR(100),
    short_description VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    cover_letter_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_jobs_company_id (company_id),
    KEY idx_jobs_location (location),
    KEY idx_jobs_contract_type (contract_type),
    CONSTRAINT fk_jobs_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NULL,
    candidate_name VARCHAR(150) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    cover_letter TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_applications_job_id (job_id),
    KEY idx_applications_user_id (user_id),
    KEY idx_applications_status (status),
    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_application_status
        CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected'))
);

CREATE TABLE IF NOT EXISTS cv_views (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cv_id INT UNSIGNED NOT NULL,
    company_id INT UNSIGNED NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_cv_views_cv_id (cv_id),
    KEY idx_cv_views_company_id (company_id),
    CONSTRAINT fk_cv_views_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
