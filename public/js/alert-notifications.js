// Pastille de la cloche : nombre d'offres publiées depuis la dernière visite
// de la page des alertes et qui correspondent à au moins une alerte.

(() => {
    const JOBS_API_URL = `http://${window.location.hostname}:8001/api/jobs/`;

    function normalize(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase()
            .trim();
    }

    function getAlerts(userId) {
        const alerts = JSON.parse(
            localStorage.getItem(`jobboard_alerts_${userId}`) || "[]"
        );
        if (!Array.isArray(alerts)) {
            throw new Error("Le format des alertes enregistrées est invalide.");
        }
        return alerts;
    }

    async function getJobs() {
        const response = await fetch(JOBS_API_URL);
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        const jobs = await response.json();
        if (!Array.isArray(jobs)) {
            throw new Error("Le format des offres est invalide.");
        }
        return jobs;
    }

    function matchesAlert(job, alert) {
        if (!alert.enabled) return false;
        const keyword = normalize(alert.keyword);
        const location = normalize(alert.location);
        const contract = normalize(alert.contract);
        const searchableText = normalize([
            job.title,
            job.short_description,
            job.description,
            job.company
        ].join(" "));

        return (
            (!keyword || searchableText.includes(keyword)) &&
            (!location || normalize(job.location).includes(location)) &&
            (!contract || normalize(job.contract_type) === contract)
        );
    }

    function matchingJobs(jobs, alerts) {
        const activeAlerts = alerts.filter((alert) => alert.enabled);
        return jobs.filter((job) =>
            activeAlerts.some((alert) => matchesAlert(job, alert))
        );
    }

    function getLastViewed(userId) {
        const key = `jobboard_alerts_last_viewed_${userId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            const timestamp = Date.parse(saved);
            if (!Number.isNaN(timestamp)) return timestamp;
        }

        const now = Date.now();
        localStorage.setItem(key, new Date(now).toISOString());
        return now;
    }

    async function getMatchingJobs(userId) {
        const [jobs, alerts] = await Promise.all([
            getJobs(),
            Promise.resolve(getAlerts(userId))
        ]);
        return matchingJobs(jobs, alerts);
    }

    async function updateBadge(user) {
        if (!user || user.role !== "candidate") return;

        try {
            const [jobs, alerts] = await Promise.all([
                getJobs(),
                Promise.resolve(getAlerts(user.id))
            ]);
            const lastViewed = getLastViewed(user.id);
            const unreadCount = matchingJobs(jobs, alerts).filter((job) => {
                const createdAt = Date.parse(job.created_at || "");
                return !Number.isNaN(createdAt) && createdAt > lastViewed;
            }).length;

            document.querySelectorAll('a[href="alerts.html"]').forEach((link) => {
                let badge = link.querySelector(".notification-count");
                if (unreadCount === 0) {
                    if (badge) badge.remove();
                    link.setAttribute("aria-label", "Mes alertes emploi");
                    link.title = "Mes alertes";
                    return;
                }

                if (!badge) {
                    badge = document.createElement("span");
                    badge.className = "notification-count";
                    badge.setAttribute("aria-hidden", "true");
                    link.appendChild(badge);
                }
                badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
                link.setAttribute(
                    "aria-label",
                    `${unreadCount} nouvelle${unreadCount > 1 ? "s" : ""} offre${unreadCount > 1 ? "s" : ""} correspondant à vos alertes`
                );
                link.title = `${unreadCount} nouvelle${unreadCount > 1 ? "s" : ""} offre${unreadCount > 1 ? "s" : ""}`;
            });
        } catch (error) {
            console.error("Impossible de charger les notifications d’alertes :", error);
        }
    }

    function markViewed(userId) {
        localStorage.setItem(
            `jobboard_alerts_last_viewed_${userId}`,
            new Date().toISOString()
        );
        document.dispatchEvent(new CustomEvent("jobboard:alerts-viewed"));
    }

    window.JobBoardAlertNotifications = {
        getMatchingJobs,
        markViewed,
        updateBadge
    };
})();
