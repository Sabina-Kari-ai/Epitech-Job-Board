<?php

require_once __DIR__ . "/../config/session.php";
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../config/helpers.php";

// Chiffres du tableau de bord d'administration.
try {
    apiRequireRole("admin");

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        header("Allow: GET, OPTIONS");
        apiJson(405, ["error" => "Méthode non autorisée."]);
    }

    $countBy = function (string $sql) use ($pdo): array {
        $result = [];
        foreach ($pdo->query($sql)->fetchAll() as $row) {
            $result[$row["k"]] = (int) $row["n"];
        }
        return $result;
    };

    $recent = $pdo->query(
        "SELECT applications.id, applications.candidate_name, applications.status,
                applications.created_at, jobs.title AS job_title, companies.name AS company
         FROM applications
         INNER JOIN jobs ON jobs.id = applications.job_id
         INNER JOIN companies ON companies.id = jobs.company_id
         ORDER BY applications.created_at DESC, applications.id DESC
         LIMIT 5"
    )->fetchAll();

    $pendingCompanies = $pdo->query(
        "SELECT companies.id, companies.name, companies.siret, companies.location, companies.created_at
         FROM companies
         WHERE companies.status = 'pending'
         ORDER BY companies.created_at
         LIMIT 5"
    )->fetchAll();

    apiJson(200, [
        "jobs" => (int) $pdo->query("SELECT COUNT(*) FROM jobs")->fetchColumn(),
        "companies" => $countBy("SELECT status AS k, COUNT(*) AS n FROM companies GROUP BY status"),
        "users" => $countBy("SELECT role AS k, COUNT(*) AS n FROM users GROUP BY role"),
        "applications" => $countBy("SELECT status AS k, COUNT(*) AS n FROM applications GROUP BY status"),
        "recent_applications" => $recent,
        "pending_companies" => $pendingCompanies
    ]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    apiJson(500, ["error" => "Impossible de calculer les statistiques."]);
}
