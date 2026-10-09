<?php

require_once __DIR__ . '/session.php';

function requireAuth(): int
{
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'Authentication required.'
        ]);

        exit;
    }

    return (int) $_SESSION['user_id'];
}

function requireAdmin(): int
{
    $userId = requireAuth();

    if (($_SESSION['role'] ?? '') !== 'admin') {
        http_response_code(403);

        echo json_encode([
            'success' => false,
            'message' => 'Administrator access required.'
        ]);

        exit;
    }

    return $userId;
}