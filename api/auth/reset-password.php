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

$token = trim($data['token'] ?? '');
$password = $data['password'] ?? '';
$passwordConfirmation = $data['password_confirmation'] ?? '';

if (
    $token === '' ||
    $password === '' ||
    $passwordConfirmation === ''
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Token and password fields are required.'
    ]);

    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Password must contain at least 8 characters.'
    ]);

    exit;
}

if ($password !== $passwordConfirmation) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Passwords do not match.'
    ]);

    exit;
}

$tokenHash = hash('sha256', $token);

$stmt = $pdo->prepare(
    'SELECT id, user_id
     FROM password_reset_tokens
     WHERE token_hash = :token_hash
     AND used_at IS NULL
     AND expires_at > NOW()
     LIMIT 1'
);

$stmt->execute([
    'token_hash' => $tokenHash
]);

$resetToken = $stmt->fetch();

if (!$resetToken) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid or expired reset token.'
    ]);

    exit;
}

$newPasswordHash = password_hash(
    $password,
    PASSWORD_DEFAULT
);

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'UPDATE users
         SET password_hash = :password_hash
         WHERE id = :user_id'
    );

    $stmt->execute([
        'password_hash' => $newPasswordHash,
        'user_id' => $resetToken['user_id']
    ]);

    $stmt = $pdo->prepare(
        'UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE id = :id'
    );

    $stmt->execute([
        'id' => $resetToken['id']
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Password reset successfully.'
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to reset password.'
    ]);
}