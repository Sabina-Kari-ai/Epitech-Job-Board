// « Mes candidatures » : historique du candidat et réponses des recruteurs.

const APPLICATIONS_API_URL = `http://${window.location.hostname}:8001/api/app/?mine=1`;
const applicationsList = document.getElementById("applications-list");

const statusLabels = {
    pending: "En attente",
    reviewing: "En cours d'étude",
    interview: "Entretien",
    accepted: "Acceptée",
    rejected: "Refusée"
};

function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

function renderApplications(applications) {
    applicationsList.replaceChildren();

    const sentApplications = applications.filter(
        (application) => application.status !== "interview"
    );
    const interviews = applications.filter(
        (application) => application.status === "interview"
    );

    function renderGroup(title, items, emptyText) {
        const section = document.createElement("section");
        section.className = "application-group";
        section.appendChild(createTextElement("h2", "", title));

        if (items.length === 0) {
            section.appendChild(createTextElement("p", "empty-state", emptyText));
            applicationsList.appendChild(section);
            return;
        }

        items.forEach((application) => {
            const card = document.createElement("article");
            card.className = "application-card";

            const info = document.createElement("div");
            info.className = "application-info";
            info.append(
                createTextElement("span", "section-label", "CANDIDATURE"),
                createTextElement(
                    "h2",
                    "",
                    application.job_title || `Offre #${application.job_id}`
                ),
                createTextElement("p", "application-company", application.company || ""),
                createTextElement("p", "", application.candidate_email || ""),
                createTextElement("p", "", application.candidate_phone || "")
            );

            if (application.cv_file_name) {
                const cvLink = document.createElement("a");
                cvLink.href =
                    `http://${window.location.hostname}:8001/api/app/?id=${encodeURIComponent(application.id)}&attachment=cv`;
                cvLink.textContent = "Télécharger mon CV";
                info.appendChild(cvLink);
            }
            if (application.cover_letter_file_name) {
                const coverLetterLink = document.createElement("a");
                coverLetterLink.href =
                    `http://${window.location.hostname}:8001/api/app/?id=${encodeURIComponent(application.id)}&attachment=cover-letter`;
                coverLetterLink.textContent = "Télécharger ma lettre";
                info.appendChild(coverLetterLink);
            }

            const status = document.createElement("div");
            status.className = "application-status";
            const badge = createTextElement(
                "span",
                `status ${application.status}`,
                statusLabels[application.status] || "En attente"
            );
            status.appendChild(badge);
            card.append(info, status);
            section.appendChild(card);
        });

        applicationsList.appendChild(section);
    }

    renderGroup(
        "Candidatures envoyées",
        sentApplications,
        "Vous n’avez pas encore envoyé de candidature."
    );
    renderGroup(
        "Entretiens",
        interviews,
        "Aucun entretien n’est planifié pour le moment."
    );
}

async function loadApplications() {
    try {
        const response = await fetch(APPLICATIONS_API_URL, {
            credentials: "include"
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erreur HTTP ${response.status}`);
        }
        if (!Array.isArray(data)) {
            throw new Error("Le format des candidatures est invalide.");
        }
        renderApplications(data);
    } catch (error) {
        console.error("Impossible de charger les candidatures :", error);
        applicationsList.textContent =
            "Impossible de charger vos candidatures pour le moment.";
    }
}

// Réponses des recruteurs : notifications créées à chaque changement de statut.
const NOTIFICATIONS_API_URL = `http://${window.location.hostname}:8001/api/notifications/`;

async function loadCandidateNotifications() {
    const section = document.getElementById("candidate-notifications");
    const list = document.getElementById("candidate-notifications-list");
    if (!section || !list) return;

    try {
        const response = await fetch(NOTIFICATIONS_API_URL, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Erreur HTTP ${response.status}`);

        const items = (data.notifications || []).slice(0, 8);
        if (!items.length) return;

        const unread = Number(data.unread_count) || 0;
        document.getElementById("candidate-notifications-count").textContent = unread
            ? `${unread} nouvelle${unread > 1 ? "s" : ""}`
            : "";

        list.replaceChildren(...items.map((notification) => {
            const item = document.createElement("article");
            const statusClass = String(notification.type || "").replace("application_", "");
            item.className = `candidate-notification ${Number(notification.is_read) ? "" : "is-unread"}`;
            item.append(
                createTextElement("span", `status ${statusClass}`, notification.title.replace("Candidature : ", "")),
                createTextElement("p", "", notification.message),
                createTextElement(
                    "time",
                    "",
                    new Date(String(notification.created_at).replace(" ", "T")).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short"
                    })
                )
            );
            return item;
        }));
        section.hidden = false;

        // La page a été consultée : les réponses sont marquées comme lues.
        if (unread) {
            await fetch(NOTIFICATIONS_API_URL, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ all: true })
            });
            document.dispatchEvent(new CustomEvent("jobboard:notifications-read"));
        }
    } catch (error) {
        console.error("Impossible de charger les réponses des recruteurs :", error);
    }
}

loadApplications();
loadCandidateNotifications();
