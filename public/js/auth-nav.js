(() => {
    const ready = fetch('/api/users/me.php', { signal: AbortSignal.timeout(10000) }).then(async response => response.ok ? (await response.json()).user : null).catch(() => null);
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
        const title = document.getElementById('heroTitle');
        if (user && title) {
            const name = user.firstname || 'Bienvenue';
            title.textContent = candidate ? 'Bonjour ' + name + ', trouvez votre prochain emploi' : 'Bonjour ' + name + ', bienvenue sur JobBoard';
            document.getElementById('heroLabel').textContent = user.role === 'admin' ? 'ESPACE ADMINISTRATEUR' : candidate ? 'ESPACE CANDIDAT' : 'ESPACE ENTREPRISE';
            document.getElementById('heroSubtitle').textContent = candidate ? 'Explorez les nouvelles offres et gardez vos candidatures à portée de main.' : 'Retrouvez les offres et les entreprises présentes sur la plateforme.';
        }
        const actions = document.querySelector('.navbar .nav-actions');
        if (!actions) return;
        actions.replaceChildren();
        const link = (text, href, cls, parent = actions) => {
            const item = document.createElement('a'); item.textContent = text; item.href = href; item.className = cls; parent.appendChild(item); return item;
        };
        if (!user) {
            link('Connexion', 'login.html', 'btn btn-outline');
            link('Créer un compte', 'register.html', 'btn btn-primary'); return;
        }
        const icon = (kind) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
            svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('width','24'); svg.setAttribute('height','24');
            svg.setAttribute('fill','none'); svg.setAttribute('stroke','currentColor'); svg.setAttribute('stroke-width','1.8'); svg.setAttribute('aria-hidden','true');
            const p = document.createElementNS('http://www.w3.org/2000/svg','path');
            p.setAttribute('d',kind === 'bell' ? 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4' : 'M20 21v-2a7 7 0 0 0-14 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8');
            svg.appendChild(p); return svg;
        };
        if (candidate || user.role === 'admin') {
            const bell = link('', candidate ? 'alerts.html' : 'mail.html', 'account-icon');
            bell.setAttribute('aria-label', candidate ? 'Mes alertes emploi' : 'Emails de notification');
            bell.title = candidate ? 'Mes alertes emploi' : 'Emails de notification'; bell.appendChild(icon('bell'));
        }
        const menu = document.createElement('details'); menu.className = 'account-dropdown';
        const toggle = document.createElement('summary'); toggle.className = 'account-icon'; toggle.setAttribute('aria-label','Ouvrir le menu du compte'); toggle.appendChild(icon('user'));
        const panel = document.createElement('div'); panel.className = 'account-dropdown-panel';
        const name = document.createElement('p'); name.className = 'account-dropdown-name'; name.textContent = [user.firstname,user.lastname].filter(Boolean).join(' ') || 'Mon compte'; panel.appendChild(name);
        if (candidate) {
            link('Mon profil','profile.html','account-menu-link',panel);
            link('Mon CV et lettre de motivation','profile.html#documents','account-menu-link',panel);

        } else if (user.role === 'admin') {
            link('Administration','admin.html','account-menu-link',panel);
            link('Les candidatures','admin.html#applications-panel','account-menu-link',panel);
        } else {
            link('Mon entreprise','companies.html#company-' + user.company_id,'account-menu-link',panel);
        }
        const logout = document.createElement('button'); logout.type = 'button'; logout.className = 'account-menu-link account-menu-logout'; logout.textContent = 'Déconnexion';
        logout.addEventListener('click',async () => {
            try {
                const response = await fetch('/api/auth/logout.php',{method:'POST'});
                if (!response.ok) throw new Error(); window.location.href = 'index.html';
            } catch { logout.textContent = 'Réessayer la déconnexion'; }
        });
        panel.appendChild(logout); menu.append(toggle,panel); actions.appendChild(menu);
        document.addEventListener('click',event => { if (!menu.contains(event.target)) menu.open = false; });
        document.addEventListener('keydown',event => { if (event.key === 'Escape' && menu.open) { menu.open = false; toggle.focus(); } });

    });
})();
