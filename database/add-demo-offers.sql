-- Select your existing migrated database before running this file.
-- Adds missing demo offers up to six; existing offers and applications are retained.
START TRANSACTION;
INSERT INTO companies (name,location,description)
SELECT 'Tech Solutions','Paris','Solutions numériques et développement web.'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name='Tech Solutions') AND (SELECT COUNT(*) FROM jobs)<6;
INSERT INTO companies (name,location,description)
SELECT 'Digital Services','Lyon','Services numériques et applications web.'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name='Digital Services') AND (SELECT COUNT(*) FROM jobs)<6;
INSERT INTO companies (name,location,description)
SELECT 'France Numérique','Paris','Intégration et services numériques.'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name='France Numérique') AND (SELECT COUNT(*) FROM jobs)<6;

INSERT INTO jobs (company_id,title,location,contract_type,salary,short_description,description,skills,cover_letter_required)
SELECT c.id,'Développeur Web Full Stack','Paris','CDI','40k - 50k €','Développement d’applications web modernes.','Développement frontend et backend au sein d’une équipe technique.','HTML, CSS, JavaScript, PHP, MySQL',0
FROM companies c WHERE c.name='Tech Solutions' AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.company_id=c.id AND j.title='Développeur Web Full Stack') AND (SELECT COUNT(*) FROM jobs)<6 LIMIT 1;
INSERT INTO jobs (company_id,title,location,contract_type,salary,short_description,description,skills,cover_letter_required)
SELECT c.id,'Backend Developer PHP','Lyon','CDI','38k - 48k €','Développement backend avec PHP.','Développement et maintenance des applications backend.','PHP, MySQL, API REST, Git',0
FROM companies c WHERE c.name='Digital Services' AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.company_id=c.id AND j.title='Backend Developer PHP') AND (SELECT COUNT(*) FROM jobs)<6 LIMIT 1;
INSERT INTO jobs (company_id,title,location,contract_type,salary,short_description,description,skills,cover_letter_required)
SELECT c.id,'Intégrateur Web','Paris','CDD','32k - 38k €','Intégration de maquettes web.','Intégration HTML/CSS et amélioration des interfaces.','HTML, CSS, Responsive Design',1
FROM companies c WHERE c.name='France Numérique' AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.company_id=c.id AND j.title='Intégrateur Web') AND (SELECT COUNT(*) FROM jobs)<6 LIMIT 1;
COMMIT;
