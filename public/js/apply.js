const API_URL = "http://127.0.0.1:8001/api/jobs/";
const APPLICATIONS_API_URL = "http://127.0.0.1:8001/api/app/";

const params = new URLSearchParams(window.location.search);
const jobId = Number(params.get("id") || params.get("job"));
const jobTitle = document.getElementById("jobTitle");
const form = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");
const coverLetterField = document.getElementById("coverLetterText");
const coverLetterFile = document.getElementById("cover-letter-file");
const coverLetterLabel = document.getElementById("cover-letter-label");
const coverLetterRequiredMessage = document.getElementById("cover-letter-required");
let selectedJob = null;
let coverLetterRequired = false;

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

async function loadJob() {
    if (!jobTitle || !form) return;

    form.style.display = "none";

    try {
        const user = await window.JobBoardAuth.requireUser();
        if (!user) return;

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
            if (coverLetterRequiredMessage) {
                coverLetterRequiredMessage.hidden = !coverLetterRequired;
            }
            if (coverLetterLabel) {
                coverLetterLabel.textContent = coverLetterRequired
                    ? "Lettre de motivation (obligatoire)"
                    : "Lettre de motivation (facultative)";
            }
        }
        form.style.display = "block";

        document.getElementById("name").value =
            `${user.first_name} ${user.last_name}`.trim();
        document.getElementById("email").value = user.email || "";
        document.getElementById("phone").value = user.phone || "";
    } catch (error) {
        console.error("Erreur lors du chargement de l'offre :", error);
        jobTitle.textContent =
            "Impossible de charger l'offre. Vérifiez que le serveur API est démarré.";
    }
}

if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!selectedJob) {
            showMessage("Aucune offre valide n'est sélectionnée.", true);
            return;
        }

        const selectedCv = document.getElementById("cv").files[0];
        const selectedCoverLetter = coverLetterFile.files[0];
        if (!isAllowedPdf(selectedCv) || !isAllowedPdf(selectedCoverLetter)) {
            showMessage("Les documents doivent être des PDF valides de 5 Mo maximum.", true);
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
            const response = await fetch(APPLICATIONS_API_URL, {
                method: "POST",
                credentials: "include",
                body: application
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || `Erreur HTTP ${response.status}`);
            }

            form.reset();
            showMessage(result.message || "Votre candidature a bien été envoyée.");
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
