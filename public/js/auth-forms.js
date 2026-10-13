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
    const returnTo = new URLSearchParams(window.location.search).get("return");
    const query = new URLSearchParams(window.location.search);
    const emailField = form.elements.namedItem("email");
    const accountSwitch = document.querySelector(".auth-switch a");

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
            let destination = userRole === "company"
                ? "company-dashboard.html"
                : "index.html";
            if (requestedReturn) {
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
