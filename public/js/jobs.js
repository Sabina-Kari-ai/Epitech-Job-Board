const API_URL = "http://127.0.0.1:8001/api/jobs/";

let jobs = [];

const jobsList = document.getElementById("jobs-list");
const searchInput = document.getElementById("search");
const locationInput = document.getElementById("location");
const searchButton = document.getElementById("search-button");
const jobsCount = document.getElementById("jobs-count");
const contractFilters = document.querySelectorAll(".contract-filter");
const locationFilters = document.querySelectorAll('input[name="location-filter"]');
const resetButton = document.getElementById("reset-filters");


function displayMessage(titleText, descriptionText) {
if (!jobsList) {
return;
}

jobsList.innerHTML = "";

const container = document.createElement("div");
container.className = "empty-applications";

const title = document.createElement("h2");
title.textContent = titleText;
container.appendChild(title);

if (descriptionText) {
    const paragraph = document.createElement("p");
    paragraph.textContent = descriptionText;
    container.appendChild(paragraph);
}

jobsList.appendChild(container);


}

function displayJobs(list) {
if (!jobsList) {
return;
}


jobsList.innerHTML = "";

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

list.forEach(function (job) {
    const card = document.createElement("article");
    card.className = "job-card";

    const logo = document.createElement("div");
    logo.className = "company-logo";
    logo.textContent = String(job.company || "?").charAt(0).toUpperCase();

    const content = document.createElement("div");
    content.className = "job-card-content";

    const title = document.createElement("h3");
    title.textContent = job.title || "Titre non précisé";

    const company = document.createElement("p");
    company.className = "company-name";
    company.textContent = job.company || "Entreprise non précisée";

    const contract = document.createElement("span");
    contract.className = "job-contract";
    contract.textContent = job.contract_type || "Contrat non précisé";

    const salary = document.createElement("p");
    salary.className = "job-salary";
    salary.textContent = job.salary || "Salaire non précisé";

    content.append(title, company, contract, salary);

    const top = document.createElement("div");
    top.className = "job-card-top";
    top.append(logo, content);

    const location = document.createElement("span");
    location.className = "job-card-location";
    location.textContent = job.location || "Localisation non précisée";

    const detailsButton = document.createElement("button");
    detailsButton.className = "details-button";
    detailsButton.type = "button";
    detailsButton.dataset.id = job.id;
    detailsButton.textContent = "Voir l'offre";

    detailsButton.addEventListener("click", function () {
        showJob(job.id);
    });

    const bottom = document.createElement("div");
    bottom.className = "job-card-bottom";
    bottom.append(location, detailsButton);

    card.append(top, bottom);
    jobsList.appendChild(card);
});


}

function filterJobs() {
const search = searchInput
? searchInput.value.toLowerCase().trim()
: "";


const locationSearch = locationInput
    ? locationInput.value.toLowerCase().trim()
    : "";

const selectedContracts = Array.from(contractFilters)
    .filter(function (filter) {
        return filter.checked;
    })
    .map(function (filter) {
        return filter.value;
    });

const selectedLocation = Array.from(locationFilters)
    .find(function (filter) {
        return filter.checked;
    });

const filteredJobs = jobs.filter(function (job) {
    const title = String(job.title || "").toLowerCase();
    const company = String(job.company || "").toLowerCase();
    const location = String(job.location || "").toLowerCase();
    const contract = String(job.contract_type || "");

    const matchesSearch =
        search === "" ||
        title.includes(search) ||
        company.includes(search);

    const matchesLocationSearch =
        locationSearch === "" ||
        location.includes(locationSearch);

    const matchesContract =
        selectedContracts.length === 0 ||
        selectedContracts.includes(contract);

    const matchesLocation =
        !selectedLocation ||
        selectedLocation.value === "all" ||
        location === selectedLocation.value.toLowerCase();

    return (
        matchesSearch &&
        matchesLocationSearch &&
        matchesContract &&
        matchesLocation
    );
});

displayJobs(filteredJobs);


}

function showJob(id) {
const job = jobs.find(function (item) {
return Number(item.id) === Number(id);
});


if (!job) {
    return;
}

const modal = document.getElementById("job-modal");
const modalTitle = document.getElementById("modal-title");
const modalCompany = document.getElementById("modal-company");
const modalLocation = document.getElementById("modal-location");
const modalDescription = document.getElementById("modal-description");
const applyButton = document.getElementById("apply-button");

if (!modal) {
    window.location.href = "apply.html?id=" + encodeURIComponent(job.id);
    return;
}

if (modalTitle) {
    modalTitle.textContent = job.title || "Titre non précisé";
}

if (modalCompany) {
    modalCompany.textContent = job.company || "Entreprise non précisée";
}

if (modalLocation) {
    modalLocation.textContent =
        (job.location || "Localisation non précisée") +
        " · " +
        (job.contract_type || "Contrat non précisé");
}

if (modalDescription) {
    modalDescription.textContent =
        job.description || job.short_description || "Aucune description disponible.";
}

if (applyButton) {
    applyButton.onclick = function () {
        window.location.href = "apply.html?id=" + encodeURIComponent(job.id);
    };
}

modal.classList.remove("hidden");

}

function closeModal() {
const modal = document.getElementById("job-modal");


if (modal) {
    modal.classList.add("hidden");
}


}

async function loadJobs() {
if (!jobsList) {
console.error("Élément jobs-list introuvable dans la page.");
return;
}


displayMessage("Chargement des offres...", "");

try {
    const response = await fetch(API_URL);

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

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.id = "retry-jobs";
    retryButton.textContent = "Réessayer";
    retryButton.addEventListener("click", loadJobs);

    jobsList.appendChild(retryButton);

    if (jobsCount) {
        jobsCount.textContent = "0 offre";
    }
}


}

const modalClose = document.getElementById("modal-close");
const modalOverlay = document.getElementById("modal-overlay");

if (searchInput) {
searchInput.addEventListener("input", filterJobs);
}

if (locationInput) {
locationInput.addEventListener("input", filterJobs);
}

if (searchButton) {
searchButton.addEventListener("click", filterJobs);
}

contractFilters.forEach(function (filter) {
filter.addEventListener("change", filterJobs);
});

locationFilters.forEach(function (filter) {
filter.addEventListener("change", filterJobs);
});

if (modalClose) {
modalClose.addEventListener("click", closeModal);
}

if (resetButton) {
resetButton.addEventListener("click", function () {
if (searchInput) {
searchInput.value = "";
}


    if (locationInput) {
        locationInput.value = "";
    }

    contractFilters.forEach(function (filter) {
        filter.checked = false;
    });

    locationFilters.forEach(function (filter) {
        filter.checked = filter.value === "all";
    });

    filterJobs();
});

}


if (modalOverlay) {
modalOverlay.addEventListener("click", closeModal);
}

loadJobs();
