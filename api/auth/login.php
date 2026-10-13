<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/../config/session.php';


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {

    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ]);

    exit;
}


$pdo =
    require __DIR__ . '/../config/database.php';


$data = json_decode(
    file_get_contents('php://input'),
    true
);


if (!is_array($data)) {
    $data = $_POST;
}


$email = strtolower(
    trim(
        $data['email'] ?? ''
    )
);

$password =
    $data['password'] ?? '';


if (
    $email === '' ||
    $password === ''
) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Email et mot de passe obligatoires.'
    ]);

    exit;
}


$stmt = $pdo->prepare(
    'SELECT
        id,
        company_id,
        firstname,
        lastname,
        email,
        phone,
        password_hash,
        role,
        account_type,
        cv_path
     FROM users
     WHERE email = :email
     LIMIT 1'
);


$stmt->execute([
    'email' => $email
]);


$user =
    $stmt->fetch();


if (
    !$user ||
    !password_verify(
        $password,
        $user['password_hash']
    )
) {

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Email ou mot de passe incorrect.'
    ]);

    exit;
}


session_regenerate_id(true);


$_SESSION['user_id'] =
    (int) $user['id'];

$_SESSION['role'] =
    $user['role'];

$_SESSION['account_type'] =
    $user['account_type'];

$_SESSION['company_id'] =
    $user['company_id']
        ? (int) $user['company_id']
        : null;


unset(
    $user['password_hash']
);


echo json_encode([
    'success' => true,
    'message' => 'Connexion réussie.',
    'user' => $user
]);