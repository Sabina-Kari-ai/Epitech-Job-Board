// Saisie du nouveau mot de passe à partir du lien reçu par e-mail.

const API_BASE_URL = ["localhost:5173", "127.0.0.1:5173", "localhost:4173", "127.0.0.1:4173"]
    .includes(window.location.host)
    ? "http://127.0.0.1:8001"
    : window.location.origin;
const API_URL = `${API_BASE_URL}/api/auth/reset-password.php`;
const form = document.getElementById("resetForm");
const message = document.getElementById("message");
const submitButton = document.getElementById("submitButton");
const token = new URLSearchParams(window.location.search).get("token") || "";

function showError(text) {
    message.textContent = text;
    message.classList.add("error");
}

if (!/^[a-f0-9]{64}$/.test(token)) {
    showError("Ce lien de réinitialisation est invalide ou expiré.");
    form.hidden = true;
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    message.classList.remove("error");

    const newPassword = form.elements.namedItem("new_password").value;
    const confirmPassword = form.elements.namedItem("confirm_password").value;
    if (newPassword !== confirmPassword) {
        showError("Les mots de passe ne correspondent pas.");
        return;
    }

    submitButton.disabled = true;
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                token,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
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
            throw new Error(result.error || `Erreur HTTP ${response.status}`);
        }

        message.textContent = result.message ||
            "Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.";
        form.hidden = true;
        document.getElementById("login-link").hidden = false;
        window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
        showError(error.message || "Impossible de réinitialiser le mot de passe.");
        console.error("Erreur lors de la réinitialisation du mot de passe :", error);
    } finally {
        submitButton.disabled = false;
    }
});
