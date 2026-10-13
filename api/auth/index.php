<?php

require_once __DIR__ . "/../config/session.php";

require_once __DIR__ . "/../config/database.php";

function sendAuthJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function readAuthJson(): array
{
    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        sendAuthJson(400, ["error" => "Les données envoyées sont invalides."]);
    }

    return $data;
}

function publicUser(array $user): array
{
    unset($user["password_hash"]);
    return $user;
}

try {
    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "GET") {
        if (empty($_SESSION["user_id"])) {
            sendAuthJson(401, ["error" => "Vous devez être connecté."]);
        }

        $statement = $pdo->prepare(
            "SELECT users.id, users.first_name, users.last_name, users.email,
                    users.phone, users.city, users.linkedin_url, users.bio,
                    users.role, users.company_id, companies.name AS company_name,
                    companies.location AS company_location
             FROM users
             LEFT JOIN companies ON companies.id = users.company_id
             WHERE users.id = :id"
        );
        $statement->execute([":id" => $_SESSION["user_id"]]);
        $user = $statement->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $_SESSION = [];
            session_destroy();
            sendAuthJson(401, ["error" => "La session n'est plus valide."]);
        }

        sendAuthJson(200, ["user" => $user]);
    }

    if ($method !== "POST") {
        header("Allow: GET, POST, OPTIONS");
        sendAuthJson(405, ["error" => "Méthode non autorisée."]);
    }

    $data = readAuthJson();
    $action = $data["action"] ?? "";

    if ($action === "change_email" || $action === "change_password") {
        $userId = (int) ($_SESSION["user_id"] ?? 0);
        if ($userId < 1) {
            sendAuthJson(401, ["error" => "Vous devez être connecté."]);
        }
        if (($_SESSION["user_role"] ?? "") !== "candidate") {
            sendAuthJson(403, ["error" => "Cette fonction est réservée aux candidats."]);
        }

        $currentPassword = (string) ($data["current_password"] ?? "");
        $statement = $pdo->prepare(
            "SELECT password_hash FROM users WHERE id = :id AND role = 'candidate'"
        );
        $statement->execute([":id" => $userId]);
        $account = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$account || !password_verify($currentPassword, $account["password_hash"])) {
            sendAuthJson(403, ["error" => "Le mot de passe actuel est incorrect."]);
        }

        if ($action === "change_email") {
            $email = strtolower(trim((string) ($data["email"] ?? "")));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendAuthJson(400, ["error" => "Saisissez une adresse e-mail valide."]);
            }

            $check = $pdo->prepare(
                "SELECT id FROM users WHERE email = :email AND id <> :id"
            );
            $check->execute([":email" => $email, ":id" => $userId]);
            if ($check->fetch()) {
                sendAuthJson(409, ["error" => "Cette adresse e-mail est déjà utilisée."]);
            }

            $update = $pdo->prepare(
                "UPDATE users SET email = :email WHERE id = :id AND role = 'candidate'"
            );
            $update->execute([":email" => $email, ":id" => $userId]);
            sendAuthJson(200, [
                "success" => true,
                "email" => $email,
                "message" => "Votre adresse e-mail a été modifiée."
            ]);
        }

        $newPassword = (string) ($data["new_password"] ?? "");
        $confirmPassword = (string) ($data["confirm_password"] ?? "");
        if (strlen($newPassword) < 6) {
            sendAuthJson(400, [
                "error" => "Le nouveau mot de passe doit contenir au moins 6 caractères."
            ]);
        }
        if ($newPassword !== $confirmPassword) {
            sendAuthJson(400, ["error" => "Les mots de passe ne correspondent pas."]);
        }

        $update = $pdo->prepare(
            "UPDATE users SET password_hash = :password_hash
             WHERE id = :id AND role = 'candidate'"
        );
        $update->execute([
            ":password_hash" => password_hash($newPassword, PASSWORD_DEFAULT),
            ":id" => $userId
        ]);
        sendAuthJson(200, [
            "success" => true,
            "message" => "Votre mot de passe a été modifié."
        ]);
    }

    if ($action === "delete_account") {
        $userId = (int) ($_SESSION["user_id"] ?? 0);
        if ($userId < 1) {
            sendAuthJson(401, ["error" => "Vous devez être connecté."]);
        }
        if (($_SESSION["user_role"] ?? "") !== "candidate") {
            sendAuthJson(403, ["error" => "Cette fonction est réservée aux candidats."]);
        }

        $password = (string) ($data["password"] ?? "");
        $statement = $pdo->prepare(
            "SELECT password_hash FROM users WHERE id = :id AND role = 'candidate'"
        );
        $statement->execute([":id" => $userId]);
        $account = $statement->fetch(PDO::FETCH_ASSOC);

        if (!$account || !password_verify($password, $account["password_hash"])) {
            sendAuthJson(403, ["error" => "Le mot de passe est incorrect."]);
        }

        $pdo->beginTransaction();
        $deleteApplications = $pdo->prepare(
            "DELETE FROM applications WHERE user_id = :user_id"
        );
        $deleteApplications->execute([":user_id" => $userId]);
        $deleteAccount = $pdo->prepare(
            "DELETE FROM users WHERE id = :id AND role = 'candidate'"
        );
        $deleteAccount->execute([":id" => $userId]);
        if ($deleteAccount->rowCount() !== 1) {
            $pdo->rollBack();
            sendAuthJson(500, ["error" => "Le compte candidat n'a pas pu être supprimé."]);
        }
        $pdo->commit();

        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), "", [
                "expires" => time() - 42000,
                "path" => $params["path"],
                "domain" => $params["domain"],
                "secure" => $params["secure"],
                "httponly" => $params["httponly"],
                "samesite" => "Lax"
            ]);
        }
        session_destroy();
        sendAuthJson(200, ["success" => true]);
    }

    if ($action === "register") {
        $firstName = trim((string) ($data["first_name"] ?? ""));
        $lastName = trim((string) ($data["last_name"] ?? ""));
        $email = strtolower(trim((string) ($data["email"] ?? "")));
        $password = (string) ($data["password"] ?? "");
        $accountType = $data["account_type"] ?? "candidate";
        $companyName = trim((string) ($data["company_name"] ?? ""));
        $companyLocation = trim((string) ($data["company_location"] ?? ""));

        if ($firstName === "" || $lastName === "" || $email === "" || $password === "") {
            sendAuthJson(400, ["error" => "Tous les champs sont obligatoires."]);
        }

        if (!in_array($accountType, ["candidate", "company"], true)) {
            sendAuthJson(400, ["error" => "Type de compte invalide."]);
        }

        if ($accountType === "company" && ($companyName === "" || $companyLocation === "")) {
            sendAuthJson(400, [
                "error" => "Le nom et la ville de l'entreprise sont obligatoires."
            ]);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendAuthJson(400, ["error" => "L'adresse e-mail est invalide."]);
        }

        if (strlen($password) < 6) {
            sendAuthJson(400, [
                "error" => "Le mot de passe doit contenir au moins 6 caractères."
            ]);
        }

        $check = $pdo->prepare("SELECT id FROM users WHERE email = :email");
        $check->execute([":email" => $email]);

        if ($check->fetch()) {
            sendAuthJson(409, ["error" => "Cette adresse e-mail est déjà utilisée."]);
        }

        $pdo->beginTransaction();
        $companyId = null;
        if ($accountType === "company") {
            $company = $pdo->prepare(
                "INSERT INTO companies (name, location) VALUES (:name, :location)"
            );
            $company->execute([
                ":name" => $companyName,
                ":location" => $companyLocation
            ]);
            $companyId = (int) $pdo->lastInsertId();
        }

        $statement = $pdo->prepare(
            "INSERT INTO users (first_name, last_name, email, password_hash, role, company_id)
             VALUES (:first_name, :last_name, :email, :password_hash, :role, :company_id)"
        );
        $statement->execute([
            ":first_name" => $firstName,
            ":last_name" => $lastName,
            ":email" => $email,
            ":password_hash" => password_hash($password, PASSWORD_DEFAULT),
            ":role" => $accountType,
            ":company_id" => $companyId
        ]);
        $userId = (int) $pdo->lastInsertId();
        $pdo->commit();

        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION["user_id"] = $userId;
        $_SESSION["user_role"] = $accountType;

        sendAuthJson(201, [
            "success" => true,
            "user" => [
                "id" => $userId,
                "first_name" => $firstName,
                "last_name" => $lastName,
                "email" => $email,
                "role" => $accountType,
                "company_id" => $companyId,
                "company_name" => $companyName ?: null,
                "company_location" => $companyLocation ?: null
            ]
        ]);
    }

    if ($action === "login") {
        $email = strtolower(trim((string) ($data["email"] ?? "")));
        $password = (string) ($data["password"] ?? "");

        if ($email === "" || $password === "") {
            sendAuthJson(400, ["error" => "Saisissez votre e-mail et votre mot de passe."]);
        }

        $statement = $pdo->prepare(
            "SELECT users.id, users.first_name, users.last_name, users.email,
                    users.password_hash, users.role, users.company_id,
                    companies.name AS company_name,
                    companies.location AS company_location
             FROM users
             LEFT JOIN companies ON companies.id = users.company_id
             WHERE users.email = :email"
        );
        $statement->execute([":email" => $email]);
        $user = $statement->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user["password_hash"])) {
            sendAuthJson(401, ["error" => "E-mail ou mot de passe incorrect."]);
        }

        session_regenerate_id(true);
        $_SESSION["user_id"] = (int) $user["id"];
        $_SESSION["user_role"] = $user["role"];

        sendAuthJson(200, [
            "success" => true,
            "user" => publicUser($user)
        ]);
    }

    if ($action === "logout") {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), "", [
                "expires" => time() - 42000,
                "path" => $params["path"],
                "domain" => $params["domain"],
                "secure" => $params["secure"],
                "httponly" => $params["httponly"],
                "samesite" => "Lax"
            ]);
        }
        session_destroy();
        sendAuthJson(200, ["success" => true]);
    }

    if ($action === "profile") {
        if (empty($_SESSION["user_id"])) {
            sendAuthJson(401, ["error" => "Vous devez être connecté."]);
        }
        if (($_SESSION["user_role"] ?? "") !== "candidate") {
            sendAuthJson(403, ["error" => "Cette fonction est réservée aux candidats."]);
        }

        $firstName = trim((string) ($data["first_name"] ?? ""));
        $lastName = trim((string) ($data["last_name"] ?? ""));
        $email = strtolower(trim((string) ($data["email"] ?? "")));
        $phone = trim((string) ($data["phone"] ?? ""));
        $city = trim((string) ($data["city"] ?? ""));
        $linkedin = trim((string) ($data["linkedin_url"] ?? ""));
        $bio = trim((string) ($data["bio"] ?? ""));

        if ($firstName === "" || $lastName === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendAuthJson(400, ["error" => "Prénom, nom et e-mail valides sont requis."]);
        }

        if ($linkedin !== "" && !filter_var($linkedin, FILTER_VALIDATE_URL)) {
            sendAuthJson(400, ["error" => "L'adresse LinkedIn est invalide."]);
        }

        $currentEmailStatement = $pdo->prepare(
            "SELECT email FROM users WHERE id = :id AND role = 'candidate'"
        );
        $currentEmailStatement->execute([":id" => $_SESSION["user_id"]]);
        $currentEmail = $currentEmailStatement->fetchColumn();
        if ($currentEmail === false) {
            sendAuthJson(404, ["error" => "Le compte candidat est introuvable."]);
        }
        if ($email !== strtolower((string) $currentEmail)) {
            sendAuthJson(
                400,
                ["error" => "Modifiez votre adresse e-mail depuis l'onglet Compte et sécurité."]
            );
        }

        $check = $pdo->prepare(
            "SELECT id FROM users WHERE email = :email AND id <> :id"
        );
        $check->execute([
            ":email" => $email,
            ":id" => $_SESSION["user_id"]
        ]);

        if ($check->fetch()) {
            sendAuthJson(409, ["error" => "Cette adresse e-mail est déjà utilisée."]);
        }

        $statement = $pdo->prepare(
            "UPDATE users
             SET first_name = :first_name, last_name = :last_name,
                 email = :email, phone = :phone, city = :city,
                 linkedin_url = :linkedin_url, bio = :bio
             WHERE id = :id"
        );
        $statement->execute([
            ":first_name" => $firstName,
            ":last_name" => $lastName,
            ":email" => $email,
            ":phone" => $phone !== "" ? $phone : null,
            ":city" => $city !== "" ? $city : null,
            ":linkedin_url" => $linkedin !== "" ? $linkedin : null,
            ":bio" => $bio !== "" ? $bio : null,
            ":id" => $_SESSION["user_id"]
        ]);

        sendAuthJson(200, [
            "success" => true,
            "user" => [
                "id" => (int) $_SESSION["user_id"],
                "first_name" => $firstName,
                "last_name" => $lastName,
                "email" => $email,
                "phone" => $phone,
                "city" => $city,
                "linkedin_url" => $linkedin,
                "bio" => $bio,
                "role" => "candidate"
            ]
        ]);
    }

    sendAuthJson(400, ["error" => "Action d'authentification inconnue."]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log($e->getMessage());
    sendAuthJson(500, ["error" => "Une erreur de base de données est survenue."]);
}
?>
