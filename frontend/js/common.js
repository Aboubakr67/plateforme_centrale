// Vérification de l'authentification
function checkAuth() {
    if (!localStorage.getItem('token')) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Fonction pour charger la navigation
async function loadNav(subtitle) {
    try {
        const response = await fetch('components/nav.html');
        const html = await response.text();
        document.querySelector('.container').insertAdjacentHTML('afterbegin', html);
        document.getElementById('pageSubtitle').textContent = subtitle;
    } catch (error) {
        console.error('Erreur lors du chargement de la navigation:', error);
    }
}

// Fonction pour gérer les erreurs de requête
function handleFetchError(error, message = 'Une erreur est survenue') {
    console.error('Erreur:', error);
    alert(message);
}

// Fonction pour vérifier la validité du token
async function verifyToken() {
    try {
        const response = await fetch('http://localhost:5000/verifyToken', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    } catch (error) {
        handleFetchError(error);
        return false;
    }
} 