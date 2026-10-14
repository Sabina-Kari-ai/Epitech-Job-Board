<?php
require_once __DIR__ . '/session.php';

function authError(int $status, string $message): void {
    http_response_code($status);
    echo json_encode(['success' => false, 'message' => $message, 'error' => $message]);
    exit;
}

function requireAuth(): int {
    if (empty($_SESSION['user_id'])) authError(401, 'Authentification requise.');
    // Refresh permissions so deleted users and changed roles take effect immediately.
    static $checked = false;
    if (!$checked) {
        $pdo = require __DIR__ . '/database.php';
        $stmt = $pdo->prepare('SELECT id, role, account_type, company_id FROM users WHERE id = ?');
        $stmt->execute([(int) $_SESSION['user_id']]);
        $user = $stmt->fetch();
        if (!$user) {
            $_SESSION = [];
            authError(401, 'Veuillez vous reconnecter.');
        }
        $_SESSION['role'] = $user['role'];
        $_SESSION['account_type'] = $user['account_type'];
        $_SESSION['company_id'] = $user['company_id'];
        $checked = true;
    }
    return (int) $_SESSION['user_id'];
}

function requireAdmin(): int {
    $id = requireAuth();
    if ($_SESSION['role'] !== 'admin') authError(403, 'Accès administrateur requis.');
    return $id;
}

function requireCandidate(): int {
    $id = requireAuth();
    if ($_SESSION['account_type'] !== 'candidate' || $_SESSION['role'] === 'admin') {
        authError(403, 'Cette fonctionnalité est réservée aux candidats.');
    }
    return $id;
}
