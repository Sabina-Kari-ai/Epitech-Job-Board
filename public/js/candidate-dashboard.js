document.addEventListener("DOMContentLoaded", async () => {
    const greeting = document.getElementById("candidate-greeting");

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
    } catch (error) {
        console.error("Impossible de charger l'espace candidat :", error);
    }
});
