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

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (str_contains($contentType, 'application/json')) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON data.'
        ]);

        exit;
    }
} else {
    $data = $_POST;
}

$firstname = trim($data['firstname'] ?? '');
$lastname = trim($data['lastname'] ?? '');
$email = trim(strtolower($data['email'] ?? ''));
$phone = trim($data['phone'] ?? '');
$password = $data['password'] ?? '';
$passwordConfirmation = $data['password_confirmation'] ?? '';

if (
    $firstname === '' ||
    $lastname === '' ||
    $email === '' ||
    $password === '' ||
    $passwordConfirmation === ''
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Please fill in all required fields.'
    ]);

    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid email address.'
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

$checkUser = $pdo->prepare(
    'SELECT id FROM users WHERE email = :email LIMIT 1'
);

$checkUser->execute([
    'email' => $email
]);

if ($checkUser->fetch()) {
    http_response_code(409);

    echo json_encode([
        'success' => false,
        'message' => 'An account already exists with this email address.'
    ]);

    exit;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

try {
    $statement = $pdo->prepare(
        'INSERT INTO users (
            firstname,
            lastname,
            email,
            phone,
            password_hash,
            role
        ) VALUES (
            :firstname,
            :lastname,
            :email,
            :phone,
            :password_hash,
            :role
        )'
    );

    $statement->execute([
        'firstname' => $firstname,
        'lastname' => $lastname,
        'email' => $email,
        'phone' => $phone !== '' ? $phone : null,
        'password_hash' => $passwordHash,
        'role' => 'candidate'
    ]);

    $userId = (int) $pdo->lastInsertId();

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully.',
        'user' => [
            'id' => $userId,
            'firstname' => $firstname,
            'lastname' => $lastname,
            'email' => $email,
            'phone' => $phone !== '' ? $phone : null,
            'role' => 'candidate'
        ]
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        http_response_code(409);

        echo json_encode([
            'success' => false,
            'message' => 'An account already exists with this email address.'
        ]);

        exit;
    }

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to create account.'
    ]);
}