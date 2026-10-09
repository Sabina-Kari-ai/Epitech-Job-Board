const API_URL = "http://127.0.0.1:8001/api/jobs/";
const COMPANIES_API_URL = "http://127.0.0.1:8001/api/companies/";
const APPLICATIONS_API_URL = "http://127.0.0.1:8001/api/app/";

let adminJobs = [];
let adminCompanies = [];
let adminApplications = [];

const statusLabels = {
pending: "En attente",
reviewing: "En cours d'étude",
accepted: "Acceptée",
rejected: "Refusée"
};

const jobsList = document.getElementById("admin-jobs-list");
const companiesList = document.getElementById("admin-companies-list");
const applicationsList = document.getElementById("admin-applications-list");

const tabs = document.querySelectorAll(".admin-tab");
const panels = document.querySelectorAll(".admin-panel");

const jobModal = document.getElementById("job-modal");
const companyModal = document.getElementById("company-modal");
const applicationModal = document.getElementById("application-modal");

const jobForm = document.getElementById("job-form");
const companyForm = document.getElementById("company-form");
const applicationForm = document.getElementById("application-form");

let isSavingJob = false;
let isSavingCompany = false;

/* --------------------------------------------------
OUTILS
-------------------------------------------------- */

function showTableMessage(list, message, columnCount) {
if (!list) return;

list.replaceChildren();

const row = document.createElement("tr");
const cell = document.createElement("td");

cell.colSpan = columnCount;
cell.textContent = message;

row.appendChild(cell);
list.appendChild(row);

}

function getFieldValue(id) {
const field = document.getElementById(id);
return field ? field.value.trim() : "";
}

function setFieldValue(id, value) {
const field = document.getElementById(id);


if (field) {
    field.value = value == null ? "" : String(value);
}

}

async function readApiResponse(response) {
const text = await response.text();
let data = {};

if (text) {
    try {
        data = JSON.parse(text);
    } catch (error) {
        throw new Error("Le serveur a renvoyé une réponse invalide.");
    }
}

if (!response.ok) {
    throw new Error(
        data.error || data.message || "Erreur HTTP " + response.status
    );
}

return data;

}

async function apiRequest(url, options) {
const response = await fetch(url, options);
return await readApiResponse(response);
}

function normalizeJob(job) {
return {
id: Number(job.id),
title: job.title || "",
company: job.company || "",
company_id: Number(job.company_id) || null,
location: job.location || "",
type: job.contract_type || job.type || "",
salary: job.salary || "",
shortDescription:
job.short_description || job.shortDescription || "",
description: job.description || "",
cover_letter_required:
Number(job.cover_letter_required) === 1,
company_description: job.company_description || ""
};
}

function normalizeApplication(application) {
return {
id: Number(application.id),
job_id: Number(application.job_id),
candidate_name: application.candidate_name || "",
candidate_email: application.candidate_email || "",
candidate_phone: application.candidate_phone || "",
message: application.message || "",
cover_letter: application.cover_letter || "",
status: application.status || "pending",
job_title: application.job_title || ""
};
}

/* --------------------------------------------------
CHARGEMENT DES DONNÉES
-------------------------------------------------- */

async function loadJobs() {
if (!jobsList) return;

showTableMessage(jobsList, "Chargement des offres...", 5);

try {
    const data = await apiRequest(API_URL);

    if (!Array.isArray(data)) {
        throw new Error("Le format des offres est invalide.");
    }

    adminJobs = data.map(normalizeJob);

    displayJobs();
} catch (error) {
    console.error("Erreur de chargement des offres :", error);

    showTableMessage(
        jobsList,
        "Impossible de charger les offres : " + error.message,
        5
    );
}

}

async function loadCompanies() {
if (!companiesList) return;

showTableMessage(companiesList, "Chargement des entreprises...", 4);

try {
    const data = await apiRequest(COMPANIES_API_URL);

    if (!Array.isArray(data)) {
        throw new Error("Le format des entreprises est invalide.");
    }

    adminCompanies = data.map(function (company) {
        return {
            id: Number(company.id),
            name: company.name || "",
            location: company.location || "",
            description: company.description || ""
        };
    });

    displayCompanies();
    updateCompanyOptions();
} catch (error) {
    console.error("Erreur de chargement des entreprises :", error);
    showTableMessage(
        companiesList,
        "Impossible de charger les entreprises : " + error.message,
        4
    );
}

}

async function loadApplications() {
if (!applicationsList) return;

showTableMessage(
    applicationsList,
    "Chargement des candidatures...",
    5
);

try {
    const data = await apiRequest(APPLICATIONS_API_URL);

    if (!Array.isArray(data)) {
        throw new Error("Le format des candidatures est invalide.");
    }

    adminApplications = data.map(normalizeApplication);
    displayApplications();
} catch (error) {
    console.error("Erreur de chargement des candidatures :", error);

    showTableMessage(
        applicationsList,
        "Impossible de charger les candidatures : " + error.message,
        5
    );
}

}

/* --------------------------------------------------
AFFICHAGE DES OFFRES
-------------------------------------------------- */

function displayJobs() {
if (!jobsList) return;

jobsList.replaceChildren();

if (adminJobs.length === 0) {
    showTableMessage(jobsList, "Aucune offre disponible.", 5);
    updateCompanyOptions();
    return;
}

adminJobs.forEach(function (job) {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.textContent = job.title;

    const companyCell = document.createElement("td");
    companyCell.textContent = job.company;

    const locationCell = document.createElement("td");
    locationCell.textContent = job.location;

    const contractCell = document.createElement("td");
    contractCell.textContent = job.type;

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "admin-actions";

    actions.append(
        createActionButton("Modifier", "job", job.id, "edit"),
        createActionButton("Supprimer", "job", job.id, "delete")
    );

    actionsCell.appendChild(actions);

    row.append(
        titleCell,
        companyCell,
        locationCell,
        contractCell,
        actionsCell
    );

    jobsList.appendChild(row);
});

updateCompanyOptions();

}

/* --------------------------------------------------
AFFICHAGE DES ENTREPRISES
-------------------------------------------------- */

function displayCompanies() {
if (!companiesList) return;

companiesList.replaceChildren();

if (adminCompanies.length === 0) {
    showTableMessage(
        companiesList,
        "Aucune entreprise trouvée dans les offres.",
        4
    );
    return;
}

adminCompanies.forEach(function (company) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = company.name;

    const locationCell = document.createElement("td");
    locationCell.textContent = company.location || "Non précisé";

    const countCell = document.createElement("td");
    const count = adminJobs.filter(function (job) {
        return job.company_id === company.id ||
            job.company === company.name;
    }).length;

    countCell.textContent = String(count);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "admin-actions";

    actions.append(
        createActionButton(
            "Modifier",
            "company",
            company.id,
            "edit"
        ),
        createActionButton(
            "Supprimer",
            "company",
            company.id,
            "delete"
        )
    );

    actionsCell.appendChild(actions);
    row.append(nameCell, locationCell, countCell, actionsCell);

    companiesList.appendChild(row);
});

}

/* --------------------------------------------------
AFFICHAGE DES CANDIDATURES
-------------------------------------------------- */

function displayApplications() {
if (!applicationsList) return;

applicationsList.replaceChildren();

if (adminApplications.length === 0) {
    showTableMessage(
        applicationsList,
        "Aucune candidature enregistrée.",
        5
    );
    return;
}

adminApplications.forEach(function (application) {
    const row = document.createElement("tr");

    const candidateCell = document.createElement("td");
    candidateCell.textContent = application.candidate_name;

    const jobCell = document.createElement("td");
    jobCell.textContent =
        application.job_title || "Offre #" + application.job_id;

    const emailCell = document.createElement("td");
    emailCell.textContent = application.candidate_email;

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");

    statusBadge.className = "status " + application.status;
    statusBadge.textContent =
        statusLabels[application.status] || application.status;

    statusCell.appendChild(statusBadge);

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "admin-actions";

    actions.append(
        createActionButton(
            "Modifier",
            "application",
            application.id,
            "edit"
        ),
        createActionButton(
            "Supprimer",
            "application",
            application.id,
            "delete"
        )
    );

    actionsCell.appendChild(actions);

    row.append(
        candidateCell,
        jobCell,
        emailCell,
        statusCell,
        actionsCell
    );

    applicationsList.appendChild(row);
});

}

/* --------------------------------------------------
BOUTONS D'ACTION
-------------------------------------------------- */

function createActionButton(label, type, id, action) {
const button = document.createElement("button");

button.type = "button";
button.className = "admin-action " + action;
button.dataset.type = type;
button.dataset.id = String(id);
button.textContent = label;

return button;

}

function updateCompanyOptions() {
const companySelect = document.getElementById("job-company");

if (!companySelect) return;

const previousValue = companySelect.value;
companySelect.replaceChildren();

const placeholder = document.createElement("option");
placeholder.value = "";
placeholder.textContent = adminCompanies.length
    ? "Sélectionner une entreprise"
    : "Ajoutez d'abord une entreprise";
placeholder.disabled = true;
placeholder.selected = true;
companySelect.appendChild(placeholder);

adminCompanies.forEach(function (company) {
    const option = document.createElement("option");

    option.value = company.name;
    option.textContent = company.name;

    companySelect.appendChild(option);
});

if (previousValue) {
    companySelect.value = previousValue;
}

}

/* --------------------------------------------------
ONGLETS
-------------------------------------------------- */

function changeTab(tabId) {
tabs.forEach(function (tab) {
tab.classList.toggle("active", tab.dataset.tab === tabId);
});

panels.forEach(function (panel) {
    panel.classList.toggle("active", panel.id === tabId);
});

if (tabId === "applications-panel") {
    loadApplications();
}

if (tabId === "jobs-panel") {
    loadJobs();
}

if (tabId === "companies-panel") {
    loadCompanies();
}

}

/* --------------------------------------------------
MODALE DES OFFRES
-------------------------------------------------- */

function openJobModal(job) {
updateCompanyOptions();

setFieldValue("job-id", job ? job.id : "");
setFieldValue("job-title", job ? job.title : "");
setFieldValue("job-company", job ? job.company : "");
setFieldValue("job-location", job ? job.location : "");
setFieldValue("job-type", job ? job.type : "CDI");
setFieldValue("job-salary", job ? job.salary : "");
setFieldValue(
    "job-short-description",
    job ? job.shortDescription : ""
);
setFieldValue("job-description", job ? job.description : "");

const coverLetterField =
    document.getElementById("job-cover-letter-required");

if (coverLetterField) {
    coverLetterField.checked =
        job ? job.cover_letter_required : false;
}

const title = document.getElementById("job-modal-title");

if (title) {
    title.textContent = job ? "Modifier une offre" : "Ajouter une offre";
}

if (jobModal) {
    jobModal.classList.add("active");
}

}

function closeJobModal() {
if (jobModal) {
jobModal.classList.remove("active");
}

if (jobForm) {
    jobForm.reset();
}

}

/* --------------------------------------------------
MODALE DES ENTREPRISES
-------------------------------------------------- */

function openCompanyModal(company) {
setFieldValue("company-id", company ? company.id : "");
setFieldValue("company-name", company ? company.name : "");
setFieldValue("company-location", company ? company.location : "");
setFieldValue(
"company-description",
company ? company.description : ""
);

const title = document.getElementById("company-modal-title");

if (title) {
    title.textContent = company
        ? "Modifier une entreprise"
        : "Ajouter une entreprise";
}

if (companyModal) {
    companyModal.classList.add("active");
}

}

function closeCompanyModal() {
if (companyModal) {
companyModal.classList.remove("active");
}

if (companyForm) {
    companyForm.reset();
}

}

/* --------------------------------------------------
MODALE DES CANDIDATURES
-------------------------------------------------- */

function openApplicationModal(application) {
if (!application) return;

setFieldValue("application-id", application.id);

const candidate = document.getElementById("application-candidate");
const job = document.getElementById("application-job");
const email = document.getElementById("application-email");

if (candidate) {
    candidate.textContent = application.candidate_name;
}

if (job) {
    job.textContent =
        application.job_title || "Offre #" + application.job_id;
}

if (email) {
    email.textContent = application.candidate_email;
}

setFieldValue("application-status", application.status);

if (applicationModal) {
    applicationModal.classList.add("active");
}

}

function closeApplicationModal() {
if (applicationModal) {
applicationModal.classList.remove("active");
}

if (applicationForm) {
    applicationForm.reset();
}

}

/* --------------------------------------------------
ENREGISTREMENT D'UNE OFFRE
-------------------------------------------------- */

async function saveJob(event) {
event.preventDefault();

if (isSavingJob) return;

const id = getFieldValue("job-id");
const title = getFieldValue("job-title");
const company = getFieldValue("job-company");
const location = getFieldValue("job-location");
const type = getFieldValue("job-type");
const salary = getFieldValue("job-salary");
const shortDescription = getFieldValue("job-short-description");
const description = getFieldValue("job-description");

const coverLetterField =
    document.getElementById("job-cover-letter-required");

const coverLetterRequired = coverLetterField
    ? coverLetterField.checked
    : false;

if (
    !title ||
    !company ||
    !location ||
    !type ||
    !shortDescription ||
    !description
) {
    alert("Veuillez remplir tous les champs obligatoires.");
    return;
}

const jobData = {
    title: title,
    company: company,
    location: location,
    type: type,
    salary: salary,
    shortDescription: shortDescription,
    description: description,
    cover_letter_required: coverLetterRequired
};

const isEditing = id !== "";

if (isEditing) {
    jobData.id = Number(id);
}

const submitButton = jobForm
    ? jobForm.querySelector('[type="submit"]')
    : null;

isSavingJob = true;

if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Enregistrement...";
}

try {
    const result = await apiRequest(API_URL, {
        method: isEditing ? "PUT" : "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jobData)
    });

    alert(
        result.message ||
        (isEditing
            ? "Offre modifiée avec succès."
            : "Offre créée avec succès.")
    );

    closeJobModal();
    await loadJobs();
} catch (error) {
    console.error("Erreur d'enregistrement de l'offre :", error);
    alert("Impossible d'enregistrer l'offre : " + error.message);
} finally {
    isSavingJob = false;

    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enregistrer";
    }
}

}

async function saveCompany(event) {
event.preventDefault();

if (isSavingCompany) return;

const id = getFieldValue("company-id");
const companyData = {
    name: getFieldValue("company-name"),
    location: getFieldValue("company-location"),
    description: getFieldValue("company-description")
};
const isEditing = id !== "";

if (isEditing) {
    companyData.id = Number(id);
}

const submitButton = companyForm
    ? companyForm.querySelector('[type="submit"]')
    : null;

isSavingCompany = true;

if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Enregistrement...";
}

try {
    const result = await apiRequest(COMPANIES_API_URL, {
        method: isEditing ? "PUT" : "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(companyData)
    });

    alert(
        result.message ||
        (isEditing
            ? "Entreprise modifiée avec succès."
            : "Entreprise créée avec succès.")
    );

    closeCompanyModal();
    await loadCompanies();
    updateCompanyOptions();
} catch (error) {
    console.error("Erreur d'enregistrement de l'entreprise :", error);
    alert("Impossible d'enregistrer l'entreprise : " + error.message);
} finally {
    isSavingCompany = false;

    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enregistrer";
    }
}

}

/* --------------------------------------------------
SUPPRESSION D'UNE OFFRE
-------------------------------------------------- */

async function deleteJob(id) {
const job = adminJobs.find(function (item) {
return item.id === id;
});

if (!job) return;

const confirmed = window.confirm(
    'Voulez-vous vraiment supprimer l’offre "' +
    job.title +
    '" ?'
);

if (!confirmed) return;

try {
    const result = await apiRequest(
        API_URL + "?id=" + encodeURIComponent(id),
        {
            method: "DELETE"
        }
    );

    alert(result.message || "Offre supprimée avec succès.");
    await loadJobs();
} catch (error) {
    console.error("Erreur de suppression de l'offre :", error);

    alert(
        "Impossible de supprimer l'offre : " + error.message
    );
}

}

/* --------------------------------------------------
ÉVÉNEMENTS DES ONGLETS ET DES MODALES
-------------------------------------------------- */

tabs.forEach(function (tab) {
tab.addEventListener("click", function () {
changeTab(tab.dataset.tab);
});
});

const addJobButton = document.getElementById("add-job-button");
const addCompanyButton = document.getElementById("add-company-button");

if (addJobButton) {
addJobButton.addEventListener("click", function () {
openJobModal();
});
}

if (addCompanyButton) {
addCompanyButton.addEventListener("click", function () {
openCompanyModal();
});
}

const jobModalClose = document.getElementById("job-modal-close");
const jobCancel = document.getElementById("job-cancel");
const companyModalClose = document.getElementById("company-modal-close");
const companyCancel = document.getElementById("company-cancel");
const applicationModalClose =
document.getElementById("application-modal-close");
const applicationCancel = document.getElementById("application-cancel");

if (jobModalClose) {
jobModalClose.addEventListener("click", closeJobModal);
}

if (jobCancel) {
jobCancel.addEventListener("click", closeJobModal);
}

if (companyModalClose) {
companyModalClose.addEventListener("click", closeCompanyModal);
}

if (companyCancel) {
companyCancel.addEventListener("click", closeCompanyModal);
}

if (applicationModalClose) {
applicationModalClose.addEventListener("click", closeApplicationModal);
}

if (applicationCancel) {
applicationCancel.addEventListener("click", closeApplicationModal);
}

/* --------------------------------------------------
GESTION DES CLICS SUR LES ACTIONS
-------------------------------------------------- */

document.addEventListener("click", async function (event) {
const target = event.target;

if (!(target instanceof Element)) return;

const action = target.closest(".admin-action");

if (!action) return;

const type = action.dataset.type;
const id = Number(action.dataset.id);

if (type === "job") {
    const job = adminJobs.find(function (item) {
        return item.id === id;
    });

    if (!job) return;

    if (action.classList.contains("edit")) {
        openJobModal(job);
        return;
    }

    if (action.classList.contains("delete")) {
        await deleteJob(id);
        return;
    }
}

if (type === "company") {
    const company = adminCompanies.find(function (item) {
        return item.id === id;
    });

    if (!company) return;

    if (action.classList.contains("edit")) {
        openCompanyModal(company);
        return;
    }

    if (action.classList.contains("delete")) {
        alert(
            "La gestion des entreprises nécessite une API dédiée. " +
            "Aucune suppression n'a été effectuée."
        );
        return;
    }
}

if (type === "application") {
    const application = adminApplications.find(function (item) {
        return item.id === id;
    });

    if (!application) return;

    if (action.classList.contains("edit")) {
        openApplicationModal(application);
        return;
    }

    if (action.classList.contains("delete")) {
        alert(
            "La suppression des candidatures nécessite une route " +
            "DELETE dans l'API des candidatures."
        );
    }
}

});

/* --------------------------------------------------
SOUMISSION DES FORMULAIRES
-------------------------------------------------- */

if (jobForm) {
jobForm.addEventListener("submit", saveJob);
}

if (companyForm) {
companyForm.addEventListener("submit", saveCompany);
}

if (applicationForm) {
applicationForm.addEventListener("submit", function (event) {
event.preventDefault();


    alert(
        "La modification des candidatures nécessite une route PUT " +
        "dans l'API des candidatures."
    );
});


}

/* --------------------------------------------------
INITIALISATION
-------------------------------------------------- */

loadJobs();
loadCompanies();
loadApplications();