<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../config/auth.php';

$adminId = requireAdmin();
$pdo = require __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query(
        'SELECT
            id,
            firstname,
            lastname,
            email,
            phone,
            role,
            cv_path,
            created_at,
            updated_at
         FROM users
         ORDER BY created_at DESC'
    );

    echo json_encode([
        'success' => true,
        'users' => $stmt->fetchAll()
    ]);

    exit;
}

if ($method === 'PUT' || $method === 'PATCH') {
    $userId = isset($_GET['id'])
        ? (int) $_GET['id']
        : 0;

    if ($userId <= 0) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Identifiant utilisateur obligatoire.'
        ]);

        exit;
    }

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

    $role = $data['role'] ?? '';

    if (!in_array($role, ['candidate', 'admin'], true)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Rôle invalide.'
        ]);

        exit;
    }

    if ($userId === $adminId && $role !== 'admin') {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Vous ne pouvez pas retirer votre propre rôle administrateur.'
        ]);

        exit;
    }

    $check = $pdo->prepare(
        'SELECT id
         FROM users
         WHERE id = :id
         LIMIT 1'
    );

    $check->execute([
        'id' => $userId
    ]);

    if (!$check->fetch()) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Utilisateur introuvable.'
        ]);

        exit;
    }

    $stmt = $pdo->prepare(
        'UPDATE users
         SET role = :role
         WHERE id = :id'
    );

    $stmt->execute([
        'role' => $role,
        'id' => $userId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Rôle modifié avec succès.'
    ]);

    exit;
}

if ($method === 'DELETE') {
    $userId = isset($_GET['id'])
        ? (int) $_GET['id']
        : 0;

    if ($userId <= 0) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Identifiant utilisateur obligatoire.'
        ]);

        exit;
    }

    if ($userId === $adminId) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Vous ne pouvez pas supprimer votre propre compte administrateur.'
        ]);

        exit;
    }

    $stmt = $pdo->prepare(
        'DELETE FROM users
         WHERE id = :id'
    );

    $stmt->execute([
        'id' => $userId
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Utilisateur introuvable.'
        ]);

        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Utilisateur supprimé avec succès.'
    ]);

    exit;
}

http_response_code(405);

echo json_encode([
    'success' => false,
    'message' => 'Méthode non autorisée.'
]);