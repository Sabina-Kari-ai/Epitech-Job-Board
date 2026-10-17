<?php

// Réinitialisation : vérifie le jeton reçu par e-mail puis remplace le mot de passe.

require_once __DIR__ . "/../config/session.php";
require_once __DIR__ . "/../config/database.php";

header("Content-Type: application/json; charset=utf-8");

function sendResetJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST");
    sendResetJson(405, ["error" => "Méthode non autorisée."]);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    sendResetJson(400, ["error" => "Les données envoyées sont invalides."]);
}

$token = trim((string) ($data["token"] ?? ""));
$password = (string) ($data["new_password"] ?? "");
$confirmPassword = (string) ($data["confirm_password"] ?? "");

if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    sendResetJson(400, ["error" => "Le lien de réinitialisation est invalide ou expiré."]);
}

if (strlen($password) < 6 || strlen($password) > 4096) {
    sendResetJson(400, [
        "error" => "Le mot de passe doit contenir entre 6 et 4096 caractères."
    ]);
}

if ($password !== $confirmPassword) {
    sendResetJson(400, ["error" => "Les mots de passe ne correspondent pas."]);
}

try {
    $tokenHash = hash("sha256", $token);

    $pdo->beginTransaction();

    $statement = $pdo->prepare(
        "SELECT id, user_id
         FROM password_resets
         WHERE token_hash = :token_hash
           AND used_at IS NULL
           AND expires_at > NOW()
         LIMIT 1
         FOR UPDATE"
    );
    $statement->execute([":token_hash" => $tokenHash]);
    $reset = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$reset) {
        $pdo->rollBack();
        sendResetJson(400, [
            "error" => "Le lien de réinitialisation est invalide ou expiré."
        ]);
    }

    $updateUser = $pdo->prepare(
        "UPDATE users
         SET password_hash = :password_hash
         WHERE id = :user_id"
    );
    $updateUser->execute([
        ":password_hash" => password_hash($password, PASSWORD_DEFAULT),
        ":user_id" => (int) $reset["user_id"]
    ]);

    if ($updateUser->rowCount() !== 1) {
        $pdo->rollBack();
        sendResetJson(400, [
            "error" => "Impossible de modifier le mot de passe de ce compte."
        ]);
    }

    $markUsed = $pdo->prepare(
        "UPDATE password_resets SET used_at = NOW() WHERE id = :id"
    );
    $markUsed->execute([":id" => (int) $reset["id"]]);

    // Invalide également les autres demandes pour ce compte.
    $deleteOthers = $pdo->prepare(
        "DELETE FROM password_resets
         WHERE user_id = :user_id AND id <> :id"
    );
    $deleteOthers->execute([
        ":user_id" => (int) $reset["user_id"],
        ":id" => (int) $reset["id"]
    ]);

    $pdo->commit();

    sendResetJson(200, [
        "success" => true,
        "message" => "Votre mot de passe a été réinitialisé. Vous pouvez vous connecter."
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($e->getMessage());
    sendResetJson(500, [
        "error" => "Une erreur de base de données est survenue."
    ]);
}