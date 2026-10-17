<?php

// Origines autorisées à appeler l'API avec le cookie de session.
$allowedOrigins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5174",
    "http://127.0.0.1:4173",
    "http://localhost:4173"
];

$configuredOrigin = getenv("FRONTEND_ORIGIN");
if ($configuredOrigin) {
    $allowedOrigins[] = $configuredOrigin;
}

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Expose-Headers: Content-Disposition");
    header("Vary: Origin");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Session-Scope");

// Requête de pré-vérification envoyée par le navigateur : rien d'autre à faire.
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Deux sessions indépendantes, chacune avec son cookie : celle du site
// (candidats et entreprises) et celle de l'administration. On peut ainsi
// être connecté en entreprise dans un onglet et en admin dans un autre,
// dans le même navigateur, sans que l'un déconnecte l'autre.
// La page admin le signale par l'en-tête X-Session-Scope (ou ?scope=admin
// pour les liens de téléchargement, qui ne peuvent pas envoyer d'en-tête).
const SESSION_COOKIES = ["site" => "PHPSESSID", "admin" => "JOBBOARD_ADMIN"];

function jobBoardRequestScope(): string
{
    $scope = $_SERVER["HTTP_X_SESSION_SCOPE"] ?? $_GET["scope"] ?? "site";
    return $scope === "admin" ? "admin" : "site";
}

function jobBoardStartSession(string $scope): void
{
    $name = SESSION_COOKIES[$scope];

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
        // Sans ça, PHP rouvrirait la nouvelle session avec l'identifiant de
        // l'ancienne, et la régénération qui suit supprimerait l'autre session.
        session_id($_COOKIE[$name] ?? session_create_id());
    }

    ini_set("session.use_strict_mode", "1");
    session_name($name);
    session_set_cookie_params([
        "lifetime" => 0,
        "path" => "/",
        "secure" => !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off",
        "httponly" => true,
        "samesite" => "Lax"
    ]);
    session_start();

    // Chaque session ne garde que les rôles qui lui correspondent.
    $role = $_SESSION["user_role"] ?? null;
    if ($role !== null && ($scope === "admin") !== ($role === "admin")) {
        $_SESSION = [];
    }
}

jobBoardStartSession(jobBoardRequestScope());

// Refresh authorization on every request: revoked roles and deleted users must
// take effect without requiring the owner of the session to log out.
if (!empty($_SESSION['user_id'])) {
    require_once __DIR__ . '/database.php';
    $sessionUser = $pdo->prepare('SELECT role FROM users WHERE id = ?');
    $sessionUser->execute([(int) $_SESSION['user_id']]);
    $currentRole = $sessionUser->fetchColumn();
    if ($currentRole === false) { $_SESSION = []; }
    else { $_SESSION['user_role'] = $currentRole; }
}
