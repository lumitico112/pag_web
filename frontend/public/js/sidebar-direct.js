// Sistema de sidebar simplificado para debugging
console.log('=== SISTEMA DE SIDEBAR SIMPLIFICADO ===');

// Función para mostrar sidebar directamente
function showUserSidebarDirect() {
    console.log('Ejecutando showUserSidebarDirect...');
    
    // Verificar si existe la sesión
    const sessionData = localStorage.getItem('utptravel_session');
    console.log('Datos de sesión:', sessionData);
    
    if (!sessionData) {
        console.log('No hay sesión, no mostrar sidebar');
        return;
    }
    
    const session = JSON.parse(sessionData);
    console.log('Sesión encontrada:', session);
    
    // Buscar elementos del sidebar
    const sidebar = document.getElementById('userSidebar');
    const sidebarName = document.getElementById('sidebarUserName');
    
    console.log('Elementos encontrados:');
    console.log('- Sidebar:', sidebar);
    console.log('- SidebarName:', sidebarName);
    
    if (sidebar) {
        // Mostrar sidebar
        sidebar.style.display = 'flex';
        sidebar.style.visibility = 'visible';
        sidebar.style.opacity = '1';
        console.log('Sidebar mostrado');
        
        // Establecer nombre
        if (sidebarName) {
            sidebarName.textContent = session.nombre || 'Usuario';
            console.log('Nombre establecido:', sidebarName.textContent);
        }
        
        // Ajustar contenido principal
        const elements = ['header', 'main', 'footer'];
        elements.forEach(tag => {
            const element = document.querySelector(tag);
            if (element) {
                element.style.marginLeft = '220px';
                element.style.transition = 'margin-left 0.3s ease';
                console.log(`Margen aplicado a ${tag}`);
            }
        });
        
        // Ocultar botón de login
        const loginLinks = document.querySelectorAll('a[href="login.html"]');
        loginLinks.forEach(link => {
            const li = link.closest('li');
            if (li) {
                li.style.display = 'none';
                console.log('Botón de login ocultado');
            }
        });
        
        console.log('Sidebar configurado correctamente');
    } else {
        console.error('No se encontró el elemento sidebar');
    }
}

// Función para intentar cargar y mostrar el sidebar múltiples veces
function initSidebarSystem() {
    console.log('Iniciando sistema de sidebar...');
    
    // Intentar inmediatamente
    showUserSidebarDirect();
    
    // Intentar cada 500ms hasta 10 veces
    let attempts = 0;
    const maxAttempts = 10;
    
    const interval = setInterval(() => {
        attempts++;
        console.log(`Intento ${attempts} de mostrar sidebar...`);
        
        const sidebar = document.getElementById('userSidebar');
        if (sidebar && sidebar.style.display === 'flex') {
            console.log('Sidebar ya está mostrado, deteniendo intentos');
            clearInterval(interval);
            return;
        }
        
        showUserSidebarDirect();
        
        if (attempts >= maxAttempts) {
            console.log('Máximo número de intentos alcanzado');
            clearInterval(interval);
        }
    }, 500);
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarSystem);
} else {
    initSidebarSystem();
}

// También ejecutar cuando se dispare el evento de sidebar cargado
document.addEventListener('sidebarLoaded', () => {
    console.log('Evento sidebarLoaded recibido en sidebar-direct');
    setTimeout(showUserSidebarDirect, 100);
});

console.log('=== SISTEMA DE SIDEBAR SIMPLIFICADO CONFIGURADO ===');
