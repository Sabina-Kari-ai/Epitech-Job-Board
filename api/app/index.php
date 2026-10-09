
<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/../config/database.php";

function sendJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function readJson(): array
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        sendJson(400, ["error" => "Les données envoyées sont invalides."]);
    }

    return $data;
}

try {
    $method = $_SERVER["REQUEST_METHOD"];

    // CRÉER UNE CANDIDATURE
    if ($method === "POST") {
        $data = readJson();

        $jobId = filter_var($data["job_id"] ?? null, FILTER_VALIDATE_INT);
        $name = trim($data["candidate_name"] ?? "");
        $email = trim($data["candidate_email"] ?? "");
        $phone = trim($data["candidate_phone"] ?? "");
        $message = trim($data["message"] ?? "");
        $coverLetter = trim($data["cover_letter"] ?? "");

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

        // Vérifier que l'offre existe et si la lettre est obligatoire.
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

        $sql = "INSERT INTO applications (
                    job_id,
                    candidate_name,
                    candidate_email,
                    candidate_phone,
                    message,
                    cover_letter,
                    status
                ) VALUES (
                    :job_id,
                    :candidate_name,
                    :candidate_email,
                    :candidate_phone,
                    :message,
                    :cover_letter,
                    'pending'
                )";

        $statement = $pdo->prepare($sql);
        $statement->execute([
            ":job_id" => $jobId,
            ":candidate_name" => $name,
            ":candidate_email" => $email,
            ":candidate_phone" => $phone,
            ":message" => $message,
            ":cover_letter" => $coverLetter !== "" ? $coverLetter : null
        ]);

        sendJson(201, [
            "success" => true,
            "message" => "Votre candidature a bien été envoyée.",
            "application_id" => $pdo->lastInsertId()
        ]);
    }

    // CONSULTER TOUTES LES CANDIDATURES OU UNE SEULE
    if ($method === "GET") {
        $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);

        $sql = "SELECT
                    id,
                    job_id,
                    candidate_name,
                    candidate_email,
                    candidate_phone,
                    message,
                    cover_letter,
                    status,
                    created_at,
                    updated_at
                FROM applications";

        if (isset($_GET["id"])) {
            if (!$id || $id < 1) {
                sendJson(400, ["error" => "Identifiant invalide."]);
            }

            $statement = $pdo->prepare($sql . " WHERE id = :id");
            $statement->execute([":id" => $id]);
            $application = $statement->fetch(PDO::FETCH_ASSOC);

            if (!$application) {
                sendJson(404, ["error" => "Candidature introuvable."]);
            }

            sendJson(200, $application);
        }

        $statement = $pdo->query($sql . " ORDER BY created_at DESC");
        sendJson(200, $statement->fetchAll(PDO::FETCH_ASSOC));
    }

    // MODIFIER LE STATUT D'UNE CANDIDATURE
    if ($method === "PUT") {
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