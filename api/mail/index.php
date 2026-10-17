<?php
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
apiRequireRole('admin');
if ($_SERVER['REQUEST_METHOD'] !== 'GET') apiJson(405, ['error'=>'Méthode non autorisée.']);
if (isset($_GET['id'])) {
    $id=filter_var($_GET['id'], FILTER_VALIDATE_INT);
    if (!$id || $id < 1) apiJson(400, ['error'=>'Identifiant invalide.']);
    $query=$pdo->prepare('SELECT id, recipient, subject, body, created_at FROM mail_outbox WHERE id = ?'); $query->execute([$id]);
    $message=$query->fetch(); if (!$message) apiJson(404, ['error'=>'Message introuvable.']);
    apiJson(200, ['message'=>$message]);
}
$messages=$pdo->query('SELECT id, recipient, subject, created_at FROM mail_outbox ORDER BY id DESC LIMIT 100')->fetchAll();
apiJson(200, ['messages'=>$messages]);
