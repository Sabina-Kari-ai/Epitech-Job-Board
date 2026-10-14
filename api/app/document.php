<?php
require_once __DIR__ . '/../config/auth.php';
$userId = requireAuth();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); exit; }
$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
$type = $_GET['type'] ?? 'cv';
if (!$id || !in_array($type, ['cv', 'cover_letter'], true)) { http_response_code(400); exit; }
$pdo = require __DIR__ . '/../config/database.php';
$stmt = $pdo->prepare('SELECT user_id, cv_path, cover_letter_path FROM applications WHERE id = ?');
$stmt->execute([$id]);
$application = $stmt->fetch();
if (!$application || ($_SESSION['role'] !== 'admin' && ((int) $application['user_id'] !== $userId || $_SESSION['account_type'] !== 'candidate'))) { http_response_code(404); exit; }
$relative = $application[$type . '_path'] ?? '';
$uploads = realpath(dirname(__DIR__, 2) . '/uploads');
$file = $relative ? realpath(dirname(__DIR__, 2) . '/' . $relative) : false;
if (!$uploads || !$file || !str_starts_with($file, $uploads . DIRECTORY_SEPARATOR) || !is_file($file) || strtolower(pathinfo($file, PATHINFO_EXTENSION)) !== 'pdf') { http_response_code(404); exit; }
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . $type . '.pdf"');
header('Content-Length: ' . filesize($file));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
readfile($file);
