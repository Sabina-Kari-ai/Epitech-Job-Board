<?php

// Entreprises : GET public (seulement les entreprises validées), et pour
// l'admin POST/PUT/DELETE ainsi que PATCH ?id= pour valider une inscription.

require_once __DIR__ . "/../config/session.php";
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../config/helpers.php";

const COMPANY_STATUSES = ["pending", "approved", "rejected"];

function findCompany(PDO $pdo, int $id): array
{
    $statement = $pdo->prepare("SELECT id, name, status FROM companies WHERE id = ?");
    $statement->execute([$id]);
    $company = $statement->fetch();

    if (!$company) {
        apiJson(404, ["error" => "Entreprise introuvable."]);
    }

    return $company;
}

function companyIdFromQuery(): int
{
    $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        apiJson(400, ["error" => "Identifiant d'entreprise invalide."]);
    }

    return $id;
}

// Champs communs à la création et à la modification par l'admin.
function readCompanyFields(): array
{
    $data = apiBody();
    $fields = [
        "id" => $data["id"] ?? null,
        "name" => trim((string) ($data["name"] ?? "")),
        "location" => trim((string) ($data["location"] ?? "")),
        "description" => trim((string) ($data["description"] ?? "")),
        "siret" => null,
        "status" => $data["status"] ?? "approved"
    ];

    if ($fields["name"] === "" || $fields["location"] === "") {
        apiJson(400, ["error" => "Le nom et le lieu sont obligatoires."]);
    }

    $siret = trim((string) ($data["siret"] ?? ""));
    if ($siret !== "") {
        $fields["siret"] = apiNormalizeSiret($siret);
        if ($fields["siret"] === null) {
            apiJson(400, ["error" => "Le numéro SIRET est invalide."]);
        }
    }

    if (!in_array($fields["status"], COMPANY_STATUSES, true)) {
        apiJson(400, ["error" => "Statut d'entreprise invalide."]);
    }

    return $fields;
}

try {
    $method = $_SERVER["REQUEST_METHOD"];
    $isAdmin = ($_SESSION["user_role"] ?? "") === "admin";

    // GET : liste (publique = entreprises validées) ou détail ?id=.
    if ($method === "GET") {
        $sql = "SELECT companies.id, companies.name, companies.location,
                       companies.description, companies.logo_path,
                       companies.created_at, companies.status,
                       (SELECT COUNT(*) FROM jobs WHERE jobs.company_id = companies.id) AS jobs_count"
            . ($isAdmin
                ? ", companies.siret, companies.validated_at,
                   (SELECT CONCAT(users.first_name, ' ', users.last_name, ' <', users.email, '>')
                    FROM users WHERE users.company_id = companies.id
                    ORDER BY users.id LIMIT 1) AS contact"
                : "")
            . " FROM companies";

        $conditions = [];
        $params = [];

        if (!$isAdmin) {
            $conditions[] = "companies.status = 'approved'";
        } elseif (in_array($_GET["status"] ?? "", COMPANY_STATUSES, true)) {
            $conditions[] = "companies.status = :status";
            $params[":status"] = $_GET["status"];
        }

        $search = trim((string) ($_GET["q"] ?? ""));
        if ($search !== "") {
            $conditions[] = "(companies.name LIKE :q_name OR companies.location LIKE :q_location
                              OR companies.siret LIKE :q_siret)";
            $params[":q_name"] = $params[":q_location"] = $params[":q_siret"] = "%" . $search . "%";
        }

        if (isset($_GET["id"])) {
            $conditions[] = "companies.id = :id";
            $params[":id"] = companyIdFromQuery();
        }

        $where = $conditions ? " WHERE " . implode(" AND ", $conditions) : "";

        if (isset($_GET["id"])) {
            $statement = $pdo->prepare($sql . $where);
            $statement->execute($params);
            $company = $statement->fetch();

            if (!$company) {
                apiJson(404, ["error" => "Entreprise introuvable."]);
            }

            apiJson(200, $company);
        }

        // Les inscriptions en attente remontent en premier pour l'admin.
        $sql .= $where . " ORDER BY companies.status = 'pending' DESC, companies.name";
        $pagination = apiPagination();

        if ($pagination) {
            $count = $pdo->prepare("SELECT COUNT(*) FROM companies" . $where);
            $count->execute($params);
            $sql .= " LIMIT {$pagination["limit"]} OFFSET {$pagination["offset"]}";
        }

        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        $companies = $statement->fetchAll();

        if ($pagination) {
            apiJson(200, apiPaginated($companies, (int) $count->fetchColumn(), $pagination));
        }

        apiJson(200, $companies);
    }

    if (!in_array($method, ["POST", "PUT", "PATCH", "DELETE"], true)) {
        header("Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        apiJson(405, ["error" => "Méthode non autorisée."]);
    }

    apiRequireRole("admin");

    // PATCH ?id= : validation ou refus d'une inscription.
    if ($method === "PATCH") {
        $id = companyIdFromQuery();
        $company = findCompany($pdo, $id);
        $status = apiBody()["status"] ?? "";

        if (!in_array($status, COMPANY_STATUSES, true)) {
            apiJson(400, ["error" => "Statut invalide.", "allowed_statuses" => COMPANY_STATUSES]);
        }

        $pdo->prepare(
            "UPDATE companies
             SET status = :status,
                 validated_at = IF(:approved = 1, NOW(), validated_at)
             WHERE id = :id"
        )->execute([":status" => $status, ":approved" => $status === "approved" ? 1 : 0, ":id" => $id]);

        if ($status !== $company["status"] && $status !== "pending") {
            apiNotify($pdo, [
                "company_id" => $id,
                "type" => "company_" . $status,
                "title" => $status === "approved" ? "Inscription validée" : "Inscription refusée",
                "message" => $status === "approved"
                    ? "Votre entreprise a été validée : vous pouvez désormais publier des offres."
                    : "Votre inscription n'a pas été acceptée. Contactez l'administration pour en savoir plus."
            ]);
        }

        apiJson(200, [
            "success" => true,
            "message" => $status === "approved"
                ? "Entreprise validée."
                : ($status === "rejected" ? "Inscription refusée." : "Entreprise remise en attente."),
            "status" => $status
        ]);
    }

    if ($method === "DELETE") {
        $id = companyIdFromQuery();
        findCompany($pdo, $id);

        $jobsCheck = $pdo->prepare("SELECT COUNT(*) FROM jobs WHERE company_id = ?");
        $jobsCheck->execute([$id]);

        if ((int) $jobsCheck->fetchColumn() > 0) {
            apiJson(409, [
                "error" => "Impossible de supprimer cette entreprise : des offres lui sont associées."
            ]);
        }

        $pdo->prepare("DELETE FROM companies WHERE id = ?")->execute([$id]);

        apiJson(200, ["success" => true, "message" => "Entreprise supprimée avec succès."]);
    }

    $fields = readCompanyFields();

    if ($fields["siret"] !== null) {
        $duplicate = $pdo->prepare("SELECT id FROM companies WHERE siret = ? AND id <> ?");
        $duplicate->execute([$fields["siret"], (int) $fields["id"]]);
        if ($duplicate->fetch()) {
            apiJson(409, ["error" => "Ce numéro SIRET est déjà utilisé par une autre entreprise."]);
        }
    }

    $values = [
        ":name" => $fields["name"],
        ":siret" => $fields["siret"],
        ":location" => $fields["location"],
        ":description" => $fields["description"] !== "" ? $fields["description"] : null,
        ":status" => $fields["status"]
    ];

    if ($method === "POST") {
        $pdo->prepare(
            "INSERT INTO companies (name, siret, location, description, status, validated_at)
             VALUES (:name, :siret, :location, :description, :status,
                     IF(:status_check = 'approved', NOW(), NULL))"
        )->execute($values + [":status_check" => $fields["status"]]);

        apiJson(201, [
            "success" => true,
            "message" => "Entreprise créée avec succès.",
            "id" => (int) $pdo->lastInsertId()
        ]);
    }

    $id = filter_var($fields["id"], FILTER_VALIDATE_INT);
    if ($id === false || $id === null || $id < 1) {
        apiJson(400, ["error" => "Identifiant d'entreprise invalide."]);
    }
    findCompany($pdo, $id);

    $pdo->prepare(
        "UPDATE companies
         SET name = :name, siret = :siret, location = :location,
             description = :description, status = :status
         WHERE id = :id"
    )->execute($values + [":id" => $id]);

    apiJson(200, ["success" => true, "message" => "Entreprise modifiée avec succès."]);
} catch (PDOException $e) {
    error_log($e->getMessage());

    apiJson(500, ["error" => "Erreur lors de l'enregistrement de l'entreprise."]);
}
