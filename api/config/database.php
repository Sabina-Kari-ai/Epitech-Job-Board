<?php

/*
 * Shared database connection
 * Compatible with:
 * - jobs / companies / applications APIs
 * - authentication / users / CV / alerts APIs
 */

$defaultConfig = [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'job_board',
    'username' => 'root',
    'password' => '',
    'charset' => 'utf8mb4',
];

/*
 * Optional local configuration.
 * This file is not committed to GitHub.
 */
$localConfigFile = __DIR__ . '/database.local.php';

if (file_exists($localConfigFile)) {

    $localConfig = require $localConfigFile;

    if (is_array($localConfig)) {
        $config = array_merge(
            $defaultConfig,
            $localConfig
        );
    } else {
        $config = $defaultConfig;
    }

} else {

    $config = $defaultConfig;
}


/*
 * PDO connection
 */
$dsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
    $config['host'],
    $config['port'],
    $config['database'],
    $config['charset']
);

try {

    $pdo = new PDO(
        $dsn,
        $config['username'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false,
        ]
    );

} catch (PDOException $e) {

    http_response_code(500);

    header(
        'Content-Type: application/json; charset=utf-8'
    );

    echo json_encode([
        'success' => false,
        'error' =>
            'Erreur de connexion à la base de données.'
    ]);

    exit;
}


/*
 * Compatibility:
 *
 * Partner APIs can continue using:
 *     $pdo->prepare(...)
 *
 * Authentication APIs can use:
 *     $pdo = require database.php;
 */
return $pdo;