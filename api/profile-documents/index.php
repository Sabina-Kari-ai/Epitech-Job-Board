<?php

require_once __DIR__ . "/../config/session.php";
require_once __DIR__ . "/../config/database.php";

function sendDocumentJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function currentDocumentUserId(): int
{
    $userId = (int) ($_SESSION["user_id"] ?? 0);
    if ($userId < 1 || ($_SESSION["user_role"] ?? "") !== "candidate") {
        sendDocumentJson(401, ["error" => "Connectez-vous avec un compte candidat."]);
    }

    return $userId;
}

function documentType(string $type): string
{
    if (!in_array($type, ["cv", "cover_letter"], true)) {
        sendDocumentJson(400, ["error" => "Type de document invalide."]);
    }

    return $type;
}

try {
    $method = $_SERVER["REQUEST_METHOD"];
    $userId = currentDocumentUserId();

    if ($method === "GET") {
        $type = $_GET["type"] ?? "";
        if ($type !== "") {
            $type = documentType($type);
            $statement = $pdo->prepare(
                "SELECT file_name, mime_type, file_content
                 FROM user_documents
                 WHERE user_id = :user_id AND document_type = :document_type"
            );
            $statement->execute([
                ":user_id" => $userId,
                ":document_type" => $type
            ]);
            $document = $statement->fetch(PDO::FETCH_ASSOC);

            if (!$document) {
                sendDocumentJson(404, ["error" => "Document introuvable."]);
            }

            header("Content-Type: " . $document["mime_type"]);
            header(
                "Content-Disposition: inline; filename*=UTF-8''" .
                rawurlencode($document["file_name"])
            );
            header("X-Content-Type-Options: nosniff");
            header("Cache-Control: private, no-store");
            $content = $document["file_content"];
            echo is_resource($content) ? stream_get_contents($content) : $content;
            exit;
        }

        $statement = $pdo->prepare(
            "SELECT document_type, file_name, mime_type, updated_at
             FROM user_documents
             WHERE user_id = :user_id
             ORDER BY document_type"
        );
        $statement->execute([":user_id" => $userId]);
        sendDocumentJson(200, $statement->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($method === "POST") {
        $type = documentType((string) ($_POST["type"] ?? ""));
        $file = $_FILES["file"] ?? null;
        if (!$file || $file["error"] === UPLOAD_ERR_NO_FILE) {
            sendDocumentJson(400, ["error" => "Sélectionnez un fichier à enregistrer."]);
        }
        if ($file["error"] !== UPLOAD_ERR_OK) {
            sendDocumentJson(400, ["error" => "Le téléversement du document a échoué."]);
        }
        if ($file["size"] > 5 * 1024 * 1024) {
            sendDocumentJson(400, ["error" => "Le document ne peut pas dépasser 5 Mo."]);
        }

        $extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
        $fileInfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $fileInfo->file($file["tmp_name"]);
        $allowedTypes = [
            "cv" => ["pdf" => ["application/pdf"]],
            "cover_letter" => [
                "pdf" => ["application/pdf"],
                "doc" => ["application/msword"],
                "docx" => [
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/zip"
                ]
            ]
        ];

        if (
            !isset($allowedTypes[$type][$extension]) ||
            !in_array($mimeType, $allowedTypes[$type][$extension], true)
        ) {
            sendDocumentJson(
                400,
                ["error" => $type === "cv"
                    ? "Le CV doit être un fichier PDF valide."
                    : "La lettre doit être un PDF, DOC ou DOCX valide."]
            );
        }

        $content = file_get_contents($file["tmp_name"]);
        if ($content === false) {
            sendDocumentJson(400, ["error" => "Impossible de lire le document envoyé."]);
        }

        $baseName = basename(str_replace("\\", "/", $file["name"]));
        $name = substr(pathinfo($baseName, PATHINFO_FILENAME), 0, 250) .
            "." . $extension;
        $statement = $pdo->prepare(
            "INSERT INTO user_documents
                (user_id, document_type, file_name, mime_type, file_content)
             VALUES
                (:user_id, :document_type, :file_name, :mime_type, :file_content)
             ON DUPLICATE KEY UPDATE
                file_name = VALUES(file_name),
                mime_type = VALUES(mime_type),
                file_content = VALUES(file_content),
                updated_at = CURRENT_TIMESTAMP"
        );
        $statement->bindValue(":user_id", $userId, PDO::PARAM_INT);
        $statement->bindValue(":document_type", $type);
        $statement->bindValue(":file_name", $name);
        $statement->bindValue(":mime_type", $mimeType);
        $statement->bindValue(":file_content", $content, PDO::PARAM_LOB);
        $statement->execute();

        sendDocumentJson(200, [
            "success" => true,
            "document_type" => $type,
            "file_name" => $name
        ]);
    }

    if ($method === "DELETE") {
        $type = documentType((string) ($_GET["type"] ?? ""));
        $statement = $pdo->prepare(
            "DELETE FROM user_documents
             WHERE user_id = :user_id AND document_type = :document_type"
        );
        $statement->execute([
            ":user_id" => $userId,
            ":document_type" => $type
        ]);
        sendDocumentJson(200, ["success" => true]);
    }

    header("Allow: GET, POST, DELETE, OPTIONS");
    sendDocumentJson(405, ["error" => "Méthode non autorisée."]);
} catch (PDOException $error) {
    error_log($error->getMessage());
    sendDocumentJson(500, ["error" => "Une erreur de base de données est survenue."]);
}
