document.addEventListener("DOMContentLoaded", async () => {
    const alertForm = document.getElementById("alert-form");
    const alertsList = document.getElementById("alerts-list");
    const feedback = document.getElementById("alert-feedback");
    const profileMenuButton = document.querySelector(".profile-menu-button");
    const profileDropdown = document.querySelector(".profile-dropdown");

    let storageKey = "";

    try {
        const user = await window.JobBoardAuth.requireUser();
        if (!user) return;
        storageKey = `jobboard_alerts_${user.id}`;
    } catch (error) {
        console.error("Impossible de charger la session :", error);
        showFeedback("Impossible de charger vos alertes.", true);
        return;
    }

    function getAlerts() {
        try {
            const alerts = JSON.parse(localStorage.getItem(storageKey) || "[]");
            if (!Array.isArray(alerts)) {
                throw new Error("Le format des alertes enregistrées est invalide.");
            }
            return alerts;
        } catch (error) {
            console.error("Impossible de lire les alertes :", error);
            showFeedback("Impossible de lire vos alertes enregistrées.", true);
            return null;
        }
    }

    function saveAlerts(alerts) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(alerts));
            return true;
        } catch (error) {
            console.error("Impossible d'enregistrer les alertes :", error);
            showFeedback("Impossible d'enregistrer vos alertes.", true);
            return false;
        }
    }

    function showFeedback(message, isError = false) {
        if (!feedback) return;

        feedback.textContent = message;
        feedback.classList.toggle("error", isError);
    }

    function createTextElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = text;
        return element;
    }

    function renderAlerts() {
        if (!alertsList) return;

        const alerts = getAlerts();
        alertsList.replaceChildren();

        if (!alerts) {
            alertsList.appendChild(
                createTextElement("p", "empty-state", "Impossible de charger les alertes.")
            );
            return;
        }

        if (alerts.length === 0) {
            alertsList.appendChild(
                createTextElement(
                    "p",
                    "empty-state",
                    "Vous n'avez pas encore créé d'alerte."
                )
            );
            return;
        }

        alerts.forEach((alert) => {
            const item = document.createElement("article");
            item.className = "alert-item";

            const content = document.createElement("div");
            content.className = "alert-item-content";

            content.appendChild(
                createTextElement("h3", "", alert.title)
            );

            const details = [
                alert.keyword && `Mot-clé : ${alert.keyword}`,
                alert.location && `Lieu : ${alert.location}`,
                alert.contract && `Contrat : ${alert.contract}`
            ].filter(Boolean);

            content.appendChild(
                createTextElement(
                    "p",
                    "",
                    details.length ? details.join(" · ") : "Tous les critères"
                )
            );

            content.appendChild(
                createTextElement(
                    "p",
                    "",
                    alert.enabled ? "Alerte activée" : "Alerte désactivée"
                )
            );

            const actions = document.createElement("div");
            actions.className = "alert-item-actions";

            const toggleButton = document.createElement("button");
            toggleButton.type = "button";
            toggleButton.textContent = alert.enabled ? "Désactiver" : "Activer";
            toggleButton.addEventListener("click", () => {
                updateAlert(alert.id, { enabled: !alert.enabled });
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-alert";
            deleteButton.textContent = "Supprimer";
            deleteButton.addEventListener("click", () => {
                deleteAlert(alert.id);
            });

            actions.append(toggleButton, deleteButton);
            item.append(content, actions);
            alertsList.appendChild(item);
        });
    }

    function updateAlert(id, changes) {
        const currentAlerts = getAlerts();
        if (!currentAlerts) return;
        const alerts = currentAlerts.map((alert) =>
            alert.id === id ? { ...alert, ...changes } : alert
        );

        if (!saveAlerts(alerts)) return;
        renderAlerts();
    }

    function deleteAlert(id) {
        const currentAlerts = getAlerts();
        if (!currentAlerts) return;
        const alerts = currentAlerts.filter((alert) => alert.id !== id);
        if (!saveAlerts(alerts)) return;
        renderAlerts();
        showFeedback("Alerte supprimée.");
    }

    if (alertForm) {
        alertForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const formData = new FormData(alertForm);
            const title = String(formData.get("title") || "").trim();

            if (!title) {
                showFeedback("Veuillez donner un nom à votre alerte.", true);
                return;
            }

            const newAlert = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                title,
                keyword: String(formData.get("keyword") || "").trim(),
                location: String(formData.get("location") || "").trim(),
                contract: String(formData.get("contract") || "").trim(),
                enabled: true,
                createdAt: new Date().toISOString()
            };

            const alerts = getAlerts();
            if (!alerts) return;
            alerts.unshift(newAlert);
            if (!saveAlerts(alerts)) return;

            alertForm.reset();
            showFeedback("Votre alerte a bien été créée.");
            renderAlerts();
        });
    }

    if (profileMenuButton && profileDropdown) {
        profileMenuButton.addEventListener("click", () => {
            const isExpanded =
                profileMenuButton.getAttribute("aria-expanded") === "true";

            profileMenuButton.setAttribute("aria-expanded", String(!isExpanded));
            profileDropdown.hidden = isExpanded;
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".profile-menu")) {
                profileDropdown.hidden = true;
                profileMenuButton.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                profileDropdown.hidden = true;
                profileMenuButton.setAttribute("aria-expanded", "false");
            }
        });
    }

    renderAlerts();
});