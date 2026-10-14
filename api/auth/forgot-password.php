<?php
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']); exit;
}
$data = json_decode(file_get_contents('php://input'), true);
$email = is_array($data) && is_string($data['email'] ?? null) ? strtolower(trim($data['email'])) : '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400); echo json_encode(['success' => false, 'message' => 'Adresse email invalide.']); exit;
}
$pdo = require __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/mailer.php';
$stmt = $pdo->prepare('SELECT id, firstname FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();
if ($user) {
    try {
        $pdo->beginTransaction();
        $pdo->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE')->execute([$user['id']]);
        $pdo->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL')->execute([$user['id']]);
        $token = bin2hex(random_bytes(32));
        $hash = hash('sha256', $token);
        $pdo->prepare('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))')->execute([$user['id'], $hash]);
        $body = 'Bonjour ' . $user['firstname'] . ",\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable une heure) :\n"
            . projectUrl('reset-password.html?token=' . $token)
            . "\n\nSi vous n'avez pas demandé ce changement, ignorez ce message.";
        sendProjectMail($pdo, $email, 'Réinitialisation de votre mot de passe JobBoard', $body, 'reset:' . $hash);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Password reset email failed: ' . $e->getMessage());
    }
}
// Never expose reset tokens in the public response, even in demo mode.
echo json_encode(['success' => true, 'message' => 'Si un compte existe avec cette adresse, un message de réinitialisation a été préparé.'], JSON_UNESCAPED_UNICODE);
