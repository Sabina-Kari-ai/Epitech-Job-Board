document.addEventListener("DOMContentLoaded", async () => {
    const guestActions = document.getElementById("guest-actions");
    const authenticatedActions = document.getElementById("authenticated-actions");
    const logoutButton = document.getElementById("logout-button");
    const greeting = document.getElementById("candidate-greeting");
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
                : "candidate-dashboard.html";
            return;
        }

        if (guestActions) guestActions.hidden = Boolean(user);
        if (authenticatedActions) authenticatedActions.hidden = !user;

        if (user) {
            const name = `${user.first_name} ${user.last_name}`.trim();
            if (greeting) greeting.textContent = `Bonjour ${user.first_name} !`;
            if (userName) userName.textContent = name;
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
