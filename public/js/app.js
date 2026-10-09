const APPLICATIONS_API_URL = "http://127.0.0.1:8001/api/app/";

const applicationsList = document.getElementById("applications-list");

const applications =
    JSON.parse(localStorage.getItem("applications")) || [];

const statusLabels = {
    pending: "En attente",
    reviewing: "En cours d'étude",
    accepted: "Acceptée",
    rejected: "Refusée"
};

function getStatusLabel(status) {
    return statusLabels[status] || "En attente";
}

function displayApplications() {
    if (applications.length === 0) {
        applicationsList.innerHTML = `
            <div class="empty-applications">
                <h2>Aucune candidature</h2>
                <p>
                    Vous n'avez pas encore postulé à une offre.
                </p>
                <a href="index.html#jobs" class="btn btn-primary">
                    Voir les offres
                </a>
            </div>
        `;

        return;
    }

    applicationsList.innerHTML = "";

    applications.forEach(function (application) {
        const card = document.createElement("article");

        card.className = "application-card";

        card.innerHTML = `
            <div class="application-info">
                <span class="section-label">CANDIDATURE</span>

                <h2>${application.jobTitle}</h2>

                <p class="application-company">
                    ${application.company}
                </p>

                <p>
                    ${application.email}
                </p>

                <p>
                    ${application.phone}
                </p>
            </div>

            <div class="application-status">
                <span class="status ${application.status}">
                    ${getStatusLabel(application.status)}
                </span>
            </div>
        `;

        applicationsList.appendChild(card);
    });
}

displayApplications();