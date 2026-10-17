// Profil candidat : informations personnelles, documents (CV, lettre)
// et sécurité du compte (e-mail, mot de passe, suppression).

document.addEventListener("DOMContentLoaded", async () => {
    const profileForm = document.getElementById("profile-form");
    const profileFeedback = document.getElementById("profile-feedback");
    const documentsForm = document.getElementById("documents-form");
    const documentsFeedback = document.getElementById("documents-feedback");
    const documentsList = document.getElementById("documents-list");
    const profileMenuButton = document.querySelector(".profile-menu-button");
    const profileDropdown = document.querySelector(".profile-dropdown");
    const profileTabs = Array.from(document.querySelectorAll(".profile-tab"));
    const phoneCountry = document.getElementById("phone-country");
    const phoneField = document.getElementById("profile-phone");
    const languageField = document.getElementById("profile-language");

    const DOCUMENTS_API_URL = `http://${window.location.hostname}:8001/api/profile-documents/`;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];
    const callingCodes = {
        FR: "33", BE: "32", CH: "41", LU: "352", NL: "31", PT: "351",
        CA: "1", US: "1", GB: "44", DE: "49", ES: "34", IT: "39",
        DZ: "213", MA: "212", TN: "216", CM: "237", CD: "243",
        GH: "233", KE: "254", ML: "223", NG: "234", ZA: "27",
        SN: "221", CI: "225", AU: "61", BR: "55", CN: "86",
        IN: "91", JP: "81", MX: "52", NZ: "64", TR: "90",
        AE: "971", SA: "966"
    };
    const browserCountry = (navigator.language || "fr-FR").split("-")[1]?.toUpperCase();
    let user = null;
    let savedDocuments = [];

    // Les onglets sont reflétés dans l'URL (#documents…) pour pouvoir y revenir.
    function activateProfileTab(tab, updateHash = true) {
        const panelId = tab.getAttribute("aria-controls");
        const panel = document.getElementById(panelId);
        if (!panel) return;

        profileTabs.forEach((profileTab) => {
            const isActive = profileTab === tab;
            profileTab.setAttribute("aria-selected", String(isActive));
            profileTab.tabIndex = isActive ? 0 : -1;
            const controlledPanel = document.getElementById(
                profileTab.getAttribute("aria-controls")
            );
            if (controlledPanel) controlledPanel.hidden = !isActive;
        });

        if (updateHash && window.location.hash !== `#${panelId}`) {
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${window.location.search}#${panelId}`
            );
        }
    }

    profileTabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activateProfileTab(tab));
        tab.addEventListener("keydown", (event) => {
            let nextIndex = index;
            if (event.key === "ArrowRight") nextIndex = (index + 1) % profileTabs.length;
            else if (event.key === "ArrowLeft") {
                nextIndex = (index - 1 + profileTabs.length) % profileTabs.length;
            } else if (event.key === "Home") nextIndex = 0;
            else if (event.key === "End") nextIndex = profileTabs.length - 1;
            else return;

            event.preventDefault();
            profileTabs[nextIndex].focus();
            activateProfileTab(profileTabs[nextIndex]);
        });
    });

    function activateTabForHash() {
        const requestedTab = profileTabs.find(
            (tab) => `#${tab.getAttribute("aria-controls")}` === window.location.hash
        );
        if (requestedTab) activateProfileTab(requestedTab, false);
    }

    activateTabForHash();
    window.addEventListener("hashchange", activateTabForHash);

    function showFeedback(element, message, isError = false) {
        if (!element) return;
        element.textContent = message;
        element.classList.toggle("error", isError);
    }

    function fillProfile(data) {
        const values = {
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            city: data.city,
            linkedin: data.linkedin_url,
            bio: data.bio
        };

        Object.entries(values).forEach(([name, value]) => {
            const field = profileForm.elements.namedItem(name);
            if (field) field.value = value || "";
        });

        if (phoneCountry && phoneField) {
            const storedPhone = data.phone || "";
            const matchingCountries = Object.entries(callingCodes)
                .sort((left, right) => right[1].length - left[1].length)
                .filter(([, code]) => storedPhone.replace(/\D/g, "").startsWith(code));
            const matchingCountry = matchingCountries.find(([country]) =>
                country === browserCountry
            ) || matchingCountries[0];
            const country = matchingCountry?.[0] ||
                (phoneCountry.querySelector(`option[value="${browserCountry}"]`)
                    ? browserCountry
                    : "FR");
            phoneCountry.value = country;
            let nationalNumber = storedPhone;
            if (matchingCountry) {
                nationalNumber = storedPhone.replace(/^\s*\+/, "").replace(/\D/g, "");
                nationalNumber = nationalNumber.slice(matchingCountry[1].length);
            }
            phoneField.value = nationalNumber.replace(/[^\d]/g, "");
            if (phoneField.value.startsWith("0")) {
                phoneField.value = phoneField.value.slice(1);
            }
        }
    }

    async function loadProfile() {
        try {
            user = await window.JobBoardAuth.requireUser();
            if (!user) return;
            fillProfile(user);
            renderDocuments();
        } catch (error) {
            console.error("Impossible de charger le profil :", error);
            showFeedback(profileFeedback, error.message, true);
        }
    }

    if (profileForm) {
        profileForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(profileForm).entries());
            values.action = "profile";
            values.first_name = values.firstName;
            values.last_name = values.lastName;
            values.linkedin_url = values.linkedin || "";
            const nationalNumber = String(values.phone || "").replace(/\D/g, "");
            values.phone = nationalNumber
                ? `+${callingCodes[values.phoneCountry]}${nationalNumber.replace(/^0+/, "")}`
                : "";
            delete values.firstName;
            delete values.lastName;
            delete values.linkedin;
            delete values.phoneCountry;

            const button = profileForm.querySelector('[type="submit"]');
            button.disabled = true;

            try {
                const result = await window.JobBoardAuth.request({
                    method: "POST",
                    body: JSON.stringify(values)
                });
                user = result.user;
                fillProfile(user);
                showFeedback(profileFeedback, "Votre profil a été enregistré.");
            } catch (error) {
                showFeedback(profileFeedback, error.message, true);
            } finally {
                button.disabled = false;
            }
        });
    }

    const changeEmailForm = document.getElementById("change-email-form");
    if (changeEmailForm) {
        changeEmailForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const button = changeEmailForm.querySelector('[type="submit"]');
            const feedback = document.getElementById("change-email-feedback");
            button.disabled = true;
            try {
                const result = await window.JobBoardAuth.request({
                    method: "POST",
                    body: JSON.stringify({
                        action: "change_email",
                        email: document.getElementById("new-email").value.trim(),
                        current_password: document.getElementById("email-current-password").value
                    })
                });
                user.email = result.email;
                fillProfile(user);
                changeEmailForm.reset();
                showFeedback(feedback, result.message);
            } catch (error) {
                showFeedback(feedback, error.message, true);
            } finally {
                button.disabled = false;
            }
        });
    }

    const changePasswordForm = document.getElementById("change-password-form");
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const newPassword = document.getElementById("new-password").value;
            const confirmPassword = document.getElementById("confirm-new-password").value;
            const feedback = document.getElementById("change-password-feedback");
            if (newPassword !== confirmPassword) {
                showFeedback(feedback, "Les mots de passe ne correspondent pas.", true);
                return;
            }

            const button = changePasswordForm.querySelector('[type="submit"]');
            button.disabled = true;
            try {
                const result = await window.JobBoardAuth.request({
                    method: "POST",
                    body: JSON.stringify({
                        action: "change_password",
                        current_password: document.getElementById(
                            "password-current-password"
                        ).value,
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });
                changePasswordForm.reset();
                showFeedback(feedback, result.message);
            } catch (error) {
                showFeedback(feedback, error.message, true);
            } finally {
                button.disabled = false;
            }
        });
    }

    // Les documents sont stockés en base : on ne récupère ici que leurs noms.
    async function loadDocuments() {
        const response = await fetch(DOCUMENTS_API_URL, { credentials: "include" });
        const documents = await response.json();
        if (!response.ok) {
            throw new Error(documents.error || `Erreur HTTP ${response.status}`);
        }
        if (!Array.isArray(documents)) {
            throw new Error("La liste des documents reçue est invalide.");
        }
        savedDocuments = documents;
        renderDocuments();
    }

    function renderDocuments() {
        if (!documentsList || !user) return;
        documentsList.replaceChildren();

        if (savedDocuments.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-state";
            empty.textContent = "Aucun document enregistré.";
            documentsList.appendChild(empty);
            return;
        }

        savedDocuments.forEach((info) => {
            const item = document.createElement("article");
            item.className = "document-item";

            const content = document.createElement("div");
            content.className = "document-item-content";
            const title = document.createElement("h3");
            title.textContent = info.document_type === "cv"
                ? "Mon CV"
                : "Ma lettre de motivation";
            const filename = document.createElement("p");
            filename.textContent = info.file_name;
            content.append(title, filename);

            const actions = document.createElement("div");
            actions.className = "document-item-actions";

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "delete-document";
            remove.textContent = "Retirer";
            remove.addEventListener("click", async () => {
                remove.disabled = true;
                try {
                    const response = await fetch(
                        `${DOCUMENTS_API_URL}?type=${encodeURIComponent(info.document_type)}`,
                        { method: "DELETE", credentials: "include" }
                    );
                    const result = await response.json();
                    if (!response.ok) {
                        throw new Error(result.error || `Erreur HTTP ${response.status}`);
                    }
                    savedDocuments = savedDocuments.filter(
                        (documentInfo) => documentInfo.document_type !== info.document_type
                    );
                    renderDocuments();
                    showFeedback(documentsFeedback, "Document retiré.");
                } catch (error) {
                    showFeedback(documentsFeedback, error.message, true);
                    remove.disabled = false;
                }
            });

            actions.appendChild(remove);
            item.append(content, actions);
            documentsList.appendChild(item);
        });
    }

    if (documentsForm) {
        documentsForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!user) return;

            const selected = [
                ["cv", document.getElementById("cv-file")],
                ["coverLetter", document.getElementById("cover-letter-file")]
            ].filter(([, input]) => input.files.length > 0);

            if (selected.length === 0) {
                showFeedback(documentsFeedback, "Sélectionnez au moins un fichier.", true);
                return;
            }

            for (const [, input] of selected) {
                const file = input.files[0];
                const extension = file.name.split(".").pop().toLowerCase();
                const isCv = input.name === "cv";
                if (
                    !ALLOWED_EXTENSIONS.includes(extension) ||
                    (isCv && (
                        extension !== "pdf" ||
                        (file.type && file.type !== "application/pdf")
                    ))
                ) {
                    showFeedback(
                        documentsFeedback,
                        isCv
                            ? "Le CV doit être au format PDF."
                            : "Format accepté pour la lettre : PDF, DOC ou DOCX.",
                        true
                    );
                    return;
                }
                if (file.size > MAX_FILE_SIZE) {
                    showFeedback(documentsFeedback, "Chaque fichier doit faire 5 Mo maximum.", true);
                    return;
                }
            }

            const button = documentsForm.querySelector('[type="submit"]');
            button.disabled = true;
            try {
                for (const [key, input] of selected) {
                    const body = new FormData();
                    body.append("type", key === "cv" ? "cv" : "cover_letter");
                    body.append("file", input.files[0]);
                    const response = await fetch(DOCUMENTS_API_URL, {
                        method: "POST",
                        credentials: "include",
                        body
                    });
                    const result = await response.json();
                    if (!response.ok) {
                        throw new Error(result.error || `Erreur HTTP ${response.status}`);
                    }
                }
                await loadDocuments();
                documentsForm.reset();
                showFeedback(documentsFeedback, "Vos documents ont été enregistrés sur le serveur.");
            } catch (error) {
                showFeedback(documentsFeedback, error.message, true);
            } finally {
                button.disabled = false;
            }
        });
    }

    const deleteAccountForm = document.getElementById("delete-account-form");
    const deleteAccountFeedback = document.getElementById("delete-account-feedback");
    if (deleteAccountForm) {
        deleteAccountForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!user || !window.confirm(
                "La suppression effacera définitivement votre profil, vos documents et vos candidatures. Continuer ?"
            )) {
                return;
            }

            const button = deleteAccountForm.querySelector('[type="submit"]');
            button.disabled = true;
            showFeedback(deleteAccountFeedback, "Suppression du compte en cours...");
            try {
                await window.JobBoardAuth.request({
                    method: "POST",
                    body: JSON.stringify({
                        action: "delete_account",
                        password: document.getElementById("delete-account-password").value
                    })
                });
                [
                    `jobboard_alerts_${user.id}`,
                    `jobboard_alerts_last_viewed_${user.id}`,
                    `jobboard_document_names_${user.id}`
                ].forEach((key) => localStorage.removeItem(key));
                window.location.href = "index.html";
            } catch (error) {
                showFeedback(deleteAccountFeedback, error.message, true);
                button.disabled = false;
            }
        });
    }

    if (profileMenuButton && profileDropdown) {
        profileMenuButton.addEventListener("click", () => {
            const expanded = profileMenuButton.getAttribute("aria-expanded") === "true";
            profileMenuButton.setAttribute("aria-expanded", String(!expanded));
            profileDropdown.hidden = expanded;
        });

        document.addEventListener("click", (event) => {
            if (!event.target.closest(".profile-menu")) {
                profileDropdown.hidden = true;
                profileMenuButton.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                profileDropdown.hidden = true;
                profileMenuButton.setAttribute("aria-expanded", "false");
            }
        });
    }

    if (languageField && window.JobBoardI18n) {
        languageField.value = window.JobBoardI18n.getLanguage();
        languageField.addEventListener("change", () => {
            try {
                window.JobBoardI18n.setLanguage(languageField.value);
            } catch (error) {
                console.error("Impossible de changer la langue :", error);
                showFeedback(profileFeedback, "Impossible d’enregistrer la langue choisie.", true);
            }
        });
    }

    await loadProfile();
    if (user) {
        try {
            await loadDocuments();
        } catch (error) {
            console.error("Impossible de charger les documents du profil :", error);
            showFeedback(documentsFeedback, error.message, true);
        }
    }
});
