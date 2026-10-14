<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/auth.php';
requireAdmin();
$pdo = require __DIR__ . '/../config/database.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée.']);
    exit;
}
$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
if (isset($_GET['id'])) {
    if (!$id || $id < 1) { http_response_code(400); echo json_encode(['error' => 'Identifiant invalide.']); exit; }
    $stmt = $pdo->prepare('SELECT id, recipient, subject, body, status, created_at FROM mail_outbox WHERE id = ?');
    $stmt->execute([$id]);
    $message = $stmt->fetch();
    if (!$message) { http_response_code(404); echo json_encode(['error' => 'Message introuvable.']); exit; }
    echo json_encode(['message' => $message], JSON_UNESCAPED_UNICODE);
} else {
    $messages = $pdo->query('SELECT id, recipient, subject, status, created_at FROM mail_outbox ORDER BY id DESC LIMIT 100')->fetchAll();
    echo json_encode(['messages' => $messages], JSON_UNESCAPED_UNICODE);
}
