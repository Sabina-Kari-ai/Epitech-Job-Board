<?php

require_once __DIR__ . "/../config/session.php";
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../config/helpers.php";

// Notifications du compte connecté : par entreprise ou par candidat.
try {
    $userId = apiRequireRole("company", "candidate");

    if (($_SESSION["user_role"] ?? "") === "company") {
        $owner = "company_id = :owner";
        $ownerId = apiCompanyOf($pdo, $userId)["id"];
    } else {
        $owner = "user_id = :owner";
        $ownerId = $userId;
    }

    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $limit = min(100, max(1, (int) ($_GET["limit"] ?? 30)));
        $list = $pdo->prepare(
            "SELECT id, application_id, job_id, title, message, type, is_read, created_at
             FROM notifications
             WHERE $owner
             ORDER BY created_at DESC, id DESC
             LIMIT $limit"
        );
        $list->execute([":owner" => $ownerId]);

        $unread = $pdo->prepare(
            "SELECT COUNT(*) FROM notifications WHERE $owner AND is_read = 0"
        );
        $unread->execute([":owner" => $ownerId]);

        apiJson(200, [
            "unread_count" => (int) $unread->fetchColumn(),
            "notifications" => $list->fetchAll()
        ]);
    }

    // PUT : { "id": 3 } marque une notification, { "all": true } marque tout.
    if ($method === "PUT") {
        $body = apiBody();

        if (!empty($body["all"]) || !empty($body["mark_all_read"])) {
            $update = $pdo->prepare(
                "UPDATE notifications SET is_read = 1 WHERE $owner AND is_read = 0"
            );
            $update->execute([":owner" => $ownerId]);
            apiJson(200, ["success" => true, "updated" => $update->rowCount()]);
        }

        $id = filter_var($body["id"] ?? null, FILTER_VALIDATE_INT);
        if (!$id || $id < 1) {
            apiJson(400, ["error" => "Identifiant de notification invalide."]);
        }

        $update = $pdo->prepare(
            "UPDATE notifications SET is_read = 1 WHERE id = :id AND $owner"
        );
        $update->execute([":id" => $id, ":owner" => $ownerId]);

        if ($update->rowCount() === 0) {
            $exists = $pdo->prepare("SELECT id FROM notifications WHERE id = :id AND $owner");
            $exists->execute([":id" => $id, ":owner" => $ownerId]);
            if (!$exists->fetch()) {
                apiJson(404, ["error" => "Notification introuvable."]);
            }
        }

        apiJson(200, ["success" => true]);
    }

    header("Allow: GET, PUT, OPTIONS");
    apiJson(405, ["error" => "Méthode non autorisée."]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    apiJson(500, ["error" => "Impossible de charger les notifications."]);
}
