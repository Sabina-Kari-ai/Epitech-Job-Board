// Page de détail d'une offre (job.html?id=…), utilisée notamment depuis les alertes.

const API_BASE = window.location.origin;
const API_URL = `${API_BASE}/api/jobs/`;

const jobDetail = document.getElementById("jobDetail");
const jobId = Number(new URLSearchParams(window.location.search).get("id"));

function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function showNotFound(message) {
    const container = makeElement("div", "job-not-found");
    const backLink = makeElement("a", "details-button", "Retour aux offres");
    backLink.href = "index.html";
    container.append(
        makeElement("h1", "", "Offre introuvable"),
        makeElement("p", "", message),
        backLink
    );
    jobDetail.replaceChildren(container);
}

function renderJob(job) {
    const header = makeElement("div", "job-detail-header");
    header.append(
        makeElement("span", "job-type", job.contract_type || ""),
        makeElement("h1", "", job.title || "Offre"),
        makeElement("p", "job-company", job.company || ""),
        makeElement(
            "p",
            "job-location",
            [job.location, job.salary || "Salaire non précisé"].filter(Boolean).join(" · ")
        )
    );

    const description = makeElement("section");
    description.append(
        makeElement("h2", "", "Description du poste"),
        makeElement("p", "", job.description || job.short_description || "")
    );

    const content = makeElement("div", "job-detail-content");
    content.append(description);

    if (job.company_description) {
        const company = makeElement("section");
        company.append(
            makeElement("h2", "", "À propos de l'entreprise"),
            makeElement("p", "", job.company_description)
        );
        content.append(company);
    }

    const applyText = makeElement("div");
    applyText.append(
        makeElement("h2", "", "Cette offre vous intéresse ?"),
        makeElement("p", "", "Envoyez votre candidature directement depuis JobBoard.")
    );

    const applyLink = makeElement("a", "details-button", "Postuler à cette offre");
    applyLink.href = `apply.html?id=${encodeURIComponent(job.id)}`;

    for (const [title, value] of Object.entries({ 'Compétences':job.skills, 'Missions':job.missions, 'Profil recherché':job.profile, 'Avantages':job.benefits, 'Temps de travail':job.working_time, 'Date limite':job.application_deadline })) {
        if (!value) continue; const section=makeElement('section','job-requirements');section.append(makeElement('h2','',title),makeElement('p','',value));content.appendChild(section);
    }
    const apply = makeElement("div", "job-apply");
    apply.append(applyText, applyLink);

    jobDetail.replaceChildren(header, content, apply);
    document.title = `${job.title} - JobBoard`;
}

async function loadJob() {
    if (!jobDetail) return;

    if (!Number.isInteger(jobId) || jobId < 1) {
        showNotFound("Aucune offre n'a été sélectionnée.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}?id=${encodeURIComponent(jobId)}`);
        const job = await response.json();

        if (response.status === 404) {
            showNotFound("Cette offre n'existe pas ou n'est plus disponible.");
            return;
        }
        if (!response.ok) {
            throw new Error(job.error || `Erreur HTTP ${response.status}`);
        }

        renderJob(job);
    } catch (error) {
        console.error("Impossible de charger l'offre :", error);
        showNotFound("Impossible de charger l'offre. Vérifiez que le serveur API est démarré.");
    }
}

loadJob();
