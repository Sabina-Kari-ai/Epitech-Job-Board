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

function sendCompaniesJson(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

try {
    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $statement = $pdo->query(
            "SELECT id, name, location, description
            FROM companies
            ORDER BY name"
        );

        sendCompaniesJson($statement->fetchAll());
    }

    if (!in_array($method, ["POST", "PUT", "DELETE"], true)) {
    header("Allow: GET, POST, PUT, DELETE, OPTIONS");
    sendCompaniesJson([
        "error" => "Méthode non autorisée."
    ], 405);
}

    
if ($method === "DELETE") {
    $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        sendCompaniesJson([
            "error" => "Identifiant d'entreprise invalide."
        ], 400);
    }

    $check = $pdo->prepare(
        "SELECT id FROM companies WHERE id = ?"
    );
    $check->execute([$id]);

    if (!$check->fetch()) {
        sendCompaniesJson([
            "error" => "Entreprise introuvable."
        ], 404);
    }

    $jobsCheck = $pdo->prepare(
        "SELECT COUNT(*) FROM jobs WHERE company_id = ?"
    );
    $jobsCheck->execute([$id]);

    if ((int) $jobsCheck->fetchColumn() > 0) {
        sendCompaniesJson([
            "error" => "Impossible de supprimer cette entreprise : des offres lui sont associées."
        ], 409);
    }

    $delete = $pdo->prepare(
        "DELETE FROM companies WHERE id = ?"
    );
    $delete->execute([$id]);

    sendCompaniesJson([
        "success" => true,
        "message" => "Entreprise supprimée avec succès."
    ]);
}

    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        sendCompaniesJson([
            "error" => "Les données JSON sont invalides."
        ], 400);
    }

    $name = trim((string) ($data["name"] ?? ""));
    $location = trim((string) ($data["location"] ?? ""));
    $description = trim((string) ($data["description"] ?? ""));

    if ($name === "" || $location === "" || $description === "") {
        sendCompaniesJson([
            "error" => "Veuillez remplir tous les champs obligatoires."
        ], 400);
    }

    if ($method === "POST") {
        $statement = $pdo->prepare(
            "INSERT INTO companies (name, location, description)
            VALUES (:name, :location, :description)"
        );
        $statement->execute([
            ":name" => $name,
            ":location" => $location,
            ":description" => $description
        ]);

        sendCompaniesJson([
            "success" => true,
            "message" => "Entreprise créée avec succès.",
            "id" => (int) $pdo->lastInsertId()
        ], 201);
    }

    $id = filter_var($data["id"] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        sendCompaniesJson([
            "error" => "Identifiant d'entreprise invalide."
        ], 400);
    }

    $check = $pdo->prepare(
        "SELECT id FROM companies WHERE id = ?"
    );
    $check->execute([$id]);

    if (!$check->fetch()) {
        sendCompaniesJson([
            "error" => "Entreprise introuvable."
        ], 404);
    }

    $statement = $pdo->prepare(
        "UPDATE companies
        SET name = :name, location = :location, description = :description
        WHERE id = :id"
    );
    $statement->execute([
        ":name" => $name,
        ":location" => $location,
        ":description" => $description,
        ":id" => $id
    ]);

    sendCompaniesJson([
        "success" => true,
        "message" => "Entreprise modifiée avec succès."
    ]);
} catch (PDOException $e) {
    error_log($e->getMessage());

    sendCompaniesJson([
        "error" => "Erreur lors de l'enregistrement de l'entreprise."
    ], 500);
}
?>
