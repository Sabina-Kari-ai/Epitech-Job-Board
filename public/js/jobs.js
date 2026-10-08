const jobs = [
    {
        id: 1,
        title: "Développeur Web Full Stack",
        company: "Tech Solutions",
        location: "Paris",
        type: "CDI",
        salary: "40k - 50k",
        description: "Nous recherchons un développeur web full stack pour rejoindre notre équipe.",
        fullDescription: "Vous participerez au développement d'applications web modernes, de la conception jusqu'à la mise en production."
    },
    {
        id: 2,
        title: "Backend Developer PHP",
        company: "Digital Services",
        location: "Lyon",
        type: "CDI",
        salary: "38k - 48k",
        description: "Rejoignez notre équipe backend pour développer des applications PHP.",
        fullDescription: "Vous développerez et maintiendrez des applications backend avec PHP, MySQL et les technologies web associées."
    },
    {
        id: 3,
        title: "Stage Développeur JavaScript",
        company: "Innovation Agency",
        location: "Paris",
        type: "Stage",
        salary: "800 - 1000 €/mois",
        description: "Une opportunité de stage pour découvrir le développement JavaScript.",
        fullDescription: "Vous participerez au développement d'interfaces web et découvrirez les bonnes pratiques du développement JavaScript."
    },
    {
        id: 4,
        title: "Développeur Frontend",
        company: "Web Business",
        location: "Lille",
        type: "Alternance",
        salary: "1200 €/mois",
        description: "Nous recherchons un développeur frontend en alternance.",
        fullDescription: "Vous travaillerez sur la création et l'amélioration d'interfaces web modernes et responsives."
    },
    {
        id: 5,
        title: "Intégrateur Web",
        company: "France Numérique",
        location: "Paris",
        type: "CDD",
        salary: "32k - 38k",
        description: "Rejoignez notre équipe en tant qu'intégrateur web.",
        fullDescription: "Vous intégrerez des maquettes et développerez des interfaces web accessibles et responsives."
    },
    {
        id: 6,
        title: "Ingénieur Logiciel",
        company: "Future Systems",
        location: "Lyon",
        type: "CDI",
        salary: "45k - 55k",
        description: "Nous recherchons un ingénieur logiciel pour renforcer notre équipe.",
        fullDescription: "Vous participerez à la conception, au développement et à l'amélioration de solutions logicielles."
    }
];

const jobsList = document.getElementById("jobs-list");
const searchInput = document.getElementById("search");
const locationInput = document.getElementById("location");
const searchButton = document.getElementById("search-button");
const jobsCount = document.getElementById("jobs-count");
const contractFilters = document.querySelectorAll(".contract-filter");
const locationFilters = document.querySelectorAll('input[name="location-filter"]');

function displayJobs(list) {
    if (!jobsList) {
        return;
    }

    jobsList.innerHTML = "";

    if (jobsCount) {
        jobsCount.textContent = list.length + (list.length > 1 ? " offres" : " offre");
    }

    if (list.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-applications">
                <h2>Aucune offre trouvée</h2>
                <p>Essayez de modifier vos critères de recherche.</p>
            </div>
        `;
        return;
    }

    list.forEach(function (job) {
        const card = document.createElement("article");

        card.className = "job-card";

        card.innerHTML = `
            <div class="job-card-top">
                <div class="company-logo">
                    ${job.company.charAt(0)}
                </div>

                <div class="job-card-content">
                    <h3>${job.title}</h3>
                    <p class="company-name">${job.company}</p>
                    <span class="job-contract">${job.type}</span>
                    <p class="job-salary">${job.salary}</p>
                </div>
            </div>

            <div class="job-card-bottom">
                <span class="job-card-location">${job.location}</span>

                <button class="details-button" data-id="${job.id}">
                    Voir l'offre
                </button>
            </div>
        `;

        jobsList.appendChild(card);
    });

    document.querySelectorAll(".details-button").forEach(function (button) {
        button.addEventListener("click", function () {
            const id = Number(button.dataset.id);
            showJob(id);
        });
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
        const matchesSearch =
            search === "" ||
            job.title.toLowerCase().includes(search) ||
            job.company.toLowerCase().includes(search);

        const matchesLocationSearch =
            locationSearch === "" ||
            job.location.toLowerCase().includes(locationSearch);

        const matchesContract =
            selectedContracts.length === 0 ||
            selectedContracts.includes(job.type);

        const matchesLocation =
            !selectedLocation ||
            selectedLocation.value === "all" ||
            job.location === selectedLocation.value;

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
        return item.id === id;
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
        window.location.href = "job.html?id=" + id;
        return;
    }

    modalTitle.textContent = job.title;
    modalCompany.textContent = job.company;
    modalLocation.textContent = job.location + " · " + job.type;
    modalDescription.textContent = job.fullDescription;

    if (applyButton) {
        applyButton.onclick = function () {
            window.location.href = "apply.html?id=" + job.id;
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

if (modalOverlay) {
    modalOverlay.addEventListener("click", closeModal);
}

displayJobs(jobs);