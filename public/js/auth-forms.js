// Formulaires de connexion et d'inscription (login.html, register.html).
// Après succès, chaque rôle est redirigé vers sa page d'accueil.

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("auth-form");
    const feedback = document.getElementById("auth-feedback");
    if (!form || !feedback) return;

    const action = form.dataset.action;
    const submit = form.querySelector('[type="submit"]');
    const accountType = document.getElementById("account-type");
    const companyFields = document.getElementById("company-fields");
    const companyName = document.getElementById("company-name");
    const companyLocation = document.getElementById("company-location");
    const companySiret = document.getElementById("company-siret");
    const returnTo = new URLSearchParams(window.location.search).get("return");
    const query = new URLSearchParams(window.location.search);
    const emailField = form.elements.namedItem("email");
    const accountSwitch = document.querySelector(
        '.auth-switch a[href^="register.html"], .auth-switch a[href^="login.html"]'
    );

    if (action === "login" && emailField && query.has("email")) {
        emailField.value = query.get("email");
    }

    if (returnTo && accountSwitch) {
        const switchUrl = new URL(accountSwitch.href);
        switchUrl.searchParams.set("return", returnTo);
        accountSwitch.href = switchUrl.toString();
    }

    function updateAccountTypeFields() {
        if (!accountType || !companyFields) return;
        const isCompany = accountType.value === "company";
        companyFields.hidden = !isCompany;
        companyName.required = isCompany;
        companyLocation.required = isCompany;
        if (companySiret) companySiret.required = isCompany;
    }

    // Affiche le SIRET par groupes (3 3 3 5) pendant la saisie.
    if (companySiret) {
        companySiret.addEventListener("input", () => {
            const digits = companySiret.value.replace(/\D/g, "").slice(0, 14);
            companySiret.value = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9)]
                .filter(Boolean)
                .join(" ");
        });
    }

    if (accountType) {
        accountType.addEventListener("change", updateAccountTypeFields);
        updateAccountTypeFields();
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        feedback.textContent = "";
        feedback.classList.remove("error");
        submit.disabled = true;
        submit.textContent = "Patientez...";

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.action = action;

        try {
            const result = await window.JobBoardAuth.request({
                method: "POST",
                body: JSON.stringify(payload)
            });

            const requestedReturn = query.get("return");
            const userRole = result.user && result.user.role;
            let destination = window.JobBoardAuth.homeFor(userRole);
            if (requestedReturn && userRole !== "admin") {
                const requestedUrl = new URL(requestedReturn, window.location.href);
                const requestedPage = requestedUrl.pathname.split("/").pop();
                const allowedPages = userRole === "company"
                    ? ["company-dashboard.html"]
                    : [
                        "profile.html",
                        "alerts.html",
                        "app.html",
                        "apply.html"
                    ];
                if (
                    requestedUrl.origin === window.location.origin &&
                    allowedPages.includes(requestedPage)
                ) {
                    destination = `${requestedPage}${requestedUrl.search}${requestedUrl.hash}`;
                }
            }

            window.location.href = destination;
        } catch (error) {
            feedback.textContent = error.message;
            feedback.classList.add("error");
            submit.disabled = false;
            submit.textContent = action === "login"
                ? "Se connecter"
                : "Créer mon compte";
        }
    });
});
