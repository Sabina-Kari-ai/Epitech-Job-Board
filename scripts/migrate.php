<?php
// Additive upgrade for an existing partner schema (MariaDB or MySQL 8).
// No DROP, DELETE, table replacement, account changes, or seed import.
require __DIR__ . '/../api/config/database.php';
$fields = ['skills'=>'TEXT NULL','missions'=>'TEXT NULL','profile'=>'TEXT NULL','benefits'=>'TEXT NULL','working_time'=>'TEXT NULL','application_deadline'=>'DATE NULL'];
$columns = $pdo->query('SHOW COLUMNS FROM jobs')->fetchAll(PDO::FETCH_COLUMN);
foreach ($fields as $name=>$type) {
    if (!in_array($name, $columns, true)) $pdo->exec('ALTER TABLE jobs ADD COLUMN `'.$name.'` '.$type);
}
$pdo->exec('CREATE TABLE IF NOT EXISTS candidate_alerts (user_id INT UNSIGNED PRIMARY KEY, alerts_json LONGTEXT NOT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT fk_candidate_alerts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
$pdo->exec('CREATE TABLE IF NOT EXISTS mail_outbox (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT UNSIGNED NULL, recipient VARCHAR(255) NOT NULL, subject VARCHAR(255) NOT NULL, body TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_mail_outbox_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
echo "Migration complete; existing data preserved.\n";
