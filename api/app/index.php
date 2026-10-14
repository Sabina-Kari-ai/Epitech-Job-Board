<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/../config/auth.php";
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST') requireCandidate();
if ($method === 'GET') {
    requireAuth();
    if (!isAdmin() || isset($_GET['mine'])) requireCandidate();
}
if ($method === 'PUT') requireAdmin();

$pdo = require __DIR__ . "/../config/database.php";


function sendJson(int $status, array $data): void
{
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}


function readJson(): array
{
    $data = json_decode(
        file_get_contents("php://input"),
        true
    );

    if (!is_array($data)) {
        sendJson(
            400,
            [
                "error" =>
                    "Les données envoyées sont invalides."
            ]
        );
    }

    return $data;
}


function currentUserId(): ?int
{
    if (empty($_SESSION["user_id"])) {
        return null;
    }

    return (int) $_SESSION["user_id"];
}


function isAdmin(): bool
{
    return (
        !empty($_SESSION["user_id"]) &&
        ($_SESSION["role"] ?? "") === "admin"
    );
}


try {

    $method =
        $_SERVER["REQUEST_METHOD"];


    // ========================================
    // CREATE APPLICATION
    // ========================================

    if ($method === "POST") {

        $data =
            readJson();

        $jobId =
            filter_var(
                $data["job_id"] ?? null,
                FILTER_VALIDATE_INT
            );

        $name =
            trim(
                $data["candidate_name"] ?? ""
            );

        $email =
            strtolower(
                trim(
                    $data["candidate_email"] ?? ""
                )
            );

        $phone =
            trim(
                $data["candidate_phone"] ?? ""
            );

        $message =
            trim(
                $data["message"] ?? ""
            );

        $coverLetter =
            trim(
                $data["cover_letter"] ?? ""
            );


        if (
            !$jobId ||
            $jobId < 1 ||
            $name === "" ||
            $email === "" ||
            $phone === "" ||
            $message === ""
        ) {

            sendJson(
                400,
                [
                    "error" =>
                        "Veuillez remplir tous les champs obligatoires."
                ]
            );
        }


        if (
            !filter_var(
                $email,
                FILTER_VALIDATE_EMAIL
            )
        ) {

            sendJson(
                400,
                [
                    "error" =>
                        "L'adresse email est invalide."
                ]
            );
        }


        $pdo->beginTransaction();

        // Lock the offer to serialize duplicate checks and deadline updates.

        $checkJob =
            $pdo->prepare(
                "SELECT
                    id,
                    cover_letter_required, application_deadline
                 FROM jobs
                 WHERE id = :job_id
                 LIMIT 1 FOR UPDATE"
            );


        $checkJob->execute([
            ":job_id" => $jobId
        ]);


        $job =
            $checkJob->fetch(
                PDO::FETCH_ASSOC
            );


        if (!$job) {

            sendJson(
                404,
                [
                    "error" =>
                        "Cette offre n'existe pas."
                ]
            );
        }


        if (
            (bool) $job["cover_letter_required"] &&
            $coverLetter === ""
        ) {

            sendJson(
                400,
                [
                    "error" =>
                        "Une lettre de motivation est obligatoire pour cette offre."
                ]
            );
        }


        $today = (new DateTimeImmutable('now', new DateTimeZone('Europe/Paris')))->format('Y-m-d');
        if (!empty($job['application_deadline']) && $job['application_deadline'] < $today) {
            $pdo->rollBack();
            sendJson(410, ['error' => 'La date limite de candidature est dépassée.']);
        }
        $duplicate = $pdo->prepare('SELECT id FROM applications WHERE user_id = ? AND job_id = ? LIMIT 1');
        $duplicate->execute([requireCandidate(), $jobId]);
        if ($duplicate->fetch()) {
            $pdo->rollBack();
            sendJson(409, ['error' => 'Vous avez déjà postulé à cette offre.']);
        }

        // Always associate a new application with the authenticated candidate.

        $userId = requireCandidate();
        $userStatement = $pdo->prepare('SELECT cv_path FROM users WHERE id = ?');
        $userStatement->execute([$userId]);
        $cvPath = $userStatement->fetchColumn() ?: null;

        $sql =
            "INSERT INTO applications (
                job_id,
                user_id,
                candidate_name,
                candidate_email,
                candidate_phone,
                message,
                cover_letter,
                cv_path,
                status
            ) VALUES (
                :job_id,
                :user_id,
                :candidate_name,
                :candidate_email,
                :candidate_phone,
                :message,
                :cover_letter,
                :cv_path,
                'pending'
            )";


        $statement =
            $pdo->prepare($sql);


        $statement->execute([

            ":job_id" =>
                $jobId,

            ":user_id" =>
                $userId,

            ":candidate_name" =>
                $name,

            ":candidate_email" =>
                $email,

            ":candidate_phone" =>
                $phone,

            ":message" =>
                $message,

            ":cv_path" => $cvPath,
            ":cover_letter" =>
                $coverLetter !== ""
                    ? $coverLetter
                    : null
        ]);


        $applicationId = (int) $pdo->lastInsertId();
        $pdo->commit();
        sendJson(
            201,
            [
                "success" => true,

                "message" =>
                    "Votre candidature a bien été envoyée.",

                "application_id" =>
                     $applicationId
            ]
        );
    }


    // ========================================
    // GET APPLICATIONS
    // ========================================

    if ($method === "GET") {

        $userId =
            currentUserId();

        $admin =
            isAdmin();


        /*
         * Mes candidatures requires
         * an authenticated account.
         */

        if (!$userId) {

            sendJson(
                401,
                [
                    "success" => false,

                    "error" =>
                        "Vous devez être connecté pour consulter vos candidatures."
                ]
            );
        }


        $applicationId =
            filter_var(
                $_GET["id"] ?? null,
                FILTER_VALIDATE_INT
            );


        $sql =
            "SELECT
                applications.id,
                applications.job_id,
                applications.user_id,
                applications.candidate_name,
                applications.candidate_email,
                applications.candidate_phone,
                applications.message,
                applications.cover_letter,
                applications.cv_path, applications.cover_letter_path,
                applications.status,
                applications.created_at,
                applications.updated_at,

                jobs.title AS job_title,
                jobs.location AS job_location,
                jobs.contract_type,

                companies.name AS company

            FROM applications

            INNER JOIN jobs
                ON applications.job_id = jobs.id

            INNER JOIN companies
                ON jobs.company_id = companies.id";


        $conditions = [];
        $parameters = [];


        /*
         * Admin sees every application.
         * Candidate only sees his/her own.
         */

        if (!$admin) {

            $conditions[] =
                "applications.user_id = :user_id";

            $parameters[":user_id"] =
                $userId;
        }


        if (isset($_GET["id"])) {

            if (
                !$applicationId ||
                $applicationId < 1
            ) {

                sendJson(
                    400,
                    [
                        "error" =>
                            "Identifiant invalide."
                    ]
                );
            }


            $conditions[] =
                "applications.id = :id";

            $parameters[":id"] =
                $applicationId;
        }


        if (!empty($conditions)) {

            $sql .=
                " WHERE " .
                implode(
                    " AND ",
                    $conditions
                );
        }


        $sql .=
            " ORDER BY applications.created_at DESC";


        $statement =
            $pdo->prepare($sql);


        $statement->execute(
            $parameters
        );


        $applications =
            $statement->fetchAll(
                PDO::FETCH_ASSOC
            );


        if (isset($_GET["id"])) {

            if (empty($applications)) {

                sendJson(
                    404,
                    [
                        "error" =>
                            "Candidature introuvable."
                    ]
                );
            }


            sendJson(
                200,
                $applications[0]
            );
        }


        sendJson(
            200,
            $applications
        );
    }


    // ========================================
    // UPDATE APPLICATION STATUS
    // ADMIN ONLY
    // ========================================

    if ($method === "PUT") {

        if (!currentUserId()) {

            sendJson(
                401,
                [
                    "success" => false,
                    "error" =>
                        "Authentification requise."
                ]
            );
        }


        if (!isAdmin()) {

            sendJson(
                403,
                [
                    "success" => false,
                    "error" =>
                        "Accès administrateur requis."
                ]
            );
        }


        $data =
            readJson();


        $id =
            filter_var(
                $data["id"] ??
                $_GET["id"] ??
                null,

                FILTER_VALIDATE_INT
            );


        $status =
            trim(
                $data["status"] ?? ""
            );


        $allowedStatuses = [
            "pending",
            "reviewing",
            "accepted",
            "rejected"
        ];


        if (
            !$id ||
            $id < 1
        ) {

            sendJson(
                400,
                [
                    "error" =>
                        "Identifiant de candidature invalide."
                ]
            );
        }


        if (
            !in_array(
                $status,
                $allowedStatuses,
                true
            )
        ) {

            sendJson(
                400,
                [
                    "error" =>
                        "Statut invalide.",

                    "allowed_statuses" =>
                        $allowedStatuses
                ]
            );
        }


        $check =
            $pdo->prepare(
                "SELECT id
                 FROM applications
                 WHERE id = :id
                 LIMIT 1"
            );


        $check->execute([
            ":id" => $id
        ]);


        if (!$check->fetch()) {

            sendJson(
                404,
                [
                    "error" =>
                        "Candidature introuvable."
                ]
            );
        }


        $update =
            $pdo->prepare(
                "UPDATE applications
                 SET status = :status
                 WHERE id = :id"
            );


        $update->execute([

            ":status" =>
                $status,

            ":id" =>
                $id
        ]);


        sendJson(
            200,
            [
                "success" => true,

                "message" =>
                    "Le statut de la candidature a été mis à jour.",

                "id" =>
                    $id,

                "status" =>
                    $status
            ]
        );
    }


    // ========================================
    // METHOD NOT ALLOWED
    // ========================================

    header(
        "Allow: GET, POST, PUT, OPTIONS"
    );


    sendJson(
        405,
        [
            "error" =>
                "Méthode non autorisée."
        ]
    );


} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();

    error_log(
        $e->getMessage()
    );


    sendJson(
        500,
        [
            "error" =>
                "Une erreur de base de données est survenue."
        ]
    );
}