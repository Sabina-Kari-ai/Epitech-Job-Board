-- Select the existing database before importing.

CREATE TABLE IF NOT EXISTS mail_outbox (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    dedupe_key VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('demo','pending','sent','failed') NOT NULL DEFAULT 'demo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
