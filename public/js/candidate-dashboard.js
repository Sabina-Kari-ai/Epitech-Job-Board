document.addEventListener("DOMContentLoaded", async () => {
    const greeting = document.getElementById("candidate-greeting");
    const applicationCount = document.getElementById("candidate-application-count");

    try {
        const user = await window.JobBoardAuth.requireUser();
        if (!user) return;

        const firstName = user.first_name || user.firstName;
        if (greeting && firstName) {
            const highlight = document.createElement("span");
            highlight.textContent = "emploi";
            greeting.replaceChildren(
                document.createTextNode(`Bonjour ${firstName}, trouvez votre prochain `),
                highlight
            );
        }

        const response = await fetch("http://127.0.0.1:8001/api/app/?mine=1", {
            credentials: "include"
        });
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const applications = await response.json();
        if (!Array.isArray(applications)) {
            throw new Error("Le format des candidatures reçues est invalide.");
        }

        if (applicationCount) {
            applicationCount.textContent = `(${applications.length})`;
        }
    } catch (error) {
        console.error("Impossible de charger l'espace candidat :", error);
        if (applicationCount) applicationCount.textContent = "";
    }
});
