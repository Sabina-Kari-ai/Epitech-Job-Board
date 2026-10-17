<?php

// Valeurs par défaut WAMP ; surchargeables par variables d'environnement.
$host = getenv("DB_HOST") ?: "localhost";
$port = getenv("DB_PORT") ?: "3306";
$dbname = getenv("DB_NAME") ?: "job_board";
$username = getenv("DB_USER") ?: "root";
$password = getenv("DB_PASSWORD") ?: "";
// Ignored local override is convenient for Windows; environment variables stay supported.
$localFile=__DIR__.'/database.local.php';
if (is_file($localFile)) {
    $local=require $localFile;
    if (is_array($local)) { $host=$local['host']??$host; $port=$local['port']??$port; $dbname=$local['database']??$dbname; $username=$local['username']??$username; $password=$local['password']??$password; }
}

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "error" => "Erreur de connexion à la base de données"
    ]);

    exit;
}
