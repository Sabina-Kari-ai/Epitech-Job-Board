const API_URL =
    "/api/jobs/";

const USER_API_URL =
    "/api/users/me.php";

const LOGOUT_API_URL =
    "/api/auth/logout.php";


let jobs = [];


const jobsList =
    document.getElementById(
        "jobs-list"
    );

const metierInput =
    document.getElementById(
        "metier"
    );

const competenceInput =
    document.getElementById(
        "competence"
    );

const locationInput =
    document.getElementById(
        "location"
    );

const searchButton =
    document.getElementById(
        "search-button"
    );

const jobsCount =
    document.getElementById(
        "jobs-count"
    );

const contractFilters =
    document.querySelectorAll(
        ".contract-filter"
    );

const cityFilters =
    document.querySelectorAll(
        'input[name="city-filter"]'
    );

const resetButton =
    document.getElementById(
        "reset-filters"
    );

const authActions =
    document.getElementById(
        "authActions"
    );


// ========================================
// AUTH NAVIGATION
// ========================================

async function loadNavigation() {

    if (!authActions) {
        return;
    }


    try {

        const response =
            await fetch(
                USER_API_URL
            );


        if (!response.ok) {
            return;
        }


        const result =
            await response.json();


        if (!result.user) {
            return;
        }


        authActions.replaceChildren();


        if (
            result.user.role ===
            "admin"
        ) {

            const adminLink =
                document.createElement(
                    "a"
                );

            adminLink.href =
                "admin.html";

            adminLink.className =
                "btn btn-outline";

            adminLink.textContent =
                "Administration";


            authActions.appendChild(
                adminLink
            );

        } else {

            const accountLink =
                document.createElement(
                    "a"
                );


            accountLink.className =
                "btn btn-outline";


            if (
                result.user.account_type ===
                "company"
            ) {

                accountLink.href =
                    "companies.html";

                accountLink.textContent =
                    "Mon entreprise";

            } else {

                accountLink.href =
                    "profile.html";

                accountLink.textContent =
                    "Mon compte";
            }


            authActions.appendChild(
                accountLink
            );
        }


        const logoutButton =
            document.createElement(
                "button"
            );


        logoutButton.type =
            "button";

        logoutButton.className =
            "btn btn-primary";

        logoutButton.textContent =
            "Déconnexion";


        logoutButton.addEventListener(
            "click",
            logout
        );


        authActions.appendChild(
            logoutButton
        );

    } catch (error) {

        console.error(
            "Erreur de session :",
            error
        );
    }
}


async function logout() {

    try {

        await fetch(
            LOGOUT_API_URL,
            {
                method: "POST"
            }
        );

    } finally {

        window.location.href =
            "index.html";
    }
}


// ========================================
// MESSAGES
// ========================================

function displayMessage(
    titleText,
    descriptionText = ""
) {

    jobsList.replaceChildren();


    const container =
        document.createElement(
            "div"
        );

    container.className =
        "empty-applications";


    const title =
        document.createElement(
            "h2"
        );

    title.textContent =
        titleText;


    container.appendChild(
        title
    );


    if (descriptionText) {

        const paragraph =
            document.createElement(
                "p"
            );

        paragraph.textContent =
            descriptionText;


        container.appendChild(
            paragraph
        );
    }


    jobsList.appendChild(
        container
    );
}


// ========================================
// DISPLAY JOBS
// ========================================

function displayJobs(list) {

    jobsList.replaceChildren();


    jobsCount.textContent =
        list.length +
        (
            list.length > 1
                ? " offres"
                : " offre"
        );


    if (
        list.length === 0
    ) {

        displayMessage(
            "Aucune offre trouvée",
            "Essayez de modifier vos critères de recherche."
        );

        return;
    }


    list.forEach(
        function (job) {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "job-card";


            const top =
                document.createElement(
                    "div"
                );

            top.className =
                "job-card-top";


            const logo =
                document.createElement(
                    "div"
                );

            logo.className =
                "company-logo";

            logo.textContent =
                String(
                    job.company || "?"
                )
                .charAt(0)
                .toUpperCase();


            const content =
                document.createElement(
                    "div"
                );

            content.className =
                "job-card-content";


            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                job.title ||
                "Poste non précisé";


            const company =
                document.createElement(
                    "p"
                );

            company.className =
                "company-name";

            company.textContent =
                job.company ||
                "Entreprise";


            const contract =
                document.createElement(
                    "span"
                );

            contract.className =
                "job-contract";

            contract.textContent =
                job.contract_type ||
                "Contrat";


            const description =
                document.createElement(
                    "p"
                );

            description.textContent =
                job.short_description ||
                "";


            const salary =
                document.createElement(
                    "p"
                );

            salary.className =
                "job-salary";

            salary.textContent =
                job.salary ||
                "Salaire non précisé";


            content.append(
                title,
                company,
                contract,
                description,
                salary
            );


            top.append(
                logo,
                content
            );


            const bottom =
                document.createElement(
                    "div"
                );

            bottom.className =
                "job-card-bottom";


            const location =
                document.createElement(
                    "span"
                );

            location.className =
                "job-card-location";

            location.textContent =
                job.location ||
                "Lieu non précisé";


            const detailsButton =
                document.createElement(
                    "button"
                );

            detailsButton.type =
                "button";

            detailsButton.className =
                "details-button";

            detailsButton.textContent =
                "Voir l'offre";


            detailsButton.addEventListener(
                "click",
                function () {

                    showJob(
                        job.id
                    );
                }
            );


            bottom.append(
                location,
                detailsButton
            );


            card.append(
                top,
                bottom
            );


            jobsList.appendChild(
                card
            );
        }
    );
}


// ========================================
// FILTER
// ========================================

function filterJobs() {

    const metier =
        metierInput.value
            .toLowerCase()
            .trim();


    const competence =
        competenceInput.value
            .toLowerCase()
            .trim();


    const locationSearch =
        locationInput.value
            .toLowerCase()
            .trim();


    const selectedContracts =
        Array.from(
            contractFilters
        )
        .filter(
            filter =>
                filter.checked
        )
        .map(
            filter =>
                filter.value
        );


    const selectedCity =
        Array.from(
            cityFilters
        )
        .find(
            filter =>
                filter.checked
        );


    const filteredJobs =
        jobs.filter(
            function (job) {

                const title =
                    String(
                        job.title || ""
                    ).toLowerCase();


                const company =
                    String(
                        job.company || ""
                    ).toLowerCase();


                const shortDescription =
                    String(
                        job.short_description || ""
                    ).toLowerCase();


                const description =
                    String(
                        job.description || ""
                    ).toLowerCase();


                const skills =
                    String(
                        job.skills || ""
                    ).toLowerCase();


                const location =
                    String(
                        job.location || ""
                    ).toLowerCase();


                const contract =
                    String(
                        job.contract_type || ""
                    );


                const matchesMetier =
                    metier === "" ||
                    title.includes(
                        metier
                    ) ||
                    company.includes(
                        metier
                    );


                const matchesCompetence =
                    competence === "" ||
                    skills.includes(
                        competence
                    ) ||
                    shortDescription.includes(
                        competence
                    ) ||
                    description.includes(
                        competence
                    );


                const matchesLocation =
                    locationSearch === "" ||
                    location.includes(
                        locationSearch
                    );


                const matchesContract =
                    selectedContracts.length === 0 ||
                    selectedContracts.includes(
                        contract
                    );


                const matchesCity =
                    !selectedCity ||
                    selectedCity.value === "all" ||
                    location ===
                        selectedCity.value
                            .toLowerCase();


                return (
                    matchesMetier &&
                    matchesCompetence &&
                    matchesLocation &&
                    matchesContract &&
                    matchesCity
                );
            }
        );


    displayJobs(
        filteredJobs
    );
}


// ========================================
// JOB MODAL
// ========================================

function showJob(id) {

    const job =
        jobs.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!job) {
        return;
    }


    const modal =
        document.getElementById(
            "job-modal"
        );


    document.getElementById(
        "modal-title"
    ).textContent =
        job.title ||
        "Offre";


    document.getElementById(
        "modal-company"
    ).textContent =
        job.company ||
        "Entreprise";


    document.getElementById(
        "modal-location"
    ).textContent =
        (
            job.location ||
            ""
        ) +
        " · " +
        (
            job.contract_type ||
            ""
        );


    document.getElementById(
        "modal-description"
    ).textContent =
        job.description ||
        job.short_description ||
        "Aucune description.";


    document.getElementById(
        "apply-button"
    ).onclick =
        function () {

            window.location.href =
                "apply.html?id=" +
                encodeURIComponent(
                    job.id
                );
        };


    modal.classList.remove(
        "hidden"
    );
}


function closeModal() {

    document.getElementById(
        "job-modal"
    ).classList.add(
        "hidden"
    );
}


// ========================================
// LOAD JOBS
// ========================================

let loadingController = null;

async function loadJobs() {
    if (loadingController) loadingController.abort();
    const controller = new AbortController();
    loadingController = controller;
    const timer = setTimeout(() => controller.abort(), 10000);

    displayMessage(
        "Chargement des offres..."
    );


    try {

        const response =
            await fetch(
                API_URL + (new URLSearchParams(window.location.search).has('company') ? '?company=' + encodeURIComponent(new URLSearchParams(window.location.search).get('company')) : ''),
                { signal: controller.signal }
            );


        if (!response.ok) {

            throw new Error(
                "Erreur HTTP " +
                response.status
            );
        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "Format invalide."
            );
        }


        jobs =
            data;


        filterJobs();

    } catch (error) {
        if (loadingController !== controller) return;
        console.error(error);
        jobs = [];
        displayMessage(
            "Impossible de charger les offres",
            error.name === 'AbortError'
                ? "Le serveur met trop de temps à répondre. Réessayez."
                : "Vérifiez que le serveur PHP et la base de données sont démarrés."
        );
        const retry = document.createElement('button');
        retry.type = 'button'; retry.className = 'btn btn-primary'; retry.textContent = 'Réessayer';
        retry.addEventListener('click', loadJobs);
        jobsList.querySelector('.empty-state')?.appendChild(retry);
        if (!retry.parentElement) jobsList.appendChild(retry);
        jobsCount.textContent = '0 offre';
    } finally {
        clearTimeout(timer);
        if (loadingController === controller) loadingController = null;
    }
}


// ========================================
// EVENTS
// ========================================

metierInput.addEventListener(
    "input",
    filterJobs
);


competenceInput.addEventListener(
    "input",
    filterJobs
);


locationInput.addEventListener(
    "input",
    filterJobs
);


searchButton.addEventListener(
    "click",
    filterJobs
);


contractFilters.forEach(
    function (filter) {

        filter.addEventListener(
            "change",
            filterJobs
        );
    }
);


cityFilters.forEach(
    function (filter) {

        filter.addEventListener(
            "change",
            filterJobs
        );
    }
);


resetButton.addEventListener(
    "click",
    function () {

        metierInput.value =
            "";

        competenceInput.value =
            "";

        locationInput.value =
            "";


        contractFilters.forEach(
            filter => {

                filter.checked =
                    false;
            }
        );


        cityFilters.forEach(
            filter => {

                filter.checked =
                    filter.value ===
                    "all";
            }
        );


        filterJobs();
    }
);


document.getElementById(
    "modal-close"
).addEventListener(
    "click",
    closeModal
);


document.getElementById(
    "modal-overlay"
).addEventListener(
    "click",
    closeModal
);


// ========================================
// START
// ========================================

loadJobs();

// Shared auth-nav.js renders navigation.