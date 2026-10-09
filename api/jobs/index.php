<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/../config/database.php";

/**
 * Envoie une réponse JSON et termine le script.
 */
function sendJson(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

/**
 * Récupère et valide les données JSON envoyées dans la requête.
 */
function getRequestData(): array
{
    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);

    if (!is_array($data)) {
        sendJson([
            "error" => "Les données JSON sont invalides."
        ], 400);
    }

    return $data;
}

/**
 * Recherche une entreprise à partir de son identifiant ou de son nom.
 */
function findCompanyId(PDO $pdo, array $data): int
{
    if (!empty($data["company_id"])) {
        $companyId = filter_var(
            $data["company_id"],
            FILTER_VALIDATE_INT
        );

        if ($companyId === false || $companyId < 1) {
            sendJson([
                "error" => "Identifiant d'entreprise invalide."
            ], 400);
        }

        $statement = $pdo->prepare(
            "SELECT id FROM companies WHERE id = ?"
        );
        $statement->execute([$companyId]);

        if (!$statement->fetch()) {
            sendJson([
                "error" => "Cette entreprise n'existe pas."
            ], 404);
        }

        return (int) $companyId;
    }

    $companyName = trim((string) ($data["company"] ?? ""));

    if ($companyName === "") {
        sendJson([
            "error" => "L'entreprise est obligatoire."
        ], 400);
    }

    $statement = $pdo->prepare(
        "SELECT id FROM companies WHERE name = ?"
    );
    $statement->execute([$companyName]);

    $company = $statement->fetch();

    if (!$company) {
        sendJson([
            "error" => "Entreprise introuvable. Vérifiez qu'elle existe dans la base de données."
        ], 400);
    }

    return (int) $company["id"];
}

/**
 * Vérifie et prépare les données d'une offre.
 */
function validateJobData(array $data): array
{
    $title = trim((string) ($data["title"] ?? ""));
    $location = trim((string) ($data["location"] ?? ""));

    $contractType = trim(
        (string) ($data["contract_type"] ?? $data["type"] ?? "")
    );

    $salary = trim((string) ($data["salary"] ?? ""));

    $shortDescription = trim(
        (string) (
            $data["short_description"]
            ?? $data["shortDescription"]
            ?? ""
        )
    );

    $description = trim((string) ($data["description"] ?? ""));

    if (
        $title === ""
        || $location === ""
        || $contractType === ""
        || $shortDescription === ""
        || $description === ""
    ) {
        sendJson([
            "error" => "Veuillez remplir tous les champs obligatoires."
        ], 400);
    }

    return [
        "title" => $title,
        "location" => $location,
        "contract_type" => $contractType,
        "salary" => $salary !== "" ? $salary : null,
        "short_description" => $shortDescription,
        "description" => $description,
        "cover_letter_required" =>
            !empty($data["cover_letter_required"]) ? 1 : 0
    ];
}

try {
    $method = $_SERVER["REQUEST_METHOD"];

    /*
     * GET : récupérer toutes les offres.
     */
    if ($method === "GET") {
        $sql = "
            SELECT
                jobs.id,
                jobs.title,
                jobs.location,
                jobs.contract_type,
                jobs.salary,
                jobs.short_description,
                jobs.description,
                jobs.cover_letter_required,
                jobs.company_id,
                companies.name AS company,
                companies.description AS company_description
            FROM jobs
            INNER JOIN companies
                ON jobs.company_id = companies.id
            ORDER BY jobs.created_at DESC
        ";

        $statement = $pdo->query($sql);

        sendJson($statement->fetchAll());
    }

    /*
     * POST : créer une offre.
     */
    if ($method === "POST") {
        $data = getRequestData();
        $job = validateJobData($data);
        $companyId = findCompanyId($pdo, $data);

        $sql = "
            INSERT INTO jobs (
                company_id,
                title,
                location,
                contract_type,
                salary,
                short_description,
                description,
                cover_letter_required
            ) VALUES (
                :company_id,
                :title,
                :location,
                :contract_type,
                :salary,
                :short_description,
                :description,
                :cover_letter_required
            )
        ";

        $statement = $pdo->prepare($sql);

        $statement->execute([
            ":company_id" => $companyId,
            ":title" => $job["title"],
            ":location" => $job["location"],
            ":contract_type" => $job["contract_type"],
            ":salary" => $job["salary"],
            ":short_description" => $job["short_description"],
            ":description" => $job["description"],
            ":cover_letter_required" => $job["cover_letter_required"]
        ]);

        sendJson([
            "success" => true,
            "message" => "Offre créée avec succès.",
            "id" => (int) $pdo->lastInsertId()
        ], 201);
    }

    /*
     * PUT : modifier une offre existante.
     */
    if ($method === "PUT") {
        $data = getRequestData();

        $id = filter_var(
            $data["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        if ($id === false || $id === null || $id < 1) {
            sendJson([
                "error" => "Identifiant d'offre invalide."
            ], 400);
        }

        $check = $pdo->prepare(
            "SELECT id FROM jobs WHERE id = ?"
        );
        $check->execute([$id]);

        if (!$check->fetch()) {
            sendJson([
                "error" => "Offre introuvable."
            ], 404);
        }

        $job = validateJobData($data);
        $companyId = findCompanyId($pdo, $data);

        $sql = "
            UPDATE jobs SET
                company_id = :company_id,
                title = :title,
                location = :location,
                contract_type = :contract_type,
                salary = :salary,
                short_description = :short_description,
                description = :description,
                cover_letter_required = :cover_letter_required
            WHERE id = :id
        ";

        $statement = $pdo->prepare($sql);

        $statement->execute([
            ":company_id" => $companyId,
            ":title" => $job["title"],
            ":location" => $job["location"],
            ":contract_type" => $job["contract_type"],
            ":salary" => $job["salary"],
            ":short_description" => $job["short_description"],
            ":description" => $job["description"],
            ":cover_letter_required" => $job["cover_letter_required"],
            ":id" => $id
        ]);

        sendJson([
            "success" => true,
            "message" => "Offre modifiée avec succès."
        ]);
    }

    /*
     * DELETE : supprimer une offre sans candidature associée.
     */
    if ($method === "DELETE") {
        $id = filter_var(
            $_GET["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        if ($id === false || $id === null || $id < 1) {
            sendJson([
                "error" => "Identifiant d'offre invalide."
            ], 400);
        }

        $check = $pdo->prepare(
            "SELECT id FROM jobs WHERE id = ?"
        );
        $check->execute([$id]);

        if (!$check->fetch()) {
            sendJson([
                "error" => "Offre introuvable."
            ], 404);
        }

        $checkApplications = $pdo->prepare(
            "SELECT COUNT(*) FROM applications WHERE job_id = ?"
        );
        $checkApplications->execute([$id]);

        if ((int) $checkApplications->fetchColumn() > 0) {
            sendJson([
                "error" => "Cette offre possède des candidatures. Elle ne peut pas être supprimée."
            ], 409);
        }

        $statement = $pdo->prepare(
            "DELETE FROM jobs WHERE id = ?"
        );
        $statement->execute([$id]);

        sendJson([
            "success" => true,
            "message" => "Offre supprimée avec succès."
        ]);
    }

    header("Allow: GET, POST, PUT, DELETE, OPTIONS");

    sendJson([
        "error" => "Méthode non autorisée."
    ], 405);

} catch (PDOException $e) {
    error_log($e->getMessage());

    sendJson([
        "error" => "Erreur lors de l'opération en base de données."
    ], 500);
}