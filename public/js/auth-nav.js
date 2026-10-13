(() => {
    const ready = fetch('/api/users/me.php').then(async response => response.ok ? (await response.json()).user : null).catch(() => null);
    window.jobBoardUser = ready;
    window.addEventListener('DOMContentLoaded', async () => {
        const user = await ready;
        const page = window.location.pathname.split('/').pop();
        if (['app.html', 'alerts.html', 'profile.html'].includes(page) && !user) {
            window.location.href = 'login.html'; return;
        }
        if (['app.html', 'alerts.html', 'profile.html'].includes(page) && user && (user.account_type !== 'candidate' || user.role === 'admin')) {
            window.location.href = user.role === 'admin' ? 'admin.html' : 'companies.html'; return;
        }
        const candidate = user && user.account_type === 'candidate' && user.role !== 'admin';
        document.querySelectorAll('a[href="app.html"], a[href="alerts.html"]').forEach(link => { link.hidden = !candidate; });
        const actions = document.querySelector('.navbar .nav-actions');
        if (!actions) return;
        actions.replaceChildren();
        const add = (text, href, style) => {
            const a = document.createElement('a'); a.textContent = text; a.href = href;
            a.className = 'btn ' + style; actions.appendChild(a);
        };
        if (!user) {
            add('Connexion', 'login.html', 'btn-outline');
            add('Créer un compte', 'register.html', 'btn-primary');
            return;
        }
        add(user.role === 'admin' ? 'Administration' : user.account_type === 'company' ? 'Mon entreprise' : 'Mon compte',
            user.role === 'admin' ? 'admin.html' : user.account_type === 'company' ? 'companies.html#company-' + user.company_id : 'profile.html', 'btn-outline');
        if (page === '' || page === 'index.html') {
            add('Créer un compte', 'register.html', 'btn-primary');
        }
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'btn btn-primary'; button.textContent = 'Déconnexion';
        button.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/logout.php', { method: 'POST' });
                if (!response.ok) throw new Error();
                window.location.href = 'index.html';
            } catch { button.textContent = 'Réessayer la déconnexion'; }
        });
        actions.appendChild(button);
    });
})();
