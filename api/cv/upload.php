<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../config/auth.php';

$userId = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);

    exit;
}

$pdo = require __DIR__ . '/../config/database.php';

if (!isset($_FILES['cv'])) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'CV file is required.'
    ]);

    exit;
}

$file = $_FILES['cv'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'File upload failed.'
    ]);

    exit;
}

$maxSize = 5 * 1024 * 1024;

if ($file['size'] > $maxSize) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'CV must not exceed 5 MB.'
    ]);

    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if ($mimeType !== 'application/pdf') {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Only PDF files are allowed.'
    ]);

    exit;
}

$projectRoot = dirname(__DIR__, 2);
$uploadDirectory = $projectRoot . '/uploads/cv';

if (!is_dir($uploadDirectory)) {
    if (!mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' => 'Unable to create upload directory.'
        ]);

        exit;
    }
}

$filename = 'cv_' . $userId . '_' . bin2hex(random_bytes(8)) . '.pdf';

$destination = $uploadDirectory . '/' . $filename;

$stmt = $pdo->prepare(
    'SELECT cv_path
     FROM users
     WHERE id = :id
     LIMIT 1'
);

$stmt->execute([
    'id' => $userId
]);

$currentUser = $stmt->fetch();

if (!$currentUser) {
    http_response_code(404);

    echo json_encode([
        'success' => false,
        'message' => 'User not found.'
    ]);

    exit;
}

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to save CV.'
    ]);

    exit;
}

$relativePath = 'uploads/cv/' . $filename;

try {
    $stmt = $pdo->prepare(
        'UPDATE users
         SET cv_path = :cv_path
         WHERE id = :id'
    );

    $stmt->execute([
        'cv_path' => $relativePath,
        'id' => $userId
    ]);

    $oldCvPath = $currentUser['cv_path'] ?? null;

    if (
        $oldCvPath &&
        str_starts_with($oldCvPath, 'uploads/cv/')
    ) {
        $oldFullPath = $projectRoot . '/' . $oldCvPath;

        if (is_file($oldFullPath)) {
            unlink($oldFullPath);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'CV uploaded successfully.',
        'cv_path' => $relativePath
    ]);
} catch (Throwable $e) {
    if (is_file($destination)) {
        unlink($destination);
    }

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to update CV.'
    ]);
}