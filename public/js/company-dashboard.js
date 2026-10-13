document.addEventListener("DOMContentLoaded", async () => {
    try {
        const user = await window.JobBoardAuth.requireUser();
        if (!user) return;

        const companyName = user.company_name || "Entreprise";
        const welcome = document.getElementById("company-welcome");
        const name = document.getElementById("company-name");
        const location = document.getElementById("company-location");
        const userName = document.getElementById("company-user-name");

        if (welcome) welcome.textContent = `Bienvenue, ${companyName}`;
        if (name) name.textContent = companyName;
        if (location) location.textContent = user.company_location || "";
        if (userName) {
            userName.textContent = `${user.first_name} ${user.last_name}`.trim();
        }
    } catch (error) {
        console.error("Impossible de charger l'espace entreprise :", error);
    }
});
