<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

require_once __DIR__ . "/../config/database.php";

try {
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode([
                "error" => "Les données envoyées sont invalides."
            ]);
            exit;
        }

        $jobId = filter_var(
            $data["job_id"] ?? null,
            FILTER_VALIDATE_INT
        );

        $name = trim($data["candidate_name"] ?? "");
        $email = trim($data["candidate_email"] ?? "");
        $phone = trim($data["candidate_phone"] ?? "");
        $message = trim($data["message"] ?? "");
        $coverLetter = trim($data["cover_letter"] ?? "");

        if (
            !$jobId ||
            $jobId < 1 ||
            $name === "" ||
            $email === "" ||
            $phone === "" ||
            $message === ""
        ) {
            http_response_code(400);
            echo json_encode([
                "error" => "Veuillez remplir tous les champs obligatoires."
            ]);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode([
                "error" => "L'adresse email est invalide."
            ]);
            exit;
        }

        $checkJob = $pdo->prepare(
            "SELECT id FROM jobs WHERE id = :job_id"
        );
        $checkJob->execute([
            ":job_id" => $jobId
        ]);

        if (!$checkJob->fetch()) {
            http_response_code(404);
            echo json_encode([
                "error" => "Cette offre n'existe pas."
            ]);
            exit;
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
            ":cover_letter" => $coverLetter !== ""
                ? $coverLetter
                : null
        ]);

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Votre candidature a bien été envoyée.",
            "application_id" => $pdo->lastInsertId()
        ]);
        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        $statement = $pdo->query(
            "SELECT
                id,
                job_id,
                candidate_name,
                candidate_email,
                candidate_phone,
                message,
                cover_letter,
                status,
                created_at
            FROM applications
            ORDER BY created_at DESC"
        );

        echo json_encode($statement->fetchAll());
        exit;
    }

    header("Allow: GET, POST, OPTIONS");
    http_response_code(405);

    echo json_encode([
        "error" => "Méthode non autorisée."
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    http_response_code(500);
    echo json_encode([
        "error" => "Erreur lors de l'enregistrement de la candidature."
    ]);
}
