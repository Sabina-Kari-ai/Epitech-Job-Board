USE job_board;

INSERT INTO companies (name, location, description) VALUES
(
'Tech Solutions',
'Paris',
'Entreprise spécialisée dans le développement de solutions numériques.'
),
(
'Digital Services',
'Lyon',
'Entreprise spécialisée dans les services numériques et les applications web.'
),
(
'Innovation Agency',
'Paris',
'Agence spécialisée dans les projets web et les nouvelles technologies.'
),
(
'Web Business',
'Lille',
'Entreprise spécialisée dans la création et le développement de sites web.'
),
(
'France Numérique',
'Paris',
'Entreprise spécialisée dans les services numériques et le développement web.'
),
(
'Future Systems',
'Lyon',
'Entreprise spécialisée dans les solutions logicielles.'
);

INSERT INTO jobs (
company_id,
title,
location,
contract_type,
salary,
short_description,
description,
cover_letter_required
) VALUES
(
1,
'Développeur Web Full Stack',
'Paris',
'CDI',
'40k - 50k',
'Nous recherchons un développeur web full stack pour rejoindre notre équipe.',
'Vous participerez au développement d''applications web modernes, de la conception jusqu''à la mise en production.',
FALSE
),
(
2,
'Backend Developer PHP',
'Lyon',
'CDI',
'38k - 48k',
'Rejoignez notre équipe backend pour développer des applications PHP.',
'Vous développerez et maintiendrez des applications backend avec PHP, MySQL et les technologies web associées.',
FALSE
),
(
3,
'Stage Développeur JavaScript',
'Paris',
'Stage',
'800 - 1000 €/mois',
'Une opportunité de stage pour découvrir le développement JavaScript.',
'Vous participerez au développement d''interfaces web et découvrirez les bonnes pratiques du développement JavaScript.',
FALSE
),
(
4,
'Développeur Frontend',
'Lille',
'Alternance',
'1200 €/mois',
'Nous recherchons un développeur frontend en alternance.',
'Vous travaillerez sur la création et l''amélioration d''interfaces web modernes et responsives.',
FALSE
),
(
5,
'Intégrateur Web',
'Paris',
'CDD',
'32k - 38k',
'Rejoignez notre équipe en tant qu''intégrateur web.',
'Vous intégrerez des maquettes et développerez des interfaces web accessibles et responsives.',
TRUE
),
(
6,
'Ingénieur Logiciel',
'Lyon',
'CDI',
'45k - 55k',
'Nous recherchons un ingénieur logiciel pour renforcer notre équipe.',
'Vous participerez à la conception, au développement et à l''amélioration de solutions logicielles.',
FALSE
);

INSERT INTO applications (
job_id,
candidate_name,
candidate_email,
candidate_phone,
message,
cover_letter,
status
) VALUES
(
1,
'Jean Dupont',
'[jean.dupont@email.com](mailto:jean.dupont@email.com)',
'0601020304',
'Je souhaite rejoindre votre équipe et participer à vos projets web.',
NULL,
'pending'
),
(
2,
'Marie Martin',
'[marie.martin@email.com](mailto:marie.martin@email.com)',
'0611223344',
'Mon expérience en PHP et MySQL correspond aux compétences recherchées.',
NULL,
'reviewing'
),
(
3,
'Lucas Bernard',
'[lucas.bernard@email.com](mailto:lucas.bernard@email.com)',
'0622334455',
'Je souhaite effectuer mon stage au sein de votre agence.',
NULL,
'accepted'
);
