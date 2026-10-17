// Espace entreprise : tableau de bord, publication d'offres, suivi des
// candidatures, notifications et paramètres du compte.
// Tant que l'inscription n'est pas validée par un admin, la publication est verrouillée.

document.addEventListener("DOMContentLoaded", async () => {
    const $ = (selector, parent = document) => parent.querySelector(selector);
    const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

    const isLocalFrontend = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const API_BASE = isLocalFrontend
        ? `http://${window.location.hostname}:8001`
        : window.location.origin;
    const API = {
        jobs: `${API_BASE}/api/jobs/`,
        applications: `${API_BASE}/api/app/`,
        notifications: `${API_BASE}/api/notifications/`,
        logo: `${API_BASE}/api/companies/logo.php`,
        auth: `${API_BASE}/api/auth/`
    };
    const STATUS_LABELS = {
        pending: "En attente",
        reviewing: "En cours d'étude",
        interview: "Entretien",
        accepted: "Acceptée",
        rejected: "Refusée"
    };
    const COMPANY_STATUS_LABELS = { pending: "En attente de validation", approved: "Validée", rejected: "Refusée" };
    const NOTIFICATION_POLL_MS = 30000;

    let user = null;
    let jobs = [];
    let applications = [];
    let notifications = [];

    // Outils.

    function el(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined && text !== null) element.textContent = String(text);
        return element;
    }

    function parseDate(value) {
        return value ? new Date(String(value).replace(" ", "T")) : null;
    }

    function formatDate(value) {
        const date = parseDate(value);
        return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("fr-FR") : "";
    }

    function timeAgo(value) {
        const date = parseDate(value);
        if (!date) return "";
        const minutes = Math.round((Date.now() - date.getTime()) / 60000);
        if (minutes < 1) return "à l'instant";
        if (minutes < 60) return `il y a ${minutes} min`;
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `il y a ${hours} h`;
        const days = Math.round(hours / 24);
        return days < 7 ? `il y a ${days} j` : formatDate(value);
    }

    function initials(text) {
        return String(text || "?").split(/\s+/).filter(Boolean).slice(0, 2)
            .map((part) => part[0]).join("").toUpperCase() || "?";
    }

    function formatSiret(siret) {
        return siret ? siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4") : "Non renseigné";
    }

    async function request(url, options = {}) {
        const isForm = options.body instanceof FormData;
        const response = await fetch(url, {
            ...options,
            credentials: "include",
            headers: options.body && !isForm ? { "Content-Type": "application/json" } : {}
        });
        const text = await response.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            throw new Error(`Erreur serveur (${response.status}).`);
        }
        if (!response.ok) {
            throw new Error(data.error || data.message || `Erreur serveur (${response.status}).`);
        }
        return data;
    }

    function feedback(element, message, type = "success") {
        if (!element) return;
        element.textContent = message;
        element.className = `co-feedback ${message ? `is-${type}` : ""}`;
    }

    let toastTimer = null;
    function toast(message, isError = false) {
        const box = $("#co-toast");
        box.textContent = message;
        box.classList.toggle("error", isError);
        box.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            box.hidden = true;
        }, 3500);
    }

    function emptyState(container, message) {
        container.replaceChildren(el("p", "co-empty", message));
    }

    function setCount(selector, value) {
        const badge = $(selector);
        if (!badge) return;
        badge.textContent = value ? String(value) : "";
        badge.hidden = !value;
    }

    // Authentification : espace réservé aux comptes entreprise.

    try {
        user = await window.JobBoardAuth.getUser();
    } catch (error) {
        console.error("Session indisponible :", error);
    }
    if (!user) {
        window.location.href = window.JobBoardAuth.loginUrl();
        return;
    }
    if (user.role !== "company") {
        window.location.href = window.JobBoardAuth.homeFor(user.role);
        return;
    }

    const isApproved = () => user.company_status === "approved";

    // Identité et statut de l'inscription.

    function renderIdentity() {
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        const companyName = user.company_name || "Mon entreprise";

        $("#co-user-name").textContent = fullName;
        $("#co-avatar").textContent = initials(fullName);
        $("#co-brand-name").textContent = companyName;
        $("#co-welcome").textContent = `Bonjour ${user.first_name || ""} 👋`;
        $("#co-brand-initials").textContent = initials(companyName);
        $("#logo-placeholder").textContent = initials(companyName);

        const pill = $("#co-status-pill");
        pill.textContent = COMPANY_STATUS_LABELS[user.company_status] || "";
        pill.className = `co-status-pill is-${user.company_status}`;

        displayLogo(user.logo_path);

        const banner = $("#co-status-banner");
        const locked = $("#job-form-locked");
        const form = $("#job-form");
        if (isApproved()) {
            banner.hidden = true;
            locked.hidden = true;
            form.hidden = false;
        } else {
            const rejected = user.company_status === "rejected";
            banner.hidden = false;
            banner.className = `co-banner ${rejected ? "is-rejected" : "is-pending"}`;
            $(".co-banner-icon", banner).textContent = rejected ? "⛔" : "⏳";
            $("#co-banner-title").textContent = rejected
                ? "Votre inscription a été refusée"
                : "Votre inscription est en cours de validation";
            const text = rejected
                ? "Vous ne pouvez pas publier d'offre. Contactez l'administration de JobBoard pour plus d'informations."
                : `Notre équipe vérifie votre SIRET (${formatSiret(user.company_siret)}). Vous pourrez publier vos offres dès la validation ; vous recevrez une notification.`;
            $("#co-banner-text").textContent = text;
            $("#job-form-locked-text").textContent = text;
            locked.hidden = false;
            form.hidden = true;
        }

        $$("[data-requires-approval]").forEach((button) => {
            button.disabled = !isApproved();
            button.title = isApproved() ? "" : "Disponible après validation de votre inscription";
        });

        const values = {
            "#settings-company-name": user.company_name,
            "#settings-company-location": user.company_location,
            "#settings-company-description": user.company_description,
            "#settings-siret": formatSiret(user.company_siret),
            "#settings-status": COMPANY_STATUS_LABELS[user.company_status],
            "#settings-first-name": user.first_name,
            "#settings-last-name": user.last_name,
            "#settings-email": user.email
        };
        Object.entries(values).forEach(([selector, value]) => {
            const field = $(selector);
            if (field) field.value = value || "";
        });
    }

    function displayLogo(path) {
        const url = path ? new URL(path, `${API_BASE}/`).href : "";
        [["#co-brand-logo", "#co-brand-initials"], ["#logo-preview", "#logo-placeholder"]].forEach(([imageSelector, fallbackSelector]) => {
            const image = $(imageSelector);
            const fallback = $(fallbackSelector);
            if (!url) {
                image.hidden = true;
                fallback.hidden = false;
                return;
            }
            image.onload = () => {
                image.hidden = false;
                fallback.hidden = true;
            };
            image.onerror = () => {
                image.hidden = true;
                fallback.hidden = false;
            };
            image.src = `${url}?t=${Date.now()}`;
        });
    }

    // Navigation entre les sections.

    const sections = $$(".co-section");

    function showSection(id, updateHash = true) {
        if (!sections.some((section) => section.id === id)) id = "dashboard-section";
        sections.forEach((section) => {
            section.hidden = section.id !== id;
        });
        $$(".co-menu-item").forEach((item) => {
            item.classList.toggle("is-active", item.dataset.go === id);
        });
        if (updateHash && window.location.hash !== `#${id}`) {
            history.replaceState(null, "", `#${id}`);
        }
        $("#notif-panel").hidden = true;
        $("#notif-toggle").setAttribute("aria-expanded", "false");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-go]");
        if (!trigger || trigger.disabled) return;
        if (trigger.dataset.go === "create-job-section" && !trigger.closest("#jobs-list")) resetJobForm();
        showSection(trigger.dataset.go);
    });

    window.addEventListener("hashchange", () => showSection(window.location.hash.slice(1), false));

    // Offres.

    function jobCard(job, compact = false) {
        const card = el("article", "co-job-card");
        const count = Number(job.applications_count) || 0;

        const top = el("div", "co-job-card-top");
        top.append(el("span", "co-chip", job.contract_type), el("span", "co-job-date", `Publiée le ${formatDate(job.created_at)}`));

        const meta = el("p", "co-job-meta", [job.location, job.salary].filter(Boolean).join(" · "));
        const stats = el("button", "co-job-stat", `${count} candidature${count > 1 ? "s" : ""}`);
        stats.type = "button";
        stats.addEventListener("click", () => {
            $("#applications-job-filter").value = String(job.id);
            renderApplications();
            showSection("applications-section");
        });

        card.append(top, el("h3", "", job.title), meta);
        if (!compact) card.append(el("p", "co-job-summary", job.short_description));
        card.append(stats);

        if (!compact) {
            const actions = el("div", "co-job-actions");
            const view = el("a", "btn btn-outline", "Voir l'annonce");
            view.href = `job.html?id=${encodeURIComponent(job.id)}`;
            view.target = "_blank";
            view.rel = "noopener";

            const edit = el("button", "btn btn-outline", "Modifier");
            edit.type = "button";
            edit.disabled = !isApproved();
            edit.addEventListener("click", () => beginJobEdit(job));

            const remove = el("button", "btn btn-danger", "Supprimer");
            remove.type = "button";
            if (count > 0) {
                remove.disabled = true;
                remove.title = "Une offre qui a reçu des candidatures ne peut pas être supprimée.";
            }
            remove.addEventListener("click", () => deleteJob(job, remove));

            actions.append(view, edit, remove);
            card.append(actions);
        }
        return card;
    }

    function renderJobs() {
        const list = $("#jobs-list");
        const recent = $("#recent-jobs");
        if (!jobs.length) {
            emptyState(list, isApproved()
                ? "Vous n'avez encore publié aucune offre."
                : "Vous pourrez publier vos offres après la validation de votre inscription.");
            emptyState(recent, "Aucune offre publiée pour le moment.");
        } else {
            list.replaceChildren(...jobs.map((job) => jobCard(job)));
            recent.replaceChildren(...jobs.slice(0, 3).map((job) => jobCard(job, true)));
        }

        $("#kpi-jobs").textContent = String(jobs.length);
        setCount("#menu-jobs-count", jobs.length);

        const filter = $("#applications-job-filter");
        const selected = filter.value;
        filter.replaceChildren(el("option", "", "Toutes les offres"), ...jobs.map((job) => {
            const option = el("option", "", job.title);
            option.value = String(job.id);
            return option;
        }));
        filter.firstChild.value = "";
        filter.value = jobs.some((job) => String(job.id) === selected) ? selected : "";
    }

    async function loadJobs() {
        try {
            const result = await request(`${API.jobs}?mine=1`);
            jobs = Array.isArray(result) ? result : [];
            renderJobs();
        } catch (error) {
            emptyState($("#jobs-list"), error.message);
        }
    }

    async function deleteJob(job, button) {
        if (!window.confirm(`Supprimer l'offre « ${job.title} » ?`)) return;
        button.disabled = true;
        try {
            const result = await request(`${API.jobs}?id=${encodeURIComponent(job.id)}`, { method: "DELETE" });
            toast(result.message || "Offre supprimée.");
            await loadJobs();
        } catch (error) {
            toast(error.message, true);
            button.disabled = false;
        }
    }

    // Formulaire d'offre (création et modification).

    const jobForm = $("#job-form");

    function resetJobForm() {
        jobForm.reset();
        jobForm.elements.namedItem("id").value = "";
        $("#job-form-heading").textContent = "Publier une offre";
        $("#save-job-button").textContent = "Publier l'offre";
        $("#cancel-job-edit").hidden = true;
        $("#short-description-count").textContent = "0";
        feedback($("#job-form-feedback"), "");
    }

    function beginJobEdit(job) {
        resetJobForm();
        ["id", "title", "location", "contract_type", "salary", "short_description", "description"].forEach((name) => {
            jobForm.elements.namedItem(name).value = job[name] ?? "";
        });
        jobForm.elements.namedItem("cover_letter_required").checked = Number(job.cover_letter_required) === 1;
        $("#short-description-count").textContent = String((job.short_description || "").length);
        $("#job-form-heading").textContent = "Modifier l'offre";
        $("#save-job-button").textContent = "Enregistrer les modifications";
        $("#cancel-job-edit").hidden = false;
        showSection("create-job-section");
        $("#job-title").focus();
    }

    $("#job-short-description").addEventListener("input", (event) => {
        $("#short-description-count").textContent = String(event.target.value.length);
    });

    $("#cancel-job-edit").addEventListener("click", () => {
        resetJobForm();
        showSection("jobs-section");
    });

    jobForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(jobForm).entries());
        const id = values.id;
        const payload = {
            title: values.title.trim(),
            location: values.location.trim(),
            contract_type: values.contract_type,
            salary: values.salary.trim(),
            short_description: values.short_description.trim(),
            description: values.description.trim(),
            cover_letter_required: jobForm.elements.namedItem("cover_letter_required").checked
        };
        if (id) payload.id = Number(id);

        const button = $("#save-job-button");
        button.disabled = true;
        try {
            const result = await request(API.jobs, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
            toast(result.message || "Offre enregistrée.");
            resetJobForm();
            await loadJobs();
            showSection("jobs-section");
        } catch (error) {
            feedback($("#job-form-feedback"), error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    // Candidatures.

    function applicationCard(application) {
        const card = el("article", `co-application is-${application.status}`);

        const header = el("div", "co-application-header");
        const who = el("div", "co-application-who");
        const identity = el("div");
        identity.append(
            el("strong", "", application.candidate_name),
            el("span", "", `${application.job_title} · reçue ${timeAgo(application.created_at)}`)
        );
        who.append(el("span", "co-avatar", initials(application.candidate_name)), identity);

        const status = el("select", `co-status-select is-${application.status}`);
        status.setAttribute("aria-label", `Statut de la candidature de ${application.candidate_name}`);
        Object.entries(STATUS_LABELS).forEach(([value, label]) => {
            const option = el("option", "", label);
            option.value = value;
            status.append(option);
        });
        status.value = application.status;
        status.addEventListener("change", () => updateStatus(application, status));
        header.append(who, status);

        const contact = el("div", "co-application-contact");
        const email = el("a", "", `✉ ${application.candidate_email}`);
        email.href = `mailto:${application.candidate_email}`;
        contact.append(email);
        if (application.candidate_phone) {
            const phone = el("a", "", `☎ ${application.candidate_phone}`);
            phone.href = `tel:${application.candidate_phone.replace(/\s+/g, "")}`;
            contact.append(phone);
        }

        card.append(header, contact);

        const message = el("details", "co-application-message");
        message.append(el("summary", "", "Message du candidat"), el("p", "", application.message || "Aucun message."));
        if (application.cover_letter) {
            message.append(el("h4", "", "Lettre de motivation"), el("p", "", application.cover_letter));
        }
        card.append(message);

        const files = el("div", "co-application-files");
        [["cv", application.cv_file_name, "CV"], ["cover-letter", application.cover_letter_file_name, "Lettre"]]
            .forEach(([type, name, label]) => {
                if (!name) return;
                const link = el("a", "btn btn-outline", `📄 ${label}`);
                link.href = `${API.applications}?id=${encodeURIComponent(application.id)}&attachment=${type}`;
                link.target = "_blank";
                link.rel = "noopener";
                link.title = name;
                files.append(link);
            });
        if (files.childElementCount) card.append(files);
        return card;
    }

    function renderApplications() {
        const search = $("#applications-search").value.trim().toLowerCase();
        const jobFilter = $("#applications-job-filter").value;
        const statusFilter = $("#applications-status-filter").value;

        const filtered = applications.filter((application) =>
            (!jobFilter || String(application.job_id) === jobFilter) &&
            (!statusFilter || application.status === statusFilter) &&
            (!search || `${application.candidate_name} ${application.candidate_email}`.toLowerCase().includes(search))
        );

        const list = $("#applications-list");
        if (!filtered.length) {
            emptyState(list, applications.length
                ? "Aucune candidature ne correspond à ces filtres."
                : "Aucune candidature reçue pour le moment.");
        } else {
            list.replaceChildren(...filtered.map(applicationCard));
        }

        const recent = $("#recent-applications");
        if (!applications.length) {
            emptyState(recent, "Les candidatures à vos offres apparaîtront ici.");
        } else {
            recent.replaceChildren(...applications.slice(0, 5).map((application) => {
                const item = el("button", "co-list-item");
                item.type = "button";
                const text = el("div");
                text.append(
                    el("strong", "", application.candidate_name),
                    el("span", "", `${application.job_title} · ${timeAgo(application.created_at)}`)
                );
                item.append(
                    el("span", "co-avatar", initials(application.candidate_name)),
                    text,
                    el("span", `status ${application.status}`, STATUS_LABELS[application.status])
                );
                item.addEventListener("click", () => {
                    $("#applications-search").value = application.candidate_name;
                    renderApplications();
                    showSection("applications-section");
                });
                return item;
            }));
        }

        const pending = applications.filter((application) => application.status === "pending").length;
        $("#kpi-applications").textContent = String(applications.length);
        $("#kpi-pending").textContent = String(pending);
        $("#kpi-interviews").textContent = String(applications.filter((application) => application.status === "interview").length);
        setCount("#menu-applications-count", pending);
    }

    async function loadApplications() {
        try {
            const result = await request(API.applications);
            applications = Array.isArray(result) ? result : [];
            renderApplications();
        } catch (error) {
            emptyState($("#applications-list"), error.message);
        }
    }

    async function updateStatus(application, select) {
        const previous = application.status;
        select.disabled = true;
        try {
            await request(API.applications, {
                method: "PUT",
                body: JSON.stringify({ id: Number(application.id), status: select.value })
            });
            application.status = select.value;
            toast(`Statut mis à jour : ${STATUS_LABELS[select.value]}. Le candidat a été notifié.`);
            renderApplications();
        } catch (error) {
            select.value = previous;
            toast(error.message, true);
        } finally {
            select.disabled = false;
        }
    }

    ["#applications-search", "#applications-job-filter", "#applications-status-filter"].forEach((selector) => {
        $(selector).addEventListener(selector === "#applications-search" ? "input" : "change", renderApplications);
    });

    // Notifications.

    const NOTIFICATION_ICONS = { new_application: "✉", company_approved: "✅", company_rejected: "⛔" };

    function notificationItem(notification) {
        const item = el("button", `co-notif-item ${Number(notification.is_read) ? "" : "is-unread"}`);
        item.type = "button";
        const text = el("div");
        text.append(
            el("strong", "", notification.title),
            el("p", "", notification.message),
            el("span", "", timeAgo(notification.created_at))
        );
        item.append(el("span", "co-notif-icon", NOTIFICATION_ICONS[notification.type] || "•"), text);
        item.addEventListener("click", () => openNotification(notification));
        return item;
    }

    function renderNotifications(unreadCount) {
        const lists = [
            ["#notif-dropdown-list", notifications.slice(0, 6)],
            ["#recent-notifications", notifications.slice(0, 4)],
            ["#notifications-list", notifications]
        ];
        lists.forEach(([selector, items]) => {
            const container = $(selector);
            if (!items.length) {
                emptyState(container, "Aucune notification pour le moment.");
            } else {
                container.replaceChildren(...items.map(notificationItem));
            }
        });

        const counter = $("#notif-count");
        counter.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
        counter.hidden = unreadCount === 0;
        setCount("#menu-notif-count", unreadCount);
        document.title = unreadCount ? `(${unreadCount}) Espace entreprise | JobBoard` : "Espace entreprise | JobBoard";
    }

    async function loadNotifications() {
        try {
            const result = await request(API.notifications);
            const hadApproval = notifications.some((notification) => notification.type === "company_approved");
            notifications = result.notifications || [];
            renderNotifications(result.unread_count || 0);

            // Validation reçue pendant la session : on déverrouille la publication.
            const approvedNow = notifications.some((notification) => notification.type === "company_approved");
            if (!isApproved() && approvedNow && !hadApproval) {
                const refreshed = await window.JobBoardAuth.getUser();
                if (refreshed) {
                    user = refreshed;
                    renderIdentity();
                    renderJobs();
                }
            }
            // Nouvelle candidature : on rafraîchit la liste.
            if (result.notifications?.some((notification) => notification.type === "new_application" && !Number(notification.is_read))) {
                const known = new Set(applications.map((application) => String(application.id)));
                if (result.notifications.some((notification) => notification.application_id && !known.has(String(notification.application_id)))) {
                    await Promise.all([loadApplications(), loadJobs()]);
                }
            }
        } catch (error) {
            console.error("Notifications indisponibles :", error);
        }
    }

    async function markRead(body) {
        try {
            await request(API.notifications, { method: "PUT", body: JSON.stringify(body) });
            await loadNotifications();
        } catch (error) {
            toast(error.message, true);
        }
    }

    async function openNotification(notification) {
        if (!Number(notification.is_read)) await markRead({ id: Number(notification.id) });
        if (notification.application_id) {
            const application = applications.find((item) => String(item.id) === String(notification.application_id));
            $("#applications-search").value = application ? application.candidate_name : "";
            $("#applications-job-filter").value = "";
            $("#applications-status-filter").value = "";
            renderApplications();
            showSection("applications-section");
        } else if (notification.type === "company_approved") {
            showSection("create-job-section");
        }
    }

    $("#notif-toggle").addEventListener("click", (event) => {
        event.stopPropagation();
        const panel = $("#notif-panel");
        panel.hidden = !panel.hidden;
        event.currentTarget.setAttribute("aria-expanded", String(!panel.hidden));
    });
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".co-notif")) $("#notif-panel").hidden = true;
    });
    $("#notif-mark-all").addEventListener("click", () => markRead({ all: true }));
    $("#notif-mark-all-page").addEventListener("click", () => markRead({ all: true }));

    // Paramètres.

    function bindForm(selector, buildRequest, onSuccess) {
        const form = $(selector);
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const output = $(".co-feedback", form);
            const button = $('[type="submit"]', form);
            button.disabled = true;
            feedback(output, "");
            try {
                const result = await request(...buildRequest(form));
                feedback(output, result.message || "Enregistré.", "success");
                if (onSuccess) await onSuccess(result, form);
            } catch (error) {
                feedback(output, error.message, "error");
            } finally {
                button.disabled = false;
            }
        });
    }

    const jsonPost = (body) => ({ method: "POST", body: JSON.stringify(body) });
    const fields = (form) => Object.fromEntries(new FormData(form).entries());

    bindForm("#company-profile-form", (form) => [API.auth, jsonPost({ action: "company_profile", ...fields(form) })], async () => {
        user = (await window.JobBoardAuth.getUser()) || user;
        renderIdentity();
    });

    bindForm("#company-email-form", (form) => [API.auth, jsonPost({ action: "change_email", ...fields(form) })], (result, form) => {
        user.email = result.email;
        form.elements.namedItem("current_password").value = "";
    });

    bindForm("#company-password-form", (form) => [API.auth, jsonPost({ action: "change_password", ...fields(form) })], (result, form) => {
        form.reset();
    });

    $("#company-logo").addEventListener("change", (event) => {
        const file = event.target.files[0];
        const output = $(".co-feedback", $("#company-logo-form"));
        if (!file) return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
            event.target.value = "";
            feedback(output, "Utilise une image PNG, JPG ou WebP de 2 Mo maximum.", "error");
            return;
        }
        const preview = $("#logo-preview");
        preview.onload = null;
        preview.src = URL.createObjectURL(file);
        preview.hidden = false;
        $("#logo-placeholder").hidden = true;
        feedback(output, "Aperçu : clique sur « Enregistrer le logo » pour le conserver.", "info");
    });

    bindForm("#company-logo-form", (form) => {
        const body = new FormData();
        body.append("logo", form.elements.namedItem("logo").files[0]);
        return [API.logo, { method: "POST", body }];
    }, (result, form) => {
        user.logo_path = result.logo_path;
        displayLogo(result.logo_path);
        form.reset();
    });

    // Déconnexion.

    $("#co-logout").addEventListener("click", async (event) => {
        event.currentTarget.disabled = true;
        try {
            await window.JobBoardAuth.request({ method: "POST", body: JSON.stringify({ action: "logout" }) });
        } finally {
            window.location.href = "index.html";
        }
    });

    // Initialisation.

    renderIdentity();
    document.body.hidden = false;
    showSection(window.location.hash.slice(1) || "dashboard-section", false);
    await Promise.all([loadJobs(), loadApplications(), loadNotifications()]);
    setInterval(loadNotifications, NOTIFICATION_POLL_MS);
});
