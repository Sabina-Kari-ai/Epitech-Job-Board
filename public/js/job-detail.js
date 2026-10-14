(async () => {
    const target = document.getElementById('jobDetail');
    const id = Number(new URLSearchParams(window.location.search).get('id'));
    const element = (tag, text, cls = '') => { const el = document.createElement(tag); el.textContent = text; el.className = cls; return el; };
    try {
        if (!Number.isInteger(id) || id < 1) throw new Error('Offre introuvable.');
        const response = await fetch('/api/jobs/?id=' + id, { signal: AbortSignal.timeout(10000) }); const job = await response.json();
        if (!response.ok) throw new Error(job.error || 'Offre introuvable.');
        target.replaceChildren();
        const header = element('div', '', 'job-detail-header');
        header.append(element('span',job.contract_type,'job-type'), element('h1',job.title), element('p',job.company,'job-company'),element('p',[job.location,job.salary].filter(Boolean).join(' · '),'job-location'));
        const content = element('div','','job-detail-content');
        for(const [title, value] of [['Description du poste',job.description],['Compétences',job.skills],['Missions',job.missions],['Profil recherché',job.profile],['Avantages',job.benefits],['Temps de travail',job.working_time],['Date limite',job.application_deadline]]) {
            if(!value) continue; const section = element('section','','job-requirements'); section.append(element('h2',title),element('p',value)); content.appendChild(section);
        }
        const apply = element('div','','job-apply'); const link = element('a','Postuler à cette offre','details-button'); link.href = 'apply.html?id=' + id; apply.appendChild(link);
        target.append(header,content,apply);
    } catch(error) { target.replaceChildren(element('h1',error.message),element('p',"Cette offre n'est pas disponible. Réessayez depuis la liste des offres.")); }
})();
