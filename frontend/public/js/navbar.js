document.addEventListener('DOMContentLoaded', () => {
    // Usar auth para verificar autenticación y obtener datos
    if (!window.auth || !auth.isAuthenticated()) return;

    const navLinks = document.querySelector('.navbar-nav');
    const sidebar = document.querySelector('.sidebar');

    // Cargar datos del usuario desde auth
    const userData = auth.getUserData() || {};

    // Buscar el enlace de login existente
    const loginLink = navLinks.querySelector('a[href="login.html"]');
    if (loginLink) {
        // Crear nuevo elemento: enlace al perfil con el nombre del usuario
        const userItem = document.createElement('li');
        userItem.className = 'nav-item';

        const userLink = document.createElement('a');
        userLink.className = 'nav-link';
        userLink.href = '../view/perfil.html'; // Ruta a tu perfil
        userLink.innerHTML = `<i class="fas fa-user-circle"></i> ${userData.nombre || 'Usuario'}`;

        // Reemplazar el elemento padre del enlace de login
        const parentLi = loginLink.closest('li');
        parentLi.replaceWith(userItem);
        userItem.appendChild(userLink);
    }

    // Actualizar la sección "Cuenta" del sidebar
    if (sidebar) {
        const cuentaH4 = [...sidebar.querySelectorAll('h4')].find(h => h.textContent.trim() === 'Cuenta');
        if (cuentaH4) {
            const cuentaLinks = cuentaH4.nextElementSibling;
            if (cuentaLinks && cuentaLinks.classList.contains('links')) {
                // Reemplazar el contenido por Perfil y Cerrar Sesión
                cuentaLinks.innerHTML = `
                    <li><span class="material-symbols-outlined">person</span><a href="../view/perfil.html">Perfil</a></li>
                    <li><span class="material-symbols-outlined">shopping_cart</span><a href="../view/historial.html">Historial de Compras</a></li>
                    <li class="logout-link"><span class="material-symbols-outlined">logout</span><a href="#" id="sidebarLogout">Cerrar Sesión</a></li>
                `;
            }
        }
    }

    // Evento de cerrar sesión (usa auth.logout)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('#sidebarLogout');
        if (target) {
            e.preventDefault();
            auth.logout();
        }
    });
});