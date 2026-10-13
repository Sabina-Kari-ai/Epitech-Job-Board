CREATE TABLE IF NOT EXISTS `user_documents` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int UNSIGNED NOT NULL,
  `document_type` enum('cv','cover_letter') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_content` mediumblob NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_documents_user_type` (`user_id`,`document_type`),
  CONSTRAINT `fk_user_documents_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
