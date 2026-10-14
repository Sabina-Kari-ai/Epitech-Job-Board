<?php

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ]);

    exit;
}

$pdo = require __DIR__ . '/../config/database.php';

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (str_contains($contentType, 'application/json')) {

    $data = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'Données JSON invalides.'
        ]);

        exit;
    }

} else {

    $data = $_POST;
}


$accountType = trim(
    $data['account_type'] ?? 'candidate'
);

$firstname = trim(
    $data['firstname'] ?? ''
);

$lastname = trim(
    $data['lastname'] ?? ''
);

$email = strtolower(
    trim(
        $data['email'] ?? ''
    )
);

$phone = trim(
    $data['phone'] ?? ''
);

$password =
    $data['password'] ?? '';

$passwordConfirmation =
    $data['password_confirmation'] ?? '';


if (
    !in_array(
        $accountType,
        ['candidate', 'company'],
        true
    )
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Type de compte invalide.'
    ]);

    exit;
}


if (
    $firstname === '' ||
    $lastname === '' ||
    $email === '' ||
    $password === '' ||
    $passwordConfirmation === ''
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Veuillez remplir tous les champs obligatoires.'
    ]);

    exit;
}


if (
    !filter_var(
        $email,
        FILTER_VALIDATE_EMAIL
    )
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Adresse email invalide.'
    ]);

    exit;
}


if (strlen($password) < 8) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Le mot de passe doit contenir au moins 8 caractères.'
    ]);

    exit;
}


if (
    $password !==
    $passwordConfirmation
) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Les mots de passe ne correspondent pas.'
    ]);

    exit;
}


$checkUser = $pdo->prepare(
    'SELECT id
     FROM users
     WHERE email = :email
     LIMIT 1'
);

$checkUser->execute([
    'email' => $email
]);


if ($checkUser->fetch()) {
    http_response_code(409);

    echo json_encode([
        'success' => false,
        'message' => 'Un compte existe déjà avec cette adresse email.'
    ]);

    exit;
}


$companyId = null;


try {

    $pdo->beginTransaction();


    if ($accountType === 'company') {

        $companyName = trim(
            $data['company_name'] ?? ''
        );

        $companyLocation = trim(
            $data['company_location'] ?? ''
        );

        $companyDescription = trim(
            $data['company_description'] ?? ''
        );

        $companyWebsite = trim(
            $data['company_website'] ?? ''
        );


        if (
            $companyName === '' ||
            $companyLocation === ''
        ) {
            throw new InvalidArgumentException(
                'Le nom et la localisation de l’entreprise sont obligatoires.'
            );
        }


        $companyStatement = $pdo->prepare(
            'INSERT INTO companies (
                name,
                location,
                description,
                email,
                phone,
                website
            ) VALUES (
                :name,
                :location,
                :description,
                :email,
                :phone,
                :website
            )'
        );


        $companyStatement->execute([
            'name' =>
                $companyName,

            'location' =>
                $companyLocation,

            'description' =>
                $companyDescription !== ''
                    ? $companyDescription
                    : null,

            'email' =>
                $email,

            'phone' =>
                $phone !== ''
                    ? $phone
                    : null,

            'website' =>
                $companyWebsite !== ''
                    ? $companyWebsite
                    : null
        ]);


        $companyId =
            (int) $pdo->lastInsertId();
    }


    $passwordHash =
        password_hash(
            $password,
            PASSWORD_DEFAULT
        );


    $statement = $pdo->prepare(
        'INSERT INTO users (
            company_id,
            firstname,
            lastname,
            email,
            phone,
            password_hash,
            role,
            account_type
        ) VALUES (
            :company_id,
            :firstname,
            :lastname,
            :email,
            :phone,
            :password_hash,
            :role,
            :account_type
        )'
    );


    $statement->execute([
        'company_id' =>
            $companyId,

        'firstname' =>
            $firstname,

        'lastname' =>
            $lastname,

        'email' =>
            $email,

        'phone' =>
            $phone !== ''
                ? $phone
                : null,

        'password_hash' =>
            $passwordHash,

        'role' =>
            'candidate',

        'account_type' =>
            $accountType
    ]);


    $userId =
        (int) $pdo->lastInsertId();


    $pdo->commit();


    http_response_code(201);

    echo json_encode([
        'success' => true,

        'message' =>
            $accountType === 'company'
                ? 'Compte entreprise créé avec succès.'
                : 'Compte candidat créé avec succès.',

        'user' => [
            'id' =>
                $userId,

            'firstname' =>
                $firstname,

            'lastname' =>
                $lastname,

            'email' =>
                $email,

            'phone' =>
                $phone !== ''
                    ? $phone
                    : null,

            'role' =>
                'candidate',

            'account_type' =>
                $accountType,

            'company_id' =>
                $companyId
        ]
    ]);

} catch (InvalidArgumentException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($e->getCode() === '23000') {

        http_response_code(409);

        echo json_encode([
            'success' => false,
            'message' => 'Un compte existe déjà avec cette adresse email.'
        ]);

        exit;
    }


    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Impossible de créer le compte.'
    ]);
}