// Script rápido para probar el navbar con usuario específico
const testSession = {
    token: 'test-token-123',
    usuario_id: 1,
    email: 'juan.perez@utptravel.com',
    rol: 'usuario',
    nombre: 'Juan Pérez',
    login_time: new Date().getTime()
};

localStorage.setItem('utptravel_session', JSON.stringify(testSession));
console.log('Sesión de prueba creada para Juan Pérez');

// Forzar actualización del auth después de un momento
setTimeout(() => {
    if (window.auth) {
        window.auth.updateNavbar();
    }
}, 1000);
