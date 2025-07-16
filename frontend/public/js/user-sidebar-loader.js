// Cargar el sidebar de usuario en todas las páginas

// Función para generar HTML del sidebar según el rol del usuario
function getSidebarHTML(session) {
    const isAdmin = session.role === 'admin' || session.role === 'trabajador'; // Cambiado de session.rol a session.role
    
    if (isAdmin) {
        // Sidebar para admin/trabajador - sin compras ni historial
        return `
<aside id="userSidebar" class="user-sidebar">
  <div class="user-sidebar-header">
    <i class="fas fa-user-circle fa-3x"></i>
    <div id="sidebarUserName">Usuario</div>
  </div>
  <ul class="user-sidebar-links">
    <li><a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
    <li><a href="perfil.html"><i class="fas fa-user-edit"></i> Mi Perfil</a></li>
    <li><a href="#" id="sidebarLogout"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a></li>
  </ul>
</aside>
        `;
    } else {
        // Sidebar para usuario normal
        return `
<aside id="userSidebar" class="user-sidebar">
  <div class="user-sidebar-header">
    <i class="fas fa-user-circle fa-3x"></i>
    <div id="sidebarUserName">Usuario</div>
  </div>
  <ul class="user-sidebar-links">
    <li><a href="perfil.html"><i class="fas fa-user-edit"></i> Mi Perfil</a></li>
    <li><a href="historial.html"><i class="fas fa-history"></i> Historial</a></li>
    <li><a href="comprar.html"><i class="fas fa-ticket-alt"></i> Comprar Pasajes</a></li>
    <li><a href="#" id="sidebarLogout"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a></li>
  </ul>
</aside>
        `;
    }
}

// Función para cargar el sidebar
function loadUserSidebar() {
    const container = document.getElementById('userSidebarContainer');
    
    if (container) {
        // Obtener sesión para determinar el tipo de sidebar
        const sessionData = localStorage.getItem('utptravel_session');
        // Obtener datos de usuario desde auth
        let session = null;
        if (window.auth && typeof auth.getUserData === 'function') {
            session = auth.getUserData();
        }
        // Generar HTML del sidebar según el rol
        const sidebarHTML = getSidebarHTML(session || { role: 'usuario' });
        container.innerHTML = sidebarHTML;
        
        // Inicializar eventos del sidebar después de cargarlo
        setTimeout(() => {
            if (typeof initializeSidebar === 'function') {
                initializeSidebar();
            }
            
            // Disparar evento personalizado
            document.dispatchEvent(new CustomEvent('sidebarLoaded'));
            
            // Verificar si hay sesión y mostrar sidebar
            checkSessionAndShowSidebar();
        }, 100);
        
    } else {
        // Intentar nuevamente después de un momento
        setTimeout(loadUserSidebar, 500);
    }
}

// Función para verificar sesión y mostrar sidebar
function checkSessionAndShowSidebar() {
    const sessionData = localStorage.getItem('utptravel_session');
    
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            
            // Regenerar el sidebar con el rol correcto
            const container = document.getElementById('userSidebarContainer');
            if (container) {
                const sidebarHTML = getSidebarHTML(session);
                container.innerHTML = sidebarHTML;
                
                // Reinicializar eventos
                if (typeof initializeSidebar === 'function') {
                    initializeSidebar();
                }
            }
            
            const sidebar = document.getElementById('userSidebar');
            const sidebarName = document.getElementById('sidebarUserName');
            if (sidebar) {
                sidebar.classList.add('show');
                sidebar.classList.remove('hide');
                if (sidebarName) {
                    sidebarName.textContent = session && (session.nombre || session.email?.split('@')[0]) || 'Usuario';
                }
                // Ajustar contenido principal
                adjustMainContent(true);
            }
        } catch (e) {
            console.error('Error parseando sesión:', e);
        }
    } else {
        const sidebar = document.getElementById('userSidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
            sidebar.classList.add('hide');
            adjustMainContent(false);
        }
    }
}

// Función para ajustar contenido principal
function adjustMainContent(show) {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    
    const marginLeft = show ? '220px' : '0';
    
    if (header) header.style.marginLeft = marginLeft;
    if (main) main.style.marginLeft = marginLeft;
    if (footer) footer.style.marginLeft = marginLeft;
}

// Cargar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserSidebar);
} else {
    loadUserSidebar();
}

// Escuchar cambios en localStorage para actualizar sidebar
window.addEventListener('storage', (e) => {
    if (e.key === 'utptravel_session') {
        checkSessionAndShowSidebar();
    }
});
