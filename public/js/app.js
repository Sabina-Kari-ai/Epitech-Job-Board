const APPLICATIONS_API_URL = "/api/app/?mine=1";
const LOGOUT_API_URL = "/api/auth/logout.php";

const applicationsList =
    document.getElementById(
        "applications-list"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const statusLabels = {

    pending:
        "En attente",

    reviewing:
        "En cours d'étude",

    accepted:
        "Acceptée",

    rejected:
        "Refusée"
};


// ========================================
// STATUS
// ========================================

function getStatusLabel(status) {

    return (
        statusLabels[status] ||
        "En attente"
    );
}


// ========================================
// FORMAT DATE
// ========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;
    }


    return new Intl.DateTimeFormat(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(date);
}


// ========================================
// EMPTY STATE
// ========================================

function displayEmptyState() {

    applicationsList.replaceChildren();


    const container =
        document.createElement("div");

    container.className =
        "empty-applications";


    const title =
        document.createElement("h2");

    title.textContent =
        "Aucune candidature";


    const paragraph =
        document.createElement("p");

    paragraph.textContent =
        "Vous n'avez pas encore postulé à une offre.";


    const link =
        document.createElement("a");

    link.href =
        "index.html#jobs";

    link.className =
        "btn btn-primary";

    link.textContent =
        "Voir les offres";


    container.appendChild(
        title
    );

    container.appendChild(
        paragraph
    );

    container.appendChild(
        link
    );


    applicationsList.appendChild(
        container
    );
}


// ========================================
// ERROR STATE
// ========================================

function displayError(message) {

    applicationsList.replaceChildren();


    const container =
        document.createElement("div");

    container.className =
        "empty-applications";


    const title =
        document.createElement("h2");

    title.textContent =
        "Impossible de charger les candidatures";


    const paragraph =
        document.createElement("p");

    paragraph.textContent =
        message ||
        "Une erreur est survenue.";


    const retryButton =
        document.createElement("button");

    retryButton.type =
        "button";

    retryButton.className =
        "btn btn-primary";

    retryButton.textContent =
        "Réessayer";


    retryButton.addEventListener(
        "click",
        loadApplications
    );


    container.appendChild(
        title
    );

    container.appendChild(
        paragraph
    );

    container.appendChild(
        retryButton
    );


    applicationsList.appendChild(
        container
    );
}


// ========================================
// APPLICATION CARD
// ========================================

function createApplicationCard(
    application
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "application-card";


    const information =
        document.createElement(
            "div"
        );

    information.className =
        "application-info";


    const label =
        document.createElement(
            "span"
        );

    label.className =
        "section-label";

    label.textContent =
        "CANDIDATURE";


    const title =
        document.createElement(
            "h2"
        );

    title.textContent =
        application.job_title ||
        "Offre";


    const company =
        document.createElement(
            "p"
        );

    company.className =
        "application-company";

    company.textContent =
        application.company ||
        "Entreprise";


    const details =
        document.createElement(
            "p"
        );


    const detailsParts = [];


    if (application.job_location) {

        detailsParts.push(
            application.job_location
        );
    }


    if (application.contract_type) {

        detailsParts.push(
            application.contract_type
        );
    }


    details.textContent =
        detailsParts.join(" • ");


    const date =
        document.createElement(
            "p"
        );

    const formattedDate =
        formatDate(
            application.created_at
        );


    date.textContent =
        formattedDate
            ? `Candidature envoyée le ${formattedDate}`
            : "";


    information.appendChild(
        label
    );

    information.appendChild(
        title
    );

    information.appendChild(
        company
    );


    if (details.textContent) {

        information.appendChild(
            details
        );
    }


    if (date.textContent) {

        information.appendChild(
            date
        );
    }


    const statusContainer =
        document.createElement(
            "div"
        );

    statusContainer.className =
        "application-status";


    const status =
        document.createElement(
            "span"
        );

    status.className =
        `status ${application.status || "pending"}`;

    status.textContent =
        getStatusLabel(
            application.status
        );


    statusContainer.appendChild(
        status
    );


    card.appendChild(
        information
    );

    card.appendChild(
        statusContainer
    );


    return card;
}


// ========================================
// DISPLAY APPLICATIONS
// ========================================

function displayApplications(
    applications
) {

    if (
        !Array.isArray(applications) ||
        applications.length === 0
    ) {

        displayEmptyState();

        return;
    }


    applicationsList.replaceChildren();


    applications.forEach(
        function (application) {

            const card =
                createApplicationCard(
                    application
                );


            applicationsList.appendChild(
                card
            );
        }
    );
}


// ========================================
// LOAD APPLICATIONS
// ========================================

async function loadApplications() {

    try {

        const response =
            await fetch(
                APPLICATIONS_API_URL
            );


        if (response.status === 401) {

            window.location.href =
                "login.html";

            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            displayError(
                result.error ||
                result.message ||
                "Impossible de récupérer vos candidatures."
            );

            return;
        }


        displayApplications(
            result
        );

    } catch (error) {

        console.error(
            "Erreur lors du chargement des candidatures :",
            error
        );


        displayError(
            "Impossible de contacter le serveur."
        );
    }
}


// ========================================
// LOGOUT
// ========================================

async function logout() {

    try {

        await fetch(
            LOGOUT_API_URL,
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.error(
            "Erreur pendant la déconnexion :",
            error
        );

    } finally {

        window.location.href =
            "index.html";
    }
}


logoutButton.addEventListener(
    "click",
    logout
);


// ========================================
// START
// ========================================

loadApplications();