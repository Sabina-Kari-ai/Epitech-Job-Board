<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../config/auth.php';

$userId = requireAuth();
$pdo = require __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, company_id, firstname, lastname, email, phone, role, account_type, cv_path, cover_letter, cover_letter_path, city, linkedin_url, bio, created_at, updated_at
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

    if (array_key_exists('cover_letter', $data) && count($data) === 1) {
        requireCandidate();
        if (!is_string($data['cover_letter']) || strlen($data['cover_letter']) > 20000) {
            http_response_code(400); echo json_encode(['success' => false, 'message' => 'Lettre invalide (20 000 caractères maximum).']); exit;
        }
        $letter = trim($data['cover_letter']);
        $pdo->prepare('UPDATE users SET cover_letter = ? WHERE id = ?')->execute([$letter !== '' ? $letter : null, $userId]);
        echo json_encode(['success' => true, 'message' => 'Lettre de motivation enregistrée.']); exit;
    }
    $extra = [];
    foreach (['city' => 150, 'linkedin_url' => 500, 'bio' => 5000] as $field => $limit) {
        if (!array_key_exists($field, $data)) continue;
        if (!is_string($data[$field]) || strlen($data[$field]) > $limit) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Champ de profil invalide.']); exit; }
        $extra[$field] = trim($data[$field]);
    }
    if (!empty($extra['linkedin_url']) && (!filter_var($extra['linkedin_url'], FILTER_VALIDATE_URL) || !in_array(strtolower(parse_url($extra['linkedin_url'], PHP_URL_SCHEME) ?? ''), ['http','https'], true))) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'URL LinkedIn invalide.']); exit; }
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

    foreach ($extra as $field => $value) { $pdo->prepare('UPDATE users SET ' . $field . ' = ? WHERE id = ?')->execute([$value !== '' ? $value : null, $userId]); }
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

            // Submitted applications retain access to their attached CV.
            $references = $pdo->prepare('SELECT COUNT(*) FROM applications WHERE cv_path = ?');
            $references->execute([$user['cv_path']]);
            if ((int) $references->fetchColumn() === 0 && is_file($fullPath)) {
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