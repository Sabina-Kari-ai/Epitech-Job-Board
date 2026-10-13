async function displayCompanies() {
    const list = document.getElementById('companies-list');
    try {
        const response = await fetch('/api/companies/');
        const companies = await response.json();
        if (!response.ok || !Array.isArray(companies)) throw new Error();
        list.replaceChildren();
        for (const company of companies) {
            const card = document.createElement('article'); card.className = 'company-card'; card.id = 'company-' + company.id;
            const logo = document.createElement('div'); logo.className = 'company-card-logo'; logo.textContent = company.name.charAt(0);
            const content = document.createElement('div'); content.className = 'company-card-content';
            for (const [tag, text, cls] of [['h2',company.name,''], ['p',company.location,'company-location'], ['p',company.description,''], ['span',company.jobs + ' offre(s) disponible(s)','']]) {
                const element = document.createElement(tag); element.textContent = text; element.className = cls; content.appendChild(element);
            }
            const link = document.createElement('a'); link.className = 'btn btn-outline'; link.textContent = 'Voir les offres';
            link.href = 'index.html?company=' + encodeURIComponent(company.name) + '#jobs';
            card.append(logo,content,link); list.appendChild(card);
        }
        if (!companies.length) list.textContent = 'Aucune entreprise disponible.';
        if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    } catch { list.textContent = 'Impossible de charger les entreprises. Vérifiez le serveur et la base de données.'; }
}
displayCompanies();
