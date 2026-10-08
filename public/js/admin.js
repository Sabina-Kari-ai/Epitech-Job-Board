const adminJobs = [
{
id: 1,
title: "Développeur Web Full Stack",
company: "Tech Solutions",
location: "Paris",
type: "CDI",
salary: "40k - 50k",
shortDescription: "Développement d'applications web modernes.",
description: "Nous recherchons un développeur Full Stack pour rejoindre notre équipe."
},
{
id: 2,
title: "Backend Developer PHP",
company: "Digital Services",
location: "Lyon",
type: "CDI",
salary: "38k - 48k",
shortDescription: "Développement et maintenance d'API PHP.",
description: "Vous travaillerez sur nos applications backend et nos API REST."
},
{
id: 3,
title: "Stage Développeur JavaScript",
company: "Innovation Agency",
location: "Paris",
type: "Stage",
salary: "800 - 1000 €/mois",
shortDescription: "Participation au développement de projets web.",
description: "Stage destiné à un étudiant souhaitant découvrir le développement web."
}
];

const adminCompanies = [
{
id: 1,
name: "Tech Solutions",
location: "Paris",
description: "Entreprise spécialisée dans le développement de solutions numériques."
},
{
id: 2,
name: "Digital Services",
location: "Lyon",
description: "Entreprise spécialisée dans les services numériques et les API."
},
{
id: 3,
name: "Innovation Agency",
location: "Paris",
description: "Agence spécialisée dans les projets web et les nouvelles technologies."
}
];

const adminApplications = [
{
id: 1,
candidate: "Jean Dupont",
job: "Développeur Web Full Stack",
email: "jean.dupont@example.com",
status: "pending"
},
{
id: 2,
candidate: "Marie Martin",
job: "Backend Developer PHP",
email: "marie.martin@example.com",
status: "reviewing"
},
{
id: 3,
candidate: "Lucas Bernard",
job: "Stage Développeur JavaScript",
email: "lucas.bernard@example.com",
status: "accepted"
}
];

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

function displayJobs() {
jobsList.innerHTML = "";

adminJobs.forEach(function (job) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${job.title}</td>
        <td>${job.company}</td>
        <td>${job.location}</td>
        <td>${job.type}</td>
        <td>
            <div class="admin-actions">
                <button class="admin-action edit" data-type="job" data-id="${job.id}">
                    Modifier
                </button>
                <button class="admin-action delete" data-type="job" data-id="${job.id}">
                    Supprimer
                </button>
            </div>
        </td>
    `;

    jobsList.appendChild(row);
});

updateCompanyOptions();

}

function displayCompanies() {
companiesList.innerHTML = "";

adminCompanies.forEach(function (company) {
    const jobsCount = adminJobs.filter(function (job) {
        return job.company === company.name;
    }).length;

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${company.name}</td>
        <td>${company.location}</td>
        <td>${jobsCount}</td>
        <td>
            <div class="admin-actions">
                <button class="admin-action edit" data-type="company" data-id="${company.id}">
                    Modifier
                </button>
                <button class="admin-action delete" data-type="company" data-id="${company.id}">
                    Supprimer
                </button>
            </div>
        </td>
    `;

    companiesList.appendChild(row);
});

}

function displayApplications() {
applicationsList.innerHTML = "";

adminApplications.forEach(function (application) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${application.candidate}</td>
        <td>${application.job}</td>
        <td>${application.email}</td>
        <td>
            <span class="status ${application.status}">
                ${statusLabels[application.status]}
            </span>
        </td>
        <td>
            <div class="admin-actions">
                <button class="admin-action edit" data-type="application" data-id="${application.id}">
                    Modifier
                </button>
                <button class="admin-action delete" data-type="application" data-id="${application.id}">
                    Supprimer
                </button>
            </div>
        </td>
    `;

    applicationsList.appendChild(row);
});

}

function updateCompanyOptions() {
const companySelect = document.getElementById("job-company");

companySelect.innerHTML = "";

adminCompanies.forEach(function (company) {
    const option = document.createElement("option");

    option.value = company.name;
    option.textContent = company.name;

    companySelect.appendChild(option);
});

}

function changeTab(tabId) {
tabs.forEach(function (tab) {
tab.classList.toggle("active", tab.dataset.tab === tabId);
});

panels.forEach(function (panel) {
    panel.classList.toggle("active", panel.id === tabId);
});

}

function openJobModal(job) {
updateCompanyOptions();

document.getElementById("job-id").value = job ? job.id : "";
document.getElementById("job-title").value = job ? job.title : "";
document.getElementById("job-company").value = job ? job.company : "";
document.getElementById("job-location").value = job ? job.location : "";
document.getElementById("job-type").value = job ? job.type : "CDI";
document.getElementById("job-salary").value = job ? job.salary : "";
document.getElementById("job-short-description").value = job ? job.shortDescription : "";
document.getElementById("job-description").value = job ? job.description : "";

document.getElementById("job-modal-title").textContent =
    job ? "Modifier une offre" : "Ajouter une offre";

jobModal.classList.add("active");

}

function closeJobModal() {
jobModal.classList.remove("active");
jobForm.reset();
}

function openCompanyModal(company) {
document.getElementById("company-id").value = company ? company.id : "";
document.getElementById("company-name").value = company ? company.name : "";
document.getElementById("company-location").value = company ? company.location : "";
document.getElementById("company-description").value = company ? company.description : "";

document.getElementById("company-modal-title").textContent =
    company ? "Modifier une entreprise" : "Ajouter une entreprise";

companyModal.classList.add("active");

}

function closeCompanyModal() {
companyModal.classList.remove("active");
companyForm.reset();
}

function openApplicationModal(application) {
document.getElementById("application-id").value = application.id;
document.getElementById("application-candidate").textContent = application.candidate;
document.getElementById("application-job").textContent = application.job;
document.getElementById("application-email").textContent = application.email;
document.getElementById("application-status").value = application.status;

applicationModal.classList.add("active");

}

function closeApplicationModal() {
applicationModal.classList.remove("active");
applicationForm.reset();
}

tabs.forEach(function (tab) {
tab.addEventListener("click", function () {
changeTab(tab.dataset.tab);
});
});

document.getElementById("add-job-button").addEventListener("click", function () {
openJobModal();
});

document.getElementById("add-company-button").addEventListener("click", function () {
openCompanyModal();
});

document.getElementById("job-modal-close").addEventListener("click", closeJobModal);
document.getElementById("job-cancel").addEventListener("click", closeJobModal);

document.getElementById("company-modal-close").addEventListener("click", closeCompanyModal);
document.getElementById("company-cancel").addEventListener("click", closeCompanyModal);

document.getElementById("application-modal-close").addEventListener("click", closeApplicationModal);
document.getElementById("application-cancel").addEventListener("click", closeApplicationModal);

document.addEventListener("click", function (event) {
const action = event.target.closest(".admin-action");

if (!action) {
    return;
}

const type = action.dataset.type;
const id = Number(action.dataset.id);

if (type === "job") {
    const job = adminJobs.find(function (item) {
        return item.id === id;
    });

    if (!job) {
        return;
    }

    if (action.classList.contains("edit")) {
        openJobModal(job);
    }

    if (action.classList.contains("delete")) {
        const confirmed = confirm("Voulez-vous vraiment supprimer cette offre ?");

        if (!confirmed) {
            return;
        }

        const index = adminJobs.findIndex(function (item) {
            return item.id === id;
        });

        adminJobs.splice(index, 1);

        displayJobs();
        displayCompanies();
    }
}

if (type === "company") {
    const company = adminCompanies.find(function (item) {
        return item.id === id;
    });

    if (!company) {
        return;
    }

    if (action.classList.contains("edit")) {
        openCompanyModal(company);
    }

    if (action.classList.contains("delete")) {
        const hasJobs = adminJobs.some(function (job) {
            return job.company === company.name;
        });

        if (hasJobs) {
            alert("Cette entreprise possède encore des offres.");
            return;
        }

        const confirmed = confirm("Voulez-vous vraiment supprimer cette entreprise ?");

        if (!confirmed) {
            return;
        }

        const index = adminCompanies.findIndex(function (item) {
            return item.id === id;
        });

        adminCompanies.splice(index, 1);

        displayCompanies();
        displayJobs();
    }
}

if (type === "application") {
    const application = adminApplications.find(function (item) {
        return item.id === id;
    });

    if (!application) {
        return;
    }

    if (action.classList.contains("edit")) {
        openApplicationModal(application);
    }

    if (action.classList.contains("delete")) {
        const confirmed = confirm("Voulez-vous vraiment supprimer cette candidature ?");

        if (!confirmed) {
            return;
        }

        const index = adminApplications.findIndex(function (item) {
            return item.id === id;
        });

        adminApplications.splice(index, 1);

        displayApplications();
    }
}

});

jobForm.addEventListener("submit", function (event) {
event.preventDefault();

const id = Number(document.getElementById("job-id").value);

const jobData = {
    title: document.getElementById("job-title").value,
    company: document.getElementById("job-company").value,
    location: document.getElementById("job-location").value,
    type: document.getElementById("job-type").value,
    salary: document.getElementById("job-salary").value,
    shortDescription: document.getElementById("job-short-description").value,
    description: document.getElementById("job-description").value
};

if (id) {
    const job = adminJobs.find(function (item) {
        return item.id === id;
    });

    Object.assign(job, jobData);
} else {
    const newId = adminJobs.length
        ? Math.max(...adminJobs.map(function (job) {
            return job.id;
        })) + 1
        : 1;

    adminJobs.push({
        id: newId,
        ...jobData
    });
}

displayJobs();
displayCompanies();
closeJobModal();

});

companyForm.addEventListener("submit", function (event) {
event.preventDefault();

const id = Number(document.getElementById("company-id").value);

const oldCompany = adminCompanies.find(function (company) {
    return company.id === id;
});

const companyName = document.getElementById("company-name").value;

const companyData = {
    name: companyName,
    location: document.getElementById("company-location").value,
    description: document.getElementById("company-description").value
};

if (id) {
    oldCompany.name = companyData.name;
    oldCompany.location = companyData.location;
    oldCompany.description = companyData.description;

    adminJobs.forEach(function (job) {
        if (job.company === oldCompany.name) {
            job.company = companyName;
        }
    });
} else {
    const newId = adminCompanies.length
        ? Math.max(...adminCompanies.map(function (company) {
            return company.id;
        })) + 1
        : 1;

    adminCompanies.push({
        id: newId,
        ...companyData
    });
}

displayCompanies();
displayJobs();
closeCompanyModal();

});

applicationForm.addEventListener("submit", function (event) {
event.preventDefault();

const id = Number(document.getElementById("application-id").value);

const application = adminApplications.find(function (item) {
    return item.id === id;
});

if (!application) {
    return;
}

application.status = document.getElementById("application-status").value;

displayApplications();
closeApplicationModal();

});

displayJobs();
displayCompanies();
displayApplications();