const APPLICATIONS_API_URL = "http://127.0.0.1:8001/api/app/?mine=1";
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
                    `http://127.0.0.1:8001/api/app/?id=${encodeURIComponent(application.id)}&attachment=cv`;
                cvLink.textContent = "Télécharger mon CV";
                info.appendChild(cvLink);
            }
            if (application.cover_letter_file_name) {
                const coverLetterLink = document.createElement("a");
                coverLetterLink.href =
                    `http://127.0.0.1:8001/api/app/?id=${encodeURIComponent(application.id)}&attachment=cover-letter`;
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

loadApplications();
