<?php

// « Mot de passe oublié » : crée un jeton à usage unique (30 min)
// et envoie le lien de réinitialisation par e-mail.

require_once __DIR__ . "/../config/session.php";
require_once __DIR__ . "/../config/database.php";

header("Content-Type: application/json; charset=utf-8");

function sendForgotJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST");
    sendForgotJson(405, ["error" => "Méthode non autorisée."]);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    sendForgotJson(400, ["error" => "Les données envoyées sont invalides."]);
}

$email = strtolower(trim((string) ($data["email"] ?? "")));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendForgotJson(400, ["error" => "Saisissez une adresse e-mail valide."]);
}

$frontendBaseUrl = rtrim(
    getenv("FRONTEND_URL") ?: "http://127.0.0.1:5173",
    "/"
);
$frontendUrl = $frontendBaseUrl . "/reset-password.html";

$fromEmail = getenv("MAIL_FROM") ?: "no-reply@jobboard.local";

try {
    $statement = $pdo->prepare(
        "SELECT id FROM users WHERE email = :email LIMIT 1"
    );
    $statement->execute([":email" => $email]);
    $user = $statement->fetch(PDO::FETCH_ASSOC);

    // Même réponse que le compte existe ou non.
    $genericMessage =
        "Si cette adresse correspond à un compte, des instructions de réinitialisation seront envoyées.";

    if (!$user) {
        sendForgotJson(200, ["success" => true, "message" => $genericMessage]);
    }

    $userId = (int) $user["id"];

    // Invalide les anciennes demandes non utilisées.
    $delete = $pdo->prepare(
        "DELETE FROM password_resets WHERE user_id = :user_id"
    );
    $delete->execute([":user_id" => $userId]);

    // Jeton aléatoire ; seul son SHA-256 sera stocké.
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash("sha256", $token);

    $insert = $pdo->prepare(
        "INSERT INTO password_resets (user_id, token_hash, expires_at)
         VALUES (:user_id, :token_hash, DATE_ADD(NOW(), INTERVAL 30 MINUTE))"
    );
    $insert->execute([
        ":user_id" => $userId,
        ":token_hash" => $tokenHash
    ]);

    $resetUrl = $frontendUrl . "?token=" . urlencode($token);

    $subject = "Réinitialisation de votre mot de passe JobBoard";
    $body =
        "Bonjour,\n\n" .
        "Pour choisir un nouveau mot de passe, ouvrez ce lien :\n\n" .
        $resetUrl . "\n\n" .
        "Ce lien expire dans 30 minutes et ne peut être utilisé qu'une fois.\n\n" .
        "Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.\n";

    $headers = [
        "From" => $fromEmail,
        "Content-Type" => "text/plain; charset=UTF-8"
    ];

    $sent = false;
    try {
        set_error_handler(
            static function (
                int $severity,
                string $message,
                string $file,
                int $line
            ): never {
                throw new ErrorException($message, 0, $severity, $file, $line);
            }
        );
        try {
            $sent = mail($email, $subject, $body, $headers);
        } finally {
            restore_error_handler();
        }
    } catch (Throwable $e) {
        error_log("Échec d'envoi de l'e-mail de réinitialisation : " . $e->getMessage());
        sendForgotJson(503, [
            "error" => "L'envoi de l'e-mail est indisponible. Vérifiez la configuration mail de PHP."
        ]);
    }

    if (!$sent) {
        error_log("Échec d'envoi de l'e-mail de réinitialisation.");
        sendForgotJson(503, [
            "error" => "L'envoi de l'e-mail a échoué. Vérifiez la configuration mail de PHP."
        ]);
    }

    sendForgotJson(200, [
        "success" => true,
        "message" => $genericMessage
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());
    sendForgotJson(500, [
        "error" => "Une erreur de base de données est survenue."
    ]);
}