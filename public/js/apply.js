// Formulaire de candidature (apply.html?id=…). Le candidat doit être connecté :
// ses coordonnées sont pré-remplies et le CV de son profil est chargé automatiquement.

const API_URL = `http://${window.location.hostname}:8001/api/jobs/`;
const APPLICATIONS_API_URL = `http://${window.location.hostname}:8001/api/app/`;
const PROFILE_DOCUMENTS_API_URL = `http://${window.location.hostname}:8001/api/profile-documents/`;

const params = new URLSearchParams(window.location.search);
const jobId = Number(params.get("id") || params.get("job"));
const jobTitle = document.getElementById("jobTitle");
const form = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");
const coverLetterField = document.getElementById("coverLetterText");
const coverLetterFile = document.getElementById("cover-letter-file");
const coverLetterSection = document.getElementById("cover-letter-section");
const coverLetterRequiredMessage = document.getElementById("cover-letter-required");
let selectedJob = null;
let coverLetterRequired = false;
let currentUser = null;
let applicationAlertId = null;
let savedCvFile = null;
let cvPreviewUrl = null;
let cvSavePromise = Promise.resolve(true);

function showMessage(message, isError = false) {
    if (!formMessage) return;
    formMessage.textContent = message;
    formMessage.className = isError ? "form-message error" : "form-message success";
}

function isAllowedPdf(file) {
    return !file || (
        file.size <= 5 * 1024 * 1024 &&
        file.name.toLowerCase().endsWith(".pdf") &&
        (!file.type || file.type === "application/pdf")
    );
}

function setCvStatus(message, isError = false) {
    const status = document.getElementById("cv-file-status");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("error", isError);
}

function showCvPreview(file) {
    const preview = document.getElementById("cv-preview");
    if (!preview) return;
    const frame = preview.querySelector("iframe");
    if (cvPreviewUrl) URL.revokeObjectURL(cvPreviewUrl);
    cvPreviewUrl = null;
    if (!file || file.type !== "application/pdf") {
        frame.removeAttribute("src");
        preview.hidden = true;
        return;
    }
    cvPreviewUrl = URL.createObjectURL(file);
    frame.src = cvPreviewUrl;
    preview.hidden = false;
}

// Récupère le CV du profil pour l'afficher et le joindre sans nouvel envoi.
async function loadSavedCv() {
    const response = await fetch(`${PROFILE_DOCUMENTS_API_URL}?type=cv`, {
        credentials: "include"
    });
    if (response.status === 404) {
        setCvStatus("Aucun CV enregistré. Ajoutez un PDF ici pour prévisualiser et postuler.");
        return;
    }
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Erreur HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const fileName = encodedName
        ? decodeURIComponent(encodedName[1])
        : "mon-cv.pdf";
    if (blob.type !== "application/pdf") {
        throw new Error("Le CV enregistré doit être au format PDF pour être prévisualisé.");
    }
    savedCvFile = new File([blob], fileName, { type: "application/pdf" });
    showCvPreview(savedCvFile);
    setCvStatus(`CV chargé automatiquement depuis votre profil : ${fileName}`);
}

// Un nouveau CV choisi ici remplace aussi celui du profil, pour la prochaine fois.
async function saveCvToProfile(file) {
    const body = new FormData();
    body.append("type", "cv");
    body.append("file", file);
    const response = await fetch(PROFILE_DOCUMENTS_API_URL, {
        method: "POST",
        credentials: "include",
        body
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || `Erreur HTTP ${response.status}`);
    }
    savedCvFile = file;
    setCvStatus(`CV enregistré dans votre profil : ${result.file_name}`);
}

async function loadJob() {
    if (!jobTitle || !form) return;

    form.style.display = "none";

    try {
        currentUser = await window.JobBoardAuth.requireUser();
        if (!currentUser) return;
        try {
            await loadSavedCv();
        } catch (error) {
            console.error("Impossible de charger le CV du profil :", error);
            setCvStatus(error.message, true);
        }

        if (!jobId || !Number.isFinite(jobId)) {
            jobTitle.textContent = "Aucune offre sélectionnée.";
            return;
        }

        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

        const jobs = await response.json();
        if (!Array.isArray(jobs)) throw new Error("Format des offres invalide.");

        selectedJob = jobs.find((job) => Number(job.id) === jobId);
        if (!selectedJob) {
            jobTitle.textContent = "Cette offre n'existe pas.";
            return;
        }

        jobTitle.textContent = `${selectedJob.title} chez ${selectedJob.company}`;
        if (coverLetterField) {
            coverLetterRequired = Number(selectedJob.cover_letter_required) === 1 ||
                selectedJob.cover_letter_required === true;
            if (coverLetterSection) {
                coverLetterSection.hidden = !coverLetterRequired;
            }
            if (coverLetterRequiredMessage) {
                coverLetterRequiredMessage.hidden = true;
            }
        }
        form.style.display = "block";

        document.getElementById("name").value =
            `${currentUser.first_name} ${currentUser.last_name}`.trim();
        document.getElementById("email").value = currentUser.email || "";
        document.getElementById("phone").value = currentUser.phone || "";
    } catch (error) {
        console.error("Erreur lors du chargement de l'offre :", error);
        jobTitle.textContent =
            "Impossible de charger l'offre. Vérifiez que le serveur API est démarré.";
    }
}

const cvInput = document.getElementById("cv");
if (cvInput) {
    cvInput.addEventListener("change", () => {
        const file = cvInput.files[0];
        if (!file) {
            showCvPreview(savedCvFile);
            return;
        }
        if (!isAllowedPdf(file)) {
            showCvPreview(null);
            setCvStatus("Le CV doit être un fichier PDF valide de 5 Mo maximum.", true);
            return;
        }

        showCvPreview(file);
        setCvStatus("Enregistrement du nouveau CV dans votre profil...");
        cvSavePromise = cvSavePromise.then(() => saveCvToProfile(file)).then(
            () => true,
            (error) => {
                console.error("Impossible d'enregistrer le CV dans le profil :", error);
                setCvStatus(
                    `${error.message} Le fichier restera joint à cette candidature uniquement.`,
                    true
                );
                return false;
            }
        );
    });
}

function setApplicationAlertFeedback(message, isError = false) {
    const feedback = document.getElementById("application-alert-feedback");
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.toggle("error", isError);
}

// Propose de créer une alerte sur ce type d'offre après l'envoi de la candidature.
function updateApplicationAlert(enabled) {
    if (!currentUser || !selectedJob || !applicationAlertId) {
        throw new Error("Les informations de la candidature sont indisponibles.");
    }

    const storageKey = `jobboard_alerts_${currentUser.id}`;
    const storedAlerts = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(storedAlerts)) {
        throw new Error("Le format des alertes enregistrées est invalide.");
    }

    const alerts = storedAlerts.filter((alert) => alert.id !== applicationAlertId);
    if (enabled) {
        alerts.unshift({
            id: applicationAlertId,
            title: `Offre : ${selectedJob.title || "Nouvelle offre"}`,
            keyword: selectedJob.title || "",
            location: selectedJob.location || "",
            contract: selectedJob.contract_type || "",
            enabled: true,
            createdAt: new Date().toISOString()
        });
    }

    localStorage.setItem(storageKey, JSON.stringify(alerts));
    document.dispatchEvent(new CustomEvent("jobboard:alerts-changed"));
}

const applicationAlertCheckbox = document.getElementById("application-alert-checkbox");
if (applicationAlertCheckbox) {
    applicationAlertCheckbox.addEventListener("change", () => {
        try {
            updateApplicationAlert(applicationAlertCheckbox.checked);
            setApplicationAlertFeedback(
                applicationAlertCheckbox.checked
                    ? "Votre alerte a bien été créée et enregistrée."
                    : "L’alerte associée à cette offre a été supprimée."
            );
        } catch (error) {
            console.error("Impossible de mettre à jour l’alerte de l’offre :", error);
            applicationAlertCheckbox.checked = !applicationAlertCheckbox.checked;
            setApplicationAlertFeedback(error.message, true);
        }
    });
}

if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!selectedJob) {
            showMessage("Aucune offre valide n'est sélectionnée.", true);
            return;
        }

        const selectedCv = cvInput.files[0] || savedCvFile;
        const selectedCoverLetter = coverLetterFile.files[0];
        if (!selectedCv) {
            showMessage("Un CV PDF est obligatoire pour envoyer votre candidature.", true);
            cvInput.focus();
            return;
        }
        if (!isAllowedPdf(selectedCv) || !isAllowedPdf(selectedCoverLetter)) {
            showMessage("Le CV et la lettre jointe doivent être des PDF valides de 5 Mo maximum.", true);
            return;
        }
        if (
            coverLetterRequired &&
            !coverLetterField.value.trim() &&
            !selectedCoverLetter
        ) {
            showMessage(
                "Le recruteur exige une lettre : joins un PDF ou saisis le texte.",
                true
            );
            coverLetterRequiredMessage.hidden = false;
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');
        const application = new FormData();
        application.append("job_id", selectedJob.id);
        application.append("candidate_name", document.getElementById("name").value.trim());
        application.append("candidate_email", document.getElementById("email").value.trim());
        application.append("candidate_phone", document.getElementById("phone").value.trim());
        application.append("message", document.getElementById("message").value.trim());
        application.append("cover_letter", coverLetterField.value.trim());

        if (selectedCv) application.append("cv", selectedCv);
        if (selectedCoverLetter) {
            application.append("cover_letter_file", selectedCoverLetter);
        }

        submitButton.disabled = true;
        submitButton.textContent = "Envoi en cours...";

        try {
            await cvSavePromise;
            const response = await fetch(APPLICATIONS_API_URL, {
                method: "POST",
                credentials: "include",
                body: application
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || `Erreur HTTP ${response.status}`);
            }

            applicationAlertId = `application-${result.application_id}`;
            const successPanel = document.getElementById("application-success");
            const successMessage = document.getElementById("application-success-message");
            if (successMessage) {
                successMessage.textContent =
                    result.message || "Votre candidature a bien été envoyée.";
            }
            if (applicationAlertCheckbox) applicationAlertCheckbox.checked = false;
            setApplicationAlertFeedback("");
            form.style.display = "none";
            if (successPanel) successPanel.hidden = false;
        } catch (error) {
            console.error("Erreur lors de l'enregistrement :", error);
            showMessage(error.message, true);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Envoyer ma candidature";
        }
    });
}

loadJob();
