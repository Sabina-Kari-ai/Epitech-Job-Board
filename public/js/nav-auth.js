// Badge des réponses des recruteurs (changements de statut non lus).
function setResponsesBadge(count) {
    const targets = [
        document.querySelector(".profile-menu summary"),
        ...document.querySelectorAll('.profile-dropdown a[href="app.html"]')
    ];
    targets.forEach((target) => {
        if (!target) return;
        let badge = target.querySelector(".responses-count");
        if (!count) {
            badge?.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement("span");
            badge.className = target.tagName === "SUMMARY"
                ? "notification-count responses-count"
                : "menu-count responses-count";
            target.appendChild(badge);
        }
        badge.textContent = count > 9 ? "9+" : String(count);
    });
    const summary = document.querySelector(".profile-menu summary");
    if (summary) {
        summary.title = count
            ? `${count} nouvelle${count > 1 ? "s" : ""} réponse${count > 1 ? "s" : ""} à vos candidatures`
            : "Mon profil";
    }
}

async function updateResponsesBadge() {
    try {
        const base = ["localhost", "127.0.0.1"].includes(window.location.hostname)
            ? window.location.origin
            : window.location.origin;
        const response = await fetch(`${base}/api/notifications/?limit=1`, { credentials: "include" });
        if (!response.ok) return;
        const data = await response.json();
        setResponsesBadge(Number(data.unread_count) || 0);
    } catch (error) {
        console.error("Impossible de charger les réponses des recruteurs :", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const guestActions = document.getElementById("guest-actions");
    const authenticatedActions = document.getElementById("authenticated-actions");
    const logoutButton = document.getElementById("logout-button");
    const userName = document.getElementById("user-first-name");

    try {
        const user = await window.JobBoardAuth.getUser();
        const homeGreeting = document.getElementById('hero-title') || document.querySelector('.hero-text h1');
        // Admin and site cookies remain independent; use admin only for the home greeting.
        if (!user && homeGreeting) {
            try {
                const response = await fetch('/api/auth/', {
                    credentials: 'include',
                    headers: { 'X-Session-Scope': 'admin' },
                    signal: AbortSignal.timeout(10000)
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.user?.role === 'admin') {
                        homeGreeting.textContent = 'Bonjour ' + data.user.first_name + ', bienvenue sur JobBoard';
                    }
                }
            } catch { /* Keep the guest heading when no admin session is available. */ }
        }
        const requiresAuth = document.body.dataset.authRequired === "true";
        const requiredRole = document.body.dataset.authRole;

        if (requiresAuth && !user) {
            window.location.href = window.JobBoardAuth.loginUrl();
            return;
        }

        if (user && requiredRole && user.role !== requiredRole) {
            window.location.href = window.JobBoardAuth.homeFor(user.role);
            return;
        }

        if (user && user.role === "candidate") {
            document.querySelectorAll(".nav-links a").forEach((link) => {
                const href = link.getAttribute("href") || "";
                if (href === "#jobs") link.href = "index.html#jobs";
            });
        }

        if (guestActions) guestActions.hidden = Boolean(user);
        if (authenticatedActions) authenticatedActions.hidden = !user;

        if (user) {
            if (user.role === 'candidate') document.querySelectorAll('.nav-links a[href="app.html"], .profile-dropdown a[href="app.html"]').forEach(link => link.remove());
            const name = `${user.first_name} ${user.last_name}`.trim();
            if (userName) userName.textContent = name;
            const greeting=document.getElementById('hero-title') || document.querySelector('.hero-text h1');
            if(greeting) greeting.textContent=user.role==='candidate' ? 'Bonjour '+user.first_name+', trouvez votre prochain emploi' : 'Bonjour '+user.first_name+', bienvenue sur JobBoard';

            // Les liens candidat sont remplacés par l'espace du rôle connecté.
            const dropdown = document.querySelector(".profile-dropdown");
            if (dropdown && user.role !== "candidate") {
                dropdown.querySelectorAll('a[href="profile.html"], a[href="app.html"]')
                    .forEach((link) => link.remove());
                const homeLink = document.createElement("a");
                homeLink.href = window.JobBoardAuth.homeFor(user.role);
                homeLink.textContent = user.role === "admin"
                    ? "Administration"
                    : "Espace entreprise";
                dropdown.insertBefore(
                    homeLink,
                    logoutButton && logoutButton.parentElement === dropdown
                        ? logoutButton
                        : null
                );
            }

            if (user.role === "candidate") {
                updateResponsesBadge();
                document.addEventListener("jobboard:notifications-read", () => setResponsesBadge(0));
            }
        }
        if (window.JobBoardAlertNotifications) {
            const refreshAlertBadge = () => {
                window.JobBoardAlertNotifications.updateBadge(user);
            };
            await window.JobBoardAlertNotifications.updateBadge(user);
            document.addEventListener("jobboard:alerts-viewed", refreshAlertBadge);
            document.addEventListener("jobboard:alerts-changed", refreshAlertBadge);
        }
    } catch (error) {
        console.error("Impossible de vérifier la session :", error);
        if (guestActions) guestActions.hidden = false;
        if (authenticatedActions) authenticatedActions.hidden = true;
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            logoutButton.disabled = true;
            try {
                await window.JobBoardAuth.request({
                    method: "POST",
                    body: JSON.stringify({ action: "logout" })
                });
                window.location.href = "index.html";
            } catch (error) {
                console.error("Déconnexion impossible :", error);
                logoutButton.disabled = false;
            }
        });
    }
});
