// Petit client partagé par toutes les pages pour parler à /api/auth/ :
// récupérer l'utilisateur connecté, envoyer une action, rediriger vers la connexion.

(() => {
    const isLocalFrontend = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const API_URL = isLocalFrontend
        ? `http://${window.location.hostname}:8001/api/auth/`
        : `${window.location.origin}/api/auth/`;
    const UNAUTHENTICATED_MESSAGES = [
        "Vous devez être connecté.",
        "La session n'est plus valide.",
        "Session expirée.",
        "Non autorisé.",
        "Unauthorized",
        "Unauthorized request",
        "Connectez-vous pour consulter"
    ];

    // La page d'administration utilise sa propre session (cookie séparé côté API),
    // pour ne pas se mélanger avec le compte candidat ou entreprise des autres onglets.
    const SESSION_SCOPE = document.documentElement.dataset.sessionScope === "admin"
        ? "admin"
        : "site";
    const scopeHeaders = SESSION_SCOPE === "admin" ? { "X-Session-Scope": "admin" } : {};

    function parseJsonSafely(response) {
        return response.text().then((text) => {
            if (!text) return {};

            try {
                return JSON.parse(text);
            } catch (error) {
                return { error: text.trim() || "Réponse serveur invalide." };
            }
        });
    }

    async function request(options = {}) {
        try {
            const response = await fetch(API_URL, {
                ...options,
                credentials: "include",
                headers: {
                    ...(options.method && options.method !== "GET" ? { "Content-Type": "application/json" } : {}),
                    ...scopeHeaders,
                    ...(options.headers || {})
                }
            });
            const data = await parseJsonSafely(response);

            if (!response.ok) {
                throw new Error(data.error || data.message || `Erreur HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            if (error instanceof TypeError && error.message === "Failed to fetch") {
                throw new Error("Le serveur d'authentification est indisponible.");
            }
            throw error;
        }
    }

    async function getUser() {
        try {
            const result = await request({ method: "GET" });
            return result.user ?? null;
        } catch (error) {
            const errorMessage = error.message || "";
            if (
                UNAUTHENTICATED_MESSAGES.some((message) => errorMessage.includes(message)) ||
                errorMessage.includes("Le serveur d'authentification est indisponible.")
            ) {
                return null;
            }
            throw error;
        }
    }

    function loginUrl() {
        const returnTo = encodeURIComponent(
            window.location.pathname.split("/").pop() + window.location.search
        );
        return `login.html?return=${returnTo}`;
    }

    // Page d'accueil selon le rôle : admin, entreprise ou candidat.
    function homeFor(role) {
        if (role === "admin") return "admin.html";
        if (role === "company") return "company-dashboard.html";
        return "index.html";
    }

    window.JobBoardAuth = {
        request,
        getUser,
        loginUrl,
        homeFor,
        requireUser: async () => {
            const user = await getUser();
            if (!user) {
                window.location.href = loginUrl();
                return null;
            }
            return user;
        }
    };
})();
