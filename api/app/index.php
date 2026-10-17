<?php

// Candidatures : GET /api/app/ (liste, ?id=, ?attachment=cv), POST pour
// postuler, PUT pour changer le statut, DELETE pour l'admin.
// Chacun ne voit que ce qui le concerne : le candidat ses candidatures,
// l'entreprise celles reçues sur ses offres, l'admin tout.

require_once __DIR__ . "/../config/session.php";

require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../config/helpers.php";

const APPLICATION_STATUS_LABELS = [
    "pending" => "En attente",
    "reviewing" => "En cours d'étude",
    "interview" => "Entretien",
    "accepted" => "Acceptée",
    "rejected" => "Refusée"
];

function sendJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Le formulaire de candidature arrive en multipart (fichiers), le reste en JSON.
function readJson(): array
{
    $contentType = $_SERVER["CONTENT_TYPE"] ?? "";
    if (
        $_SERVER["REQUEST_METHOD"] === "POST" &&
        strpos($contentType, "multipart/form-data") === 0
    ) {
        return $_POST;
    }

    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        sendJson(400, ["error" => "Les données envoyées sont invalides."]);
    }

    return $data;
}

// Vérifie un PDF envoyé (taille, extension et vrai type MIME) et renvoie son contenu.
function readPdfUpload(string $field, string $label): ?array
{
    $file = $_FILES[$field] ?? null;
    if (!$file || $file["error"] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($file["error"] !== UPLOAD_ERR_OK) {
        sendJson(400, ["error" => "Le téléversement de $label a échoué."]);
    }

    if ($file["size"] > 5 * 1024 * 1024) {
        sendJson(400, ["error" => "$label ne peut pas dépasser 5 Mo."]);
    }

    $extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $fileInfo = new finfo(FILEINFO_MIME_TYPE);
    if (
        $extension !== "pdf" ||
        $fileInfo->file($file["tmp_name"]) !== "application/pdf"
    ) {
        sendJson(400, ["error" => "$label doit être un fichier PDF valide."]);
    }

    $content = file_get_contents($file["tmp_name"]);
    if ($content === false) {
        sendJson(400, ["error" => "Impossible de lire le fichier $label envoyé."]);
    }

    $baseName = basename(str_replace("\\", "/", $file["name"]));
    $name = substr(pathinfo($baseName, PATHINFO_FILENAME), 0, 250) . ".pdf";

    return ["name" => $name, "content" => $content];
}

try {
    $method = $_SERVER["REQUEST_METHOD"];

    // Crée une candidature.
    if ($method === "POST") {
        if (empty($_SESSION["user_id"])) {
            sendJson(401, ["error" => "Connectez-vous pour envoyer une candidature."]);
        }

        if (($_SESSION["user_role"] ?? "") !== "candidate") {
            sendJson(403, ["error" => "Seuls les candidats peuvent postuler."]);
        }

        $data = readJson();

        $jobId = filter_var($data["job_id"] ?? null, FILTER_VALIDATE_INT);
        $name = trim($data["candidate_name"] ?? "");
        $email = trim($data["candidate_email"] ?? "");
        $phone = trim($data["candidate_phone"] ?? "");
        $message = trim($data["message"] ?? "");
        $coverLetter = trim($data["cover_letter"] ?? "");
        $userId = (int) $_SESSION["user_id"];

        if (
            !$jobId || $jobId < 1 ||
            $name === "" ||
            $email === "" ||
            $phone === "" ||
            $message === ""
        ) {
            sendJson(400, [
                "error" => "Veuillez remplir tous les champs obligatoires."
            ]);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendJson(400, ["error" => "L'adresse email est invalide."]);
        }

        // Vérifie l'offre et la lettre requise.
        $checkJob = $pdo->prepare(
            "SELECT jobs.id, jobs.title, jobs.cover_letter_required, jobs.company_id
             FROM jobs
             INNER JOIN companies ON companies.id = jobs.company_id
             WHERE jobs.id = :job_id AND companies.status = 'approved'"
        );
        $checkJob->execute([":job_id" => $jobId]);
        $job = $checkJob->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            sendJson(404, ["error" => "Cette offre n'existe pas."]);
        }

        $cv = readPdfUpload("cv", "Le CV");
        $uploadedCoverLetter = readPdfUpload(
            "cover_letter_file",
            "La lettre de motivation"
        );

        if ($cv === null) {
            sendJson(400, ["error" => "Un CV au format PDF est obligatoire pour postuler."]);
        }

        if (
            (bool) $job["cover_letter_required"] &&
            $coverLetter === "" &&
            $uploadedCoverLetter === null
        ) {
            sendJson(400, [
                "error" => "Une lettre de motivation est obligatoire pour cette offre."
            ]);
        }

        $sql = "INSERT INTO applications (
                    job_id,
                    user_id,
                    candidate_name,
                    candidate_email,
                    candidate_phone,
                    message,
                    cover_letter,
                    cv_file_name,
                    cv_file,
                    cover_letter_file_name,
                    cover_letter_file,
                    status
                ) VALUES (
                    :job_id,
                    :user_id,
                    :candidate_name,
                    :candidate_email,
                    :candidate_phone,
                    :message,
                    :cover_letter,
                    :cv_file_name,
                    :cv_file,
                    :cover_letter_file_name,
                    :cover_letter_file,
                    'pending'
                )";

        $statement = $pdo->prepare($sql);
        $statement->bindValue(":job_id", $jobId, PDO::PARAM_INT);
        $statement->bindValue(":user_id", $userId, PDO::PARAM_INT);
        $statement->bindValue(":candidate_name", $name);
        $statement->bindValue(":candidate_email", $email);
        $statement->bindValue(":candidate_phone", $phone);
        $statement->bindValue(":message", $message);
        $statement->bindValue(
            ":cover_letter",
            $coverLetter !== "" ? $coverLetter : null,
            $coverLetter !== "" ? PDO::PARAM_STR : PDO::PARAM_NULL
        );
        $statement->bindValue(
            ":cv_file_name",
            $cv["name"] ?? null,
            $cv !== null ? PDO::PARAM_STR : PDO::PARAM_NULL
        );
        $statement->bindValue(
            ":cv_file",
            $cv["content"] ?? null,
            $cv !== null ? PDO::PARAM_LOB : PDO::PARAM_NULL
        );
        $statement->bindValue(
            ":cover_letter_file_name",
            $uploadedCoverLetter["name"] ?? null,
            $uploadedCoverLetter !== null ? PDO::PARAM_STR : PDO::PARAM_NULL
        );
        $statement->bindValue(
            ":cover_letter_file",
            $uploadedCoverLetter["content"] ?? null,
            $uploadedCoverLetter !== null ? PDO::PARAM_LOB : PDO::PARAM_NULL
        );

        $statement->execute();
        $applicationId = (int) $pdo->lastInsertId();

        // Notifie l'entreprise ; un échec ne doit pas annuler la candidature.
        apiNotify($pdo, [
            "company_id" => (int) $job["company_id"],
            "application_id" => $applicationId,
            "job_id" => $jobId,
            "type" => "new_application",
            "title" => "Nouvelle candidature",
            "message" => $name . " a postulé à l'offre « " . $job["title"] . " »."
        ]);

        sendJson(201, [
            "success" => true,
            "message" => "Votre candidature a bien été envoyée.",
            "application_id" => $applicationId
        ]);
    }

    // Liste les candidatures ou affiche un détail.
    if ($method === "GET") {
        $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);
        $userId = (int) ($_SESSION["user_id"] ?? 0);
        $userRole = $_SESSION["user_role"] ?? "";
        $isAdmin = $userRole === "admin";
        $isCompany = $userRole === "company";

        if ($userId < 1) {
            sendJson(401, ["error" => "Connectez-vous pour consulter les candidatures."]);
        }

        $companyId = 0;
        if ($isCompany) {
            $companyQuery = $pdo->prepare(
                "SELECT company_id FROM users WHERE id = :user_id AND role = 'company'"
            );
            $companyQuery->execute([":user_id" => $userId]);
            $companyId = (int) $companyQuery->fetchColumn();

            if ($companyId < 1) {
                sendJson(403, [
                    "error" => "Aucune entreprise n'est associée à ce compte."
                ]);
            }
        } elseif (!$isAdmin && $userRole !== "candidate") {
            sendJson(403, ["error" => "Accès interdit aux candidatures."]);
        }

        // Téléchargement d'une pièce jointe : on vérifie que le demandeur y a droit.
        if (isset($_GET["attachment"])) {
            $attachment = $_GET["attachment"];
            $attachmentFields = [
                "cv" => ["cv_file_name", "cv_file"],
                "cover-letter" => ["cover_letter_file_name", "cover_letter_file"]
            ];
            if (!isset($attachmentFields[$attachment]) || !$id || $id < 1) {
                sendJson(400, ["error" => "Pièce jointe ou identifiant invalide."]);
            }
            [$nameColumn, $contentColumn] = $attachmentFields[$attachment];

            $statement = $pdo->prepare(
                "SELECT applications.user_id, jobs.company_id,
                        applications.$nameColumn AS file_name,
                        applications.$contentColumn AS file_content
                 FROM applications
                 INNER JOIN jobs ON jobs.id = applications.job_id
                 WHERE applications.id = :id"
            );
            $statement->execute([":id" => $id]);
            $application = $statement->fetch(PDO::FETCH_ASSOC);

            if (!$application || $application["file_content"] === null) {
                sendJson(404, ["error" => "Document introuvable."]);
            }

            $ownsApplication = $isCompany
                ? (int) $application["company_id"] === $companyId
                : (int) $application["user_id"] === $userId;

            if (!$isAdmin && !$ownsApplication) {
                sendJson(403, ["error" => "Accès interdit à ce CV."]);
            }

            header("Content-Type: application/pdf");
            header(
                "Content-Disposition: attachment; filename*=UTF-8''" .
                rawurlencode($application["file_name"])
            );
            header("X-Content-Type-Options: nosniff");
            $fileContent = $application["file_content"];
            echo is_resource($fileContent)
                ? stream_get_contents($fileContent)
                : $fileContent;
            exit;
        }

        $sql = "SELECT
                    applications.id,
                    applications.job_id,
                    applications.candidate_name,
                    applications.candidate_email,
                    applications.candidate_phone,
                    applications.message,
                    applications.cover_letter,
                    applications.cv_file_name,
                    applications.cover_letter_file_name,
                    applications.status,
                    applications.created_at,
                    applications.updated_at,
                    jobs.title AS job_title,
                    companies.name AS company
                FROM applications
                INNER JOIN jobs ON jobs.id = applications.job_id
                INNER JOIN companies ON companies.id = jobs.company_id";

        $where = "";
        $parameters = [];
        if ($isCompany) {
            $where = " WHERE jobs.company_id = :company_id";
            $parameters[":company_id"] = $companyId;
        } elseif (!$isAdmin) {
            $where = " WHERE applications.user_id = :user_id";
            $parameters[":user_id"] = $userId;
        }

        if (isset($_GET["id"])) {
            if (!$id || $id < 1) {
                sendJson(400, ["error" => "Identifiant invalide."]);
            }

            $where .= $where === "" ? " WHERE " : " AND ";
            $where .= "applications.id = :id";
            $parameters[":id"] = $id;

            $statement = $pdo->prepare($sql . $where);
            $statement->execute($parameters);
            $application = $statement->fetch(PDO::FETCH_ASSOC);

            if (!$application) {
                sendJson(404, ["error" => "Candidature introuvable."]);
            }

            sendJson(200, $application);
        }

        // Filtres facultatifs : statut, offre et recherche texte.
        $filters = [];
        if (isset(APPLICATION_STATUS_LABELS[$_GET["status"] ?? ""])) {
            $filters[] = "applications.status = :status";
            $parameters[":status"] = $_GET["status"];
        }
        $jobFilter = filter_var($_GET["job_id"] ?? null, FILTER_VALIDATE_INT);
        if ($jobFilter) {
            $filters[] = "applications.job_id = :job_filter";
            $parameters[":job_filter"] = $jobFilter;
        }
        $search = trim((string) ($_GET["q"] ?? ""));
        if ($search !== "") {
            $filters[] = "(applications.candidate_name LIKE :q_name
                           OR applications.candidate_email LIKE :q_email
                           OR jobs.title LIKE :q_job)";
            $parameters[":q_name"] = $parameters[":q_email"] = $parameters[":q_job"] = "%" . $search . "%";
        }
        if ($filters) {
            $where .= ($where === "" ? " WHERE " : " AND ") . implode(" AND ", $filters);
        }

        $sql .= $where . " ORDER BY applications.created_at DESC, applications.id DESC";
        $pagination = apiPagination();
        if ($pagination) {
            $count = $pdo->prepare(
                "SELECT COUNT(*) FROM applications
                 INNER JOIN jobs ON jobs.id = applications.job_id" . $where
            );
            $count->execute($parameters);
            $sql .= " LIMIT {$pagination["limit"]} OFFSET {$pagination["offset"]}";
        }

        $statement = $pdo->prepare($sql);
        $statement->execute($parameters);
        $applications = $statement->fetchAll(PDO::FETCH_ASSOC);

        if ($pagination) {
            sendJson(200, apiPaginated($applications, (int) $count->fetchColumn(), $pagination));
        }

        sendJson(200, $applications);
    }

    // Met à jour le statut : admin ou entreprise propriétaire de l'offre.
    if ($method === "PUT") {
        $actorId = apiRequireRole("admin", "company");
        $actorCompanyId = ($_SESSION["user_role"] ?? "") === "company"
            ? apiCompanyOf($pdo, $actorId)["id"]
            : null;

        $data = readJson();

        $id = filter_var(
            $data["id"] ?? $_GET["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        $status = trim($data["status"] ?? "");

        $allowedStatuses = [
            "pending",
            "reviewing",
            "interview",
            "accepted",
            "rejected"
        ];

        if (!$id || $id < 1) {
            sendJson(400, ["error" => "Identifiant de candidature invalide."]);
        }

        if (!in_array($status, $allowedStatuses, true)) {
            sendJson(400, [
                "error" => "Statut invalide.",
                "allowed_statuses" => $allowedStatuses
            ]);
        }

        $check = $pdo->prepare(
            "SELECT applications.id, applications.user_id, applications.status,
                    applications.job_id, jobs.title, jobs.company_id,
                    companies.name AS company
             FROM applications
             INNER JOIN jobs ON jobs.id = applications.job_id
             INNER JOIN companies ON companies.id = jobs.company_id
             WHERE applications.id = :id"
        );
        $check->execute([":id" => $id]);
        $current = $check->fetch(PDO::FETCH_ASSOC);

        if (!$current || ($actorCompanyId !== null && (int) $current["company_id"] !== $actorCompanyId)) {
            sendJson(404, ["error" => "Candidature introuvable."]);
        }

        $update = $pdo->prepare(
            "UPDATE applications
             SET status = :status,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id"
        );
        $update->execute([
            ":status" => $status,
            ":id" => $id
        ]);

        // Prévient le candidat de la réponse du recruteur.
        if ($current["user_id"] && $status !== $current["status"]) {
            apiNotify($pdo, [
                "user_id" => (int) $current["user_id"],
                "application_id" => $id,
                "job_id" => (int) $current["job_id"],
                "type" => "application_" . $status,
                "title" => "Candidature : " . APPLICATION_STATUS_LABELS[$status],
                "message" => "Votre candidature « " . $current["title"] . " » chez " .
                    $current["company"] . " est désormais : " .
                    mb_strtolower(APPLICATION_STATUS_LABELS[$status]) . "."
            ]);
        }

        sendJson(200, [
            "success" => true,
            "message" => "Le statut de la candidature a été mis à jour.",
            "id" => $id,
            "status" => $status
        ]);
    }

    // Supprime une candidature (administration).
    if ($method === "DELETE") {
        if (
            empty($_SESSION["user_id"]) ||
            ($_SESSION["user_role"] ?? "") !== "admin"
        ) {
            sendJson(403, ["error" => "Accès réservé à l'administration."]);
        }

        $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);
        if (!$id || $id < 1) {
            sendJson(400, ["error" => "Identifiant de candidature invalide."]);
        }

        $delete = $pdo->prepare("DELETE FROM applications WHERE id = :id");
        $delete->execute([":id" => $id]);

        if ($delete->rowCount() === 0) {
            sendJson(404, ["error" => "Candidature introuvable."]);
        }

        sendJson(200, [
            "success" => true,
            "message" => "Candidature supprimée avec succès."
        ]);
    }

    header("Allow: GET, POST, PUT, DELETE, OPTIONS");
    sendJson(405, ["error" => "Méthode non autorisée."]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    sendJson(500, [
        "error" => "Une erreur de base de données est survenue."
    ]);
}