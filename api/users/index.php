<?php

require_once __DIR__ . "/../config/session.php";
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../config/helpers.php";

// CRUD des personnes (candidats, recruteurs, admins) : réservé à l'administration.
const USER_ROLES = ["candidate", "company", "admin"];

function userIdFromQuery(): int
{
    $id = filter_var($_GET["id"] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        apiJson(400, ["error" => "Identifiant d'utilisateur invalide."]);
    }

    return $id;
}

function readUserFields(PDO $pdo, bool $isCreation): array
{
    $data = apiBody();
    $user = [
        "id" => $data["id"] ?? null,
        "first_name" => trim((string) ($data["first_name"] ?? "")),
        "last_name" => trim((string) ($data["last_name"] ?? "")),
        "email" => strtolower(trim((string) ($data["email"] ?? ""))),
        "phone" => trim((string) ($data["phone"] ?? "")),
        "city" => trim((string) ($data["city"] ?? "")),
        "role" => $data["role"] ?? "candidate",
        "company_id" => filter_var($data["company_id"] ?? null, FILTER_VALIDATE_INT) ?: null,
        "password" => (string) ($data["password"] ?? "")
    ];

    if ($user["first_name"] === "" || $user["last_name"] === "") {
        apiJson(400, ["error" => "Le prénom et le nom sont obligatoires."]);
    }

    if (!filter_var($user["email"], FILTER_VALIDATE_EMAIL)) {
        apiJson(400, ["error" => "L'adresse e-mail est invalide."]);
    }

    if (!in_array($user["role"], USER_ROLES, true)) {
        apiJson(400, ["error" => "Rôle invalide.", "allowed_roles" => USER_ROLES]);
    }

    if (($isCreation || $user["password"] !== "") && strlen($user["password"]) < 6) {
        apiJson(400, ["error" => "Le mot de passe doit contenir au moins 6 caractères."]);
    }

    if ($user["role"] === "company") {
        $company = $pdo->prepare("SELECT id FROM companies WHERE id = ?");
        $company->execute([(int) $user["company_id"]]);
        if (!$company->fetch()) {
            apiJson(400, ["error" => "Sélectionne l'entreprise de ce recruteur."]);
        }
    } else {
        $user["company_id"] = null;
    }

    $duplicate = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id <> ?");
    $duplicate->execute([$user["email"], (int) $user["id"]]);
    if ($duplicate->fetch()) {
        apiJson(409, ["error" => "Cette adresse e-mail est déjà utilisée."]);
    }

    return $user;
}

try {
    $adminId = apiRequireRole("admin");
    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        $sql = "SELECT users.id, users.first_name, users.last_name, users.email,
                       users.phone, users.city, users.role, users.company_id,
                       users.created_at, companies.name AS company_name,
                       (SELECT COUNT(*) FROM applications
                        WHERE applications.user_id = users.id) AS applications_count
                FROM users
                LEFT JOIN companies ON companies.id = users.company_id";
        $conditions = [];
        $params = [];

        if (in_array($_GET["role"] ?? "", USER_ROLES, true)) {
            $conditions[] = "users.role = :role";
            $params[":role"] = $_GET["role"];
        }

        $search = trim((string) ($_GET["q"] ?? ""));
        if ($search !== "") {
            $conditions[] = "(CONCAT(users.first_name, ' ', users.last_name) LIKE :q_name
                              OR users.email LIKE :q_email)";
            $params[":q_name"] = $params[":q_email"] = "%" . $search . "%";
        }

        if (isset($_GET["id"])) {
            $conditions[] = "users.id = :id";
            $params[":id"] = userIdFromQuery();
        }

        $where = $conditions ? " WHERE " . implode(" AND ", $conditions) : "";

        if (isset($_GET["id"])) {
            $statement = $pdo->prepare($sql . $where);
            $statement->execute($params);
            $user = $statement->fetch();
            if (!$user) {
                apiJson(404, ["error" => "Utilisateur introuvable."]);
            }
            apiJson(200, $user);
        }

        $sql .= $where . " ORDER BY users.created_at DESC, users.id DESC";
        $pagination = apiPagination();

        if ($pagination) {
            $count = $pdo->prepare("SELECT COUNT(*) FROM users" . $where);
            $count->execute($params);
            $sql .= " LIMIT {$pagination["limit"]} OFFSET {$pagination["offset"]}";
        }

        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        $users = $statement->fetchAll();

        if ($pagination) {
            apiJson(200, apiPaginated($users, (int) $count->fetchColumn(), $pagination));
        }

        apiJson(200, $users);
    }

    if ($method === "POST") {
        $user = readUserFields($pdo, true);

        $pdo->prepare(
            "INSERT INTO users (first_name, last_name, email, password_hash, phone, city, role, company_id)
             VALUES (:first_name, :last_name, :email, :password_hash, :phone, :city, :role, :company_id)"
        )->execute([
            ":first_name" => $user["first_name"],
            ":last_name" => $user["last_name"],
            ":email" => $user["email"],
            ":password_hash" => password_hash($user["password"], PASSWORD_DEFAULT),
            ":phone" => $user["phone"] !== "" ? $user["phone"] : null,
            ":city" => $user["city"] !== "" ? $user["city"] : null,
            ":role" => $user["role"],
            ":company_id" => $user["company_id"]
        ]);

        apiJson(201, [
            "success" => true,
            "message" => "Utilisateur créé avec succès.",
            "id" => (int) $pdo->lastInsertId()
        ]);
    }

    if ($method === "PUT") {
        $user = readUserFields($pdo, false);
        $id = filter_var($user["id"], FILTER_VALIDATE_INT);

        if (!$id || $id < 1) {
            apiJson(400, ["error" => "Identifiant d'utilisateur invalide."]);
        }

        $exists = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $exists->execute([$id]);
        if (!$exists->fetch()) {
            apiJson(404, ["error" => "Utilisateur introuvable."]);
        }

        if ($id === $adminId && $user["role"] !== "admin") {
            apiJson(400, ["error" => "Vous ne pouvez pas retirer votre propre rôle administrateur."]);
        }

        $sql = "UPDATE users
                SET first_name = :first_name, last_name = :last_name, email = :email,
                    phone = :phone, city = :city, role = :role, company_id = :company_id";
        $values = [
            ":first_name" => $user["first_name"],
            ":last_name" => $user["last_name"],
            ":email" => $user["email"],
            ":phone" => $user["phone"] !== "" ? $user["phone"] : null,
            ":city" => $user["city"] !== "" ? $user["city"] : null,
            ":role" => $user["role"],
            ":company_id" => $user["company_id"],
            ":id" => $id
        ];

        if ($user["password"] !== "") {
            $sql .= ", password_hash = :password_hash";
            $values[":password_hash"] = password_hash($user["password"], PASSWORD_DEFAULT);
        }

        $pdo->prepare($sql . " WHERE id = :id")->execute($values);

        apiJson(200, ["success" => true, "message" => "Utilisateur modifié avec succès."]);
    }

    if ($method === "DELETE") {
        $id = userIdFromQuery();

        if ($id === $adminId) {
            apiJson(400, ["error" => "Vous ne pouvez pas supprimer votre propre compte."]);
        }

        $pdo->beginTransaction();
        // Les candidatures restent dans l'historique, sans lien vers le compte.
        $pdo->prepare("UPDATE applications SET user_id = NULL WHERE user_id = ?")->execute([$id]);
        $pdo->prepare("DELETE FROM notifications WHERE user_id = ?")->execute([$id]);
        $delete = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $delete->execute([$id]);

        if ($delete->rowCount() === 0) {
            $pdo->rollBack();
            apiJson(404, ["error" => "Utilisateur introuvable."]);
        }
        $pdo->commit();

        apiJson(200, ["success" => true, "message" => "Utilisateur supprimé avec succès."]);
    }

    header("Allow: GET, POST, PUT, DELETE, OPTIONS");
    apiJson(405, ["error" => "Méthode non autorisée."]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($e->getMessage());
    apiJson(500, ["error" => "Erreur lors de l'opération sur les utilisateurs."]);
}
