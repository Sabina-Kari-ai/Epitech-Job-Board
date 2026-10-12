<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../config/auth.php';

$userId = requireAuth();
$pdo = require __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, firstname, lastname, email, phone, role, cv_path, created_at, updated_at
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
            'message' => 'Utilisateur introuvable.'
        ]);

        exit;
    }

    echo json_encode([
        'success' => true,
        'user' => $user
    ]);

    exit;
}

if ($method === 'PUT' || $method === 'PATCH') {
    $data = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Données invalides.'
        ]);

        exit;
    }

    $firstname = trim($data['firstname'] ?? '');
    $lastname = trim($data['lastname'] ?? '');
    $email = strtolower(trim($data['email'] ?? ''));
    $phone = trim($data['phone'] ?? '');

    if (
        $firstname === '' ||
        $lastname === '' ||
        $email === ''
    ) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Prénom, nom et email obligatoires.'
        ]);

        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Adresse email invalide.'
        ]);

        exit;
    }

    $checkEmail = $pdo->prepare(
        'SELECT id
         FROM users
         WHERE email = :email
         AND id != :id
         LIMIT 1'
    );

    $checkEmail->execute([
        'email' => $email,
        'id' => $userId
    ]);

    if ($checkEmail->fetch()) {
        http_response_code(409);

        echo json_encode([
            'success' => false,
            'message' => 'Cette adresse email est déjà utilisée.'
        ]);

        exit;
    }

    $stmt = $pdo->prepare(
        'UPDATE users
         SET firstname = :firstname,
             lastname = :lastname,
             email = :email,
             phone = :phone
         WHERE id = :id'
    );

    $stmt->execute([
        'firstname' => $firstname,
        'lastname' => $lastname,
        'email' => $email,
        'phone' => $phone !== '' ? $phone : null,
        'id' => $userId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Profil modifié avec succès.'
    ]);

    exit;
}

if ($method === 'DELETE') {
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
            'message' => 'Utilisateur introuvable.'
        ]);

        exit;
    }

    try {
        $stmt = $pdo->prepare(
            'DELETE FROM users
             WHERE id = :id'
        );

        $stmt->execute([
            'id' => $userId
        ]);

        if (!empty($user['cv_path'])) {
            $fullPath =
                dirname(__DIR__, 2)
                . '/'
                . $user['cv_path'];

            if (is_file($fullPath)) {
                unlink($fullPath);
            }
        }

        $_SESSION = [];
        session_destroy();

        echo json_encode([
            'success' => true,
            'message' => 'Compte supprimé avec succès.'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' => 'Impossible de supprimer le compte.'
        ]);
    }

    exit;
}

http_response_code(405);

echo json_encode([
    'success' => false,
    'message' => 'Méthode non autorisée.'
]);