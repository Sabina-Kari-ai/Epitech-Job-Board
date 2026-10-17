<?php
require_once __DIR__ . '/../config/session.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/helpers.php';
$userId = apiRequireRole('candidate');
$method = $_SERVER['REQUEST_METHOD'];
try {
    if ($method === 'GET') {
        $query = $pdo->prepare('SELECT alerts_json FROM candidate_alerts WHERE user_id = ?');
        $query->execute([$userId]);
        apiJson(200, ['alerts' => json_decode($query->fetchColumn() ?: '[]', true)]);
    }
    if ($method !== 'PUT') { header('Allow: GET, PUT, OPTIONS'); apiJson(405, ['error'=>'Méthode non autorisée.']); }
    $body = apiBody(); $alerts = $body['alerts'] ?? null;
    if (!is_array($alerts) || !array_is_list($alerts) || count($alerts) > 50) apiJson(400, ['error'=>'50 alertes maximum.']);
    $clean = []; $ids = [];
    foreach ($alerts as $alert) {
        if (!is_array($alert)) apiJson(400, ['error'=>'Alerte invalide.']);
        foreach (['id'=>80, 'title'=>150, 'keyword'=>255, 'location'=>150, 'contract'=>30] as $field=>$max) {
            if (!isset($alert[$field]) || !is_string($alert[$field]) || strlen($alert[$field]) > $max) apiJson(400, ['error'=>'Champ d’alerte invalide.']);
        }
        if ($alert['id']==='' || trim($alert['title'])==='' || isset($ids[$alert['id']]) || !is_bool($alert['enabled'] ?? null) || !in_array($alert['contract'], ['', 'CDI','CDD','Alternance','Stage','Intérim'], true)) apiJson(400, ['error'=>'Alerte invalide.']);
        $ids[$alert['id']] = true;
        $timestamp = isset($alert['createdAt']) && is_string($alert['createdAt']) ? strtotime($alert['createdAt']) : false;
        $clean[] = ['id'=>$alert['id'], 'title'=>trim($alert['title']), 'keyword'=>trim($alert['keyword']), 'location'=>trim($alert['location']), 'contract'=>$alert['contract'], 'enabled'=>$alert['enabled'], 'createdAt'=>gmdate('c', $timestamp ?: time())];
    }
    $query = $pdo->prepare('INSERT INTO candidate_alerts (user_id, alerts_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE alerts_json = VALUES(alerts_json)');
    $query->execute([$userId, json_encode($clean, JSON_UNESCAPED_UNICODE)]);
    apiJson(200, ['success'=>true, 'alerts'=>$clean]);
} catch (PDOException $e) { error_log($e->getMessage()); apiJson(500, ['error'=>'Impossible d’enregistrer vos alertes.']); }
