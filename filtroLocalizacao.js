// Função para filtrar perfis
function filterProfiles() {
    // Obtém os valores dos filtros
    const locationFilter = document.getElementById('locationSelect').value;
    const nameFilter = document.getElementById('nameSearch').value.toLowerCase();
    const emailFilter = document.getElementById('emailSearch').value.toLowerCase();

    // Obtém todos os perfis
    const profiles = document.querySelectorAll('.profile-card');

    // Itera sobre todos os perfis e aplica os filtros
    profiles.forEach(profile => {
        // Obtém os dados de cada perfil
        const profileLocation = profile.getAttribute('data-location').toLowerCase();
        const profileName = profile.querySelector('h5').innerText.toLowerCase();
        const profileEmail = profile.querySelector('p').innerText.toLowerCase();

        // Verifica se o perfil atende aos critérios
        const matchesLocation = locationFilter === 'all' || profileLocation.includes(locationFilter.toLowerCase());
        const matchesName = profileName.includes(nameFilter);
        const matchesEmail = profileEmail.includes(emailFilter);

        // Exibe ou oculta o perfil
        if (matchesLocation && matchesName && matchesEmail) {
            profile.style.display = 'block';  // Exibe o perfil
        } else {
            profile.style.display = 'none';   // Oculta o perfil
        }
    });
}


document.getElementById("resultCount").innerText = `${visibleProfiles.length} perfil(s) encontrado(s)`;

