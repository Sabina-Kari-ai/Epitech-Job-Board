// Administration : tableau de bord et gestion des offres, entreprises,
// utilisateurs et candidatures. Les quatre listes partagent le même
// fonctionnement (recherche, filtres, pagination), décrit dans `lists`.

const isLocalFrontend = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_BASE = isLocalFrontend
    ? `http://${window.location.hostname}:8001`
    : window.location.origin;
const PAGE_SIZE = 10;

const ENDPOINTS = {
    jobs: `${API_BASE}/api/jobs/`,
    companies: `${API_BASE}/api/companies/`,
    users: `${API_BASE}/api/users/`,
    applications: `${API_BASE}/api/app/`,
    stats: `${API_BASE}/api/stats/`
};

const APPLICATION_STATUSES = {
    pending: "En attente",
    reviewing: "En cours d'étude",
    interview: "Entretien",
    accepted: "Acceptée",
    rejected: "Refusée"
};
const COMPANY_STATUSES = { pending: "À valider", approved: "Validée", rejected: "Refusée" };
const ROLES = { candidate: "Candidat", company: "Recruteur", admin: "Administrateur" };

let currentAdmin = null;
let allCompanies = [];

// Outils.

function el(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(String(value).replace(" ", "T"));
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
}

function formatSiret(siret) {
    if (!siret) return "—";
    return siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4");
}

function badge(label, variant) {
    return el("span", `status ${variant}`, label);
}

async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: "include",
        // Toujours la session d'administration (cookie séparé de celui du site).
        headers: { "X-Session-Scope": "admin", ...(options.body ? { "Content-Type": "application/json" } : {}) }
    });
    const text = await response.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error("Le serveur a renvoyé une réponse invalide.");
    }
    if (!response.ok) {
        throw new Error(data.error || data.message || `Erreur HTTP ${response.status}`);
    }
    return data;
}

let toastTimer = null;
function toast(message, isError = false) {
    const box = document.getElementById("admin-toast");
    box.textContent = message;
    box.classList.toggle("error", isError);
    box.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        box.hidden = true;
    }, 3500);
}

function actionButton(label, variant, handler) {
    const button = el("button", `admin-action ${variant}`, label);
    button.type = "button";
    button.addEventListener("click", handler);
    return button;
}

function emptyRow(tbody, message) {
    const row = el("tr");
    const cell = el("td", "admin-empty", message);
    cell.colSpan = tbody.closest("table").querySelectorAll("thead th").length;
    row.appendChild(cell);
    tbody.replaceChildren(row);
}

// Listes paginées : une configuration par ressource.

const lists = {
    jobs: {
        url: ENDPOINTS.jobs,
        row: (job) => [
            cellStack(job.title, job.short_description),
            job.company,
            job.location,
            badge(job.contract_type, "neutral"),
            String(job.applications_count ?? 0),
            formatDate(job.created_at),
            [
                actionButton("Modifier", "edit", () => openJobModal(job)),
                actionButton("Supprimer", "delete", () => removeItem("jobs", job.id, `l'offre « ${job.title} »`))
            ]
        ]
    },
    companies: {
        url: ENDPOINTS.companies,
        row: (company) => [
            cellStack(company.name, company.location),
            formatSiret(company.siret),
            company.contact || "—",
            String(company.jobs_count ?? 0),
            badge(COMPANY_STATUSES[company.status] || company.status, `company-${company.status}`),
            [
                ...(company.status !== "approved"
                    ? [actionButton("Valider", "approve", () => setCompanyStatus(company, "approved"))]
                    : []),
                ...(company.status === "pending"
                    ? [actionButton("Refuser", "delete", () => setCompanyStatus(company, "rejected"))]
                    : []),
                actionButton("Modifier", "edit", () => openCompanyModal(company)),
                actionButton("Supprimer", "delete", () => removeItem("companies", company.id, `l'entreprise « ${company.name} »`))
            ]
        ]
    },
    users: {
        url: ENDPOINTS.users,
        row: (user) => [
            `${user.first_name} ${user.last_name}`,
            user.email,
            badge(ROLES[user.role] || user.role, `role-${user.role}`),
            user.company_name || "—",
            user.role === "candidate" ? String(user.applications_count ?? 0) : "—",
            formatDate(user.created_at),
            [
                actionButton("Modifier", "edit", () => openUserModal(user)),
                ...(Number(user.id) !== Number(currentAdmin?.id)
                    ? [actionButton("Supprimer", "delete", () => removeItem("users", user.id, `le compte de ${user.first_name} ${user.last_name}`))]
                    : [])
            ]
        ]
    },
    applications: {
        url: ENDPOINTS.applications,
        row: (application) => [
            cellStack(application.candidate_name, application.candidate_email),
            application.job_title,
            application.company,
            formatDate(application.created_at),
            badge(APPLICATION_STATUSES[application.status] || application.status, application.status),
            [
                actionButton("Voir", "view", () => openApplicationModal(application.id)),
                actionButton("Supprimer", "delete", () => removeItem("applications", application.id, `la candidature de ${application.candidate_name}`))
            ]
        ]
    }
};

const listState = {};

function cellStack(main, secondary) {
    const wrapper = el("div", "admin-cell-stack");
    wrapper.append(el("strong", "", main));
    if (secondary) wrapper.append(el("span", "", secondary));
    return wrapper;
}

async function loadList(resource) {
    const panel = document.querySelector(`[data-resource="${resource}"]`);
    const tbody = panel.querySelector("tbody");
    const state = listState[resource];
    const params = new URLSearchParams({ page: state.page, limit: PAGE_SIZE });

    if (state.q) params.set("q", state.q);
    Object.entries(state.filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
    });

    emptyRow(tbody, "Chargement...");

    try {
        const result = await api(`${lists[resource].url}?${params}`);

        // Une suppression peut vider la dernière page : on recule d'une page.
        if (!result.data.length && state.page > 1) {
            state.page -= 1;
            return loadList(resource);
        }

        if (!result.data.length) {
            emptyRow(tbody, "Aucun résultat.");
        } else {
            tbody.replaceChildren(...result.data.map((item) => {
                const row = el("tr");
                lists[resource].row(item).forEach((content) => {
                    const cell = el("td");
                    if (Array.isArray(content)) {
                        const actions = el("div", "admin-actions");
                        actions.append(...content);
                        cell.append(actions);
                    } else if (content instanceof Node) {
                        cell.append(content);
                    } else {
                        cell.textContent = content ?? "—";
                    }
                    row.append(cell);
                });
                return row;
            }));
        }

        renderPager(panel.querySelector(".admin-pager"), result, resource);
    } catch (error) {
        console.error(`Chargement de ${resource} impossible :`, error);
        emptyRow(tbody, "Impossible de charger les données : " + error.message);
        panel.querySelector(".admin-pager").replaceChildren();
    }
}

function renderPager(container, result, resource) {
    const info = el(
        "span",
        "admin-pager-info",
        `${result.total} résultat${result.total > 1 ? "s" : ""} · page ${result.page} sur ${result.pages}`
    );
    const previous = el("button", "btn btn-outline", "← Précédent");
    const next = el("button", "btn btn-outline", "Suivant →");
    previous.type = next.type = "button";
    previous.disabled = result.page <= 1;
    next.disabled = result.page >= result.pages;
    previous.addEventListener("click", () => {
        listState[resource].page -= 1;
        loadList(resource);
    });
    next.addEventListener("click", () => {
        listState[resource].page += 1;
        loadList(resource);
    });

    const buttons = el("div", "admin-pager-buttons");
    buttons.append(previous, next);
    container.replaceChildren(info, buttons);
}

function setupListControls() {
    Object.keys(lists).forEach((resource) => {
        const panel = document.querySelector(`[data-resource="${resource}"]`);
        listState[resource] = { page: 1, q: "", filters: {} };

        let searchTimer = null;
        panel.querySelector(".admin-search")?.addEventListener("input", (event) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                listState[resource].q = event.target.value.trim();
                listState[resource].page = 1;
                loadList(resource);
            }, 300);
        });

        panel.querySelectorAll(".admin-filter").forEach((select) => {
            select.addEventListener("change", () => {
                listState[resource].filters[select.dataset.param] = select.value;
                listState[resource].page = 1;
                loadList(resource);
            });
        });
    });
}

// Onglets.

function changeTab(tabId) {
    document.querySelectorAll(".admin-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.tab === tabId);
    });
    document.querySelectorAll(".admin-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === tabId);
    });

    if (window.location.hash !== `#${tabId}`) {
        history.replaceState(null, "", `#${tabId}`);
    }

    const resource = document.getElementById(tabId)?.dataset.resource;
    if (resource) loadList(resource);
    if (tabId === "dashboard-panel") loadDashboard();
}

// Tableau de bord.

async function loadDashboard() {
    try {
        const stats = await api(ENDPOINTS.stats);
        const sum = (values) => Object.values(values || {}).reduce((total, n) => total + n, 0);
        const pending = stats.companies.pending || 0;
        const values = {
            jobs: stats.jobs,
            companies: stats.companies.approved || 0,
            pending,
            candidates: stats.users.candidate || 0,
            applications: sum(stats.applications),
            "applications-pending": stats.applications.pending || 0
        };
        Object.entries(values).forEach(([key, value]) => {
            document.querySelector(`[data-stat="${key}"]`).textContent = String(value);
        });

        const tabBadge = document.getElementById("pending-companies-badge");
        tabBadge.textContent = String(pending);
        tabBadge.hidden = pending === 0;

        renderPendingCompanies(stats.pending_companies);
        renderRecentApplications(stats.recent_applications);
    } catch (error) {
        console.error("Statistiques indisponibles :", error);
        toast("Impossible de charger le tableau de bord : " + error.message, true);
    }
}

function renderPendingCompanies(companies) {
    const list = document.getElementById("pending-companies-list");
    if (!companies.length) {
        list.replaceChildren(el("p", "admin-empty", "Aucune inscription en attente. 🎉"));
        return;
    }

    list.replaceChildren(...companies.map((company) => {
        const item = el("article", "admin-card-item");
        const info = el("div");
        info.append(
            el("strong", "", company.name),
            el("span", "", `SIRET ${formatSiret(company.siret)} · ${company.location} · inscrite le ${formatDate(company.created_at)}`)
        );
        const actions = el("div", "admin-actions");
        actions.append(
            actionButton("Valider", "approve", () => setCompanyStatus(company, "approved")),
            actionButton("Refuser", "delete", () => setCompanyStatus(company, "rejected"))
        );
        item.append(info, actions);
        return item;
    }));
}

function renderRecentApplications(applications) {
    const list = document.getElementById("recent-applications-list");
    if (!applications.length) {
        list.replaceChildren(el("p", "admin-empty", "Aucune candidature pour le moment."));
        return;
    }

    list.replaceChildren(...applications.map((application) => {
        const item = el("article", "admin-card-item");
        const info = el("div");
        info.append(
            el("strong", "", application.candidate_name),
            el("span", "", `${application.job_title} · ${application.company} · ${formatDate(application.created_at)}`)
        );
        const view = actionButton("Voir", "view", () => openApplicationModal(application.id));
        const right = el("div", "admin-actions");
        right.append(badge(APPLICATION_STATUSES[application.status], application.status), view);
        item.append(info, right);
        return item;
    }));
}

// Actions communes.

async function refreshAfterChange(resource) {
    await Promise.all([
        resource ? loadList(resource) : Promise.resolve(),
        loadDashboard(),
        resource === "companies" ? loadAllCompanies() : Promise.resolve()
    ]);
}

async function removeItem(resource, id, label) {
    if (!window.confirm(`Voulez-vous vraiment supprimer ${label} ?`)) return;

    try {
        const result = await api(`${lists[resource].url}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        toast(result.message || "Suppression effectuée.");
        await refreshAfterChange(resource);
    } catch (error) {
        toast(error.message, true);
    }
}

async function setCompanyStatus(company, status) {
    const verb = status === "approved" ? "valider" : "refuser";
    if (!window.confirm(`Voulez-vous ${verb} l'inscription de « ${company.name} » ?`)) return;

    try {
        const result = await api(`${ENDPOINTS.companies}?id=${encodeURIComponent(company.id)}`, {
            method: "PATCH",
            body: JSON.stringify({ status })
        });
        toast(result.message);
        await refreshAfterChange("companies");
    } catch (error) {
        toast(error.message, true);
    }
}

// Modales et formulaires.

function openModal(id) {
    const modal = document.getElementById(id);
    modal.querySelector(".admin-form-error").textContent = "";
    modal.classList.add("active");
    modal.querySelector("input:not([type=hidden]), select, textarea")?.focus();
}

function closeModals() {
    document.querySelectorAll(".admin-modal.active").forEach((modal) => {
        modal.classList.remove("active");
    });
}

function fillForm(form, values) {
    form.reset();
    Object.entries(values).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (!field) return;
        if (field.type === "checkbox") {
            field.checked = Number(value) === 1 || value === true;
        } else {
            field.value = value ?? "";
        }
    });
}

function formValues(form) {
    const values = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll("input[type=checkbox]").forEach((box) => {
        values[box.name] = box.checked;
    });
    return values;
}

async function loadAllCompanies() {
    try {
        allCompanies = await api(ENDPOINTS.companies);
    } catch (error) {
        console.error("Liste des entreprises indisponible :", error);
    }
}

function fillCompanySelect(select, selectedId) {
    const placeholder = el("option", "", allCompanies.length ? "Sélectionner une entreprise" : "Ajoutez d'abord une entreprise");
    placeholder.value = "";
    select.replaceChildren(placeholder, ...allCompanies.map((company) => {
        const option = el("option", "", company.status === "approved" ? company.name : `${company.name} (${COMPANY_STATUSES[company.status]})`);
        option.value = String(company.id);
        return option;
    }));
    select.value = selectedId ? String(selectedId) : "";
}

function openJobModal(job) {
    const form = document.getElementById("jobs-form");
    fillForm(form, job || { contract_type: "CDI" });
    fillCompanySelect(form.elements.namedItem("company_id"), job?.company_id);
    document.getElementById("jobs-modal-title").textContent = job ? "Modifier l'offre" : "Ajouter une offre";
    openModal("jobs-modal");
}

function openCompanyModal(company) {
    const form = document.getElementById("companies-form");
    fillForm(form, company ? { ...company, siret: formatSiret(company.siret).replace("—", "") } : { status: "approved" });
    document.getElementById("companies-modal-title").textContent = company ? "Modifier l'entreprise" : "Ajouter une entreprise";
    openModal("companies-modal");
}

function updateUserCompanyField() {
    const form = document.getElementById("users-form");
    document.getElementById("user-company-field").hidden = form.elements.namedItem("role").value !== "company";
}

function openUserModal(user) {
    const form = document.getElementById("users-form");
    fillForm(form, user || { role: "candidate" });
    fillCompanySelect(form.elements.namedItem("company_id"), user?.company_id);
    form.elements.namedItem("password").required = !user;
    document.getElementById("user-password-hint").textContent = user
        ? "Laisser vide pour conserver le mot de passe actuel."
        : "6 caractères minimum.";
    document.getElementById("users-modal-title").textContent = user ? "Modifier l'utilisateur" : "Ajouter un utilisateur";
    updateUserCompanyField();
    openModal("users-modal");
}

async function openApplicationModal(id) {
    try {
        const application = await api(`${ENDPOINTS.applications}?id=${encodeURIComponent(id)}`);
        const form = document.getElementById("applications-form");
        fillForm(form, { id: application.id, status: application.status });
        document.getElementById("applications-modal-title").textContent = `Candidature de ${application.candidate_name}`;

        const detail = document.getElementById("application-detail");
        detail.replaceChildren();
        [
            ["Offre", `${application.job_title} — ${application.company}`],
            ["E-mail", application.candidate_email],
            ["Téléphone", application.candidate_phone],
            ["Reçue le", formatDate(application.created_at)],
            ["Mise à jour", formatDate(application.updated_at)]
        ].forEach(([label, value]) => detail.append(el("dt", "", label), el("dd", "", value || "—")));

        const message = document.getElementById("application-message");
        message.replaceChildren(el("h3", "", "Message du candidat"), el("p", "", application.message || "—"));
        if (application.cover_letter) {
            message.append(el("h3", "", "Lettre de motivation"), el("p", "", application.cover_letter));
        }

        const attachments = document.getElementById("application-attachments");
        attachments.replaceChildren();
        [["cv", application.cv_file_name, "CV"], ["cover-letter", application.cover_letter_file_name, "Lettre"]]
            .forEach(([type, name, label]) => {
                if (!name) return;
                const link = el("a", "btn btn-outline", `📄 ${label} : ${name}`);
                link.href = `${ENDPOINTS.applications}?id=${encodeURIComponent(application.id)}&attachment=${type}&scope=admin`;
                link.target = "_blank";
                link.rel = "noopener";
                attachments.append(link);
            });

        openModal("applications-modal");
    } catch (error) {
        toast(error.message, true);
    }
}

function setupForm(resource, buildPayload, method = (values) => (values.id ? "PUT" : "POST")) {
    const form = document.getElementById(`${resource}-form`);
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = formValues(form);
        const payload = buildPayload(values);
        const submit = form.querySelector('[type="submit"]');
        const error = form.querySelector(".admin-form-error");
        error.textContent = "";
        submit.disabled = true;

        try {
            const result = await api(ENDPOINTS[resource], {
                method: method(values),
                body: JSON.stringify(payload)
            });
            closeModals();
            toast(result.message || "Enregistré.");
            await refreshAfterChange(resource);
        } catch (failure) {
            error.textContent = failure.message;
        } finally {
            submit.disabled = false;
        }
    });
}

function withId(values, payload) {
    if (values.id) payload.id = Number(values.id);
    return payload;
}

setupForm("jobs", (values) => withId(values, {
    title: values.title,
    company_id: Number(values.company_id),
    location: values.location,
    contract_type: values.contract_type,
    salary: values.salary,
    short_description: values.short_description,
    description: values.description,
    cover_letter_required: values.cover_letter_required
}));

setupForm("companies", (values) => withId(values, {
    name: values.name,
    siret: values.siret,
    location: values.location,
    status: values.status,
    description: values.description
}));

setupForm("users", (values) => withId(values, {
    first_name: values.first_name,
    last_name: values.last_name,
    email: values.email,
    phone: values.phone,
    city: values.city,
    role: values.role,
    company_id: values.role === "company" ? Number(values.company_id) || null : null,
    password: values.password
}));

setupForm("applications", (values) => ({ id: Number(values.id), status: values.status }), () => "PUT");

// Événements.

document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => changeTab(tab.dataset.tab));
});

document.querySelectorAll("[data-open-tab]").forEach((link) => {
    link.addEventListener("click", () => {
        const panel = document.getElementById(link.dataset.openTab);
        const filter = panel.querySelector('.admin-filter[data-param="status"]');
        if (filter && link.dataset.filter) {
            filter.value = link.dataset.filter;
            listState[panel.dataset.resource].filters.status = link.dataset.filter;
            listState[panel.dataset.resource].page = 1;
        }
        changeTab(link.dataset.openTab);
    });
});

document.querySelectorAll("[data-create]").forEach((button) => {
    button.addEventListener("click", () => {
        ({ jobs: openJobModal, companies: openCompanyModal, users: openUserModal })[button.dataset.create]();
    });
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModals);
});

document.querySelectorAll(".admin-modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModals();
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModals();
});

document.getElementById("user-role").addEventListener("change", updateUserCompanyField);

document.getElementById("admin-logout-button").addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try {
        await window.JobBoardAuth.request({ method: "POST", body: JSON.stringify({ action: "logout" }) });
    } finally {
        window.location.href = "admin.html";
    }
});

// Connexion admin intégrée. L'administration a sa propre session : se connecter
// ici ne touche pas au compte candidat ou entreprise ouvert dans un autre onglet.

function showAdminLogin() {
    document.body.classList.add("is-admin-login");
    document.getElementById("admin-login").hidden = false;
    document.body.hidden = false;
    document.getElementById("admin-login-email").focus();
}

document.getElementById("admin-login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const error = document.getElementById("admin-login-error");
    const submit = form.querySelector('[type="submit"]');
    error.textContent = "";
    submit.disabled = true;

    try {
        await window.JobBoardAuth.request({
            method: "POST",
            body: JSON.stringify({
                action: "login",
                email: form.elements.namedItem("email").value.trim(),
                password: form.elements.namedItem("password").value
            })
        });
        window.location.reload();
    } catch (failure) {
        error.textContent = failure.message;
        submit.disabled = false;
    }
});

// Initialisation : page réservée au rôle admin.

(async function initAdmin() {
    try {
        currentAdmin = await window.JobBoardAuth.getUser();
    } catch (error) {
        console.error("Impossible de vérifier la session :", error);
    }

    if (!currentAdmin || currentAdmin.role !== "admin") {
        showAdminLogin();
        currentAdmin = null;
        return;
    }

    document.getElementById("admin-user-name").textContent =
        `${currentAdmin.first_name} ${currentAdmin.last_name}`.trim();
    document.body.hidden = false;

    setupListControls();
    await loadAllCompanies();

    const initialTab = window.location.hash.slice(1);
    changeTab(document.getElementById(initialTab)?.classList.contains("admin-panel")
        ? initialTab
        : "dashboard-panel");
    if (initialTab && initialTab !== "dashboard-panel") loadDashboard();
})();
