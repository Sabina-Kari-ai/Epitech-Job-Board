const JOBS_API_URL =
    "/api/jobs/";

const COMPANIES_API_URL =
    "/api/companies/";

const APPLICATIONS_API_URL =
    "/api/app/";

const USERS_API_URL =
    "/api/users/admin.php";

const LOGOUT_API_URL =
    "/api/auth/logout.php";


let adminJobs = [];
let adminCompanies = [];
let adminApplications = [];
let adminUsers = [];


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


const jobsList =
    document.getElementById(
        "admin-jobs-list"
    );

const companiesList =
    document.getElementById(
        "admin-companies-list"
    );

const applicationsList =
    document.getElementById(
        "admin-applications-list"
    );

const usersList =
    document.getElementById(
        "admin-users-list"
    );

const adminMessage =
    document.getElementById(
        "admin-message"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const tabs =
    document.querySelectorAll(
        ".admin-tab"
    );

const panels =
    document.querySelectorAll(
        ".admin-panel"
    );


const jobModal =
    document.getElementById(
        "job-modal"
    );

const companyModal =
    document.getElementById(
        "company-modal"
    );

const applicationModal =
    document.getElementById(
        "application-modal"
    );


const jobForm =
    document.getElementById(
        "job-form"
    );

const companyForm =
    document.getElementById(
        "company-form"
    );

const applicationForm =
    document.getElementById(
        "application-form"
    );


let isSavingJob = false;
let isSavingCompany = false;


// ========================================
// HELPERS
// ========================================

function showTableMessage(
    list,
    message,
    columnCount
) {

    if (!list) {
        return;
    }


    list.replaceChildren();


    const row =
        document.createElement("tr");

    const cell =
        document.createElement("td");


    cell.colSpan =
        columnCount;

    cell.textContent =
        message;


    row.appendChild(cell);

    list.appendChild(row);
}


function getFieldValue(id) {

    const field =
        document.getElementById(id);


    return field
        ? field.value.trim()
        : "";
}


function setFieldValue(
    id,
    value
) {

    const field =
        document.getElementById(id);


    if (field) {

        field.value =
            value == null
                ? ""
                : String(value);
    }
}


async function readApiResponse(
    response
) {

    const text =
        await response.text();

    let data = {};


    if (text) {

        try {

            data =
                JSON.parse(text);

        } catch (error) {

            throw new Error(
                "Le serveur a renvoyé une réponse invalide."
            );
        }
    }


    if (!response.ok) {

        const error =
            new Error(
                data.error ||
                data.message ||
                "Erreur HTTP " +
                response.status
            );


        error.status =
            response.status;


        throw error;
    }


    return data;
}


async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            options
        );


    return readApiResponse(
        response
    );
}


// ========================================
// ADMIN ACCESS
// ========================================

async function verifyAdmin() {

    try {

        const data =
            await apiRequest(
                USERS_API_URL
            );


        adminUsers =
            Array.isArray(data.users)
                ? data.users
                : [];


        displayUsers();


        return true;

    } catch (error) {

        if (
            error.status === 401 ||
            error.status === 403
        ) {

            window.location.href =
                "login.html";

            return false;
        }


        adminMessage.textContent =
            "Impossible de vérifier l'accès administrateur : " +
            error.message;


        return false;
    }
}


// ========================================
// NORMALIZE
// ========================================

function normalizeJob(job) {

    return {

        id:
            Number(job.id),

        title:
            job.title || "",

        company:
            job.company || "",

        company_id:
            Number(job.company_id) || null,

        location:
            job.location || "",

        type:
            job.contract_type ||
            job.type ||
            "",

        salary:
            job.salary || "",

        shortDescription:
            job.short_description ||
            job.shortDescription ||
            "",

        description:
            job.description || "",
        skills: job.skills || '',
        missions: job.missions || '',
        profile: job.profile || '',
        benefits: job.benefits || '',
        working_time: job.working_time || '',
        application_deadline: job.application_deadline || '',

        cover_letter_required:
            Number(
                job.cover_letter_required
            ) === 1
    };
}


function normalizeApplication(
    application
) {

    return {

        id:
            Number(application.id),

        job_id:
            Number(application.job_id),

        candidate_name:
            application.candidate_name || "",

        candidate_email:
            application.candidate_email || "",

        candidate_phone:
            application.candidate_phone || "",
        message: application.message || '',
        cover_letter: application.cover_letter || '',
        cv_path: application.cv_path || '',
        cover_letter_path: application.cover_letter_path || '',

        status:
            application.status ||
            "pending",

        job_title:
            application.job_title || ""
    };
}


// ========================================
// LOAD JOBS
// ========================================

async function loadJobs() {

    showTableMessage(
        jobsList,
        "Chargement des offres...",
        5
    );


    try {

        const data =
            await apiRequest(
                JOBS_API_URL
            );


        if (!Array.isArray(data)) {

            throw new Error(
                "Format des offres invalide."
            );
        }


        adminJobs =
            data.map(
                normalizeJob
            );


        displayJobs();

        updateCompanyOptions();

    } catch (error) {

        showTableMessage(
            jobsList,
            "Impossible de charger les offres : " +
            error.message,
            5
        );
    }
}


// ========================================
// LOAD COMPANIES
// ========================================

async function loadCompanies() {

    showTableMessage(
        companiesList,
        "Chargement des entreprises...",
        4
    );


    try {

        const data =
            await apiRequest(
                COMPANIES_API_URL
            );


        if (!Array.isArray(data)) {

            throw new Error(
                "Format des entreprises invalide."
            );
        }


        adminCompanies =
            data.map(
                function (company) {

                    return {

                        id:
                            Number(
                                company.id
                            ),

                        name:
                            company.name ||
                            "",

                        location:
                            company.location ||
                            "",

                        description:
                            company.description ||
                            ""
                    };
                }
            );


        displayCompanies();

        updateCompanyOptions();

    } catch (error) {

        showTableMessage(
            companiesList,
            "Impossible de charger les entreprises : " +
            error.message,
            4
        );
    }
}


// ========================================
// LOAD APPLICATIONS
// ========================================

async function loadApplications() {

    showTableMessage(
        applicationsList,
        "Chargement des candidatures...",
        5
    );


    try {

        const data =
            await apiRequest(
                APPLICATIONS_API_URL
            );


        if (!Array.isArray(data)) {

            throw new Error(
                "Format des candidatures invalide."
            );
        }


        adminApplications =
            data.map(
                normalizeApplication
            );


        displayApplications();

    } catch (error) {

        showTableMessage(
            applicationsList,
            "Impossible de charger les candidatures : " +
            error.message,
            5
        );
    }
}


// ========================================
// LOAD USERS
// ========================================

async function loadUsers() {

    showTableMessage(
        usersList,
        "Chargement des utilisateurs...",
        6
    );


    try {

        const result =
            await apiRequest(
                USERS_API_URL
            );


        adminUsers =
            Array.isArray(result.users)
                ? result.users
                : [];


        displayUsers();

    } catch (error) {

        if (
            error.status === 401 ||
            error.status === 403
        ) {

            window.location.href =
                "login.html";

            return;
        }


        showTableMessage(
            usersList,
            "Impossible de charger les utilisateurs : " +
            error.message,
            6
        );
    }
}


// ========================================
// DISPLAY JOBS
// ========================================

function displayJobs() {

    jobsList.replaceChildren();


    if (
        adminJobs.length === 0
    ) {

        showTableMessage(
            jobsList,
            "Aucune offre disponible.",
            5
        );

        return;
    }


    adminJobs.forEach(
        function (job) {

            const row =
                document.createElement("tr");


            const title =
                document.createElement("td");

            title.textContent =
                job.title;


            const company =
                document.createElement("td");

            company.textContent =
                job.company;


            const location =
                document.createElement("td");

            location.textContent =
                job.location;


            const type =
                document.createElement("td");

            type.textContent =
                job.type;


            const actionsCell =
                document.createElement("td");

            const actions =
                document.createElement("div");

            actions.className =
                "admin-actions";


            actions.append(

                createActionButton(
                    "Modifier",
                    "job",
                    job.id,
                    "edit"
                ),

                createActionButton(
                    "Supprimer",
                    "job",
                    job.id,
                    "delete"
                )
            );


            actionsCell.appendChild(
                actions
            );


            row.append(
                title,
                company,
                location,
                type,
                actionsCell
            );


            jobsList.appendChild(
                row
            );
        }
    );
}


// ========================================
// DISPLAY COMPANIES
// ========================================

function displayCompanies() {

    companiesList.replaceChildren();


    if (
        adminCompanies.length === 0
    ) {

        showTableMessage(
            companiesList,
            "Aucune entreprise disponible.",
            4
        );

        return;
    }


    adminCompanies.forEach(
        function (company) {

            const row =
                document.createElement("tr");


            const name =
                document.createElement("td");

            name.textContent =
                company.name;


            const location =
                document.createElement("td");

            location.textContent =
                company.location;


            const count =
                document.createElement("td");


            count.textContent =
                String(
                    adminJobs.filter(
                        function (job) {

                            return (
                                job.company_id ===
                                company.id
                            );
                        }
                    ).length
                );


            const actionsCell =
                document.createElement("td");

            const actions =
                document.createElement("div");

            actions.className =
                "admin-actions";


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


            actionsCell.appendChild(
                actions
            );


            row.append(
                name,
                location,
                count,
                actionsCell
            );


            companiesList.appendChild(
                row
            );
        }
    );
}


// ========================================
// DISPLAY APPLICATIONS
// ========================================

function displayApplications() {

    applicationsList.replaceChildren();


    if (
        adminApplications.length === 0
    ) {

        showTableMessage(
            applicationsList,
            "Aucune candidature enregistrée.",
            5
        );

        return;
    }


    adminApplications.forEach(
        function (application) {

            const row =
                document.createElement("tr");


            const candidate =
                document.createElement("td");

            candidate.textContent =
                application.candidate_name;


            const job =
                document.createElement("td");

            job.textContent =
                application.job_title ||
                "Offre #" +
                application.job_id;


            const email =
                document.createElement("td");

            email.textContent =
                application.candidate_email;


            const statusCell =
                document.createElement("td");

            const status =
                document.createElement("span");


            status.className =
                "status " +
                application.status;


            status.textContent =
                statusLabels[
                    application.status
                ] ||
                application.status;


            statusCell.appendChild(
                status
            );


            const actionsCell =
                document.createElement("td");

            const actions =
                document.createElement("div");

            actions.className =
                "admin-actions";


            actions.appendChild(
                createActionButton(
                    "Modifier le statut",
                    "application",
                    application.id,
                    "edit"
                )
            );


            actionsCell.appendChild(
                actions
            );


            row.append(
                candidate,
                job,
                email,
                statusCell,
                actionsCell
            );


            applicationsList.appendChild(
                row
            );
        }
    );
}


// ========================================
// DISPLAY USERS
// ========================================

function displayUsers() {

    usersList.replaceChildren();


    if (
        adminUsers.length === 0
    ) {

        showTableMessage(
            usersList,
            "Aucun utilisateur enregistré.",
            6
        );

        return;
    }


    adminUsers.forEach(
        function (user) {

            const row =
                document.createElement("tr");


            const name =
                document.createElement("td");

            name.textContent =
                (
                    (user.firstname || "") +
                    " " +
                    (user.lastname || "")
                ).trim();


            const email =
                document.createElement("td");

            email.textContent =
                user.email || "";


            const phone =
                document.createElement("td");

            phone.textContent =
                user.phone || "—";


            const roleCell =
                document.createElement("td");

            const roleSelect =
                document.createElement("select");


            const candidateOption =
                document.createElement("option");

            candidateOption.value =
                "candidate";

            candidateOption.textContent =
                "Candidat";


            const adminOption =
                document.createElement("option");

            adminOption.value =
                "admin";

            adminOption.textContent =
                "Administrateur";


            roleSelect.append(
                candidateOption,
                adminOption
            );


            roleSelect.value =
                user.role;


            roleCell.appendChild(
                roleSelect
            );


            const cvCell =
                document.createElement("td");


            if (user.cv_path) {

                const cvLink =
                    document.createElement("a");


                cvLink.href =
                    user.cv_path.startsWith("/")
                        ? user.cv_path
                        : "/" + user.cv_path;


                cvLink.target =
                    "_blank";

                cvLink.rel =
                    "noopener noreferrer";

                cvLink.textContent =
                    "Voir le CV";


                cvCell.appendChild(
                    cvLink
                );

            } else {

                cvCell.textContent =
                    "Aucun";
            }


            const actionsCell =
                document.createElement("td");

            const actions =
                document.createElement("div");

            actions.className =
                "admin-actions";


            const saveButton =
                document.createElement(
                    "button"
                );

            saveButton.type =
                "button";

            saveButton.className =
                "admin-action edit";

            saveButton.textContent =
                "Modifier le rôle";


            saveButton.addEventListener(
                "click",
                function () {

                    updateUserRole(
                        Number(user.id),
                        roleSelect.value
                    );
                }
            );


            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.type =
                "button";

            deleteButton.className =
                "admin-action delete";

            deleteButton.textContent =
                "Supprimer";


            deleteButton.addEventListener(
                "click",
                function () {

                    deleteUser(
                        Number(user.id),
                        user.email
                    );
                }
            );


            actions.append(
                saveButton,
                deleteButton
            );


            actionsCell.appendChild(
                actions
            );


            row.append(
                name,
                email,
                phone,
                (() => { const cell = document.createElement("td"); cell.textContent = user.account_type === "company" ? "Entreprise (n° " + user.company_id + ")" : "Candidat"; return cell; })(),
                roleCell,
                cvCell,
                actionsCell
            );


            usersList.appendChild(
                row
            );
        }
    );
}


// ========================================
// ACTION BUTTON
// ========================================

function createActionButton(
    label,
    type,
    id,
    action
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";

    button.className =
        "admin-action " +
        action;

    button.dataset.type =
        type;

    button.dataset.id =
        String(id);

    button.textContent =
        label;


    return button;
}


// ========================================
// TABS
// ========================================

function changeTab(tabId) {

    tabs.forEach(
        function (tab) {

            tab.classList.toggle(
                "active",
                tab.dataset.tab === tabId
            );
        }
    );


    panels.forEach(
        function (panel) {

            panel.classList.toggle(
                "active",
                panel.id === tabId
            );
        }
    );


    if (
        tabId ===
        "jobs-panel"
    ) {

        loadJobs();
    }


    if (
        tabId ===
        "companies-panel"
    ) {

        loadCompanies();
    }


    if (
        tabId ===
        "applications-panel"
    ) {

        loadApplications();
    }


    if (
        tabId ===
        "users-panel"
    ) {

        loadUsers();
    }
}


// ========================================
// COMPANY OPTIONS
// ========================================

function updateCompanyOptions() {

    const select =
        document.getElementById(
            "job-company"
        );


    if (!select) {
        return;
    }


    const previous =
        select.value;


    select.replaceChildren();


    const placeholder =
        document.createElement(
            "option"
        );


    placeholder.value =
        "";

    placeholder.disabled =
        true;

    placeholder.selected =
        true;

    placeholder.textContent =
        adminCompanies.length
            ? "Sélectionner une entreprise"
            : "Ajoutez d'abord une entreprise";


    select.appendChild(
        placeholder
    );


    adminCompanies.forEach(
        function (company) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                company.name;

            option.textContent =
                company.name;


            select.appendChild(
                option
            );
        }
    );


    if (previous) {

        select.value =
            previous;
    }
}


// ========================================
// JOB MODAL
// ========================================

function openJobModal(job = null) {

    updateCompanyOptions();


    setFieldValue(
        "job-id",
        job ? job.id : ""
    );

    setFieldValue(
        "job-title",
        job ? job.title : ""
    );

    setFieldValue(
        "job-company",
        job ? job.company : ""
    );

    setFieldValue(
        "job-location",
        job ? job.location : ""
    );

    setFieldValue(
        "job-type",
        job ? job.type : "CDI"
    );

    setFieldValue(
        "job-salary",
        job ? job.salary : ""
    );

    setFieldValue(
        "job-short-description",
        job
            ? job.shortDescription
            : ""
    );

    setFieldValue(
        "job-description",
        job
            ? job.description
            : ""
    );


    for (const field of ['skills','missions','profile','benefits','working_time','application_deadline']) {
        setFieldValue('job-' + field.replaceAll('_', '-'), job ? job[field] : '');
    }
    const checkbox =
        document.getElementById(
            "job-cover-letter-required"
        );


    checkbox.checked =
        job
            ? job.cover_letter_required
            : false;


    document.getElementById(
        "job-modal-title"
    ).textContent =
        job
            ? "Modifier une offre"
            : "Ajouter une offre";


    jobModal.classList.add(
        "active"
    );
}


function closeJobModal() {

    jobModal.classList.remove(
        "active"
    );

    jobForm.reset();
}


// ========================================
// COMPANY MODAL
// ========================================

function openCompanyModal(
    company = null
) {

    setFieldValue(
        "company-id",
        company ? company.id : ""
    );

    setFieldValue(
        "company-name",
        company ? company.name : ""
    );

    setFieldValue(
        "company-location",
        company
            ? company.location
            : ""
    );

    setFieldValue(
        "company-description",
        company
            ? company.description
            : ""
    );


    document.getElementById(
        "company-modal-title"
    ).textContent =
        company
            ? "Modifier une entreprise"
            : "Ajouter une entreprise";


    companyModal.classList.add(
        "active"
    );
}


function closeCompanyModal() {

    companyModal.classList.remove(
        "active"
    );

    companyForm.reset();
}


// ========================================
// APPLICATION MODAL
// ========================================

function openApplicationModal(
    application
) {

    if (!application) {
        return;
    }


    setFieldValue(
        "application-id",
        application.id
    );


    document.getElementById(
        "application-candidate"
    ).textContent =
        application.candidate_name;


    document.getElementById(
        "application-job"
    ).textContent =
        application.job_title ||
        "Offre #" +
        application.job_id;


    document.getElementById(
        "application-email"
    ).textContent =
        application.candidate_email;


    setFieldValue(
        "application-status",
        application.status
    );


    document.getElementById('application-phone').textContent = application.candidate_phone || 'Non renseigné';
    document.getElementById('application-message').textContent = application.message || 'Aucun message';
    document.getElementById('application-cover-letter').textContent = application.cover_letter || 'Non fournie';
    const documents = document.getElementById('application-documents');
    documents.replaceChildren();
    for (const [type, label] of [['cv', 'Ouvrir le CV'], ['cover_letter', 'Ouvrir la lettre jointe']]) {
        if (!application[type + '_path']) continue;
        const link = document.createElement('a');
        link.href = '/api/app/document.php?id=' + application.id + '&type=' + type;
        link.target = '_blank'; link.rel = 'noopener'; link.className = 'btn btn-outline'; link.textContent = label;
        documents.appendChild(link);
    }
    if (!documents.children.length) documents.textContent = 'Aucune pièce jointe';
    applicationModal.classList.add(
        "active"
    );
}


function closeApplicationModal() {

    applicationModal.classList.remove(
        "active"
    );

    applicationForm.reset();
}


// ========================================
// SAVE JOB
// ========================================

async function saveJob(event) {

    event.preventDefault();


    if (isSavingJob) {
        return;
    }


    const id =
        getFieldValue(
            "job-id"
        );


    const data = {

        title:
            getFieldValue(
                "job-title"
            ),

        company:
            getFieldValue(
                "job-company"
            ),

        location:
            getFieldValue(
                "job-location"
            ),

        type:
            getFieldValue(
                "job-type"
            ),

        salary:
            getFieldValue(
                "job-salary"
            ),

        shortDescription:
            getFieldValue(
                "job-short-description"
            ),

        description:
            getFieldValue(
                "job-description"
            ),

        cover_letter_required:
            document.getElementById(
                "job-cover-letter-required"
            ).checked
    };


    for (const field of ['skills','missions','profile','benefits','working_time','application_deadline']) {
        data[field] = getFieldValue('job-' + field.replaceAll('_', '-'));
    }
    const editing =
        id !== "";


    if (editing) {

        data.id =
            Number(id);
    }


    isSavingJob =
        true;


    try {

        const result =
            await apiRequest(
                JOBS_API_URL,
                {
                    method:
                        editing
                            ? "PUT"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            data
                        )
                }
            );


        window.alert(
            result.message ||
            "Offre enregistrée."
        );


        closeJobModal();

        await loadJobs();

    } catch (error) {

        window.alert(
            error.message
        );

    } finally {

        isSavingJob =
            false;
    }
}


// ========================================
// DELETE JOB
// ========================================

async function deleteJob(id) {

    const job =
        adminJobs.find(
            function (item) {

                return (
                    item.id === id
                );
            }
        );


    if (!job) {
        return;
    }


    if (
        !window.confirm(
            `Supprimer l'offre "${job.title}" ?`
        )
    ) {

        return;
    }


    try {

        const result =
            await apiRequest(
                `${JOBS_API_URL}?id=${id}`,
                {
                    method:
                        "DELETE"
                }
            );


        window.alert(
            result.message ||
            "Offre supprimée."
        );


        await loadJobs();

    } catch (error) {

        window.alert(
            error.message
        );
    }
}


// ========================================
// SAVE COMPANY
// ========================================

async function saveCompany(event) {

    event.preventDefault();


    if (isSavingCompany) {
        return;
    }


    const id =
        getFieldValue(
            "company-id"
        );


    const data = {

        name:
            getFieldValue(
                "company-name"
            ),

        location:
            getFieldValue(
                "company-location"
            ),

        description:
            getFieldValue(
                "company-description"
            )
    };


    const editing =
        id !== "";


    if (editing) {

        data.id =
            Number(id);
    }


    isSavingCompany =
        true;


    try {

        const result =
            await apiRequest(
                COMPANIES_API_URL,
                {
                    method:
                        editing
                            ? "PUT"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            data
                        )
                }
            );


        window.alert(
            result.message ||
            "Entreprise enregistrée."
        );


        closeCompanyModal();

        await loadCompanies();

        await loadJobs();

    } catch (error) {

        window.alert(
            error.message
        );

    } finally {

        isSavingCompany =
            false;
    }
}


// ========================================
// DELETE COMPANY
// ========================================

async function deleteCompany(id) {

    const company =
        adminCompanies.find(
            function (item) {

                return (
                    item.id === id
                );
            }
        );


    if (!company) {
        return;
    }


    if (
        !window.confirm(
            `Supprimer l'entreprise "${company.name}" ?`
        )
    ) {

        return;
    }


    try {

        const result =
            await apiRequest(
                `${COMPANIES_API_URL}?id=${id}`,
                {
                    method:
                        "DELETE"
                }
            );


        window.alert(
            result.message ||
            "Entreprise supprimée."
        );


        await loadCompanies();

    } catch (error) {

        window.alert(
            error.message
        );
    }
}


// ========================================
// UPDATE APPLICATION STATUS
// ========================================

async function saveApplicationStatus(
    event
) {

    event.preventDefault();


    const id =
        Number(
            getFieldValue(
                "application-id"
            )
        );


    const status =
        getFieldValue(
            "application-status"
        );


    try {

        const result =
            await apiRequest(
                APPLICATIONS_API_URL,
                {
                    method:
                        "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            id,
                            status
                        })
                }
            );


        window.alert(
            result.message ||
            "Statut mis à jour."
        );


        closeApplicationModal();

        await loadApplications();

    } catch (error) {

        window.alert(
            error.message
        );
    }
}


// ========================================
// UPDATE USER ROLE
// ========================================

async function updateUserRole(
    id,
    role
) {

    try {

        const result =
            await apiRequest(
                `${USERS_API_URL}?id=${id}`,
                {
                    method:
                        "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            role
                        })
                }
            );


        window.alert(
            result.message ||
            "Rôle modifié."
        );


        await loadUsers();

    } catch (error) {

        window.alert(
            error.message
        );
    }
}


// ========================================
// DELETE USER
// ========================================

async function deleteUser(
    id,
    email
) {

    if (
        !window.confirm(
            `Supprimer l'utilisateur ${email} ?`
        )
    ) {

        return;
    }


    try {

        const result =
            await apiRequest(
                `${USERS_API_URL}?id=${id}`,
                {
                    method:
                        "DELETE"
                }
            );


        window.alert(
            result.message ||
            "Utilisateur supprimé."
        );


        await loadUsers();

    } catch (error) {

        window.alert(
            error.message
        );
    }
}


// ========================================
// CLICK ACTIONS
// ========================================

document.addEventListener(
    "click",
    async function (event) {

        const target =
            event.target;


        if (
            !(target instanceof Element)
        ) {

            return;
        }


        const action =
            target.closest(
                ".admin-action"
            );


        if (!action) {
            return;
        }


        const type =
            action.dataset.type;

        const id =
            Number(
                action.dataset.id
            );


        if (type === "job") {

            const job =
                adminJobs.find(
                    item =>
                        item.id === id
                );


            if (
                action.classList.contains(
                    "edit"
                )
            ) {

                openJobModal(job);

            } else if (
                action.classList.contains(
                    "delete"
                )
            ) {

                await deleteJob(id);
            }
        }


        if (type === "company") {

            const company =
                adminCompanies.find(
                    item =>
                        item.id === id
                );


            if (
                action.classList.contains(
                    "edit"
                )
            ) {

                openCompanyModal(
                    company
                );

            } else if (
                action.classList.contains(
                    "delete"
                )
            ) {

                await deleteCompany(
                    id
                );
            }
        }


        if (type === "application") {

            const application =
                adminApplications.find(
                    item =>
                        item.id === id
                );


            if (
                action.classList.contains(
                    "edit"
                )
            ) {

                openApplicationModal(
                    application
                );
            }
        }
    }
);


// ========================================
// EVENTS
// ========================================

tabs.forEach(
    function (tab) {

        tab.addEventListener(
            "click",
            function () {

                changeTab(
                    tab.dataset.tab
                );
            }
        );
    }
);


document.getElementById(
    "add-job-button"
).addEventListener(
    "click",
    function () {

        openJobModal();
    }
);


document.getElementById(
    "add-company-button"
).addEventListener(
    "click",
    function () {

        openCompanyModal();
    }
);


document.getElementById(
    "job-modal-close"
).addEventListener(
    "click",
    closeJobModal
);


document.getElementById(
    "job-cancel"
).addEventListener(
    "click",
    closeJobModal
);


document.getElementById(
    "company-modal-close"
).addEventListener(
    "click",
    closeCompanyModal
);


document.getElementById(
    "company-cancel"
).addEventListener(
    "click",
    closeCompanyModal
);


document.getElementById(
    "application-modal-close"
).addEventListener(
    "click",
    closeApplicationModal
);


document.getElementById(
    "application-cancel"
).addEventListener(
    "click",
    closeApplicationModal
);


jobForm.addEventListener(
    "submit",
    saveJob
);


companyForm.addEventListener(
    "submit",
    saveCompany
);


applicationForm.addEventListener(
    "submit",
    saveApplicationStatus
);


// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener(
    "click",
    async function () {

        try {

            await fetch(
                LOGOUT_API_URL,
                {
                    method:
                        "POST"
                }
            );

        } finally {

            window.location.href =
                "login.html";
        }
    }
);


// ========================================
// START
// ========================================

async function startAdmin() {

    const allowed =
        await verifyAdmin();


    if (!allowed) {
        return;
    }


    if (window.location.hash === '#applications-panel') changeTab('applications-panel');

    await Promise.all([
        loadJobs(),
        loadCompanies(),
        loadApplications()
    ]);
}


startAdmin();