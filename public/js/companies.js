const companies = [
    {
        id: 1,
        name: "Tech Solutions",
        location: "Paris",
        description: "Entreprise spécialisée dans le développement de solutions web et digitales.",
        jobs: 1
    },
    {
        id: 2,
        name: "Digital Services",
        location: "Lyon",
        description: "Entreprise spécialisée dans les applications web et les services numériques.",
        jobs: 1
    },
    {
        id: 3,
        name: "Innovation Agency",
        location: "Paris",
        description: "Agence digitale spécialisée dans la création d'expériences web modernes.",
        jobs: 1
    },
    {
        id: 4,
        name: "Web Business",
        location: "Lille",
        description: "Entreprise spécialisée dans la conception et le développement de sites web.",
        jobs: 1
    },
    {
        id: 5,
        name: "France Numérique",
        location: "Paris",
        description: "Entreprise spécialisée dans les services numériques et l'intégration web.",
        jobs: 1
    },
    {
        id: 6,
        name: "Future Systems",
        location: "Lyon",
        description: "Entreprise spécialisée dans la conception de solutions logicielles.",
        jobs: 1
    }
];

const companiesList = document.getElementById("companies-list");

function displayCompanies() {
    if (!companiesList) {
        return;
    }

    companiesList.innerHTML = "";

    companies.forEach(function (company) {
        const card = document.createElement("article");

        card.className = "company-card";

        card.innerHTML = `
            <div class="company-card-logo">
                ${company.name.charAt(0)}
            </div>

            <div class="company-card-content">
                <h2>${company.name}</h2>
                <p class="company-location">${company.location}</p>
                <p>${company.description}</p>
                <span>${company.jobs} offre disponible</span>
            </div>

            <a href="index.html#jobs" class="btn btn-outline">
                Voir les offres
            </a>
        `;

        companiesList.appendChild(card);
    });
}

displayCompanies();