<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../config/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);

    exit;
}

$sessionName = session_name();

$_SESSION = [];

session_unset();

if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

setcookie($sessionName, '', [
    'expires' => time() - 3600,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Lax'
]);

echo json_encode([
    'success' => true,
    'message' => 'Déconnexion réussie.'
]);

exit;