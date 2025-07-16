// Crear sesión de usuario normal para probar
const userSession = {
    token: 'user-token-123',
    usuario_id: 2,
    email: 'usuario@utptravel.com',
    rol: 'usuario',
    nombre: 'Juan Pérez',
    login_time: new Date().getTime()
};

localStorage.setItem('utptravel_session', JSON.stringify(userSession));
console.log('Sesión de usuario normal creada');

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
