const jobs = [
{
id: 1,
title: "Développeur Web Junior",
company: "TechCorp"
},
{
id: 2,
title: "Développeur PHP",
company: "WebSolutions"
},
{
id: 3,
title: "Développeur JavaScript",
company: "Digital Factory"
},
{
id: 4,
title: "Développeur Full Stack",
company: "StartupLab"
}
];

const params = new URLSearchParams(window.location.search);
const jobId = Number(params.get("job"));

const jobTitle = document.getElementById("jobTitle");
const form = document.getElementById("applicationForm");
const formMessage = document.getElementById("formMessage");

const job = jobs.find(function (item) {
return item.id === jobId;
});

if (!job) {
jobTitle.textContent = "Cette offre n'existe pas.";
form.style.display = "none";
} else {
jobTitle.textContent = job.title + " - " + job.company;
}

form.addEventListener("submit", function (event) {
event.preventDefault();


if (!job) {
    return;
}

const application = {
    id: Date.now(),
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    message: document.getElementById("message").value.trim(),
    status: "pending"
};

const applications =
    JSON.parse(localStorage.getItem("applications")) || [];

applications.push(application);

localStorage.setItem(
    "applications",
    JSON.stringify(applications)
);

form.reset();

formMessage.textContent =
    "Votre candidature a bien été envoyée.";

formMessage.style.color = "#198754";

});
