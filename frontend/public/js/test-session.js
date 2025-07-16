// Script temporal para crear una sesión de prueba y forzar la aparición del sidebar
console.log('=== INICIANDO SCRIPT DE PRUEBA SIMPLIFICADO ===');

// Crear sesión de prueba
const testSession = {
    token: 'test-token-123',
    usuario_id: 1,
    email: 'test@utptravel.com',
    rol: 'usuario',
    nombre: 'Usuario de Prueba',
    login_time: new Date().getTime()
};

// Limpiar sesiones existentes y crear nueva
localStorage.removeItem('utptravel_session');
localStorage.removeItem('token');
localStorage.removeItem('user');

localStorage.setItem('utptravel_session', JSON.stringify(testSession));
console.log('Sesión de prueba creada:', testSession);

// Función para forzar mostrar sidebar
function forceShowSidebar() {
    console.log('=== FORZANDO MOSTRAR SIDEBAR ===');
    
    const sidebar = document.getElementById('userSidebar');
    console.log('Sidebar encontrado:', sidebar);
    
    if (sidebar) {
        // Forzar mostrar
        sidebar.classList.add('show');
        sidebar.classList.remove('hide');
        sidebar.style.display = 'flex';
        sidebar.style.transform = 'translateX(0)';
        
        // Actualizar nombre
        const sidebarName = document.getElementById('sidebarUserName');
        if (sidebarName) {
            sidebarName.textContent = 'Usuario de Prueba';
        }
        
        // Ajustar contenido principal
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        const footer = document.querySelector('footer');
        
        if (header) header.style.marginLeft = '220px';
        if (main) main.style.marginLeft = '220px';
        if (footer) footer.style.marginLeft = '220px';
        
        // Ocultar botón de login
        const loginLinks = document.querySelectorAll('a[href="login.html"]');
        loginLinks.forEach(link => {
            const listItem = link.closest('li');
            if (listItem) {
                listItem.style.display = 'none';
            }
        });
        
        console.log('✅ Sidebar mostrado forzadamente');
        return true;
    } else {
        console.log('❌ Sidebar no encontrado');
        return false;
    }
}

// Intentar mostrar el sidebar múltiples veces
let attempts = 0;
const maxAttempts = 10;

function tryShowSidebar() {
    attempts++;
    console.log(`Intento ${attempts} de mostrar sidebar...`);
    
    if (forceShowSidebar()) {
        console.log('✅ Sidebar mostrado exitosamente');
        return;
    }
    
    if (attempts < maxAttempts) {
        setTimeout(tryShowSidebar, 500);
    } else {
        console.log('❌ No se pudo mostrar el sidebar después de', maxAttempts, 'intentos');
    }
}

// Empezar a intentar después de un momento
setTimeout(tryShowSidebar, 100);

// Escuchar eventos
document.addEventListener('sidebarLoaded', () => {
    console.log('Evento sidebarLoaded recibido');
    setTimeout(forceShowSidebar, 100);
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM listo');
    setTimeout(tryShowSidebar, 200);
});

console.log('=== SCRIPT DE PRUEBA SIMPLIFICADO CONFIGURADO ===');
