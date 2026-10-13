(() => {
    const API_URL = "http://127.0.0.1:8001/api/auth/";
    const UNAUTHENTICATED_MESSAGES = [
        "Vous devez être connecté.",
        "La session n'est plus valide.",
        "Session expirée.",
        "Non autorisé.",
        "Unauthorized",
        "Unauthorized request",
        "Connectez-vous pour consulter"
    ];

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

    window.JobBoardAuth = {
        request,
        getUser,
        loginUrl,
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
