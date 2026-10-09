<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../config/auth.php';

$userId = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' &&
    $_SERVER['REQUEST_METHOD'] !== 'PATCH' &&
    $_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);

    exit;
}

$pdo = require __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid data.'
    ]);

    exit;
}

$currentPassword = $data['current_password'] ?? '';
$newPassword = $data['new_password'] ?? '';
$newPasswordConfirmation = $data['new_password_confirmation'] ?? '';

if (
    $currentPassword === '' ||
    $newPassword === '' ||
    $newPasswordConfirmation === ''
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'All password fields are required.'
    ]);

    exit;
}

if (strlen($newPassword) < 8) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'New password must contain at least 8 characters.'
    ]);

    exit;
}

if ($newPassword !== $newPasswordConfirmation) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'New passwords do not match.'
    ]);

    exit;
}

$stmt = $pdo->prepare(
    'SELECT password_hash
     FROM users
     WHERE id = :id
     LIMIT 1'
);

$stmt->execute([
    'id' => $userId
]);

$user = $stmt->fetch();

if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Current password is incorrect.'
    ]);

    exit;
}

$newPasswordHash = password_hash(
    $newPassword,
    PASSWORD_DEFAULT
);

$stmt = $pdo->prepare(
    'UPDATE users
     SET password_hash = :password_hash
     WHERE id = :id'
);

$stmt->execute([
    'password_hash' => $newPasswordHash,
    'id' => $userId
]);

echo json_encode([
    'success' => true,
    'message' => 'Password updated successfully.'
]);