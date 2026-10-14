(() => {
    const STORAGE_KEY = "jobboard_language";
    const translations = {
        "Mon compte": "My account",
        "Mon compte - JobBoard": "My account - JobBoard",
        "Mes informations": "My information",
        "Adresse email": "Email address",
        "Gérez votre profil, votre CV, votre mot de passe et vos alertes.": "Manage your profile, CV, password and job alerts.",
        "Ces informations sont utilisées dans votre espace candidat.": "This information is used in your candidate account.",
        "Compte candidat JobBoard": "JobBoard candidate account",
        "Mon CV et lettre de motivation": "My CV and cover letter",
        "Ajoutez votre CV au format PDF pour faciliter vos candidatures.": "Add your PDF CV to simplify your applications.",
        "Aucun CV enregistré.": "No saved CV.",
        "Fichier PDF": "PDF file",
        "Format accepté : PDF.": "Accepted format: PDF.",
        "Ajouter ou remplacer mon CV": "Add or replace my CV",
        "Supprimer mon CV": "Remove my CV",
        "Lettre de motivation PDF": "PDF cover letter",
        "PDF, 5 Mo maximum.": "PDF, maximum 5 MB.",
        "Enregistrer le PDF": "Save PDF",
        "Retirer le PDF": "Remove PDF",
        "Prévisualiser le PDF": "Preview PDF",
        "Prévisualiser mon CV": "Preview my CV",
        "Prévisualiser ma lettre PDF": "Preview my PDF cover letter",
        "Enregistrer ma lettre": "Save my cover letter",
        "Ce texte préremplit vos candidatures. Vous pouvez l’adapter pour chaque offre.": "This text prefills your applications. You can adapt it for each job.",
        "Ce texte préremplit vos candidatures. Vous pouvez l'adapter pour chaque offre.": "This text prefills your applications. You can adapt it for each job.",
        "Gestion du compte": "Account settings",
        "Modifiez le mot de passe associé à votre compte.": "Change your account password.",
        "Modifier le mot de passe": "Change password",
        "Se déconnecter": "Log out",
        "Déconnectez-vous ou supprimez définitivement votre compte.": "Log out or permanently delete your account.",
        "SÉCURITÉ": "SECURITY",
        "COMPTE": "ACCOUNT",
        "PROFIL": "PROFILE",
        "Mes alertes": "My alerts",
        "Offres correspondant à mes alertes": "Jobs matching my alerts",
        "Offres": "Jobs",
        "Entreprises": "Companies",
        "Mon profil": "My profile",
        "Mes candidatures": "My applications",
        "Déconnexion": "Log out",
        "Connexion": "Log in",
        "Créer un compte": "Create an account",
        "Rechercher": "Search",
        "Réinitialiser": "Reset",
        "Voir l'offre": "View job",
        "Voir mes candidatures": "View my applications",
        "Enregistrer mon profil": "Save my profile",
        "Enregistrer les documents": "Save documents",
        "Retirer": "Remove",
        "MON ESPACE": "MY SPACE",
        "Mon profil | JobBoard": "My profile | JobBoard",
        "Mes alertes emploi | JobBoard": "My job alerts | JobBoard",
        "Mes candidatures - JobBoard": "My applications | JobBoard",
        "Connexion | JobBoard": "Log in | JobBoard",
        "Créer un compte | JobBoard": "Create an account | JobBoard",
        "JobBoard - Entreprises": "JobBoard - Companies",
        "Détail de l'offre - JobBoard": "Job details - JobBoard",
        "JobBoard - Trouvez votre prochain emploi": "JobBoard - Find your next job",
        "Postuler - JobBoard": "Apply - JobBoard",
        "Espace entreprise | JobBoard": "Company space | JobBoard",
        "JobBoard - Administration": "JobBoard - Administration",
        "© 2026 JobBoard. Tous droits réservés.": "© 2026 JobBoard. All rights reserved.",
        "Gérez vos informations personnelles et vos documents de candidature.":
            "Manage your personal information and application documents.",
        "VOTRE IDENTITÉ": "YOUR PROFILE",
        "Informations personnelles": "Personal information",
        "Modifiez votre adresse depuis l’onglet « Compte et sécurité ».": "Change your email address from the Account and security tab.",
        "Prénom": "First name",
        "Nom": "Last name",
        "Adresse e-mail": "Email address",
        "Téléphone": "Phone",
        "Indicatif du pays": "Country calling code",
        "Ville": "City",
        "Profil LinkedIn": "LinkedIn profile",
        "Présentation": "About you",
        "Présentez votre parcours et vos compétences.": "Tell us about your experience and skills.",
        "Langue de l’application": "Application language",
        "Détectée depuis la langue de votre navigateur. Votre choix sera mémorisé sur cet appareil.":
            "Detected from your browser language. Your choice will be saved on this device.",
        "VOS PIÈCES JOINTES": "YOUR DOCUMENTS",
        "Mon CV et ma lettre de motivation": "My CV and cover letter",
        "Mon CV et ma lettre": "My CV and cover letter",
        "Vos fichiers sont enregistrés de manière sécurisée sur JobBoard. Le CV doit être un PDF pour pouvoir être prévisualisé lors d'une candidature. La lettre accepte les formats PDF, DOC et DOCX. Taille maximale : 5 Mo par fichier.":
            "Your files are securely stored on JobBoard. Your CV must be a PDF to preview it when applying. Cover letters can be PDF, DOC or DOCX. Maximum size: 5 MB per file.",
        "Mon CV": "My CV",
        "Ma lettre de motivation": "My cover letter",
        "Documents sélectionnés": "Saved documents",
        "ACTION IRRÉVERSIBLE": "IRREVERSIBLE ACTION",
        "Supprimer mon compte": "Delete my account",
        "Compte et sécurité": "Account and security",
        "SÉCURITÉ DU COMPTE": "ACCOUNT SECURITY",
        "Adresse e-mail et mot de passe": "Email address and password",
        "Changer mon adresse e-mail": "Change my email address",
        "Nouvelle adresse e-mail": "New email address",
        "Mot de passe actuel": "Current password",
        "Modifier mon e-mail": "Update my email",
        "Changer mon mot de passe": "Change my password",
        "Nouveau mot de passe": "New password",
        "Confirmer le nouveau mot de passe": "Confirm new password",
        "Modifier mon mot de passe": "Update my password",
        "Les mots de passe ne correspondent pas.": "The passwords do not match.",
        "Votre adresse e-mail a été modifiée.": "Your email address has been updated.",
        "Votre mot de passe a été modifié.": "Your password has been updated.",
        "Cette adresse e-mail est déjà utilisée.": "This email address is already in use.",
        "Le mot de passe actuel est incorrect.": "The current password is incorrect.",
        "Saisissez une adresse e-mail valide.": "Enter a valid email address.",
        "ACTION IRRÉVERSIBLE": "IRREVERSIBLE ACTION",
        "La suppression efface votre profil, vos documents et vos candidatures. Cette action est définitive.":
            "Deleting your account erases your profile, documents and applications. This action is permanent.",
        "Confirmez avec votre mot de passe": "Confirm with your password",
        "Supprimer définitivement mon compte": "Permanently delete my account",
        "La suppression efface votre profil, vos documents et vos candidatures. Cette action est définitive.":
            "Deleting your account erases your profile, documents and applications. This action is permanent.",
        "Confirmez avec votre mot de passe": "Confirm with your password",
        "Supprimer définitivement mon compte": "Permanently delete my account",
        "Les documents sont stockés sur le serveur et associés à votre compte.":
            "Your documents are stored on the server and linked to your account.",
        "Prévisualisation du CV": "CV preview",
        "Prévisualiser": "Preview",
        "Supprimer": "Delete",
        "VOTRE PARCOURS": "YOUR JOURNEY",
        "Tous droits réservés.": "All rights reserved.",
        "BON RETOUR": "WELCOME BACK",
        "Connectez-vous": "Log in",
        "Connectez-vous pour retrouver vos alertes, candidatures et offres.":
            "Sign in to access your alerts, applications and jobs.",
        "Mot de passe": "Password",
        "Pas encore de compte ?": "Don't have an account yet?",
        "Inscription": "Sign up",
        "Créer mon compte": "Create my account",
        "Trouvez votre prochain": "Find your next",
        "emploi": "job",
        "Découvrez des opportunités professionnelles correspondant à votre profil et postulez simplement.":
            "Discover career opportunities that match your profile and apply with ease.",
        "Métier ou compétence": "Job title or skill",
        "Lieu": "Location",
        "Ex : Développeur web": "e.g. Web developer",
        "Ex : Paris": "e.g. Paris",
        "OPPORTUNITÉS": "OPPORTUNITIES",
        "Offres d'emploi": "Job openings",
        "Recevez des alertes correspondant aux offres que vous recherchez.":
            "Get alerts for jobs that match your search.",
        "Nom de l'alerte": "Alert name",
        "Ex. Développeur web": "e.g. Web developer",
        "Mot-clé ou métier": "Keyword or job title",
        "Ex. JavaScript": "e.g. JavaScript",
        "Tous les contrats": "All employment types",
        "Créer mon alerte": "Create my alert",
        "Mes alertes enregistrées": "My saved alerts",
        "Gérez les alertes que vous avez créées.": "Manage the alerts you have created.",
        "Vous n'avez pas encore créé d'alerte.": "You have not created any alerts yet.",
        "CANDIDATURES": "APPLICATIONS",
        "Retrouvez toutes les offres auxquelles vous avez postulé.":
            "Find all the jobs you have applied to.",
        "REJOIGNEZ JOBBOARD": "JOIN JOBBOARD",
        "Créez votre compte": "Create your account",
        "Choisissez votre espace : candidat ou entreprise.": "Choose your space: candidate or company.",
        "Type de compte": "Account type",
        "Ville de l'entreprise": "Company city",
        "6 caractères minimum.": "At least 6 characters.",
        "Déjà inscrit ?": "Already have an account?",
        "Se connecter": "Log in",
        "DÉTAIL DE L'OFFRE": "JOB DETAILS",
        "Retour aux offres": "Back to jobs",
        "Chargement de l'offre...": "Loading job...",
        "Votre compte entreprise JobBoard est prêt.": "Your JobBoard company account is ready.",
        "ESPACE ENTREPRISE": "COMPANY SPACE",
        "Votre entreprise": "Your company",
        "Découvrez les entreprises": "Discover companies",
        "Explorez les entreprises qui recrutent sur JobBoard.":
            "Explore companies hiring on JobBoard.",
        "E-mail": "Email",
        "Retour au site": "Back to site",
        "ADMINISTRATION": "ADMINISTRATION",
        "Tableau de bord": "Dashboard",
        "Gérez les offres, les entreprises et les candidatures.":
            "Manage jobs, companies and applications.",
        "Candidatures": "Applications",
        "Gérez les offres publiées sur le site.": "Manage jobs published on the site.",
        "Ajouter une offre": "Add a job",
        "Poste": "Position",
        "Actions": "Actions",
        "Gérez les entreprises présentes sur la plateforme.":
            "Manage the companies on the platform.",
        "Ajouter une entreprise": "Add a company",
        "Consultez les candidatures et gérez leur statut.":
            "Review applications and manage their status.",
        "Email": "Email",
        "Gérer la candidature": "Manage application",
        "En attente": "Pending",
        "En cours d'étude": "Under review",
        "Acceptée": "Accepted",
        "Refusée": "Rejected",
        "Titre": "Title",
        "Salaire": "Salary",
        "Description courte": "Short description",
        "Description complète": "Full description",
        "POUR VOUS": "FOR YOU",
        "Filtrer": "Filter",
        "Type de contrat": "Employment type",
        "Tous": "All",
        "Aucune offre trouvée": "No jobs found",
        "Essayez de modifier vos critères de recherche.": "Try changing your search filters.",
        "Chargement des offres...": "Loading jobs...",
        "CANDIDATURE": "APPLICATION",
        "Candidatures envoyées": "Applications sent",
        "Entretiens": "Interviews",
        "Entretien": "Interview",
        "Vous n’avez pas encore envoyé de candidature.": "You have not sent any applications yet.",
        "Aucun entretien n’est planifié pour le moment.": "No interviews are scheduled yet.",
        "Offres correspondant à vos alertes": "Jobs matching your alerts",
        "Les correspondances seront marquées comme vues lorsque vous consultez cette page.":
            "Matching jobs will be marked as viewed when you visit this page.",
        "Aucune offre ne correspond à vos alertes pour le moment.":
            "No jobs match your alerts at the moment.",
        "Impossible de charger les offres correspondantes.":
            "Unable to load matching jobs.",
        "Voir l’offre": "View job",
        "Postuler à une offre": "Apply for a job",
        "Créer une alerte pour cette offre": "Create a job alert for this listing",
        "L’alerte sera enregistrée dans « Mes alertes ».": "The alert will be saved in “My alerts”.",
        "Votre alerte a bien été créée et enregistrée.": "Your alert has been created and saved.",
        "L’alerte associée à cette offre a été supprimée.": "The alert for this listing has been removed.",
        "Vos informations": "Your information",
        "Nom complet": "Full name",
        "Vos documents": "Your documents",
        "Message au recruteur": "Message to the recruiter",
        "Message de candidature": "Application message",
        "Envoyer ma candidature": "Submit application",
        "Aucune description disponible.": "No description available.",
        "ESPACE CANDIDAT": "CANDIDATE SPACE",
        "Suivre mes candidatures": "Track my applications",
        "Stage": "Internship",
        "Alternance": "Apprenticeship",
        "CDI": "Permanent",
        "CDD": "Fixed-term",
        "Aucun document sélectionné.": "No document selected.",
        "Une erreur est survenue.": "Something went wrong.",
        "Français": "French",
        "Entreprises à découvrir": "Companies to discover",
        "Découvrir les entreprises": "Discover companies",
        "Toutes les entreprises": "All companies",
        "Créer une alerte emploi": "Create a job alert",
        "Mes alertes emploi": "My job alerts",
        "Créer une alerte": "Create an alert",
        "Aucune alerte enregistrée.": "No alerts saved.",
        "Modifier": "Edit",
        "Supprimer": "Delete",
        "Enregistrer": "Save",
        "Annuler": "Cancel",
        "Détail de l'offre": "Job details",
        "Description": "Description",
        "Postuler": "Apply",
        "Salaire non précisé": "Salary not specified",
        "Localisation non précisée": "Location not specified",
        "Entreprise non précisée": "Company not specified",
        "Titre non précisé": "Title not specified",
        "Contrat non précisé": "Employment type not specified",
        "Aucune offre sélectionnée.": "No job selected.",
        "Cette offre n'existe pas.": "This job does not exist.",
        "Impossible de charger les offres": "Unable to load jobs",
        "Réessayer": "Try again",
        "Candidature envoyée": "Application submitted",
        "Votre candidature a bien été envoyée.": "Your application was submitted successfully.",
        "Votre profil a été enregistré.": "Your profile has been saved.",
        "Document retiré.": "Document removed.",
        "Impossible de retirer ce document.": "Unable to remove this document.",
        "Sélectionnez au moins un fichier.": "Select at least one file.",
        "Format accepté : PDF, DOC ou DOCX.": "Accepted formats: PDF, DOC or DOCX.",
        "Chaque fichier doit faire 5 Mo maximum.": "Each file must be no larger than 5 MB.",
        "Impossible de charger le profil :": "Unable to load profile:",
        "Prénom, nom et e-mail valides sont requis.": "Valid first name, last name and email are required.",
        "Aucune candidature trouvée.": "No applications found.",
        "Statut": "Status",
        "Date de candidature": "Application date",
        "Nom de l'entreprise": "Company name",
        "À propos de l'entreprise": "About the company",
        "Localisation": "Location",
        "Toutes les offres": "All jobs",
        "Enregistrer les modifications": "Save changes",
        "Nouveau mot de passe": "New password",
        "Confirmer le mot de passe": "Confirm password",
        "Choisissez votre type de compte": "Choose your account type",
        "Nom": "Last name",
        "Prénom": "First name",
        "Mot de passe (6 caractères minimum)": "Password (at least 6 characters)",
        "Tous les champs sont obligatoires.": "All fields are required.",
        "Le recruteur exige une lettre de motivation : joins un fichier ou saisis le texte.":
            "The recruiter requires a cover letter: upload a file or enter the text.",
        "PDF uniquement, 5 Mo maximum. Tu peux aussi saisir ta lettre ci-dessous.":
            "PDF only, up to 5 MB. You can also enter your cover letter below.",
        "Présente ta motivation pour ce poste...": "Tell us why you are interested in this role...",
        "Présente brièvement ta candidature...": "Briefly introduce your application...",
        "PDF uniquement, 5 Mo maximum.": "PDF only, up to 5 MB.",
        "CV (PDF, facultatif)": "CV (PDF, optional)",
        "Lettre de motivation (facultative)": "Cover letter (optional)",
        "Lettre de motivation (obligatoire)": "Cover letter (required)",
        "Texte de la lettre de motivation": "Cover letter text",
        "Le recruteur exige une lettre : joins un PDF ou saisis le texte.":
            "The recruiter requires a cover letter: upload a PDF or enter the text.",
        "Une candidature est nécessaire pour postuler.": "You must be signed in as a candidate to apply."
    };

    const originalText = new WeakMap();
    const originalAttributes = new WeakMap();
    const supportedLanguage = (language) => language === "fr" ? "fr" : "en";

    function preferredLanguage() {
        const browserLanguages = navigator.languages || [navigator.language || "fr"];
        return browserLanguages.some((language) => /^fr(?:-|$)/i.test(language)) ? "fr" : "en";
    }

    function getLanguage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? supportedLanguage(saved) : preferredLanguage();
        } catch (error) {
            console.error("Impossible de lire la langue enregistrée :", error);
            return preferredLanguage();
        }
    }

    function translateValue(value, language) {
        if (language === "fr") return value;
        const normalized = value.replace(/\s+/g, " ").trim();
        const translated = translations[normalized];
        if (!translated) return value;
        const leadingSpace = value.match(/^\s*/)[0];
        const trailingSpace = value.match(/\s*$/)[0];
        return `${leadingSpace}${translated}${trailingSpace}`;
    }

    function translateTextNode(node, language) {
        if (!originalText.has(node)) originalText.set(node, node.nodeValue);
        const translated = translateValue(originalText.get(node), language);
        if (node.nodeValue !== translated) node.nodeValue = translated;
    }

    function translateAttribute(element, attribute, language) {
        if (!originalAttributes.has(element)) originalAttributes.set(element, {});
        const values = originalAttributes.get(element);
        if (!(attribute in values)) values[attribute] = element.getAttribute(attribute);
        const original = values[attribute];
        if (original !== null) {
            const translated = translateValue(original, language);
            if (element.getAttribute(attribute) !== translated) {
                element.setAttribute(attribute, translated);
            }
        }
    }

    function applyLanguage(language) {
        document.documentElement.lang = language;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) translateTextNode(walker.currentNode, language);

        document.querySelectorAll("[placeholder], [aria-label], [title]").forEach((element) => {
            ["placeholder", "aria-label", "title"].forEach((attribute) => {
                if (element.hasAttribute(attribute)) translateAttribute(element, attribute, language);
            });
        });

        const pageTitle = document.title;
        if (!originalAttributes.has(document)) originalAttributes.set(document, {});
        const documentAttributes = originalAttributes.get(document);
        if (!("title" in documentAttributes)) documentAttributes.title = pageTitle;
        document.title = translateValue(documentAttributes.title, language);
        document.dispatchEvent(new CustomEvent("jobboard:languagechange", {
            detail: { language }
        }));
    }

    function setLanguage(language) {
        const selectedLanguage = supportedLanguage(language);
        try {
            localStorage.setItem(STORAGE_KEY, selectedLanguage);
        } catch (error) {
            console.error("Impossible d’enregistrer la langue choisie :", error);
            throw error;
        }
        applyLanguage(selectedLanguage);
    }

    const language = getLanguage();
    applyLanguage(language);
    window.JobBoardI18n = { getLanguage, setLanguage };

    const observer = new MutationObserver((mutations) => {
        const currentLanguage = getLanguage();
        mutations.forEach((mutation) => {
            if (mutation.type === "characterData") {
                translateTextNode(mutation.target, currentLanguage);
                return;
            }
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    translateTextNode(node, currentLanguage);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
                    while (walker.nextNode()) translateTextNode(walker.currentNode, currentLanguage);
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
})();
