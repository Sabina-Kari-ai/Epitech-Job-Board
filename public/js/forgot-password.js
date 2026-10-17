// Demande d'un lien de réinitialisation du mot de passe.

const API_BASE_URL = ["localhost:5173", "127.0.0.1:5173", "localhost:4173", "127.0.0.1:4173"]
    .includes(window.location.host)
    ? window.location.origin
    : window.location.origin;
const API_URL = `${API_BASE_URL}/api/auth/forgot-password.php`;
const form = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    message.classList.remove("error");
    submitButton.disabled = true;

    const email = emailInput.value.trim();

    if (!email) {
        message.textContent = "Veuillez saisir votre adresse e-mail.";
        submitButton.disabled = false;
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email }),
            credentials: "include"
        });

        const responseText = await response.text();
        let result;
        try {
            result = responseText ? JSON.parse(responseText) : {};
        } catch {
            throw new Error(
                `Le serveur a renvoyé une réponse invalide (HTTP ${response.status}). Vérifiez sa configuration et ses journaux.`
            );
        }

        if (!response.ok) {
            message.textContent =
                result.error ||
                "Impossible de traiter la demande. Réessayez plus tard.";
            message.classList.add("error");
            return;
        }

        message.textContent =
            result.message ||
            "Si cette adresse correspond à un compte, des instructions seront envoyées.";

        form.reset();
    } catch (error) {
        message.textContent =
            "Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.";
        message.classList.add("error");
        console.error("Erreur lors de la demande de réinitialisation :", error);
    } finally {
        submitButton.disabled = false;
    }
});