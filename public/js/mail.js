const list = document.getElementById('mailList');
const error = document.getElementById('mailError');
async function readMail(id) {
    const response = await fetch('/api/mail/?id=' + id);
    if (!response.ok) { error.textContent = 'Impossible de lire ce message.'; return; }
    const {message} = await response.json();
    document.getElementById('mailSubject').textContent = message.subject;
    document.getElementById('mailRecipient').textContent = message.recipient;
    const body = document.getElementById('mailBody'); body.replaceChildren();
    // Only turn links to this local application into clickable controls.
    for (const line of message.body.split('\n')) {
        let url;
        try { url = new URL(line.trim()); } catch {}
        if (url && url.origin === window.location.origin && ['reset-password.html', 'job.html', 'alerts.html'].includes(url.pathname.split('/').pop())) {
            const link = document.createElement('a'); link.href = url.href; link.textContent = line; body.appendChild(link);
        } else { body.appendChild(document.createTextNode(line)); }
        body.appendChild(document.createElement('br'));
    }
    document.getElementById('mailDetail').hidden = false;
}
async function loadMail() {
    error.textContent = '';
    try {
        const response = await fetch('/api/mail/');
        if ([401,403].includes(response.status)) { window.location.href = 'login.html'; return; }
        if (!response.ok) throw new Error();
        const {messages} = await response.json(); list.replaceChildren();
        if (!messages.length) { const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 5; cell.textContent = 'Aucun message pour le moment.'; row.appendChild(cell); list.appendChild(row); }
        for (const message of messages) {
            const row = document.createElement('tr');
            for (const value of [message.created_at,message.recipient,message.subject, {demo:'Démo',sent:'Envoyé',pending:'En attente',failed:'Échec'}[message.status] || message.status]) { const cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell); }
            const actions = document.createElement('td'); const button = document.createElement('button'); button.className = 'btn btn-outline'; button.textContent = 'Lire'; button.addEventListener('click', () => readMail(message.id).catch(() => { error.textContent = 'Impossible de lire ce message.'; })); actions.appendChild(button); row.appendChild(actions); list.appendChild(row);
        }
    } catch { error.textContent = 'Impossible de charger les emails.'; }
}
document.getElementById('refreshMail').addEventListener('click', loadMail);
loadMail();
