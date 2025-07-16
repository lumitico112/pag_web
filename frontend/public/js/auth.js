// Sistema de autenticación global - auth.js

class AuthSystem {
    constructor() {
        this.sessionKey = 'utptravel_session';
        this.init();
    }
    
    init() {
        // Verificar sesión al cargar la página
        this.checkSession();
        // Actualizar navbar
        this.updateNavbar();
        // Iniciar verificación periódica
        this.startPeriodicCheck();
    }
    
    // Obtener sesión activa
    getSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        
        if (sessionData) {
            const session = JSON.parse(sessionData);
            // Verificar si la sesión no ha expirado (24 horas)
            const currentTime = new Date().getTime();
            const sessionAge = currentTime - session.login_time;
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (sessionAge < maxAge) {
                return session;
            } else {
                // Sesión expirada
                this.clearSession();
            }
        }
        return null;
    }
    
    // Verificar si hay sesión activa
    isAuthenticated() {
        return this.getSession() !== null;
    }
    
    // Obtener rol del usuario
    getUserRole() {
        const session = this.getSession();
        return session ? session.role : null;
    }
    
    // Obtener datos del usuario
    getUserData() {
        const session = this.getSession();
        return session ? {
            usuario_id: session.usuario_id,
            nombre: session.nombre,
            dni: session.dni || '',
            email: session.email,
            telefono: session.telefono || '',
            role: session.role
        } : null;
    }
    
    // Limpiar sesión
    clearSession() {
        localStorage.removeItem(this.sessionKey);
    }
    
    // Cerrar sesión
    logout() {
        this.clearSession();
        window.location.href = 'login.html';
    }
    
    // Verificar sesión y redirigir si es necesario
    checkSession() {
        const currentPage = window.location.pathname.split('/').pop();
        const session = this.getSession();
        
        // Páginas que requieren autenticación
        const protectedPages = ['dashboard.html', 'admin-dashboard.html', 'perfil.html', 'historial.html', 'reserva_1.html', 'reserva_2.html', 'reserva_3.html', 'reserva_4.html', 'reserva_5.html', 'reserva_6.html'];
        
        // Páginas que no deben ser accesibles si ya hay sesión
        const publicPages = ['login.html', 'signup.html'];
        
        if (protectedPages.includes(currentPage) && !session) {
            // Página protegida sin sesión - redirigir a login
            window.location.href = 'login.html';
        } else if (publicPages.includes(currentPage) && session) {
            // Usuario ya logueado intentando acceder a login/registro
            this.redirectByRole(session.role); // Cambiado de session.rol a session.role
        }
    }
    
    // Redirigir según rol
    redirectByRole(role) { // Cambiado de rol a role
        switch(role) {
            case 'admin':
            case 'trabajador':
                window.location.href = 'dashboard.html';
                break;
            case 'usuario':
            default:
                window.location.href = 'index.html';
                break;
        }
    }
    
    // Actualizar navbar según estado de autenticación
    updateNavbar() {
        // No actualizar navbar en páginas admin (tienen su propio navbar)
        if (window.location.pathname.includes('admin-dashboard.html')) {
            return;
        }
        
        const session = this.getSession();
        const navbarNav = document.querySelector('.navbar-nav');
        
        if (!navbarNav) return;
        
        // Buscar elementos existentes
        let loginItem = null;
        const loginLinks = navbarNav.querySelectorAll('a[href="login.html"]');
        if (loginLinks.length > 0) {
            loginItem = loginLinks[0].closest('li');
        }
        let userMenuItems = navbarNav.querySelectorAll('.user-menu-item');
        
        if (session) {
            // Usuario autenticado - solo ocultar login y mostrar sidebar
            this.hideNavbarLoginElements();
            this.showUserSidebar(session);
            
            // Eliminar cualquier menú de usuario del navbar (no queremos info de usuario en navbar)
            userMenuItems.forEach(item => item.remove());
            
        } else {
            // Usuario no autenticado - mostrar login y ocultar sidebar
            this.showNavbarLoginElements();
            this.hideUserSidebar();
            
            // Eliminar menú de usuario
            userMenuItems.forEach(item => item.remove());
        }
    }

    // Ocultar elementos de login del navbar
    hideNavbarLoginElements() {
        const navbarNav = document.querySelector('.navbar-nav');
        if (!navbarNav) return;
        
        // Ocultar "Iniciar Sesión"
        const loginItem = navbarNav.querySelector('a[href="login.html"]')?.closest('li');
        if (loginItem) loginItem.style.display = 'none';
        
        // Ocultar otros elementos que no deberían aparecer cuando está logueado
        const signupLink = navbarNav.querySelector('a[href="signup.html"]')?.closest('li');
        if (signupLink) signupLink.style.display = 'none';
    }

    // Mostrar elementos de login del navbar
    showNavbarLoginElements() {
        const navbarNav = document.querySelector('.navbar-nav');
        if (!navbarNav) return;
        
        // Mostrar "Iniciar Sesión"
        const loginItem = navbarNav.querySelector('a[href="login.html"]')?.closest('li');
        if (loginItem) loginItem.style.display = 'block';
        
        // Mostrar registro si existe
        const signupLink = navbarNav.querySelector('a[href="signup.html"]')?.closest('li');
        if (signupLink) signupLink.style.display = 'block';
    }

    // Mostrar sidebar de usuario
    showUserSidebar(session) {
        const userSidebar = document.getElementById('userSidebar');
        const sidebarUserName = document.getElementById('sidebarUserName');
        
        if (userSidebar) {
            userSidebar.style.display = 'flex';
            
            if (sidebarUserName) {
                sidebarUserName.textContent = session.nombre || session.email?.split('@')[0] || 'Usuario';
            }
            
            // Ajustar el margen del contenido principal para el sidebar
            this.adjustMainContentForSidebar(true);
        }
    }

    // Ocultar sidebar de usuario
    hideUserSidebar() {
        const userSidebar = document.getElementById('userSidebar');
        
        if (userSidebar) {
            userSidebar.style.display = 'none';
            
            // Restaurar el margen del contenido principal
            this.adjustMainContentForSidebar(false);
        }
    }

    // Ajustar contenido principal para el sidebar
    adjustMainContentForSidebar(show) {
        const body = document.body;
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        const footer = document.querySelector('footer');
        
        if (show) {
            // Agregar margen izquierdo para el sidebar
            if (header) header.style.marginLeft = '220px';
            if (main) main.style.marginLeft = '220px';
            if (footer) footer.style.marginLeft = '220px';
        } else {
            // Remover margen izquierdo
            if (header) header.style.marginLeft = '0';
            if (main) main.style.marginLeft = '0';
            if (footer) footer.style.marginLeft = '0';
        }
    }
    
    // Crear menú de usuario
    createUserMenu(navbarNav, session) {
        // Menú dropdown de usuario
        const userDropdown = document.createElement('li');
        userDropdown.className = 'nav-item dropdown user-menu-item';
        userDropdown.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-user"></i> ${session.nombre || session.email.split('@')[0]}
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="perfil.html"><i class="fas fa-user-edit"></i> Mi Perfil</a></li>
                <li><a class="dropdown-item" href="historial.html"><i class="fas fa-history"></i> Mis Viajes</a></li>
                <li><a class="dropdown-item" href="comprar.html"><i class="fas fa-ticket-alt"></i> Comprar Pasajes</a></li>
                ${session.role === 'admin' || session.role === 'trabajador' ? 
                    '<li><hr class="dropdown-divider"></li><li><a class="dropdown-item" href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Panel de Control</a></li>' : ''}
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" onclick="auth.logout()"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a></li>
            </ul>
        `;
        
        navbarNav.appendChild(userDropdown);
    }
    
    // Realizar petición autenticada
    async authenticatedFetch(url, options = {}) {
        const session = this.getSession();
        if (!session) {
            throw new Error('No hay sesión activa');
        }
        // Depuración: mostrar el token en consola
        console.log('Token enviado en Authorization:', session.token);
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
            ...options.headers
        };
        
        return fetch(url, {
            ...options,
            headers
        });
    }
    
    // Verificar estado del usuario en el servidor
    async verifyUserStatus() {
        const session = this.getSession();
        if (!session) return true;
        try {
            const response = await fetch(`${API_BASE_URL}/users.php?verify_status=true`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 403) {
                this.clearSession();
                alert('Su cuenta ha sido desactivada. Será redirigido al inicio.');
                window.location.href = 'index.html';
                return false;
            }
            const data = await response.json();
            let backendRole = undefined;
            if (data.usuario) {
                if (data.usuario.role !== undefined) backendRole = data.usuario.role;
                else if (data.usuario.rol !== undefined) backendRole = data.usuario.rol;
            }
            if (backendRole !== undefined && backendRole !== session.role) {
                session.role = backendRole;
                localStorage.setItem(this.sessionKey, JSON.stringify(session));
                alert(`Su rol ha sido actualizado a: ${backendRole}. La página se recargará.`);
                window.location.reload();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error verificando estado del usuario:', error);
            return true;
        }
    }
    
    // Iniciar verificación periódica del estado del usuario
    startPeriodicCheck() {
        // Verificar cada 5 minutos
        setInterval(() => {
            this.verifyUserStatus();
        }, 5 * 60 * 1000);
        
        // Verificar inmediatamente
        this.verifyUserStatus();
    }

    // Actualizar datos del usuario en la sesión y localStorage
    setUserData(datos) {
        const session = this.getSession() || {};
        if (datos.usuario_id) session.usuario_id = datos.usuario_id;
        if (datos.id) session.usuario_id = datos.id; // compatibilidad
        if (datos.nombre) session.nombre = datos.nombre;
        if (datos.dni) session.dni = datos.dni;
        if (datos.email) session.email = datos.email;
        if (datos.telefono) session.telefono = datos.telefono;
        if (datos.role) session.role = datos.role;
        if (datos.rol) session.role = datos.rol; // compatibilidad
        // Mantener el token y login_time si existen
        if (!session.login_time) session.login_time = new Date().getTime();
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }
}

// Crear instancia global
window.auth = new AuthSystem(); // Usar solo window.auth, eliminar const auth

// Función auxiliar para compatibilidad
function getCurrentUser() {
    return window.auth.getUserData();
}

// Función global para verificar acceso por rol
function requireRole(requiredRoles) {
    const userRole = window.auth.getUserRole();
    if (!userRole || !requiredRoles.includes(userRole)) {
        alert('No tienes permisos para acceder a esta sección');
        window.auth.redirectByRole(userRole || 'usuario');
        return false;
    }
    return true;
}

// Función para mostrar/ocultar elementos según rol
function showForRoles(elementId, allowedRoles) {
    const element = document.getElementById(elementId);
    const userRole = window.auth.getUserRole();
    if (element) {
        if (userRole && allowedRoles.includes(userRole)) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }
}

// Evento personalizado para cuando el sidebar esté listo
// (No crear otra instancia de AuthSystem aquí)
document.addEventListener('sidebarLoaded', () => {
    if (window.auth) {
        window.auth.updateNavbar();
    }
});
