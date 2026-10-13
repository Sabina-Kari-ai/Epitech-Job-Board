const API_URL = "http://127.0.0.1:8001/api/jobs/";
const APPLICATIONS_API_URL = "http://127.0.0.1:8001/api/app/";

const params = new URLSearchParams(window.location.search);
const jobId = Number(params.get("id") || params.get("job"));
const jobTitle = document.getElementById("jobTitle");
const form = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");
const coverLetterField = document.getElementById("coverLetterText");
let selectedJob = null;

function showMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.className = isError ? "form-message error" : "form-message success";
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
            const required = Number(selectedJob.cover_letter_required) === 1 ||
                selectedJob.cover_letter_required === true;
            coverLetterField.required = required;
            coverLetterField.previousElementSibling.textContent = required
                ? "Lettre de motivation (obligatoire)"
                : "Lettre de motivation (facultatif)";
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

        const submitButton = form.querySelector('[type="submit"]');
        const application = new FormData();
        application.append("job_id", selectedJob.id);
        application.append("candidate_name", document.getElementById("name").value.trim());
        application.append("candidate_email", document.getElementById("email").value.trim());
        application.append("candidate_phone", document.getElementById("phone").value.trim());
        application.append("message", document.getElementById("message").value.trim());
        application.append("cover_letter", coverLetterField.value.trim());

        const cvFile = document.getElementById("cv").files[0];
        if (cvFile) application.append("cv", cvFile);

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
