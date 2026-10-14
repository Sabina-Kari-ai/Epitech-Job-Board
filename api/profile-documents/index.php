<?php
require __DIR__ . '/../config/auth.php';
$id = requireCandidate();
$pdo = require __DIR__ . '/../config/database.php';
$type = $_GET['type'] ?? 'cover_letter';
if (!in_array($type, ['cv','cover_letter'], true)) { http_response_code(400); header('Content-Type: application/json'); echo json_encode(['message'=>'Type de document invalide.']); exit; }
$field = $type . '_path';
$stmt = $pdo->prepare('SELECT ' . $field . ' FROM users WHERE id = ?'); $stmt->execute([$id]); $relative = $stmt->fetchColumn();
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
    $base = realpath(dirname(__DIR__,2).'/uploads'); $file = $relative ? realpath(dirname(__DIR__,2).'/'.$relative) : false;
    if (!$base || !$file || !str_starts_with($file,$base.DIRECTORY_SEPARATOR) || !is_file($file)) { http_response_code(404); exit; }
    header('Content-Type: application/pdf'); header('Content-Disposition: inline; filename="'.$type.'.pdf"'); header('X-Content-Type-Options: nosniff'); header('Cache-Control: private, no-store'); readfile($file); exit;
}
header('Content-Type: application/json; charset=utf-8');
if ($method === 'POST') {
    $file = $_FILES['document'] ?? null;
    if (!$file || $file['error'] !== UPLOAD_ERR_OK || $file['size'] > 5*1024*1024 || $file['size'] === 0 || (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']) !== 'application/pdf') { http_response_code(400); echo json_encode(['message'=>'PDF uniquement, 5 Mo maximum.']); exit; }
    $dir = dirname(__DIR__,2).'/uploads/profile'; if (!is_dir($dir) && !mkdir($dir,0775,true)) { http_response_code(500); exit; }
    $path = 'uploads/profile/'.$type.'_'.$id.'_'.bin2hex(random_bytes(16)).'.pdf';
    if (!move_uploaded_file($file['tmp_name'],dirname(__DIR__,2).'/'.$path)) { http_response_code(500); exit; }
    try { $pdo->prepare('UPDATE users SET '.$field.' = ? WHERE id = ?')->execute([$path,$id]); } catch (Throwable $e) { unlink(dirname(__DIR__,2).'/'.$path); http_response_code(500); echo json_encode(['message'=>'Impossible de sauvegarder le document.']); exit; }
} elseif ($method === 'DELETE') { $pdo->prepare('UPDATE users SET '.$field.' = NULL WHERE id = ?')->execute([$id]); }
else { http_response_code(405); exit; }
// Submitted applications retain their existing attachments.
if ($relative) { $refs=$pdo->prepare('SELECT COUNT(*) FROM applications WHERE '.$field.' = ?');$refs->execute([$relative]);$base=realpath(dirname(__DIR__,2).'/uploads');$old=realpath(dirname(__DIR__,2).'/'.$relative);if (!$refs->fetchColumn() && $base && $old && str_starts_with($old,$base.DIRECTORY_SEPARATOR) && is_file($old)) unlink($old); }
echo json_encode(['success'=>true]);
