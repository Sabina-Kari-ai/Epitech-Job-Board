<?php

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

$email = trim(strtolower($data['email'] ?? ''));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'A valid email address is required.'
    ]);

    exit;
}

$stmt = $pdo->prepare(
    'SELECT id
     FROM users
     WHERE email = :email
     LIMIT 1'
);

$stmt->execute([
    'email' => $email
]);

$user = $stmt->fetch();

$message = 'If an account exists with this email address, a password reset request has been created.';

if (!$user) {
    echo json_encode([
        'success' => true,
        'message' => $message
    ]);

    exit;
}

$pdo->prepare(
    'UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = :user_id
     AND used_at IS NULL'
)->execute([
    'user_id' => $user['id']
]);

$token = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $token);

$stmt = $pdo->prepare(
    'INSERT INTO password_reset_tokens (
        user_id,
        token_hash,
        expires_at
    ) VALUES (
        :user_id,
        :token_hash,
        DATE_ADD(NOW(), INTERVAL 1 HOUR)
    )'
);

$stmt->execute([
    'user_id' => $user['id'],
    'token_hash' => $tokenHash
]);

echo json_encode([
    'success' => true,
    'message' => $message,

    // LOCAL DEVELOPMENT ONLY.
    // Later this token will be sent by email instead.
    'development_reset_token' => $token
]);