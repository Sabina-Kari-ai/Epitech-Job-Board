<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../config/auth.php';

$userId = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);

    exit;
}

$pdo = require __DIR__ . '/../config/database.php';

$stmt = $pdo->prepare(
    'SELECT cv_path
     FROM users
     WHERE id = :id
     LIMIT 1'
);

$stmt->execute([
    'id' => $userId
]);

$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);

    echo json_encode([
        'success' => false,
        'message' => 'User not found.'
    ]);

    exit;
}

$cvPath = $user['cv_path'];

$stmt = $pdo->prepare(
    'UPDATE users
     SET cv_path = NULL
     WHERE id = :id'
);

$stmt->execute([
    'id' => $userId
]);

if ($cvPath && str_starts_with($cvPath, 'uploads/cv/')) {
    $fullPath = dirname(__DIR__, 2) . '/' . $cvPath;

    if (is_file($fullPath)) {
        unlink($fullPath);
    }
}

echo json_encode([
    'success' => true,
    'message' => 'CV deleted successfully.'
]);