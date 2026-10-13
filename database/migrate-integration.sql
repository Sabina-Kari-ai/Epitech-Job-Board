-- Run with an existing database selected. Preserves existing accounts and rows.
-- MariaDB: SOURCE database/migrate-integration.sql;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS location VARCHAR(255) NOT NULL DEFAULT '';
UPDATE companies c JOIN (SELECT company_id, MIN(location) AS location FROM jobs GROUP BY company_id) j ON j.company_id = c.id
SET c.location = j.location WHERE c.location = '';

ALTER TABLE users
 ADD COLUMN IF NOT EXISTS company_id INT UNSIGNED NULL,
 ADD COLUMN IF NOT EXISTS account_type ENUM('candidate', 'company') NOT NULL DEFAULT 'candidate',
 ADD INDEX IF NOT EXISTS idx_users_company_id (company_id),
 ADD INDEX IF NOT EXISTS idx_users_account_type (account_type);

ALTER TABLE jobs MODIFY COLUMN salary VARCHAR(100) NULL;

ALTER TABLE applications
 ADD COLUMN IF NOT EXISTS candidate_name VARCHAR(200) NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS candidate_email VARCHAR(255) NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS candidate_phone VARCHAR(50) NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS message TEXT NULL,
 ADD COLUMN IF NOT EXISTS cover_letter TEXT NULL,
 MODIFY COLUMN user_id INT UNSIGNED NULL,
 MODIFY COLUMN cv_path VARCHAR(500) NULL,
 MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'pending';

UPDATE applications a LEFT JOIN users u ON u.id = a.user_id
SET a.candidate_name = IF(a.candidate_name = '', COALESCE(CONCAT(u.firstname, ' ', u.lastname), 'Candidat'), a.candidate_name),
    a.candidate_email = IF(a.candidate_email = '', COALESCE(u.email, ''), a.candidate_email),
    a.candidate_phone = IF(a.candidate_phone = '', COALESCE(u.phone, ''), a.candidate_phone),
    a.message = COALESCE(a.message, ''),
    a.status = CASE a.status WHEN 'sent' THEN 'pending' WHEN 'under_review' THEN 'reviewing' WHEN 'interview' THEN 'reviewing' ELSE a.status END;
ALTER TABLE applications MODIFY COLUMN message TEXT NOT NULL;

-- Keep company links consistent and preserve applications after account deletion.
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_company,
 ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE applications DROP FOREIGN KEY IF EXISTS fk_applications_user,
 ADD CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS mail_outbox (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    dedupe_key VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('demo','pending','sent','failed') NOT NULL DEFAULT 'demo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_letter TEXT NULL;
