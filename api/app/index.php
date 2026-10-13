
<?php

require_once __DIR__ . "/../config/session.php";

require_once __DIR__ . "/../config/database.php";

function sendJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

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
            "SELECT id, cover_letter_required
             FROM jobs
             WHERE id = :job_id"
        );
        $checkJob->execute([":job_id" => $jobId]);
        $job = $checkJob->fetch(PDO::FETCH_ASSOC);

        if (!$job) {
            sendJson(404, ["error" => "Cette offre n'existe pas."]);
        }

        if ((bool) $job["cover_letter_required"] && $coverLetter === "") {
            sendJson(400, [
                "error" => "Une lettre de motivation est obligatoire pour cette offre."
            ]);
        }

        $cvFile = $_FILES["cv"] ?? null;
        $cvFileName = null;
        $cvContent = null;
        if ($cvFile && $cvFile["error"] !== UPLOAD_ERR_NO_FILE) {
            if ($cvFile["error"] !== UPLOAD_ERR_OK) {
                sendJson(400, ["error" => "Le téléversement du CV a échoué."]);
            }

            if ($cvFile["size"] > 5 * 1024 * 1024) {
                sendJson(400, ["error" => "Le CV ne peut pas dépasser 5 Mo."]);
            }

            $extension = strtolower(pathinfo($cvFile["name"], PATHINFO_EXTENSION));
            $fileInfo = new finfo(FILEINFO_MIME_TYPE);
            if (
                $extension !== "pdf" ||
                $fileInfo->file($cvFile["tmp_name"]) !== "application/pdf"
            ) {
                sendJson(400, ["error" => "Le CV doit être un fichier PDF valide."]);
            }

            $cvContent = file_get_contents($cvFile["tmp_name"]);
            if ($cvContent === false) {
                sendJson(400, ["error" => "Impossible de lire le fichier CV envoyé."]);
            }
            $cvBaseName = basename(str_replace("\\", "/", $cvFile["name"]));
            $cvFileName = substr(pathinfo($cvBaseName, PATHINFO_FILENAME), 0, 250) .
                ".pdf";
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
            $cvFileName,
            $cvFileName !== null ? PDO::PARAM_STR : PDO::PARAM_NULL
        );
        $statement->bindValue(
            ":cv_file",
            $cvContent,
            $cvContent !== null ? PDO::PARAM_LOB : PDO::PARAM_NULL
        );
        $statement->execute();

        sendJson(201, [
            "success" => true,
            "message" => "Votre candidature a bien été envoyée.",
            "application_id" => $pdo->lastInsertId()
        ]);
    }

    // Liste les candidatures ou affiche un détail.
    if ($method === "GET") {
        $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);
        $mine = isset($_GET["mine"]) && $_GET["mine"] === "1";
        $userId = (int) ($_SESSION["user_id"] ?? 0);
        $isAdmin = ($_SESSION["user_role"] ?? "") === "admin";

        if ($userId < 1) {
            sendJson(401, ["error" => "Connectez-vous pour consulter les candidatures."]);
        }

        if (isset($_GET["attachment"])) {
            if ($_GET["attachment"] !== "cv" || !$id || $id < 1) {
                sendJson(400, ["error" => "Pièce jointe ou identifiant invalide."]);
            }

            $statement = $pdo->prepare(
                "SELECT user_id, cv_file_name, cv_file
                 FROM applications
                 WHERE id = :id"
            );
            $statement->execute([":id" => $id]);
            $application = $statement->fetch(PDO::FETCH_ASSOC);

            if (!$application || $application["cv_file"] === null) {
                sendJson(404, ["error" => "CV introuvable."]);
            }

            if (!$isAdmin && (int) $application["user_id"] !== $userId) {
                sendJson(403, ["error" => "Accès interdit à ce CV."]);
            }

            header("Content-Type: application/pdf");
            header(
                "Content-Disposition: attachment; filename*=UTF-8''" .
                rawurlencode($application["cv_file_name"])
            );
            header("X-Content-Type-Options: nosniff");
            $cvContent = $application["cv_file"];
            echo is_resource($cvContent) ? stream_get_contents($cvContent) : $cvContent;
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
                    applications.status,
                    applications.created_at,
                    applications.updated_at,
                    jobs.title AS job_title,
                    companies.name AS company
                FROM applications
                INNER JOIN jobs ON jobs.id = applications.job_id
                INNER JOIN companies ON companies.id = jobs.company_id";

        if ($mine || !$isAdmin) {
            $where = " WHERE applications.user_id = :user_id";
            $parameters = [":user_id" => $userId];

            if (isset($_GET["id"])) {
                if (!$id || $id < 1) {
                    sendJson(400, ["error" => "Identifiant invalide."]);
                }
                $where .= " AND applications.id = :id";
                $parameters[":id"] = $id;
            }

            $statement = $pdo->prepare(
                $sql . $where . " ORDER BY applications.created_at DESC"
            );
            $statement->execute($parameters);

            if (isset($_GET["id"])) {
                $application = $statement->fetch(PDO::FETCH_ASSOC);
                if (!$application) {
                    sendJson(404, ["error" => "Candidature introuvable."]);
                }
                sendJson(200, $application);
            }

            sendJson(200, $statement->fetchAll(PDO::FETCH_ASSOC));
        }

        if (isset($_GET["id"])) {
            if (!$id || $id < 1) {
                sendJson(400, ["error" => "Identifiant invalide."]);
            }

            $statement = $pdo->prepare($sql . " WHERE applications.id = :id");
            $statement->execute([":id" => $id]);
            $application = $statement->fetch(PDO::FETCH_ASSOC);

            if (!$application) {
                sendJson(404, ["error" => "Candidature introuvable."]);
            }

            sendJson(200, $application);
        }

        $statement = $pdo->query($sql . " ORDER BY applications.created_at DESC");
        sendJson(200, $statement->fetchAll(PDO::FETCH_ASSOC));
    }

    // Met à jour le statut.
    if ($method === "PUT") {
        if (
            empty($_SESSION["user_id"]) ||
            ($_SESSION["user_role"] ?? "") !== "admin"
        ) {
            sendJson(403, ["error" => "Accès réservé à l'administration."]);
        }

        $data = readJson();

        $id = filter_var(
            $data["id"] ?? $_GET["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        $status = trim($data["status"] ?? "");

        $allowedStatuses = [
            "pending",
            "reviewing",
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
            "SELECT id FROM applications WHERE id = :id"
        );
        $check->execute([":id" => $id]);

        if (!$check->fetch()) {
            sendJson(404, ["error" => "Candidature introuvable."]);
        }

        $update = $pdo->prepare(
            "UPDATE applications
             SET status = :status
             WHERE id = :id"
        );
        $update->execute([
            ":status" => $status,
            ":id" => $id
        ]);

        sendJson(200, [
            "success" => true,
            "message" => "Le statut de la candidature a été mis à jour.",
            "id" => $id,
            "status" => $status
        ]);
    }

    header("Allow: GET, POST, PUT, OPTIONS");
    sendJson(405, ["error" => "Méthode non autorisée."]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    sendJson(500, [
        "error" => "Une erreur de base de données est survenue."
    ]);
}