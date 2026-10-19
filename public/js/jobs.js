// Page d'accueil : charge les offres depuis l'API, gère la recherche et les
// filtres côté navigateur, et affiche le détail d'une offre dans sa carte.

const API_BASE = window.location.origin;
const API_URL = `${API_BASE}/api/jobs/`;

let jobs = [];

const jobsList = document.getElementById("jobs-list");
const searchInput = document.getElementById("search");
const competenceInput = document.getElementById('competence');
const locationInput = document.getElementById("location");
const searchButton = document.getElementById("search-button");
const jobsCount = document.getElementById("jobs-count");
const contractFilters = document.querySelectorAll(".contract-filter");
const locationFilters = document.querySelectorAll('input[name="location-filter"]');
const resetButton = document.getElementById("reset-filters");

function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function displayMessage(titleText, descriptionText) {
    if (!jobsList) return;

    jobsList.replaceChildren();

    const container = makeElement("div", "empty-applications");
    container.appendChild(makeElement("h2", "", titleText));

    if (descriptionText) {
        container.appendChild(makeElement("p", "", descriptionText));
    }

    jobsList.appendChild(container);
}

function createLogo(job) {
    const logo = makeElement("div", "company-logo");
    const initial = String(job.company || "?").charAt(0).toUpperCase();

    if (!job.logo_path) {
        logo.textContent = initial;
        return logo;
    }

    const image = document.createElement("img");
    image.src = job.logo_path.startsWith("http")
        ? job.logo_path
        : `${API_BASE}/${job.logo_path.replace(/^\/+/, "")}`;
    image.alt = `Logo de ${job.company || "l'entreprise"}`;
    image.className = "company-logo-image";
    image.onerror = () => {
        logo.textContent = initial;
    };
    logo.appendChild(image);
    return logo;
}

function formatPublished(value) {
    if (!value) return "";
    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return "";
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days <= 0) return "Publiée aujourd'hui";
    if (days === 1) return "Publiée hier";
    if (days < 30) return `Publiée il y a ${days} jours`;
    return `Publiée le ${date.toLocaleDateString("fr-FR")}`;
}

function addFact(list, label, value) {
    if (!value) return;
    const item = makeElement("li");
    item.append(makeElement("span", "", label), makeElement("strong", "", value));
    list.append(item);
}

// Détail complet chargé depuis l'API, affiché dans la carte (sans popup).
async function toggleDetails(job, panel, button) {
    const card = panel.closest(".job-card");

    if (!panel.hidden) {
        panel.hidden = true;
        card.classList.remove("is-open");
        button.textContent = "En savoir plus";
        button.setAttribute("aria-expanded", "false");
        return;
    }

    panel.hidden = false;
    card.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    button.textContent = "Masquer";

    if (panel.dataset.loaded === "true") return;

    panel.replaceChildren(makeElement("p", "job-details-loading", "Chargement des détails..."));
    button.disabled = true;

    try {
        const response = await fetch(`${API_URL}?id=${encodeURIComponent(job.id)}`);
        const detail = await response.json();
        if (!response.ok) {
            throw new Error(detail.error || `Erreur HTTP ${response.status}`);
        }

        const main = makeElement("div", "job-details-main");
        main.append(
            makeElement("h4", "", "Le poste"),
            makeElement("p", "job-details-text", detail.description || "Aucune description disponible.")
        );
        if (detail.company_description) {
            main.append(
                makeElement("h4", "", `À propos de ${detail.company}`),
                makeElement("p", "job-details-text", detail.company_description)
            );
        }

        for(const [label,value] of Object.entries({'Compétences':detail.skills,'Missions':detail.missions,'Profil recherché':detail.profile,'Avantages':detail.benefits})) {if(value)main.append(makeElement('h4','',label),makeElement('p','job-details-text',value));}
        const facts = makeElement("ul", "job-details-facts");
        addFact(facts, "Salaire", detail.salary || "Non précisé");
        addFact(facts, "Contrat", detail.contract_type);
        addFact(facts, "Lieu", detail.location);
        addFact(facts, "Temps de travail", detail.working_time);
        addFact(facts, "Date limite", detail.application_deadline);
        addFact(
            facts,
            "Lettre de motivation",
            Number(detail.cover_letter_required) === 1 ? "Obligatoire" : "Facultative"
        );

        const aside = makeElement("aside", "job-details-aside");
        aside.append(makeElement("h4", "", "En bref"), facts);

        panel.replaceChildren(main, aside);
        panel.dataset.loaded = "true";
    } catch (error) {
        console.error("Impossible de charger le détail de l'offre :", error);
        panel.replaceChildren(
            makeElement("p", "form-message error", "Impossible de charger le détail : " + error.message)
        );
    } finally {
        button.disabled = false;
    }
}

function createJobCard(job) {
    const card = makeElement("article", "job-card");

    const heading = makeElement("div", "job-card-heading");
    heading.append(
        makeElement("h3", "", job.title || "Titre non précisé"),
        makeElement("span", "job-contract", job.contract_type || "Contrat")
    );

    const meta = makeElement("p", "job-card-meta");
    [
        ["company-name", job.company],
        ["job-meta-location", job.location],
        ["job-meta-salary", job.salary]
    ].forEach(([className, value]) => {
        if (value) meta.append(makeElement("span", className, value));
    });

    const content = makeElement("div", "job-card-content");
    content.append(heading, meta, makeElement("p", "job-description", job.short_description || ""));

    const top = makeElement("div", "job-card-top");
    top.append(createLogo(job), content);

    const panelId = `job-details-${job.id}`;
    const panel = makeElement("div", "job-details-panel");
    panel.id = panelId;
    panel.hidden = true;

    const detailsButton = makeElement("button", "details-button", "En savoir plus");
    detailsButton.type = "button";
    detailsButton.setAttribute("aria-expanded", "false");
    detailsButton.setAttribute("aria-controls", panelId);
    detailsButton.addEventListener("click", () => toggleDetails(job, panel, detailsButton));

    const applyLink = makeElement("a", "btn btn-primary", "Postuler");
    applyLink.href = `apply.html?id=${encodeURIComponent(job.id)}`;

    const actions = makeElement("div", "job-card-actions");
    actions.append(detailsButton, applyLink);

    const bottom = makeElement("div", "job-card-bottom");
    bottom.append(makeElement("span", "job-card-date", formatPublished(job.created_at)), actions);

    card.append(top, panel, bottom);
    return card;
}

function displayJobs(list) {
    if (!jobsList) return;

    jobsList.replaceChildren();

    if (jobsCount) {
        jobsCount.textContent = list.length + (list.length > 1 ? " offres" : " offre");
    }

    if (list.length === 0) {
        displayMessage(
            "Aucune offre trouvée",
            "Essayez de modifier vos critères de recherche."
        );
        return;
    }

    list.forEach((job) => jobsList.appendChild(createJobCard(job)));
}

// Les filtres s'appliquent sur la liste déjà chargée : pas d'appel réseau à chaque frappe.
function filterJobs() {
    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const locationSearch = locationInput ? locationInput.value.toLowerCase().trim() : "";

    const selectedContracts = Array.from(contractFilters)
        .filter((filter) => filter.checked)
        .map((filter) => filter.value);

    const selectedLocation = Array.from(locationFilters).find((filter) => filter.checked);

    const filteredJobs = jobs.filter((job) => {
        const title = String(job.title || "").toLowerCase();
        const company = String(job.company || "").toLowerCase();
        const shortDescription = String(job.short_description || "").toLowerCase();
        const location = String(job.location || "").toLowerCase();
        const contract = String(job.contract_type || "");

        const skills=String(job.skills || '').toLowerCase();
        const competence=competenceInput?.value.toLowerCase().trim() || '';
        const matchesCompetence=competence==='' || [skills,String(job.description||'').toLowerCase(),shortDescription].some(text=>text.includes(competence));
        const matchesSearch =
            search === "" ||
            title.includes(search) ||
            company.includes(search) ||
            shortDescription.includes(search) || skills.includes(search);

        const matchesLocationSearch =
            locationSearch === "" || location.includes(locationSearch);

        const matchesContract =
            selectedContracts.length === 0 || selectedContracts.includes(contract);

        const matchesLocation =
            !selectedLocation ||
            selectedLocation.value === "all" ||
            location === selectedLocation.value.toLowerCase();

        return matchesCompetence && matchesSearch && matchesLocationSearch && matchesContract && matchesLocation;
    });

    displayJobs(filteredJobs);
}

async function loadJobs() {
    if (!jobsList) {
        console.error("Élément jobs-list introuvable dans la page.");
        return;
    }

    displayMessage("Chargement des offres...", "");

    try {
        const response = await fetch(API_URL, { signal: AbortSignal.timeout(10000) });

        if (!response.ok) {
            throw new Error("Erreur HTTP " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Le format des données reçues est invalide.");
        }

        jobs = data;
        filterJobs();
    } catch (error) {
        console.error("Impossible de charger les offres :", error);

        displayMessage(
            "Impossible de charger les offres",
            "Vérifiez que le serveur PHP est démarré et que la base de données est accessible."
        );

        const retryButton = makeElement("button", "btn btn-outline", "Réessayer");
        retryButton.type = "button";
        retryButton.id = "retry-jobs";
        retryButton.addEventListener("click", loadJobs);
        jobsList.appendChild(retryButton);

        if (jobsCount) {
            jobsCount.textContent = "0 offre";
        }
    }
}

// Pré-remplit la recherche depuis l'URL (ex. lien « Voir les offres » d'une entreprise).
const initialQuery = new URLSearchParams(window.location.search).get("q");
if (initialQuery && searchInput) {
    searchInput.value = initialQuery;
}

if (searchInput) {
    searchInput.addEventListener("input", filterJobs);
    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") filterJobs();
    });
}

if (competenceInput) competenceInput.addEventListener('input',filterJobs);
if (locationInput) {
    locationInput.addEventListener("input", filterJobs);
}

if (searchButton) {
    searchButton.addEventListener("click", () => {
        filterJobs();
        document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
    });
}

contractFilters.forEach((filter) => filter.addEventListener("change", filterJobs));
locationFilters.forEach((filter) => filter.addEventListener("change", filterJobs));

if (resetButton) {
    resetButton.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (locationInput) locationInput.value = "";
        if (competenceInput) competenceInput.value = "";
        contractFilters.forEach((filter) => {
            filter.checked = false;
        });
        locationFilters.forEach((filter) => {
            filter.checked = filter.value === "all";
        });
        filterJobs();
    });
}

loadJobs();
