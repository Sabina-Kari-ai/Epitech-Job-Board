<?php

$configFile = __DIR__ . '/database.local.php';

if (!file_exists($configFile)) {
    throw new RuntimeException(
        'Database configuration missing. Copy database.local.example.php to database.local.php.'
    );
}

$config = require $configFile;

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
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    throw new RuntimeException('Database connection failed.');
}

return $pdo;