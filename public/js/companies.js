// Liste des entreprises validées, avec un lien vers leurs offres.

const isLocalFrontend = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE = isLocalFrontend
    ? `http://${window.location.hostname}:8001`
    : window.location.origin;
const COMPANIES_API_URL = `${API_BASE}/api/companies/`;

const companiesList = document.getElementById("companies-list");

function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createCompanyLogo(company) {
    const logo = makeElement("div", "company-card-logo");
    const initial = String(company.name || "?").charAt(0).toUpperCase();

    if (!company.logo_path) {
        logo.textContent = initial;
        return logo;
    }

    const image = document.createElement("img");
    image.src = `${API_BASE}/${company.logo_path.replace(/^\/+/, "")}`;
    image.alt = `Logo de ${company.name}`;
    image.className = "company-logo-image";
    image.onerror = () => {
        logo.textContent = initial;
    };
    logo.appendChild(image);
    return logo;
}

function displayCompanies(companies) {
    companiesList.replaceChildren();

    if (companies.length === 0) {
        companiesList.appendChild(
            makeElement("p", "empty-state", "Aucune entreprise enregistrée pour le moment.")
        );
        return;
    }

    companies.forEach((company) => {
        const card = makeElement("article", "company-card");
        const count = Number(company.jobs_count) || 0;

        const content = makeElement("div", "company-card-content");
        content.append(
            makeElement("h2", "", company.name),
            makeElement("p", "company-location", company.location || ""),
            makeElement("p", "", company.description || "Aucune description."),
            makeElement(
                "span",
                "",
                count > 1 ? `${count} offres disponibles` : `${count} offre disponible`
            )
        );

        const link = makeElement("a", "btn btn-outline", "Voir les offres");
        link.href = `index.html?q=${encodeURIComponent(company.name)}#jobs`;

        card.append(createCompanyLogo(company), content, link);
        companiesList.appendChild(card);
    });
}

async function loadCompanies() {
    if (!companiesList) return;

    companiesList.textContent = "Chargement des entreprises...";

    try {
        const response = await fetch(COMPANIES_API_URL);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Erreur HTTP ${response.status}`);
        }
        if (!Array.isArray(data)) {
            throw new Error("Le format des entreprises est invalide.");
        }
        displayCompanies(data);
    } catch (error) {
        console.error("Impossible de charger les entreprises :", error);
        companiesList.textContent =
            "Impossible de charger les entreprises. Vérifiez que le serveur API est démarré.";
    }
}

loadCompanies();
