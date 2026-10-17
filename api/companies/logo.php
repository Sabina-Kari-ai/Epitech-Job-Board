<?php

// Logo de l'entreprise connectée : l'image est enregistrée dans
// uploads/company-logos/ et son chemin relatif dans companies.logo_path.

require_once __DIR__ . "/../config/session.php";
require_once __DIR__ . "/../config/database.php";

function sendJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST, OPTIONS");
    sendJson(405, ["error" => "Méthode non autorisée."]);
}

$userId = (int) ($_SESSION["user_id"] ?? 0);
$userRole = $_SESSION["user_role"] ?? "";

if ($userId < 1) {
    sendJson(401, ["error" => "Connecte-toi pour enregistrer le logo."]);
}

if ($userRole !== "company") {
    sendJson(403, ["error" => "Seuls les comptes entreprise peuvent modifier le logo."]);
}

if (!isset($_FILES["logo"]) || $_FILES["logo"]["error"] !== UPLOAD_ERR_OK) {
    sendJson(400, ["error" => "Sélectionne un logo valide."]);
}

$file = $_FILES["logo"];

if ($file["size"] > 2 * 1024 * 1024) {
    sendJson(400, ["error" => "Le logo ne doit pas dépasser 2 Mo."]);
}

// On se fie au contenu réel du fichier, pas à l'extension envoyée.
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file["tmp_name"]);

$extensions = [
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp"
];

if (!isset($extensions[$mime])) {
    sendJson(400, ["error" => "Formats autorisés : JPG, PNG et WebP."]);
}

try {
    $query = $pdo->prepare(
        "SELECT company_id FROM users WHERE id = :id AND role = 'company'"
    );
    $query->execute([":id" => $userId]);
    $companyId = (int) $query->fetchColumn();

    if ($companyId < 1) {
        sendJson(403, ["error" => "Aucune entreprise n'est associée à ce compte."]);
    }

    $directory = dirname(__DIR__, 2) . "/uploads/company-logos";

    if (!is_dir($directory) &&
        !mkdir($directory, 0755, true) &&
        !is_dir($directory)) {
        sendJson(500, ["error" => "Impossible de créer le dossier des logos."]);
    }

    // Nom aléatoire : évite les collisions et les noms de fichier piégés.
    $filename = bin2hex(random_bytes(16)) . "." . $extensions[$mime];
    $destination = $directory . "/" . $filename;

    if (!move_uploaded_file($file["tmp_name"], $destination)) {
        sendJson(500, ["error" => "Impossible d'enregistrer le fichier logo."]);
    }

    $relativePath = "uploads/company-logos/" . $filename;

    $update = $pdo->prepare(
        "UPDATE companies
         SET logo_path = :logo_path
         WHERE id = :company_id"
    );

    $update->execute([
        ":logo_path" => $relativePath,
        ":company_id" => $companyId
    ]);

    if ($update->rowCount() === 0) {
        $check = $pdo->prepare("SELECT id FROM companies WHERE id = :id");
        $check->execute([":id" => $companyId]);

        if (!$check->fetchColumn()) {
            @unlink($destination);
            sendJson(404, ["error" => "Entreprise introuvable."]);
        }
    }

    sendJson(200, [
        "success" => true,
        "message" => "Logo enregistré avec succès.",
        "logo_path" => $relativePath
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());
    sendJson(500, ["error" => "Erreur lors de l'enregistrement du logo en base de données."]);
}
