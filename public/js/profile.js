document.addEventListener("DOMContentLoaded", async () => {
    const profileForm = document.getElementById("profile-form");
    const profileFeedback = document.getElementById("profile-feedback");
    const documentsForm = document.getElementById("documents-form");
    const documentsFeedback = document.getElementById("documents-feedback");
    const documentsList = document.getElementById("documents-list");
    const profileMenuButton = document.querySelector(".profile-menu-button");
    const profileDropdown = document.querySelector(".profile-dropdown");

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx"];
    let user = null;

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
            phone: data.phone,
            city: data.city,
            linkedin: data.linkedin_url,
            bio: data.bio
        };

        Object.entries(values).forEach(([name, value]) => {
            const field = profileForm.elements.namedItem(name);
            if (field) field.value = value || "";
        });
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
            delete values.firstName;
            delete values.lastName;
            delete values.linkedin;

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

    function documentsKey() {
        return `jobboard_document_names_${user.id}`;
    }

    function getDocuments() {
        try {
            const documents = JSON.parse(localStorage.getItem(documentsKey()) || "{}");
            return documents && typeof documents === "object" ? documents : {};
        } catch (error) {
            console.error("Impossible de lire les documents du profil :", error);
            return {};
        }
    }

    function renderDocuments() {
        if (!documentsList || !user) return;
        const documents = getDocuments();
        documentsList.replaceChildren();

        const entries = Object.entries(documents);
        if (entries.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-state";
            empty.textContent = "Aucun document enregistré.";
            documentsList.appendChild(empty);
            return;
        }

        entries.forEach(([key, info]) => {
            const item = document.createElement("article");
            item.className = "document-item";

            const content = document.createElement("div");
            content.className = "document-item-content";
            const title = document.createElement("h3");
            title.textContent = key === "cv" ? "Mon CV" : "Ma lettre de motivation";
            const filename = document.createElement("p");
            filename.textContent = info.name;
            content.append(title, filename);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "delete-document";
            remove.textContent = "Retirer";
            remove.addEventListener("click", () => {
                const updated = getDocuments();
                delete updated[key];
                try {
                    localStorage.setItem(documentsKey(), JSON.stringify(updated));
                    renderDocuments();
                    showFeedback(documentsFeedback, "Document retiré.");
                } catch (error) {
                    showFeedback(documentsFeedback, "Impossible de retirer ce document.", true);
                }
            });

            item.append(content, remove);
            documentsList.appendChild(item);
        });
    }

    if (documentsForm) {
        documentsForm.addEventListener("submit", (event) => {
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
                if (!ALLOWED_EXTENSIONS.includes(extension)) {
                    showFeedback(documentsFeedback, "Format accepté : PDF, DOC ou DOCX.", true);
                    return;
                }
                if (file.size > MAX_FILE_SIZE) {
                    showFeedback(documentsFeedback, "Chaque fichier doit faire 5 Mo maximum.", true);
                    return;
                }
            }

            const documents = getDocuments();
            selected.forEach(([key, input]) => {
                const file = input.files[0];
                documents[key] = { name: file.name, size: file.size };
            });

            try {
                localStorage.setItem(documentsKey(), JSON.stringify(documents));
                renderDocuments();
                documentsForm.reset();
                showFeedback(
                    documentsFeedback,
                    "Noms enregistrés dans ce navigateur. Les fichiers ne sont pas envoyés au serveur."
                );
            } catch (error) {
                showFeedback(documentsFeedback, "Impossible d'enregistrer ces documents.", true);
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

    await loadProfile();
});
