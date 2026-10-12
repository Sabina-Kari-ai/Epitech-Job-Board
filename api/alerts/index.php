<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../config/auth.php';

$userId = requireAuth();
$pdo = require __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, keyword, location, contract_type, active, created_at, updated_at
         FROM alerts
         WHERE user_id = :user_id
         ORDER BY created_at DESC'
    );

    $stmt->execute([
        'user_id' => $userId
    ]);

    echo json_encode([
        'success' => true,
        'alerts' => $stmt->fetchAll()
    ]);

    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid data.'
        ]);

        exit;
    }

    $keyword = trim($data['keyword'] ?? '');
    $location = trim($data['location'] ?? '');
    $contractType = trim($data['contract_type'] ?? '');

    if ($keyword === '' && $location === '' && $contractType === '') {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'At least one alert criterion is required.'
        ]);

        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO alerts (
            user_id,
            keyword,
            location,
            contract_type,
            active
        ) VALUES (
            :user_id,
            :keyword,
            :location,
            :contract_type,
            1
        )'
    );

    $stmt->execute([
        'user_id' => $userId,
        'keyword' => $keyword !== '' ? $keyword : null,
        'location' => $location !== '' ? $location : null,
        'contract_type' => $contractType !== '' ? $contractType : null
    ]);

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'message' => 'Alert created successfully.',
        'alert_id' => (int) $pdo->lastInsertId()
    ]);

    exit;
}

if ($method === 'PUT' || $method === 'PATCH') {
    $alertId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($alertId <= 0) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Alert ID is required.'
        ]);

        exit;
    }

    $check = $pdo->prepare(
        'SELECT id
         FROM alerts
         WHERE id = :id
         AND user_id = :user_id
         LIMIT 1'
    );

    $check->execute([
        'id' => $alertId,
        'user_id' => $userId
    ]);

    if (!$check->fetch()) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Alert not found.'
        ]);

        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Invalid data.'
        ]);

        exit;
    }

    $keyword = trim($data['keyword'] ?? '');
    $location = trim($data['location'] ?? '');
    $contractType = trim($data['contract_type'] ?? '');
    $active = isset($data['active']) ? (int) (bool) $data['active'] : 1;

    if ($keyword === '' && $location === '' && $contractType === '') {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'At least one alert criterion is required.'
        ]);

        exit;
    }

    $stmt = $pdo->prepare(
        'UPDATE alerts
         SET keyword = :keyword,
             location = :location,
             contract_type = :contract_type,
             active = :active
         WHERE id = :id
         AND user_id = :user_id'
    );

    $stmt->execute([
        'keyword' => $keyword !== '' ? $keyword : null,
        'location' => $location !== '' ? $location : null,
        'contract_type' => $contractType !== '' ? $contractType : null,
        'active' => $active,
        'id' => $alertId,
        'user_id' => $userId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Alert updated successfully.'
    ]);

    exit;
}

if ($method === 'DELETE') {
    $alertId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($alertId <= 0) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Alert ID is required.'
        ]);

        exit;
    }

    $stmt = $pdo->prepare(
        'DELETE FROM alerts
         WHERE id = :id
         AND user_id = :user_id'
    );

    $stmt->execute([
        'id' => $alertId,
        'user_id' => $userId
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Alert not found.'
        ]);

        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Alert deleted successfully.'
    ]);

    exit;
}

http_response_code(405);

echo json_encode([
    'success' => false,
    'message' => 'Method not allowed.'
]);