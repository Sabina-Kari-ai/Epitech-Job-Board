(() => {
    const API_URL = "http://127.0.0.1:8001/api/auth/";

    async function request(options = {}) {
        const response = await fetch(API_URL, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || `Erreur HTTP ${response.status}`);
        }

        return data;
    }

    async function getUser() {
        try {
            const result = await request({ method: "GET" });
            return result.user;
        } catch (error) {
            if (error.message === "Vous devez être connecté." ||
                error.message === "La session n'est plus valide.") {
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
