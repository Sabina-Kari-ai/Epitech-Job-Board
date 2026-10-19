// Alertes emploi enregistrées en base, isolées par compte candidat.
// La page affiche aussi les offres qui correspondent aux alertes actives.

document.addEventListener("DOMContentLoaded", async () => {
    const alertForm = document.getElementById("alert-form");
    const alertsList = document.getElementById("alerts-list");
    const feedback = document.getElementById("alert-feedback");
    const matchingJobsList = document.getElementById("matching-jobs-list");
    const matchingJobsFeedback = document.getElementById("matching-jobs-feedback");
    const profileMenuButton = document.querySelector(".profile-menu-button");
    const profileDropdown = document.querySelector(".profile-dropdown");

    let cachedAlerts = [];
    let user = null;

    try {
        user = await window.JobBoardAuth.requireUser();
        if (!user) return;
        const response = await fetch('/api/alerts/');
        if (!response.ok) throw new Error('Impossible de charger les alertes.');
        cachedAlerts = (await response.json()).alerts;
        // Preserve browser-only alerts from the previous version, once, for this owner.
        {
            try { const legacy=JSON.parse(localStorage.getItem('jobboard_alerts_'+user.id)||'[]');
                if (Array.isArray(legacy) && legacy.length && await saveAlerts([...cachedAlerts, ...legacy.filter(item => !cachedAlerts.some(saved => saved.id === item.id))])) localStorage.removeItem('jobboard_alerts_'+user.id);
            } catch { /* Keep legacy data intact if storage is unavailable. */ }
        }
    } catch (error) {
        console.error("Impossible de charger la session :", error);
        showFeedback("Impossible de charger vos alertes.", true);
        return;
    }

    function getAlerts() { return structuredClone(cachedAlerts); }
    async function saveAlerts(alerts) {
        try {
            const response = await fetch('/api/alerts/', {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({alerts})});
            const data=await response.json(); if(!response.ok) throw new Error(data.error || 'Impossible d’enregistrer les alertes.');
            cachedAlerts=data.alerts; document.dispatchEvent(new CustomEvent('jobboard:alerts-changed')); return true;
        } catch(error) { showFeedback(error.message, true); return false; }
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
            toggleButton.addEventListener("click", async () => {
                await updateAlert(alert.id, { enabled: !alert.enabled });
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-alert";
            deleteButton.textContent = "Supprimer";
            deleteButton.addEventListener("click", async () => {
                await deleteAlert(alert.id);
            });

            actions.append(toggleButton, deleteButton);
            item.append(content, actions);
            alertsList.appendChild(item);
        });
    }

    function renderMatchingJobs(jobs) {
        if (!matchingJobsList) return;
        matchingJobsList.replaceChildren();

        if (jobs.length === 0) {
            matchingJobsList.appendChild(
                createTextElement(
                    "p",
                    "empty-state",
                    "Aucune offre ne correspond à vos alertes pour le moment."
                )
            );
            return;
        }

        jobs.forEach((job) => {
            const item = document.createElement("article");
            item.className = "matching-job-item";
            const details = document.createElement("div");
            details.append(
                createTextElement("h3", "", job.title || "Offre sans titre"),
                createTextElement("p", "", [
                    job.company,
                    job.location,
                    job.contract_type
                ].filter(Boolean).join(" · "))
            );
            const link = document.createElement("a");
            link.className = "btn btn-primary";
            link.href = `job.html?id=${encodeURIComponent(job.id)}`;
            link.textContent = "Voir l’offre";
            item.append(details, link);
            matchingJobsList.appendChild(item);
        });
    }

    async function loadMatchingJobs(userId) {
        if (!matchingJobsList || !window.JobBoardAlertNotifications) return;

        try {
            const jobs = await window.JobBoardAlertNotifications.getMatchingJobs(userId);
            renderMatchingJobs(jobs);
            window.JobBoardAlertNotifications.markViewed(userId);
        } catch (error) {
            console.error("Impossible de charger les offres correspondant aux alertes :", error);
            matchingJobsList.replaceChildren(
                createTextElement(
                    "p",
                    "empty-state",
                    "Impossible de charger les offres correspondantes."
                )
            );
            if (matchingJobsFeedback) {
                matchingJobsFeedback.textContent =
                    "Vérifiez que le serveur des offres est démarré, puis rechargez la page.";
                matchingJobsFeedback.classList.add("error");
            }
        }
    }

    async function updateAlert(id, changes) {
        const currentAlerts = getAlerts();
        if (!currentAlerts) return;
        const alerts = currentAlerts.map((alert) =>
            alert.id === id ? { ...alert, ...changes } : alert
        );

        if (!await saveAlerts(alerts)) return;
        renderAlerts();
        await loadMatchingJobs(user.id);
    }

    async function deleteAlert(id) {
        const currentAlerts = getAlerts();
        if (!currentAlerts) return;
        const alerts = currentAlerts.filter((alert) => alert.id !== id);
        if (!await saveAlerts(alerts)) return;
        renderAlerts();
        await loadMatchingJobs(user.id);
        showFeedback("Alerte supprimée.");
    }

    if (alertForm) {
        alertForm.addEventListener("submit", async (event) => {
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
            if (!await saveAlerts(alerts)) return;

            alertForm.reset();
            showFeedback("Votre alerte a bien été créée.");
            renderAlerts();
            await loadMatchingJobs(user.id);
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
    await loadMatchingJobs(user.id);
});