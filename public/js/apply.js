const API_URL = "http://127.0.0.1:8001/api/jobs/";
const APPLICATIONS_API_URL = "http://127.0.0.1:8001/api/app/";

const params = new URLSearchParams(window.location.search);
const jobId = Number(params.get("id") || params.get("job"));

const jobTitle = document.getElementById("jobTitle");
const form = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");

let selectedJob = null;

async function loadJob() {
if (!jobTitle || !form) {
return;
}


form.style.display = "none";
jobTitle.textContent = "Chargement de l'offre...";

if (!jobId || !Number.isFinite(jobId)) {
    jobTitle.textContent = "Aucune offre sélectionnée.";
    return;
}

try {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error("Erreur HTTP " + response.status);
    }

    const jobs = await response.json();

    if (!Array.isArray(jobs)) {
        throw new Error("Format des offres invalide.");
    }

    selectedJob = jobs.find(function (job) {
        return Number(job.id) === jobId;
    });

    if (!selectedJob) {
        jobTitle.textContent = "Cette offre n'existe pas.";
        return;
    }

    jobTitle.textContent =
        selectedJob.title + " chez " + selectedJob.company;

    form.style.display = "block";
} catch (error) {
    console.error("Erreur lors du chargement de l'offre :", error);
    jobTitle.textContent =
        "Impossible de charger l'offre. Vérifiez que le serveur API est démarré.";
}


}

if (form) {
form.addEventListener("submit", function (event) {
event.preventDefault();


    if (!selectedJob) {
        formMessage.textContent = "Aucune offre valide n'est sélectionnée.";
        formMessage.className = "form-message error";
        return;
    }

    const application = {
        id: Date.now(),
        jobId: Number(selectedJob.id),
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        message: document.getElementById("message").value.trim(),
        status: "pending",
        createdAt: new Date().toISOString()
    };

    if (
        !application.name ||
        !application.email ||
        !application.phone ||
        !application.message
    ) {
        formMessage.textContent = "Veuillez remplir tous les champs.";
        formMessage.className = "form-message error";
        return;
    }

    try {
        const applications = JSON.parse(
            localStorage.getItem("applications") || "[]"
        );

        if (!Array.isArray(applications)) {
            throw new Error("Les candidatures enregistrées sont invalides.");
        }

        applications.push(application);

        localStorage.setItem(
            "applications",
            JSON.stringify(applications)
        );

        form.reset();

        formMessage.textContent =
            "Votre candidature a bien été enregistrée.";

        formMessage.className = "form-message success";
    } catch (error) {
        console.error("Erreur lors de l'enregistrement :", error);

        formMessage.textContent =
            "Impossible d'enregistrer la candidature dans ce navigateur.";

        formMessage.className = "form-message error";
    }
});


}

loadJob();