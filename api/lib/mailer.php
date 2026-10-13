<?php

function projectMailConfig(): array
{
    static $config;
    if ($config === null) {
        $config = ['driver' => 'demo', 'from' => 'noreply@jobboard.test', 'app_url' => 'http://127.0.0.1:5173'];
        $file = __DIR__ . '/../config/mail.local.php';
        if (is_file($file)) $config = array_merge($config, require $file);
    }
    return $config;
}

function projectUrl(string $path): string
{
    return rtrim(projectMailConfig()['app_url'], '/') . '/' . ltrim($path, '/');
}

function sendProjectMail(PDO $pdo, string $recipient, string $subject, string $body, string $key): void
{
    if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Invalid recipient');
    $config = projectMailConfig();
    $statement = $pdo->prepare('INSERT IGNORE INTO mail_outbox (recipient, subject, body, dedupe_key, status) VALUES (?, ?, ?, ?, ?)');
    $statement->execute([$recipient, $subject, $body, $key, $config['driver'] === 'demo' ? 'demo' : 'pending']);
    if (!$statement->rowCount() || $config['driver'] === 'demo') return;
    $id = (int) $pdo->lastInsertId();
    if ($config['driver'] !== 'mail' || !filter_var($config['from'], FILTER_VALIDATE_EMAIL)) {
        $pdo->prepare("UPDATE mail_outbox SET status = 'failed' WHERE id = ?")->execute([$id]);
        throw new RuntimeException('Email transport is not configured');
    }
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = ['From' => $config['from'], 'MIME-Version' => '1.0', 'Content-Type' => 'text/plain; charset=UTF-8'];
    $success = mail($recipient, $encodedSubject, $body, $headers);
    $pdo->prepare('UPDATE mail_outbox SET status = ? WHERE id = ?')->execute([$success ? 'sent' : 'failed', $id]);
    if (!$success) throw new RuntimeException('Email transport failed');
}

function notifyMatchingAlerts(PDO $pdo, int $jobId): void
{
    $stmt = $pdo->prepare("SELECT DISTINCT u.id, u.email, u.firstname, j.title, j.location, j.contract_type
        FROM alerts a JOIN users u ON u.id = a.user_id
        JOIN jobs j ON j.id = ? JOIN companies c ON c.id = j.company_id
        WHERE a.active = 1 AND u.account_type = 'candidate' AND u.role <> 'admin'
        AND (a.keyword IS NULL OR a.keyword = '' OR CONCAT_WS(' ', j.title, j.description, j.skills, c.name) LIKE CONCAT('%', a.keyword, '%'))
        AND (a.location IS NULL OR a.location = '' OR j.location LIKE CONCAT('%', a.location, '%'))
        AND (a.contract_type IS NULL OR a.contract_type = '' OR j.contract_type = a.contract_type)
        AND (j.application_deadline IS NULL OR j.application_deadline >= ?)");
    $today = (new DateTimeImmutable('now', new DateTimeZone('Europe/Paris')))->format('Y-m-d');
    $stmt->execute([$jobId, $today]);
    foreach ($stmt->fetchAll() as $recipient) {
        $body = "Bonjour " . $recipient['firstname'] . ",\n\nUne offre correspond à votre alerte :\n"
            . $recipient['title'] . ' - ' . $recipient['location'] . ' - ' . $recipient['contract_type']
            . "\n\n" . projectUrl('job.html?id=' . $jobId) . "\n\nGérer vos alertes : " . projectUrl('alerts.html');
        try {
            sendProjectMail($pdo, $recipient['email'], 'Nouvelle offre : ' . $recipient['title'], $body, 'job:' . $jobId . ':user:' . $recipient['id']);
        } catch (Throwable $e) {
            error_log('Job alert email delivery failed: ' . $e->getMessage());
        }
    }
}
