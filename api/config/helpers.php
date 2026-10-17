<?php

// Fonctions partagées par les routes de l'API.

function apiJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function apiBody(): array
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        apiJson(400, ["error" => "Les données JSON sont invalides."]);
    }

    return $data;
}

function apiRequireRole(string ...$roles): int
{
    $userId = (int) ($_SESSION["user_id"] ?? 0);

    if ($userId < 1) {
        apiJson(401, ["error" => "Connecte-toi pour effectuer cette action."]);
    }

    if (!in_array($_SESSION["user_role"] ?? "", $roles, true)) {
        apiJson(403, ["error" => "Accès non autorisé pour ce compte."]);
    }

    return $userId;
}

function apiCompanyOf(PDO $pdo, int $userId): array
{
    $statement = $pdo->prepare(
        "SELECT companies.id, companies.status
         FROM users
         INNER JOIN companies ON companies.id = users.company_id
         WHERE users.id = :id AND users.role = 'company'"
    );
    $statement->execute([":id" => $userId]);
    $company = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$company) {
        apiJson(403, ["error" => "Aucune entreprise n'est associée à ce compte."]);
    }

    return ["id" => (int) $company["id"], "status" => $company["status"]];
}

// Une entreprise ne publie qu'après validation de son inscription.
function apiRequireApprovedCompany(PDO $pdo, int $userId): int
{
    $company = apiCompanyOf($pdo, $userId);

    if ($company["status"] === "pending") {
        apiJson(403, [
            "error" => "Votre inscription est en cours de validation. Vous pourrez publier des offres dès qu'un administrateur l'aura validée.",
            "company_status" => "pending"
        ]);
    }

    if ($company["status"] === "rejected") {
        apiJson(403, [
            "error" => "Votre inscription a été refusée. Contactez l'administration pour plus d'informations.",
            "company_status" => "rejected"
        ]);
    }

    return $company["id"];
}

// Pagination optionnelle : null si ?page est absent (réponse = tableau simple).
function apiPagination(): ?array
{
    if (!isset($_GET["page"])) {
        return null;
    }

    $page = max(1, (int) $_GET["page"]);
    $limit = min(100, max(1, (int) ($_GET["limit"] ?? 10)));

    return ["page" => $page, "limit" => $limit, "offset" => ($page - 1) * $limit];
}

function apiPaginated(array $rows, int $total, array $pagination): array
{
    return [
        "data" => $rows,
        "page" => $pagination["page"],
        "limit" => $pagination["limit"],
        "total" => $total,
        "pages" => max(1, (int) ceil($total / $pagination["limit"]))
    ];
}

// SIRET : 14 chiffres et clé de Luhn (La Poste fait exception).
function apiNormalizeSiret(string $value): ?string
{
    $siret = preg_replace('/\s+/', "", $value);

    if ($siret === str_repeat('0', 14) || !preg_match('/^\d{14}$/', $siret)) {
        return null;
    }

    if (str_starts_with($siret, "356000000")) {
        return array_sum(str_split($siret)) % 5 === 0 ? $siret : null;
    }

    $sum = 0;
    foreach (str_split(strrev($siret)) as $index => $digit) {
        $value = (int) $digit * ($index % 2 === 1 ? 2 : 1);
        $sum += $value > 9 ? $value - 9 : $value;
    }

    return $sum % 10 === 0 ? $siret : null;
}

// Une notification ne doit jamais faire échouer l'action principale.
function apiNotify(PDO $pdo, array $notification): void
{
    try {
        $statement = $pdo->prepare(
            "INSERT INTO notifications
                (company_id, user_id, application_id, job_id, title, message, type)
             VALUES
                (:company_id, :user_id, :application_id, :job_id, :title, :message, :type)"
        );
        $statement->execute([
            ":company_id" => $notification["company_id"] ?? null,
            ":user_id" => $notification["user_id"] ?? null,
            ":application_id" => $notification["application_id"] ?? null,
            ":job_id" => $notification["job_id"] ?? null,
            ":title" => apiTextSlice($notification["title"], 150),
            ":message" => apiTextSlice($notification["message"], 500),
            ":type" => $notification["type"] ?? "info"
        ]);
    } catch (Throwable $e) {
        error_log("Notification non créée : " . $e->getMessage());
    }
}

function apiTextSlice(string $value, int $length): string {
    if (function_exists('mb_substr')) return mb_substr($value, 0, $length, 'UTF-8');
    preg_match_all('/./us', $value, $characters);
    return implode('', array_slice($characters[0] ?? [], 0, $length));
}
