<?php

// Offres d'emploi : GET /api/jobs/ (liste ou ?id=), POST, PUT et DELETE.
// La lecture est publique ; l'écriture est réservée à l'admin et aux
// entreprises validées, qui ne peuvent toucher qu'à leurs propres offres.

require_once __DIR__ . "/../config/session.php";
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../config/helpers.php";

function sendJson(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function getRequestData(): array
{
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        sendJson(["error" => "Les données JSON sont invalides."], 400);
    }

    return $data;
}

// Retourne l'utilisateur et son entreprise, ou coupe la requête (401/403).
function requireCompany(PDO $pdo): array
{
    $userId = (int) ($_SESSION["user_id"] ?? 0);
    $role = $_SESSION["user_role"] ?? "";

    if ($userId < 1) {
        sendJson(["error" => "Connecte-toi pour effectuer cette action."], 401);
    }

    if ($role !== "company") {
        sendJson(["error" => "Accès réservé aux comptes entreprise."], 403);
    }

    $statement = $pdo->prepare(
        "SELECT company_id FROM users WHERE id = :user_id AND role = 'company'"
    );
    $statement->execute([":user_id" => $userId]);
    $companyId = (int) $statement->fetchColumn();

    if ($companyId < 1) {
        sendJson(
            ["error" => "Aucune entreprise n'est associée à ce compte."],
            403
        );
    }

    return [
        "user_id" => $userId,
        "company_id" => $companyId
    ];
}

function requireAdmin(): void
{
    $userId = (int) ($_SESSION["user_id"] ?? 0);
    $role = $_SESSION["user_role"] ?? "";

    if ($userId < 1) {
        sendJson(["error" => "Connecte-toi pour effectuer cette action."], 401);
    }

    if ($role !== "admin") {
        sendJson(["error" => "Accès réservé à l'administration."], 403);
    }
}

// L'admin choisit l'entreprise de l'offre : par identifiant ou, à défaut, par nom.
function resolveCompanyId(PDO $pdo, array $data): int
{
    $companyId = filter_var($data["company_id"] ?? null, FILTER_VALIDATE_INT);
    if ($companyId !== false && $companyId !== null && $companyId > 0) {
        $statement = $pdo->prepare("SELECT id FROM companies WHERE id = :id");
        $statement->execute([":id" => $companyId]);
        if ($statement->fetchColumn()) {
            return (int) $companyId;
        }
        sendJson(["error" => "Entreprise introuvable."], 404);
    }

    $companyName = trim(
        (string) ($data["company"] ?? $data["company_name"] ?? "")
    );
    if ($companyName === "") {
        sendJson(["error" => "Sélectionne une entreprise pour cette offre."], 400);
    }

    $statement = $pdo->prepare(
        "SELECT id FROM companies WHERE name = :name LIMIT 1"
    );
    $statement->execute([":name" => $companyName]);
    $companyId = (int) $statement->fetchColumn();
    if ($companyId < 1) {
        sendJson(["error" => "Entreprise introuvable."], 404);
    }

    return $companyId;
}

// Accepte les deux formats envoyés par le front (snake_case et camelCase).
function validateJobData(array $data): array
{
    $job = [
        "title" => trim((string) ($data["title"] ?? "")),
        "location" => trim((string) ($data["location"] ?? "")),
        "contract_type" => trim(
            (string) ($data["contract_type"] ?? $data["type"] ?? "")
        ),
        "salary" => trim((string) ($data["salary"] ?? "")),
        "short_description" => trim(
            (string) (
                $data["short_description"]
                ?? $data["shortDescription"]
                ?? ""
            )
        ),
        "description" => trim((string) ($data["description"] ?? "")),
        "cover_letter_required" => filter_var(
            $data["cover_letter_required"] ?? false,
            FILTER_VALIDATE_BOOLEAN
        ) ? 1 : 0
    ];

    if (
        $job["title"] === "" ||
        $job["location"] === "" ||
        $job["contract_type"] === "" ||
        $job["short_description"] === "" ||
        $job["description"] === ""
    ) {
        sendJson(
            ["error" => "Veuillez remplir tous les champs obligatoires."],
            400
        );
    }

    foreach (['skills','missions','profile','benefits','working_time','application_deadline'] as $field) {
        if (isset($data[$field]) && !is_string($data[$field])) sendJson(['error'=>'Champ d’offre invalide.'], 400);
        $job[$field] = trim($data[$field] ?? '');
        if (strlen($job[$field]) > 20000) sendJson(['error'=>'Champ d’offre trop long.'], 400);
    }
    if (!in_array($job['contract_type'], ['CDI','CDD','Alternance','Stage','Intérim'], true)) sendJson(['error'=>'Contrat invalide.'], 400);
    if ($job['application_deadline'] !== '') {
        $date=DateTimeImmutable::createFromFormat('!Y-m-d', $job['application_deadline']);
        if (!$date || $date->format('Y-m-d') !== $job['application_deadline']) sendJson(['error'=>'Date limite invalide.'], 400);
    }
    return $job;
}

function findOwnedJob(PDO $pdo, int $jobId, int $companyId): array
{
    $statement = $pdo->prepare(
        "SELECT id, company_id
         FROM jobs
         WHERE id = :id AND company_id = :company_id"
    );
    $statement->execute([
        ":id" => $jobId,
        ":company_id" => $companyId
    ]);

    $job = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$job) {
        sendJson(
            ["error" => "Offre introuvable ou non associée à votre entreprise."],
            404
        );
    }

    return $job;
}

try {
    $method = $_SERVER["REQUEST_METHOD"];

    /*
     * GET : consultation publique.
     * GET ?mine=1 : publications de l'entreprise connectée.
     * GET ?id=123 : détail d'une offre.
     */
    if ($method === "GET") {
        $conditions = [];
        $params = [];

        $isMine = ($_GET["mine"] ?? "") === "1";
        if ($isMine) {
            $account = requireCompany($pdo);
            $conditions[] = "jobs.company_id = :mine_company_id";
            $params[":mine_company_id"] = $account["company_id"];
        } elseif (($_SESSION["user_role"] ?? "") !== "admin") {
            // Le public ne voit que les offres des entreprises validées.
            $conditions[] = "companies.status = 'approved'";
        }

        $search = trim(
            (string) ($_GET["q"] ?? $_GET["search"] ?? "")
        );

        if ($search !== "") {
            $conditions[] = "(
                jobs.title LIKE :search_title
                OR jobs.short_description LIKE :search_short
                OR jobs.description LIKE :search_description
                OR companies.name LIKE :search_company
            )";

            $term = "%" . $search . "%";
            $params[":search_title"] = $term;
            $params[":search_short"] = $term;
            $params[":search_description"] = $term;
            $params[":search_company"] = $term;
        }

        $location = trim((string) ($_GET["location"] ?? ""));
        if ($location !== "") {
            $conditions[] = "jobs.location LIKE :location";
            $params[":location"] = "%" . $location . "%";
        }

        $contractType = trim(
            (string) ($_GET["contract_type"] ?? $_GET["type"] ?? "")
        );
        if ($contractType !== "") {
            $conditions[] = "jobs.contract_type = :contract_type";
            $params[":contract_type"] = $contractType;
        }

        $company = trim((string) ($_GET["company"] ?? ""));
        if ($company !== "") {
            $conditions[] = "companies.name LIKE :company";
            $params[":company"] = "%" . $company . "%";
        }

        if (isset($_GET["id"])) {
            $id = filter_var($_GET["id"], FILTER_VALIDATE_INT);
            if ($id === false || $id < 1) {
                sendJson(["error" => "Identifiant d'offre invalide."], 400);
            }

            $conditions[] = "jobs.id = :id";
            $params[":id"] = $id;
        }

        $sql = "
            SELECT
                jobs.id,
                jobs.skills,
                jobs.missions,
                jobs.profile,
                jobs.benefits,
                jobs.working_time,
                jobs.application_deadline,
                jobs.title,
                jobs.location,
                jobs.contract_type,
                jobs.salary,
                jobs.short_description,
                jobs.description,
                jobs.cover_letter_required,
                jobs.company_id,
                jobs.created_at,
                companies.name AS company,
                companies.description AS company_description,
                companies.logo_path AS logo_path,
                companies.status AS company_status,
                (SELECT COUNT(*) FROM applications
                 WHERE applications.job_id = jobs.id) AS applications_count
            FROM jobs
            INNER JOIN companies ON jobs.company_id = companies.id
        ";

        $where = $conditions ? " WHERE " . implode(" AND ", $conditions) : "";
        $sql .= $where . " ORDER BY jobs.created_at DESC, jobs.id DESC";

        $pagination = isset($_GET["id"]) ? null : apiPagination();
        if ($pagination) {
            $count = $pdo->prepare(
                "SELECT COUNT(*) FROM jobs
                 INNER JOIN companies ON jobs.company_id = companies.id" . $where
            );
            $count->execute($params);
            $sql .= " LIMIT {$pagination["limit"]} OFFSET {$pagination["offset"]}";
        }

        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        $jobs = $statement->fetchAll(PDO::FETCH_ASSOC);

        if ($pagination) {
            sendJson(apiPaginated($jobs, (int) $count->fetchColumn(), $pagination));
        }

        if (isset($_GET["id"])) {
            if (!$jobs) {
                sendJson(["error" => "Offre introuvable."], 404);
            }
            sendJson($jobs[0]);
        }

        sendJson($jobs);
    }

    /*
     * POST : création d'une offre par l'entreprise propriétaire ou l'admin.
     */
    if ($method === "POST") {
        $data = getRequestData();
        if (($_SESSION["user_role"] ?? "") === "admin") {
            requireAdmin();
            $companyId = resolveCompanyId($pdo, $data);
        } else {
            $account = requireCompany($pdo);
            $companyId = apiRequireApprovedCompany($pdo, $account["user_id"]);
        }
        $job = validateJobData($data);

        $statement = $pdo->prepare(
            "INSERT INTO jobs (
                company_id, title, location, contract_type, salary,
                short_description, description, cover_letter_required, skills, missions, profile, benefits, working_time, application_deadline
            ) VALUES (
                :company_id, :title, :location, :contract_type, :salary,
                :short_description, :description, :cover_letter_required, :skills, :missions, :profile, :benefits, :working_time, :application_deadline
            )"
        );

        $statement->execute([
            ":company_id" => $companyId,
            ":title" => $job["title"],
            ":location" => $job["location"],
            ":contract_type" => $job["contract_type"],
            ":salary" => $job["salary"] !== "" ? $job["salary"] : null,
            ":short_description" => $job["short_description"],
            ":description" => $job["description"],
            ":cover_letter_required" => $job["cover_letter_required"],
            ":skills" => $job["skills"],
            ":missions" => $job["missions"],
            ":profile" => $job["profile"],
            ":benefits" => $job["benefits"],
            ":working_time" => $job["working_time"],
            ":application_deadline" => ($job["application_deadline"] !== "" ? $job["application_deadline"] : null)
        ]);

        sendJson([
            "success" => true,
            "message" => "Offre créée avec succès.",
            "id" => (int) $pdo->lastInsertId()
        ], 201);
    }

    /*
     * PUT : modification d'une offre par son propriétaire ou l'admin.
     */
    if ($method === "PUT") {
        $data = getRequestData();

        $id = filter_var($data["id"] ?? null, FILTER_VALIDATE_INT);
        if ($id === false || $id === null || $id < 1) {
            sendJson(["error" => "Identifiant d'offre invalide."], 400);
        }

        $isAdmin = ($_SESSION["user_role"] ?? "") === "admin";
        $ownerCompanyId = null;
        if ($isAdmin) {
            requireAdmin();
            $exists = $pdo->prepare("SELECT id FROM jobs WHERE id = :id");
            $exists->execute([":id" => $id]);
            if (!$exists->fetchColumn()) {
                sendJson(["error" => "Offre introuvable."], 404);
            }
            $companyId = resolveCompanyId($pdo, $data);
        } else {
            $account = requireCompany($pdo);
            apiRequireApprovedCompany($pdo, $account["user_id"]);
            findOwnedJob($pdo, (int) $id, $account["company_id"]);
            $companyId = $account["company_id"];
            $ownerCompanyId = $account["company_id"];
        }
        $previous = $pdo->prepare('SELECT * FROM jobs WHERE id = ?'); $previous->execute([$id]);
        $data = array_replace($previous->fetch(PDO::FETCH_ASSOC) ?: [], $data);
        $job = validateJobData($data);

        $updateSql = "UPDATE jobs SET
                company_id = :company_id,
                title = :title,
                location = :location,
                contract_type = :contract_type,
                salary = :salary,
                short_description = :short_description,
                description = :description,
                cover_letter_required = :cover_letter_required,
                skills = :skills,
                missions = :missions,
                profile = :profile,
                benefits = :benefits,
                working_time = :working_time,
                application_deadline = :application_deadline
             WHERE id = :id";
        $updateParameters = [
            ":company_id" => $companyId,
            ":title" => $job["title"],
            ":location" => $job["location"],
            ":contract_type" => $job["contract_type"],
            ":salary" => $job["salary"] !== "" ? $job["salary"] : null,
            ":short_description" => $job["short_description"],
            ":description" => $job["description"],
            ":cover_letter_required" => $job["cover_letter_required"],
            ":skills" => $job["skills"],
            ":missions" => $job["missions"],
            ":profile" => $job["profile"],
            ":benefits" => $job["benefits"],
            ":working_time" => $job["working_time"],
            ":application_deadline" => ($job["application_deadline"] !== "" ? $job["application_deadline"] : null),
            ":id" => $id
        ];

        if ($ownerCompanyId !== null) {
            $updateSql .= " AND company_id = :owner_company_id";
            $updateParameters[":owner_company_id"] = $ownerCompanyId;
        }

        $statement = $pdo->prepare($updateSql);
        $statement->execute($updateParameters);

        sendJson([
            "success" => true,
            "message" => "Offre modifiée avec succès."
        ]);
    }

    /*
     * DELETE : suppression par le propriétaire ou l'admin.
     * Une offre ayant des candidatures ne peut pas être supprimée.
     */
    if ($method === "DELETE") {
        $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);
        if ($id === false || $id === null || $id < 1) {
            sendJson(["error" => "Identifiant d'offre invalide."], 400);
        }

        $isAdmin = ($_SESSION["user_role"] ?? "") === "admin";
        if ($isAdmin) {
            requireAdmin();
            $exists = $pdo->prepare("SELECT id FROM jobs WHERE id = :id");
            $exists->execute([":id" => $id]);
            if (!$exists->fetchColumn()) {
                sendJson(["error" => "Offre introuvable."], 404);
            }
            $companyId = null;
        } else {
            $account = requireCompany($pdo);
            findOwnedJob($pdo, (int) $id, $account["company_id"]);
            $companyId = $account["company_id"];
        }

        $check = $pdo->prepare(
            "SELECT COUNT(*) FROM applications WHERE job_id = :job_id"
        );
        $check->execute([":job_id" => $id]);

        if ((int) $check->fetchColumn() > 0) {
            sendJson([
                "error" => "Cette offre possède des candidatures. Elle ne peut pas être supprimée."
            ], 409);
        }

        if ($isAdmin) {
            $delete = $pdo->prepare("DELETE FROM jobs WHERE id = :id");
            $delete->execute([":id" => $id]);
        } else {
            $delete = $pdo->prepare(
                "DELETE FROM jobs WHERE id = :id AND company_id = :company_id"
            );
            $delete->execute([
                ":id" => $id,
                ":company_id" => $companyId
            ]);
        }

        sendJson([
            "success" => true,
            "message" => "Offre supprimée avec succès."
        ]);
    }

    header("Allow: GET, POST, PUT, DELETE, OPTIONS");
    sendJson(["error" => "Méthode non autorisée."], 405);

} catch (PDOException $e) {
    error_log($e->getMessage());
    sendJson(
        ["error" => "Erreur lors de l'opération en base de données."],
        500
    );
}
