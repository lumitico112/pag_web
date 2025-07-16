// Crear sesión de admin para probar
const adminSession = {
    token: 'admin-token-123',
    usuario_id: 1,
    email: 'admin@utptravel.com',
    rol: 'admin',
    nombre: 'Administrador',
    login_time: new Date().getTime()
};

localStorage.setItem('utptravel_session', JSON.stringify(adminSession));
console.log('Sesión de admin creada');

// Forzar actualización
setTimeout(() => {
    if (window.auth) {
        window.auth.updateNavbar();
    }
    // También forzar actualización del sidebar
    if (typeof checkSessionAndShowSidebar === 'function') {
        checkSessionAndShowSidebar();
    }
}, 1000);
