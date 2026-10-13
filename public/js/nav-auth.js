document.addEventListener("DOMContentLoaded", async () => {
    const guestActions = document.getElementById("guest-actions");
    const authenticatedActions = document.getElementById("authenticated-actions");
    const logoutButton = document.getElementById("logout-button");
    const userName = document.getElementById("user-first-name");

    try {
        const user = await window.JobBoardAuth.getUser();
        const requiresAuth = document.body.dataset.authRequired === "true";
        const requiredRole = document.body.dataset.authRole;

        if (requiresAuth && !user) {
            window.location.href = window.JobBoardAuth.loginUrl();
            return;
        }

        if (user && requiredRole && user.role !== requiredRole) {
            window.location.href = user.role === "company"
                ? "company-dashboard.html"
                : "index.html";
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
            const name = `${user.first_name} ${user.last_name}`.trim();
            if (userName) userName.textContent = name;
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
