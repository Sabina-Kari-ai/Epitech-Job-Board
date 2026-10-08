const jobs = [
    {
        id: 1,
        title: "Développeur Web Full Stack",
        company: "Tech Solutions",
        location: "Paris",
        type: "CDI",
        salary: "40k - 50k",
        description: "Nous recherchons un développeur web full stack pour rejoindre notre équipe.",
        fullDescription: "Vous participerez au développement d'applications web modernes, de la conception jusqu'à la mise en production.",
        requirements: [
            "HTML / CSS",
            "JavaScript",
            "PHP",
            "MySQL",
            "Git",
            "Travail en équipe"
        ]
    },
    {
        id: 2,
        title: "Backend Developer PHP",
        company: "Digital Services",
        location: "Lyon",
        type: "CDI",
        salary: "38k - 48k",
        description: "Rejoignez notre équipe backend pour développer des applications PHP.",
        fullDescription: "Vous développerez et maintiendrez des applications backend avec PHP, MySQL et les technologies web associées.",
        requirements: [
            "PHP",
            "MySQL",
            "API REST",
            "JavaScript",
            "Git"
        ]
    },
    {
        id: 3,
        title: "Stage Développeur JavaScript",
        company: "Innovation Agency",
        location: "Paris",
        type: "Stage",
        salary: "800 - 1000 €/mois",
        description: "Une opportunité de stage pour découvrir le développement JavaScript.",
        fullDescription: "Vous participerez au développement d'interfaces web et découvrirez les bonnes pratiques du développement JavaScript.",
        requirements: [
            "JavaScript",
            "HTML / CSS",
            "Git",
            "Responsive design",
            "Travail en équipe"
        ]
    },
    {
        id: 4,
        title: "Développeur Frontend",
        company: "Web Business",
        location: "Lille",
        type: "Alternance",
        salary: "1200 €/mois",
        description: "Nous recherchons un développeur frontend en alternance.",
        fullDescription: "Vous travaillerez sur la création et l'amélioration d'interfaces web modernes et responsives.",
        requirements: [
            "HTML / CSS",
            "JavaScript",
            "Responsive design",
            "Git",
            "Bases de design UI"
        ]
    },
    {
        id: 5,
        title: "Intégrateur Web",
        company: "France Numérique",
        location: "Paris",
        type: "CDD",
        salary: "32k - 38k",
        description: "Rejoignez notre équipe en tant qu'intégrateur web.",
        fullDescription: "Vous intégrerez des maquettes et développerez des interfaces web accessibles et responsives.",
        requirements: [
            "HTML / CSS",
            "JavaScript",
            "Responsive design",
            "Accessibilité web",
            "Git"
        ]
    },
    {
        id: 6,
        title: "Ingénieur Logiciel",
        company: "Future Systems",
        location: "Lyon",
        type: "CDI",
        salary: "45k - 55k",
        description: "Nous recherchons un ingénieur logiciel pour renforcer notre équipe.",
        fullDescription: "Vous participerez à la conception, au développement et à l'amélioration de solutions logicielles.",
        requirements: [
            "Programmation",
            "Bases de données",
            "API REST",
            "Git",
            "Travail en équipe"
        ]
    }
];

const jobDetail = document.getElementById("jobDetail");

const urlParams = new URLSearchParams(window.location.search);
const jobId = Number(urlParams.get("id"));

const job = jobs.find(function (item) {
    return item.id === jobId;
});

if (!job) {
    jobDetail.innerHTML = `
        <div class="job-not-found">
            <h1>Offre introuvable</h1>
            <p>Cette offre n'existe pas ou n'est plus disponible.</p>
            <a href="index.html" class="details-button">
                Retour aux offres
            </a>
        </div>
    `;
} else {
    jobDetail.innerHTML = `
        <div class="job-detail-header">

            <span class="job-type">
                ${job.type}
            </span>

            <h1>${job.title}</h1>

            <p class="job-company">
                ${job.company}
            </p>

            <p class="job-location">
                ${job.location} · ${job.salary}
            </p>

        </div>

        <div class="job-detail-content">

            <section>
                <h2>Description du poste</h2>

                <p>
                    ${job.fullDescription}
                </p>
            </section>

            <section class="job-requirements">
                <h2>Profil recherché</h2>

                <ul>
                    ${job.requirements.map(function (requirement) {
                        return `<li>${requirement}</li>`;
                    }).join("")}
                </ul>
            </section>

        </div>

        <div class="job-apply">

            <div>
                <h2>Cette offre vous intéresse ?</h2>

                <p>
                    Envoyez votre candidature directement depuis JobBoard.
                </p>
            </div>

            <a
                href="apply.html?id=${job.id}"
                class="details-button"
            >
                Postuler à cette offre
            </a>

        </div>
    `;
}