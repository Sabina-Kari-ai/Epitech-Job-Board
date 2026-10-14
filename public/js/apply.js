const JOBS_API_URL = "/api/jobs/";
const APPLICATIONS_API_URL = "/api/app/";
const USER_API_URL = "/api/users/me.php";
const LOGOUT_API_URL = "/api/auth/logout.php";

const params =
    new URLSearchParams(
        window.location.search
    );

const jobId =
    Number(
        params.get("id") ||
        params.get("job")
    );

const jobTitle =
    document.getElementById(
        "jobTitle"
    );

const form =
    document.getElementById(
        "applicationForm"
    );

const formMessage =
    document.getElementById(
        "formMessage"
    );

const submitButton =
    document.getElementById(
        "submitButton"
    );

const authActions =
    document.getElementById(
        "authActions"
    );

const coverLetter =
    document.getElementById(
        "coverLetter"
    );

const coverLetterLabel =
    document.getElementById(
        "coverLetterLabel"
    );

const coverLetterHelp =
    document.getElementById(
        "coverLetterHelp"
    );

let selectedJob = null;
let currentUser = null;
document.addEventListener('DOMContentLoaded', async () => {const user=await window.jobBoardUser;if(!user)return;const box=document.createElement('div');box.className='form-group';for(const [type,present,label] of [['cv',user.cv_path,'Prévisualiser mon CV'],['cover_letter',user.cover_letter_path,'Prévisualiser ma lettre PDF']]){if(!present)continue;const a=document.createElement('a');a.href='/api/profile-documents/?type='+type;a.target='_blank';a.rel='noopener';a.textContent=label;a.className='btn btn-outline';box.appendChild(a);}if(user.cover_letter_path){const note=document.createElement('p');note.textContent='Votre lettre PDF enregistrée sera jointe à cette candidature.';box.appendChild(note);document.getElementById('coverLetter').required=false;}form.prepend(box);});


// ========================================
// AUTH NAVIGATION
// ========================================

function renderLoggedOutNavigation() { /* Shared auth-nav.js handles navigation. */ }
function renderLoggedInNavigation() { /* Shared auth-nav.js handles navigation. */ }

// ========================================
// LOGOUT
// ========================================

async function logout() {

    try {

        await fetch(
            LOGOUT_API_URL,
            {
                method: "POST"
            }
        );

    } catch (error) {

        console.error(
            "Erreur pendant la déconnexion :",
            error
        );

    } finally {

        window.location.href =
            "index.html";
    }
}


// ========================================
// LOAD CURRENT USER
// ========================================

async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                USER_API_URL
            );


        if (!response.ok) {

            renderLoggedOutNavigation();

            return;
        }


        const result =
            await response.json();


        if (!result.user) {

            renderLoggedOutNavigation();

            return;
        }


        currentUser = result.user;
        if (coverLetter && !coverLetter.value) coverLetter.value = currentUser.cover_letter || "";
        if (currentUser.account_type !== 'candidate' || currentUser.role === 'admin') {
            window.location.href = 'index.html';
            return;
        }


        renderLoggedInNavigation();


        const fullName =
            (
                (currentUser.firstname || "") +
                " " +
                (currentUser.lastname || "")
            ).trim();


        document.getElementById(
            "name"
        ).value =
            fullName;


        document.getElementById(
            "email"
        ).value =
            currentUser.email || "";


        document.getElementById(
            "phone"
        ).value =
            currentUser.phone || "";

    } catch (error) {

        console.error(
            "Impossible de charger l'utilisateur :",
            error
        );


        renderLoggedOutNavigation();
    }
}


// ========================================
// LOAD JOB
// ========================================

async function loadJob() {

    if (
        !jobTitle ||
        !form
    ) {

        return;
    }


    form.style.display =
        "none";


    jobTitle.textContent =
        "Chargement de l'offre...";


    if (
        !jobId ||
        !Number.isFinite(jobId)
    ) {

        jobTitle.textContent =
            "Aucune offre sélectionnée.";

        return;
    }


    try {

        const response =
            await fetch(
                `${JOBS_API_URL}?id=${jobId}`
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Impossible de charger l'offre."
            );
        }


        selectedJob = result;
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        if (selectedJob.application_deadline && selectedJob.application_deadline < today) {
            jobTitle.textContent = 'La date limite de candidature est dépassée.';
            return;
        }


        jobTitle.textContent =
            selectedJob.title +
            " chez " +
            selectedJob.company;


        const requiresCoverLetter =
            Number(
                selectedJob.cover_letter_required
            ) === 1;


        if (requiresCoverLetter) {

            coverLetter.required = !currentUser?.cover_letter_path &&
                true;


            coverLetterLabel.textContent =
                "Lettre de motivation obligatoire";


            coverLetterHelp.textContent =
                "Cette offre nécessite une lettre de motivation.";

        } else {

            coverLetter.required =
                false;


            coverLetterLabel.textContent =
                "Lettre de motivation (facultative)";


            coverLetterHelp.textContent =
                "Ce champ est facultatif pour cette offre.";
        }


        form.style.display =
            "block";

    } catch (error) {

        console.error(
            "Erreur lors du chargement de l'offre :",
            error
        );


        jobTitle.textContent =
            "Impossible de charger cette offre.";
    }
}


// ========================================
// SUBMIT APPLICATION
// ========================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        formMessage.textContent =
            "";

        formMessage.className =
            "";


        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        if (!selectedJob) {

            formMessage.textContent =
                "Aucune offre valide n'est sélectionnée.";

            formMessage.className =
                "form-message error";

            return;
        }


        const application = {

            job_id:
                Number(
                    selectedJob.id
                ),

            candidate_name:
                document.getElementById(
                    "name"
                ).value.trim(),

            candidate_email:
                document.getElementById(
                    "email"
                ).value.trim(),

            candidate_phone:
                document.getElementById(
                    "phone"
                ).value.trim(),

            message:
                document.getElementById(
                    "message"
                ).value.trim(),

            cover_letter:
                document.getElementById(
                    "coverLetter"
                ).value.trim()
        };


        if (
            !application.candidate_name ||
            !application.candidate_email ||
            !application.candidate_phone ||
            !application.message
        ) {

            formMessage.textContent =
                "Veuillez remplir tous les champs obligatoires.";

            formMessage.className =
                "form-message error";

            return;
        }


        if (
            coverLetter.required &&
            !application.cover_letter && !currentUser?.cover_letter_path
        ) {

            formMessage.textContent =
                "Une lettre de motivation est obligatoire pour cette offre.";

            formMessage.className =
                "form-message error";

            return;
        }


        submitButton.disabled =
            true;

        submitButton.textContent =
            "Envoi en cours...";


        try {

            const response =
                await fetch(
                    APPLICATIONS_API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                application
                            )
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                formMessage.textContent =
                    result.error ||
                    result.message ||
                    "Impossible d'envoyer la candidature.";

                formMessage.className =
                    "form-message error";

                return;
            }


            formMessage.textContent =
                result.message ||
                "Votre candidature a bien été envoyée.";


            formMessage.className =
                "form-message success";


            document.getElementById(
                "message"
            ).value =
                "";


            document.getElementById(
                "coverLetter"
            ).value =
                "";


            setTimeout(
                function () {

                    window.location.href =
                        "app.html";

                },
                1000
            );

        } catch (error) {

            console.error(
                "Erreur lors de l'envoi :",
                error
            );


            formMessage.textContent =
                "Impossible de contacter le serveur.";

            formMessage.className =
                "form-message error";

        } finally {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Envoyer ma candidature";
        }
    }
);


// ========================================
// START
// ========================================

async function start() {

    await Promise.all([
        loadJob(),
        loadCurrentUser()
    ]);
}


start();